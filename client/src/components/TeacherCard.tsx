import { ArrowUpLeft, ArrowUpRight, BadgeCheck, MapPin, Star } from "lucide-react";
import { Link } from "wouter";
import { readList, t, type Language } from "@/lib/i18n";
import type { Teacher } from "@/lib/types";

export default function TeacherCard({ teacher, lang }: { teacher: Teacher; lang: Language }) {
  const subjects = readList(teacher.subjects);
  const curricula = readList(teacher.curricula);
  const initials = teacher.displayName.trim().split(/\s+/).slice(0, 2).map((part: string) => part[0]).join("").toUpperCase();
  const Arrow = lang === "ar" ? ArrowUpLeft : ArrowUpRight;
  return (
    <article className="teacher-card">
      <div className="teacher-card-top">
        <div className="teacher-avatar" aria-label={teacher.displayName}>{initials || "M"}</div>
        <div className="teacher-card-rating">{teacher.reviewCount > 0 ? <><Star size={14} fill="currentColor" />{Number(teacher.ratingAverage).toFixed(1)} <span>({teacher.reviewCount})</span></> : <span>{t(lang, "New profile", "ملف جديد")}</span>}</div>
      </div>
      <div className="teacher-name-row"><h3>{teacher.displayName}</h3>{teacher.credentialsVerified && <span className="verified-pill" title={t(lang, "Credentials reviewed", "تمت مراجعة المؤهلات")}><BadgeCheck size={15} />{t(lang, "Reviewed", "موثّق")}</span>}</div>
      <p className="teacher-specialty">{teacher.specialization}{teacher.qualification ? ` · ${teacher.qualification}` : ""}</p>
      <p className="teacher-location"><MapPin size={14} />{teacher.location}{teacher.nationality ? ` · ${teacher.nationality}` : ""}</p>
      <div className="teacher-tags">{subjects.slice(0, 2).map(subject => <span key={subject}>{subject}</span>)}{curricula.slice(0, 1).map(item => <span key={item} className="tag-muted">{item}</span>)}</div>
      <div className="teacher-card-foot"><div><strong>{teacher.hourlyRate} <small>AED</small></strong><span>{t(lang, "per lesson hour", "للساعة")}</span></div><Link href={`/teachers/${teacher.id}`} className="round-arrow" aria-label={t(lang, `View ${teacher.displayName}`, `عرض ملف ${teacher.displayName}`)}><Arrow size={18} /></Link></div>
    </article>
  );
}
