import React from "react";
import {
  ArrowDownLeft,
  ArrowDownRight,
  ArrowUpLeft,
  ArrowUpRight,
  Atom,
  Award,
  BadgeCheck,
  BookOpen,
  BookOpenCheck,
  Brain,
  Calculator,
  CalendarDays,
  ChevronDown,
  CircleCheck,
  Compass,
  Cpu,
  Dna,
  FlaskConical,
  Globe,
  Globe2,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Languages,
  Microscope,
  Mountain,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useLocation, Link } from "wouter";
import SiteShell, { SectionEyebrow } from "@/components/SiteShell";
import TeacherCard from "@/components/TeacherCard";
import { Subject3DIcon } from "@/components/Subject3DIcon";
import { t, type Language } from "@/lib/i18n";
import { curricula, curriculumLabel } from "@/lib/curricula";
import type { CurrentUser } from "@/lib/types";
import { trpc } from "@/lib/trpc";

export type SharedPageProps = {
  lang: Language;
  setLang: (language: Language) => void;
  user: CurrentUser | null;
  onLogin: () => void;
};

export const subjects = [
  { en: "Arabic", ar: "اللغة العربية", icon: BookOpen, colorClass: "theme-emerald" },
  { en: "English", ar: "اللغة الإنجليزية", icon: Languages, colorClass: "theme-teal" },
  { en: "Mathematics", ar: "الرياضيات", icon: Calculator, colorClass: "theme-indigo" },
  { en: "Physics", ar: "الفيزياء", icon: Atom, colorClass: "theme-blue" },
  { en: "Chemistry", ar: "الكيمياء", icon: FlaskConical, colorClass: "theme-amber" },
  { en: "Biology", ar: "الأحياء", icon: Dna, colorClass: "theme-green" },
  { en: "Geology", ar: "الجيولوجيا", icon: Mountain, colorClass: "theme-earth" },
  { en: "General Science", ar: "العلوم", icon: Microscope, colorClass: "theme-cyan" },
  { en: "History", ar: "التاريخ", icon: Landmark, colorClass: "theme-warm" },
  { en: "Geography", ar: "الجغرافيا", icon: Compass, colorClass: "theme-sage" },
  { en: "Social Studies", ar: "الدراسات الاجتماعية", icon: UsersRound, colorClass: "theme-ochre" },
  { en: "Philosophy & Logic", ar: "الفلسفة والمنطق", icon: Brain, colorClass: "theme-purple" },
  { en: "Psychology & Sociology", ar: "علم النفس والاجتماع", icon: HeartHandshake, colorClass: "theme-rose" },
  { en: "Computer Science & AI", ar: "الحاسب والذكاء الاصطناعي", icon: Cpu, colorClass: "theme-tech" },
  { en: "Skills", ar: "المهارات", icon: Award, colorClass: "theme-gold" },
  { en: "Foreign Languages", ar: "اللغات الأجنبية", icon: Globe, colorClass: "theme-slate" },
];

export default function HomePage({ lang, setLang, user, onLogin }: SharedPageProps) {
  const [, navigate] = useLocation();
  const [subject, setSubject] = React.useState("");
  const [grade, setGrade] = React.useState("");
  const [curriculum, setCurriculum] = React.useState("");
  const featured = trpc.teachers.search.useQuery({});
  const Arrow = lang === "ar" ? ArrowUpLeft : ArrowUpRight;
  const DownArrow = lang === "ar" ? ArrowDownLeft : ArrowDownRight;

  const search = () => {
    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    if (grade) params.set("grade", grade);
    if (curriculum) params.set("curriculum", curriculum);
    navigate(`/teachers${params.size ? `?${params.toString()}` : ""}`);
  };

  return (
    <SiteShell lang={lang} setLang={setLang} user={user} onLogin={onLogin}>
      <main>
        <section className="hero-section">
          <div className="hero-texture" />
          <div className="hero-library-decor" aria-hidden="true" />
          <div className="hero-inner">
            {/* Right Column in RTL: Title, Lead Text, Fixed Distinct Buttons, Three Stats Cards */}
            <div className="hero-copy">
              <div className="hero-kicker">
                <span className="kicker-line" />
                {t(lang, "PRIVATE TUTORING · UAE, EGYPTIAN & SAUDI CURRICULA", "دروس خصوصية · المناهج الإماراتية والمصرية والسعودية")}
              </div>
              <h1 className="hero-title">
                {t(lang, "All Knowledge... in the Spirit of Understanding & Awareness", "كل المعارف.. بروح الفهم والوعي")}
              </h1>
              <p className="hero-lead">
                {t(
                  lang,
                  "In Mihwar, we guide you from authentic understanding and absorption of meaning to deep awareness and real-world application — across diverse curricula and fields of study.",
                  "في محور، نأخذك من الفهم الحقيقي واستيعاب المعنى، إلى مرحلة الوعي والإدراك العميق لما تتعلمه وتراه في الواقع — عبر مختلف التخصصات والمناهج."
                )}
              </p>

              {/* Distinct Action Buttons: "تصفح المعلمين" & "احجز حصة الآن" */}
              <div className="hero-actions">
                <Link href="/teachers" className="hero-action-btn hero-btn-browse">
                  <span>{t(lang, "Browse Teachers", "تصفح المعلمين")}</span>
                  <Arrow size={18} />
                </Link>
                <Link href="/teachers" className="hero-action-btn hero-btn-book">
                  <CalendarDays size={18} />
                  <span>{t(lang, "Book a Lesson Now", "احجز حصة الآن")}</span>
                </Link>
              </div>

              {/* Three Stat Cards aligned with grid base */}
              <div className="hero-stats-row">
                <div className="hero-stat-card">
                  <strong className="hero-stat-value">10,000+</strong>
                  <span className="hero-stat-label">{t(lang, "Students", "الطلاب")}</span>
                </div>
                <div className="hero-stat-card">
                  <strong className="hero-stat-value">500+</strong>
                  <span className="hero-stat-label">{t(lang, "Teachers", "المعلمون")}</span>
                </div>
                <div className="hero-stat-card">
                  <strong className="hero-stat-value">1,200+</strong>
                  <span className="hero-stat-label">{t(lang, "Purchases & Lessons", "المشتريات")}</span>
                </div>
              </div>
            </div>

            {/* Left Column in RTL: 16 Subject Cards Grid (4x4) */}
            <div className="hero-visual hero-subjects-visual">
              <div className="hero-subjects-grid-16">
                {subjects.map(({ en, ar, colorClass }) => (
                  <Link
                    key={en}
                    href={`/teachers?subject=${encodeURIComponent(en)}`}
                    className={`hero-subject-card ${colorClass}`}
                    title={t(lang, en, ar)}
                  >
                    <span className="hero-subject-icon-box">
                      <Subject3DIcon name={ar} size={36} />
                    </span>
                    <span className="hero-subject-name">{t(lang, en, ar)}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="hero-search-wrap">
            <div className="hero-search-label">
              <span>{t(lang, "A good place to begin", "بداية موفقة")}</span>
              <span className="search-label-mark">M / 01</span>
            </div>
            <div className="hero-search">
              <label>
                <span>{t(lang, "Subject", "المادة")}</span>
                <select value={subject} onChange={event => setSubject(event.target.value)}>
                  <option value="">{t(lang, "Choose a subject", "اختر المادة")}</option>
                  {subjects.map(item => (
                    <option key={item.en} value={item.en}>
                      {t(lang, item.en, item.ar)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>{t(lang, "Grade", "الصف")}</span>
                <select value={grade} onChange={event => setGrade(event.target.value)}>
                  <option value="">{t(lang, "Any grade", "كل الصفوف")}</option>
                  {Array.from({ length: 12 }, (_, index) => (
                    <option key={index + 1} value={`Grade ${index + 1}`}>
                      {t(lang, `Grade ${index + 1}`, `الصف ${index + 1}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>{t(lang, "Curriculum", "المنهج")}</span>
                <select value={curriculum} onChange={event => setCurriculum(event.target.value)}>
                  <option value="">{t(lang, "Choose a curriculum", "اختر المنهج")}</option>
                  {curricula.map(item => (
                    <option key={item.value} value={item.value}>
                      {curriculumLabel(item.value, lang)}
                    </option>
                  ))}
                </select>
              </label>
              <button className="button button-dark search-submit" onClick={search}>
                {t(lang, "Explore teachers", "استكشف المعلمين")}
                <Arrow size={17} />
              </button>
            </div>
          </div>
        </section>

        {/* Trust Ribbon */}
        <section className="trust-ribbon">
          <div><BadgeCheck size={19} /><span>{t(lang, "100% Vetted Teacher Profiles", "ملفات معلّمين مراجعة ومعتمدة")}</span></div>
          <div><BookOpen size={19} /><span>{t(lang, "UAE · EG · KSA Curricula Matching", "مطابقة تامة للمناهج (إماراتية، مصرية، سعودية)")}</span></div>
          <div><UsersRound size={19} /><span>{t(lang, "Parent Progress Dashboard & Reports", "لوحة متابعة وتقارير فورية لولي الأمر")}</span></div>
          <div><Sparkles size={19} /><span>{t(lang, "Integrated AI Study Guide", "مساعد دراسي مدعوم بالذكاء الاصطناعي")}</span></div>
        </section>

        {/* Flagship Course Banner: AI for Engineers */}
        <section className="section py-8 pt-0">
          <div className="bg-gradient-to-r from-[#072420] via-[#041412] to-[#0a3832] rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl border-2 border-[#f59e0b]/40">
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-[#f59e0b] text-[#041210] text-[11px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider">
                    {t(lang, "🔥 TRENDING ON LINKEDIN", "🔥 الكورس الأكثر طلباً على LinkedIn")}
                  </span>
                  <span className="bg-[#10b981]/20 text-[#6ee7b7] text-xs font-bold px-3 py-0.5 rounded-full border border-[#10b981]/30">
                    {t(lang, "100% Practical · 11+ Yrs UAE & Egypt", "عملي 100% · خبرة 11+ عاماً بمشاريع الإمارات ومصر")}
                  </span>
                </div>
                <h2 className="text-xl sm:text-3xl font-black text-white">
                  {t(
                    lang,
                    "Connecting AI with Engineering Drawings & Plans - From Scratch to Pro",
                    "ربط أدوات الذكاء الاصطناعي بالمخططات والخطط الهندسية - من الصفر للاحتراف"
                  )}
                </h2>
                <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed max-w-2xl">
                  {t(
                    lang,
                    "Automate drawings, BOQs, schedules, and clash coordination with AI prompts and scripts. By Eng. Amr Selim.",
                    "كورس عملي للمهندسين: أتمتة المخططات، الجداول، حصر الكميات، والـ Clash Coordination بضغطة زر. إشراف وتدريب م. عمرو سليم."
                  )}
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-[#2dd4bf]/40 flex-shrink-0">
                    <img src="/images/eng_amr_selim.jpg" alt="م. عمرو سليم" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-xs text-[#a7f3d0]">
                    <strong className="text-white block font-bold">{t(lang, "Eng. Amr Selim", "م. عمرو سليم")}</strong>
                    <span className="text-[10px] text-[#cbd5e1]">{t(lang, "Senior Landscape & Infrastructure Engineer", "استشاري وخبير هندسة البنية التحتية واللاندسكيب")}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="/previews/ai_engineering_masterclass.html"
                    className="button button-light font-bold text-xs sm:text-sm"
                  >
                    <span>{t(lang, "Explore Course & Register", "استكشف تفاصيل الكورس وسجّل الآن")}</span>
                    <Arrow size={16} />
                  </a>
                  <a
                    href="/previews/breakthroughs_and_courses.html"
                    className="text-xs text-[#a7f3d0] hover:text-[#fef08a] transition underline underline-offset-4"
                  >
                    {t(lang, "View all STEM masterclasses", "استعراض كافة الانفرادات والكورسات")}
                  </a>
                </div>
              </div>
              <div className="lg:col-span-4 bg-black/40 backdrop-blur-md rounded-xl p-4 border border-[#2dd4bf]/25 text-center space-y-2">
                <span className="text-xs font-bold text-[#fef08a] block">
                  {t(lang, "First Batch Early Bird", "عرض إطلاق الدفعة الأولى")}
                </span>
                <div className="text-2xl sm:text-3xl font-black text-[#fef08a] font-mono">490 AED</div>
                <span className="text-[10px] text-gray-400 line-through block">1,200 AED</span>
                <span className="text-[11px] text-[#34d399] block font-semibold">
                  {t(lang, "18 Accredited Practical Hours", "18 ساعة عملية + شهادة معتمدة")}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* AI Study Companion Showcase Banner */}
        <section className="section py-12">
          <div className="bg-gradient-to-br from-[#173c37] to-[#0d5b55] rounded-2xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl">
            <div className="absolute top-0 end-0 -mt-10 -me-10 w-64 h-64 bg-[#bd9360]/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold mb-3 border border-white/15">
                  <Sparkles size={14} className="text-[#bd9360]" />
                  <span>{t(lang, "NEW · AI STUDY COMPANION", "جديد · مساعد مِحور الدراسي بالذكاء الاصطناعي")}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                  {t(lang, "Stuck on a tricky concept? Work through it with AI.", "واجهت مسألة صعبة أو مفهوماً معقداً؟ تعلّم حله خطوة بخطوة")}
                </h2>
                <p className="text-sm text-[#d0ded5] leading-relaxed max-w-xl mb-5">
                  {t(
                    lang,
                    "Our curriculum-aware study guide explains the reasoning behind math, physics, chemistry, Arabic, and more. It helps students think critically rather than simply copying answers.",
                    "مساعد ذكي تفاعلي يشرح لك طريقة التفكير والحل خطوة بخطوة في الرياضيات والفيزياء والكيمياء واللغات وفق منهجك وصفك الدراسي."
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/study" className="button button-light button-large font-bold">
                    <span>{t(lang, "Try AI Study Guide Free", "جرّب مساعد الدراسة الذكي مجاناً")}</span>
                    <Arrow size={16} />
                  </Link>
                  <span className="text-xs text-[#b8d1c1] flex items-center gap-1.5">
                    <ShieldCheck size={14} />
                    {t(lang, "No login required to start", "متاح للتجربة الفورية للطلاب")}
                  </span>
                </div>
              </div>
              <div className="md:col-span-4 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 text-xs space-y-2">
                <div className="font-bold text-[#f7f5ef] flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                  <Brain size={16} className="text-[#bd9360]" />
                  <span>{t(lang, "4 Guided Learning Modes", "4 أوضاع تعليمية ذكية")}</span>
                </div>
                <div className="flex items-center gap-2 text-[#e3ece5]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#bd9360]"></span>
                  <span>{t(lang, "Concept Explainer with daily examples", "شرح المفاهيم بأمثلة من الحياة اليومية")}</span>
                </div>
                <div className="flex items-center gap-2 text-[#e3ece5]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#bd9360]"></span>
                  <span>{t(lang, "Step-by-Step Problem Solving", "تفكيك المسائل وحلها خطوة بخطوة")}</span>
                </div>
                <div className="flex items-center gap-2 text-[#e3ece5]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#bd9360]"></span>
                  <span>{t(lang, "Interactive Practice Quizzes", "اختبارات وتدريبات تفاعلية للمنهج")}</span>
                </div>
                <div className="flex items-center gap-2 text-[#e3ece5]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#bd9360]"></span>
                  <span>{t(lang, "Focused Lesson Summaries", "ملخصات مركزة ومصطلحات أساسية")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Subjects & Tracks Section */}
        <section className="section subjects-section pt-0">
          <div className="section-heading">
            <div>
              <SectionEyebrow>{t(lang, "LEARN WITH PURPOSE", "تعلّم بوعي وتدرج")}</SectionEyebrow>
              <h2>{t(lang, "Comprehensive coverage for all 16 academic subjects.", "تغطية شاملة للمواد الـ 16 التي تصنع فرق العام الدراسي.")}</h2>
            </div>
            <Link href="/teachers" className="text-link">
              {t(lang, "Browse all subjects", "تصفّح كل المواد في الدليل")}
              <Arrow size={16} />
            </Link>
          </div>
          <div className="subject-grid">
            {subjects.map(({ en, ar, icon: Icon }, index) => (
              <Link
                key={en}
                href={`/teachers?subject=${encodeURIComponent(en)}`}
                className="subject-tile"
              >
                <span className={`subject-icon subject-icon-${index % 6}`}>
                  <Icon size={22} strokeWidth={1.7} />
                </span>
                <span className="subject-name">{t(lang, en, ar)}</span>
                <Arrow size={16} className="subject-arrow" />
              </Link>
            ))}
          </div>
          <p className="subject-footnote">
            {t(
              lang,
              "All subjects are supported across UAE, Egyptian, Saudi, and international British/American curricula.",
              "كافة المواد تدعم المناهج الوزارية المعتمدة في الإمارات ومصر والسعودية إلى جانب المناهج الدولية البريطانية والأمريكية."
            )}
          </p>
        </section>

        {/* Curricula Band */}
        <section className="curriculum-band">
          <div className="curriculum-copy">
            <SectionEyebrow>{t(lang, "BUILT FOR UAE, EGYPTIAN & SAUDI FAMILIES", "مصمّم لأسر الإمارات ومصر والسعودية")}</SectionEyebrow>
            <h2>{t(lang, "Different curricula. One clear way forward.", "مناهج مختلفة، وخطوة أوضح إلى الأمام.")}</h2>
            <p>
              {t(
                lang,
                "Start with the system your child studies. Mihwar's teacher discovery connects curriculum, grade, and subject in one refined search.",
                "ابدأ من النظام الذي يدرسه طفلك. يجمع بحث مِحور بين المنهج الدقيق والصف الدراسي والمادة في خطوة واحدة واضحة وموثوقة."
              )}
            </p>
            <Link href="/teachers" className="button button-outline">
              {t(lang, "Explore curricula", "استكشف المناهج في دليل المعلمين")}
              <Arrow size={16} />
            </Link>
          </div>
          <div className="curriculum-list">
            {curricula.map((item, index) => (
              <Link
                key={item.value}
                href={`/teachers?curriculum=${encodeURIComponent(item.value)}`}
                className="curriculum-item"
              >
                <span className="curriculum-number">0{index + 1}</span>
                <span>{curriculumLabel(item.value, lang)}</span>
                <Arrow size={16} />
              </Link>
            ))}
          </div>
        </section>

        <section className="section featured-section"><div className="section-heading"><div><SectionEyebrow icon={false}>{t(lang, "A CAREFULLY REVIEWED COMMUNITY", "مجتمع تعليمي يُراجع بعناية")}</SectionEyebrow><h2>{t(lang, "Meet your next great teacher.", "تعرّف إلى معلّمك القادم.")}</h2></div><Link href="/teachers" className="text-link">{t(lang, "View teacher directory", "عرض دليل المعلمين")}<Arrow size={16} /></Link></div>
          {featured.isLoading ? <div className="empty-inline">{t(lang, "Loading approved profiles…", "جارٍ تحميل الملفات المعتمدة…")}</div> : featured.data?.length ? <div className="teacher-grid">{featured.data.slice(0, 3).map(teacher => <TeacherCard key={teacher.id} teacher={teacher} lang={lang} />)}</div> : <div className="no-teachers-panel"><div className="empty-emblem"><GraduationCap size={27} /></div><div><h3>{t(lang, "A considered start.", "بداية مدروسة.")}</h3><p>{t(lang, "No teacher profiles have completed review yet. We will show real, approved educators here — never invented profiles or ratings.", "لم تكتمل مراجعة ملفات المعلمين بعد. سنعرض هنا معلّمين حقيقيين معتمدين فقط، دون ملفات أو تقييمات مصطنعة.")}</p></div><Link href="/teacher/apply" className="button button-outline">{t(lang, "Apply to teach", "قدّم طلب التدريس")}<Arrow size={16} /></Link></div>}
        </section>

        <section className="how-section"><div className="how-intro"><SectionEyebrow>{t(lang, "A SIMPLE, THOUGHTFUL PROCESS", "خطوات بسيطة ومدروسة")}</SectionEyebrow><h2>{t(lang, "From a clear need to a confident next step.", "من احتياج واضح إلى خطوة واثقة.")}</h2><p>{t(lang, "A few purposeful steps help families find the right fit and keep learning visible.", "خطوات قليلة ومقصودة تساعد الأسرة على اختيار الأنسب ومتابعة التعلّم.")}</p><Link href="/parent" className="text-link">{t(lang, "See the parent portal", "اكتشف بوابة ولي الأمر")}<Arrow size={16} /></Link></div><div className="steps-list"><div className="process-step"><span className="step-index">01</span><div><h3>{t(lang, "Tell us what your child studies", "حدّد ما يدرسه طفلك")}</h3><p>{t(lang, "Choose a subject, grade and curriculum to guide your search.", "اختر المادة والصف والمنهج لتوجيه البحث.")}</p></div><div className="step-icon"><BookOpen size={20} /></div></div><div className="process-step"><span className="step-index">02</span><div><h3>{t(lang, "Compare reviewed teacher profiles", "قارن ملفات المعلمين المراجعة")}</h3><p>{t(lang, "Explore qualifications, approach, language and lesson rate.", "اطّلع على المؤهلات والأسلوب واللغة وسعر الدرس.")}</p></div><div className="step-icon"><ShieldCheck size={20} /></div></div><div className="process-step"><span className="step-index">03</span><div><h3>{t(lang, "Request a lesson, then follow progress", "اطلب درسًا ثم تابع التقدم")}</h3><p>{t(lang, "A request is confirmed by the teacher; reports keep parents informed.", "يؤكد المعلم طلب الدرس، وتبقي التقارير ولي الأمر على اطلاع.")}</p></div><div className="step-icon"><CalendarDays size={20} /></div></div></div></section>

        <section className="story-note"><div className="story-mark">“</div><div><SectionEyebrow>{t(lang, "HONEST BY DESIGN", "الصدق جزء من التصميم")}</SectionEyebrow><h2>{t(lang, "Trust is built on what is real.", "الثقة تُبنى على ما هو حقيقي.")}</h2><p>{t(lang, "Parent stories and student outcomes will be shared only with permission and from real learning journeys. We won't fill the page with made-up testimonials.", "لن تُعرض قصص أولياء الأمور ونتائج الطلاب إلا بموافقتهم ومن رحلات تعلم حقيقية. لن نملأ الصفحة بشهادات مختلقة.")}</p></div><div className="story-signature"><CircleCheck size={18} /><span>{t(lang, "Real people. Reviewed profiles.", "أشخاص حقيقيون. ملفات مراجعة.")}</span></div></section>

        <section className="teacher-invite"><div className="invite-orbit" /><div className="invite-copy"><SectionEyebrow>{t(lang, "FOR GREAT EDUCATORS", "للمعلمين المتميزين")}</SectionEyebrow><h2>{t(lang, "Your teaching deserves a thoughtful home.", "خبرتك التعليمية تستحق مساحة تليق بها.")}</h2><p>{t(lang, "Create a profile, share your approach and meet families looking for your subject and curriculum expertise.", "أنشئ ملفًا، وشارك أسلوبك، وتعرّف إلى أسر تبحث عن خبرتك في المادة والمنهج.")}</p><Link href="/teacher/apply" className="button button-light">{t(lang, "Become a Mihwar teacher", "انضم إلى معلمي محور")}<Arrow size={17} /></Link></div><div className="invite-aside"><span className="invite-number">01</span><span>{t(lang, "Applications are reviewed before a profile goes public.", "تُراجع الطلبات قبل إظهار أي ملف للعامة.")}</span></div></section>

        <section className="section faq-section" id="faq"><div className="faq-heading"><SectionEyebrow>{t(lang, "GOOD TO KNOW", "معلومات مهمة")}</SectionEyebrow><h2>{t(lang, "A few helpful answers.", "إجابات مفيدة قبل البدء.")}</h2></div><div className="faq-list"><details><summary>{t(lang, "Which curricula can I search?", "ما المناهج التي يمكنني البحث عنها؟")}<ChevronDown size={17} /></summary><p>{t(lang, "Search Egyptian, UAE and Saudi Ministry curricula, alongside British (including IGCSE, GCSE and A-Level), American, IB and CBSE curricula.", "يمكن البحث عن مناهج وزارات التعليم في مصر والإمارات والسعودية، إلى جانب المناهج البريطاني (ومنها IGCSE وGCSE وA-Level) والأمريكي وIB وCBSE.")}</p></details><details><summary>{t(lang, "Are teacher credentials verified?", "هل يتم التحقق من مؤهلات المعلم؟")}<ChevronDown size={17} /></summary><p>{t(lang, "A profile is kept out of public search until an administrator marks its credentials reviewed and approves it. Document upload is not enabled in this first release; verification must be completed through the operator's review process.", "لا يظهر الملف في البحث حتى تؤكد الإدارة مراجعة المؤهلات واعتماده. رفع الوثائق غير مفعّل في هذه النسخة الأولى، لذا يلزم إتمام التحقق عبر إجراءات المشغّل.")}</p></details><details><summary>{t(lang, "How does a lesson request work?", "كيف يعمل طلب الدرس؟")}<ChevronDown size={17} /></summary><p>{t(lang, "Choose an approved teacher and propose a time. The request remains pending until the teacher confirms it. Once confirmed, the parent can proceed to the secure payment step; the booking is not paid until the payment provider confirms capture.", "اختر معلّمًا معتمدًا واقترح موعدًا. يبقى الطلب معلّقًا إلى أن يؤكده المعلم. بعد التأكيد يمكن لولي الأمر الانتقال إلى الدفع الآمن؛ ولا يُعد الحجز مدفوعًا إلا بعد تأكيد تحصيل المبلغ من بوابة الدفع.")}</p></details><details><summary>{t(lang, "Can I install Mihwar on my phone?", "هل يمكن تثبيت محور على الهاتف؟")}<ChevronDown size={17} /></summary><p>{t(lang, "Mihwar is built as an installable web app. Native Android and iOS store apps are a later delivery phase.", "صُمم محور كتطبيق ويب قابل للتثبيت. تطبيقات متاجر Android وiOS مرحلة لاحقة.")}</p></details></div></section>
      </main>
    </SiteShell>
  );
}
