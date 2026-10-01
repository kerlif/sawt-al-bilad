'use client';

// ============================================================
// «صوت البلاد» — الصفحة الأولى للجريدة
// شريط عاجل هادئ + صفحة مستقلة لكل قسم + بحث وفرز + أعمدة مطبوعة
// + وضع ليلي + غرفة تحرير + طباعة A4 + زر العودة للأعلى
// التنقل بين الأقسام عبر روابط «#/category/القسم» — لكل قسم صفحته
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import Masthead from '@/components/newspaper/Masthead';
import BreakingTicker from '@/components/newspaper/BreakingTicker';
import ArticleCard, { NewsItemData } from '@/components/newspaper/ArticleCard';
import AdminPanel from '@/components/newspaper/AdminPanel';
import FetchProgress, { FetchProgressState } from '@/components/newspaper/FetchProgress';
import { FlagDZ, FlagFR } from '@/components/newspaper/flags';
import {
  BookOpenIcon,
  ChevronUpIcon,
  CpuIcon,
  FileTextIcon,
  FlameIcon,
  GlobeIcon,
  LandmarkIcon,
  MoonIcon,
  NewspaperIcon,
  PrinterIcon,
  RefreshIcon,
  ScaleIcon,
  SearchIcon,
  SunIcon,
  TrendingUpIcon,
  TrophyIcon,
  UsersIcon,
  XIcon,
} from '@/components/newspaper/icons';
import { CATEGORIES } from '@/lib/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface CategoryInfo {
  name: string;
  fr: string;
  count: number;
}

const SORTS = [
  { key: 'newest', label: 'الأحدث' },
  { key: 'breaking', label: 'العاجل أولاً' },
  { key: 'oldest', label: 'الأقدم' },
] as const;

const LANGS: { key: string; label: string; flag?: 'dz' | 'fr' }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'ar', label: 'عربي', flag: 'dz' },
  { key: 'fr', label: 'فرنسي', flag: 'fr' },
];

/** أيقونة كل قسم */
const CATEGORY_ICONS: Record<string, (p: { size?: number; className?: string }) => React.ReactNode> = {
  'رئاسيات ومناصب': LandmarkIcon,
  'سياسة': ScaleIcon,
  'اقتصاد': TrendingUpIcon,
  'علاقات دولية': GlobeIcon,
  'مجتمع': UsersIcon,
  'رياضة': TrophyIcon,
  'علوم وتكنولوجيا': CpuIcon,
  'ثقافة وفنون': BookOpenIcon,
  'عاجل': FlameIcon,
};

const BREAKING_DESC =
  'أخبار تحمل راية العاجل: كلمات دالة صريحة، أو رصد الخبر نفسه عبر مصادر متعددة خلال نافذة زمنية قصيرة.';

/** زر العودة إلى أعلى الصفحة */
function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 420);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="العودة إلى أعلى الصفحة"
      title="العودة إلى أعلى الصفحة"
      className={`no-print fixed bottom-5 left-5 z-50 flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink bg-ink text-paper shadow-lg transition-all duration-300 hover:border-vermillion hover:bg-vermillion ${
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <ChevronUpIcon size={20} />
    </button>
  );
}

export default function NewspaperPage() {
  const { toast } = useToast();

  const [items, setItems] = useState<NewsItemData[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [breakingCount, setBreakingCount] = useState(0);
  const [activeSources, setActiveSources] = useState(0);

  const [activeCat, setActiveCat] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState<string>('newest');
  const [lang, setLang] = useState<string>('all');
  const [nightMode, setNightMode] = useState(false);

  const [adminOpen, setAdminOpen] = useState(false);

  // شريط تقدم الجلب الحي (جلب ذاتي عند الفتح + زر التحديث)
  const [fetchState, setFetchState] = useState<FetchProgressState | null>(null);
  const fetchBusyRef = useRef(false);

  const autoAttemptsRef = useRef(0);
  const firstRenderRef = useRef(true);

  // ---------- التنقل بين الصفحات (الرئيسية / صفحة قسم) عبر الهاش ----------
  useEffect(() => {
    const apply = () => {
      const h = decodeURIComponent(window.location.hash.replace(/^#\/?/, ''));
      if (h.startsWith('category/')) setActiveCat(h.slice('category/'.length).trim());
      else setActiveCat('');
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  // الانتقال إلى أعلى الصفحة عند فتح قسم جديد
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    setPage(1);
  }, [activeCat]);

  // الوضع الليلي (sepia/dark متناسق مع الهوية)
  useEffect(() => {
    const saved = localStorage.getItem('sawt-night-mode') === '1';
    setNightMode(saved);
    document.documentElement.classList.toggle('dark', saved);
  }, []);

  const toggleNight = () => {
    const next = !nightMode;
    setNightMode(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('sawt-night-mode', next ? '1' : '0');
  };

  // الفئات
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories ?? []);
        setBreakingCount(d.breakingCount ?? 0);
      })
      .catch(() => {});
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => setActiveSources(d.activeSources ?? 0))
      .catch(() => {});
  }, [refreshKey]);

  // الأخبار
  const loadNews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '24',
        sort,
        lang,
      });
      if (activeCat === 'عاجل') params.set('breaking', '1');
      else if (activeCat) params.set('category', activeCat);
      if (search) params.set('search', search);
      const res = await fetch(`/api/news?${params.toString()}`);
      const data = await res.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } catch {
      toast({ title: 'تعذر تحميل الأخبار — تحقق من الاتصال', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, sort, lang, activeCat, search, toast]);

  useEffect(() => {
    loadNews();
  }, [loadNews, refreshKey]);

  // تحديث تلقائي خفيف كل دقيقتين (للمزامنة مع دورات الجلب)
  useEffect(() => {
    const t = setInterval(() => setRefreshKey((k) => k + 1), 120000);
    return () => clearInterval(t);
  }, []);

  // ---------- دورة الجلب مع شريط تقدم حي ----------
  // تُستخدم في الحالتين: الجلب الذاتي عند فتح الجريدة، وزر «تحديث» الثابت
  // تطلب نسخة بث تدريجي (NDJSON) فتعرض نسبة التقدم الحقيقية لكل مصدر
  const runFetch = useCallback(async () => {
    if (fetchBusyRef.current) return;
    fetchBusyRef.current = true;
    setFetchState({ done: 0, total: 0, source: '', inserted: 0, finished: false });
    let inserted = 0;
    try {
      const res = await fetch('/api/fetch', {
        method: 'POST',
        headers: { Accept: 'application/x-ndjson' },
      });
      const ct = res.headers.get('content-type') ?? '';
      if (res.ok && res.body && ct.includes('application/x-ndjson')) {
        // قراءة البث سطراً سطراً وتحديث شريط التقدم فوراً
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const ev = JSON.parse(line);
              if (ev.type === 'progress') {
                setFetchState({
                  done: ev.done ?? 0,
                  total: ev.total ?? 0,
                  source: ev.sourceName ?? '',
                  inserted: 0,
                  finished: false,
                });
              } else if (ev.type === 'done') {
                inserted = ev.inserted ?? 0;
              }
            } catch {
              // سطر تالف — يُتجاهل ولا يُسقط البث
            }
          }
        }
      } else if (!res.ok) {
        // الخادم لم يجهز بعد (إقلاع بارد) — نُبلغ ثم نُعيد المحاولة لاحقاً
        throw new Error(`fetch cycle failed: ${res.status}`);
      } else {
        // احتياط: استضافة لا تدعم البث — نتيجة مجمعة واحدة
        const data = await res.json();
        inserted = data.inserted ?? 0;
      }
      setFetchState((s) => (s ? { ...s, finished: true, inserted } : s));
      // لحظة عرض رسالة الإتمام ثم إخفاء الشريط وتجديد العدد
      setTimeout(() => {
        setFetchState(null);
        setRefreshKey((k) => k + 1);
      }, 900);
    } catch {
      setFetchState(null);
      toast({ title: 'تعذر الجلب — تحقق من الاتصال', variant: 'destructive' });
    } finally {
      fetchBusyRef.current = false;
    }
  }, [toast]);

  // ---------- جلب تلقائي ذكي عند الفراغ أو القِدم ----------
  // فور فتح أي مستخدم للرابط: إن كانت الطبعة فارغة أو أقدم من 30 دقيقة
  // انطلق جلب ذاتي مع شريط تقدم أعلى الصفحة. وحتى لو أُجيبنا من نسخة
  // خادم فارغة (serverless) تُعاد المحاولة حتى 3 مرات — ثم يبقى
  // زرّا «تحديث» و«إعادة المحاولة» متاحين يدوياً دائماً.
  useEffect(() => {
    if (loading || fetchState) return; // لا تتراكم المحاولات أثناء تحميل أو شريط نشط
    const stale =
      items.length > 0 &&
      items[0].publishedAt &&
      Date.now() - new Date(items[0].publishedAt).getTime() > 30 * 60 * 1000;
    if (items.length === 0 && autoAttemptsRef.current >= 3) return; // استُنفدت المحاولات — الإعادة أصبحت يدوية
    if (items.length === 0 || stale) {
      autoAttemptsRef.current += 1;
      // مهلة قصيرة بين المحاولات لمنح خادماً جديداً فرصة الإقلاع والشفاء
      const delay = autoAttemptsRef.current > 1 ? 1500 : 0;
      const t = setTimeout(() => runFetch(), delay);
      return () => clearTimeout(t);
    }
    autoAttemptsRef.current = 0; // نجحت القراءة — صفّر العدّاد
  }, [items, loading, fetchState, runFetch]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const navCategories = [
    { name: 'عاجل', count: breakingCount },
    ...categories,
  ];

  const isHome = !activeCat;
  const fetching = fetchState !== null;
  const catIcon = activeCat ? CATEGORY_ICONS[activeCat] ?? NewspaperIcon : NewspaperIcon;
  const CatIcon = catIcon as (p: { size?: number; className?: string }) => React.ReactNode;
  const catDescription =
    activeCat === 'عاجل'
      ? BREAKING_DESC
      : CATEGORIES.find((c) => c.name === activeCat)?.description ?? '';

  const featured = isHome && page === 1 && !search && sort === 'newest' ? items[0] : undefined;
  const rest = featured ? items.slice(1) : items;

  // أثناء التحميل الأول على نسخة خادم باردة قد يستغرق الشفاء الذاتي ثوانٍ —
  // نعرض شريط التحضير غير المحدد فوراً حتى لا تبدو الصفحة معلقة
  const initialPreparing = loading && items.length === 0 && fetchState === null;
  const progressState: FetchProgressState | null =
    fetchState ??
    (initialPreparing
      ? { done: 0, total: 0, source: '', inserted: 0, finished: false }
      : null);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="mx-auto w-full max-w-7xl flex-1 px-3 md:px-6">
        <Masthead totalNews={total} activeSources={activeSources} />

        <BreakingTicker refreshKey={refreshKey} />

        {/* ---------- شريط الأقسام الثابت — كل قسم صفحة مستقلة + زر تحديث مثبت ---------- */}
        <nav
          aria-label="فئات الجريدة"
          className="no-print sticky top-0 z-40 mt-3 border-y border-rule bg-paper/95 backdrop-blur-sm"
        >
          <div className="flex items-stretch">
            <div className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto py-1.5 px-1 admin-scroll">
              <a
                href="#/"
                aria-current={isHome ? 'page' : undefined}
                className={`shrink-0 px-3 py-1 text-base md:text-lg font-headline transition-colors border-r border-rule/50 ${
                  isHome ? 'bg-ink text-paper' : 'hover:bg-paper-deep'
                }`}
              >
                الرئيسية
              </a>
              {navCategories.map((c) => {
                const active = activeCat === c.name;
                const isBreaking = c.name === 'عاجل';
                const Icon = CATEGORY_ICONS[c.name];
                return (
                  <a
                    key={c.name}
                    href={`#/category/${encodeURIComponent(c.name)}`}
                    aria-current={active ? 'page' : undefined}
                    className={`shrink-0 px-3 py-1 text-base md:text-lg font-headline transition-colors border-r border-rule/50 last:border-l inline-flex items-center gap-1.5 ${
                      active
                        ? 'bg-ink text-paper'
                        : isBreaking
                          ? 'text-vermillion hover:bg-vermillion/10'
                          : 'hover:bg-paper-deep'
                    }`}
                  >
                    {Icon && <Icon size={14} />}
                    {c.name}
                    <span className="mr-1 text-xs opacity-70">({c.count})</span>
                  </a>
                );
              })}
            </div>

            {/* زر التحديث الفوري — مثبت أعلى الصفحة دائماً دون فتح غرفة التحرير */}
            <button
              onClick={runFetch}
              disabled={fetching}
              title="تحديث الأخبار الآن — جلب فوري من كل المصادر"
              aria-label="تحديث الأخبار الآن"
              className="shrink-0 inline-flex items-center gap-1.5 border-r border-rule/50 px-3 font-headline text-base md:text-lg transition-colors hover:bg-vermillion hover:text-paper disabled:pointer-events-none disabled:opacity-60"
            >
              <RefreshIcon size={15} className={fetching ? 'animate-spin' : ''} />
              <span className="hidden min-[420px]:inline">تحديث</span>
            </button>
          </div>
        </nav>

        {/* ---------- ترويسة صفحة القسم ---------- */}
        {!isHome && (
          <section className="mt-4 border-y-2 border-ink bg-card/60 py-5 text-center">
            <div className="inline-flex items-center gap-2.5">
              <CatIcon size={30} className="text-vermillion" />
              <h2 className="font-headline text-3xl md:text-4xl font-bold text-ink">
                {activeCat}
              </h2>
            </div>
            {catDescription && (
              <p className="mx-auto mt-2 max-w-2xl px-4 text-sm md:text-base text-muted-foreground leading-relaxed">
                {catDescription}
              </p>
            )}
            <div className="mt-2 text-xs opacity-70">
              {total.toLocaleString('ar-DZ')} خبر في هذه الصفحة — تُحدَّث تلقائياً من المصادر
            </div>
          </section>
        )}

        {/* ---------- أدوات البحث والفرز ---------- */}
        <div className="no-print mt-3 flex flex-wrap items-center gap-2">
          <form onSubmit={submitSearch} className="relative flex flex-1 min-w-56 gap-1">
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
              <SearchIcon size={15} />
            </span>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث في العناوين والملخصات…"
              className="bg-card border--input pr-8"
              aria-label="بحث"
            />
            <Button type="submit" size="sm" variant="outline" className="font-headline">
              ابحث
            </Button>
            {(search || activeCat || lang !== 'all') && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSearch('');
                  setSearchInput('');
                  setLang('all');
                  setSort('newest');
                  setPage(1);
                  if (activeCat) window.location.hash = '#/';
                }}
                title="مسح الفلاتر والعودة للرئيسية"
                aria-label="مسح الفلاتر"
              >
                <XIcon size={14} />
              </Button>
            )}
          </form>

          <div className="flex items-center gap-1 text-sm" role="group" aria-label="الفرز">
            <span className="opacity-60">الترتيب:</span>
            {SORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => {
                  setSort(s.key);
                  setPage(1);
                }}
                className={`px-2 py-1 border transition-colors ${
                  sort === s.key
                    ? 'border-ink bg-ink text-paper'
                    : 'border-rule hover:bg-paper-deep'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 text-sm" role="group" aria-label="اللغة">
            {LANGS.map((l) => (
              <button
                key={l.key}
                onClick={() => {
                  setLang(l.key);
                  setPage(1);
                }}
                className={`px-2 py-1 border transition-colors inline-flex items-center gap-1.5 ${
                  lang === l.key
                    ? 'border-ink bg-ink text-paper'
                    : 'border-rule hover:bg-paper-deep'
                }`}
              >
                {l.flag === 'dz' && <FlagDZ className="h-3 w-[18px] rounded-[2px] border border-current/30" />}
                {l.flag === 'fr' && <FlagFR className="h-3 w-[18px] rounded-[2px] border border-current/30" />}
                {l.label}
              </button>
            ))}
          </div>

          <button
            onClick={toggleNight}
            className="px-2.5 py-1.5 border border-rule hover:bg-paper-deep transition-colors inline-flex items-center gap-1.5"
            title="وضع القراءة الليلية (ورق مغدّق)"
            aria-label="تبديل الوضع الليلي"
          >
            {nightMode ? <SunIcon size={14} /> : <MoonIcon size={14} />}
            {nightMode ? 'نهاري' : 'ليلي'}
          </button>

          <button
            onClick={() => window.print()}
            className="px-2.5 py-1.5 border border-rule hover:bg-vermillion hover:text-paper hover:border-vermillion transition-colors inline-flex items-center gap-1.5"
            title="طباعة الصفحة الحالية أو حفظها PDF بحجم A4"
          >
            <PrinterIcon size={14} />
            تصدير PDF
          </button>
        </div>

        {/* ---------- المحتوى: أعمدة الجريدة ---------- */}
        <main className="mt-4 flex-1">
          {loading && items.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse space-y-2 py-4">
                  <div className="h-4 w-24 bg-paper-deep" />
                  <div className="h-8 bg-paper-deep" />
                  <div className="h-4 bg-paper-deep" />
                  <div className="h-4 w-3/4 bg-paper-deep" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <FileTextIcon size={40} className="mx-auto text-muted-foreground" />
              <p className="font-headline text-2xl">العدد قيد التجهيز</p>
              <p className="mx-auto max-w-xl opacity-70 leading-relaxed">
                لم تصل الأخبار بعد إلى هذه النسخة من الخادم — يحدث هذا بعد إقلاع بارد على
                الاستضافة السحابية. اضغط «تحديث الأخبار الآن» لإعادة محاولة الجلب فوراً،
                أو انتظر لحظات وسيتجدّد العدد تلقائياً.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={runFetch}
                  disabled={fetching}
                  className="font-headline"
                >
                  <RefreshIcon size={14} className={fetching ? 'animate-spin' : ''} />
                  تحديث الأخبار الآن
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRefreshKey((k) => k + 1)}
                  disabled={loading}
                  className="font-headline"
                >
                  إعادة تحميل الصفحة
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setAdminOpen(true)}
                  className="font-headline"
                >
                  غرفة التحرير
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* الخبر الرئيسي — يتوسط العمود الأول كصفحة أولى */}
              {featured && (
                <>
                  <div className="mx-auto max-w-3xl border-y-2 border-ink bg-card/60 px-4">
                    <ArticleCard item={featured} featured />
                  </div>
                  <div className="rule-double mt-4" />
                </>
              )}

              <div className="newsprint-columns mt-2">
                {rest.map((n) => (
                  <ArticleCard key={n.id} item={n} />
                ))}
              </div>
            </>
          )}

          {/* ترقيم الصفحات */}
          {pages > 1 && (
            <div className="no-print my-6 flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                السابق →
              </Button>
              <span className="text-sm px-2">
                صفحة {page} من {pages} — {total} خبر
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pages || loading}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
              >
                ← التالي
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* ---------- التذييل (طابع الصفحة الأخيرة) ---------- */}
      <footer className="mt-8 border-t-4 border-double border-ink bg-paper-deep/80">
        <div className="mx-auto max-w-7xl px-4 py-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="opacity-80 inline-flex items-center gap-1.5">
            <FlagDZ className="h-3.5 w-6 rounded-[2px] border border-rule" />
            <span className="font-headline text-base font-bold">صوت البلاد</span>
            — تجميع آلي بالعناوين والملخصات والروابط فقط؛ حقوق النصوص الكاملة لمصادرها الأصلية.
          </div>
          <div className="no-print flex items-center gap-3">
            <a
              href="/api/export/rss"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-vermillion"
            >
              RSS
            </a>
            <span className="opacity-40">|</span>
            <a
              href="/api/export/json"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-vermillion"
            >
              JSON API
            </a>
            <span className="opacity-40">|</span>
            <button
              onClick={() => setAdminOpen(true)}
              className="underline hover:text-vermillion inline-flex items-center gap-1"
            >
              <LandmarkIcon size={14} /> غرفة التحرير
            </button>
          </div>
        </div>
      </footer>

      <BackToTop />

      {/* شريط تقدم الجلب — أعلى الصفحة (التحضير الأول + الجلب الذاتي + زر التحديث) */}
      <FetchProgress state={progressState} />

      <AdminPanel open={adminOpen} onOpenChange={setAdminOpen} onChanged={() => setRefreshKey((k) => k + 1)} />
    </div>
  );
}
