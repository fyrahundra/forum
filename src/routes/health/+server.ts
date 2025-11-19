export async function GET() {
	try {
		return new Response(
			JSON.stringify({
				status: 'ok',
				timestamp: new Date().toISOString(),
				uptime: process.uptime()
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	} catch (err) {
		return new Response(
			JSON.stringify({
				status: 'error',
				message: String(err),
				timestamp: new Date().toISOString(),
				uptime: process.uptime()
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
}
