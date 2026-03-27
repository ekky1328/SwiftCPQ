DROP TABLE IF EXISTS user_refresh_token;

ALTER TABLE "user"
    DROP COLUMN IF EXISTS auth_provider,
    DROP COLUMN IF EXISTS external_id;

ALTER TABLE "user" ALTER COLUMN password_hash DROP DEFAULT;
