import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getFetchInterval, setFetchInterval, ensureBooted } from '@/lib/scheduler';

// GET /api/settings — الإعدادات الحالية
export async function GET() {
  try {
    // يضمن أيضاً جاهزية الجداول عند الإقلاع البارد (ويُعاد المحاولة عند فشله)
    await ensureBooted();
    const interval = await getFetchInterval();
    const totalSources = await db.source.count();
    const activeSources = await db.source.count({ where: { isActive: true } });
    return NextResponse.json({
      fetchIntervalMinutes: interval,
      totalSources,
      activeSources,
    });
  } catch (err) {
    console.error('[api/settings GET]', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { fetchIntervalMinutes: 12, totalSources: 0, activeSources: 0, error: 'قيد التهيئة' },
      { status: 503 }
    );
  }
}

// PATCH /api/settings — تعديل فاصل الجلب (5-60 دقيقة)
export async function PATCH(req: NextRequest) {
  try {
    await ensureBooted();
    const body = await req.json();
    const minutes = parseInt(String(body.fetchIntervalMinutes ?? ''), 10);
    if (Number.isNaN(minutes)) {
      return NextResponse.json({ error: 'قيمة غير صالحة' }, { status: 400 });
    }
    const applied = await setFetchInterval(minutes);
    return NextResponse.json({ ok: true, fetchIntervalMinutes: applied });
  } catch (err) {
    console.error('[api/settings PATCH]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'فشل تعديل الإعدادات' }, { status: 500 });
  }
}
