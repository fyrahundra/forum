import type { RequestHandler } from '@sveltejs/kit';
import { getUser } from '$lib/auth';

// Global array för att hålla aktiva streams
// I en riktig app skulle du använda Redis eller liknande
interface StreamConnection {
	userId: string;
	controller: ReadableStreamDefaultController;
}

export const _activeStreams: StreamConnection[] = [];

export const GET: RequestHandler = async ({ cookies }) => {
	// Din uppgift: Skapa en ReadableStream

	const user = await getUser(cookies);
	if (!user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const stream = new ReadableStream({
		start(controller) {
			// Vad ska hända när stream startar?
			// Tips: Lägg till controller i activeStreams array
			// Tips: Skicka initial data till ny klient
			const connection = {
				userId: user.id,
				controller: controller
			};
			_activeStreams.push(connection);
			const initialData = {
				type: 'connect',
				message: 'Stream connected',
				timestamp: new Date().toISOString()
			};
			controller.enqueue(`data: ${JSON.stringify(initialData)}\n\n`);
		},

		cancel() {
			// Vad ska hända när klient kopplar från?
			// Tips: Ta bort controller från activeStreams
			let index = _activeStreams.findIndex((conn) => conn.controller === this);
			if (index !== -1) {
				_activeStreams.splice(index, 1);
			}
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
	_activeStreams.forEach((connection) => {
		try {
			connection.controller.enqueue(encoder.encode(formattedData));
		} catch (error) {
			console.error('Error broadcasting to client:', error);
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
