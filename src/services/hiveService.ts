import { isWithinInterval, parseISO } from "date-fns";
import type {
  User,
  DateRange,
  ProgressCallback,
  ChallengeAnalysis,
  PowerUpTransaction,
} from "../types/hive";

// Formatear fecha en UTC sin depender de la zona horaria del navegador
const formatUTC = (date: Date, formatStr: string): string => {
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

  return date.toISOString();
};

// Formatear fecha para la API HAFAH (sin sufijo 'UTC', formato: YYYY-MM-DD HH:MI:SS)
const formatForHafahApi = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

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

// Función para verificar si un usuario hizo power up en el rango de fechas usando la API de Syncad
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

    // Crear rango extendido con márgenes de 10 horas para la API
    const marginMs = ApiConfig.MARGIN_HOURS * 60 * 60 * 1000; // 10 horas en milisegundos
    const fromBlockDate = new Date(dateRange.startDate.getTime() - marginMs);
    const toBlockDate = new Date(dateRange.endDate.getTime() + marginMs);

    const fromBlock = formatForHafahApi(fromBlockDate);
    const toBlock = formatForHafahApi(toBlockDate);

    console.log(`🔎 Rango API con margen de ${ApiConfig.MARGIN_HOURS}h:`, {
      fromBlock,
      toBlock,
      margin: `±${ApiConfig.MARGIN_HOURS} horas`,
    });

    // Construir URL con filtros de rango de fecha
    const baseParams = `participation-mode=all&operation-types=${
      OperationType.TRANSFER_TO_VESTING
    }&page-size=${ApiConfig.PAGE_SIZE}&data-size-limit=${
      ApiConfig.DATA_SIZE_LIMIT
    }&from-block=${encodeURIComponent(fromBlock)}&to-block=${encodeURIComponent(
      toBlock
    )}`;
    const initialUrl = `https://api.syncad.com/hafah-api/accounts/${username}/operations?${baseParams}`;

    console.log(`📡 Obteniendo información de paginación para ${username}...`);

    const initialResponse = await fetch(initialUrl);
    if (!initialResponse.ok) {
      throw new ApiError(
        `Error HTTP: ${initialResponse.status}`,
        initialResponse.status,
        initialUrl
      );
    }

    const initialData: SyncadResponse = await initialResponse.json();
    const totalPages = initialData.total_pages;

    console.log(`📄 Total de páginas disponibles: ${totalPages}`);
    console.log(
      `🔄 Comenzando navegación desde la ÚLTIMA página (${totalPages}) hacia la primera`
    );

    const validPowerUps: PowerUpTransaction[] = [];
    const processedTxIds = new Set<string>(); // Para evitar duplicados
    let shouldContinue = true;

    // Comenzamos desde la última página y vamos hacia atrás
    for (
      let currentPage = totalPages;
      currentPage >= 1 && shouldContinue;
      currentPage--
    ) {
      const pageParam = currentPage === 1 ? "" : `&page=${currentPage}`;
      const url = `https://api.syncad.com/hafah-api/accounts/${username}/operations?${baseParams}${pageParam}`;

      console.log(
        `📡 ⬅️ Consultando página ${currentPage}/${totalPages} (navegando hacia atrás) para ${username}...`
      );

      const response = await fetch(url);
      if (!response.ok) {
        throw new ApiError(
          `Error HTTP: ${response.status}`,
          response.status,
          url
        );
      }

      const data: SyncadResponse = await response.json();
      console.log(
        `📊 Página ${currentPage}/${totalPages}: ${data.operations_result.length} operaciones encontradas para ${username}`
      );

      // Buscar TODAS las operaciones transfer_to_vesting dentro del rango
      for (const operation of data.operations_result) {
        if (operation.op_type_id === OperationType.TRANSFER_TO_VESTING) {
          // Asegurar que el timestamp tenga la Z para UTC
          const timestampUTC = operation.timestamp.endsWith("Z")
            ? operation.timestamp
            : operation.timestamp + "Z";
          const opDate = parseISO(timestampUTC);

          const formattedOpDate = formatUTC(
            opDate,
            "yyyy-MM-dd HH:mm:ss 'UTC'"
          );
          const amount = operation.op.value.hive_vested?.amount || "N/A";

          // Extraer el valor numérico del amount y dividir entre 1000 para obtener HIVE
          const amountValue = parseFloat(amount) / 1000;
          const amountFormatted = amountValue.toFixed(3);

          // Early exit: Si encontramos una operación ANTERIOR al rango extendido,
          // podemos detener la búsqueda porque las páginas anteriores serán aún más antiguas
          // Usamos fromBlockDate (con margen) para el early exit
          if (opDate < fromBlockDate) {
            console.log(
              `⏸️ ${username} - Operación anterior al rango extendido encontrada (${formattedOpDate}). Deteniendo búsqueda en página ${currentPage}.`
            );
            shouldContinue = false;
            break;
          }

          // Validar que esté dentro del rango de fechas EXACTO (sin márgenes)
          // El margen solo se usa para el filtrado de la API, la validación es precisa
          if (
            isWithinInterval(opDate, {
              start: dateRange.startDate,
              end: dateRange.endDate,
            })
          ) {
            // Verificar si el txId ya fue procesado (evitar duplicados)
            if (processedTxIds.has(operation.trx_id)) {
              console.log(
                `⚠️ ${username} - Transaction duplicada ignorada: ${operation.trx_id}`
              );
              continue;
            }

            console.log(`⚡ ${username} - Power Up encontrado:`, {
              fecha: formattedOpDate,
              fechaISO: opDate.toISOString(),
              unix: opDate.getTime(),
              monto: `${amountFormatted} HIVE`,
              txId: operation.trx_id,
            });

            // Validar cantidad mínima individual
            if (minPowerUp > 0 && amountValue < minPowerUp) {
              console.log(
                `⚠️ ${username} - Power Up de ${amountFormatted} HIVE es menor al mínimo (${minPowerUp} HIVE), pero se incluirá en el total`
              );
            }

            // Marcar txId como procesado
            processedTxIds.add(operation.trx_id);

            // Agregar a la lista de power ups válidos
            validPowerUps.push({
              date: formattedOpDate,
              amount: amountFormatted,
              txId: operation.trx_id,
            });
          }
        }
      }

      // Protección contra loops infinitos
      if (totalPages - currentPage + 1 > ApiConfig.MAX_PAGES) {
        console.warn(
          `⚠️ Se alcanzó el límite de ${ApiConfig.MAX_PAGES} páginas procesadas para ${username}`
        );
        break;
      }
    }

    // Log de transacciones procesadas
    console.log(
      `📊 ${username} - Total transacciones únicas procesadas: ${validPowerUps.length}`
    );

    // Si encontramos power ups, calcular el total
    if (validPowerUps.length > 0) {
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

      // Validar que el total cumpla con el mínimo
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
        powerUpDate: validPowerUps[0].date, // Primera transacción
        powerUpAmount: validPowerUps[0].amount, // Primera transacción (ya está dividido)
        powerUpTxId: validPowerUps[0].txId, // Primera transacción
        powerUpTransactions: validPowerUps, // Todas las transacciones (ya divididas)
        totalPowerUp: totalAmount.toFixed(3), // Total sumado
      };
    }

    console.log(
      `🚫 ${username} - No se encontró Power Up en el rango especificado`
    );
    console.log(
      `🚫 ${username} - No se encontró Power Up en el rango especificado`
    );
    return { hasPowerUp: false };
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
  minPowerUp: number = 10
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

        if (hasImages) {
          console.log(
            `🖼️ ${comment.author} - Comentario con ${
              validImages.length
            } imagen(es) válida(s) de ${(image || []).length} total(es)`
          );

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
              hasImages: true,
              hasPowerUp: true,
            });
          } else {
            reason = "No hizo Power Up en el rango de fechas";
            console.log(`❌ ${comment.author} - ${reason}`);
            invalidUsers.push({
              name: comment.author,
              images: validImages,
              hasImages: true,
              hasPowerUp: false,
              reason,
            });
          }
        } else {
          reason = "No incluye imágenes válidas en el comentario";
          console.log(`📷 ${comment.author} - ${reason}`);
          invalidUsers.push({
            name: comment.author,
            images: [],
            hasImages: false,
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

    const analysis: ChallengeAnalysis = {
      validUsers,
      invalidUsers,
      ignoredUsers,
      totalComments: comments.length,
    };

    console.log(`\n✅ ANÁLISIS COMPLETADO:`);
    console.log(`📊 Total comentarios: ${analysis.totalComments}`);
    console.log(`✅ Usuarios válidos: ${analysis.validUsers.length}`);
    console.log(`❌ Usuarios inválidos: ${analysis.invalidUsers.length}`);
    console.log(`🤖 Cuentas ignoradas: ${analysis.ignoredUsers.length}`);
    console.log(
      `\n👥 Usuarios válidos:`,
      analysis.validUsers.map((u) => u.name)
    );
    console.log(
      `\n❌ Usuarios inválidos:`,
      analysis.invalidUsers.map((u) => `${u.name} (${u.reason})`)
    );

    return analysis;
  } catch (error) {
    console.error("❌ Error al llamar a la API:", error);
    throw error;
  }
}
