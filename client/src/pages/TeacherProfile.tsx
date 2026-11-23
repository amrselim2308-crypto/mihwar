import { useMemo, useState } from "react";
import { ArrowUpLeft, ArrowUpRight, BadgeCheck, BookOpen, CalendarDays, Check, Clock3, GraduationCap, MapPin, Play, ShieldCheck, Star } from "lucide-react";
import { Link } from "wouter";
import SiteShell from "@/components/SiteShell";
import { readList, t } from "@/lib/i18n";
import type { SharedPageProps } from "@/pages/Home";
import { trpc } from "@/lib/trpc";

export default function TeacherProfilePage({ teacherId, lang, setLang, user, onLogin }: SharedPageProps & { teacherId: number }) {
  const profile = trpc.teachers.getById.useQuery({ id: teacherId }, { enabled: Number.isInteger(teacherId) && teacherId > 0 });
  const children = trpc.students.mine.useQuery(undefined, { enabled: !!user });
  const [subject, setSubject] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [duration, setDuration] = useState<30 | 45 | 60 | 90>(60);
  const [studentId, setStudentId] = useState("");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState("");
  const teacher = profile.data;
  const subjects = useMemo(() => teacher ? readList(teacher.subjects) : [], [teacher]);
  const curricula = teacher ? readList(teacher.curricula) : [];
  const grades = teacher ? readList(teacher.grades) : [];
  const languages = teacher ? readList(teacher.languages) : [];
  const selectedSubject = subject || subjects[0] || "";
  const book = trpc.bookings.create.useMutation({ onSuccess: () => { setFeedback(t(lang, "Your request was sent. Payment becomes available after the booking is confirmed.", "أُرسل طلبك. سيظهر خيار الدفع بعد تأكيد الحجز.")); setNotes(""); } });
  const Arrow = lang === "ar" ? ArrowUpLeft : ArrowUpRight;
  const initials = teacher?.displayName.split(/\s+/).slice(0, 2).map((part: string) => part[0]).join("") ?? "";
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!teacher) return;
    if (!user) { onLogin(); return; }
    if (!dateTime || !selectedSubject) { setFeedback(t(lang, "Choose a subject and proposed time.", "اختر المادة والموعد المقترح.")); return; }
    const parsed = new Date(dateTime);
    if (parsed.getTime() <= Date.now()) { setFeedback(t(lang, "Choose a future date and time.", "اختر موعدًا في المستقبل.")); return; }
    book.mutate({ teacherProfileId: teacher.id, studentProfileId: studentId ? Number(studentId) : null, subject: selectedSubject, curriculum: children.data?.find(item => item.id === Number(studentId))?.curriculum || curricula[0] || "Other", grade: children.data?.find(item => item.id === Number(studentId))?.grade || grades[0] || "Grade 1", scheduledAt: parsed.toISOString(), durationMinutes: duration, notes: notes || undefined });
  };

  if (profile.isLoading) return <SiteShell lang={lang} setLang={setLang} user={user} onLogin={onLogin}><main className="profile-page"><div className="directory-empty">{t(lang, "Loading teacher profile…", "جارٍ تحميل ملف المعلم…")}</div></main></SiteShell>;
  if (profile.error || !teacher) return <SiteShell lang={lang} setLang={setLang} user={user} onLogin={onLogin}><main className="profile-page"><div className="directory-empty"><h2>{t(lang, "This teacher profile is not available.", "ملف هذا المعلم غير متاح.")}</h2><p>{t(lang, "Only approved teacher profiles are visible in the directory.", "لا تظهر في الدليل إلا ملفات المعلمين المعتمدة.")}</p><Link href="/teachers" className="button button-primary">{t(lang, "Back to teachers", "العودة إلى المعلمين")}</Link></div></main></SiteShell>;

  return <SiteShell lang={lang} setLang={setLang} user={user} onLogin={onLogin}><main className="profile-page">
    <div className="breadcrumb"><Link href="/teachers">{t(lang, "Teachers", "المعلمون")}</Link><span>/</span><span>{teacher.displayName}</span></div>
    <div className="profile-layout"><div className="profile-main"><section className="profile-intro"><div className="profile-avatar">{initials}</div><div className="profile-heading"><span className="section-eyebrow">{t(lang, "APPROVED EDUCATOR", "معلّم معتمد")}</span><h1>{teacher.displayName}</h1><p className="profile-location"><MapPin size={15} />{teacher.location} · {teacher.nationality}</p><div className="profile-badges"><span className="verified-pill"><BadgeCheck size={15} />{t(lang, "Credentials reviewed", "تمت مراجعة المؤهلات")}</span>{teacher.reviewCount > 0 && <span className="profile-rating"><Star size={15} fill="currentColor" />{Number(teacher.ratingAverage).toFixed(1)} ({teacher.reviewCount})</span>}</div></div></section>
      <div className="profile-facts"><div><GraduationCap size={18} /><span>{t(lang, "Qualification & university", "المؤهل والجامعة")}</span><strong>{teacher.qualification} · {teacher.university}</strong></div><div><BookOpen size={18} /><span>{t(lang, "Specialization", "التخصص")}</span><strong>{teacher.specialization}</strong></div><div><Clock3 size={18} /><span>{t(lang, "Experience", "الخبرة")}</span><strong>{teacher.experienceYears} {t(lang, "years", "سنوات")}</strong></div></div>
      <section className="profile-section"><h2>{t(lang, "About the teacher", "نبذة عن المعلم")}</h2><p className="profile-bio">{teacher.bio}</p></section>
      <section className="profile-section"><h2>{t(lang, "Teaching approach", "أسلوب التدريس")}</h2><p className="profile-bio">{teacher.teachingMethodology}</p></section>
      {teacher.introVideoUrl && <section className="profile-section"><h2>{t(lang, "Introduction", "التعريف بالمعلم")}</h2><a href={teacher.introVideoUrl} target="_blank" rel="noreferrer" className="video-link"><Play size={16} />{t(lang, "Watch introduction video", "شاهد فيديو التعريف")}</a></section>}
      <section className="profile-section"><h2>{t(lang, "Subjects & curricula", "المواد والمناهج")}</h2><div className="profile-list"><div><span>{t(lang, "Subjects", "المواد")}</span><div className="teacher-tags">{subjects.map(value => <span key={value}>{value}</span>)}</div></div><div><span>{t(lang, "Curricula", "المناهج")}</span><div className="teacher-tags">{curricula.map(value => <span className="tag-muted" key={value}>{value}</span>)}</div></div><div><span>{t(lang, "Grades", "الصفوف")}</span><p>{grades.join(" · ")}</p></div><div><span>{t(lang, "Languages", "اللغات")}</span><p>{languages.join(" · ")}</p></div></div></section>
      <section className="profile-section reviews-empty"><h2>{t(lang, "Parent feedback", "آراء أولياء الأمور")}</h2>{teacher.reviewCount ? <p><Star size={16} fill="currentColor" />{Number(teacher.ratingAverage).toFixed(1)} · {teacher.reviewCount} {t(lang, "reviews linked to completed lesson records", "تقييمًا مرتبطًا بسجلات دروس مكتملة")}</p> : <p>{t(lang, "No lesson reviews have been submitted yet.", "لم تُقدّم تقييمات دروس بعد.")}</p>}</section>
    </div><aside className="booking-card"><span className="section-eyebrow">{t(lang, "REQUEST A LESSON", "اطلب درسًا")}</span><div className="booking-price"><strong>{teacher.hourlyRate}</strong><span>AED / {t(lang, "hour", "ساعة")}</span></div><p className="booking-note">{t(lang, "Request a time; the teacher confirms availability.", "اقترح موعدًا، ويؤكد المعلم توفره.")}</p>
      <form onSubmit={submit} className="booking-form"><label className="field-label">{t(lang, "Subject", "المادة")}<select value={selectedSubject} onChange={event => setSubject(event.target.value)} required>{subjects.map(value => <option key={value}>{value}</option>)}</select></label>
      {user && children.data?.length ? <label className="field-label">{t(lang, "Student profile (optional)", "ملف الطالب (اختياري)")}<select value={studentId} onChange={event => setStudentId(event.target.value)}><option value="">{t(lang, "Add later / not listed", "سأضيفه لاحقًا")}</option>{children.data.map(child => <option key={child.id} value={child.id}>{child.fullName} · {child.grade}</option>)}</select></label> : <label className="field-label">{t(lang, "Preferred time", "الموعد المقترح")}<input type="datetime-local" value={dateTime} onChange={event => setDateTime(event.target.value)} required /></label>}
      {user && children.data?.length ? <label className="field-label">{t(lang, "Preferred time", "الموعد المقترح")}<input type="datetime-local" value={dateTime} onChange={event => setDateTime(event.target.value)} required /></label> : null}
      <label className="field-label">{t(lang, "Lesson length", "مدة الدرس")}<select value={duration} onChange={event => setDuration(Number(event.target.value) as 30 | 45 | 60 | 90)}>{[30, 45, 60, 90].map(value => <option key={value} value={value}>{value} {t(lang, "minutes", "دقيقة")}</option>)}</select></label>
      <label className="field-label">{t(lang, "Anything the teacher should know?", "معلومة تساعد المعلم") }<textarea value={notes} onChange={event => setNotes(event.target.value)} rows={3} maxLength={1000} placeholder={t(lang, "Optional context", "معلومات اختيارية")} /></label>
      <button className="button button-primary booking-submit" type="submit" disabled={book.isPending}>{book.isPending ? t(lang, "Sending…", "جارٍ الإرسال…") : user ? t(lang, "Send lesson request", "إرسال طلب الدرس") : t(lang, "Sign in to request", "سجّل الدخول لطلب الدرس")}<Arrow size={17} /></button>
      {feedback && <p className={`form-feedback ${book.isError ? "form-error" : ""}`}>{feedback}</p>}
      {book.error && <p className="form-feedback form-error">{t(lang, "The request could not be sent. Please retry.", "تعذر إرسال الطلب. حاول مرة أخرى.")}</p>}
      <div className="booking-disclaimer"><ShieldCheck size={15} /><span>{t(lang, "No payment is taken. A request is not confirmed until the teacher accepts it.", "لا يتم تحصيل أي مبلغ. لا يتأكد الطلب قبل موافقة المعلم.")}</span></div>
      <div className="booking-assurances"><span><Check size={14} />{t(lang, "Reviewed profile", "ملف تمت مراجعته")}</span><span><Check size={14} />{t(lang, "No card required", "لا حاجة لبطاقة دفع")}</span></div>
    </form></aside></div>
  </main></SiteShell>;
}
