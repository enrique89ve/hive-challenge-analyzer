export interface User {
  readonly name: string;
  readonly images: string[];
  readonly powerUpDate?: string;
  readonly powerUpAmount?: string;
  readonly powerUpTxId?: string; // ID de transacción para el Power Up
  readonly powerUpTransactions?: PowerUpTransaction[]; // Array de todas las transacciones
  readonly totalPowerUp?: string; // Suma total de todos los power ups
  readonly hasImages: boolean;
  readonly hasPowerUp: boolean;
  readonly reason?: string; // Razón por la que no cumple
  readonly commentCount?: number; // Número de comentarios realizados
}

export interface PowerUpTransaction {
  readonly date: string;
  readonly amount: string;
  readonly txId: string;
}

export interface ChallengeAnalysis {
  readonly validUsers: User[];
  readonly invalidUsers: User[];
  readonly ignoredUsers: string[];
  readonly totalComments: number;
}

export interface ChallengeResult {
  readonly analysis: ChallengeAnalysis;
  readonly status: "idle" | "loading" | "success" | "error";
  readonly error?: string;
}

export interface DateRange {
  readonly startDate: Date;
  readonly endDate: Date;
}

export interface SearchParams {
  readonly author: string;
  readonly permlink: string;
  readonly dateRange: DateRange;
  readonly minPowerUp?: number; // Cantidad mínima de HIVE para Power Up
}

export interface PostInfo {
  readonly author: string;
  readonly permlink: string;
}

export interface FilterOptions {
  readonly minPowerUp: number;
  readonly requireImages: boolean;
}

export interface ProgressCallback {
  (current: number, total: number): void;
}

// Tipos auxiliares para procesamiento de Power Up
export interface ExtendedDateRange {
  readonly fromBlock: string;
  readonly toBlock: string;
  readonly fromBlockDate: Date;
  readonly toBlockDate: Date;
}

export interface PowerUpPageResult {
  readonly validPowerUps: PowerUpTransaction[];
  readonly shouldContinue: boolean;
}

export interface SyncadApiParams {
  readonly baseUrl: string;
  readonly baseParams: string;
}
