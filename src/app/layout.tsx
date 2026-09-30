import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// ============================================================
// «صوت البلاد» — التخطيط الجذري
// - html عربي بالكامل (lang=ar + dir=rtl)
// - الخطوط العربية الزخرفية (أميري، مقرئي، شحرزاد) تُحمَّل من Google Fonts
//   عبر وصلات <link> (تعمل وقت التشغيل — لا تعتمد على الشبكة وقت البناء)
// ============================================================

export const metadata: Metadata = {
  title: "صوت البلاد — جريدة الأخبار الجزائرية",
  description:
    "جريدة إلكترونية جزائرية بطابع صحفي كلاسيكي: تجميع آلي للعناوين والملخصات من المصادر الوطنية، مع روابط أصلية لكل خبر وتصدير PDF بحجم A4.",
  keywords: ["جريدة", "أخبار الجزائر", "عاجل", "سياسة", "اقتصاد", "رياضة", "صوت البلاد"],
  authors: [{ name: "صوت البلاد" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "صوت البلاد — جريدة الأخبار الجزائرية",
    description: "تجميع آلي لأخبار الجزائر من المصادر الوطنية — العناوين والملخصات والروابط الأصلية.",
    siteName: "صوت البلاد",
    type: "website",
    locale: "ar_DZ",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

/** وصلات الخطوط العربية — تُحوَّل تلقائياً إلى <head> عبر React 19 */
function ArabicFonts() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        precedence="default"
        href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Markazi+Text:wght@400..700&family=Scheherazade+New:wght@400;500;600;700&display=swap"
      />
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <ArabicFonts />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
