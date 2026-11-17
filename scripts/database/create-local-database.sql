-- Creates the local EVNTGRID login role and database. Safe to run more than once.
-- Run through create-local-database.ps1, which passes the values from the root .env file:
--   app_user, app_password, app_db
-- Run as a PostgreSQL superuser (normally "postgres"). Contains no credentials itself.

\set ON_ERROR_STOP on

SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'app_user', :'app_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_user')
\gexec

-- Keep the password in step with .env if the role already existed.
SELECT format('ALTER ROLE %I LOGIN PASSWORD %L', :'app_user', :'app_password')
\gexec

SELECT format('CREATE DATABASE %I OWNER %I ENCODING %L', :'app_db', :'app_user', 'UTF8')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'app_db')
\gexec

SELECT 'Database ' || :'app_db' || ' is ready, owned by ' || :'app_user' AS result;
