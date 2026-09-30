import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CATEGORIES } from '@/lib/categories';

// GET /api/categories — الفئات مع عدد أخبار كل فئة
export async function GET() {
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
}
