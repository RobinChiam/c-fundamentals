export interface ConcurrencyConfig {
  compilerCapacity: number;
  sandboxCapacity: number;
}

export const DEFAULT_CONCURRENCY_CONFIG: ConcurrencyConfig = {
  compilerCapacity: 2,
  sandboxCapacity: 2,
};
