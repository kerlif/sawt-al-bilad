'use client';

// ============================================================
// ترويسة الجريدة — «صوت البلاد»
// الاسم المستدع + رقم العدد + التاريخ الهجري والميلادي + العلم الرسمي
// + زر طباعة العدد / تصدير PDF بتنسيق A4
// ============================================================

import { FlagDZ } from './flags';
import { BotIcon, NewspaperIcon, PrinterIcon, SignalIcon } from './icons';

interface MastheadProps {
  totalNews: number;
  activeSources: number;
}

const WEEKDAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

/** التاريخ بالطريقة الجزائرية المحلية (جانفي/فيفري…) */
function algerianDate(d: Date): string {
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function hijriDate(d: Date): string {
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return '';
  }
}

export default function Masthead({ totalNews, activeSources }: MastheadProps) {
  const today = new Date();
  // رقم العدد: أيام منذ 5 جويلية 1962 (الاستقلال) — لمسة رمزية
  const issueNo = Math.floor((today.getTime() - new Date('1962-07-05').getTime()) / 86400000);

  const printEdition = () => window.print();

  return (
    <header className="select-none">
      {/* السطر العلوي: العلم | التاريخ | العدد + الطباعة */}
      <div className="flex items-center justify-between gap-2 py-1 text-sm md:text-base text-muted-foreground">
        <span className="shrink-0 inline-flex items-center gap-1.5">
          <FlagDZ className="h-3.5 w-6 rounded-[2px] border border-rule shadow-sm" />
          نسخة رقمية — مجاناً
        </span>
        <span className="hidden sm:block text-center">
          {algerianDate(today)} • {hijriDate(today)}
        </span>
        <span className="shrink-0 inline-flex items-center gap-2">
          <span className="font-headline">العدد {issueNo.toLocaleString('ar-DZ')}</span>
          <button
            onClick={printEdition}
            className="no-print inline-flex items-center gap-1.5 rounded-sm border border-rule bg-paper px-2 py-0.5 text-xs font-headline font-bold transition-colors hover:bg-vermillion hover:text-paper"
            title="اطبع هذا العدد أو صدّره PDF بحجم A4 (اختر «حفظ كـ PDF» في نافذة الطباعة)"
            aria-label="طباعة العدد أو تصديره PDF"
          >
            <PrinterIcon size={14} />
            <span className="hidden md:inline">طباعة / PDF</span>
          </button>
        </span>
      </div>

      <div className="rule-thick" />

      {/* الاسم الرئيسي */}
      <div className="relative py-3 md:py-5 text-center center-fold">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 hidden lg:flex flex-col items-center gap-1 text-xs text-muted-foreground">
          <span className="stamp text-[11px]">مستقل</span>
          <span>منذ ٢٠٢٦</span>
        </div>

        <h1 className="masthead-title text-5xl md:text-7xl xl:text-8xl text-ink">
          صوت البلاد
        </h1>
        <p className="mt-1 text-sm md:text-base text-muted-foreground tracking-wider">
          جريدة الأخبار الجزائرية — المشار إليها بالعناوين والروابط، لا بالنصوص المسروقة
        </p>

        <div className="absolute top-1/2 left-0 -translate-y-1/2 hidden lg:block text-left text-xs text-muted-foreground leading-relaxed">
          <div className="inline-flex items-center gap-1.5">
            <SignalIcon size={13} /> {activeSources} مصادر وطنية
          </div>
          <div className="inline-flex items-center gap-1.5">
            <NewspaperIcon size={13} /> {totalNews.toLocaleString('ar-DZ')} خبر مؤرشف
          </div>
          <div className="inline-flex items-center gap-1.5">
            <BotIcon size={13} /> بوتات تلغرام مخصصة
          </div>
        </div>
      </div>

      <div className="rule-double" />
    </header>
  );
}
