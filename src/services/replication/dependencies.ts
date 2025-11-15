/**
 * Dependency Injection interfaces for ReplicatedTable
 *
 * This allows for easy testing by injecting mock dependencies
 * while using real implementations in production.
 */

/**
 * Logger interface - matches the structure of @/utils/logger
 */
export interface Logger {
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug?: (...args: any[]) => void;
}

/**
 * TTL provider function type
 * Note: Uses 'any' to avoid circular dependency with featureFlags
 */
export type GetTableTTL = (tableName: any) => number;

/**
 * Diagnostics logger function type
 */
export type LogDiagnostics = (report: any) => void;

/**
 * All injectable dependencies for ReplicatedTable
 */
export interface ReplicatedTableDependencies {
  logger?: Logger;
  getTableTTL?: GetTableTTL;
  logDiagnostics?: LogDiagnostics;
}

/**
 * Default no-op logger for testing
 */
export const noopLogger: Logger = {
  log: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
};

/**
 * Default TTL provider (5 minutes)
 */
export const defaultGetTableTTL: GetTableTTL = () => 300000;

/**
 * Default no-op diagnostics
 */
export const noopDiagnostics: LogDiagnostics = () => {};
