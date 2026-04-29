import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema-sqlite';

// Connection for query purposes
const connectionString = process.env.DATABASE_URL?.replace('file:', '') || './dev.db';
const queryClient = new Database(connectionString);

// Database instance
export const db = drizzle(queryClient, { schema });

// Export all schema elements
export * from './schema-sqlite';