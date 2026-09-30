# 🔌 توثيق الـ API وبنية قاعدة البيانات

> مرجع سريع للمطورين — وثيقة أطول وأشمل في `README.md`

## نقاط الـ API

### الأخبار

#### `GET /api/news`
قائمة الأخبار مع بحث وفرز وفلترة وترقيم صفحات.

| معلم | قيم | افتراضي |
|---|---|---|
| `category` | اسم فئة (مثل `اقتصاد`) أو `الكل` | `الكل` |
| `search` | نص بحث في العنوان والملخص | — |
| `lang` | `ar` \| `fr` \| `all` | `all` |
| `sort` | `newest` \| `oldest` \| `breaking` | `newest` |
| `breaking` | `1` للعاجل فقط | — |
| `page` | رقم الصفحة | `1` |
| `limit` | حجم الصفحة (1–60) | `24` |

```json
{
  "items": [{
    "id": "...", "title": "...", "summary": "...",
    "url": "...", "imageUrl": "...",
    "publishedAt": "2026-09-27T09:00:00.000Z",
    "language": "ar", "category": "اقتصاد",
    "isBreaking": false, "sourceCount": 2,
    "sourceName": "الشروق أونلاين"
  }],
  "total": 125, "page": 1, "pages": 6
}
```

#### `GET /api/categories`
الفئات التسع مع العدّادات + `breakingCount` + `total`.

### الجلب

#### `POST /api/fetch`
دورة جلب يدوية متوازية من كل المصادر النشطة + إعادة تقييم العاجل.
يعيد: `{ok, total, ok_count, failed, inserted, updated, details[]}`.

### المصادر

| نقطة | وظيفة |
|---|---|
| `GET /api/sources` | كل المصادر مع الحالة وعدد الأخبار |
| `POST /api/sources` | إضافة: `{name, rssUrl, language(ar|fr), siteUrl?}` |
| `PATCH /api/sources/[id]` | `{isActive?} , {name?} , {language?}` |
| `DELETE /api/sources/[id]` | حذف المصدر وأخباره |
| `POST /api/sources/[id]` | اختبار جلب فوري لهذا المصدر وحده |

### بوتات تلغرام

| نقطة | وظيفة |
|---|---|
| `GET /api/bots` | قائمة البوتات — **بدون أي توكن** + `runningBotIds` |
| `POST /api/bots` | `{name, token, activate:true}` → يُشفَّر ويُفعَّل فوراً |
| `PATCH /api/bots/[id]` | `{isActive:true|false}` — تشغيل/إيقاف polling |
| `DELETE /api/bots/[id]` | إيقاف وحذف نهائي |

أخطاء التسجيل المحتملة: `400` صيغة غير صالحة، `409` توكن مسجل سابقاً.
عند فشل التفعيل يعيد `started:false` + `startError` آمنة (مثل «توكن غير صالح»).

### الإعدادات والإحصاء

| نقطة | وظيفة |
|---|---|
| `GET /api/settings` | `fetchIntervalMinutes` + عدّادات المصادر |
| `PATCH /api/settings` | `{fetchIntervalMinutes: 5..60}` — يعيد الجدولة |
| `GET /api/stats` | إحصائيات شاملة (أخبار، عاجل، مصادر، بوتات، مشتركون، لغات) |

### التصدير للمطورين

| نقطة | وظيفة |
|---|---|
| `GET /api/export/json` | JSON: `{meta{license,...}, items[]}` — معلمات `category, lang, limit(≤200)` |
| `GET /api/export/rss` | خلاصة RSS 2.0 — نفس المعلمات (limit ≤ 100) |

الرخصة المعلنة في التصدير: عناوين وملخصات (≤40 كلمة) مع روابط — النصوص
الكاملة محفوظة لمصادرها.

---

## بنية قاعدة البيانات (Prisma / SQLite)

### `NewsItem` — الأخبار
| عمود | نوع | ملاحظات |
|---|---|---|
| `id` | String @id | cuid |
| `hash` | String @unique | sha256(`عنوان مطبّع` + `||` + `رابط مطبّع`) — منع التكرار المطلق |
| `titleKey` | String @index | العنوان المطبّع — كشف نفس الخبر عبر المصادر (نافذة 6 ساعات) |
| `title` | String | العنوان الأصلي |
| `summary` | String | ≤ 40 كلمة (لا نص المقال) |
| `url` | String | رابط المصدر الأصلي |
| `imageUrl` | String? | صورة الخلاصة (enclosure / media:content / أول صورة) |
| `publishedAt` | DateTime @index | تحليل تاريخ آمن مع صيغ احتياطية |
| `fetchedAt` | DateTime | وقت الجلب |
| `language` | String | `ar` \| `fr` (كشف تلقائي بالحروف العربية) |
| `category` | String @index | إحدى الفئات التسع |
| `isBreaking` | Boolean @index | كلمات دالة أو `sourceCount ≥ 2` |
| `sourceCount` | Int | كم مصدراً نشر الخبر نفسه |
| `sourceId` | String → Source | حذف تتابعي |

### `Source` — المصادر
`id, name, rssUrl(@unique), siteUrl, language, type("rss"|"scrape"),
isActive, lastFetchAt, lastStatus, itemCount`

### `BotToken` — البوتات
`id, name, encryptedToken(AES-256-GCM), tokenFingerprint(HMAC-SHA256, @unique),
username, isActive, createdAt, lastPollAt, lastError`

### `BotSubscriber` — مشتركو البوت
`id, botId→BotToken, chatId` — فريد مركب `(botId, chatId)`.

### `Setting` — إعدادات مفتاح/قيمة
مفتاح `fetchIntervalMinutes`.

## دورة حياة الخبر

```
RSS Source ──▶ parser (15s timeout) ──▶ لكل خبر:
  ├─ hash موجود؟ → تجاهل (منع التكرار)
  ├─ titleKey مطابق خلال 6 ساعات من مصدر آخر؟ → sourceCount+1 وربما isBreaking
  ├─ لا → تلخيص ≤40 كلمة + صورة + تاريخ آمن
  ├─ تصنيف: قواعد (score≥2 ⇒ كافٍ) وإلا LLM (z-ai-web-dev-sdk)
  └─ INSERT
بعد الدورة: إعادة تقييم isBreaking لكل أخبار النافذة
```
