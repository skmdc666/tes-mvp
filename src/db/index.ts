import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Connection for query purposes
const connectionString = process.env.DATABASE_URL || 'postgresql://tes_user:tes_password@localhost:5432/tes_mvp';
const queryClient = postgres(connectionString);

// Database instance
export const db = drizzle(queryClient, { schema });

// Export all schema elements
export * from './schema';