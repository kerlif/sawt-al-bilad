import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureReady } from '@/lib/bootstrap';

// GET /api/sources — قائمة المصادر
export async function GET() {
  try {
    // ضمان جاهزية الجداول (حرج على بيئات serverless ذات الإقلاع البارد)
    await ensureReady();
    const sources = await db.source.findMany({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      include: { _count: { select: { items: true } } },
    });
    return NextResponse.json({
      sources: sources.map((s) => ({
        id: s.id,
        name: s.name,
        rssUrl: s.rssUrl,
        siteUrl: s.siteUrl,
        language: s.language,
        type: s.type,
        isActive: s.isActive,
        lastFetchAt: s.lastFetchAt,
        lastStatus: s.lastStatus,
        itemCount: s._count.items,
      })),
    });
  } catch (err) {
    console.error('[api/sources GET]', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: 'قاعدة البيانات قيد التهيئة — أعد المحاولة بعد لحظات' },
      { status: 503 }
    );
  }
}

// POST /api/sources — إضافة مصدر جديد
export async function POST(req: NextRequest) {
  try {
    await ensureReady();
    const body = await req.json();
    const name = String(body.name ?? '').trim();
    const rssUrl = String(body.rssUrl ?? '').trim();
    const language = body.language === 'fr' ? 'fr' : 'ar';
    const siteUrl =
      String(body.siteUrl ?? '').trim() ||
      (() => {
        try {
          const u = new URL(rssUrl);
          return `${u.protocol}//${u.host}`;
        } catch {
          return rssUrl;
        }
      })();

    if (!name || !rssUrl) {
      return NextResponse.json(
        { error: 'الاسم ورابط الخلاصة مطلوبان' },
        { status: 400 }
      );
    }
    try {
      new URL(rssUrl);
    } catch {
      return NextResponse.json({ error: 'رابط الخلاصة غير صالح' }, { status: 400 });
    }

    const exists = await db.source.findUnique({ where: { rssUrl } });
    if (exists) {
      return NextResponse.json({ error: 'هذا المصدر مضاف سابقاً' }, { status: 409 });
    }

    const source = await db.source.create({
      data: { name, rssUrl, siteUrl, language, type: 'rss', isActive: true },
    });
    return NextResponse.json({ ok: true, source }, { status: 201 });
  } catch (err) {
    console.error('[api/sources POST]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'فشل إضافة المصدر' }, { status: 500 });
  }
}
