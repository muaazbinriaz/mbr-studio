-- 0007_channel_connections_details.sql

alter table channel_connections
  add column if not exists phone_number_id text; -- WhatsApp only

alter table channel_connections
  add column if not exists webhook_verify_token text not null default encode(gen_random_bytes(16), 'hex');

-- Encrypted token storage instead of raw access_token.
-- We'll store the encrypted value here; access_token column stays but
-- will hold ciphertext, not plaintext, once we wire up the encryption
-- helper in Step 3.
alter table channel_connections
  add column if not exists linked_agent_id uuid references agents(id);