import { NextRequest, NextResponse } from 'next/server';
import { fetchAllSources } from '@/lib/newsFetcher';
import { ensureReady } from '@/lib/bootstrap';

// ============================================================
// /api/fetch — تشغيل دورة جلب من كل المصادر النشطة
// - POST: من زر «تحديث» في الواجهة وزر «جلب الآن» في غرفة التحرير
//   • يدعم البث التدريجي (NDJSON) عند إرسال Accept: application/x-ndjson
//     فيتلقى العميل حدث تقدم بعد اكتمال كل مصدر لعرض شريط تقدم حقيقي
//   • بدونه يعيد JSON واحد كما هو (توافق كامل مع النسخ السابقة)
// - GET:  للمجدول السحابي (مثل مهام Cron الدورية) — يدعم CRON_SECRET اختيارياً
// ============================================================

// مهلة موسعة تسمح بإكمال دورة جلب كاملة حتى على الخطة المجانية
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const wantsStream = (req.headers.get('accept') ?? '').includes('application/x-ndjson');
  try {
    await ensureReady();

    // النمط العادي: نتيجة واحدة مجمعة (توافق خلفي)
    if (!wantsStream) {
      const result = await fetchAllSources();
      return NextResponse.json({ ok: true, ...result });
    }

    // نمط البث التدريجي: سطر JSON بعد اكتمال كل مصدر
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (obj: unknown) => {
          try {
            controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
          } catch {
            // أُغلق البث من جهة العميل — تجاهل
          }
        };
        try {
          const result = await fetchAllSources((e) => send({ type: 'progress', ...e }));
          send({
            type: 'done',
            ok: true,
            total: result.total,
            okCount: result.ok,
            failed: result.failed,
            inserted: result.inserted,
            updated: result.updated,
          });
        } catch (err) {
          console.error('[api/fetch stream]', err instanceof Error ? err.message : err);
          send({ type: 'error', ok: false, error: 'فشلت دورة الجلب' });
        } finally {
          try {
            controller.close();
          } catch {
            // البث مغلق مسبقاً
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    console.error('[api/fetch]', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: 'فشلت دورة الجلب' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // إن ضُبط CRON_SECRET فاطلب الترويسة المطابقة لتحصين المسار
    const secret = process.env.CRON_SECRET;
    if (secret) {
      const auth = req.headers.get('authorization') ?? '';
      if (auth !== `Bearer ${secret}`) {
        return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
      }
    }
    await ensureReady();
    const result = await fetchAllSources();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[api/fetch]', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: 'فشلت دورة الجلب' }, { status: 500 });
  }
}
