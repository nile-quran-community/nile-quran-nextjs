import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import NavBar from "@/components/NavBar/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "مقرأة النيل — صحبة صالحة حول القرآن",
    template: "%s | مقرأة النيل",
  },
  description:
    "مقرأة النيل منصة مجتمع قرآني لطلاب الجامعة، تعينهم على المداومة على حفظ القرآن الكريم وتسميعه وتدبره في صحبة صالحة ومحاسبة أسبوعية — نحو أثر باقٍ.",
  keywords: [
    "مقرأة النيل",
    "مجتمع قرآني",
    "حفظ القرآن الكريم",
    "تسميع القرآن",
    "تدبر القرآن",
    "صحبة صالحة",
    "طلاب الجامعة",
    "ورد أسبوعي",
    "خاطرة قرآنية",
  ],
  applicationName: "مقرأة النيل",
  openGraph: {
    title: "مقرأة النيل — صحبة صالحة، حول القرآن، نحو أثر باقٍ",
    description:
      "منصة تدعم مجتمعًا قرآنيًا لطلاب الجامعة: ورد أسبوعي للحفظ والتسميع، خواطر تدبر، وصحبة تعين على المداومة.",
    siteName: "مقرأة النيل",
    locale: "ar_EG",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#EBF0EB] w-full h-full`}
      >
        <NavBar />
        {children}
      </body>
    </html>
  );
}
