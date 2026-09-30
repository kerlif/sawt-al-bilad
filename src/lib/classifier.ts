// ============================================================
// مصنّف الأخبار — طبقتان:
//   1) طبقة القواعد: كلمات مفتاحية سريعة (عربي/فرنسي)
//   2) طبقة التحقق: نموذج لغوي (LLM) لضبط الفئات الغامضة
// ============================================================

import ZAI from 'z-ai-web-dev-sdk';
import {
  CATEGORIES,
  DEFAULT_CATEGORY,
  ruleClassify,
  ruleBreaking,
} from './categories';

export interface ClassificationResult {
  category: string;
  language: 'ar' | 'fr';
  isBreaking: boolean;
  breakingReason?: 'keyword' | 'multi-source';
  method: 'rules' | 'llm' | 'rules+llm-fallback';
}

/** كشف اللغة: وجود حروف عربية كافٍ = عربي، وإلا فرنسي */
export function detectLanguage(text: string): 'ar' | 'fr' {
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) ?? []).length;
  return arabicChars >= Math.max(3, text.length * 0.15) ? 'ar' : 'fr';
}

/**
 * التصنيف الكامل للخبر.
 * - إن كانت القواعد واثقة (كلمتان فأكثر متطابقتان) نكتفي بها.
 * - في الحالات الغامضة نلجأ إلى النموذج اللغوي، وإن فشل نرجع للقواعد.
 */
export async function classifyNews(
  title: string,
  summary: string,
  opts?: { multiSourceCount?: number }
): Promise<ClassificationResult> {
  const text = `${title} ${summary}`;
  const language = detectLanguage(title);
  const rule = ruleClassify(text);
  const breaking = ruleBreaking(title);

  let isBreaking = breaking.breaking;
  let breakingReason: ClassificationResult['breakingReason'] = breaking.breaking
    ? 'keyword'
    : undefined;

  // تكرار الخبر عبر أكثر من مصدر خلال وقت قصير ⇒ عاجل
  if ((opts?.multiSourceCount ?? 1) >= 2) {
    isBreaking = true;
    breakingReason = 'multi-source';
  }

  // ثقة كافية من القواعد ⇒ لا حاجة للنموذج
  if (rule.score >= 2) {
    return {
      category: rule.category,
      language,
      isBreaking,
      breakingReason,
      method: 'rules',
    };
  }

  // حالة غامضة ⇒ طبقة التحقق بالنموذج اللغوي
  try {
    const llmCategory = await llmClassify(title, summary, language);
    return {
      category: llmCategory ?? rule.category,
      language,
      isBreaking,
      breakingReason,
      method: llmCategory ? 'llm' : 'rules+llm-fallback',
    };
  } catch {
    // فشل النموذج ⇒ نرجع لنتيجة القواعد
    return {
      category: rule.category,
      language,
      isBreaking,
      breakingReason,
      method: 'rules+llm-fallback',
    };
  }
}

/** استدعاء النموذج اللغوي لتصنيف خبر غامض */
async function llmClassify(
  title: string,
  summary: string,
  language: 'ar' | 'fr'
): Promise<string | null> {
  const categoryNames = CATEGORIES.map((c) => c.name).join(' | ');

  const prompt = [
    language === 'ar'
      ? 'صنِّف الخبر الجزائري التالي إلى فئة واحدة فقط من القائمة.'
      : "Classez la news algérienne suivante dans une seule catégorie de la liste.",
    `الفئات الممكنة: ${categoryNames}`,
    language === 'ar'
      ? 'أجب باسم الفئة فقط، دون أي شرح.'
      : 'Répondez uniquement avec le nom de la catégorie, sans explication.',
    '',
    `العنوان: ${title}`,
    `الملخص: ${summary}`,
  ].join('\n');

  const zai = await ZAI.create();
  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          'أنت مساعد دقيق متخصص في تصنيف الأخبار الجزائرية. تجيب دائماً باسم فئة واحد فقط من القائمة المقدمة، دون أي نص إضافي.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.1,
    max_tokens: 20,
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? '';
  // تحقق أن الرد فئة صحيحة (قد يضيف النموذج رموزاً)
  for (const cat of CATEGORIES) {
    if (raw.includes(cat.name)) return cat.name;
  }
  if (raw.includes('عاجل')) return DEFAULT_CATEGORY; // العاجل يُحدَّد آلياً وليس بالـ LLM
  return null;
}
