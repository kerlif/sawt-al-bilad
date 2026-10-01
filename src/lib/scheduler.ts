// ============================================================
// المُجدِّد الخلفي — node-cron
// - يجلب الأخبار كل N دقائق (قابل للتعديل من الإعدادات، افتراضي 12 د)
// - يحد أقصى الفاصل بين 5 و 60 دقيقة
// - يعمل مرة واحدة عبر instrumentation عند إقلاع الخادم
// ============================================================

import cron from 'node-cron';
import { db } from '@/lib/db';
import { fetchAllSources } from './newsFetcher';
import { syncBots } from './telegramManager';
import { ensureReady } from './bootstrap';

const INTERVAL_KEY = 'fetchIntervalMinutes';
const DEFAULT_INTERVAL = 12;

const globalStore = globalThis as unknown as {
  __newsScheduler?: { task: cron.ScheduledTask; interval: number };
};

export async function getFetchInterval(): Promise<number> {
  const s = await db.setting.findUnique({ where: { key: INTERVAL_KEY } });
  const n = s ? parseInt(s.value, 10) : DEFAULT_INTERVAL;
  if (Number.isNaN(n)) return DEFAULT_INTERVAL;
  return Math.min(60, Math.max(5, n));
}

export async function setFetchInterval(minutes: number): Promise<number> {
  const clamped = Math.min(60, Math.max(5, Math.round(minutes)));
  await db.setting.upsert({
    where: { key: INTERVAL_KEY },
    update: { value: String(clamped) },
    create: { key: INTERVAL_KEY, value: String(clamped) },
  });
  // إعادة الجدولة بالفاصل الجديد
  await restartScheduler();
  return clamped;
}

export async function restartScheduler(): Promise<void> {
  const existing = globalStore.__newsScheduler;
  if (existing) {
    existing.task.stop();
    globalStore.__newsScheduler = undefined;
  }
  await startScheduler();
}

export async function startScheduler(): Promise<void> {
  if (globalStore.__newsScheduler) return; // يعمل بالفعل

  // على Vercel تكون الدوال مؤقتة (serverless) — تشغيل node-cron داخلها
  // يولّد تحذيرات missed execution بلا أي فائدة. الجدولة هناك عبر
  // vercel.json (Cron يومي) + الجلب الذاتي فور فتح الجريدة في الواجهة
  if (process.env.VERCEL) {
    console.log(
      '[scheduler] بيئة Vercel — node-cron معطّل (الجدولة عبر vercel.json + الجلب الذاتي عند الفتح)'
    );
    return;
  }

  const interval = await getFetchInterval();
  const task = cron.schedule(`*/${interval} * * * *`, async () => {
    try {
      const res = await fetchAllSources();
      console.log(
        `[scheduler] fetch cycle: ${res.ok}/${res.total} ok, +${res.inserted} new`
      );
    } catch (err) {
      console.error('[scheduler] fetch cycle failed:', err instanceof Error ? err.message : err);
    }
  });

  globalStore.__newsScheduler = { task, interval };
  console.log(`[scheduler] started — every ${interval} minutes`);
}

/** إقلاع الخدمات الخلفية (يُستدعى من نقاط الـ API عند أول طلب) */
export async function bootBackgroundServices(): Promise<void> {
  // 0) التهيئة الذاتية: مخطط القاعدة + المصادر الافتراضية إن لزم
  //    الفشل هنا يُمرَّر للمسار ليعرف أن الجداول غير جاهزة (ويُعاد المحاولة لاحقاً)
  await ensureReady();

  // 1) مزامنة بوتات تلغرام النشطة
  try {
    await syncBots();
  } catch (err) {
    console.error('[boot] telegram sync failed:', err instanceof Error ? err.message : err);
  }

  // 2) جدولة الجلب الدوري (تُتخطى على Vercel)
  try {
    await startScheduler();
  } catch (err) {
    console.error('[boot] scheduler failed:', err instanceof Error ? err.message : err);
  }
}

// ------------------------- الإقلاع الكسول -------------------------
// ضمان واحد: تعمل الخدمات الخلفية مرة واحدة بغض النظر عن نقطة الاستدعاء
const g = globalThis as unknown as { __bootPromise?: Promise<void> };

export function ensureBooted(): Promise<void> {
  if (!g.__bootPromise) {
    g.__bootPromise = bootBackgroundServices().catch((err) => {
      console.error('[boot] lazy boot failed:', err instanceof Error ? err.message : err);
      // إتاحة إعادة المحاولة في الطلب القادم عند الفشل (مثل بدء بارد حيث /tmp فارغ)
      g.__bootPromise = undefined;
      throw err;
    });
  }
  return g.__bootPromise;
}
