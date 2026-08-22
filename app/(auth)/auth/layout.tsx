import type { Metadata } from "next";
import "../../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://nile-quran-community.com"),
  title: "تسجيل الدخول | مقرأة النيل",
  description:
    "سجّل الدخول أو أنشئ حسابك في مقرأة النيل — مجتمع قرآني لطلاب الجامعة: ورد أسبوعي للحفظ والتسميع، خواطر تدبر، وصحبة صالحة تعينك على المداومة نحو أثر باقٍ.",
  keywords: [
    "مقرأة النيل",
    "تسجيل الدخول",
    "إنشاء حساب",
    "مجتمع قرآني",
    "حفظ القرآن الكريم",
    "تسميع القرآن",
    "طلاب الجامعة",
  ],
  openGraph: {
    title: "تسجيل الدخول | مقرأة النيل",
    description:
      "انضم إلى مجتمع مقرأة النيل القرآني وداوم على الحفظ والتسميع والتدبر في صحبة صالحة.",
    siteName: "مقرأة النيل",
    locale: "ar_EG",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "مجتمع مقرأة النيل — مجتمع قرآني يجمعنا وصحبة خير ترفعنا",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="">
      <body className={`antialiased min-h-screen w-screen bg-[#EBF0EB]`}>{children}</body>
    </html>
  );
}
