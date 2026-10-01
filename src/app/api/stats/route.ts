import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureReady } from '@/lib/bootstrap';

// GET /api/stats — إحصائيات لوحة التحكم
export async function GET() {
  try {
    await ensureReady();
    const [
      totalNews,
      breakingNews,
      totalSources,
      activeSources,
      totalBots,
      activeBots,
      subscribers,
      byLanguage,
      lastNews,
    ] = await Promise.all([
      db.newsItem.count(),
      db.newsItem.count({ where: { isBreaking: true } }),
      db.source.count(),
      db.source.count({ where: { isActive: true } }),
      db.botToken.count(),
      db.botToken.count({ where: { isActive: true } }),
      db.botSubscriber.count(),
      db.newsItem.groupBy({ by: ['language'], _count: { _all: true } }),
      db.newsItem.findFirst({ orderBy: { fetchedAt: 'desc' }, select: { fetchedAt: true } }),
    ]);

    return NextResponse.json({
      totalNews,
      breakingNews,
      totalSources,
      activeSources,
      totalBots,
      activeBots,
      subscribers,
      arabicNews: byLanguage.find((l) => l.language === 'ar')?._count._all ?? 0,
      frenchNews: byLanguage.find((l) => l.language === 'fr')?._count._all ?? 0,
      lastFetch: lastNews?.fetchedAt ?? null,
    });
  } catch (err) {
    console.error('[api/stats]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'قاعدة البيانات قيد التهيئة' }, { status: 503 });
  }
}
