import type { RequestHandler } from '@sveltejs/kit';
import { getUser } from '$lib/auth';
import { encode } from 'punycode';

// Global array för att hålla aktiva streams
// I en riktig app skulle du använda Redis eller liknande
interface StreamConnection {
	userId: string;
	controller: ReadableStreamDefaultController;
	createdAt: Date;
}

export const _activeStreams: StreamConnection[] = [];
const channelStreams = new Map<string, StreamConnection[]>();

export const GET: RequestHandler = async ({ cookies, url }) => {
	// Din uppgift: Skapa en ReadableStream

	const user = await getUser(cookies);
	if (!user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const channel = url.searchParams.get('channel') || 'global';

	let connection: StreamConnection;

	const stream = new ReadableStream({
		start(controller) {
			// Vad ska hända när stream startar?
			// Tips: Lägg till controller i activeStreams array
			// Tips: Skicka initial data till ny klient
			connection = {
				userId: user.id,
				controller: controller,
				createdAt: new Date()
			};
			_activeStreams.push(connection);

			const encoder = new TextEncoder();

			const _heartbeat = setInterval(() => {
				try {
					controller.enqueue(encoder.encode('data: {"type": "ping"}\n\n'));
				} catch (error) {
					clearInterval(_heartbeat);
					removeStream(connection);
				}
			}, 30000);

			// Register to channel
			const streams = channelStreams.get(channel) || [];
			streams.push(connection);
			channelStreams.set(channel, streams);

			const initialData = {
				type: 'connect',
				message: 'Stream connected',
				timestamp: new Date().toISOString()
			};
			controller.enqueue(`data: ${JSON.stringify(initialData)}\n\n`);

			// Broadcast updated channel stats to all clients
			_broadcastChannelStats();
		},

		cancel() {
			// Vad ska hända när klient kopplar från?
			// Tips: Ta bort controller från activeStreams
			removeStream(connection);

			// Remove from channel
			removeStreamFromChannel(channel, connection);

			// Broadcast updated channel stats to all clients
			_broadcastChannelStats();
		}
	});

	// Returnera stream med rätt headers
	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
			// Eventuella CORS headers om nödvändigt
		}
	});
};

// I samma fil eller separat utility
export function _broadcastToAllClients(data: any) {
	const encoder = new TextEncoder();
	const formattedData = `data: ${JSON.stringify(data)}\n\n`;

	// Din uppgift: Loopa genom activeStreams och skicka data
	// Tips: Använd controller.enqueue()
	// Tips: Hantera fel om controller är stängd
	const deadConnections: StreamConnection[] = [];

	_activeStreams.forEach((connection) => {
		try {
			connection.controller.enqueue(encoder.encode(formattedData));
		} catch (error) {
			console.error('Error broadcasting to client:', error);
			deadConnections.push(connection);
		}
	});

	// Remove dead connections
	deadConnections.forEach((deadConn) => {
		const index = _activeStreams.indexOf(deadConn);
		if (index !== -1) {
			_activeStreams.splice(index, 1);
		}
	});
}

// Alternativt: Broadcast till specifika användare
export function _broadcastToUser(userId: string, data: any) {
	// Hur skulle du filtrera streams per användare?
	// Tips: Du behöver spara user info tillsammans med controller
	const encoder = new TextEncoder();
	const formattedData = `data: ${JSON.stringify(data)}\n\n`;

	_activeStreams.forEach((connection) => {
		if (connection.userId === userId) {
			try {
				connection.controller.enqueue(encoder.encode(formattedData));
			} catch (error) {
				console.error('Error broadcasting to user:', error);
			}
		}
	});
}

export function _broadcastToChannel(channelId: string, data: any) {
	const streams = channelStreams.get(channelId) || [];
	const encoder = new TextEncoder();
	const formattedData = `data: ${JSON.stringify(data)}\n\n`;
	const encoded = encoder.encode(formattedData);

	streams.forEach((stream) => {
		try {
			stream.controller.enqueue(encoded);
		} catch (error) {
			// Stream är stängd, ta bort den
			removeStreamFromChannel(channelId, stream);
		}
	});
}

function removeStream(stream: StreamConnection) {
	const index = _activeStreams.indexOf(stream);
	if (index !== -1) {
		_activeStreams.splice(index, 1);
	}
}

function removeStreamFromChannel(channelId: string, stream: StreamConnection) {
	const streams = channelStreams.get(channelId);
	if (streams) {
		const index = streams.indexOf(stream);
		if (index !== -1) {
			streams.splice(index, 1);
		}
		if (streams.length === 0) {
			channelStreams.delete(channelId);
		} else {
			channelStreams.set(channelId, streams);
		}
	}
}

export function _broadcastUserList() {
	const onlineUsers = _activeStreams.map((stream) => stream.userId);

	_broadcastToAllClients({
		type: 'user_list',
		users: onlineUsers
	});
}

export function _broadcastChannelStats() {
	const stats: Record<string, number> = {};

	for (const [channelId, streams] of channelStreams.entries()) {
		if (channelId !== 'global') {
			stats[channelId] = streams.length;
		}
	}

	_broadcastToAllClients({
		type: 'channel_stats',
		stats
	});
}
