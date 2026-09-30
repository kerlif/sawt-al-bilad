// ============================================================
// تشفير الأسرار — AES-256-GCM
// يُستخدم لتشفير توكنات بوتات تلغرام قبل تخزينها في قاعدة البيانات.
// القاعدة الذهبية: التوكن لا يُسجَّل (log) ولا يُعاد عبر الـ API أبداً.
// ============================================================

import crypto from 'crypto';

// مفتاح التشفير من متغيرات البيئة (32 بايت). إذا لم يُضبط، يُشتق مفتاح
// افتراضي للنسخة الأولية فقط — يجب ضبط BOT_ENCRYPTION_KEY في الإنتاج!
const KEY_SOURCE =
  process.env.BOT_ENCRYPTION_KEY || 'sawt-al-bilad-default-dev-key-change-me';

const AES_KEY = crypto.createHash('sha256').update(KEY_SOURCE).digest();

/** يشفر نصاً ويعيده بصيغة iv:tag:ciphertext (كلها base64url) */
export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', AES_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString('base64url'),
    tag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join(':');
}

/** يفك تشفير نص مشفر بصيغة iv:tag:ciphertext — للاستخدام الداخلي فقط */
export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(':');
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('صيغة النص المشفر غير صالحة');
  }
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    AES_KEY,
    Buffer.from(ivB64, 'base64url')
  );
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64url')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

/**
 * بصمة التوكن: HMAC-SHA256 — للتحقق من تفرد التوكن في قاعدة البيانات
 * دون تخزينه أو فك تشفيره.
 */
export function tokenFingerprint(token: string): string {
  return crypto
    .createHmac('sha256', AES_KEY)
    .update(token.trim())
    .digest('base64url');
}

/** يحجب التوكن في السجلات: 123456:ABC... → 1234……XYZ */
export function maskSecret(token: string): string {
  if (token.length < 10) return '***';
  return `${token.slice(0, 6)}…${token.slice(-3)}`;
}
