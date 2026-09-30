'use client';

// ============================================================
// أعلام SVG أصلية — بديل دقيق عن إيموجي الأعلام
// علم الجزائر وفق البنية الرسمية:
//   نصفان رأسياً متساويان (أخضر 006233 / أبيض) ونسبة 2:3
//   هلال ونجمة حمراء (D21034) متمركزان حول منتصف العلم
//   الهلال: دائرة خارجية نصف قطرها 180 حول مركز العلم
//   ودائرة داخلية نصف قطرها 150 منزاحة نحو جهة الفتح
// ============================================================

export function FlagDZ({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 900 600"
      className={className}
      role="img"
      aria-label="علم الجزائر"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect width="900" height="600" fill="#ffffff" />
      <rect width="450" height="600" fill="#006233" />
      {/* الهلال: قوس خارجي (الدائرة الكبرى) + قوس داخلي (الدائرة المقتطعة) */}
      <path
        d="M593.75 191.7 A180 180 0 1 0 593.75 408.3 A150 150 0 1 1 593.75 191.7 Z"
        fill="#d21034"
      />
      {/* النجمة الخماسية — رأسها للأعلى، داخل فتحة الهلال */}
      <polygon
        points="450,200 472.5,269.1 545.1,269.1 486.3,311.8 508.8,380.9 450,338.2 391.2,380.9 413.7,311.8 354.9,269.1 427.5,269.1"
        fill="#d21034"
      />
    </svg>
  );
}

/* علم فرنسا — لوسم الخبرات الفرنسية */
export function FlagFR({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 900 600"
      className={className}
      role="img"
      aria-label="علم فرنسا"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect width="900" height="600" fill="#ffffff" />
      <rect width="300" height="600" fill="#002395" />
      <rect x="600" width="300" height="600" fill="#ed2939" />
    </svg>
  );
}

/* شارة لغة صغيرة: علم + نص */
export function LangChip({ lang, withText = true }: { lang: string; withText?: boolean }) {
  const isFr = lang === 'fr';
  const Flag = isFr ? FlagFR : FlagDZ;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Flag className="inline-block h-3 w-[18px] rounded-[2px] border border-rule shadow-sm" />
      {withText && <span>{isFr ? 'فرنسي' : 'عربي'}</span>}
    </span>
  );
}
