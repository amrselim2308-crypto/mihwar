import { ArrowUpLeft, ArrowUpRight, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import SiteShell from "@/components/SiteShell";
import TeacherCard from "@/components/TeacherCard";
import { t } from "@/lib/i18n";
import { curricula, curriculumLabel } from "@/lib/curricula";
import type { SharedPageProps } from "@/pages/Home";
import { subjects } from "@/pages/Home";
import { trpc } from "@/lib/trpc";
export default function TeachersPage({ lang, setLang, user, onLogin }: SharedPageProps) {
  const [, navigate] = useLocation();
  const initial = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(initial.get("query") || "");
  const [subject, setSubject] = useState(initial.get("subject") || "");
  const [curriculum, setCurriculum] = useState(initial.get("curriculum") || "");
  const [grade, setGrade] = useState(initial.get("grade") || "");
  const [language, setLanguage] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minExperienceYears, setMinExperienceYears] = useState("");
  const [minRating, setMinRating] = useState("");
  const directory = trpc.teachers.search.useQuery({ query: query || undefined, subject: subject || undefined, curriculum: curriculum || undefined, grade: grade || undefined, language: language || undefined, minPrice: minPrice ? Number(minPrice) : undefined, maxPrice: maxPrice ? Number(maxPrice) : undefined, minExperienceYears: minExperienceYears ? Number(minExperienceYears) : undefined, minRating: minRating ? Number(minRating) : undefined });
  useEffect(() => { document.title = t(lang, "Find a teacher | Mihwar", "ابحث عن معلّم | محور"); }, [lang]);
  const Arrow = lang === "ar" ? ArrowUpLeft : ArrowUpRight;
  const clear = () => { setQuery(""); setSubject(""); setCurriculum(""); setGrade(""); setLanguage(""); setMinPrice(""); setMaxPrice(""); setMinExperienceYears(""); setMinRating(""); navigate("/teachers"); };
  const resultCount = directory.data?.length ?? 0;
  return <SiteShell lang={lang} setLang={setLang} user={user} onLogin={onLogin}>
    <main className="directory-page"><div className="directory-hero"><div className="directory-hero-inner"><div><div className="hero-kicker"><span className="kicker-line" />{t(lang, "CURATED FOR UAE, EGYPTIAN & SAUDI CURRICULA", "مصمم للمناهج الإماراتية والمصرية والسعودية")}</div><h1>{t(lang, "Find a teacher who fits.", "ابحث عن معلّم يناسب احتياجك.")}</h1><p>{t(lang, "Filter by what matters: curriculum, subject, language and lesson rate.", "صفِّ النتائج وفق ما يهمك: المنهج والمادة واللغة وسعر الدرس.")}</p></div><div className="directory-hero-count"><span>01 / 04</span><div>{t(lang, "Start with a real profile.", "ابدأ بملف حقيقي.")}</div></div></div></div>
      <div className="directory-content"><aside className="filter-panel"><div className="filter-heading"><h2><SlidersHorizontal size={17} />{t(lang, "Refine your search", "حدّد بحثك")}</h2><button className="clear-filter" onClick={clear}><X size={14} />{t(lang, "Clear", "مسح")}</button></div>
        <label className="field-label">{t(lang, "Name or expertise", "الاسم أو التخصص")}<div className="search-input-wrap"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={t(lang, "Search teachers", "ابحث عن المعلمين")} /></div></label>
        <label className="field-label">{t(lang, "Subject", "المادة")}<select value={subject} onChange={event => setSubject(event.target.value)}><option value="">{t(lang, "All subjects", "كل المواد")}</option>{subjects.map(item => <option key={item.en} value={item.en}>{t(lang, item.en, item.ar)}</option>)}</select></label>
        <label className="field-label">{t(lang, "Curriculum", "المنهج")}<select value={curriculum} onChange={event => setCurriculum(event.target.value)}><option value="">{t(lang, "All curricula", "كل المناهج")}</option>{curricula.map(item => <option key={item.value} value={item.value}>{curriculumLabel(item.value, lang)}</option>)}</select></label>
        <label className="field-label">{t(lang, "Grade", "الصف")}<select value={grade} onChange={event => setGrade(event.target.value)}><option value="">{t(lang, "All grades", "كل الصفوف")}</option>{Array.from({ length: 12 }, (_, index) => <option key={index} value={`Grade ${index + 1}`}>{t(lang, `Grade ${index + 1}`, `الصف ${index + 1}`)}</option>)}</select></label>
        <label className="field-label">{t(lang, "Teaching language", "لغة التدريس")}<select value={language} onChange={event => setLanguage(event.target.value)}><option value="">{t(lang, "Any language", "كل اللغات")}</option><option value="Arabic">{t(lang, "Arabic", "العربية")}</option><option value="English">{t(lang, "English", "الإنجليزية")}</option><option value="Hindi">हिन्दी</option></select></label>
        <label className="field-label">{t(lang, "Minimum rate · AED/hour", "أقل سعر · درهم/ساعة")}<input type="number" min="0" value={minPrice} onChange={event => setMinPrice(event.target.value)} placeholder="0" /></label>
        <label className="field-label">{t(lang, "Maximum rate · AED/hour", "أعلى سعر · درهم/ساعة")}<input type="number" min="0" value={maxPrice} onChange={event => setMaxPrice(event.target.value)} placeholder={t(lang, "No limit", "بلا حد")} /></label>
        <label className="field-label">{t(lang, "Minimum experience · years", "الخبرة الدنيا · سنوات")}<input type="number" min="0" max="60" value={minExperienceYears} onChange={event => setMinExperienceYears(event.target.value)} placeholder="0" /></label>
        <label className="field-label">{t(lang, "Minimum rating", "أدنى تقييم")}<select value={minRating} onChange={event => setMinRating(event.target.value)}><option value="">{t(lang, "Any rating", "أي تقييم")}</option><option value="3">3+</option><option value="4">4+</option><option value="4.5">4.5+</option></select></label>
        <button className="button button-dark filter-cta" onClick={() => directory.refetch()}>{t(lang, "Update results", "تحديث النتائج")}<Arrow size={16} /></button>
      </aside>
      <section className="directory-results"><div className="results-heading"><div><span className="section-eyebrow">{t(lang, "TEACHER DIRECTORY", "دليل المعلمين")}</span><h2>{t(lang, "A considered match.", "اختيار مدروس.")}</h2></div><div className="results-count">{directory.isLoading ? "—" : resultCount.toString().padStart(2, "0")} <span>{t(lang, "profiles", "ملفًا")}</span></div></div>
        {directory.isLoading ? <div className="directory-empty"><div className="loading-mark" /><p>{t(lang, "Finding reviewed profiles…", "جارٍ البحث عن ملفات مراجعة…")}</p></div> : directory.error ? <div className="directory-empty"><p>{t(lang, "The directory could not be loaded. Please try again.", "تعذر تحميل الدليل. حاول مرة أخرى.")}</p><button className="button button-outline" onClick={() => directory.refetch()}>{t(lang, "Try again", "إعادة المحاولة")}</button></div> : resultCount ? <div className="teacher-grid">{directory.data?.map(teacher => <TeacherCard key={teacher.id} teacher={teacher} lang={lang} />)}</div> : <div className="directory-empty empty-no-teachers"><div className="empty-emblem"><Search size={25} /></div><span className="section-eyebrow">{t(lang, "NO APPROVED MATCHES YET", "لا توجد نتائج معتمدة بعد")}</span><h3>{t(lang, "Your search is ready. Our reviewed directory is still growing.", "بحثك جاهز، ودليل الملفات المعتمدة في طور النمو.")}</h3><p>{t(lang, "We only list teachers after an administrator has reviewed and approved their profile and credentials. No sample teachers or ratings are shown.", "لا نعرض المعلمين إلا بعد مراجعة الإدارة واعتماد الملف والمؤهلات. لا نستخدم أسماء أو تقييمات تجريبية.")}</p><Link className="button button-primary" href="/teacher">{t(lang, "Apply to teach", "قدّم طلب التدريس")}<Arrow size={16} /></Link></div>}
      </section></div>
    </main>
  </SiteShell>;
}
