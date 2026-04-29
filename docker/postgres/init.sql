-- PostgreSQL initialization script for TES MVP

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS tes_mvp;

-- Connect to the database
\c tes_mvp;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create user if it doesn't exist (should be created by postgres init)
-- CREATE USER tes_user WITH PASSWORD 'tes_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE tes_mvp TO tes_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO tes_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tes_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tes_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO tes_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO tes_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO tes_user;

-- Create monitoring views
CREATE OR REPLACE VIEW database_stats AS
SELECT
    now() as timestamp,
    pg_stat_database.datname as database_name,
    pg_stat_database.numbackends as active_connections,
    pg_stat_database.xact_commit as commits,
    pg_stat_database.xact_rollback as rollbacks,
    pg_stat_database.blks_read as blocks_read,
    pg_stat_database.blks_hit as blocks_hit,
    pg_stat_database.tup_returned as tuples_returned,
    pg_stat_database.tup_fetched as tuples_fetched,
    pg_stat_database.tup_inserted as tuples_inserted,
    pg_stat_database.tup_updated as tuples_updated,
    pg_stat_database.tup_deleted as tuples_deleted
FROM pg_stat_database;

-- Create index for performance monitoring
CREATE INDEX IF NOT EXISTS idx_database_stats_timestamp ON database_stats (timestamp);

-- Grant access to monitoring view
GRANT SELECT ON database_stats TO tes_user;

-- Create vacuum statistics view
CREATE OR REPLACE VIEW vacuum_stats AS
SELECT
    schemaname,
    tablename,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze,
    vacuum_count,
    autovacuum_count,
    analyze_count,
    autoanalyze_count
FROM pg_stat_user_tables;

-- Grant access to vacuum stats view
GRANT SELECT ON vacuum_stats TO tes_user;

-- Create database size view
CREATE OR REPLACE VIEW database_size AS
SELECT
    now() as timestamp,
    pg_database.datname as database_name,
    pg_database_size(pg_database.datname) as size_bytes,
    pg_database_size(pg_database.datname) / 1024 / 1024 / 1024 as size_gb
FROM pg_database
WHERE pg_database.datname = 'tes_mvp';

-- Grant access to database size view
GRANT SELECT ON database_size TO tes_user;

-- Create table size view
CREATE OR REPLACE VIEW table_sizes AS
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_class
    JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
WHERE
    relkind = 'r'
    AND schemaname = 'public';

-- Grant access to table sizes view
GRANT SELECT ON table_sizes TO tes_user;

-- Refresh materialized views if they exist
CREATE OR REPLACE MATERIALIZED VIEW IF NOT EXISTS active_connections_history
AS
SELECT
    now() as timestamp,
    count(*) as connection_count
FROM pg_stat_activity
WHERE state = 'active';

CREATE INDEX idx_active_connections_history_timestamp ON active_connections_history (timestamp);

-- Grant access to materialized view
GRANT SELECT ON active_connections_history TO tes_user;