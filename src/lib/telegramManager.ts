// ============================================================
// مدير بوتات تلغرام — متعدد المستخدمين
// - كل توكن يديره المستخدم يُفعَّل بـ polling معزول خاص به
// - التوكن يُفك تشفيره في الذاكرة فقط، ولا يظهر في أي log أبداً
// - الأوامر: /start، /latest، /category <اسم الفئة>، /breaking
// - حد إرسال بسيط لكل محادثة لمنع الإزعاج
// ============================================================

import { Telegraf, Markup } from 'telegraf';
import { db } from '@/lib/db';
import { decryptSecret } from './encryption';
import { CATEGORIES, BREAKING_CATEGORY } from './categories';

interface ManagedBot {
  botId: string;
  tg: Telegraf;
  startedAt: number;
}

// سجل عام يبقى عبر إعادة التحميل الساخن في بيئة التطوير
const globalStore = globalThis as unknown as {
  __managedBots?: Map<string, ManagedBot>;
  __botsStarting?: Set<string>;
};

const managedBots: Map<string, ManagedBot> =
  globalStore.__managedBots ?? new Map();
globalStore.__managedBots = managedBots;

const starting: Set<string> = globalStore.__botsStarting ?? new Set();
globalStore.__botsStarting = starting;

// ------------------------- حد الإرسال -------------------------

const RATE_WINDOW_MS = 10_000;
const RATE_MAX_MESSAGES = 5;
const rateMap = new Map<string, number[]>();

function rateLimited(chatId: string | number): boolean {
  const now = Date.now();
  const arr = (rateMap.get(String(chatId)) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS
  );
  if (arr.length >= RATE_MAX_MESSAGES) {
    rateMap.set(String(chatId), arr);
    return true;
  }
  arr.push(now);
  rateMap.set(String(chatId), arr);
  return false;
}

// ------------------------- تنسيق الأخبار -------------------------

function formatNewsLine(
  idx: number,
  n: {
    title: string;
    summary: string;
    url: string;
    source: { name: string };
    language: string;
    category: string;
  }
): string {
  const langTag = n.language === 'fr' ? ' 🇫🇷' : ' 🇩🇿';
  return [
    `${idx}. <b>${escapeHtml(n.title)}</b>`,
    `<i>${escapeHtml(n.summary)}</i>`,
    `📰 ${escapeHtml(n.source.name)}${langTag} | <a href="${n.url}">المصدر الأصلي ↗</a>`,
  ].join('\n');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function sendLatest(ctx: Telegraf['context'], limit = 8, category?: string) {
  if (rateLimited(ctx.chat?.id ?? 'x')) {
    await ctx.reply('⏳ طلبات كثيرة — انتظر لحظات ثم أعد المحاولة.');
    return;
  }

  const items = await db.newsItem.findMany({
    where: category ? { category } : {},
    orderBy: [{ isBreaking: 'desc' }, { publishedAt: 'desc' }],
    take: limit,
    include: { source: true },
  });

  if (items.length === 0) {
    await ctx.reply(
      category
        ? `لا توجد أخبار حالياً في فئة «${category}». جرب /latest`
        : 'لا توجد أخبار بعد. جرب لاحقاً.'
    );
    return;
  }

  const header = category
    ? `🗞 <b>أحدث أخبار فئة «${escapeHtml(category)}»</b>\n━━━━━━━━━━━━━━`
    : '🗞 <b>أحدث أخبار «صوت البلاد»</b>\n━━━━━━━━━━━━━━';
  const body = items.map((n, i) => formatNewsLine(i + 1, n)).join('\n\n');
  const footer = '\n━━━━━━━━━━━━━━\n📎 الروابط تقود للمصدر الأصلي — التفاصيل الكاملة هناك.';

  await ctx.replyWithHTML(`${header}\n\n${body}${footer}`);
}

async function sendBreaking(ctx: Telegraf['context'], limit = 6) {
  if (rateLimited(ctx.chat?.id ?? 'x')) {
    await ctx.reply('⏳ طلبات كثيرة — انتظر لحظات ثم أعد المحاولة.');
    return;
  }
  const items = await db.newsItem.findMany({
    where: { isBreaking: true },
    orderBy: [{ sourceCount: 'desc' }, { publishedAt: 'desc' }],
    take: limit,
    include: { source: true },
  });

  if (items.length === 0) {
    await ctx.reply('✅ لا توجد أخبار عاجلة الآن — الوضع هادئ.');
    return;
  }

  const body = items
    .map(
      (n, i) =>
        `🔥 <b>${escapeHtml(n.title)}</b>\n<i>${escapeHtml(n.summary)}</i>\n📰 ${escapeHtml(
          n.source.name
        )} | 📡 ${n.sourceCount} مصدر | <a href="${n.url}">المصدر ↗</a>`
    )
    .join('\n\n');

  await ctx.replyWithHTML(`🚨 <b>عاجل 🔥 — آخر المستجدات</b>\n\n${body}`);
}

// ------------------------- إدارة البوت الواحد -------------------------

export async function startBot(botId: string): Promise<{ ok: boolean; error?: string; username?: string }> {
  if (managedBots.has(botId) || starting.has(botId)) {
    const existing = managedBots.get(botId);
    return { ok: true, username: existing?.tg.botInfo?.username };
  }
  starting.add(botId);

  try {
    const record = await db.botToken.findUnique({ where: { id: botId } });
    if (!record || !record.isActive) {
      starting.delete(botId);
      return { ok: false, error: 'البوت غير موجود أو غير مفعّل' };
    }

    // فك التشفير في الذاكرة فقط
    const token = decryptSecret(record.encryptedToken);

    const tg = new Telegraf(token, { handlerTimeout: 30_000 });

    // /start — تسجيل المشترك والترحيب
    tg.start(async (ctx) => {
      const chatId = String(ctx.chat?.id ?? ctx.from?.id ?? '');
      if (chatId) {
        await db.botSubscriber.upsert({
          where: { botId_chatId: { botId, chatId } },
          update: {},
          create: { botId, chatId },
        });
      }
      await ctx.replyWithHTML(
        [
          '🗞 <b>مرحباً بك في «صوت البلاد»</b>',
          '',
          'بوت الأخبار الجزائرية المباشرة. الأوامر المتاحة:',
          '• /latest — أحدث الأخبار',
          '• /category <اسم الفئة> — أخبار فئة محددة',
          `• /breaking — العاجل 🔥`,
          '',
          `📌 <b>الفئات:</b> ${CATEGORIES.map((c) => c.name).join('، ')}`,
        ].join('\n')
      );
    });

    tg.command('latest', async (ctx) => sendLatest(ctx, 8));
    tg.command('breaking', async (ctx) => sendBreaking(ctx, 6));

    tg.command('category', async (ctx) => {
      const raw = (ctx.message?.text ?? '').replace(/^\/category\s*/i, '').trim();
      if (!raw) {
        await ctx.replyWithHTML(
          [
            'استخدم الأمر هكذا: <code>/category اسم الفئة</code>',
            '',
            `📌 <b>الفئات المتاحة:</b>`,
            ...CATEGORIES.map((c) => `• ${c.name}`),
          ].join('\n')
        );
        return;
      }
      // مطابقة مرنة للاسم
      const cat = CATEGORIES.find(
        (c) =>
          c.name === raw ||
          normalizeBotText(c.name) === normalizeBotText(raw) ||
          c.name.includes(raw) ||
          c.fr.toLowerCase() === raw.toLowerCase()
      );
      if (!cat) {
        await ctx.reply(
          `❌ فئة غير معروفة: «${raw}»\n\nالفئات: ${CATEGORIES.map((c) => c.name).join('، ')}`
        );
        return;
      }
      await sendLatest(ctx, 8, cat.name);
    });

    tg.catch(async (err) => {
      // لا نطبع أبداً محتوى التوكن — رسالة عامة فقط
      console.error(`[bot ${botId}] handler error (details withheld)`);
      void err;
    });

    // polling معزول لكل بوت — تجاهل التحديثات المعلقة القديمة
    await tg.telegram.deleteWebhook({ drop_pending_updates: true });
    await tg.init();
    tg.launch({ dropPendingUpdates: true });

    managedBots.set(botId, { botId, tg, startedAt: Date.now() });

    await db.botToken.update({
      where: { id: botId },
      data: { lastPollAt: new Date(), lastError: null, username: tg.botInfo?.username },
    });

    starting.delete(botId);
    console.log(`[telegram] bot #${botId} (@${tg.botInfo?.username}) is polling`);
    return { ok: true, username: tg.botInfo?.username };
  } catch (err) {
    starting.delete(botId);
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    // رسالة آمنة: 401 = توكن غير صالح — لا نعرض التوكن نفسه
    const safe = /401|Unauthorized/i.test(msg)
      ? 'توكن غير صالح (رفضه Telegram)'
      : msg.slice(0, 120);
    await db.botToken.update({
      where: { id: botId },
      data: { lastError: safe },
    }).catch(() => {});
    console.error(`[telegram] failed to start bot #${botId}: ${safe}`);
    return { ok: false, error: safe };
  }
}

function normalizeBotText(s: string): string {
  return s.replace(/[\u064B-\u065F]/g, '').replace(/\s+/g, ' ').trim();
}

export async function stopBot(botId: string): Promise<void> {
  const managed = managedBots.get(botId);
  if (managed) {
    try {
      managed.tg.stop();
    } catch {
      /* تجاهل */
    }
    managedBots.delete(botId);
    console.log(`[telegram] bot #${botId} stopped`);
  }
}

/** مزامنة كل البوتات مع حالة قاعدة البيانات (تشغيل النشط، إيقاف غير النشط) */
export async function syncBots(): Promise<void> {
  const bots = await db.botToken.findMany();
  for (const b of bots) {
    if (b.isActive && !managedBots.has(b.id)) {
      await startBot(b.id);
    } else if (!b.isActive && managedBots.has(b.id)) {
      await stopBot(b.id);
    }
  }
  // تنظيف: بوتات في الذاكرة حُذفت من القاعدة
  for (const botId of managedBots.keys()) {
    if (!bots.some((b) => b.id === botId)) {
      await stopBot(botId);
    }
  }
}

export function getRunningBotIds(): string[] {
  return Array.from(managedBots.keys());
}

/** لوحة مفاتيح الفئات للبوت (للاستخدام المستقبلي) */
export function categoryKeyboard() {
  return Markup.keyboard(
    [...CATEGORIES.map((c) => `/category ${c.name}`), '/latest', '/breaking'],
    { columns: 2 }
  ).resize();
}

export { BREAKING_CATEGORY };
