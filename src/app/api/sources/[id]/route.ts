import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fetchSource } from '@/lib/newsFetcher';

// PATCH /api/sources/[id] — تعديل (تفعيل/تعطيل/بيانات)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive;
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
    if (typeof body.language === 'string' && ['ar', 'fr'].includes(body.language)) {
      data.language = body.language;
    }

    const source = await db.source.update({ where: { id }, data });
    return NextResponse.json({ ok: true, source });
  } catch (err) {
    console.error('[api/sources PATCH]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'فشل تعديل المصدر' }, { status: 500 });
  }
}

// DELETE /api/sources/[id] — حذف المصدر وأخباره
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.source.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/sources DELETE]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'فشل حذف المصدر' }, { status: 500 });
  }
}

// POST /api/sources/[id] — اختبار جلب مصدر واحد فوراً
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const source = await db.source.findUnique({ where: { id } });
    if (!source) {
      return NextResponse.json({ error: 'المصدر غير موجود' }, { status: 404 });
    }
    const result = await fetchSource(source);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error('[api/sources test]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'فشل اختبار المصدر' }, { status: 500 });
  }
}
