DROP INDEX IF EXISTS idx_users_auth_identity;

ALTER TABLE users
    DROP COLUMN IF EXISTS auth_user_id,
    DROP COLUMN IF EXISTS auth_provider;

UPDATE users
SET password_hash = ''
WHERE password_hash IS NULL;

ALTER TABLE users
    ALTER COLUMN password_hash SET NOT NULL;
