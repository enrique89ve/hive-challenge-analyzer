export interface User {
  readonly name: string;
  readonly images: string[];
  readonly powerUpDate?: string;
  readonly hasImages: boolean;
  readonly hasPowerUp: boolean;
  readonly reason?: string; // Razón por la que no cumple
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
}

export interface ProgressCallback {
  (current: number, total: number): void;
}
