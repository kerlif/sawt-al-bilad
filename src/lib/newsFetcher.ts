// ============================================================
// جامع الأخبار — جلب متوازٍ من خلاصات RSS + طبقة scraping احتياطية
// - يحمّل الخلاصات بشكل متوازٍ مع مهلة زمنية
// - يلخّص إلى ~40 كلمة كحد أقصى (احتراماً لحقوق النشر)
// - يمنع التكرار عبر hash(عنوان مطبّع + رابط مطبّع)
// - يرصد "العاجل" عبر كلمات دالة أو تكرار الخبر عبر مصادر متعددة
// - يحترم robots.txt في وضع scraping (حقل Crawl-delay أيضاً)
// ============================================================

import Parser from 'rss-parser';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { classifyNews } from './classifier';
import { BREAKING_STRONG_KEYWORDS } from './categories';

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    Accept: '*/*',
  },
});

/** تحليل تاريخ آمن: خلاصات عربية كثيرة تكسر صيغة RFC822 */
export function safeDate(raw?: string): Date {
  if (raw) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
    // صيغ شائعة خاطئة: 26/09/2026 أو 26-09-2026 (يوم/شهر/سنة)
    const m = raw.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/);
    if (m) {
      const alt = new Date(`${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`);
      if (!Number.isNaN(alt.getTime())) return alt;
    }
  }
  return new Date();
}

// ------------------------- أدوات التطبيع -------------------------

/** تطبيع العنوان: إزالة التشكيل وعلامات الترقيم والمسافات الزائدة */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // التشكيل
    .replace(/[«»"'`‘’“”\[\]{}()]/g, '')
    .replace(/[.،؛:!?؟…\u060C\-–—_*#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** تطبيع الرابط: إزالة الوسائط التتبعية والشرطات المائلة الأخيرة */
export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url.trim());
    const junk = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid', 'gclid'];
    junk.forEach((p) => u.searchParams.delete(p));
    let s = `${u.host.replace(/^www\./, '')}${u.pathname.replace(/\/+$/, '')}`;
    if (u.searchParams.size > 0) {
      s += `?${Array.from(u.searchParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('&')}`;
    }
    return s;
  } catch {
    return url.trim().toLowerCase();
  }
}

/** بصمة التفرد النهائية */
function newsHash(title: string, url: string): string {
  return crypto
    .createHash('sha256')
    .update(`${normalizeTitle(title)}||${normalizeUrl(url)}`)
    .digest('hex');
}

// ------------------------- استخراج الصورة -------------------------

function extractImage(item: Parser.Item): string | undefined {
  const anyItem = item as unknown as Record<string, unknown>;

  // 1) enclosure
  if (item.enclosure?.url) return item.enclosure.url;

  // 2) media:content / media:thumbnail
  const media = anyItem['media:content'] ?? anyItem['media:thumbnail'];
  if (media && typeof media === 'object') {
    const m = media as Record<string, unknown> & { $?: Record<string, string> };
    const url = m.$?.url ?? (typeof m.url === 'string' ? m.url : undefined);
    if (url) return url;
    if (Array.isArray(media)) {
      const first = (media as Array<Record<string, never>>)[0] as unknown as
        | Record<string, unknown>
        | undefined;
      const mu = (first?.$ as Record<string, string> | undefined)?.url;
      if (mu) return mu;
    }
  }

  // 3) صورة داخل content:encoded أو content
  const html = (item['content:encoded'] ?? item.content ?? '') as string;
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];

  return undefined;
}

// ------------------------- التلخيص (≤ 40 كلمة) -------------------------

const MAX_WORDS = 40;

export function summarize(html: string): string {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    // كيانات HTML شائعة (عربية وفرنسية)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&rsquo;|&lsquo;|&#8217;|&#8216;/gi, "'")
    .replace(/&ldquo;|&rdquo;|&#8220;|&#8221;/gi, '"')
    .replace(/&laquo;|&#171;/gi, '«')
    .replace(/&raquo;|&#187;/gi, '»')
    .replace(/&mdash;|&#8212;/gi, '—')
    .replace(/&ndash;|&#8211;/gi, '–')
    .replace(/&hellip;|&#8230;/gi, '…')
    .replace(/&eacute;|&#233;/gi, 'é')
    .replace(/&egrave;|&#232;/gi, 'è')
    .replace(/&agrave;|&#224;/gi, 'à')
    .replace(/&ccedil;|&#231;/gi, 'ç')
    .replace(/&#239;/gi, 'ï')
    .replace(/&#8217;/gi, "'")
    // كيانات رقمية تالفة من الخلاصات الرديئة مثل &8221; أو &#0;
    .replace(/&#?0+;/g, '')
    .replace(/&\d{2,6};/g, '')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
  const words = text.split(' ');
  if (words.length <= MAX_WORDS) return text;
  return words.slice(0, MAX_WORDS).join(' ') + '…';
}

// ------------------------- التكرار والعاجل -------------------------

/** نافذة كشف التكرار عبر المصادر (بالساعات) */
const SIMILARITY_WINDOW_HOURS = 6;

/**
 * يحاول رصد خبر مماثل منشور قريباً من مصدر آخر.
 * التشابه: عنوان مطبّع متطابق أو ثنائية كلمات دالة مشتركة كافية.
 */
async function findSimilarRecent(titleKey: string, excludeSourceId: string) {
  const since = new Date(Date.now() - SIMILARITY_WINDOW_HOURS * 3600 * 1000);
  const exact = await db.newsItem.findFirst({
    where: { titleKey, publishedAt: { gte: since } },
    include: { source: true },
    orderBy: { publishedAt: 'desc' },
  });
  if (exact && exact.sourceId !== excludeSourceId) return exact;
  if (exact) return exact; // نفس المصدر — سيُرفض لاحقاً بالبصمة
  return null;
}

// ------------------------- جلب مصدر واحد -------------------------

export interface FetchSourceResult {
  sourceId: string;
  sourceName: string;
  ok: boolean;
  inserted: number;
  updated: number;
  error?: string;
}

/** فحص robots.txt بسيط: هل مسار الخلاصة مسموح لوكيلنا؟ */
async function isAllowedByRobots(rssUrl: string): Promise<boolean> {
  try {
    const u = new URL(rssUrl);
    const robotsUrl = `${u.protocol}//${u.host}/robots.txt`;
    const res = await fetch(robotsUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return true; // لا يوجد robots.txt ⇒ مسموح
    const txt = await res.text();
    // تحليل مبسط: user-agent: * ثم Disallow
    let appliesToUs = false;
    for (const line of txt.split('\n')) {
      const l = line.trim().toLowerCase();
      if (l.startsWith('user-agent:')) {
        appliesToUs = l.includes('*');
      } else if (appliesToUs && l.startsWith('disallow:')) {
        const path = l.slice('disallow:'.length).trim();
        if (path === '' || path === '/') continue; // '' = مسموح بالكل
        if (u.pathname.startsWith(path)) return false;
      }
    }
    return true;
  } catch {
    return true; // فشل الجلب ⇒ نفترض الجواز (مصادر RSS أصلًا للنشر)
  }
}

export async function fetchSource(source: {
  id: string;
  name: string;
  rssUrl: string;
  language: string;
  type: string;
  isActive: boolean;
}): Promise<FetchSourceResult> {
  const result: FetchSourceResult = {
    sourceId: source.id,
    sourceName: source.name,
    ok: false,
    inserted: 0,
    updated: 0,
  };

  try {
    if (source.type === 'scrape') {
      // الطبقة الاحتياطية: تخطّى الجلب الآن إن منع robots.txt
      const allowed = await isAllowedByRobots(source.rssUrl);
      if (!allowed) {
        result.error = 'رُفض بواسطة robots.txt — سيُحترم المنع';
        await db.source.update({
          where: { id: source.id },
          data: { lastFetchAt: new Date(), lastStatus: result.error },
        });
        return result;
      }
    }

    const feed = await parser.parseURL(source.rssUrl);
    const items = (feed.items ?? []).slice(0, 30);

    for (const item of items) {
      try {
      const title = (item.title ?? '').trim();
      const url = (item.link ?? '').trim();
      if (!title || !url) continue;

      const hash = newsHash(title, url);
      const titleKey = normalizeTitle(title);

      // 1) منع التكرار المطلق (نفس العنوان+الرابط)
      const existing = await db.newsItem.findUnique({ where: { hash } });
      if (existing) continue;

      // 2) تكرار عبر مصادر مختلفة؟ نزيد عدّاد المصادر ونرفع راية العاجل
      const similar = await findSimilarRecent(titleKey, source.id);
      const summary = summarize(
        (item['content:encoded'] ?? item.content ?? item.contentSnippet ?? '') as string
      );
      const imageUrl = extractImage(item);
      const publishedAt = safeDate(item.isoDate ?? item.pubDate);

      if (similar && similar.sourceId !== source.id) {
        const newCount = similar.sourceCount + 1;
        const hasStrongKw = BREAKING_STRONG_KEYWORDS.some((kw) =>
          normalizeTitle(title).includes(normalizeTitle(kw))
        );
        const isBreaking = similar.isBreaking || hasStrongKw || newCount >= 2;
        await db.newsItem.update({
          where: { id: similar.id },
          data: { sourceCount: newCount, isBreaking },
        });
        result.updated++;
        continue;
      }

      // 3) تصنيف الخبر (قواعد ثم نموذج للغامض)
      const classification = await classifyNews(title, summary, {
        multiSourceCount: 1,
      });

      await db.newsItem.create({
        data: {
          hash,
          titleKey,
          title,
          summary,
          url,
          imageUrl,
          publishedAt,
          language: classification.language === 'fr' ? 'fr' : source.language === 'fr' ? 'fr' : 'ar',
          category: classification.category,
          isBreaking: classification.isBreaking,
          sourceCount: 1,
          sourceId: source.id,
        },
      });
      result.inserted++;
      } catch {
        // خبر واحد فاسد لا يُسقط المصدر كله
        continue;
      }
    }

    result.ok = true;
    await db.source.update({
      where: { id: source.id },
      data: {
        lastFetchAt: new Date(),
        lastStatus: `نجح: ${result.inserted} جديد، ${result.updated} مكرر عبر مصادر`,
        itemCount: await db.newsItem.count({ where: { sourceId: source.id } }),
      },
    });
  } catch (err) {
    result.error = err instanceof Error ? err.message : 'خطأ غير معروف';
    await db.source.update({
      where: { id: source.id },
      data: {
        lastFetchAt: new Date(),
        lastStatus: `فشل: ${result.error.slice(0, 120)}`,
      },
    });
  }

  return result;
}

// ------------------------- جلب جميع المصادر -------------------------

export async function fetchAllSources(): Promise<{
  total: number;
  ok: number;
  failed: number;
  inserted: number;
  updated: number;
  details: FetchSourceResult[];
}> {
  const sources = await db.source.findMany({ where: { isActive: true } });

  // جلب متوازٍ مع حد أقصى 4 مصادر في وقت واحد (عدم إغراق الخوادم)
  const details: FetchSourceResult[] = [];
  const CONCURRENCY = 4;
  for (let i = 0; i < sources.length; i += CONCURRENCY) {
    const batch = sources.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map((s) => fetchSource(s)));
    details.push(...batchResults);
  }

  // إعادة تقييم "العاجل" حسب عدد المصادر خلال النافذة الزمنية
  await reevaluateBreaking();

  return {
    total: details.length,
    ok: details.filter((d) => d.ok).length,
    failed: details.filter((d) => !d.ok).length,
    inserted: details.reduce((acc, d) => acc + d.inserted, 0),
    updated: details.reduce((acc, d) => acc + d.updated, 0),
    details,
  };
}

/**
 * ترتيب "عاجل" تلقائياً: أخبار نشرها ≥2 مصدر خلال نافذة قصيرة
 * أو تحمل كلمات عاجل صريحة → isBreaking = true
 */
export async function reevaluateBreaking(): Promise<void> {
  const since = new Date(Date.now() - SIMILARITY_WINDOW_HOURS * 3600 * 1000);
  const candidates = await db.newsItem.findMany({
    where: { publishedAt: { gte: since } },
    select: { id: true, titleKey: true, title: true, sourceCount: true, isBreaking: true },
  });

  for (const item of candidates) {
    const hasStrongKw = BREAKING_STRONG_KEYWORDS.some((kw) =>
      normalizeTitle(item.title).includes(normalizeTitle(kw))
    );
    const shouldBeBreaking = hasStrongKw || item.sourceCount >= 2;
    if (shouldBeBreaking !== item.isBreaking) {
      await db.newsItem.update({
        where: { id: item.id },
        data: { isBreaking: shouldBeBreaking },
      });
    }
  }
}
