'use client';

// ============================================================
// بطاقة الخبر — بأسلوب مقالات الصحف المطبوعة
// عنوان بخط أميري الثقيل + ملخص + صورة بنصف نغمة + ختم الفئة
// + التاريخ الدقيق للنشر + رابط «تابع الخبر» إلى المصدر الأصلي
// ============================================================

import { useState } from 'react';
import Link from 'next/link';
import { LangChip } from './flags';
import {
  CalendarIcon,
  ClockIcon,
  ExternalLinkIcon,
  FlameIcon,
  NewspaperIcon,
  SignalIcon,
} from './icons';

export interface NewsItemData {
  id: string;
  title: string;
  summary: string;
  url: string;
  imageUrl?: string | null;
  publishedAt: string;
  language: string;
  category: string;
  isBreaking: boolean;
  sourceCount: number;
  sourceName: string;
}

/** وقت نسبي بالعربية: منذ 5 دقائق… */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `منذ ${days} يوم`;
  return '';
}

/** التاريخ الدقيق للنشر: 28 سبتمبر 2026 • 14:30 */
function exactDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const date = new Intl.DateTimeFormat('ar-DZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
  const time = new Intl.DateTimeFormat('ar-DZ', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
  return `${date} • ${time}`;
}

export default function ArticleCard({
  item,
  featured = false,
}: {
  item: NewsItemData;
  featured?: boolean;
}) {
  const [imgBroken, setImgBroken] = useState(false);
  const showImage = item.imageUrl && !imgBroken;
  const relative = timeAgo(item.publishedAt);
  const absolute = exactDate(item.publishedAt);

  return (
    <article className={`newsprint-item py-4`}>
      {/* ختم الفئة + العاجل + عدد المصادر + اللغة */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="category-tag text-xs md:text-sm text-ink">
          {item.category}
        </span>
        {item.isBreaking && (
          <span className="inline-flex items-center gap-1 rounded-sm bg-vermillion px-1.5 py-0.5 text-xs font-bold text-[#f6ecd6]">
            <FlameIcon size={12} />
            عاجل
          </span>
        )}
        {item.sourceCount > 1 && (
          <span
            className="inline-flex items-center gap-1 rounded-sm border border-rule px-1.5 py-0.5 text-xs text-muted-foreground"
            title="عدد المصادر التي نشرت الخبر نفسه"
          >
            <SignalIcon size={12} /> {item.sourceCount} مصادر
          </span>
        )}
        <span className="inline-flex items-center text-xs text-muted-foreground">
          <LangChip lang={item.language} />
        </span>
      </div>

      {/* الصورة بتأثير نصف النغمة */}
      {showImage && (
        <Link href={item.url} target="_blank" rel="noopener noreferrer">
          <div className="halftone-wrap mb-2 border border-rule">
            <img
              src={item.imageUrl}
              alt={item.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgBroken(true)}
              className="halftone w-full object-cover"
              style={{ maxHeight: featured ? 320 : 190 }}
            />
          </div>
        </Link>
      )}

      {/* العنوان */}
      <h3
        dir="auto"
        className={`font-headline font-bold leading-snug text-[color:var(--ink)] ${featured ? 'text-2xl md:text-4xl' : 'text-xl md:text-2xl'} ${item.language === 'fr' ? 'text-right font-fr' : ''}`}
      >
        <Link
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-vermillion hover:underline decoration-rule decoration-1 underline-offset-4"
        >
          {item.title}
        </Link>
      </h3>

      {/* الملخص (≤40 كلمة) */}
      <p
        className={`mt-1.5 leading-relaxed text-foreground/85 ${item.language === 'fr' ? 'font-fr text-right' : ''} ${featured ? 'text-lg md:text-xl' : 'text-base md:text-lg'}`}
        dir={item.language === 'fr' ? 'ltr' : 'rtl'}
      >
        {item.summary}
      </p>

      {/* سطر المصدر + التاريخ الدقيق */}
      <div className="diamond-rule mt-2 flex-wrap gap-x-3 gap-y-1 text-xs md:text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
          <NewspaperIcon size={13} /> {item.sourceName}
        </span>
        <span className="inline-flex items-center gap-1 whitespace-nowrap" title={absolute}>
          <CalendarIcon size={13} /> {absolute}
        </span>
        {relative && (
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <ClockIcon size={13} /> {relative}
          </span>
        )}
      </div>

      {/* رابط المصدر الأصلي */}
      <div className="mt-2">
        <Link
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="follow-link inline-flex items-center gap-1.5 rounded-sm border border-vermillion/60 bg-vermillion/5 px-2 py-1 text-xs font-bold text-vermillion transition-colors hover:bg-vermillion hover:text-paper md:text-sm"
          title={`المصدر: ${item.sourceName}`}
        >
          <ExternalLinkIcon size={13} />
          تابع الخبر
          <span dir="ltr" className="font-fr text-[0.85em] opacity-80">
            (official Link)
          </span>
        </Link>
      </div>
    </article>
  );
}
