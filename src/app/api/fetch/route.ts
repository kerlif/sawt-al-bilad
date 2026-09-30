import { NextRequest, NextResponse } from 'next/server';
import { fetchAllSources } from '@/lib/newsFetcher';
import { ensureReady } from '@/lib/bootstrap';

// ============================================================
// /api/fetch — تشغيل دورة جلب من كل المصادر النشطة
// - POST: من زر «جلب الآن» في غرفة التحرير ومن التحديث التلقائي للواجهة
// - GET:  للمجدول السحابي (مثل مهام Cron الدورية) — يدعم CRON_SECRET اختيارياً
// ============================================================

export async function POST() {
  try {
    await ensureReady();
    const result = await fetchAllSources();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[api/fetch]', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { ok: false, error: 'فشلت دورة الجلب' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // إن ضُبط CRON_SECRET فاطلب الترويسة المطابقة لتحصين المسار
    const secret = process.env.CRON_SECRET;
    if (secret) {
      const auth = req.headers.get('authorization') ?? '';
      if (auth !== `Bearer ${secret}`) {
        return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
      }
    }
    await ensureReady();
    const result = await fetchAllSources();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[api/fetch]', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { ok: false, error: 'فشلت دورة الجلب' },
      { status: 500 }
    );
  }
}
