import { useState } from "react";
import { Check, FileUp, Link2, ShieldAlert } from "lucide-react";
import { LIBRARY_COUNTRIES, LIBRARY_COUNTRY_LABELS, LIBRARY_FORMATS, LIBRARY_SUBJECTS, LIBRARY_TERMS, TEACHER_LIBRARY_CATEGORIES, gradesForCountry, localizedOption, type LibraryCountry, type LibrarySubject, type LibraryTerm } from "../../../../shared/library-catalog";
import { t } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";

const categoryNames: Record<(typeof TEACHER_LIBRARY_CATEGORIES)[number], { en: string; ar: string }> = {
  authorized_reference: { en: "Authorized reference", ar: "مرجع مرخّص" },
  study_notes: { en: "Study notes & summaries", ar: "مذكرات وملخصات" },
  past_exams: { en: "Past exams", ar: "امتحانات سابقة" },
  question_bank: { en: "Question bank", ar: "بنك أسئلة" },
};

function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read PDF"));
    reader.readAsDataURL(file);
  });
}

export default function ContributionForm({ lang }: { lang: Language }) {
  const [countryCode, setCountryCode] = useState<LibraryCountry>("EG");
  const [gradeCode, setGradeCode] = useState("");
  const [category, setCategory] = useState<(typeof TEACHER_LIBRARY_CATEGORIES)[number]>("study_notes");
  const [format, setFormat] = useState<(typeof LIBRARY_FORMATS)[number]["value"]>("pdf");
  const [rightsType, setRightsType] = useState<"teacher_original" | "licensed_use" | "external_authorized_link">("teacher_original");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const canContribute = trpc.library.canContribute.useQuery();
  const utils = trpc.useUtils();
  const submit = trpc.library.submitContribution.useMutation({ onSuccess: async () => {
    setMessageIsError(false);
    setMessage(t(lang, "Your contribution is submitted for administrator review. It is not public yet.", "وصلت مساهمتك لمراجعة الإدارة. لن تظهر للعامة قبل الموافقة."));
    setFile(null);
    await utils.library.list.invalidate();
  }, onError: error => { setMessageIsError(true); setMessage(error.message); } });
  const grades = gradesForCountry(countryCode);
  const teacherOriginalAllowed = category === "study_notes" || category === "question_bank";
  const fileUploadAllowed = format === "pdf" && rightsType === "teacher_original" && teacherOriginalAllowed;

  if (canContribute.isLoading) return <div className="library-contribute-locked"><span className="library-loader" />{t(lang, "Checking teacher eligibility…", "جارٍ التحقق من صلاحية المعلم…")}</div>;
  if (!canContribute.data) return <div className="library-contribute-locked"><ShieldAlert size={20} /><div><strong>{t(lang, "Verified teachers only", "للمعلمين الموثقين فقط")}</strong><p>{t(lang, "Your teacher profile must be administrator-approved and credentials reviewed before you can submit resources.", "يلزم اعتماد ملف المعلم ومراجعة مؤهلاته من الإدارة قبل إرسال الموارد.")}</p><a href="/teacher" className="text-link">{t(lang, "Open teacher portal", "فتح بوابة المعلم")}</a></div></div>;

  return <form className="library-contribution-form" onSubmit={async event => {
    event.preventDefault(); setMessage("");
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const externalUrl = String(form.get("externalUrl") ?? "").trim();
    if (form.get("rightsConfirmation") !== "on") { setMessageIsError(true); setMessage(t(lang, "Confirm that you have permission to share this resource.", "أكد أن لديك حق مشاركة هذا المورد.")); return; }
    if (rightsType === "teacher_original" && !teacherOriginalAllowed) { setMessageIsError(true); setMessage(t(lang, "Original teacher files are limited to study notes and question banks.", "تقتصر الملفات الأصلية للمعلم على المذكرات وبنوك الأسئلة.")); return; }
    if (rightsType !== "teacher_original" && file) { setMessageIsError(true); setMessage(t(lang, "For licensed materials, share the authorized source link; do not upload a copy.", "للمواد المرخصة، أرسل رابط المصدر المصرح ولا ترفع نسخة من الملف.")); return; }
    if (!gradeCode) { setMessageIsError(true); setMessage(t(lang, "Choose the grade.", "اختر الصف.")); return; }
    if (format === "pdf" && !file && !externalUrl) { setMessageIsError(true); setMessage(t(lang, "Choose a PDF file or enter an HTTPS PDF link.", "اختر ملف PDF أو أدخل رابط PDF آمنًا.")); return; }
    if (format !== "pdf" && !externalUrl) { setMessageIsError(true); setMessage(t(lang, "Enter an HTTPS resource link.", "أدخل رابط المورد بصيغة HTTPS.")); return; }
    if (file && file.size > 5 * 1024 * 1024) { setMessageIsError(true); setMessage(t(lang, "The PDF must be 5 MB or smaller.", "يجب ألا يتجاوز PDF حجم 5 ميجابايت.")); return; }
    try {
      const fileBase64 = file ? await readBase64(file) : undefined;
      submit.mutate({
        countryCode,
        gradeCode,
        subjectCode: String(form.get("subjectCode")) as LibrarySubject,
        termCode: String(form.get("termCode")) as LibraryTerm,
        category,
        format,
        title,
        description: String(form.get("description") ?? "").trim(),
        academicYear: String(form.get("academicYear") ?? "").trim(),
        publisherName: String(form.get("publisherName") ?? "").trim(),
        sourceUrl: String(form.get("sourceUrl") ?? "").trim(),
        externalUrl,
        fileBase64,
        rightsConfirmed: true,
        rightsType,
        rightsNote: String(form.get("rightsNote") ?? "").trim(),
        alignmentReference: String(form.get("alignmentReference") ?? "").trim(),
      });
    } catch {
      setMessageIsError(true); setMessage(t(lang, "The selected file could not be read.", "تعذرت قراءة الملف المحدد."));
    }
  }}>
    <div className="library-form-heading"><span><FileUp size={18} /></span><div><h3>{t(lang, "Share a learning resource", "شارك موردًا تعليميًا")}</h3><p>{t(lang, "Materials stay private until reviewed by Mihwar administration.", "تظل المادة خاصة حتى تراجعها إدارة محور.")}</p></div></div>
    <div className="library-form-grid">
      <label className="library-field"><span>{t(lang, "Curriculum track", "مسار المنهج")}</span><select value={countryCode} onChange={event => { setCountryCode(event.target.value as LibraryCountry); setGradeCode(""); }}><option value="">{t(lang, "Choose a country", "اختر الدولة")}</option>{LIBRARY_COUNTRIES.map(country => <option key={country} value={country}>{localizedOption(LIBRARY_COUNTRY_LABELS[country], lang)}</option>)}</select></label>
      <label className="library-field"><span>{t(lang, "Stage & grade", "المرحلة والصف")}</span><select value={gradeCode} onChange={event => setGradeCode(event.target.value)} required><option value="">{t(lang, "Choose grade", "اختر الصف")}</option>{grades.map(grade => <option value={grade.gradeCode} key={grade.gradeCode}>{localizedOption({ en: `${grade.stageLabelEn} · ${grade.gradeLabelEn}`, ar: `${grade.stageLabelAr} · ${grade.gradeLabelAr}` }, lang)}</option>)}</select></label>
      <label className="library-field"><span>{t(lang, "Subject", "المادة")}</span><select name="subjectCode" required>{LIBRARY_SUBJECTS.map(subject => <option key={subject.value} value={subject.value}>{localizedOption(subject, lang)}</option>)}</select></label>
      <label className="library-field"><span>{t(lang, "Term", "الفصل الدراسي")}</span><select name="termCode">{LIBRARY_TERMS.map(term => <option key={term.value} value={term.value}>{localizedOption(term, lang)}</option>)}</select></label>
      <label className="library-field"><span>{t(lang, "Category", "التصنيف")}</span><select value={category} onChange={event => { const next = event.target.value as typeof category; setCategory(next); if ((next === "authorized_reference" || next === "past_exams") && rightsType === "teacher_original") setRightsType("licensed_use"); if (next === "authorized_reference" || next === "past_exams") setFile(null); }}>{TEACHER_LIBRARY_CATEGORIES.map(value => <option key={value} value={value}>{localizedOption(categoryNames[value], lang)}</option>)}</select></label>
      <label className="library-field"><span>{t(lang, "Format", "نوع المورد")}</span><select value={format} onChange={event => { setFormat(event.target.value as typeof format); setFile(null); }}>{LIBRARY_FORMATS.map(option => <option key={option.value} value={option.value}>{localizedOption(option, lang)}</option>)}</select></label>
      <label className="library-field library-field-wide"><span>{t(lang, "Resource title", "عنوان المورد")}</span><input name="title" minLength={3} maxLength={240} required placeholder={t(lang, "For example: Term 1 reading review", "مثال: مراجعة القراءة للفصل الأول")} /></label>
      <label className="library-field library-field-wide"><span>{t(lang, "Short description", "وصف مختصر")}</span><textarea name="description" rows={3} maxLength={3000} placeholder={t(lang, "What will learners find useful?", "ما الفائدة التي سيجدها الطالب؟")} /></label>
      <label className="library-field"><span>{t(lang, "Original PDF only (max 5 MB)", "ملف PDF أصلي فقط (حتى 5 ميجابايت)")}</span><input type="file" accept="application/pdf,.pdf" onChange={event => setFile(event.target.files?.[0] ?? null)} disabled={!fileUploadAllowed} /></label>
      <label className="library-field"><span>{t(lang, "HTTPS resource link", "رابط المورد الآمن")}</span><input name="externalUrl" type="url" placeholder="https://…" /></label>
      <label className="library-field"><span>{t(lang, "Academic year (optional)", "العام الدراسي (اختياري)")}</span><input name="academicYear" placeholder="2026-2027" /></label>
      <label className="library-field"><span>{t(lang, "Publisher / creator", "الناشر أو المؤلف")}</span><input name="publisherName" maxLength={180} /></label>
      <label className="library-field"><span>{t(lang, "Original source / license URL", "رابط المصدر الأصلي أو الترخيص")}</span><input name="sourceUrl" type="url" placeholder="https://…" /></label>
      <label className="library-field"><span>{t(lang, "Rights basis", "أساس حق الاستخدام")}</span><select name="rightsType" value={rightsType} onChange={event => { const next = event.target.value as typeof rightsType; setRightsType(next); if (next !== "teacher_original") setFile(null); }}>{teacherOriginalAllowed && <option value="teacher_original">{t(lang, "My original material", "مادة من إعدادي")}</option>}<option value="licensed_use">{t(lang, "Licensed source (link only)", "مصدر مرخص (رابط فقط)")}</option><option value="external_authorized_link">{t(lang, "Authorized external link", "رابط خارجي مصرح")}</option></select></label>
      <label className="library-field library-field-wide"><span>{t(lang, "Rights statement (required)", "بيان الحقوق (إلزامي)")}</span><textarea name="rightsNote" minLength={20} maxLength={2000} required rows={3} placeholder={t(lang, "Explain why you own or may share this material and any limits on its use.", "اشرح ملكيتك للمادة أو تصريح مشاركتها وأي قيود على الاستخدام.")} /></label>
      {(countryCode === "AE" || countryCode === "SA") && <label className="library-field library-field-wide"><span>{t(lang, "Curriculum reference (optional; reviewed before publication)", "مرجع مواءمة المنهج (اختياري، ويُراجع قبل النشر)")}</span><input name="alignmentReference" maxLength={160} placeholder={t(lang, "Policy, learning outcome, or unit reference", "السياسة أو ناتج التعلم أو الوحدة")} /></label>}
    </div>
    <div className="library-form-warning"><ShieldAlert size={16} /><span>{t(lang, "Only your original study notes and question banks may be uploaded. Licensed books and past exams must be shared as authorized external links with a source URL; never upload protected copies. Administrative review does not replace the rights holder's permission.", "يُسمح برفع مذكراتك وبنوك أسئلتك الأصلية فقط. تُشارك الكتب والامتحانات المرخصة كرابط خارجي مصرح به مع رابط المصدر؛ لا ترفع نسخًا محمية. مراجعة الإدارة لا تغني عن إذن صاحب الحق.")}</span></div>
    <label className="library-rights-checkbox"><input type="checkbox" name="rightsConfirmation" required />{t(lang, "I confirm that I created this material myself or have verified permission to share this exact link.", "أقر أنني أنشأت هذه المادة بنفسي أو تحققت من التصريح بمشاركة هذا الرابط بعينه.")}</label>
    <div className="library-form-footer"><button type="submit" className="button button-primary" disabled={submit.isPending}><Link2 size={16} />{submit.isPending ? t(lang, "Submitting…", "جارٍ الإرسال…") : t(lang, "Submit for review", "إرسال للمراجعة")}</button>{message && <p role="status" className={`library-form-message${messageIsError ? " is-error" : ""}`}>{message}</p>}</div>
  </form>;
}
