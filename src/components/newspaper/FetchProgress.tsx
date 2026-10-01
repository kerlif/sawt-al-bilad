'use client';

// ============================================================
// شريط تقدم الجلب — شريط رفيع أعلى الصفحة + لافتة حالة صغيرة
// يظهر تلقائياً عند فتح الجريدة (الجلب الذاتي) وعند ضغط زر «تحديث»
// نسبة التقدم حقيقية: تُحسب من عدد المصادر المكتملة فعلياً
// طابع الجريدة: خط أميري، حبر داكن، طوبى قرمزية — بلا إيموجي
// ============================================================

import { CheckIcon, RefreshIcon } from './icons';

export interface FetchProgressState {
  done: number;
  total: number;
  source: string;
  inserted: number;
  finished: boolean;
}

export default function FetchProgress({
  state,
}: {
  state: FetchProgressState | null;
}) {
  if (!state) return null;

  const known = state.total > 0;
  const pct = known ? Math.min(100, Math.round((state.done / state.total) * 100)) : 0;

  return (
    <div
      className="no-print pointer-events-none fixed inset-x-0 top-0 z-[70]"
      role="status"
      aria-live="polite"
      aria-label="تقدم جلب الأخبار"
    >
      {/* الشريط الرفيع — يثبت أعلى الصفحة كخط الطباعة الأول */}
      <div className="h-1.5 w-full bg-rule/60 shadow-sm">
        {state.finished ? (
          <div className="h-full w-full bg-ink transition-all duration-500" />
        ) : known ? (
          <div
            className="h-full bg-vermillion transition-[width] duration-700 ease-out"
            style={{ width: `${Math.max(pct, 5)}%` }}
          />
        ) : (
          <div className="fetchbar-indet h-full bg-vermillion" />
        )}
      </div>

      {/* لافتة الحالة الصغيرة */}
      <div className="mx-auto mt-1.5 flex w-fit max-w-[94vw] items-center gap-2 border border-ink bg-ink px-3 py-1 text-paper shadow-md">
        {state.finished ? (
          <>
            <CheckIcon size={13} className="shrink-0" />
            <span className="whitespace-nowrap font-headline text-xs md:text-sm">
              اكتمل جلب الطبعة — أُضيف {state.inserted.toLocaleString('ar-DZ')} خبراً جديداً
            </span>
          </>
        ) : (
          <>
            <RefreshIcon size={13} className="animate-spin shrink-0" />
            <span className="whitespace-nowrap font-headline text-xs md:text-sm">
              {known ? (
                <>
                  جارٍ جلب الأخبار — {pct}٪{' '}
                  <span className="opacity-75">
                    ({state.done.toLocaleString('ar-DZ')}/{state.total.toLocaleString('ar-DZ')} مصدر)
                  </span>
                </>
              ) : (
                'جارٍ فتح المطبع وجمع أحدث الأخبار…'
              )}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
