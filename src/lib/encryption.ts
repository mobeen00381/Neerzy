import crypto from 'crypto';

/**
 * Symmetric encryption for secret tokens at rest (e.g. Google OAuth tokens).
 *
 * Hardening notes:
 *   • There is NO fallback key. When ENCRYPTION_KEY is missing or shorter than
 *     32 characters we throw on first use instead of silently padding a weak
 *     placeholder — a misconfigured deployment must fail loudly, never persist
 *     tokens under a guessable key.
 *   • The AES-256 key is derived with scrypt (a real KDF) from the secret and a
 *     fixed, app-specific salt, not by padding/truncating the raw string.
 *   • Ciphertexts are authenticated (AES-256-GCM) and self-describing:
 *     "v2:<base64 iv>:<base64 auth tag>:<base64 ciphertext>".
 */

const ALGORITHM = 'aes-256-gcm';
const VERSION = 'v2';
const IV_LENGTH = 12; // 96-bit nonce, the recommended GCM IV size
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag
const KEY_LENGTH = 32; // AES-256
const MIN_SECRET_LENGTH = 32;

// Fixed, app-specific salt. Not secret — it only domain-separates the KDF so
// this key can never collide with a key derived elsewhere from the same secret.
const KDF_SALT = 'neerzy:gbp-oauth-tokens:v2';

let cachedKey: Buffer | null = null;
let cachedSecret: string | undefined;

/** Derives (and memoizes) the AES-256 key from ENCRYPTION_KEY on first use. */
function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;

  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    // Drop any previously derived key so a later misconfiguration can never
    // keep working off a stale value.
    cachedKey = null;
    cachedSecret = undefined;
    throw new Error(
      `ENCRYPTION_KEY is missing or too short: set an ENCRYPTION_KEY of at least ${MIN_SECRET_LENGTH} characters.`
    );
  }

  if (cachedKey && cachedSecret === secret) return cachedKey;

  cachedKey = crypto.scryptSync(secret, KDF_SALT, KEY_LENGTH);
  cachedSecret = secret;
  return cachedKey;
}

/** Encrypts a UTF-8 string into the versioned "v2:iv:tag:ciphertext" format. */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString('base64'),
    tag.toString('base64'),
    ciphertext.toString('base64'),
  ].join(':');
}

/** Decrypts a "v2:iv:tag:ciphertext" payload. Accepts the v2 format only. */
export function decrypt(payload: string): string {
  const parts = payload.split(':');
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error('Unsupported ciphertext: expected a v2 payload.');
  }

  const [, ivB64, tagB64, ciphertextB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const ciphertext = Buffer.from(ciphertextB64, 'base64');

  if (iv.length !== IV_LENGTH || tag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Unsupported ciphertext: malformed v2 payload.');
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}
