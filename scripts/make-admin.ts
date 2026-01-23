import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin() {
	const email = process.argv[2];

	if (!email) {
		console.error('Usage: npm run make-admin <email>');
		process.exit(1);
	}

	const user = await prisma.user.update({
		where: { email },
		data: { role: 'admin' }
	});

	console.log(`✅ ${user.email} (${user.username}) is now an admin`);
	await prisma.$disconnect();
}

makeAdmin().catch((error) => {
	console.error('❌ Error:', error.message);
	process.exit(1);
});
