import { useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowUpLeft, ArrowUpRight, BadgeCheck, FileCheck2, FileText, GraduationCap, ShieldCheck, UploadCloud, X } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import { t } from "@/lib/i18n";
import { curricula, curriculumLabel } from "@/lib/curricula";
import type { SharedPageProps } from "@/pages/Home";
import { trpc } from "@/lib/trpc";

const subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Arabic", "Islamic Education", "General Science", "Computer Science"] as const;
const countries = [
  { value: "EG", en: "Egypt", ar: "مصر" },
  { value: "AE", en: "United Arab Emirates", ar: "الإمارات العربية المتحدة" },
  { value: "SA", en: "Saudi Arabia", ar: "المملكة العربية السعودية" },
  { value: "both", en: "Egypt and UAE", ar: "مصر والإمارات" },
  { value: "other", en: "Other", ar: "أخرى" },
] as const;
type Subject = (typeof subjects)[number];
type Curriculum = (typeof curricula)[number]["value"];
type Country = (typeof countries)[number]["value"];
type ApplicationDocumentType = "qualification" | "experience" | "supporting";
type SelectedApplicationDocument = { id: string; file: File; documentType: ApplicationDocumentType };

const MAX_DOCUMENT_COUNT = 5;
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_DOCUMENT_BYTES = 20 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png"];

const emptyForm = {
  fullName: "",
  phone: "",
  email: "",
  countryCode: "EG" as Country,
  city: "",
  subjects: [] as Subject[],
  curricula: [] as Curriculum[],
  grades: "",
  experienceYears: "",
  languages: "",
  qualificationSummary: "",
  professionalSummary: "",
  contactConsent: false,
  website: "",
};

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const comma = result.indexOf(",");
      if (comma < 0) reject(new Error("Could not read selected document"));
      else resolve(result.slice(comma + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read selected document"));
    reader.readAsDataURL(file);
  });
}

export default function TeacherApplyPage(props: SharedPageProps) {
  const { lang, setLang, user, onLogin } = props;
  const [form, setForm] = useState(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<SelectedApplicationDocument[]>([]);
  const [documentError, setDocumentError] = useState("");
  const [isPreparingDocuments, setIsPreparingDocuments] = useState(false);
  const application = trpc.teachers.submitPublicApplication.useMutation({
    onSuccess: () => setSubmitted(true),
  });
  const Arrow = lang === "ar" ? ArrowUpLeft : ArrowUpRight;
  const setField = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) => {
    setForm(current => ({ ...current, [key]: value }));
  };
  const toggleSubject = (subject: Subject) => setForm(current => ({
    ...current,
    subjects: current.subjects.includes(subject)
      ? current.subjects.filter(item => item !== subject)
      : [...current.subjects, subject],
  }));
  const toggleCurriculum = (curriculum: Curriculum) => setForm(current => ({
    ...current,
    curricula: current.curricula.includes(curriculum)
      ? current.curricula.filter(item => item !== curriculum)
      : [...current.curricula, curriculum],
  }));

  const addDocuments = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    let nextDocuments = [...selectedDocuments];
    const errors: string[] = [];
    let totalBytes = nextDocuments.reduce((total, item) => total + item.file.size, 0);

    for (const file of files) {
      if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
        errors.push(t(lang, "Choose PDF, JPG or PNG files only.", "اختار ملفات PDF أو JPG أو PNG فقط."));
        continue;
      }
      if (!file.size || file.size > MAX_DOCUMENT_BYTES) {
        errors.push(t(lang, "Each file must be smaller than 5 MB.", "حجم كل ملف لازم يكون 5 ميجابايت أو أقل."));
        continue;
      }
      if (nextDocuments.length >= MAX_DOCUMENT_COUNT) {
        errors.push(t(lang, "You can attach up to 5 files.", "تقدر ترفق لحد 5 ملفات."));
        break;
      }
      if (totalBytes + file.size > MAX_TOTAL_DOCUMENT_BYTES) {
        errors.push(t(lang, "All attached files together must be 20 MB or less.", "إجمالي أحجام المرفقات لازم يكون 20 ميجابايت أو أقل."));
        continue;
      }
      nextDocuments.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        documentType: "qualification",
      });
      totalBytes += file.size;
    }

    setSelectedDocuments(nextDocuments);
    setDocumentError(errors.join(" "));
    event.currentTarget.value = "";
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.contactConsent) return;
    setDocumentError("");
    setIsPreparingDocuments(true);
    try {
      const documents = await Promise.all(selectedDocuments.map(async item => ({
        documentType: item.documentType,
        originalName: item.file.name,
        mimeType: item.file.type as "application/pdf" | "image/jpeg" | "image/png",
        base64: await readFileAsBase64(item.file),
      })));
      application.mutate({
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        countryCode: form.countryCode,
        city: form.city,
        subjects: form.subjects,
        curricula: form.curricula,
        grades: form.grades,
        experienceYears: Number(form.experienceYears),
        languages: form.languages,
        qualificationSummary: form.qualificationSummary,
        professionalSummary: form.professionalSummary,
        contactConsent: true,
        documents,
        website: form.website,
      });
    } catch {
      setDocumentError(t(lang, "We couldn't read one of the selected files. Please choose it again.", "تعذر قراءة أحد الملفات المختارة. اختاره مرة تانية من فضلك."));
    } finally {
      setIsPreparingDocuments(false);
    }
  };

  const setDocumentType = (id: string, documentType: ApplicationDocumentType) => {
    setSelectedDocuments(current => current.map(item => item.id === id ? { ...item, documentType } : item));
  };

  return <SiteShell lang={lang} setLang={setLang} user={user} onLogin={onLogin}>
    <main className="portal-page teacher-public-apply-page">
      <div className="portal-welcome portal-welcome-compact">
        <div>
          <span className="section-eyebrow">{t(lang, "TEACH WITH MIHWAR", "التدريس مع محور")}</span>
          <h1>{t(lang, "Start with a simple application.", "ابدأ بطلب انضمام بسيط.")}</h1>
          <p>{t(lang, "Send your teaching details directly through Mihwar. No Manus account is needed to apply.", "قدّم بياناتك التعليمية مباشرة عبر محور، من غير ما تحتاج حساب Manus لإرسال الطلب.")}</p>
        </div>
        <div className="portal-side-mark"><GraduationCap size={25} />MIHWAR / EDU</div>
      </div>

      {submitted ? <section className="dashboard-panel teacher-apply-success" role="status">
        <div className="empty-emblem"><BadgeCheck size={28} /></div>
        <h2>{t(lang, "Your application has been received.", "وصل طلبك لمحور.")}</h2>
        <p>{t(lang, "Your application and attachments are private and available to Mihwar administrators for review. This is not an account or automatic approval. The form is for education qualifications and experience only; do not upload identity documents.", "طلبك ومرفقاته خاصة ومتاحة لمسؤولي محور لمراجعتها فقط. ده مش إنشاء حساب ولا اعتماد تلقائي. النموذج مخصص للمؤهلات التعليمية والخبرة؛ من فضلك ما ترفعش وثائق هوية.")}</p>
        <a className="button button-outline" href="/">{t(lang, "Back to Mihwar", "العودة إلى محور")}<Arrow size={16} /></a>
      </section> : <section className="dashboard-panel teacher-public-apply-panel">
        <div className="panel-heading">
          <div><span className="section-eyebrow">{t(lang, "TEACHER APPLICATION", "طلب انضمام مدرس")}</span><h2>{t(lang, "Tell us what you teach.", "عرّفنا بتخصصك وخبرتك.")}</h2></div>
          <ShieldCheck size={24} className="accent-icon" />
        </div>
        <p className="panel-description">{t(lang, "Only the information needed for an initial review and follow-up is requested. Your application stays private and does not create a Mihwar account or make a public teacher profile.", "هنطلب بس المعلومات اللازمة للمراجعة الأولية والتواصل. طلبك يظل خاصًا، ولا ينشئ حسابًا على محور أو ملف مدرس ظاهرًا للعامة.")}</p>

        <form className="teacher-application-form teacher-public-apply-form" onSubmit={submit}>
          <div className="form-grid-two">
            <label className="field-label">{t(lang, "Full name", "الاسم الكامل")}<input required minLength={2} maxLength={160} autoComplete="name" value={form.fullName} onChange={event => setField("fullName", event.target.value)} /></label>
            <label className="field-label">{t(lang, "Phone / WhatsApp", "رقم الهاتف أو واتساب")}<input required type="tel" pattern={"(?=(?:\\D*\\d){8,15}\\D*$)\\+?[0-9][0-9 ()-]{7,25}"} title={t(lang, "Enter 8–15 digits; spaces, parentheses and hyphens are allowed.", "اكتب من 8 إلى 15 رقمًا؛ يمكن استخدام المسافات والأقواس والشرطات.")} maxLength={32} autoComplete="tel" placeholder="+20 10 1234 5678" value={form.phone} onChange={event => setField("phone", event.target.value)} /></label>
            <label className="field-label">{t(lang, "Email (optional)", "البريد الإلكتروني (اختياري)")}<input type="email" maxLength={320} autoComplete="email" value={form.email} onChange={event => setField("email", event.target.value)} /></label>
            <label className="field-label">{t(lang, "Where do you teach?", "أين تدرّس?")}<select required value={form.countryCode} onChange={event => setField("countryCode", event.target.value as Country)}>{countries.map(country => <option key={country.value} value={country.value}>{t(lang, country.en, country.ar)}</option>)}</select></label>
            <label className="field-label">{t(lang, "City / area", "المدينة أو المنطقة")}<input required minLength={2} maxLength={120} autoComplete="address-level2" value={form.city} onChange={event => setField("city", event.target.value)} /></label>
            <label className="field-label">{t(lang, "Years of teaching experience", "سنوات الخبرة في التدريس")}<input required type="number" min={0} max={60} step={1} value={form.experienceYears} onChange={event => setField("experienceYears", event.target.value)} /></label>
          </div>

          <fieldset className="teacher-choice-group">
            <legend>{t(lang, "Subjects you teach", "المواد التي تدرّسها")}</legend>
            <div className="form-grid-two">{subjects.map(subject => <label className="checkbox-line" key={subject}><input type="checkbox" checked={form.subjects.includes(subject)} onChange={() => toggleSubject(subject)} />{t(lang, subject, subject === "Mathematics" ? "رياضيات" : subject === "Physics" ? "فيزياء" : subject === "Chemistry" ? "كيمياء" : subject === "Biology" ? "أحياء" : subject === "English" ? "لغة إنجليزية" : subject === "Arabic" ? "لغة عربية" : subject === "Islamic Education" ? "تربية إسلامية" : subject === "General Science" ? "علوم عامة" : "علوم الحاسب")}</label>)}</div>
            {form.subjects.length === 0 && <span className="teacher-choice-hint">{t(lang, "Choose at least one subject.", "اختر مادة واحدة على الأقل.")}</span>}
          </fieldset>

          <fieldset className="teacher-choice-group">
            <legend>{t(lang, "Curricula you know", "المناهج التي تعرفها")}</legend>
            <div className="form-grid-two">{curricula.map(item => <label className="checkbox-line" key={item.value}><input type="checkbox" checked={form.curricula.includes(item.value)} onChange={() => toggleCurriculum(item.value)} />{curriculumLabel(item.value, lang)}</label>)}</div>
            {form.curricula.length === 0 && <span className="teacher-choice-hint">{t(lang, "Choose at least one curriculum.", "اختر منهجًا واحدًا على الأقل.")}</span>}
          </fieldset>

          <div className="form-grid-two">
            <label className="field-label">{t(lang, "Grades / year groups", "الصفوف الدراسية")}<input required maxLength={300} placeholder={t(lang, "e.g. Primary 1–5", "مثال: الابتدائي من الأول إلى الخامس")} value={form.grades} onChange={event => setField("grades", event.target.value)} /></label>
            <label className="field-label">{t(lang, "Languages you teach in", "لغات التدريس")}<input required minLength={2} maxLength={120} placeholder="Arabic, English" value={form.languages} onChange={event => setField("languages", event.target.value)} /></label>
          </div>
          <label className="field-label">{t(lang, "Qualifications (optional, summary only)", "المؤهل العلمي (اختياري، وصف مختصر فقط)")}<input maxLength={255} value={form.qualificationSummary} onChange={event => setField("qualificationSummary", event.target.value)} /></label>
          <label className="field-label">{t(lang, "Short professional introduction (optional)", "نبذة مهنية قصيرة (اختيارية)")}<textarea maxLength={1500} rows={4} value={form.professionalSummary} onChange={event => setField("professionalSummary", event.target.value)} /></label>

          <section className="teacher-document-upload" aria-labelledby="teacher-document-heading">
            <div className="teacher-document-heading"><FileCheck2 size={19} /><div><strong id="teacher-document-heading">{t(lang, "Certificates and experience documents (optional)", "شهادات المؤهل والخبرة (اختياري)")}</strong><span>{t(lang, "Attach evidence to help the team review your application in one place.", "ارفق ما يثبت مؤهلاتك وخبرتك عشان الإدارة تراجع الطلب ومرفقاته مرة واحدة.")}</span></div></div>
            <label className={`teacher-document-picker${isPreparingDocuments || application.isPending ? " teacher-document-picker-disabled" : ""}`}>
              <input type="file" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" multiple disabled={isPreparingDocuments || application.isPending} onChange={addDocuments} />
              <UploadCloud size={21} />
              <span>{t(lang, "Choose files", "اختار ملفات")}</span>
              <small>{t(lang, "PDF, JPG or PNG · up to 5 files · 5 MB each · 20 MB total", "PDF أو JPG أو PNG · حتى 5 ملفات · 5 ميجابايت للملف · 20 ميجابايت إجمالي")}</small>
            </label>
            {selectedDocuments.length > 0 && <div className="teacher-document-list">{selectedDocuments.map(item => <article className="teacher-document-row" key={item.id}>
              <FileText size={17} />
              <div className="teacher-document-file"><strong title={item.file.name}>{item.file.name}</strong><small>{formatFileSize(item.file.size)}</small></div>
              <select aria-label={t(lang, `Document category for ${item.file.name}`, `نوع المستند: ${item.file.name}`)} value={item.documentType} disabled={isPreparingDocuments || application.isPending} onChange={event => setDocumentType(item.id, event.target.value as ApplicationDocumentType)}>
                <option value="qualification">{t(lang, "Qualification", "مؤهل / شهادة")}</option>
                <option value="experience">{t(lang, "Experience", "إثبات خبرة")}</option>
                <option value="supporting">{t(lang, "Other education document", "مستند تعليمي إضافي")}</option>
              </select>
              <button type="button" className="teacher-document-remove" aria-label={t(lang, `Remove ${item.file.name}`, `حذف ${item.file.name}`)} disabled={isPreparingDocuments || application.isPending} onClick={() => setSelectedDocuments(current => current.filter(document => document.id !== item.id))}><X size={16} /></button>
            </article>)}</div>}
            {documentError && <p className="form-feedback form-error" role="alert">{documentError}</p>}
          </section>

          <div className="upload-warning teacher-privacy-note"><ShieldCheck size={18} /><span>{t(lang, "Privacy: your application files are stored privately and can only be reviewed or downloaded by Mihwar administrators. Upload education qualifications or experience evidence only—never an ID or passport. Files are checked for type and size, not malware; they remain with the application and are not automatically deleted yet.", "الخصوصية: ملفات طلبك محفوظة بشكل خاص ولا يراجعها أو ينزلها إلا مسؤولو محور. ارفع شهادات تعليمية أو إثبات خبرة فقط، وممنوع بطاقة الهوية أو جواز السفر. بنراجع نوع الملف وحجمه لكن ما فيش فحص فيروسات؛ الملفات بتفضل مرتبطة بالطلب ومش بتتمسح تلقائيًا حاليًا.")}</span></div>
          <label className="checkbox-line teacher-consent-line"><input required type="checkbox" checked={form.contactConsent} onChange={event => setField("contactConsent", event.target.checked)} />{t(lang, "I agree that Mihwar may use my details and attached education documents only to review my application and contact me about joining. I understand the files are not automatically deleted.", "أوافق أن تستخدم محور بياناتي ومرفقاتي التعليمية لمراجعة طلبي والتواصل معي بشأن الانضمام فقط، وفاهم إن الملفات مش بتتمسح تلقائيًا.")}</label>

          <div className="teacher-honeypot" aria-hidden="true"><label>Leave this field empty<input tabIndex={-1} autoComplete="off" value={form.website} onChange={event => setField("website", event.target.value)} /></label></div>
          <button type="submit" className="button button-primary" disabled={application.isPending || isPreparingDocuments || form.subjects.length === 0 || form.curricula.length === 0 || !form.contactConsent}>
            {application.isPending || isPreparingDocuments ? t(lang, "Sending…", "جارٍ الإرسال…") : t(lang, "Send application", "إرسال طلب الانضمام")}<Arrow size={16} />
          </button>
          {application.error && <p className="form-feedback form-error" role="alert">{t(lang, "We couldn't send your application. Please check the form and try again shortly.", "تعذر إرسال الطلب. راجع البيانات وحاول مرة أخرى بعد قليل.")}</p>}
        </form>
        <p className="teacher-existing-account">{t(lang, "Already have a Mihwar teacher account?", "عندك حساب مدرس على محور بالفعل?")} <a href="/teacher">{t(lang, "Sign in to your portal", "سجّل الدخول لبوابتك")}</a></p>
      </section>}
    </main>
  </SiteShell>;
}
