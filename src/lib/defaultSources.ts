// ============================================================
// المصادر الجزائرية الافتراضية — مشتركة بين سكربت التعبئة
// والتهيئة الذاتية عند الإقلاع على بيئات الاستضافة
// ============================================================

export interface DefaultSource {
  name: string;
  rssUrl: string;
  siteUrl: string;
  language: string;
}

export const DEFAULT_SOURCES: DefaultSource[] = [
  {
    name: 'الشروق أونلاين',
    rssUrl: 'https://www.echoroukonline.com/feed',
    siteUrl: 'https://www.echoroukonline.com',
    language: 'ar',
  },
  {
    name: 'النهار أونلاين',
    rssUrl: 'https://www.ennaharonline.com/feed',
    siteUrl: 'https://www.ennaharonline.com',
    language: 'ar',
  },
  {
    name: 'البلاد',
    rssUrl: 'https://www.elbilad.net/feed',
    siteUrl: 'https://www.elbilad.net',
    language: 'ar',
  },
  {
    name: 'TSA — Tout sur l’Algérie',
    rssUrl: 'https://www.tsa-algerie.com/feed/',
    siteUrl: 'https://www.tsa-algerie.com',
    language: 'fr',
  },
  {
    name: 'الوطن — El Watan',
    rssUrl: 'https://www.elwatan-dz.com/feed',
    siteUrl: 'https://www.elwatan-dz.com',
    language: 'fr',
  },
  {
    name: 'الحرية — Liberté',
    rssUrl: 'https://www.liberte-algerie.com/feed',
    siteUrl: 'https://www.liberte-algerie.com',
    language: 'fr',
  },
  {
    name: 'الجزائر 360',
    rssUrl: 'https://www.algerie360.com/feed',
    siteUrl: 'https://www.algerie360.com',
    language: 'fr',
  },
  {
    name: 'الجزائر إيكو — Algérie Éco',
    rssUrl: 'https://www.algerie-eco.com/feed',
    siteUrl: 'https://www.algerie-eco.com',
    language: 'fr',
  },
  {
    name: 'أخبار جوجل — الجزائر (عربي)',
    rssUrl:
      'https://news.google.com/rss/search?q=%D8%A7%D9%84%D8%AC%D8%B2%D8%A7%D8%A6%D8%B8&hl=ar&gl=DZ&ceid=DZ:ar',
    siteUrl: 'https://news.google.com',
    language: 'ar',
  },
  {
    name: 'Google News — Algérie (Français)',
    rssUrl:
      'https://news.google.com/rss/search?q=Alg%C3%A9rie&hl=fr&gl=DZ&ceid=DZ:fr',
    siteUrl: 'https://news.google.com',
    language: 'fr',
  },
];
