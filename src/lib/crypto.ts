// src/lib/crypto.ts
const SECRET = process.env.AES_SECRET_KEY || "defaultsecretkey123456789012"; // ต้องมีความยาวเพียงพอ

interface TokenPayload {
  username: string;
  level: number;
  role: string;
  iat: number;
}

// แปลง string เป็น Uint8Array
function str2ab(str: string) {
  return new TextEncoder().encode(str);
}

// สร้าง AES-GCM key จาก secret
async function getKey(): Promise<CryptoKey> {
  const hash = await crypto.subtle.digest("SHA-256", str2ab(SECRET));
  return crypto.subtle.importKey(
    "raw",
    hash,
    "AES-GCM",
    false,
    ["encrypt", "decrypt"]
  );
}

// สร้าง token (AES-GCM base64)
export async function createToken(username: string, level: number) {
  const key = await getKey();

  const payload: TokenPayload = {
    username,
    level,
    role: level === 50 ? "frontenduser" : "backenduser",
    iat: Date.now(),
  };

  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    str2ab(JSON.stringify(payload))
  );

  // รวม IV + encrypted และ encode เป็น base64
  const buffer = new Uint8Array(iv.byteLength + encrypted.byteLength);
  buffer.set(iv, 0);
  buffer.set(new Uint8Array(encrypted), iv.byteLength);

  return btoa(String.fromCharCode(...buffer));
}

// ตรวจสอบ token และคืน payload
export async function validateToken(token: string) {
  try {
    const key = await getKey();
    const data = Uint8Array.from(atob(token), c => c.charCodeAt(0));

    const iv = data.slice(0, 12);
    const encrypted = data.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );

    const payload = JSON.parse(new TextDecoder().decode(decrypted)) as TokenPayload;

    return payload;
  } catch (err) {
    console.error("Invalid token:", err);
    return null;
  }
}
