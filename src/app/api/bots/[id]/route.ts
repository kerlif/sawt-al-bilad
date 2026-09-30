import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { startBot, stopBot } from '@/lib/telegramManager';

// PATCH /api/bots/[id] — تفعيل / تعطيل البوت
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json({ error: 'حقل isActive مطلوب' }, { status: 400 });
    }

    const bot = await db.botToken.update({
      where: { id },
      data: { isActive: body.isActive, lastError: null },
    });

    if (body.isActive) {
      const result = await startBot(id);
      return NextResponse.json({
        ok: true,
        started: result.ok,
        error: result.error,
        username: result.username,
        bot: { id: bot.id, isActive: bot.isActive },
      });
    }
    await stopBot(id);
    return NextResponse.json({ ok: true, started: false });
  } catch (err) {
    console.error('[api/bots PATCH]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'فشل تعديل البوت' }, { status: 500 });
  }
}

// DELETE /api/bots/[id] — حذف البوت نهائياً (يوقف polling أولاً)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await stopBot(id);
    await db.botToken.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/bots DELETE]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'فشل حذف البوت' }, { status: 500 });
  }
}
