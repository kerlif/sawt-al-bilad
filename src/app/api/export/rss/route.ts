import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ensureReady } from '@/lib/bootstrap';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// GET /api/export/rss — تصدير الأخبار كخلاصة RSS للمطورين
// معلمات: category، lang، limit
export async function GET(req: NextRequest) {
  try {
    await ensureReady();
    const sp = req.nextUrl.searchParams;
    const category = sp.get('category')?.trim() || undefined;
    const lang = sp.get('lang')?.trim() || undefined;
    const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') ?? '50', 10) || 50));

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (lang) where.language = lang;

    const items = await db.newsItem.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
      include: { source: { select: { name: true } } },
    });

    const baseUrl = req.nextUrl.origin;
    const titleSuffix = category ? ` — ${category}` : '';

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">',
      '<channel>',
      `  <title>صوت البلاد${esc(titleSuffix)}</title>`,
      `  <link>${esc(baseUrl)}</link>`,
      '  <description>أخبار جزائرية مُجمَّعة — عناوين وملخصات وروابط المصادر الأصلية</description>',
      `  <language>${lang === 'fr' ? 'fr' : 'ar'}</language>`,
      `  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
      `  <generator>صوت البلاد RSS Export</generator>`,
      ...items.map((n) =>
        [
          '  <item>',
          `    <title>${esc(n.title)}</title>`,
          `    <link>${esc(n.url)}</link>`,
          `    <description>${esc(n.summary)}</description>`,
          `    <pubDate>${n.publishedAt.toUTCString()}</pubDate>`,
          `    <category>${esc(n.category)}</category>`,
          `    <source url="${esc(n.url)}">${esc(n.source.name)}</source>`,
          `    <guid>${esc(n.url)}</guid>`,
          n.imageUrl ? `    <media:thumbnail url="${esc(n.imageUrl)}"/>` : '',
          '  </item>',
        ]
          .filter(Boolean)
          .join('\n')
      ),
      '</channel>',
      '</rss>',
    ].join('\n');

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('[api/export/rss]', err instanceof Error ? err.message : err);
    // خلاصة صالحة وإن كانت فارغة — أفضل من كسر قارئات RSS بخطأ 500
    return new Response(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0"><channel>',
        '  <title>صوت البلاد</title>',
        '  <description>الخدمة قيد التهيئة — أعد المحاولة بعد لحظات</description>',
        '</channel></rss>',
      ].join('\n'),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/rss+xml; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Retry-After': '10',
        },
      }
    );
  }
}
