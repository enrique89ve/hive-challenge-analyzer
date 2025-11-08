/**
 * Utilidades para formatear fechas en UTC.
 * Evita dependencias de la zona horaria del navegador.
 */

/**
 * Formatea una fecha en UTC según el formato especificado.
 *
 * @param date - La fecha a formatear
 * @param formatStr - El formato deseado. Soporta:
 *   - "yyyy-MM-dd HH:mm:ss 'UTC'" → "2025-09-01 00:00:00 UTC"
 *   - "MMM d, yyyy HH:mm 'UTC'" → "Sep 1, 2025 00:00 UTC"
 * @returns La fecha formateada en UTC
 */
export const formatUTC = (date: Date, formatStr: string): string => {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");
	const hours = String(date.getUTCHours()).padStart(2, "0");
	const minutes = String(date.getUTCMinutes()).padStart(2, "0");
	const seconds = String(date.getUTCSeconds()).padStart(2, "0");

	// Formato: "yyyy-MM-dd HH:mm:ss 'UTC'"
	if (formatStr === "yyyy-MM-dd HH:mm:ss 'UTC'") {
		return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
	}

	// Formato: "MMM d, yyyy HH:mm 'UTC'"
	if (formatStr === "MMM d, yyyy HH:mm 'UTC'") {
		const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		const monthName = months[date.getUTCMonth()];
		const dayNum = date.getUTCDate();
		return `${monthName} ${dayNum}, ${year} ${hours}:${minutes} UTC`;
	}

	return date.toISOString();
};

/**
 * Formatea una fecha para la API HAFAH de Syncad.
 * Formato: YYYY-MM-DD HH:MI:SS (sin sufijo 'UTC')
 *
 * @param date - La fecha a formatear
 * @returns La fecha formateada para la API HAFAH
 */
export const formatForHafahApi = (date: Date): string => {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");
	const hours = String(date.getUTCHours()).padStart(2, "0");
	const minutes = String(date.getUTCMinutes()).padStart(2, "0");
	const seconds = String(date.getUTCSeconds()).padStart(2, "0");

	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Formatea una fecha para inputs de tipo datetime-local.
 * Formato: YYYY-MM-DDTHH:MM
 *
 * @param date - La fecha a formatear
 * @returns La fecha formateada para inputs datetime-local, o string vacío si la fecha es inválida
 */
export const formatDateForInput = (date: Date): string => {
	if (!date || isNaN(date.getTime())) {
		console.warn('Fecha inválida pasada a formatDateForInput:', date);
		return '';
	}

	try {
		const year = date.getUTCFullYear();
		const month = String(date.getUTCMonth() + 1).padStart(2, '0');
		const day = String(date.getUTCDate()).padStart(2, '0');
		const hours = String(date.getUTCHours()).padStart(2, '0');
		const minutes = String(date.getUTCMinutes()).padStart(2, '0');

		return `${year}-${month}-${day}T${hours}:${minutes}`;
	} catch (error) {
		console.error('Error formateando fecha:', error, date);
		return '';
	}
};
