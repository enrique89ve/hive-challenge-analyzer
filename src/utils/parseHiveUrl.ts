/**
 * Parsea URLs de Hive (Peakd, Hive.blog, Ecency, etc.) y extrae author y permlink
 */

export interface ParsedPostInfo {
  readonly author: string;
  readonly permlink: string;
  readonly isValid: boolean;
  readonly error?: string;
}

/**
 * Expresiones regulares para diferentes formatos de URLs de Hive
 */
const URL_PATTERNS = [
  // Peakd con categoría: https://peakd.com/spanish/@hiveblocks-es/permlink
  /^https?:\/\/peakd\.com\/[^\/]+\/@([a-z0-9\-\.]+)\/([a-z0-9\-]+)$/i,

  // Peakd sin categoría: https://peakd.com/@hiveblocks-es/permlink
  /^https?:\/\/peakd\.com\/@([a-z0-9\-\.]+)\/([a-z0-9\-]+)$/i,

  // Hive.blog: https://hive.blog/@author/permlink
  /^https?:\/\/hive\.blog\/@([a-z0-9\-\.]+)\/([a-z0-9\-]+)$/i,

  // Ecency: https://ecency.com/@author/permlink
  /^https?:\/\/ecency\.com\/@([a-z0-9\-\.]+)\/([a-z0-9\-]+)$/i,

  // PeakD post directo: https://peakd.com/hive-123456/@author/permlink
  /^https?:\/\/peakd\.com\/hive-\d+\/@([a-z0-9\-\.]+)\/([a-z0-9\-]+)$/i,
];

/**
 * Parsea una URL de Hive y extrae el author y permlink
 * @param url - URL completa del post de Hive
 * @returns Objeto con author, permlink, validez y posible error
 */
export function parseHiveUrl(url: string): ParsedPostInfo {
  // Validar que no esté vacío
  if (!url || typeof url !== "string") {
    return {
      author: "",
      permlink: "",
      isValid: false,
      error: "URL vacía o inválida",
    };
  }

  const trimmedUrl = url.trim();

  // Intentar parsear con cada patrón
  for (const pattern of URL_PATTERNS) {
    const match = trimmedUrl.match(pattern);

    if (match) {
      const author = match[1].toLowerCase();
      const permlink = match[2].toLowerCase();

      // Validar que el author no esté vacío y tenga formato válido
      if (!author || author.length < 3) {
        return {
          author: "",
          permlink: "",
          isValid: false,
          error: "El nombre de usuario debe tener al menos 3 caracteres",
        };
      }

      // Validar que el permlink no esté vacío
      if (!permlink || permlink.length < 3) {
        return {
          author,
          permlink: "",
          isValid: false,
          error: "El permlink debe tener al menos 3 caracteres",
        };
      }

      return {
        author,
        permlink,
        isValid: true,
      };
    }
  }

  // Si no coincide con ningún patrón
  return {
    author: "",
    permlink: "",
    isValid: false,
    error:
      "Formato de URL no reconocido. Use URLs de Peakd, Hive.blog o Ecency",
  };
}

/**
 * Valida si una cadena es una URL de Hive válida
 * @param url - URL a validar
 * @returns true si es válida, false en caso contrario
 */
export function isValidHiveUrl(url: string): boolean {
  const parsed = parseHiveUrl(url);
  return parsed.isValid;
}

/**
 * Construye una URL de Peakd a partir de author y permlink
 * @param author - Nombre de usuario (sin @)
 * @param permlink - Permlink del post
 * @returns URL completa de Peakd
 */
export function buildPeakdUrl(author: string, permlink: string): string {
  const cleanAuthor = author.replace("@", "");
  return `https://peakd.com/@${cleanAuthor}/${permlink}`;
}
