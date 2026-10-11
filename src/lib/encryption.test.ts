import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encrypt, decrypt } from './encryption.ts';

const TEST_KEY = 'unit-test-encryption-key-32-chars-min';

test('encrypt then decrypt round-trips and emits the v2 GCM format', () => {
  process.env.ENCRYPTION_KEY = TEST_KEY;
  const secret = 'ya29.a0AfH6SMB-google-oauth-token-🔐';

  const ciphertext = encrypt(secret);

  const parts = ciphertext.split(':');
  assert.equal(parts.length, 4);
  assert.equal(parts[0], 'v2');
  assert.equal(Buffer.from(parts[1], 'base64').length, 12); // 96-bit IV
  assert.equal(Buffer.from(parts[2], 'base64').length, 16); // 128-bit tag
  assert.ok(parts[3].length > 0);
  assert.notEqual(ciphertext, secret);
  assert.equal(decrypt(ciphertext), secret);
});

test('decrypt fails on a tampered ciphertext', () => {
  process.env.ENCRYPTION_KEY = TEST_KEY;
  const [version, iv, tag, data] = encrypt('tamper-me').split(':');

  const bytes = Buffer.from(data, 'base64');
  bytes[0] ^= 0xff; // flip a bit in the ciphertext
  const tampered = [version, iv, tag, bytes.toString('base64')].join(':');

  assert.throws(() => decrypt(tampered));
});

test('decrypt rejects the legacy (non-v2) format', () => {
  process.env.ENCRYPTION_KEY = TEST_KEY;
  assert.throws(() => decrypt('deadbeef:cafebabe'), /v2/);
});

test('missing ENCRYPTION_KEY throws at first use', () => {
  delete process.env.ENCRYPTION_KEY;
  assert.throws(() => encrypt('anything'), /ENCRYPTION_KEY/);
});

test('too-short ENCRYPTION_KEY throws at first use', () => {
  process.env.ENCRYPTION_KEY = 'too-short';
  assert.throws(() => encrypt('anything'), /ENCRYPTION_KEY/);
});
