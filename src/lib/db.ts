import path from 'path';
import { PrismaClient } from '@prisma/client'

// ============================================================
// عميل قاعدة البيانات — يحدد مسار SQLite تلقائياً حسب البيئة:
// - إذا ضُبط DATABASE_URL صراحةً ف يُستخدم كما هو
// - على بيئات الحوسبة بلا نظام ملفات دائم (serverless): /tmp
// - محلياً: مجلد db/ داخل المشروع
// ============================================================

function resolveDatabaseUrl(): string {
  const fromEnv = process.env.DATABASE_URL?.trim();
  // تجاهل القيمة المؤقتة من .env.example
  if (fromEnv && !fromEnv.includes('/absolute/path/')) return fromEnv;

  const isServerless = Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.NETLIFY
  );
  if (isServerless) {
    const dir = process.env.TEMP || process.env.TMP || '/tmp';
    return `file:${dir}/sawt-al-bilad.db`;
  }
  return `file:${path.join(process.cwd(), 'db', 'custom.db')}`;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: resolveDatabaseUrl(),
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
