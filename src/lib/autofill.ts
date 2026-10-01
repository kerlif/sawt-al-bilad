// ============================================================
// الشفاء الذاتي للقراءات — ضمان أن أي نقطة قراءة تُعيد طبعة حية
//
// المشكلة الجذرية على Vercel (serverless): كل نسخة دالة (instance)
// لها ملف SQLite خاص في /tmp، والنسخ تُستبدل باستمرار. فقد ينجح
// POST /api/fetch ويُخزَّن الخبر في نسخة، ثم تُقرأ الأخبار من نسخة
// أخرى فارغة تماماً → الصفحة تظهر بلا محتوى رغم نجاح الجلب.
//
// الحل هنا: نقاط القراءة (news / categories / export) تتحقق قبل
// الإجابة — إن كانت الطبعة فارغة أو تجاوز أحدث خبر حداً معقولاً،
// تُشغَّل دورة جلب كاملة داخل الطلب نفسه ثم تُقدَّم البيانات. بهذا
// تُشفى أي نسخة نفسها عند أول قراءة مهما كان توجيه الطلبات.
//
// حمايات ضد الإرهاق والازدواج:
//   • قفل أثناء التنفيذ: الطلبات المتزامنة تنتظر نفس الدورة
//   • فترة تهدئة 90 ثانية بعد محاولة عقيمة (مصادر معطلة)
//   • المسار السريع: طبعة حية = استعلام واحد رخيص فقط
// ============================================================

import { db } from '@/lib/db';
import { ensureReady } from '@/lib/bootstrap';
import { fetchAllSources } from './newsFetcher';

/** العتبة التي بعدها تُعدّ الطبعة قديمة وتستحق تجديداً */
const STALE_MS = 30 * 60 * 1000; // 30 دقيقة

/** التهدئة بعد محاولة جلب لم تُدخل شيئاً — حماية للمصادر ولزمن الاستجابة */
const COOLDOWN_MS = 90 * 1000;

const g = globalThis as unknown as {
  __sawtAutofillInFlight?: Promise<void>;
  __sawtAutofillLastAttempt?: number;
};

/** هل الطبعة الحالية صالحة للعرض؟ (استعلام واحد رخيص) */
async function isEditionFresh(): Promise<boolean> {
  const agg = await db.newsItem.aggregate({ _max: { publishedAt: true } });
  const newest = agg._max.publishedAt;
  if (!newest) return false; // الطبعة فارغة تماماً
  return Date.now() - newest.getTime() < STALE_MS;
}

/**
 * يضمن وجود طبعة حية قبل القراءة — يُستدعى من نقاط القراءة.
 * - طبعة حية → يعود فوراً تقريباً
 * - طبعة فارغة/قديمة → جلب كامل داخل الطلب (3-8 ثوانٍ عادةً)
 * لا يرمي أخطاء الجلب أبداً: القراءة تُجيب بما لديها وتبقى الواجهة حية.
 */
export async function ensureNewsFresh(): Promise<void> {
  await ensureReady();

  if (await isEditionFresh()) return;

  // دورة جلب جارية فعلاً على هذه النسخة؟ انتظرها بدل تشغيل دورة موازية
  if (g.__sawtAutofillInFlight) {
    try {
      await g.__sawtAutofillInFlight;
    } catch {
      // مستهلكَها الأول يعالج الخطأ
    }
    return;
  }

  // تهدئة: إذا فشلت المصادر قبل لحظات فلا تُرهقها مع كل طلب
  const last = g.__sawtAutofillLastAttempt ?? 0;
  if (Date.now() - last < COOLDOWN_MS) return;

  g.__sawtAutofillLastAttempt = Date.now();
  const task = (async () => {
    try {
      const res = await fetchAllSources();
      console.log(
        `[autofill] self-heal cycle: ${res.ok}/${res.total} ok, +${res.inserted} new`
      );
    } catch (err) {
      // لا نُسقط القراءة بسبب فشل مصادر خارجية — تُجاب بالبيانات المتاحة
      console.error(
        '[autofill] self-heal fetch failed:',
        err instanceof Error ? err.message : err
      );
    } finally {
      g.__sawtAutofillInFlight = undefined;
    }
  })();
  g.__sawtAutofillInFlight = task;

  await task;
}
