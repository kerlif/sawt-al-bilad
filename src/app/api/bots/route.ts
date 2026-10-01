import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { encryptSecret, tokenFingerprint } from '@/lib/encryption';
import { startBot } from '@/lib/telegramManager';
import { ensureBooted } from '@/lib/scheduler';

// GET /api/bots — قائمة البوتات (بدون أي توكن!)
export async function GET() {
  try {
    await ensureBooted();
    const bots = await db.botToken.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { subscribers: true } } },
    });
    return NextResponse.json({
      bots: bots.map((b) => ({
        id: b.id,
        name: b.name,
        username: b.username,
        isActive: b.isActive,
        createdAt: b.createdAt,
        lastPollAt: b.lastPollAt,
        lastError: b.lastError,
        subscriberCount: b._count.subscribers,
        // ملاحظة أمنية: لا نعيد التوكن أبداً — مشفراً أو غير مشفر
      })),
      runningBotIds: (await import('@/lib/telegramManager')).getRunningBotIds(),
    });
  } catch (err) {
    console.error('[api/bots GET]', err instanceof Error ? err.message : err);
    return NextResponse.json({ bots: [], runningBotIds: [], error: 'قاعدة البيانات قيد التهيئة' }, { status: 503 });
  }
}

// POST /api/bots — تسجيل بوت جديد بتوكن المستخدم
// التوكن يُخزَّن مشفراً AES-256-GCM ولا يظهر في أي سجل
export async function POST(req: NextRequest) {
  try {
    await ensureBooted();
    const body = await req.json();
    const name = String(body.name ?? '').trim() || 'بوت الأخبار';
    const token = String(body.token ?? '').trim();

    // صيغة توكن تلغرام: <bot_id>:<35+ حرفاً>
    if (!/^\d{6,12}:[A-Za-z0-9_-]{30,}$/.test(token)) {
      return NextResponse.json(
        { error: 'صيغة التوكن غير صالحة. توكن البوت يكون بصيغة 123456789:AAExxxxx…' },
        { status: 400 }
      );
    }

    const fingerprint = tokenFingerprint(token);
    const exists = await db.botToken.findUnique({ where: { tokenFingerprint: fingerprint } });
    if (exists) {
      return NextResponse.json(
        { error: 'هذا التوكن مسجل سابقاً في النظام' },
        { status: 409 }
      );
    }

    const bot = await db.botToken.create({
      data: {
        name,
        encryptedToken: encryptSecret(token),
        tokenFingerprint: fingerprint,
        isActive: false,
      },
    });

    // تفعيل فوري إن طُلب (يبدأ polling معزول)
    let startResult: { ok: boolean; error?: string; username?: string } = { ok: false };
    if (body.activate === true) {
      await db.botToken.update({ where: { id: bot.id }, data: { isActive: true } });
      startResult = await startBot(bot.id);
    }

    return NextResponse.json(
      {
        ok: true,
        bot: { id: bot.id, name: bot.name, isActive: body.activate === true },
        started: startResult.ok,
        startError: startResult.error,
        botUsername: startResult.username,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[api/bots POST] فشل التسجيل (التفاصيل محجوبة لأمان التوكن)');
    return NextResponse.json({ error: 'فشل تسجيل البوت' }, { status: 500 });
  }
}
