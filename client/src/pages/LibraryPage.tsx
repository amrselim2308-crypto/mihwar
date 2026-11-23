import { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Bookmark, ExternalLink, FileText, Globe2, GraduationCap, ShieldCheck } from "lucide-react";
import { LIBRARY_CATEGORIES, LIBRARY_CURRICULUM_BY_COUNTRY, LIBRARY_FORMATS, localizedOption, type LibrarySubject, type LibraryTerm } from "../../../shared/library-catalog";
import SiteShell from "@/components/SiteShell";
import { t } from "@/lib/i18n";
import type { SharedPageProps } from "@/pages/Home";
import { trpc } from "@/lib/trpc";
import ContributionForm from "@/components/library/ContributionForm";
import LibraryFilters from "@/components/library/LibraryFilters";
import PdfReader from "@/components/library/PdfReader";
import ResourceCard from "@/components/library/ResourceCard";
import type { LibraryFiltersState, LibraryResourceItem } from "@/components/library/types";
import "@/styles/library.css";

const emptyFilters: LibraryFiltersState = { countryCode: "", gradeCode: "", subjectCode: "", termCode: "", category: "", format: "", query: "" };

const officialSources = [
  {
    key: "egypt",
    title: { en: "Egyptian Ministry · Textbooks", ar: "وزارة التعليم المصرية · الكتب الدراسية" },
    detail: { en: "Official electronic textbook portal. Browse the ministry source directly; Mihwar does not mirror its books.", ar: "بوابة الكتب الدراسية الإلكترونية الرسمية. تصفح المصدر الوزاري مباشرة؛ لا تنسخ محور الكتب." },
    href: "https://ellibrary.moe.gov.eg/Books/",
    note: { en: "Official source · Egypt", ar: "مصدر رسمي · مصر" },
  },
  {
    key: "uae",
    title: { en: "UAE · Diwan eBook Reader", ar: "الإمارات · قارئ ديوان الإلكتروني" },
    detail: { en: "The UAE Government describes Diwan as the Ministry-led reader for government-school teachers and students. Access may require school eligibility.", ar: "توضح بوابة حكومة الإمارات أن ديوان قارئ تابع للوزارة لمعلمي وطلاب المدارس الحكومية. قد يتطلب الدخول أهلية مدرسية." },
    href: "https://u.ae/en/information-and-services/education/online-training/diwan-ebook-reader",
    note: { en: "Official source · UAE", ar: "مصدر رسمي · الإمارات" },
  },
  {
    key: "saudi-moe",
    title: { en: "Saudi Ministry · Study plans", ar: "وزارة التعليم السعودية · الخطط الدراسية" },
    detail: { en: "The Ministry's study-plan page links to official curriculum services; IEN lists the Saudi stages and grades. Mihwar does not mirror textbooks.", ar: "تربط صفحة الخطط الدراسية للوزارة بالخدمات الرسمية للمناهج، وتعرض عين دروس المراحل والصفوف السعودية. لا ينسخ محور الكتب الدراسية." },
    href: "https://www.moe.gov.sa/ar/education/general-education/studyplans",
    note: { en: "Official Ministry source · Saudi Arabia", ar: "مصدر رسمي للوزارة · السعودية" },
  },
  {
    key: "saudi-ien",
    title: { en: "IEN · Lessons and grade directory", ar: "عين · الدروس وتصنيف الصفوف" },
    detail: { en: "Official education portal showing primary, intermediate and secondary grade groupings. Secondary track-specific books remain at their source.", ar: "بوابة تعليمية رسمية تعرض تقسيم الصفوف إلى ابتدائي ومتوسط وثانوي. تبقى كتب المسارات الثانوية لدى مصدرها." },
    href: "https://www.ientv.edu.sa/ar/doros",
    note: { en: "Official source · IEN", ar: "مصدر رسمي · عين" },
  },
  {
    key: "saudi-tracks",
    title: { en: "Saudi Ministry · Secondary tracks", ar: "وزارة التعليم السعودية · مسارات الثانوية" },
    detail: { en: "The Ministry lists General, Computer Science and Engineering, Health and Life, Business Administration, and Sharia tracks. Track-specific filtering is not yet a separate library field.", ar: "تسمي الوزارة المسارات: العام، وعلوم الحاسب والهندسة، والصحة والحياة، وإدارة الأعمال، والشرعي. لا يوجد حاليًا مرشح مستقل لمسار الثانوية في المكتبة." },
    href: "https://www.moe.gov.sa/ar/education/general-education/secondaryschooltracks",
    note: { en: "Official Ministry source · tracks", ar: "مصدر رسمي للوزارة · المسارات" },
  },
  {
    key: "adek",
    title: { en: "ADEK · School Curriculum Policy", ar: "أديك · سياسة المنهج المدرسي" },
    detail: { en: "Curriculum policy reference, not a textbook repository. The policy distinguishes Abu Dhabi school cycles from MoE cycles.", ar: "مرجع لسياسة المنهج وليس مستودع كتب. تميّز السياسة بين حلقات مدارس أبوظبي وحلقات منهج الوزارة." },
    href: "https://www.adek.gov.ae/-/media/Project/TAMM/ADEK/Policies/School-Policies/Teaching-and-Learning/ADEK_S_Curriculum-Policy_EN_v1_2.pdf",
    note: { en: "Policy · Version 1.2 · Sep 2025", ar: "سياسة · الإصدار 1.2 · سبتمبر 2025" },
  },
];

export default function LibraryPage({ lang, setLang, user, onLogin }: SharedPageProps) {
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [savedOnly, setSavedOnly] = useState(false);
  const [active, setActive] = useState<LibraryResourceItem | null>(null);
  const [readerMessage, setReaderMessage] = useState("");
  const input = {
    countryCode: filters.countryCode || undefined,
    curriculumCode: filters.countryCode ? LIBRARY_CURRICULUM_BY_COUNTRY[filters.countryCode] : undefined,
    gradeCode: filters.gradeCode || undefined,
    subjectCode: filters.subjectCode ? filters.subjectCode as LibrarySubject : undefined,
    termCode: filters.termCode ? filters.termCode as LibraryTerm : undefined,
    category: filters.category ? filters.category as typeof LIBRARY_CATEGORIES[number]["value"] : undefined,
    format: filters.format ? filters.format as typeof LIBRARY_FORMATS[number]["value"] : undefined,
    query: filters.query.trim() || undefined,
    page,
    pageSize: 24,
  };
  const resources = trpc.library.list.useQuery(input);
  const saved = trpc.library.saved.useQuery(undefined, { enabled: !!user });
  const signedUrl = trpc.library.downloadUrl.useQuery({ resourceId: active?.id ?? 0 }, { enabled: !!active?.hasFile, staleTime: 4 * 60 * 1000 });
  const utils = trpc.useUtils();
  const saveBookmark = trpc.library.saveBookmark.useMutation({ onSuccess: async () => {
    setReaderMessage(t(lang, "Page saved.", "تم حفظ الصفحة."));
    await utils.library.saved.invalidate();
  } });
  const removeBookmark = trpc.library.removeBookmark.useMutation({ onSuccess: () => utils.library.saved.invalidate() });
  const changeFilters = (next: LibraryFiltersState) => { setFilters(next); setPage(1); };
  const savedSet = new Set((saved.data ?? []).map(item => item.resourceId));
  const resultItems = savedOnly ? (saved.data ?? []).map(item => item.resource).filter(item => {
    const text = `${item.title} ${item.description ?? ""} ${item.publisherName ?? ""}`.toLowerCase();
    return (!filters.query || text.includes(filters.query.toLowerCase()))
      && (!filters.countryCode || item.countryCode === filters.countryCode)
      && (!filters.gradeCode || item.gradeCode === filters.gradeCode)
      && (!filters.subjectCode || item.subjectCode === filters.subjectCode)
      && (!filters.termCode || item.termCode === filters.termCode)
      && (!filters.category || item.category === filters.category)
      && (!filters.format || item.format === filters.format);
  }) : resources.data?.items ?? [];
  const currentSaved = active ? saved.data?.find(item => item.resourceId === active.id) : undefined;
  const Back = lang === "ar" ? ArrowRight : ArrowLeft;

  const openResource = (resource: LibraryResourceItem) => {
    if (resource.hasFile) { setActive(resource); setReaderMessage(""); return; }
    if (resource.externalUrl) window.open(resource.externalUrl, "_blank", "noopener,noreferrer");
  };

  const saveResource = (resource: LibraryResourceItem, isSaved: boolean) => {
    if (isSaved) removeBookmark.mutate({ resourceId: resource.id });
    else saveBookmark.mutate({ resourceId: resource.id, pageNumber: 1 });
  };

  return <SiteShell lang={lang} setLang={setLang} user={user} onLogin={onLogin}>
    <main className="library-page">
      <section className="library-hero"><div className="library-hero-copy"><span className="section-eyebrow"><BookOpen size={14} />{t(lang, "MIHWAR LEARNING LIBRARY", "مكتبة محور التعليمية")}</span><h1>{t(lang, "A clearer path through every curriculum.", "طريق أوضح عبر كل منهج.")}</h1><p>{t(lang, "Explore Ministry curriculum resources for Egypt, the UAE and Saudi Arabia. Search by stage, grade, subject and term, and open verified source links or reviewed teacher materials.", "استكشف موارد مناهج الوزارة في مصر والإمارات والسعودية. ابحث حسب المرحلة والصف والمادة والفصل، وافتح المصادر الرسمية أو المواد التي راجعتها الإدارة.")}</p><div className="library-hero-badges"><span><Globe2 size={13} />{t(lang, "Egypt · Primary to Secondary 3", "مصر · من الابتدائي إلى الثالث الثانوي")}</span><span><BookOpen size={13} />{t(lang, "UAE · Cycle 1–3", "الإمارات · الحلقة الأولى إلى الثالثة")}</span><span><GraduationCap size={13} />{t(lang, "Saudi · Primary, Intermediate & Secondary", "السعودية · ابتدائي ومتوسط وثانوي")}</span><span><ShieldCheck size={13} />{t(lang, "Rights-first publishing", "النشر مع صون الحقوق")}</span></div></div></section>

      <div className="library-content">
        <LibraryFilters lang={lang} filters={filters} onChange={changeFilters} onClear={() => changeFilters(emptyFilters)} />
        <section className="library-main" aria-label={t(lang, "Library resources", "موارد المكتبة")}>
          <div className="library-toolbar"><div className="library-toolbar-copy"><strong>{savedOnly ? t(lang, "Your saved pages", "صفحاتك المحفوظة") : t(lang, "Browse approved resources", "تصفح الموارد المعتمدة")}</strong><span>{savedOnly ? t(lang, `${resultItems.length} saved items match`, `${resultItems.length} موارد محفوظة مطابقة`) : t(lang, "Only administrator-approved items appear in results.", "لا تظهر في النتائج إلا الموارد التي وافقت عليها الإدارة.")}</span></div><button type="button" className="library-saved-toggle" aria-pressed={savedOnly} onClick={() => { setSavedOnly(value => !value); setPage(1); }}><Bookmark size={14} />{savedOnly ? t(lang, "Browse all", "تصفح الكل") : t(lang, "Saved pages", "الصفحات المحفوظة")}</button></div>

          {!savedOnly && <div className="library-source-panel">{officialSources.map(source => <article className="library-source-card" key={source.key}><span className="library-source-icon"><FileText size={17} /></span><div><strong>{localizedOption(source.title, lang)}</strong><p>{localizedOption(source.detail, lang)}</p><a href={source.href} target="_blank" rel="noopener noreferrer">{localizedOption(source.note, lang)}<ExternalLink size={12} /></a></div></article>)}<p className="library-source-note">{t(lang, "Official textbooks and third-party works are linked at their source unless Mihwar has documented redistribution rights. A teacher upload is not an official ministry resource.", "تُعرض الكتب الرسمية وأعمال الغير كرابط للمصدر ما لم يوثق محور حق إعادة نشرها. مساهمة المعلم ليست موردًا وزاريًا رسميًا.")}</p></div>}

          {savedOnly ? saved.isLoading ? <div className="library-empty"><span className="library-loader" /><p>{t(lang, "Loading saved pages…", "جارٍ تحميل الصفحات المحفوظة…")}</p></div> : !user ? <div className="library-empty"><span><Bookmark size={19} /></span><h3>{t(lang, "Sign in to see saved pages.", "سجّل الدخول لعرض الصفحات المحفوظة.")}</h3><button className="button button-primary" onClick={onLogin}>{t(lang, "Sign in", "تسجيل الدخول")}<Back size={14} /></button></div> : !resultItems.length ? <div className="library-empty"><span><Bookmark size={19} /></span><h3>{t(lang, "No saved items match these filters.", "لا توجد عناصر محفوظة تطابق هذه المرشحات.")}</h3><p>{t(lang, "Save a PDF resource from the results to keep your reading place here.", "احفظ مورد PDF من النتائج للاحتفاظ بموضع القراءة هنا.")}</p></div> : <div className="library-resource-grid">{resultItems.map(resource => <ResourceCard key={resource.id} resource={resource} lang={lang} saved={savedSet.has(resource.id)} signedIn={!!user} onOpen={openResource} onLogin={onLogin} onToggleSave={saveResource} />)}</div>
            : resources.isLoading ? <div className="library-empty"><span className="library-loader" /><p>{t(lang, "Searching approved resources…", "جارٍ البحث في الموارد المعتمدة…")}</p></div> : resources.error ? <div className="library-error" role="alert">{t(lang, "The library could not be loaded. Please try again.", "تعذر تحميل المكتبة. حاول مرة أخرى.")}</div> : !resultItems.length ? <div className="library-empty"><span><BookOpen size={20} /></span><h3>{t(lang, "No approved resources match this search yet.", "لا توجد موارد معتمدة تطابق هذا البحث حتى الآن.")}</h3><p>{t(lang, "We do not fill this library with copied or invented materials. Try another filter or use the official portals above.", "لا نملأ المكتبة بمواد منسوخة أو مختلقة. جرّب مرشحًا آخر أو استخدم البوابات الرسمية أعلاه.")}</p></div> : <div className="library-resource-grid">{resultItems.map(resource => <ResourceCard key={resource.id} resource={resource} lang={lang} saved={savedSet.has(resource.id)} signedIn={!!user} onOpen={openResource} onLogin={onLogin} onToggleSave={saveResource} />)}</div>}
          {!savedOnly && !resources.isLoading && resultItems.length > 0 && <div className="library-pagination"><button type="button" disabled={page <= 1} onClick={() => setPage(current => Math.max(1, current - 1))}>{t(lang, "Previous", "السابق")}</button><span>{t(lang, `Page ${page}`, `الصفحة ${page}`)}</span><button type="button" disabled={!resources.data?.hasMore} onClick={() => setPage(current => current + 1)}>{t(lang, "Next", "التالي")}</button></div>}
        </section>
      </div>

      <p className="library-official-note"><ShieldCheck size={14} />{t(lang, "Cycle mapping is curriculum-specific. For UAE MoE schools Mihwar uses Cycle 1 (Grades 1–4), Cycle 2 (5–8), and Cycle 3 (9–12); ADEK's general Abu Dhabi school-cycle definitions differ. Saudi stages are Primary 1–6, Intermediate 1–3 and Secondary 1–3; see the Ministry links above for the five official secondary tracks.", "تختلف الحلقات حسب المنهج. لمدارس منهج وزارة الإمارات يستخدم محور الحلقة الأولى (الصفوف 1–4)، والثانية (5–8)، والثالثة (9–12)؛ وتختلف تعريفات أديك العامة لحلقات مدارس أبوظبي. تصنف السعودية الابتدائي 1–6 والمتوسط 1–3 والثانوي 1–3؛ راجع روابط الوزارة أعلاه للمسارات الثانوية الخمسة.")}</p>

      <section className="library-contribution-section"><div className="library-contribution-heading"><div><span className="section-eyebrow">{t(lang, "A TEACHER-REVIEWED RESOURCE COMMUNITY", "مجتمع موارد يشارك فيه المعلمون")}</span><h2>{t(lang, "Contribute a resource.", "ساهم بمورد تعليمي.")}</h2><p>{t(lang, "Verified teachers can share original notes or materials with redistribution permission. An administrator reviews every contribution before it becomes public.", "يمكن للمعلمين الموثقين مشاركة مذكرات أصلية أو مواد تسمح حقوقها بإعادة التوزيع. تراجع الإدارة كل مساهمة قبل نشرها.")}</p></div></div>
        {user ? <ContributionForm lang={lang} /> : <div className="library-contribute-locked"><ShieldCheck size={20} /><div><strong>{t(lang, "Teacher access is reviewed.", "مساهمة المعلم تتطلب التحقق.")}</strong><p>{t(lang, "Sign in first. Contributions are enabled only after the teacher profile and credentials are approved.", "سجّل الدخول أولًا. لا تتاح المساهمات إلا بعد اعتماد ملف المعلم ومؤهلاته.")}</p><button className="button button-outline" onClick={onLogin}>{t(lang, "Sign in", "تسجيل الدخول")}<Back size={14} /></button></div></div>}
      </section>
    </main>
    {active && signedUrl.data?.url && <PdfReader resource={active} url={signedUrl.data.url} initialPage={currentSaved?.pageNumber ?? 1} lang={lang} onSavePage={pageNumber => { setReaderMessage(""); saveBookmark.mutate({ resourceId: active.id, pageNumber }); }} onClose={() => setActive(null)} />}
    {active && signedUrl.isLoading && <div className="library-reader-backdrop"><div className="library-empty"><span className="library-loader" /><p>{t(lang, "Opening the protected PDF…", "جارٍ فتح ملف PDF المحمي…")}</p><button className="button button-outline" onClick={() => setActive(null)}>{t(lang, "Cancel", "إلغاء")}</button></div></div>}
    {active && signedUrl.error && <div className="library-reader-backdrop"><div className="library-empty"><span><ShieldCheck size={20} /></span><h3>{t(lang, "This PDF is unavailable right now.", "ملف PDF غير متاح حاليًا.")}</h3><p>{signedUrl.error.message}</p><button className="button button-outline" onClick={() => setActive(null)}>{t(lang, "Close", "إغلاق")}</button></div></div>}
    {readerMessage && <div className="library-reader-toast" role="status">{readerMessage}</div>}
  </SiteShell>;
}
