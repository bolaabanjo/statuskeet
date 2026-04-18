ALTER TABLE users
    ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'legacy' CHECK (auth_provider IN ('legacy', 'supabase')),
    ADD COLUMN auth_user_id TEXT;

ALTER TABLE users
    ALTER COLUMN password_hash DROP NOT NULL;

CREATE UNIQUE INDEX idx_users_auth_identity
    ON users (auth_provider, auth_user_id)
    WHERE auth_user_id IS NOT NULL;
