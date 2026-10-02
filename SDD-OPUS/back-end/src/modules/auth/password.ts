import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// Plan §5.1: scrypt, per-user 16-byte salt, N=2^15, r=8, p=1, 64-byte output.
const N = 32768;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

function derive(password: string, salt: Buffer, n: number, r: number, p: number, keyLength: number) {
  return new Promise<Buffer>((resolve, reject) => {
    // maxmem must exceed 128 * N * r, otherwise Node rejects N=2^15.
    scrypt(password, salt, keyLength, { N: n, r, p, maxmem: 128 * n * r * 2 }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

/** Format: scrypt$N$r$p$<salt base64>$<hash base64> — parameters travel with the hash. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await derive(password, salt, N, R, P, KEY_LENGTH);
  return ["scrypt", N, R, P, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [n, r, p] = [Number(parts[1]), Number(parts[2]), Number(parts[3])];
  if (![n, r, p].every((value) => Number.isInteger(value) && value > 0)) return false;

  const salt = Buffer.from(parts[4], "base64");
  const expected = Buffer.from(parts[5], "base64");
  if (salt.length === 0 || expected.length === 0) return false;

  try {
    const actual = await derive(password, salt, n, r, p, expected.length);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
