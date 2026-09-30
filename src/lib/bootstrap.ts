// ============================================================
// التهيئة الذاتية — تجعل التطبيق يعمل فوراً على أي بيئة استضافة
// دون أي خطوات يدوية:
//   1) ensureSchema: إنشاء جداول SQLite إن لم تكن موجودة
//      (ضروري على بيئات الحوسبة المؤقتة حيث نظام الملفات فارغ)
//   2) ensureSeeded: تعبئة المصادر الافتراضية إن كان الجدول فارغاً
// تُستدعى مرة واحدة لكل عملية تشغيل عبر ensureBooted()
// ============================================================

import { db } from '@/lib/db';
import { DEFAULT_SOURCES } from './defaultSources';

const DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS "Source" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "rssUrl" TEXT NOT NULL,
  "siteUrl" TEXT NOT NULL,
  "language" TEXT NOT NULL DEFAULT 'ar',
  "type" TEXT NOT NULL DEFAULT 'rss',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastFetchAt" DATETIME,
  "lastStatus" TEXT,
  "itemCount" INTEGER NOT NULL DEFAULT 0
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Source_rssUrl_key" ON "Source"("rssUrl")`,
  `CREATE TABLE IF NOT EXISTS "NewsItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "hash" TEXT NOT NULL,
  "titleKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "imageUrl" TEXT,
  "publishedAt" DATETIME NOT NULL,
  "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "language" TEXT NOT NULL DEFAULT 'ar',
  "category" TEXT NOT NULL DEFAULT 'مجتمع',
  "isBreaking" BOOLEAN NOT NULL DEFAULT false,
  "sourceCount" INTEGER NOT NULL DEFAULT 1,
  "sourceId" TEXT NOT NULL,
  CONSTRAINT "NewsItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE CASCADE ON UPDATE CASCADE
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "NewsItem_hash_key" ON "NewsItem"("hash")`,
  `CREATE INDEX IF NOT EXISTS "NewsItem_category_publishedAt_idx" ON "NewsItem"("category", "publishedAt")`,
  `CREATE INDEX IF NOT EXISTS "NewsItem_isBreaking_publishedAt_idx" ON "NewsItem"("isBreaking", "publishedAt")`,
  `CREATE INDEX IF NOT EXISTS "NewsItem_publishedAt_idx" ON "NewsItem"("publishedAt")`,
  `CREATE INDEX IF NOT EXISTS "NewsItem_titleKey_idx" ON "NewsItem"("titleKey")`,
  `CREATE TABLE IF NOT EXISTS "BotToken" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "encryptedToken" TEXT NOT NULL,
  "tokenFingerprint" TEXT NOT NULL,
  "username" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastPollAt" DATETIME,
  "lastError" TEXT
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "BotToken_tokenFingerprint_key" ON "BotToken"("tokenFingerprint")`,
  `CREATE TABLE IF NOT EXISTS "BotSubscriber" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "botId" TEXT NOT NULL,
  "chatId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BotSubscriber_botId_fkey" FOREIGN KEY ("botId") REFERENCES "BotToken" ("id") ON DELETE CASCADE ON UPDATE CASCADE
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "BotSubscriber_botId_chatId_key" ON "BotSubscriber"("botId", "chatId")`,
  `CREATE TABLE IF NOT EXISTS "Setting" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "value" TEXT NOT NULL
)`,
];

const g = globalThis as unknown as {
  __sawtSchemaReady?: Promise<void>;
  __sawtSeeded?: Promise<void>;
};

/** إنشاء الجداول إن لم تكن موجودة — مرة واحدة لكل عملية تشغيل */
export function ensureSchema(): Promise<void> {
  if (!g.__sawtSchemaReady) {
    g.__sawtSchemaReady = (async () => {
      for (const stmt of DDL) {
        await db.$executeRawUnsafe(stmt);
      }
    })().catch((err) => {
      // إعادة المحاولة في الطلب القادم عند الفشل (مثل فشل مؤقت للمسار)
      g.__sawtSchemaReady = undefined;
      throw err;
    });
  }
  return g.__sawtSchemaReady;
}

/** تعبئة المصادر الافتراضية إن كان الجدول فارغاً */
export async function ensureSeeded(): Promise<void> {
  if (!g.__sawtSeeded) {
    g.__sawtSeeded = (async () => {
      const count = await db.source.count();
      if (count > 0) return;
      for (const s of DEFAULT_SOURCES) {
        await db.source.upsert({
          where: { rssUrl: s.rssUrl },
          update: { name: s.name, siteUrl: s.siteUrl, language: s.language, isActive: true },
          create: { ...s, type: 'rss', isActive: true },
        });
      }
      console.log(`[bootstrap] seeded ${DEFAULT_SOURCES.length} default sources`);
    })().catch((err) => {
      g.__sawtSeeded = undefined;
      throw err;
    });
  }
  return g.__sawtSeeded;
}

/** التهيئة الكاملة: مخطط + مصادر */
export async function ensureReady(): Promise<void> {
  await ensureSchema();
  await ensureSeeded();
}
