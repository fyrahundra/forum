export function validateImageFile(file: File) {
	// Kontrollera filtyp
	const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
	// Hur kollar du file.type?
	if (!allowedTypes.includes(file.type)) {
		throw new Error('Invalid file type');
	}

	// Kontrollera filstorlek (t.ex. max 5MB)
	const maxSize = 5 * 1024 * 1024; // 5MB in bytes
	// Hur kollar du file.size?
	if (file.size > maxSize) {
		throw new Error('File size exceeds the maximum limit');
	}

	// Kontrollera filnamn för säkerhet
	// Inga ".." eller "/" i namnet
	if (file.name.includes('..') || file.name.includes('/')) {
		throw new Error('Invalid file name');
	}

	// Returnera true/false eller throw error
	return true;
}
