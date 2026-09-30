'use client';

// ============================================================
// غرفة التحرير — لوحة التحكم
// 1) إدارة المصادر (إضافة/اختبار/تفعيل/حذف)
// 2) بوتات تلغرام (تسجيل توكن مشفر + تفعيل + حذف) مع تحذير أمني صريح
// 3) إعدادات فاصل الجلب
// 4) إحصائيات + وصلات التصدير
// ============================================================

import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertIcon,
  BotIcon,
  FlameIcon,
  LandmarkIcon,
  LightbulbIcon,
  LinkIcon,
  NewspaperIcon,
  PlusIcon,
  RefreshIcon,
  SettingsIcon,
  TimerIcon,
  UsersIcon,
} from './icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface SourceRow {
  id: string;
  name: string;
  rssUrl: string;
  language: string;
  isActive: boolean;
  lastStatus?: string | null;
  itemCount: number;
}

interface BotRow {
  id: string;
  name: string;
  username?: string | null;
  isActive: boolean;
  lastError?: string | null;
  subscriberCount: number;
}

interface StatsData {
  totalNews: number;
  breakingNews: number;
  activeSources: number;
  totalSources: number;
  activeBots: number;
  totalBots: number;
  subscribers: number;
  arabicNews: number;
  frenchNews: number;
  lastFetch?: string | null;
}

export default function AdminPanel({
  open,
  onOpenChange,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onChanged: () => void;
}) {
  const { toast } = useToast();
  const [tab, setTab] = useState<'sources' | 'bots' | 'settings'>('sources');

  const TABS: { key: 'sources' | 'bots' | 'settings'; label: ReactNode }[] = [
    { key: 'sources', label: <span className="inline-flex items-center gap-1.5"><NewspaperIcon size={14} />المصادر</span> },
    { key: 'bots', label: <span className="inline-flex items-center gap-1.5"><BotIcon size={14} />البوتات</span> },
    { key: 'settings', label: <span className="inline-flex items-center gap-1.5"><SettingsIcon size={14} />الإعدادات</span> },
  ];

  const [sources, setSources] = useState<SourceRow[]>([]);
  const [bots, setBots] = useState<BotRow[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [interval, setIntervalMin] = useState(12);
  const [busy, setBusy] = useState(false);

  // نموذج إضافة مصدر
  const [srcName, setSrcName] = useState('');
  const [srcUrl, setSrcUrl] = useState('');
  const [srcLang, setSrcLang] = useState('ar');

  // نموذج إضافة بوت
  const [botName, setBotName] = useState('');
  const [botToken, setBotToken] = useState('');
  const [ackTokenRisk, setAckTokenRisk] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    Promise.all([
      fetch('/api/sources').then((r) => r.json()),
      fetch('/api/bots').then((r) => r.json()),
      fetch('/api/stats').then((r) => r.json()),
      fetch('/api/settings').then((r) => r.json()),
    ])
      .then(([s, b, st, cfg]) => {
        if (!alive) return;
        setSources(s.sources ?? []);
        setBots(b.bots ?? []);
        setStats(st);
        setIntervalMin(cfg.fetchIntervalMinutes ?? 12);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [open]);

  // إعادة تحميل بعد العمليات (خارج التأثير)
  const loadAll = async () => {
    const [s, b, st, cfg] = await Promise.all([
      fetch('/api/sources').then((r) => r.json()),
      fetch('/api/bots').then((r) => r.json()),
      fetch('/api/stats').then((r) => r.json()),
      fetch('/api/settings').then((r) => r.json()),
    ]);
    setSources(s.sources ?? []);
    setBots(b.bots ?? []);
    setStats(st);
    setIntervalMin(cfg.fetchIntervalMinutes ?? 12);
  };

  const addSource = async () => {
    setBusy(true);
    const res = await fetch('/api/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: srcName, rssUrl: srcUrl, language: srcLang }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      toast({ title: 'أضيف المصدر — سيُجلب في الدورة القادمة' });
      setSrcName('');
      setSrcUrl('');
      loadAll();
      onChanged();
    } else {
      toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
    }
  };

  const toggleSource = async (id: string, isActive: boolean) => {
    await fetch(`/api/sources/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    });
    loadAll();
  };

  const testSource = async (id: string) => {
    setBusy(true);
    const res = await fetch(`/api/sources/${id}`, { method: 'POST' });
    const data = await res.json();
    setBusy(false);
    const r = data.result;
    if (r?.ok) {
      toast({
        title: `نجح الجلب: +${r.inserted} جديد`,
        description: r.updated > 0 ? `و${r.updated} مطابق عبر مصادر أخرى` : undefined,
      });
    } else {
      toast({ title: 'فشل الجلب', description: r?.error, variant: 'destructive' });
    }
    loadAll();
  };

  const deleteSource = async (id: string) => {
    await fetch(`/api/sources/${id}`, { method: 'DELETE' });
    toast({ title: 'حُذف المصدر' });
    loadAll();
    onChanged();
  };

  const addBot = async () => {
    if (!ackTokenRisk) {
      toast({
        title: 'تنبيه: يجب تأكيد إدراكك لخطورة التوكن أولاً',
        variant: 'destructive',
      });
      return;
    }
    setBusy(true);
    const res = await fetch('/api/bots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: botName, token: botToken, activate: true }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      toast({
        title: data.started ? `البوت يعمل الآن @${data.botUsername}` : 'حُفظ البوت',
        description: data.startError ?? 'يمكنك الآن مراسلته على تلغرام عبر /start',
      });
      setBotName('');
      setBotToken('');
      setAckTokenRisk(false);
      loadAll();
    } else {
      toast({ title: '❌ خطأ', description: data.error, variant: 'destructive' });
    }
  };

  const toggleBot = async (id: string, isActive: boolean) => {
    setBusy(true);
    const res = await fetch(`/api/bots/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok && isActive && !data.started) {
      toast({ title: 'فشل التفعيل', description: data.error, variant: 'destructive' });
    } else if (res.ok) {
      toast({ title: isActive ? 'فُعّل البوت' : 'عُطّل البوت' });
    }
    loadAll();
  };

  const deleteBot = async (id: string) => {
    await fetch(`/api/bots/${id}`, { method: 'DELETE' });
    toast({ title: 'حُذف البوت (التوكن مشفراً لن يُستخدم بعد الآن)' });
    loadAll();
  };

  const saveInterval = async (v: number) => {
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fetchIntervalMinutes: v }),
    });
    const data = await res.json();
    if (res.ok) {
      toast({ title: `الجلب كل ${data.fetchIntervalMinutes} دقيقة` });
      setIntervalMin(data.fetchIntervalMinutes);
    }
  };

  const fetchNow = async () => {
    setBusy(true);
    const res = await fetch('/api/fetch', { method: 'POST' });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      toast({
        title: `دورة جلب: +${data.inserted} خبر جديد`,
        description: `${data.ok}/${data.total} مصادر نجحت`,
      });
      loadAll();
      onChanged();
    } else {
      toast({ title: 'فشلت دورة الجلب', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] w-[min(880px,96vw)] overflow-y-auto admin-scroll bg-paper text-ink" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl inline-flex items-center gap-2">
            <LandmarkIcon size={22} /> غرفة التحرير
          </DialogTitle>
          <DialogDescription>
            إدارة المصادر، بوتات تلغرام، إعدادات الجلب — من هنا يدير المحرر الجريدة
          </DialogDescription>
        </DialogHeader>

        {/* تبويبات */}
        <div className="flex gap-1 border-b border-rule">
          {TABS.map(({ key: k, label }) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-3 py-1.5 text-sm md:text-base -mb-px border border-b-0 rounded-t transition-colors ${
                tab === k
                  ? 'bg-paper-deep border-rule font-bold'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* شريط الإحصائيات */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-sm">
            <div className="border border-rule bg-paper-deep p-2">
              <div className="text-xl font-bold">{stats.totalNews}</div>
              <div className="opacity-70">خبر</div>
            </div>
            <div className="border border-rule bg-paper-deep p-2">
              <div className="text-xl font-bold">{stats.breakingNews}</div>
              <div className="opacity-70 inline-flex items-center gap-1">
                <FlameIcon size={12} className="text-vermillion" /> عاجل
              </div>
            </div>
            <div className="border border-rule bg-paper-deep p-2">
              <div className="text-xl font-bold">
                {stats.activeSources}/{stats.totalSources}
              </div>
              <div className="opacity-70">مصادر نشطة</div>
            </div>
            <div className="border border-rule bg-paper-deep p-2">
              <div className="text-xl font-bold">{stats.activeBots}</div>
              <div className="opacity-70">بوتات تعمل</div>
            </div>
          </div>
        )}

        {/* ---------- تبويب المصادر ---------- */}
        {tab === 'sources' && (
          <div className="space-y-4">
            <div className="border border-rule bg-paper-deep p-3 space-y-2">
              <h4 className="font-headline text-lg font-bold inline-flex items-center gap-1.5">
                <PlusIcon size={16} /> إضافة مصدر جديد
              </h4>
              <div className="grid gap-2 md:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="src-name">اسم المصدر</Label>
                  <Input
                    id="src-name"
                    value={srcName}
                    onChange={(e) => setSrcName(e.target.value)}
                    placeholder="مثال: وطني اليوم"
                    className="bg-paper"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="src-url">رابط خلاصة RSS</Label>
                  <Input
                    id="src-url"
                    value={srcUrl}
                    onChange={(e) => setSrcUrl(e.target.value)}
                    placeholder="https://example.com/feed"
                    dir="ltr"
                    className="bg-paper text-left"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={srcLang}
                  onChange={(e) => setSrcLang(e.target.value)}
                  className="border border-input bg-paper px-2 py-1.5 text-sm rounded"
                  aria-label="لغة المصدر"
                >
                  <option value="ar">عربي</option>
                  <option value="fr">فرنسي</option>
                </select>
                <Button onClick={addSource} disabled={busy || !srcName || !srcUrl} size="sm" className="font-bold">
                  أضف المصدر
                </Button>
                <Button onClick={fetchNow} disabled={busy} size="sm" variant="outline" className="inline-flex items-center gap-1.5">
                  <RefreshIcon size={14} /> جلب الآن
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {sources.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center gap-2 border border-rule bg-card px-3 py-2"
                >
                  <Switch
                    checked={s.isActive}
                    onCheckedChange={(v) => toggleSource(s.id, v)}
                    aria-label="تفعيل المصدر"
                  />
                  <div className="flex-1 min-w-40">
                    <div className="font-bold">
                      {s.name}{' '}
                      <span className="text-xs opacity-60">
                        ({s.language === 'fr' ? 'FR' : 'عربي'})
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate max-w-md" dir="ltr" style={{ textAlign: 'left' }}>
                      {s.rssUrl}
                    </div>
                    {s.lastStatus && (
                      <div className="text-xs opacity-70">
                        {s.lastStatus} • {s.itemCount} خبر
                      </div>
                    )}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => testSource(s.id)} disabled={busy}>
                    اختبار
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm(`حذف المصدر «${s.name}» وأخباره؟`)) deleteSource(s.id);
                    }}
                  >
                    حذف
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------- تبويب البوتات ---------- */}
        {tab === 'bots' && (
          <div className="space-y-4">
            {/* تحذير أمني صريح كما تتطلب المواصفات */}
            <div className="border-2 border-vermillion bg-vermillion/5 p-3 text-sm leading-relaxed">
              <h4 className="font-headline text-lg font-bold text-vermillion inline-flex items-center gap-1.5">
                <AlertIcon size={16} /> تنبيه أمني — اقرأ قبل إدخال التوكن
              </h4>
              <p>
                توكن البوت <b>كلمة سُرّ كاملة</b>: كل من يملكه يتحكم ببوتك بالكامل.
                يُخزَّن هنا <b>مشفّراً AES-256</b> ولا يظهر أبداً في أي سجل أو واجهة.
                يمكنك <b>تعطيله أو حذفه في أي وقت</b> من هذه اللوحة، أو إبطاله نهائياً
                من <b dir="ltr">@BotFather</b> عبر الأمر <code dir="ltr">/revoke</code>.
              </p>
              <label className="mt-2 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ackTokenRisk}
                  onChange={(e) => setAckTokenRisk(e.target.checked)}
                  className="accent-vermillion w-4 h-4"
                />
                <span>أفهم خطورة التوكن وأقرّ بإضافته تحت مسؤوليتي</span>
              </label>
            </div>

            <div className="border border-rule bg-paper-deep p-3 space-y-2">
              <h4 className="font-headline text-lg font-bold inline-flex items-center gap-1.5">
                <PlusIcon size={16} /> ربط بوت تلغرام
              </h4>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="bot-name">اسم تعريفي</Label>
                  <Input
                    id="bot-name"
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    placeholder="بوت أخبار عائلتي"
                    className="bg-paper"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bot-token">توكن البوت (من BotFather)</Label>
                  <Input
                    id="bot-token"
                    type="password"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="123456789:AAE…"
                    dir="ltr"
                    autoComplete="off"
                    className="bg-paper text-left"
                  />
                </div>
              </div>
              <Button onClick={addBot} disabled={busy || !botToken || !ackTokenRisk} size="sm" className="font-bold">
                حفظ وتفعيل (مشفّر)
              </Button>
              <p className="text-xs opacity-70">
                <LightbulbIcon size={12} className="inline-block align-[-2px] text-vermillion" /> أنشئ بوتك من <b dir="ltr">@BotFather</b> ← <code dir="ltr">/newbot</code> ← انسخ التوكن هنا.
                بعد التفعيل، افتح محادثة مع بوتك وأرسل <code dir="ltr">/start</code> ثم جرّب
                <code dir="ltr"> /latest</code> و<code dir="ltr"> /breaking</code> و
                <code dir="ltr"> /category اقتصاد</code>.
              </p>
            </div>

            <div className="space-y-2">
              {bots.length === 0 && (
                <p className="text-center text-sm opacity-60 py-4">
                  لا بوتات بعد — أضف توكن بوتك ليصلك الأخبار على تلغرام
                </p>
              )}
              {bots.map((b) => (
                <div
                  key={b.id}
                  className="flex flex-wrap items-center gap-2 border border-rule bg-card px-3 py-2"
                >
                  <Switch
                    checked={b.isActive}
                    onCheckedChange={(v) => toggleBot(b.id, v)}
                    aria-label="تفعيل البوت"
                  />
                  <div className="flex-1 min-w-40">
                    <div className="font-bold">
                      {b.name}{' '}
                      {b.username && (
                        <span className="text-sm text-muted-foreground">@{b.username}</span>
                      )}
                    </div>
                    <div className="text-xs opacity-70 inline-flex items-center gap-1 flex-wrap">
                      <UsersIcon size={12} /> {b.subscriberCount} مشترك
                      {b.lastError && (
                        <span className="text-vermillion inline-flex items-center gap-1">
                          • <AlertIcon size={11} /> {b.lastError}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm(`حذف البوت «${b.name}» نهائياً؟`)) deleteBot(b.id);
                    }}
                  >
                    حذف
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------- تبويب الإعدادات ---------- */}
        {tab === 'settings' && (
          <div className="space-y-4">
            <div className="border border-rule bg-paper-deep p-3 space-y-2">
              <h4 className="font-headline text-lg font-bold inline-flex items-center gap-1.5">
                <TimerIcon size={16} /> فاصل الجلب الدوري
              </h4>
              <p className="text-sm opacity-75">
                يجلب التطبيق الأخبار من كل المصادر النشطة تلقائياً كل (5–60) دقيقة.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={1}
                  value={interval}
                  onChange={(e) => setIntervalMin(Number(e.target.value))}
                  onMouseUp={() => saveInterval(interval)}
                  onTouchEnd={() => saveInterval(interval)}
                  className="flex-1 accent-vermillion"
                  aria-label="فاصل الجلب بالدقائق"
                />
                <span className="w-20 text-center font-bold">{interval} دقيقة</span>
              </div>
            </div>

            <Separator />

            <div className="border border-rule bg-paper-deep p-3 space-y-2">
              <h4 className="font-headline text-lg font-bold inline-flex items-center gap-1.5">
                <LinkIcon size={16} /> وصلات التصدير للمطورين
              </h4>
              <ul className="text-sm space-y-1" dir="ltr" style={{ textAlign: 'left' }}>
                <li>
                  <a className="underline text-vermillion" href="/api/export/json" target="_blank" rel="noreferrer">
                    /api/export/json
                  </a>{' '}
                  — JSON ({stats?.frenchNews ?? 0} فرنسي + {stats?.arabicNews ?? 0} عربي)
                </li>
                <li>
                  <a className="underline text-vermillion" href="/api/export/rss" target="_blank" rel="noreferrer">
                    /api/export/rss
                  </a>{' '}
                  — RSS syndication
                </li>
              </ul>
              <p className="text-xs opacity-70" dir="rtl">
                تدعم المعلمات: <code dir="ltr">?category=اقتصاد&amp;lang=fr&amp;limit=100</code>
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
