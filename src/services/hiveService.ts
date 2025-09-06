import { isWithinInterval, parseISO, format } from "date-fns";
import type {
  User,
  DateRange,
  ProgressCallback,
  ChallengeAnalysis,
} from "../types/hive";

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
}

interface PowerUpResult {
  readonly hasPowerUp: boolean;
  readonly powerUpDate?: string;
}

// Función para verificar si un usuario hizo power up en el rango de fechas usando la API de Syncad
async function hasPowerUpInRange(
  username: string,
  dateRange: DateRange
): Promise<PowerUpResult> {
  try {
    console.log(
      `🔍 Verificando power up para ${username} usando API Syncad...`
    );

    let page = 1;
    let hasNext = true;

    while (hasNext) {
      // Para la primera página no agregamos el parámetro page
      const pageParam = page === 1 ? "" : `&page=${page}`;
      const url = `https://api.syncad.com/hafah-api/accounts/${username}/operations?participation-mode=all&operation-types=${OperationType.TRANSFER_TO_VESTING}&page-size=${ApiConfig.PAGE_SIZE}&data-size-limit=${ApiConfig.DATA_SIZE_LIMIT}${pageParam}`;

      console.log(`📡 Consultando página ${page} para ${username}...`);

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
        `📊 Página ${page}: ${data.operations_result.length} operaciones encontradas para ${username}`
      );

      // Buscar operaciones transfer_to_vesting dentro del rango
      for (const operation of data.operations_result) {
        if (operation.op_type_id === OperationType.TRANSFER_TO_VESTING) {
          // transfer_to_vesting
          // Asegurar que el timestamp tenga la Z para UTC
          const timestampUTC = operation.timestamp.endsWith("Z")
            ? operation.timestamp
            : operation.timestamp + "Z";
          const opDate = parseISO(timestampUTC);

          const formattedOpDate = format(opDate, "yyyy-MM-dd HH:mm:ss 'UTC'");
          const amount = operation.op.value.hive_vested?.amount || "N/A";
          console.log(
            `⚡ ${username} - Power Up encontrado: ${formattedOpDate} (${amount})`
          );
          console.log(
            `📅 Rango: ${format(
              dateRange.startDate,
              "yyyy-MM-dd HH:mm:ss 'UTC'"
            )} - ${format(dateRange.endDate, "yyyy-MM-dd HH:mm:ss 'UTC'")}`
          );

          if (
            isWithinInterval(opDate, {
              start: dateRange.startDate,
              end: dateRange.endDate,
            })
          ) {
            console.log(`✅ ${username} - Power Up VÁLIDO en rango!`);
            return { hasPowerUp: true, powerUpDate: formattedOpDate };
          } else {
            console.log(`❌ ${username} - Power Up fuera del rango`);
          }
        }
      }

      // Verificar si hay más páginas basado en total_pages
      hasNext = page < data.total_pages;
      if (hasNext) {
        page = page + 1;
      }

      // Límite de seguridad para evitar bucles infinitos
      if (page > ApiConfig.MAX_PAGES) {
        console.warn(`⚠️ Límite de páginas alcanzado para ${username}`);
        break;
      }
    }

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
  onProgress?: ProgressCallback
): Promise<ChallengeAnalysis> {
  try {
    const comments = await getComments(author, permlink);
    const validUsers: User[] = [];
    const invalidUsers: User[] = [];
    const ignoredUsers: string[] = [];

    console.log(`📝 Analizando ${comments.length} comentarios...`);
    console.log(
      `📅 Rango de fechas: ${format(
        dateRange.startDate,
        "yyyy-MM-dd HH:mm:ss 'UTC'"
      )} - ${format(dateRange.endDate, "yyyy-MM-dd HH:mm:ss 'UTC'")}`
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

        const hasImages = Array.isArray(image) && image.length >= 1;
        let hasPowerUp = false;
        let powerUpDate: string | undefined;
        let reason = "";

        if (hasImages) {
          console.log(
            `🖼️ ${comment.author} - Comentario con ${image.length} imagen(es)`
          );

          // Verificar si hizo power up en el rango de fechas usando API Syncad
          const powerUpResult = await hasPowerUpInRange(
            comment.author,
            dateRange
          );
          hasPowerUp = powerUpResult.hasPowerUp;
          powerUpDate = powerUpResult.powerUpDate;

          if (hasPowerUp) {
            console.log(`🎉 ${comment.author} - CUMPLE TODOS LOS REQUISITOS!`);
            validUsers.push({
              name: comment.author,
              images: image,
              powerUpDate,
              hasImages: true,
              hasPowerUp: true,
            });
          } else {
            reason = "No hizo Power Up en el rango de fechas";
            console.log(`❌ ${comment.author} - ${reason}`);
            invalidUsers.push({
              name: comment.author,
              images: image,
              hasImages: true,
              hasPowerUp: false,
              reason,
            });
          }
        } else {
          reason = "No incluye imágenes en el comentario";
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
