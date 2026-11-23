import { useState } from "react";
import { Archive, Check, ExternalLink, FileText, ShieldAlert, X } from "lucide-react";
import { gradeForCode } from "../../../../shared/library-catalog";
import { t } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import PdfReader from "./PdfReader";
import type { LibraryResourceItem } from "./types";

export default function AdminResourceReview({ lang }: { lang: Language }) {
  const [active, setActive] = useState<LibraryResourceItem | null>(null);
  const [note, setNote] = useState("");
  const [rightsVerifiedFor, setRightsVerifiedFor] = useState<number | null>(null);
  const queue = trpc.library.reviewQueue.useQuery();
  const preview = trpc.library.downloadUrl.useQuery({ resourceId: active?.id ?? 0 }, { enabled: !!active?.hasFile });
  const utils = trpc.useUtils();
  const review = trpc.library.review.useMutation({ onSuccess: async () => {
    setActive(null); setNote(""); setRightsVerifiedFor(null);
    await Promise.all([utils.library.reviewQueue.invalidate(), utils.library.list.invalidate()]);
  } });
  return <section className="dashboard-panel library-admin-review">
    <div className="panel-heading"><div><span className="section-eyebrow">{t(lang, "RESOURCE RIGHTS & QUALITY", "حقوق الموارد وجودتها")}</span><h2>{t(lang, "Library submissions", "مساهمات المكتبة")}</h2></div><span className="panel-count">{queue.data?.length ?? 0}</span></div>
    <div className="upload-warning"><ShieldAlert size={16} /><span>{t(lang, "Check the rights statement and source before approval. Approval makes the item visible to all library visitors.", "تحقق من بيان الحقوق والمصدر قبل الموافقة. الموافقة تجعل المورد ظاهرًا لكل زوار المكتبة.")}</span></div>
    {queue.isLoading ? <div className="panel-empty">{t(lang, "Loading submissions…", "جارٍ تحميل المساهمات…")}</div> : queue.error ? <div className="panel-empty">{t(lang, "Could not load the review queue.", "تعذر تحميل قائمة المراجعة.")}</div> : !queue.data?.length ? <div className="panel-empty"><FileText size={23} /><p>{t(lang, "No library resources are awaiting review.", "لا توجد موارد مكتبة بانتظار المراجعة.")}</p></div> : <div className="library-admin-list">{queue.data.map(item => {
      const grade = gradeForCode(item.countryCode, item.gradeCode);
      return <article className="library-admin-item" key={item.id}><div className="library-admin-item-head"><div><span className="library-resource-eyebrow">{item.countryCode} · {item.curriculumCode} · {grade?.gradeLabelEn ?? item.gradeCode}</span><h3>{item.title}</h3></div><span className="status-pill status-pending">{t(lang, "Pending", "قيد المراجعة")}</span></div>
        <p>{item.description || t(lang, "No description provided.", "لم يُضف وصف.")}</p><div className="library-admin-meta"><span>{t(lang, "Contributor", "المساهم")}: {item.contributorName || t(lang, "Verified teacher", "معلم موثق")}</span><span>{t(lang, "Rights", "الحقوق")}: {item.rightsType}</span>{item.publisherName && <span>{t(lang, "Publisher", "الناشر")}: {item.publisherName}</span>}</div><div className="library-admin-rights">{item.rightsNote}</div>
        <div className="library-admin-links">{item.hasFile && <button type="button" className="small-action" onClick={() => setActive(item)}><FileText size={14} />{t(lang, "Preview PDF", "معاينة PDF")}</button>}{item.externalUrl && <a href={item.externalUrl} target="_blank" rel="noopener noreferrer" className="video-link">{t(lang, "Open resource link", "فتح رابط المورد")}<ExternalLink size={13} /></a>}{item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="video-link">{t(lang, "Check rights source", "مراجعة مصدر الحقوق")}<ExternalLink size={13} /></a>}</div>
        <label className="library-field"><span>{t(lang, "Review note", "ملاحظة المراجع")}</span><textarea rows={2} value={note} onChange={event => setNote(event.target.value)} maxLength={2000} placeholder={t(lang, "Optional note to the contributor", "ملاحظة اختيارية للمساهم")} /></label>
        {review.error && <p className="library-form-message is-error">{review.error.message}</p>}
        <label className="library-rights-checkbox"><input type="checkbox" checked={rightsVerifiedFor === item.id} onChange={event => setRightsVerifiedFor(event.target.checked ? item.id : null)} />{t(lang, "I checked the original source and confirmed the stated redistribution rights for this item.", "راجعت المصدر الأصلي وتحققت من حق إعادة توزيع هذا المورد كما ورد في إقراره.")}</label>
        <div className="library-admin-actions"><button type="button" className="button button-outline button-danger" disabled={review.isPending} onClick={() => review.mutate({ resourceId: item.id, decision: "reject", reviewNote: note })}><X size={15} />{t(lang, "Reject", "رفض")}</button><button type="button" className="button button-outline" disabled={review.isPending} onClick={() => review.mutate({ resourceId: item.id, decision: "archive", reviewNote: note })}><Archive size={15} />{t(lang, "Archive", "أرشفة")}</button><button type="button" className="button button-primary" disabled={review.isPending || rightsVerifiedFor !== item.id} onClick={() => review.mutate({ resourceId: item.id, decision: "approve", reviewNote: note, rightsVerified: true })}><Check size={15} />{t(lang, "Approve & publish", "موافقة ونشر")}</button></div>
      </article>;
    })}</div>}
    {active && preview.data?.url && <PdfReader resource={active} url={preview.data.url} initialPage={1} lang={lang} onSavePage={() => undefined} onClose={() => setActive(null)} />}
    {active && preview.error && <div role="alert" className="library-form-message is-error">{preview.error.message}</div>}
  </section>;
}
