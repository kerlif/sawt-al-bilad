import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureBooted } from '@/lib/scheduler';
import { classifyNews } from '@/lib/classifier';
import { DEFAULT_CATEGORY } from '@/lib/categories';

// POST /api/reclassify — إعادة تصنيف الأخبار المخزنة بالقواعد الجديدة (v2)
// الاستعمال: POST { limit?: 1..50 (افتراضي 20), onlyUnclassified?: true }
// - بلا معاملات: يعيد تصنيف الأحدث أولاً (لمخزون ما قبل v2)
// - onlyUnclassified: يقتصر على «غير مصنّف» (طابور المراجعة)
// النتيجة: تقرير { examined, changed, unchanged, byCategory, methods }
// نمط إداري كسائر مسارات الإدارة في التطبيق: POST فقط ودفعة محدودة،
// بلا خطوات يدوية بعد النشر — يعمل فوراً على أي نسخة.
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    usage: 'POST { "limit": 20, "onlyUnclassified": false }',
    note: 'يعيد تصنيف الأخبار المخزنة بقواعد v2 (أوزان + حدود كلمات + LLM للغامض)، مع تقرير قبل/بعد.',
  });
}

export async function POST(req: NextRequest) {
  try {
    await ensureBooted();
    const body = (await req.json().catch(() => ({}))) as {
      limit?: unknown;
      onlyUnclassified?: unknown;
    };
    const limit = Math.min(
      50,
      Math.max(1, parseInt(String(body.limit ?? '20'), 10) || 20)
    );
    const onlyUnclassified =
      body.onlyUnclassified === 1 || body.onlyUnclassified === true;

    const items = await db.newsItem.findMany({
      where: onlyUnclassified ? { category: DEFAULT_CATEGORY } : {},
      orderBy: { publishedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        summary: true,
        category: true,
        secondaryCategory: true,
        isBreaking: true,
      },
    });

    let changed = 0;
    const byCategory: Record<string, number> = {};
    const methods: Record<string, number> = {};
    for (const item of items) {
      const c = await classifyNews(item.title, item.summary);
      methods[c.method] = (methods[c.method] ?? 0) + 1;
      byCategory[c.category] = (byCategory[c.category] ?? 0) + 1;
      const secondaryChanged =
        (c.secondaryCategory ?? null) !== (item.secondaryCategory ?? null);
      if (
        c.category !== item.category ||
        secondaryChanged ||
        c.isBreaking !== item.isBreaking
      ) {
        await db.newsItem.update({
          where: { id: item.id },
          data: {
            category: c.category,
            secondaryCategory: c.secondaryCategory,
            isBreaking: c.isBreaking,
          },
        });
        changed++;
      }
    }

    return NextResponse.json({
      examined: items.length,
      changed,
      unchanged: items.length - changed,
      byCategory,
      methods,
    });
  } catch (err) {
    console.error('[api/reclassify]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'فشل إعادة التصنيف' }, { status: 500 });
  }
}
