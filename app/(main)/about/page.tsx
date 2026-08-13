import { Metadata } from "next";
import AboutContent from "@/components/About/AboutContent";

export const metadata: Metadata = {
  title: "عن المجتمع - مقرأة النيل",
  description: "تعرف على مجتمع مقرأة النيل، رؤيتنا، قيمنا، وفرق العمل المختلفة",
};

export default function AboutPage() {
  return <AboutContent />;
}
