// ============================================================
// الفئات والكلمات المفتاحية — الطبقة الأولى من التصنيف (قواعد سريعة)
// الفئات المطلوبة: سياسة، اقتصاد، علاقات دولية، رئاسيات ومناصب، مجتمع، عاجل
// + فئات منطقية مضافة: رياضة، علوم وتكنولوجيا، ثقافة وفنون
// ============================================================

export interface CategoryDef {
  name: string;
  emoji?: string;
  description: string;
  // كلمات مفتاحية بالعربية والفرنسية (بحث غير حساس لحالة الأحرف)
  keywords: string[];
  // اللغة المعروضة للفئة في البوت الفرنسي
  fr: string;
}

export const CATEGORIES: CategoryDef[] = [
  {
    name: 'رئاسيات ومناصب',
    fr: 'Présidence & postes',
    description: 'رئاسة الجمهورية، التعيينات، المناصب العليا، الوزراء، الولاة',
    keywords: [
      'الرئيس', 'رئيس الجمهورية', 'التعيين', 'عين', 'معين', 'وزير', 'حكومة',
      'رئاسة الجمهورية', 'الوزير الأول', 'الولاة', 'عيّن', 'مرسوم رئاسي',
      'قسمة يمين', 'منصب', 'الأمانة العامة', 'تعيينات', 'المدير العام',
      'président', 'tebboune', 'gouvernement', 'ministre', 'remaniement',
      'nomination', 'nommé', 'décret présidentiel', 'premier ministre',
      'secrétaire général', 'wali',
    ],
  },
  {
    name: 'سياسة',
    fr: 'Politique',
    description: 'البرلمان، الأحزاب، الانتخابات، التشريعات، الشؤون الداخلية',
    keywords: [
      'البرلمان', 'البرلمان', 'المجلس الشعبي الوطني', 'مجلس الأمة', 'الأحزاب',
      'الانتخابات', 'انتخابات', 'انتخاب', 'الناخبون', 'الحملة الانتخابية',
      'قانون', 'تشريع', 'معارضة', 'تعددية', 'جمعية وطنية', 'السياسة',
      'استفتاء', 'الدستور', 'حزبي', 'نائب برلماني', 'مجلس الأمن',
      'parlement', 'assemblée populaire', 'sénat', 'parti politique',
      'élections', 'électoral', 'loi', 'constitution', 'référendum',
      'opposition', 'politique', 'député', 'campagne électorale',
    ],
  },
  {
    name: 'اقتصاد',
    fr: 'Économie',
    description: 'السوق، المالية، الاستثمار، الطاقة، التجارة، الأسعار',
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
  },
  {
    name: 'علاقات دولية',
    fr: 'Relations internationales',
    description: 'الدبلوماسية، المفاوضات، الساهر الإفريقي، الجزائر والعالم',
    keywords: [
      'علاقات دولية', 'الدبلوماسية', 'دبلوماسي', 'المفاوضات', 'اتفاقية',
      'الخارجية', 'وزارة الخارجية', 'السفير', 'سفارة', 'القمة', 'قمة',
      'الاتحاد الإفريقي', 'الجامعة العربية', 'الأمم المتحدة', 'المغرب العربي',
      'الصحراء الغربية', 'توأمة', 'زيارة رسمية', 'التعاون الدولي',
      'la diplomatie', 'diplomatique', 'négociations', 'accord bilatéral',
      'affaires étrangères', 'ambassadeur', 'ambassade', 'sommet',
      'union africaine', 'ligue arabe', 'nations unies', 'onu',
      'sahara occidental', 'coopération internationale', 'visité',
    ],
  },
  {
    name: 'مجتمع',
    fr: 'Société',
    description: 'التعليم، الصحة، الخدمات، الأحوال الجوية، الحياة اليومية',
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
  },
  {
    name: 'رياضة',
    fr: 'Sport',
    description: 'كرة القدم، المنتخبات، البطولات، الملاعب',
    keywords: [
      'رياضة', 'كرة القدم', 'المنتخب', 'الخضر', 'محاربو الصحراء',
      'الدوري', 'الرابطة', 'بطولة', 'كأس', 'الوداد', 'مباراة',
      'المدرب', 'اللاعب', 'هدف', 'الأولمبياد', 'دوري الأبطال',
      'الكره الذهبي', 'ملاعب', 'بطاقة حمراء', 'ركلة جزاء',
      'sport', 'football', 'sélection nationale', 'les verts',
      'championnat', 'ligue', 'coupe', 'match', 'entraîneur',
      'joueur', 'but', 'olympique', 'ligue des champions', 'stade',
    ],
  },
  {
    name: 'علوم وتكنولوجيا',
    fr: 'Sciences & Tech',
    description: 'الفضاء، الابتكار، الرقمنة، الذكاء الاصطناعي، البحث العلمي',
    keywords: [
      'علوم', 'تكنولوجيا', 'تقنية', 'الرقمنة', 'رقمنة', 'الذكاء الاصطناعي',
      'الفضاء', 'الساتل', 'أبحاث', 'ابتكار', 'اختراع', 'الطاقة المتجددة',
      'الطاقة الشمسية', 'الأنترنت', 'الإنترنت', 'الهاتف', 'تطبيق',
      'برنامج فضائي', 'الوكالة الفضائية', 'أقمار صناعية',
      'sciences', 'technologie', 'numérisation', 'intelligence artificielle',
      'espace', 'satellite', 'recherche scientifique', 'innovation',
      'invention', 'renouvelables', 'solaire', 'internet', 'application',
      'agence spatiale',
    ],
  },
  {
    name: 'ثقافة وفنون',
    fr: 'Culture & Arts',
    description: 'المهرجانات، السينما، الموروث، التراث، الكتب',
    keywords: [
      'ثقافة', 'ثقافي', 'مهرجان', 'سينما', 'فيلم', 'مسرح', 'معرض',
      'التراث', 'موروث', 'فنون', 'أدب', 'كتاب', 'رواية', 'قصيدة',
      'الموسيقى', 'الراب', 'يويو', 'الرايس', 'المتحف', 'اليونسكو',
      'التراث اللامادي', 'رسم', 'نحت', 'باليه', 'أوبرا',
      'culture', 'culturel', 'festival', 'cinéma', 'film', 'théâtre',
      'exposition', 'patrimoine', 'art', 'littérature', 'livre',
      'roman', 'poésie', 'musique', 'musée', 'unesco', 'patrimoine immatériel',
    ],
  },
];

/** الفئة الافتراضية عند غياب أي تطابق */
export const DEFAULT_CATEGORY = 'مجتمع';

/** فئة العاجل — تُحدَّد بكلمات دالة أو بتكرار الخبر عبر مصادر متعددة */
export const BREAKING_CATEGORY = 'عاجل';

export const BREAKING_KEYWORDS = [
  'عاجل', 'طارئ', 'طارئه', 'الآن', 'حصريا', 'خبر عاجل', 'تحديث عاجل',
  'الأمن ينقل', 'بعد لحظات', 'breaking', 'urgent', 'alerte', 'flash info',
  'dernière minute', 'derniere minute', 'en direct',
];

/** كلمات مفتاحية شديدة الدلالة على العاجل (تكفي وحدها لرفع العلم) */
export const BREAKING_STRONG_KEYWORDS = [
  'عاجل', 'breaking', 'dernière minute', 'derniere minute', 'طارئ',
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

/** تطبيق قواعد الكلمات المفتاحية على نص (عنوان + ملخص) */
export function ruleClassify(text: string): {
  category: string;
  matched: string[];
  score: number;
} {
  const lower = text.toLowerCase();
  const scores = new Map<string, string[]>();

  for (const cat of CATEGORIES) {
    for (const kw of cat.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        const arr = scores.get(cat.name) ?? [];
        arr.push(kw);
        scores.set(cat.name, arr);
      }
    }
  }

  if (scores.size === 0) {
    return { category: DEFAULT_CATEGORY, matched: [], score: 0 };
  }

  // الفئة الأكثر تطابقاً بالكلمات
  let best: { name: string; count: number } = { name: DEFAULT_CATEGORY, count: 0 };
  let totalMatched: string[] = [];
  for (const [name, matched] of scores) {
    if (matched.length > best.count) {
      best = { name, count: matched.length };
      totalMatched = matched;
    }
  }
  return { category: best.name, matched: totalMatched, score: best.count };
}

/** فحص كلمات العاجل */
export function ruleBreaking(text: string): { breaking: boolean; keyword?: string } {
  const lower = text.toLowerCase();
  for (const kw of BREAKING_STRONG_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      return { breaking: true, keyword: kw };
    }
  }
  for (const kw of BREAKING_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      return { breaking: true, keyword: kw };
    }
  }
  return { breaking: false };
}
