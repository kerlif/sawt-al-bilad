import { NextResponse } from "next/server";
import { db } from '@/lib/db';
import { ensureReady } from '@/lib/bootstrap';

// GET /api — فحص صحة الخدمة (مفيد لتشخيص النشر بعد كل تحديث)
export async function GET() {
  try {
    await ensureReady();
    const [sources, news] = await Promise.all([
      db.source.count(),
      db.newsItem.count(),
    ]);
    return NextResponse.json({
      ok: true,
      service: 'صوت البلاد',
      version: '1.4.2',
      db: { ok: true, sources, news },
    });
  } catch (err) {
    console.error('[api/health]', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { ok: false, service: 'صوت البلاد', version: '1.4.2', db: { ok: false } },
      { status: 500 }
    );
  }
}
