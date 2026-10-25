// ============================================================
// مصنّف الأخبار — طبقتان:
//   1) طبقة القواعد: كلمات مفتاحية موزونة (عربي/فرنسي)
//   2) طبقة التحقق: نموذج لغوي (LLM) للحالات الغامضة
//
// قواعد الدقة (v2):
// - القواعد وحدها لا تكفي إلا إذا كانت واثقة فعلاً: نقاط كافية
//   وفارق واضح عن المنافس الثاني، وبلا تضارب قوي بين فئتين
// - غير ذلك يُحال الخبر على النموذج، مع تعريف كل فئة في الـ prompt
//   حتى يميّز المتقاربة (رئاسيات/سياسة/علاقات دولية…)
// - ردّ النموذج يُقبل بالعربية أو الفرنسية (سابقاً كان الرد الفرنسي
//   يُرفض فيُرجع للقواعد الخاطئة)
// - فئة ثانوية للخبر المختلط الطبيعة، فيظهر في تبويبيه
// ============================================================

import ZAI from 'z-ai-web-dev-sdk';
import {
  CATEGORIES,
  ruleClassify,
  ruleBreaking,
} from './categories';

export interface ClassificationResult {
  category: string;
  /** فئة ثانوية للخبر المختلط — null إن لم توجد منافسة قريبة */
  secondaryCategory: string | null;
  language: 'ar' | 'fr';
  isBreaking: boolean;
  breakingReason?: 'keyword';
  method: 'rules' | 'llm' | 'rules+llm-fallback';
}

/** كشف اللغة: وجود حروف عربية كافٍ = عربي، وإلا فرنسي */
export function detectLanguage(text: string): 'ar' | 'fr' {
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) ?? []).length;
  return arabicChars >= Math.max(3, text.length * 0.15) ? 'ar' : 'fr';
}

/**
 * التصنيف الكامل للخبر.
 * - قواعد واثقة (نقاط ≥ 4، فارق ≥ 2، بلا تضارب قوي) ⇒ نكتفي بها
 * - غير ذلك ⇒ النموذج اللغوي، وإن فشل نرجع للقواعد
 * - «العاجل» تحدده الكلمات الصريحة فقط؛ تكرار الخبر عبر مصادر
 *   متعددة صار يُظهر شارة «متداول» في الواجهة بدل راية العاجل
 */
export async function classifyNews(
  title: string,
  summary: string
): Promise<ClassificationResult> {
  const language = detectLanguage(title);
  const rule = ruleClassify(title, summary);
  const breaking = ruleBreaking(title);

  const isBreaking = breaking.breaking;
  const breakingReason: ClassificationResult['breakingReason'] = breaking.breaking
    ? 'keyword'
    : undefined;

  // فئة ثانوية من القواعد — تُحفظ حتى لو حسم النموذج الأولى
  const ruleSecondary =
    rule.secondary && rule.secondary !== rule.category ? rule.secondary : null;

  // ثقة القواعد: نقاط كافية + فارق واضح + بلا تضارب قوي بين الأول والثاني
  const runnerUp = rule.scores[1];
  const strongConflict = Boolean(
    runnerUp?.strong && rule.scores[0]?.strong && rule.margin < 4
  );
  const confident =
    rule.score >= 4 && rule.margin >= 2 && !strongConflict;

  if (confident) {
    return {
      category: rule.category,
      secondaryCategory: ruleSecondary,
      language,
      isBreaking,
      breakingReason,
      method: 'rules',
    };
  }

  // حالة غامضة ⇒ طبقة التحقق بالنموذج اللغوي
  try {
    const llmCategory = await llmClassify(title, summary, language);
    if (llmCategory) {
      // الثانوية: منافس القواعد إن كان مختلفاً عن حسم النموذج
      const secondary =
        ruleSecondary && ruleSecondary !== llmCategory ? ruleSecondary : null;
      return {
        category: llmCategory,
        secondaryCategory: secondary,
        language,
        isBreaking,
        breakingReason,
        method: 'llm',
      };
    }
    return {
      category: rule.category,
      secondaryCategory: ruleSecondary,
      language,
      isBreaking,
      breakingReason,
      method: 'rules+llm-fallback',
    };
  } catch {
    // فشل النموذج ⇒ نرجع لنتيجة القواعد
    return {
      category: rule.category,
      secondaryCategory: ruleSecondary,
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
  // الاسم + التعريف لكل فئة — حتى يميّز النموذج الفئات المتقاربة
  const categoryList = CATEGORIES.map(
    (c) => `${c.name} (${c.fr}) — ${c.definition}`
  ).join('\n');

  const prompt = [
    language === 'ar'
      ? 'صنِّف الخبر الجزائري التالي إلى فئة واحدة فقط من القائمة.'
      : "Classez la news algérienne suivante dans une seule catégorie de la liste.",
    `الفئات الممكنة:\n${categoryList}`,
    language === 'ar'
      ? 'أجب باسم الفئة فقط (بالعربية أو الفرنسية كما في القائمة)، دون أي شرح.'
      : 'Répondez uniquement avec le nom de la catégorie (en arabe ou en français comme dans la liste), sans explication.',
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
    max_tokens: 30,
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? '';
  // تحقق أن الرد فئة صحيحة — بالعربية أو الفرنسية (قد يضيف النموذج رموزاً)
  const rawLower = raw.toLowerCase();
  for (const cat of CATEGORIES) {
    if (raw.includes(cat.name) || rawLower.includes(cat.fr.toLowerCase())) {
      return cat.name;
    }
  }
  return null;
}
