import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureBooted } from '@/lib/scheduler';

// GET /api/news — قائمة الأخبار مع بحث وفرز وفلترة
// معلمات: category، search، lang (ar|fr)، sort (newest|oldest|breaking)، page، limit، breaking=1
export async function GET(req: NextRequest) {
  try {
    await ensureBooted();
    const sp = req.nextUrl.searchParams;
    const category = sp.get('category')?.trim() || undefined;
    const search = sp.get('search')?.trim() || undefined;
    const lang = sp.get('lang')?.trim() || undefined;
    const sort = sp.get('sort')?.trim() || 'newest';
    const onlyBreaking = sp.get('breaking') === '1';
    const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10) || 1);
    const limit = Math.min(60, Math.max(1, parseInt(sp.get('limit') ?? '24', 10) || 24));

    const where: Record<string, unknown> = {};
    if (category && category !== 'الكل') where.category = category;
    if (lang && lang !== 'all') where.language = lang;
    if (onlyBreaking) where.isBreaking = true;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { summary: { contains: search } },
      ];
    }

    let orderBy: Record<string, string>[] = [{ publishedAt: 'desc' }];
    if (sort === 'oldest') orderBy = [{ publishedAt: 'asc' }];
    if (sort === 'breaking') orderBy = [{ isBreaking: 'desc' }, { sourceCount: 'desc' }, { publishedAt: 'desc' }];

    const [items, total] = await Promise.all([
      db.newsItem.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { source: { select: { name: true, id: true } } },
      }),
      db.newsItem.count({ where }),
    ]);

    return NextResponse.json({
      items: items.map((n) => ({
        id: n.id,
        title: n.title,
        summary: n.summary,
        url: n.url,
        imageUrl: n.imageUrl,
        publishedAt: n.publishedAt,
        language: n.language,
        category: n.category,
        isBreaking: n.isBreaking,
        sourceCount: n.sourceCount,
        sourceName: n.source.name,
      })),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error('[api/news]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'فشل تحميل الأخبار' }, { status: 500 });
  }
}
