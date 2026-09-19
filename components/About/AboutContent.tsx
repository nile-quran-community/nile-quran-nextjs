import { Lalezar, Tajawal } from "next/font/google";
import { PageHero } from "@/components/ui/PageHero";
import { GROUPS, type GroupName } from "@/lib/profile-types";
import {
  BookOpen,
  Compass,
  BookMarked,
  Star,
  Globe,
  Users,
  CheckCircle,
  Handshake,
  TrendingUp,
  Wallet,
  MapPin,
  MessagesSquare,
  Quote,
} from "lucide-react";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
});

// ============================
// 🟢 Data
// ============================
type ValueItem = {
  name: string;
  description: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

const VALUES: ValueItem[] = [
  {
    name: "معرفة الله",
    description: "نسعى لمعرفة الله وفهم مراده.",
    Icon: BookOpen,
  },
  {
    name: "مركزية الوحي",
    description: "نجعل الوحي أساسًا لفهم الحياة والعمل.",
    Icon: Compass,
  },
  {
    name: "القرآن والتدبر",
    description: "نجتمع حول القرآن تلاوةً وتدبرًا وعملًا.",
    Icon: BookMarked,
  },
  {
    name: "الاعتزاز بالإسلام",
    description: "نعتز بديننا ويظهر أثره في حياتنا.",
    Icon: Star,
  },
  {
    name: "الهوية واللغة",
    description: "نعتز بهويتنا الإسلامية ولغتنا العربية.",
    Icon: Globe,
  },
  {
    name: "الصحبة الصالحة",
    description: "نتواصى بالحق ونعين بعضنا على الثبات.",
    Icon: Users,
  },
  {
    name: "الصدق والإخلاص",
    description: "نصدق مع الله ومع أنفسنا ومع إخواننا.",
    Icon: CheckCircle,
  },
  {
    name: "الرحمة والتعاون",
    description: "نتراحم ونتعاون على البر والتقوى.",
    Icon: Handshake,
  },
  {
    name: "علو الهمة والعمل",
    description: "نرفع هممنا ونحوّل إيماننا إلى عمل نافع.",
    Icon: TrendingUp,
  },
];

// The teams as the community introduces them. Order is this page's own call; the
// names, descriptions and icons come from the group registry, so a rename lands
// here without touching this file.
const ABOUT_TEAMS: GroupName[] = [
  "Admin",
  "Developer",
  "Media",
  "Beast",
  "Researcher",
  "Treasurer",
];

const VISION_GOALS = [
  "التقرب من رب العالمين لتحقيق الأنس به",
  "تدبر القرآن وعلوم الدين لفهم مراد الله وتعزيز الثقة بالإسلام",
  "التواصي بالحق والتعاون على البر لتقوية أواصر المحبة في الله",
  "الاعتناء بقضايا المسلمين العامة والخاصة لسد ثغور الدعوة",
  "العمل من أجل أمتنا الإسلامية لتكون لها السيادة والريادة",
];

// ============================
// 🟢 Component
// ============================
export default function AboutContent() {
  return (
    <div className="w-full bg-[#EBF0EB] min-h-screen" dir="rtl">
      <PageHero innerClassName="gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.jpeg"
          alt="مقرأة النيل"
          width={240}
          height={240}
          className="h-20 md:h-24 w-auto self-start rounded-2xl shadow-md"
        />

        <h1 className={`${lalezar.className} text-3xl md:text-5xl leading-tight`}>
          عن مجتمع مقرأة النيل
        </h1>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[#BEE663]/30" />
          <p className={`${lalezar.className} text-xl md:text-2xl text-[#BEE663]`}>
            ولتكن منكم أمة
          </p>
          <div className="h-px flex-1 bg-[#BEE663]/30" />
        </div>

        <div className="flex flex-col gap-4 max-w-3xl">
          <p
            className={`${tajawal.className} text-base md:text-[17px] leading-[1.9] text-white/90 font-normal`}
          >
            مرحلة الجامعة من أجمل وأهم مراحل حياة الشاب؛ فيها تتسع مداركه، وتتكوّن شخصيته، وتتشكّل
            طموحاته وعلاقاته، ويبدأ في رسم ملامح مستقبله.
          </p>
          <p
            className={`${tajawal.className} text-base md:text-[17px] leading-[1.9] text-white/90 font-normal`}
          >
            وفي خضم هذه الرحلة، يظل الإنسان في حاجة إلى صحبة تعينه على الخير، وتذكّره بالله، وتشاركه
            الطريق إليه؛ ليكون غيثًا نافعًا أينما حل.
          </p>
          <p
            className={`${tajawal.className} text-base md:text-[17px] leading-[1.9] text-white/80 font-normal`}
          >
            ومن هنا تبرز الحاجة إلى مجتمع يجمع الشباب على القرآن، ويهيئ لهم بيئة صالحة ينمون فيها
            معًا، ويتواصون بالحق، ويتعاونون على البر والتقوى.
          </p>
        </div>
      </PageHero>

      {/* ============================ */}
      {/* 🟢 Content */}
      {/* ============================ */}
      <div className="max-w-4xl mx-auto px-6 md:px-10 py-10 md:py-14 flex flex-col gap-6">
        {/* Why */}
        <Section eyebrow="الفلسفة" title="لماذا مجتمع مقرأة النيل؟">
          <div className="flex flex-col gap-4">
            <p
              className={`${tajawal.className} text-[15px] md:text-base leading-[1.95] text-[#043F2E]/85 font-normal`}
            >
              لم ينشأ المجتمع من فراغ، وإنما جاء استجابةً لحاجة واضحة في نفوس الشباب.
            </p>
            <p
              className={`${tajawal.className} text-[15px] md:text-base leading-[1.95] text-[#043F2E]/85 font-normal`}
            >
              فالإنسان بفطرته يسأل عن المعنى والمصير، ويبني على ذلك تصوراته عن الحياة والدين، فيتمثَّل
              ذلك في أدقّ تفاصيل حياته. والمسلم لا يقبل أن تُفصل حياته عن دينه، أو أن تُنزع القداسة عن
              علاقته بالله، أو أن يصبح الدين هامشيًا في مغامراته وتجاربه في الحياة.
            </p>
            <p
              className={`${tajawal.className} text-[15px] md:text-base leading-[1.95] text-[#043F2E]/85 font-normal`}
            >
              ومن هنا جاءت <span className="font-bold text-[#043F2E]">مقرأة النيل</span> لتكون
              نبراسًا يهتدي به الشباب ويُضفي معنًا لمساعيهم بإعادة تمركزهم حول وحي السماء وفقه مراده.
            </p>
            <p
              className={`${tajawal.className} text-[15px] md:text-base leading-[1.95] text-[#043F2E]/85 font-normal`}
            >
              وبهذا يهدف المجتمع إلى إحياء الهوية الإسلامية والحفاظ عليها في دواخلنا وسلوكياتنا، فيدفع
              الشباب إلى مواجهة أمواج الشبهات والشهوات والتغريب بثلاثية{" "}
              <span className="font-bold text-[#043F2E]">التفكر</span> و
              <span className="font-bold text-[#043F2E]">التقوى</span> و
              <span className="font-bold text-[#043F2E]">العمل</span>.
            </p>
            <p
              className={`${tajawal.className} text-[15px] md:text-base leading-[1.95] text-[#043F2E]/85 font-normal`}
            >
              وقد لمسنا هذا الاحتياج في تفاعل الشباب عند ذكر كلام الله، وفي إصغائهم عند الحديث عن رسول
              الله ﷺ، وفي رغبتهم الصادقة في العودة إلى طريق يرضي الله.
            </p>
            <p
              className={`${tajawal.className} text-[15px] md:text-base leading-[1.95] text-[#043F2E]/85 font-normal`}
            >
              إنهم يريدون العود.
            </p>
            <p
              className={`${lalezar.className} text-2xl md:text-3xl text-[#043F2E] text-center mt-2`}
            >
              والعود أحمد.
            </p>
          </div>
        </Section>

        {/* Vision */}
        <Section eyebrow="الوجهة" title="رؤيتنا">
          <div className="flex flex-col gap-5">
            <p
              className={`${tajawal.className} text-[15px] md:text-base leading-[1.95] text-[#043F2E]/85 font-normal`}
            >
              نسعى من خلال المجتمع إلى:
            </p>
            <ul className="flex flex-col gap-2.5">
              {VISION_GOALS.map((goal) => (
                <li
                  key={goal}
                  className={`${tajawal.className} flex items-start gap-3 text-[15px] md:text-base leading-[1.8] text-[#043F2E] font-medium`}
                >
                  <span className="shrink-0 w-2 h-2 rounded-full bg-[#BEE663] border border-[#043F2E] mt-2.5" />
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* Where we meet */}
        <Section eyebrow="التواصل" title="أين نلتقي؟">
          <div className="grid sm:grid-cols-2 gap-3">
            <MeetingCard
              Icon={MapPin}
              title="حضوريًا"
              subtitle="جامعة النيل"
              description="يجتمع الأعضاء بصورة مباشرة، وتقام الأنشطة والفعاليات الحضورية."
            />
            <MeetingCard
              Icon={MessagesSquare}
              title="افتراضيًا"
              subtitle="منصة Discord"
              description="تستمر الصحبة والتواصل والأنشطة بين أعضاء المجتمع عبر الإنترنت."
            />
          </div>
        </Section>

        {/* Values */}
        <Section eyebrow="المبادئ" title="قيمنا">
          <p
            className={`${tajawal.className} text-[15px] md:text-base leading-[1.95] text-[#043F2E]/85 font-normal mb-5`}
          >
            القيم التالية هي المبادئ التي تحكم المجتمع وتوجه أعماله:
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {VALUES.map((value) => (
              <ValueCard key={value.name} {...value} />
            ))}
          </div>
        </Section>

        {/* How it works */}
        <Section
          eyebrow="البنية"
          title="كيف يعمل المجتمع؟"
          intro="مقرأة النيل ليست مجرد مجموعة للقراءة أو الحفظ؛ بل مجتمع يعمل بصورة منظمة من خلال فرق مختلفة، لكل منها دور في بناء المجتمع وتحقيق رؤيته."
        >
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {ABOUT_TEAMS.map((group) => (
              <TeamCard key={group} group={group} />
            ))}
          </div>

          {/* Treasury callout */}
          <div
            className={`mt-5 rounded-2xl border-2 border-[#BEE663] bg-gradient-to-l from-[#BEE663]/15 to-transparent p-5 md:p-6 flex flex-col gap-3`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#043F2E] text-[#BEE663] flex items-center justify-center">
                <Wallet className="w-4 h-4" strokeWidth={2.4} />
              </div>
              <h4 className={`${lalezar.className} text-lg text-[#043F2E]`}>أمناء الخزنة</h4>
            </div>
            <p
              className={`${tajawal.className} text-[14px] md:text-[15px] leading-[1.9] text-[#043F2E]/85 font-normal`}
            >
              مسؤولون عن جمع الصدقات والتبرعات والغرامات المتعلقة بمخالفة القواعد، وتنظيم الموارد
              المالية للمجتمع.
            </p>
            <div className="mt-1 flex flex-col gap-1.5 bg-white/70 rounded-xl p-4 border border-[#043F2E]/10">
              <span
                className={`${tajawal.className} text-[11px] font-bold text-[#043F2E]/60 uppercase tracking-wider`}
              >
                مثال على قواعد المجتمع
              </span>
              <p
                className={`${tajawal.className} text-[15px] leading-[1.85] text-[#043F2E] font-medium`}
              >
                يُغَرَّم من يتحدث بلغة أجنبية أثناء الخاطرة{" "}
                <span className="text-[#043F2E] font-bold">20 جنيهًا عن كل كلمة</span>.
              </p>
            </div>
          </div>
        </Section>

        {/* Mission */}
        <Section eyebrow="الغاية" title="رسالتنا">
          <div className="flex flex-col gap-4">
            <p
              className={`${tajawal.className} text-[15px] md:text-base leading-[1.95] text-[#043F2E]/85 font-normal`}
            >
              نريد أن يكون مجتمع مقرأة النيل مساحة يجد فيها الشاب صحبة صالحة تعينه على الثبات،
              وتذكره بالله، وتجمعه حول القرآن والوحي.
            </p>
            <p
              className={`${tajawal.className} text-[15px] md:text-base leading-[1.95] text-[#043F2E]/85 font-normal`}
            >
              نريد مجتمعًا يساعد أفراده على استعادة مركزية الدين في حياتهم، والاعتزاز بهويتهم، والعمل
              لأمتهم، وبناء علاقة أعمق مع كتاب الله.
            </p>
          </div>
        </Section>

        {/* Closing */}
        <section className="relative rounded-3xl bg-[#043F2E] text-white p-6 md:p-10 overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-[#BEE663]/10 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-[#BEE663]/5 blur-3xl"
          />

          <div className="relative flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <Quote className="w-6 h-6 text-[#BEE663]" strokeWidth={2.2} />
              <span className={`${lalezar.className} text-2xl md:text-3xl`}>خاتمة</span>
            </div>

            <div className="flex flex-col gap-4">
              <p
                className={`${tajawal.className} text-[15px] md:text-base leading-[1.95] text-white/90 font-normal`}
              >
                الشتات الروحي الذي يعيشه الشباب تقف خلفه أيدٍ إبليسية عاملة، تعمل بكد على هدر طاقات
                الشباب المسلم، ونزعه عن ثوابته، وسلخه من هويته.
              </p>
              <p
                className={`${tajawal.className} text-[15px] md:text-base leading-[1.95] text-white/90 font-normal`}
              >
                فإذا بالشاب الضائع، الباحث عن ذاته، يودي بنفسه إما إلى دركات من الغم والكآبة، أو إلى
                مسخ ينسى حقيقة وجوده ويتعبد للأهواء الحاكمة.
              </p>
              <p
                className={`${tajawal.className} text-[15px] md:text-base leading-[1.95] text-white/90 font-normal`}
              >
                ويرحم الله من يشاء من عباده ويختار، فيقذف في قلبه إيمانًا يوقظه من عمق غفلته ومن عز
                نومه، ليردع به علو من لا يرجو لله وقارًا.
              </p>
              <p
                className={`${tajawal.className} text-[15px] md:text-base leading-[1.95] text-white/90 font-normal`}
              >
                وقد خلقنا الله أطوارًا؛ طورًا يدرك الإنسان أبعاد انهزامه، وطورًا يعد العدة، وطورًا ينتصر
                — بإذن الله — إلى أن يرث الله الأرض ومن عليها، ثم توفى كل نفس ما كسبت وهم لا يظلمون.
              </p>
              <p
                className={`${tajawal.className} text-[15px] md:text-base leading-[1.95] text-white font-bold`}
              >
                ومن هنا كانت فكرة <span className="text-[#BEE663]">مجتمع مقرأة النيل</span>.
              </p>
              <p
                className={`${tajawal.className} text-[15px] md:text-base leading-[1.95] text-white/90 font-normal`}
              >
                نسأل الله أن يتمه علينا، وأن يجعل لنا فيه نصيبًا من الثواب، وأن يجعله سببًا في جمع
                الشباب حول كتابه، وإعانتهم على الثبات، وخدمة دينه وأمته.
              </p>
              <p
                className={`${tajawal.className} text-[14px] md:text-[15px] leading-[1.9] text-white/70 font-normal italic`}
              >
                إن كان من خطأ فمن تقصير الكاتب وشيطانه، وإن كان من صواب فمن الله.
              </p>
              <p
                className={`${tajawal.className} text-[14px] md:text-[15px] leading-[1.9] text-white/70 font-normal`}
              >
                وصلى الله وسلم على نبينا محمد وعلى آله وصحبه أجمعين.
              </p>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#BEE663]/30" />
              <p
                className={`${lalezar.className} text-base md:text-lg text-[#BEE663] text-center whitespace-nowrap`}
              >
                وآخر دعوانا أن الحمد لله رب العالمين
              </p>
              <div className="h-px flex-1 bg-[#BEE663]/30" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ============================
// 🟢 Section wrapper
// ============================
function Section({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-6 md:p-8 flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span
          className={`${tajawal.className} text-[11px] font-bold text-[#043F2E]/50 uppercase tracking-wider`}
        >
          {eyebrow}
        </span>
        <h2 className={`${lalezar.className} text-2xl md:text-3xl text-[#043F2E] leading-tight`}>
          {title}
        </h2>
        {intro && (
          <p
            className={`${tajawal.className} text-[15px] md:text-base leading-[1.9] text-[#043F2E]/75 font-normal mt-1`}
          >
            {intro}
          </p>
        )}
      </div>
      <div className="h-px bg-[#043F2E]/8" />
      {children}
    </section>
  );
}

// ============================
// 🟢 Value Card
// ============================
function ValueCard({ name, description, Icon }: ValueItem) {
  return (
    <div className="group bg-[#F7FBEA] hover:bg-[#DEFF90]/40 border border-[#043F2E]/8 rounded-2xl p-4 flex flex-col gap-2.5 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-[#043F2E] text-[#BEE663] flex items-center justify-center">
        <Icon className="w-5 h-5" strokeWidth={2.2} />
      </div>
      <h3 className={`${lalezar.className} text-lg text-[#043F2E] leading-tight`}>{name}</h3>
      <p className={`${tajawal.className} text-[13px] leading-[1.8] text-[#043F2E]/70 font-normal`}>
        {description}
      </p>
    </div>
  );
}

// ============================
// 🟢 Team Card
// ============================
function TeamCard({ group }: { group: GroupName }) {
  const { collective, description, Icon } = GROUPS[group];

  return (
    <div className="group bg-white hover:bg-[#F7FBEA] border border-[#043F2E]/10 rounded-2xl p-4 flex flex-col gap-2.5 transition-colors">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-[#BEE663] text-[#043F2E] flex items-center justify-center">
          <Icon className="w-5 h-5" strokeWidth={2.2} />
        </div>
      </div>
      <h3 className={`${lalezar.className} text-lg text-[#043F2E] leading-tight`}>{collective}</h3>
      <p className={`${tajawal.className} text-[13px] leading-[1.8] text-[#043F2E]/70 font-normal`}>
        {description}
      </p>
    </div>
  );
}

// ============================
// 🟢 Meeting Card
// ============================
function MeetingCard({
  Icon,
  title,
  subtitle,
  description,
}: {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  subtitle: string;
  description: string;
}) {
  return (
    <div className="bg-[#F7FBEA] rounded-2xl border border-[#043F2E]/10 p-5 flex flex-col gap-3">
      <div className="w-11 h-11 rounded-xl bg-[#043F2E] text-[#BEE663] flex items-center justify-center">
        <Icon className="w-5 h-5" strokeWidth={2.2} />
      </div>
      <div className="flex flex-col gap-1">
        <span
          className={`${tajawal.className} text-[11px] font-bold text-[#043F2E]/50 uppercase tracking-wider`}
        >
          {title}
        </span>
        <h3 className={`${lalezar.className} text-xl text-[#043F2E] leading-tight`}>{subtitle}</h3>
      </div>
      <p
        className={`${tajawal.className} text-[14px] leading-[1.85] text-[#043F2E]/75 font-normal`}
      >
        {description}
      </p>
    </div>
  );
}
