'use client';

// ============================================================
// شريط العاجل — أعلى الصفحة، بارز، متحرك ببطء لقراءة مريحة
// يعرض الأخبار الحاملة لراية العاجل مرتبة حسب عدد المصادر
// الحركة: نسختان متماثلتان + إزاحة 50% — دوران سلس بلا قفزات
// وتتوقف مؤقتاً عند تمرير الفأرة
// ============================================================

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BoltIcon, FlameIcon, XIcon } from './icons';

interface BreakingItem {
  id: string;
  title: string;
  url: string;
  sourceCount: number;
}

export default function BreakingTicker({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<BreakingItem[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch('/api/news?breaking=1&limit=8&sort=newest')
      .then((r) => r.json())
      .then((data) => {
        if (alive) setItems(data.items ?? []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  if (!visible) return null;

  return (
    <div
      className="no-print relative my-2 flex items-stretch overflow-hidden border-y-2 border-paper bg-vermillion text-[#f6ecd6] shadow-sm ticker"
      role="region"
      aria-label="شريط الأخبار العاجلة"
    >
      {/* العلامة الثابتة */}
      <div className="z-10 flex shrink-0 items-center gap-1.5 bg-[#6f2015] px-3 py-1.5 font-headline text-base font-bold md:px-5 md:text-xl">
        <FlameIcon size={18} className="ticker-flame" />
        <span>عاجل</span>
        <button
          onClick={() => setVisible(false)}
          aria-label="إخفاء شريط العاجل"
          className="mr-1 rounded px-1 opacity-70 transition-opacity hover:opacity-100"
        >
          <XIcon size={14} />
        </button>
      </div>

      {/* الشريط المتحرك */}
      <div className="relative flex-1 overflow-hidden">
        {items.length === 0 ? (
          <div className="flex h-full items-center px-4 text-sm opacity-90">
            لا أخبار عاجلة الآن — الوضع مستقر
          </div>
        ) : (
          <div className="ticker-track items-center py-1.5">
            {[0, 1].map((dup) => (
              <span key={dup} className="ticker-group" aria-hidden={dup === 1}>
                {items.map((n) => (
                  <Link
                    key={`${dup}-${n.id}`}
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm md:text-base hover:underline"
                    title={`${n.sourceCount} مصادر نشرت هذا الخبر`}
                  >
                    <BoltIcon size={13} className="shrink-0 opacity-90" />
                    <span>{n.title}</span>
                    {n.sourceCount > 1 && (
                      <span className="inline-block rounded bg-black/25 px-1.5 text-xs">
                        {n.sourceCount} مصادر
                      </span>
                    )}
                  </Link>
                ))}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
