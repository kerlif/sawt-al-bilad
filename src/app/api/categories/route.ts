import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CATEGORIES, DEFAULT_CATEGORY } from '@/lib/categories';
import { ensureReady } from '@/lib/bootstrap';
import { ensureNewsFresh } from '@/lib/autofill';

// GET /api/categories — الفئات مع عدد أخبار كل فئة
// شفاء ذاتي: تُجلب الطبعة داخل الطلب إن كانت هذه النسخة (serverless) فارغة
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureReady();
    await ensureNewsFresh();
    // عدد كل تبويب = أخبار فئتها الأولى + أخبار فئتها الثانوية
    // (الخبر المختلط يُحسب في تبويبيه معاً)
    const [primary, secondary] = await Promise.all([
      db.newsItem.groupBy({
        by: ['category'],
        _count: { _all: true },
      }),
      db.newsItem.groupBy({
        by: ['secondaryCategory'],
        _count: { _all: true },
      }),
    ]);

    const breakingCount = await db.newsItem.count({ where: { isBreaking: true } });
    const total = await db.newsItem.count();

    const counts = new Map<string, number>();
    for (const g of primary) counts.set(g.category, g._count._all);
    for (const g of secondary) {
      if (!g.secondaryCategory) continue;
      counts.set(
        g.secondaryCategory,
        (counts.get(g.secondaryCategory) ?? 0) + g._count._all
      );
    }
    const unclassifiedCount = counts.get(DEFAULT_CATEGORY) ?? 0;

    return NextResponse.json(
      {
        categories: CATEGORIES.map((c) => ({
          name: c.name,
          fr: c.fr,
          description: c.description,
          count: counts.get(c.name) ?? 0,
        })),
        breakingCount,
        total,
        // «غير مصنّف» لا يظهر تبويباً للقراء — يُعرض لغرفة التحرير فقط
        unclassifiedCount,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('[api/categories]', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { categories: [], breakingCount: 0, total: 0, unclassifiedCount: 0, error: 'قاعدة البيانات قيد التهيئة' },
      { status: 503 }
    );
  }
}
