import { isWithinInterval, parseISO } from "date-fns";
import type {
  User,
  DateRange,
  ProgressCallback,
  ChallengeAnalysis,
  PowerUpTransaction,
  ExtendedDateRange,
  PowerUpPageResult,
  SyncadApiParams,
} from "../types/hive";
import { formatUTC, formatForHafahApi } from "../utils/dateFormatters";

// Cuentas a ignorar (bots y cuentas del sistema)
const IGNORED_ACCOUNTS = new Set([
  "hivebuzz",
  "hive.blog",
  "peakd",
  "ecency",
  "blocktrades",
  "buildawhale",
  "appreciator",
  "curangel",
  "ocdb",
  "leo.voter",
  "steemcleaners",
  "spaminator",
  "cheetah",
]);

// Extensiones de imagen válidas
const VALID_IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
  ".svg",
  ".avif",
  ".tiff",
  ".tif",
  ".ico",
]);

// Dominios de confianza para imágenes (no requieren extensión específica)
const TRUSTED_IMAGE_DOMAINS = new Set([
  "cdn.liketu.com",
  "images.ecency.com",
  "images.hive.blog",
  "cdn.steemitimages.com",
  "files.peakd.com",
  "static.peakd.com",
]);

// Función para validar si una URL es una imagen válida
function isValidImageUrl(url: string): boolean {
  try {
    // Verificar que sea una URL válida
    const urlObj = new URL(url);

    // Verificar si es un dominio de confianza (Liketu, Ecency, etc.)
    if (TRUSTED_IMAGE_DOMAINS.has(urlObj.hostname.toLowerCase())) {
      return true;
    }

    // Extraer la extensión del pathname
    const pathname = urlObj.pathname.toLowerCase();
    const lastDotIndex = pathname.lastIndexOf(".");

    if (lastDotIndex === -1) {
      return false; // No hay extensión
    }

    const extension = pathname.substring(lastDotIndex);

    // Verificar si la extensión está en la lista de extensiones válidas
    return VALID_IMAGE_EXTENSIONS.has(extension);
  } catch (error) {
    // Si no es una URL válida, retornar falso
    console.warn(`⚠️ URL inválida: ${url}`, error);
    return false;
  }
}

// Función para filtrar y validar imágenes en un array
function getValidImages(images: string[]): string[] {
  if (!Array.isArray(images)) {
    return [];
  }

  const validImages = images.filter((img) => {
    if (typeof img !== "string" || img.trim() === "") {
      return false;
    }

    const isValid = isValidImageUrl(img.trim());
    if (!isValid) {
      console.log(`🚫 Imagen inválida descartada: ${img}`);
    } else {
      console.log(`✅ Imagen válida: ${img}`);
    }

    return isValid;
  });

  return validImages;
}

// Interfaces para la respuesta de la API de Syncad
interface SyncadOperationValue {
  readonly to_account: string;
  readonly from_account: string;
  readonly hive_vested?: {
    readonly amount: string;
    readonly precision: number;
    readonly nai: string;
  };
  readonly vesting_shares_received?: {
    readonly amount: string;
    readonly precision: number;
    readonly nai: string;
  };
}

interface SyncadOperationData {
  readonly type: string;
  readonly value: SyncadOperationValue;
}

interface SyncadOperation {
  readonly block: number;
  readonly trx_id: string;
  readonly op_pos: number;
  readonly op_type_id: number;
  readonly timestamp: string;
  readonly virtual_op: boolean;
  readonly operation_id: string;
  readonly trx_in_block: number;
  readonly op: SyncadOperationData;
}

interface SyncadResponse {
  readonly total_operations: number;
  readonly total_pages: number;
  readonly operations_result: SyncadOperation[];
  readonly block_range: {
    readonly from: number;
    readonly to: number;
  };
}

// Tipos para errores específicos
class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly endpoint?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

class NetworkError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = "NetworkError";
  }
}
const enum OperationType {
  TRANSFER_TO_VESTING = 77,
}

const enum ApiConfig {
  MAX_PAGES = 50,
  PAGE_SIZE = 100,
  DATA_SIZE_LIMIT = 200000,
  MARGIN_HOURS = 10, // Margen de seguridad en horas antes/después del rango
}

interface PowerUpResult {
  readonly hasPowerUp: boolean;
  readonly powerUpDate?: string;
  readonly powerUpAmount?: string;
  readonly powerUpTxId?: string;
  readonly powerUpTransactions?: PowerUpTransaction[]; // Todos los power ups encontrados
  readonly totalPowerUp?: string; // Suma total
}

/**
 * Calcula el rango de fechas extendido con margen de seguridad para la API.
 */
const calculateExtendedDateRange = (
  dateRange: DateRange
): ExtendedDateRange => {
  const marginMs = ApiConfig.MARGIN_HOURS * 60 * 60 * 1000;
  const fromBlockDate = new Date(dateRange.startDate.getTime() - marginMs);
  const toBlockDate = new Date(dateRange.endDate.getTime() + marginMs);

  return {
    fromBlock: formatForHafahApi(fromBlockDate),
    toBlock: formatForHafahApi(toBlockDate),
    fromBlockDate,
    toBlockDate,
  };
};

/**
 * Construye los parámetros de la URL para la API de Syncad.
 */
const buildSyncadApiParams = (
  username: string,
  extendedRange: ExtendedDateRange
): SyncadApiParams => {
  const baseParams = `participation-mode=all&operation-types=${
    OperationType.TRANSFER_TO_VESTING
  }&page-size=${ApiConfig.PAGE_SIZE}&data-size-limit=${
    ApiConfig.DATA_SIZE_LIMIT
  }&from-block=${encodeURIComponent(
    extendedRange.fromBlock
  )}&to-block=${encodeURIComponent(extendedRange.toBlock)}`;

  const baseUrl = `https://api.syncad.com/hafah-api/accounts/${username}/operations?${baseParams}`;

  return { baseUrl, baseParams };
};

/**
 * Obtiene el número total de páginas disponibles para un usuario.
 */
const fetchTotalPages = async (
  username: string,
  apiParams: SyncadApiParams
): Promise<number> => {
  console.log(`📡 Obteniendo información de paginación para ${username}...`);

  const response = await fetch(apiParams.baseUrl);
  if (!response.ok) {
    throw new ApiError(
      `Error HTTP: ${response.status}`,
      response.status,
      apiParams.baseUrl
    );
  }

  const data: SyncadResponse = await response.json();
  console.log(`📄 Total de páginas disponibles: ${data.total_pages}`);

  return data.total_pages;
};

/**
 * Procesa una operación individual de transfer_to_vesting.
 */
const processOperation = (
  operation: SyncadOperation,
  dateRange: DateRange,
  extendedRange: ExtendedDateRange,
  username: string,
  processedTxIds: Set<string>
): PowerUpTransaction | null => {
  if (operation.op_type_id !== OperationType.TRANSFER_TO_VESTING) {
    return null;
  }

  const timestampUTC = operation.timestamp.endsWith("Z")
    ? operation.timestamp
    : operation.timestamp + "Z";
  const opDate = parseISO(timestampUTC);

  const formattedOpDate = formatUTC(opDate, "yyyy-MM-dd HH:mm:ss 'UTC'");
  const amount = operation.op.value.hive_vested?.amount || "N/A";
  const amountValue = parseFloat(amount) / 1000;
  const amountFormatted = amountValue.toFixed(3);

  // Early exit: operación anterior al rango extendido
  if (opDate < extendedRange.fromBlockDate) {
    console.log(
      `⏸️ ${username} - Operación anterior al rango extendido encontrada (${formattedOpDate}).`
    );
    return null;
  }

  // Validar que esté dentro del rango exacto
  if (
    !isWithinInterval(opDate, {
      start: dateRange.startDate,
      end: dateRange.endDate,
    })
  ) {
    return null;
  }

  // Verificar duplicados
  if (processedTxIds.has(operation.trx_id)) {
    console.log(
      `⚠️ ${username} - Transaction duplicada ignorada: ${operation.trx_id}`
    );
    return null;
  }

  console.log(`⚡ ${username} - Power Up encontrado:`, {
    fecha: formattedOpDate,
    fechaISO: opDate.toISOString(),
    unix: opDate.getTime(),
    monto: `${amountFormatted} HIVE`,
    txId: operation.trx_id,
  });

  processedTxIds.add(operation.trx_id);

  return {
    date: formattedOpDate,
    amount: amountFormatted,
    txId: operation.trx_id,
  };
};

/**
 * Procesa una página de operaciones de la API.
 */
const processPowerUpPage = async (
  username: string,
  pageNumber: number,
  totalPages: number,
  apiParams: SyncadApiParams,
  dateRange: DateRange,
  extendedRange: ExtendedDateRange,
  processedTxIds: Set<string>
): Promise<PowerUpPageResult> => {
  const pageParam = pageNumber === 1 ? "" : `&page=${pageNumber}`;
  const url = `${apiParams.baseUrl.split("?")[0]}?${apiParams.baseParams}${pageParam}`;

  console.log(
    `📡 ⬅️ Consultando página ${pageNumber}/${totalPages} (navegando hacia atrás) para ${username}...`
  );

  const response = await fetch(url);
  if (!response.ok) {
    throw new ApiError(`Error HTTP: ${response.status}`, response.status, url);
  }

  const data: SyncadResponse = await response.json();
  console.log(
    `📊 Página ${pageNumber}/${totalPages}: ${data.operations_result.length} operaciones encontradas para ${username}`
  );

  const validPowerUps: PowerUpTransaction[] = [];
  let shouldContinue = true;

  for (const operation of data.operations_result) {
    const powerUp = processOperation(
      operation,
      dateRange,
      extendedRange,
      username,
      processedTxIds
    );

    if (powerUp === null && operation.op_type_id === OperationType.TRANSFER_TO_VESTING) {
      const timestampUTC = operation.timestamp.endsWith("Z")
        ? operation.timestamp
        : operation.timestamp + "Z";
      const opDate = parseISO(timestampUTC);

      if (opDate < extendedRange.fromBlockDate) {
        shouldContinue = false;
        break;
      }
    }

    if (powerUp) {
      validPowerUps.push(powerUp);
    }
  }

  return { validPowerUps, shouldContinue };
};

/**
 * Calcula el resultado final basado en las transacciones encontradas.
 */
const calculatePowerUpResult = (
  validPowerUps: PowerUpTransaction[],
  minPowerUp: number,
  username: string,
  dateRange: DateRange
): PowerUpResult => {
  if (validPowerUps.length === 0) {
    console.log(
      `🚫 ${username} - No se encontró Power Up en el rango especificado`
    );
    return { hasPowerUp: false };
  }

  const totalAmount = validPowerUps.reduce((sum, pu) => {
    return sum + parseFloat(pu.amount);
  }, 0);

  console.log(
    `✅ ${username} - ${
      validPowerUps.length
    } Power Up(s) encontrado(s). Total: ${totalAmount.toFixed(3)} HIVE`
  );
  console.log(
    `📅 Rango: ${formatUTC(
      dateRange.startDate,
      "yyyy-MM-dd HH:mm:ss 'UTC'"
    )} - ${formatUTC(dateRange.endDate, "yyyy-MM-dd HH:mm:ss 'UTC'")}`
  );
  console.log(`💰 Filtro mínimo: ${minPowerUp} HIVE`);

  if (minPowerUp > 0 && totalAmount < minPowerUp) {
    console.log(
      `❌ ${username} - Total de ${totalAmount.toFixed(
        3
      )} HIVE es menor al mínimo requerido (${minPowerUp} HIVE)`
    );
    return { hasPowerUp: false };
  }

  console.log(`✅ ${username} - Power Up VÁLIDO! Total cumple el mínimo.`);

  return {
    hasPowerUp: true,
    powerUpDate: validPowerUps[0].date,
    powerUpAmount: validPowerUps[0].amount,
    powerUpTxId: validPowerUps[0].txId,
    powerUpTransactions: validPowerUps,
    totalPowerUp: totalAmount.toFixed(3),
  };
};

/**
 * Verifica si un usuario hizo power up en el rango de fechas usando la API de Syncad.
 *
 * @param username - Nombre de usuario de Hive
 * @param dateRange - Rango de fechas exacto para verificar
 * @param minPowerUp - Cantidad mínima de HIVE requerida (default: 0)
 * @returns Resultado con información del Power Up si se encontró
 */
async function hasPowerUpInRange(
  username: string,
  dateRange: DateRange,
  minPowerUp: number = 0
): Promise<PowerUpResult> {
  try {
    console.log(
      `🔍 Verificando power up para ${username} usando API Syncad...`
    );
    console.log(`📅 Rango de búsqueda UTC (exacto):`, {
      start: dateRange.startDate.toISOString(),
      end: dateRange.endDate.toISOString(),
      startUnix: dateRange.startDate.getTime(),
      endUnix: dateRange.endDate.getTime(),
    });

    const extendedRange = calculateExtendedDateRange(dateRange);
    console.log(`🔎 Rango API con margen de ${ApiConfig.MARGIN_HOURS}h:`, {
      fromBlock: extendedRange.fromBlock,
      toBlock: extendedRange.toBlock,
      margin: `±${ApiConfig.MARGIN_HOURS} horas`,
    });

    const apiParams = buildSyncadApiParams(username, extendedRange);
    const totalPages = await fetchTotalPages(username, apiParams);

    console.log(
      `🔄 Comenzando navegación desde la ÚLTIMA página (${totalPages}) hacia la primera`
    );

    const allValidPowerUps: PowerUpTransaction[] = [];
    const processedTxIds = new Set<string>();
    let shouldContinue = true;

    for (
      let currentPage = totalPages;
      currentPage >= 1 && shouldContinue;
      currentPage--
    ) {
      const pageResult = await processPowerUpPage(
        username,
        currentPage,
        totalPages,
        apiParams,
        dateRange,
        extendedRange,
        processedTxIds
      );

      allValidPowerUps.push(...pageResult.validPowerUps);
      shouldContinue = pageResult.shouldContinue;

      if (totalPages - currentPage + 1 > ApiConfig.MAX_PAGES) {
        console.warn(
          `⚠️ Se alcanzó el límite de ${ApiConfig.MAX_PAGES} páginas procesadas para ${username}`
        );
        break;
      }
    }

    console.log(
      `📊 ${username} - Total transacciones únicas procesadas: ${allValidPowerUps.length}`
    );

    return calculatePowerUpResult(
      allValidPowerUps,
      minPowerUp,
      username,
      dateRange
    );
  } catch (err) {
    console.error(`❌ Error consultando API Syncad para ${username}:`, err);
    if (err instanceof ApiError) {
      throw err;
    }
    throw new NetworkError(
      `Error de red consultando API para ${username}`,
      err
    );
  }
}

// Función para obtener comentarios usando dhive
interface CommentMetadata {
  readonly image?: string[];
  readonly [key: string]: unknown;
}

interface HiveComment {
  readonly author: string;
  readonly json_metadata: string;
  readonly [key: string]: unknown;
}

async function getComments(
  author: string,
  permlink: string
): Promise<HiveComment[]> {
  try {
    const { Client } = await import("@hiveio/dhive");
    const client = new Client(["https://api.hive.blog"]);

    console.log(`🔍 Obteniendo comentarios del post usando dhive...`);
    const comments = await client.database.call("get_content_replies", [
      author,
      permlink,
    ]);
    console.log(`📝 ${comments.length} comentarios encontrados`);

    return comments;
  } catch (error) {
    console.error("❌ Error obteniendo comentarios:", error);
    throw error;
  }
}

export async function getChallengeParticipants(
  author: string,
  permlink: string,
  dateRange: DateRange,
  onProgress?: ProgressCallback,
  minPowerUp: number = 10,
  requireImages: boolean = false
): Promise<ChallengeAnalysis> {
  try {
    const comments = await getComments(author, permlink);
    const validUsers: User[] = [];
    const invalidUsers: User[] = [];
    const ignoredUsers: string[] = [];

    console.log(`📝 Analizando ${comments.length} comentarios...`);
    console.log(
      `📅 Rango de fechas: ${formatUTC(
        dateRange.startDate,
        "yyyy-MM-dd HH:mm:ss 'UTC'"
      )} - ${formatUTC(dateRange.endDate, "yyyy-MM-dd HH:mm:ss 'UTC'")}`
    );

    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i];

      if (onProgress) {
        onProgress(i + 1, comments.length);
      }

      // Ignorar cuentas de bots/sistema
      if (IGNORED_ACCOUNTS.has(comment.author.toLowerCase())) {
        console.log(`🤖 ${comment.author} - Cuenta ignorada (bot/sistema)`);
        ignoredUsers.push(comment.author);
        continue;
      }

      try {
        const metadata: CommentMetadata = JSON.parse(
          comment.json_metadata || "{}"
        );
        const { image } = metadata;

        // Validar imágenes: verificar que sean URLs válidas con extensiones de imagen
        const validImages = getValidImages(image || []);
        const hasImages = validImages.length >= 1;
        let hasPowerUp = false;
        let powerUpDate: string | undefined;
        let reason = "";

        // Si requireImages=true, verificar imágenes primero
        if (requireImages && !hasImages) {
          reason = "No incluye imágenes válidas en el comentario";
          console.log(`📷 ${comment.author} - ${reason}`);
          invalidUsers.push({
            name: comment.author,
            images: [],
            hasImages: false,
            hasPowerUp: false,
            reason,
          });
          continue;
        }

        // Si llegamos aquí, o no se requieren imágenes, o sí tiene imágenes
        if (hasImages) {
          console.log(
            `🖼️ ${comment.author} - Comentario con ${
              validImages.length
            } imagen(es) válida(s) de ${(image || []).length} total(es)`
          );
        } else {
          console.log(
            `⚡ ${comment.author} - Sin imágenes, verificando solo Power Up`
          );
        }

        // Verificar si hizo power up en el rango de fechas usando API Syncad
        const powerUpResult = await hasPowerUpInRange(
          comment.author,
          dateRange,
          minPowerUp
        );
        hasPowerUp = powerUpResult.hasPowerUp;
        powerUpDate = powerUpResult.powerUpDate;
        const powerUpAmount = powerUpResult.powerUpAmount;
        const powerUpTxId = powerUpResult.powerUpTxId;
        const powerUpTransactions = powerUpResult.powerUpTransactions;
        const totalPowerUp = powerUpResult.totalPowerUp;

        if (hasPowerUp) {
          console.log(`🎉 ${comment.author} - CUMPLE TODOS LOS REQUISITOS!`);
          validUsers.push({
            name: comment.author,
            images: validImages,
            powerUpDate,
            powerUpAmount,
            powerUpTxId,
            powerUpTransactions,
            totalPowerUp,
            hasImages,
            hasPowerUp: true,
          });
        } else {
          reason = "No hizo Power Up en el rango de fechas";
          console.log(`❌ ${comment.author} - ${reason}`);
          invalidUsers.push({
            name: comment.author,
            images: validImages,
            hasImages,
            hasPowerUp: false,
            reason,
          });
        }
      } catch (e) {
        console.warn(`⚠️ No se pudo parsear metadata de: ${comment.author}`, e);
        invalidUsers.push({
          name: comment.author,
          images: [],
          hasImages: false,
          hasPowerUp: false,
          reason: "Error al parsear metadata del comentario",
        });
      }
    }

    // Deduplicar usuarios: consolidar múltiples comentarios del mismo usuario
    const deduplicateUsers = (users: User[]): User[] => {
      const userMap = new Map<string, User>();

      for (const user of users) {
        const existingUser = userMap.get(user.name);

        if (existingUser) {
          // Usuario ya existe, consolidar información
          const allImages = [...new Set([...existingUser.images, ...user.images])]; // Eliminar imágenes duplicadas
          const commentCount = (existingUser.commentCount || 1) + 1;

          userMap.set(user.name, {
            ...existingUser,
            images: allImages,
            commentCount,
            hasImages: existingUser.hasImages || user.hasImages, // Si alguno tiene imágenes, marcar como true
          });
        } else {
          // Primera vez que vemos este usuario
          userMap.set(user.name, {
            ...user,
            commentCount: 1,
          });
        }
      }

      return Array.from(userMap.values());
    };

    const deduplicatedValidUsers = deduplicateUsers(validUsers);
    const deduplicatedInvalidUsers = deduplicateUsers(invalidUsers);

    // Eliminar duplicados de ignoredUsers
    const uniqueIgnoredUsers = [...new Set(ignoredUsers)];

    const analysis: ChallengeAnalysis = {
      validUsers: deduplicatedValidUsers,
      invalidUsers: deduplicatedInvalidUsers,
      ignoredUsers: uniqueIgnoredUsers,
      totalComments: comments.length,
    };

    console.log(`\n✅ ANÁLISIS COMPLETADO:`);
    console.log(`📊 Total comentarios: ${analysis.totalComments}`);
    console.log(`✅ Usuarios válidos únicos: ${analysis.validUsers.length}`);
    console.log(`❌ Usuarios inválidos únicos: ${analysis.invalidUsers.length}`);
    console.log(`🤖 Cuentas ignoradas: ${analysis.ignoredUsers.length}`);
    console.log(
      `\n👥 Usuarios válidos:`,
      analysis.validUsers.map((u) => `${u.name}${u.commentCount && u.commentCount > 1 ? ` (${u.commentCount} comentarios)` : ''}`)
    );
    console.log(
      `\n❌ Usuarios inválidos:`,
      analysis.invalidUsers.map((u) => `${u.name} (${u.reason})${u.commentCount && u.commentCount > 1 ? ` - ${u.commentCount} comentarios` : ''}`)
    );

    return analysis;
  } catch (error) {
    console.error("❌ Error al llamar a la API:", error);
    throw error;
  }
}
