// ============================================================
// الفئات والكلمات المفتاحية — الطبقة الأولى من التصنيف (قواعد سريعة)
// الفئات: رئاسيات ومناصب، سياسة، اقتصاد، علاقات دولية، مجتمع،
// رياضة، علوم وتكنولوجيا، ثقافة وفنون
//
// قواعد الدقة (v2):
// - كلمة في العنوان وزنها ×2، وفي الملخص ×1
// - كلمة «قوية» (شديدة الدلالة) وزنها 3 بدل 1
// - المطابقة بحدود الكلمات للكلمات المفردة (فلا تطابق «عين» داخل
//   كلمة أخرى)، والعبارات تُطابق كما هي
// - تجريد «ال» التعريف من أوائل الكلمات حتى يطابق «المنتخب» نص
//   «منتخب» و«والمنتخب» و«بالمنتخب»
// - كلمات الاستبعاد: إن ظهرت ولم يكن للفئة أي تطابق قوي، تُلغى
//   نقاط الفئة (مثلاً خبر رياضي يذكر وزيراً لا يُحسب رئاسيات)
// - لا فئة افتراضية ملوِّثة: غياب أي تطابق ⇒ «غير مصنّف»
// ============================================================

export interface CategoryDef {
  name: string;
  emoji?: string;
  description: string;
  /** تعريف من سطر واحد — يُمرَّر للنموذج اللغوي لتمييز الفئات المتقاربة */
  definition: string;
  /** لون مميّز للقسم في الشارات والتبويبات (hex) */
  color: string;
  /** كلمات مفتاحية عادية (عربي/فرنسي) — وزن 1 */
  keywords: string[];
  /** كلمات شديدة الدلالة (عربي/فرنسي) — وزن 3 */
  strong: string[];
  /** كلمات إن ظهرت ألغت الفئة ما لم يكن لها تطابق قوي */
  excludes: string[];
  // اللغة المعروضة للفئة في البوت الفرنسي
  fr: string;
}

export const CATEGORIES: CategoryDef[] = [
  {
    name: 'رئاسيات ومناصب',
    fr: 'Présidence & postes',
    description: 'رئاسة الجمهورية، التعيينات، المناصب العليا، الوزراء، الولاة',
    definition: 'أخبار رئاسة الجمهورية والتعيينات والمناصب العليا والوزراء والولاة',
    color: '#92400e',
    keywords: [
      'الرئيس', 'رئيس الجمهورية', 'التعيين', 'وزير', 'حكومة',
      'رئاسة الجمهورية', 'الوزير الأول', 'الولاة', 'مرسوم رئاسي',
      'قسمة يمين', 'منصب', 'الأمانة العامة', 'تعيينات', 'المدير العام',
      'président', 'gouvernement', 'ministre', 'remaniement',
      'nomination', 'nommé', 'décret présidentiel', 'premier ministre',
      'secrétaire général', 'wali',
    ],
    strong: ['رئيس الجمهورية', 'رئاسة الجمهورية', 'مرسوم رئاسي', 'décret présidentiel', 'tebboune'],
    excludes: ['مباراة', 'المنتخب', 'بطولة', 'match', 'championnat'],
  },
  {
    name: 'سياسة',
    fr: 'Politique',
    description: 'البرلمان، الأحزاب، الانتخابات، التشريعات، الشؤون الداخلية',
    definition: 'البرلمان والأحزاب والانتخابات والتشريعات والشؤون الداخلية',
    color: '#1e3a5f',
    keywords: [
      'البرلمان', 'المجلس الشعبي الوطني', 'مجلس الأمة', 'الأحزاب',
      'الانتخابات', 'انتخابات', 'انتخاب', 'الناخبون', 'الحملة الانتخابية',
      'قانون', 'تشريع', 'معارضة', 'تعددية', 'جمعية وطنية', 'السياسة',
      'استفتاء', 'الدستور', 'حزبي', 'نائب برلماني',
      'parlement', 'assemblée populaire', 'sénat', 'parti politique',
      'élections', 'électoral', 'loi', 'constitution', 'référendum',
      'opposition', 'politique', 'député', 'campagne électorale',
    ],
    strong: ['المجلس الشعبي الوطني', 'مجلس الأمة', 'الانتخابات', 'الدستور', 'استفتاء', 'élections', 'constitution', 'référendum'],
    excludes: ['مباراة', 'المنتخب', 'بطولة', 'match', 'championnat'],
  },
  {
    name: 'اقتصاد',
    fr: 'Économie',
    description: 'السوق، المالية، الاستثمار، الطاقة، التجارة، الأسعار',
    definition: 'الأسواق والمالية والاستثمار والطاقة الأحفورية والتجارة والأسعار',
    color: '#166534',
    keywords: [
      'اقتصاد', 'الاقتصاد', 'السوق', 'البورصة', 'الاستثمار', 'استثمار',
      'الدينار', 'التضخم', 'أسعار', 'غلاء', 'الدعم', 'سوناطراك',
      'الغاز', 'البترول', 'النفط', 'الميزانية', 'مالية', 'الجمارك',
      'الضريبة', 'ضرائب', 'الصادرات', 'الواردات', 'التجارة', 'البنك',
      'القرض', 'التمويل', 'المقاولات', 'المشاريع', 'منطقة اقتصادية',
      'économie', 'économique', 'marché', 'bourse', 'investissement',
      'dinar', 'inflation', 'prix', 'subvention', 'sonatrach', 'gaz',
      'pétrole', 'budget', 'finances', 'douane', 'impôt', 'exportation',
      'importation', 'commerce', 'banque', 'crédit', 'financement',
      'entreprise', 'croissance', 'fiscalité', 'hydrocarbures',
    ],
    strong: ['سوناطراك', 'sonatrach', 'الدينار', 'dinar', 'قانون المالية', 'hydrocarbures', 'البورصة', 'bourse'],
    excludes: ['مباراة', 'المنتخب', 'match'],
  },
  {
    name: 'علاقات دولية',
    fr: 'Relations internationales',
    description: 'الدبلوماسية، المفاوضات، الساهر الإفريقي، الجزائر والعالم',
    definition: 'الدبلوماسية والعلاقات مع الدول والمنظمات الدولية والقمم',
    color: '#0e7490',
    keywords: [
      'علاقات دولية', 'الدبلوماسية', 'دبلوماسي', 'المفاوضات', 'اتفاقية',
      'الخارجية', 'وزارة الخارجية', 'السفير', 'سفارة', 'القمة', 'قمة',
      'الاتحاد الإفريقي', 'الجامعة العربية', 'الأمم المتحدة', 'المغرب العربي',
      'الصحراء الغربية', 'توأمة', 'زيارة رسمية', 'التعاون الدولي',
      'مجلس الأمن',
      'la diplomatie', 'diplomatique', 'négociations', 'accord bilatéral',
      'affaires étrangères', 'ambassadeur', 'ambassade', 'sommet',
      'union africaine', 'ligue arabe', 'nations unies', 'onu',
      'sahara occidental', 'coopération internationale', 'visité',
    ],
    strong: ['وزارة الخارجية', 'affaires étrangères', 'السفير', 'ambassadeur', 'الأمم المتحدة', 'nations unies', 'مجلس الأمن', 'الصحراء الغربية', 'sahara occidental'],
    excludes: ['مباراة', 'المنتخب', 'match'],
  },
  {
    name: 'مجتمع',
    fr: 'Société',
    description: 'التعليم، الصحة، الخدمات، الأحوال الجوية، الحياة اليومية',
    definition: 'التعليم والصحة والخدمات والطقس والأمن اليومي وحياة المواطنين',
    color: '#57534e',
    keywords: [
      'مجتمع', 'المواطن', 'التعليم', 'المدرسة', 'الجامعة', 'طلبة', 'تلاميذ',
      'الصحة', 'المستشفى', 'الدواء', 'المواصلات', 'الطرق', 'الكهرباء',
      'الماء', 'الإسكان', 'سكن', 'الري', 'الطقس', 'أمطار', 'ثلوج',
      'حرارة', 'الأمن', 'الحماية المدنية', 'الجندرمة', 'الشرطة',
      'حادث', 'حوادث', 'الحركة النقابية', 'إضراب', 'احتجاج',
      'مواطنون', 'البلديات', 'التجمعات', 'الخدمات العمومية', 'مبادرة',
      'société', 'éducation', 'école', 'université', 'étudiants',
      'santé', 'hôpital', 'médicament', 'transport', 'routes',
      'électricité', 'eau potable', 'logement', 'météo', 'pluie',
      'neige', 'canicule', 'sécurité', 'protection civile', 'gendarme',
      'accident', 'grève', 'manifestation', 'syndicat', 'communes',
    ],
    strong: ['الحماية المدنية', 'protection civile', 'الطقس', 'météo', 'إضراب', 'grève'],
    excludes: ['مباراة', 'المنتخب', 'سوناطراك', 'match'],
  },
  {
    name: 'رياضة',
    fr: 'Sport',
    description: 'كرة القدم، المنتخبات، البطولات، الملاعب',
    definition: 'كرة القدم والمنتخبات والبطولات والمباريات',
    color: '#9a3412',
    keywords: [
      'رياضة', 'كرة القدم', 'المنتخب', 'الخضر', 'محاربو الصحراء',
      'الدوري', 'الرابطة', 'بطولة', 'كأس', 'الوداد', 'مباراة',
      'المدرب', 'اللاعب', 'الأولمبياد', 'دوري الأبطال',
      'الكره الذهبي', 'ملاعب', 'بطاقة حمراء', 'ركلة جزاء',
      'sport', 'football', 'sélection nationale', 'les verts',
      'championnat', 'ligue', 'coupe', 'match', 'entraîneur',
      'joueur', 'olympique', 'ligue des champions', 'stade',
    ],
    strong: ['المنتخب', 'الخضر', 'محاربو الصحراء', 'كرة القدم', 'football', 'sélection nationale', 'les verts', 'دوري الأبطال', 'ligue des champions', 'مباراة', 'match'],
    excludes: [],
  },
  {
    name: 'علوم وتكنولوجيا',
    fr: 'Sciences & Tech',
    description: 'الفضاء، الابتكار، الرقمنة، الذكاء الاصطناعي، البحث العلمي',
    definition: 'الفضاء والرقمنة والذكاء الاصطناعي والبحث العلمي والابتكار',
    color: '#0369a1',
    keywords: [
      'علوم', 'تكنولوجيا', 'تقنية', 'الرقمنة', 'رقمنة', 'الذكاء الاصطناعي',
      'الفضاء', 'الساتل', 'أبحاث', 'ابتكار', 'اختراع', 'الطاقة المتجددة',
      'الطاقة الشمسية', 'الأنترنت', 'الإنترنت', 'الهاتف',
      'برنامج فضائي', 'الوكالة الفضائية', 'أقمار صناعية',
      'sciences', 'technologie', 'numérisation', 'intelligence artificielle',
      'espace', 'satellite', 'recherche scientifique', 'innovation',
      'invention', 'renouvelables', 'solaire', 'internet', 'application',
      'agence spatiale',
    ],
    strong: ['الذكاء الاصطناعي', 'intelligence artificielle', 'الفضاء', 'espace', 'الساتل', 'satellite', 'الوكالة الفضائية', 'agence spatiale', 'أقمار صناعية'],
    excludes: ['مباراة', 'المنتخب', 'match'],
  },
  {
    name: 'ثقافة وفنون',
    fr: 'Culture & Arts',
    description: 'المهرجانات، السينما، الموروث، التراث، الكتب',
    definition: 'المهرجانات والسينما والتراث والأدب والفنون',
    color: '#86198f',
    keywords: [
      'ثقافة', 'ثقافي', 'مهرجان', 'سينما', 'فيلم', 'مسرح', 'معرض',
      'التراث', 'موروث', 'فنون', 'أدب', 'كتاب', 'رواية', 'قصيدة',
      'الموسيقى', 'الراب', 'المتحف', 'اليونسكو',
      'التراث اللامادي', 'رسم', 'نحت', 'باليه', 'أوبرا',
      'culture', 'culturel', 'festival', 'cinéma', 'film', 'théâtre',
      'exposition', 'patrimoine', 'art', 'littérature', 'livre',
      'roman', 'poésie', 'musique', 'musée', 'unesco', 'patrimoine immatériel',
    ],
    strong: ['مهرجان', 'festival', 'سينما', 'cinéma', 'التراث', 'patrimoine', 'اليونسكو', 'unesco'],
    excludes: ['مباراة', 'المنتخب', 'كتاب الدولة', 'كاتب الدولة', 'match'],
  },
];

/** لون كل قسم — للشارات والتبويبات */
export const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.name, c.color])
);

/** الفئة الافتراضية عند غياب أي تطابق — لم تعد «مجتمع» حتى لا يتلوث تبويبها */
export const DEFAULT_CATEGORY = 'غير مصنّف';

/** فئة العاجل — تُحدَّد بكلمات دالة صريحة فقط (لم تعد بتكرار المصادر) */
export const BREAKING_CATEGORY = 'عاجل';

/**
 * كلمات العاجل الصريحة فقط. أُسقطت الكلمات العامة التي كانت ترفع الراية
 * خطأً (الآن، حصرياً، en direct، بعد لحظات…) — فتكرار الخبر عبر مصادر
 * متعددة صار يُظهر شارة «متداول» بدل راية العاجل.
 */
export const BREAKING_STRONG_KEYWORDS = [
  'عاجل', 'طارئ', 'breaking', 'dernière minute', 'derniere minute',
  'flash info', 'urgent',
];

/** العثور على فئة بالاسم (عربي أو فرنسي) */
export function findCategory(name: string): CategoryDef | undefined {
  const q = name.trim().toLowerCase();
  return CATEGORIES.find(
    (c) =>
      c.name.toLowerCase() === q ||
      c.fr.toLowerCase() === q ||
      c.name.includes(name.trim()) ||
      (name.trim().length >= 3 && c.fr.toLowerCase().startsWith(q))
  );
}

// ---------- أدوات المطابقة ----------

/** تطبيع للمطابقة: إزالة التشكيل والتطويل، وتجريد «ال» التعريف
 *  (مع سوابقها و/ف/ب/ل/ك) من أوائل الكلمات — حتى يطابق «المنتخب»
 *  نص «منتخب» و«والمنتخب» و«بالمنتخب»، وتتوحد صيغ العبارات */
function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ً-ْٰـ]/g, '')
    .replace(/(^|[^\p{L}\p{N}])([وفبلك])?ال(?=\p{L}{2})/gu, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * مطابقة كلمة مفتاحية:
 * - العبارة (فيها مسافة) تُطابق كما هي
 * - الكلمة المفردة تُطابق بحدود الكلمات (Unicode) حتى لا تطابق
 *   «عين» داخل كلمة أخرى مثلاً
 */
function matchesKeyword(haystack: string, keyword: string): boolean {
  const kw = normalizeForMatch(keyword);
  if (!kw) return false;
  if (kw.includes(' ')) return haystack.includes(kw);
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(kw)}([^\\p{L}\\p{N}]|$)`, 'u');
  return re.test(haystack);
}

export interface CategoryScore {
  name: string;
  score: number;
  /** هل للفئة تطابق قوي واحد على الأقل؟ */
  strong: boolean;
}

/** تطبيق قواعد الكلمات المفتاحية على العنوان والملخص (موزونين) */
export function ruleClassify(
  title: string,
  summary: string
): {
  category: string;
  secondary: string | null;
  matched: string[];
  score: number;
  /** الفرق بين الأول والثاني — يقرر إن كانت الحالة واثقة أم غامضة */
  margin: number;
  scores: CategoryScore[];
} {
  const titleNorm = normalizeForMatch(title);
  const summaryNorm = normalizeForMatch(summary);

  const scores: CategoryScore[] = [];
  let allMatched: string[] = [];

  for (const cat of CATEGORIES) {
    let score = 0;
    let strong = false;
    const matched: string[] = [];

    const add = (kw: string, weight: number, isStrong: boolean) => {
      const inTitle = matchesKeyword(titleNorm, kw);
      const inSummary = !inTitle && matchesKeyword(summaryNorm, kw);
      if (inTitle || inSummary) {
        score += weight * (inTitle ? 2 : 1);
        if (isStrong) strong = true;
        matched.push(kw);
      }
    };

    for (const kw of cat.keywords) add(kw, 1, false);
    for (const kw of cat.strong) add(kw, 3, true);

    // كلمة استبعاد بلا تطابق قوي ⇒ تُلغى نقاط الفئة
    if (!strong) {
      const excluded =
        cat.excludes.some((kw) => matchesKeyword(titleNorm, kw)) ||
        cat.excludes.some((kw) => matchesKeyword(summaryNorm, kw));
      if (excluded) score = 0;
    }

    if (score > 0) {
      scores.push({ name: cat.name, score, strong });
      allMatched = allMatched.concat(matched);
    }
  }

  scores.sort((a, b) => b.score - a.score);

  if (scores.length === 0) {
    return { category: DEFAULT_CATEGORY, secondary: null, matched: [], score: 0, margin: 0, scores: [] };
  }

  const best = scores[0];
  const runnerUp = scores[1];
  const margin = runnerUp ? best.score - runnerUp.score : best.score;

  // فئة ثانوية: منافس قريب فعلاً (نقاط كافية ونصف نقاط الأول على الأقل)
  const secondary =
    runnerUp && runnerUp.score >= 3 && runnerUp.score >= best.score * 0.5
      ? runnerUp.name
      : null;

  return {
    category: best.name,
    secondary,
    matched: allMatched,
    score: best.score,
    margin,
    scores,
  };
}

/** فحص كلمات العاجل الصريحة فقط (في العنوان عادةً) */
export function ruleBreaking(text: string): { breaking: boolean; keyword?: string } {
  const lower = normalizeForMatch(text);
  for (const kw of BREAKING_STRONG_KEYWORDS) {
    if (lower.includes(normalizeForMatch(kw))) {
      return { breaking: true, keyword: kw };
    }
  }
  return { breaking: false };
}
