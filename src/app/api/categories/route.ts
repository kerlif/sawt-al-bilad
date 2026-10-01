import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CATEGORIES } from '@/lib/categories';
import { ensureReady } from '@/lib/bootstrap';

// GET /api/categories — الفئات مع عدد أخبار كل فئة
export async function GET() {
  try {
    await ensureReady();
    const grouped = await db.newsItem.groupBy({
      by: ['category'],
      _count: { _all: true },
    });

    const breakingCount = await db.newsItem.count({ where: { isBreaking: true } });
    const total = await db.newsItem.count();

    const counts = new Map(grouped.map((g) => [g.category, g._count._all]));

    return NextResponse.json({
      categories: CATEGORIES.map((c) => ({
        name: c.name,
        fr: c.fr,
        description: c.description,
        count: counts.get(c.name) ?? 0,
      })),
      breakingCount,
      total,
    });
  } catch (err) {
    console.error('[api/categories]', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { categories: [], breakingCount: 0, total: 0, error: 'قاعدة البيانات قيد التهيئة' },
      { status: 503 }
    );
  }
}
