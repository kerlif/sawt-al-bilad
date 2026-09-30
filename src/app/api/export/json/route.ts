import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/export/json — تصدير الأخبار JSON للمطورين
// معلمات: category، lang، limit (افتراضي 50، أقصى 200)
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const category = sp.get('category')?.trim() || undefined;
  const lang = sp.get('lang')?.trim() || undefined;
  const limit = Math.min(200, Math.max(1, parseInt(sp.get('limit') ?? '50', 10) || 50));

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (lang) where.language = lang;

  const items = await db.newsItem.findMany({
    where,
    orderBy: { publishedAt: 'desc' },
    take: limit,
    include: { source: { select: { name: true, siteUrl: true } } },
  });

  return NextResponse.json(
    {
      meta: {
        name: 'صوت البلاد — وصلة JSON للمطورين',
        license:
          'العناوين والملخصات فقط (≤40 كلمة) مع روابط المصادر — النصوص الكاملة محفوظة لأصحابها',
        count: items.length,
        generatedAt: new Date().toISOString(),
      },
      items: items.map((n) => ({
        title: n.title,
        summary: n.summary,
        url: n.url,
        imageUrl: n.imageUrl,
        publishedAt: n.publishedAt,
        language: n.language,
        category: n.category,
        isBreaking: n.isBreaking,
        source: n.source.name,
        sourceSite: n.source.siteUrl,
      })),
    },
    { headers: { 'Access-Control-Allow-Origin': '*' } }
  );
}
