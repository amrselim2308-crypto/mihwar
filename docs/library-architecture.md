# مكتبة الموارد والمناهج الرقمية في Mihwar

## قرارات المنتج والمنهج

المكتبة ثلاثة مسارات دراسية مستقلة: `EG_MOE` لمصر و`AE_MOE` للإمارات و`SA_MOE` للسعودية. في مصر، تسجل الصفوف `EG_P1` إلى `EG_P6` ضمن الابتدائي، و`EG_PREP1` إلى `EG_PREP3` ضمن الإعدادي، و`EG_S1` إلى `EG_S3` ضمن الثانوي، مع فصل أول أو ثانٍ أو مورد سنوي. تعرض بوابة الكتب المصرية الرسمية فهرس الكتب وصفحات المرحلة وخيارات تحديد الصف والمادة؛ تحتفظ Mihwar بحقل الفصل كتصفية تنظيمية داخلية وتحيل إلى الوزارة بدل إعادة نشر الملفات [1] [2] [5].

في الإمارات، يُختار منهج وزارة التربية `AE_MOE`، مع Cycle 1 للصفوف 1–4، وCycle 2 للصفوف 5–8، وCycle 3 للصفوف 9–12 في مدارس منهج الوزارة. سياسة ADEK تذكر أيضًا تصنيفًا عامًا لمدارس أبوظبي الخاصة يختلف في نهاية Cycle 1 (G1/Y2–G5/Y6)، ثم توضح أن مدارس منهج MoE يمكنها اتباع حلقات الوزارة (G1–G4، G5–G8، G9–G12). لذلك لا يُسجّل ADEK على أنه منهج منفصل ولا تُخلط خريطتا الصفوف؛ يحتفظ المورد بمنهج الوزارة وحقول مرجع المواءمة/الإصدار عند الحاجة [3]. وتوضح بوابة حكومة الإمارات أن قارئ Diwan الإلكتروني يتيح الوصول للمناهج إلكترونيًا لمعلمي وطلاب المدارس الحكومية؛ لذلك تعرضه Mihwar كمصدر رسمي خارجي مع تنبيه إلى أهلية الدخول [4].

في السعودية، يستخدم التصنيف `SA_MOE`: ابتدائي من الصف الأول إلى السادس (`SA_P1`–`SA_P6`)، متوسط من الأول إلى الثالث (`SA_I1`–`SA_I3`)، وثانوي من الأول إلى الثالث (`SA_S1`–`SA_S3`). تفصل المنصة `intermediate` عن المرحلة المصرية `preparatory`. تذكر الوزارة خمسة مسارات ثانوية: العام، وعلوم الحاسب والهندسة، والصحة والحياة، وإدارة الأعمال، والشرعي. تُعرض هذه المسارات كرابط معلومات رسمي فقط في هذه النسخة؛ لا يوجد بعد حقل تصفية منفصل لمسار الثانوية، لذلك لا يُفترض مسار لمورد ولا تُضاف كتب أو ملفات seed. تستند أسماء المراحل والصفوف إلى بوابة عين دروس، وتستند قائمة المسارات إلى صفحة الوزارة [6] [7] [8] [9].

لا تُزرع في النسخة الأولى كتب أو مذكرات أو امتحانات فعلية أو أسماء مراجع خارجية من دون إثبات حق الوصول والاستخدام. تظهر المكتبة بحالة فارغة موضحة، مع روابط البوابات الرسمية. مسؤولية اعتماد مورد داخل Mihwar لا تعني اعتماد الوزارة أو الجهة التنظيمية له.

## تصنيف المحتوى

رموز البلدان هي `EG` و`AE` و`SA`. رموز المنهج `EG_MOE` و`AE_MOE` و`SA_MOE`. المراحل المصرية `primary` و`preparatory` و`secondary`، ومراحل السعودية `primary` و`intermediate` و`secondary`، ومراحل الإمارات `cycle_1` و`cycle_2` و`cycle_3`. تخزن الصفوف المصرية بصيغة `EG_P1`…`EG_P6` ثم `EG_PREP1`…`EG_PREP3` ثم `EG_S1`…`EG_S3`؛ والإماراتية `AE_G1`…`AE_G12`؛ والسعودية `SA_P1`…`SA_P6` ثم `SA_I1`…`SA_I3` ثم `SA_S1`…`SA_S3`. الرموز والعناوين العربية والإنجليزية موجودة في `shared/library-catalog.ts` لتطابق الواجهة والخادم.

تصنيفات الموارد: `official_textbook` للكتاب الرسمي (رابط مصدر فقط ما لم يسمح الترخيص)، `authorized_reference` للمرجع المرخص، `study_notes` للمذكرات والملخصات، `past_exams` للامتحانات السابقة، و`question_bank` لبنوك الأسئلة. الصيغ: `pdf` و`interactive_quiz` و`video_summary` و`external_link`. تسجل الفصول `term_1` و`term_2` و`year`. لا تُعامل كلمة «معتمد» كوصف منشأ تلقائي؛ يسجل اسم الناشر والمصدر وإثبات الحق، ويظل المورد غير ظاهر حتى قرار المشرف.

## ضوابط حقوق النشر والمراجعة

على خادم المساهمات، يقتصر رفع ملف المعلم الأصلي على `study_notes` و`question_bank`؛ لا يستطيع المعلم إنشاء `official_textbook`، ولا تحميل نسخة من مرجع مرخص أو امتحان سابق. المراجع والامتحانات المرخصة تُضاف كرابط خارجي إلى المصدر، مع رابط مصدر الحقوق وبيانها. يتطلب نشر أي مساهمة إقرار المدير بأنه فحص المصدر وحقوق إعادة التوزيع، وتُنفذ المراجعة بتحديث شرطي من `pending` حتى لا تستبدل مراجعة متزامنة قرارًا آخر. هذه الضوابط تقلل المخاطر ولا تثبت وحدها ملكية الحق؛ تظل مسؤولية المدير التحقق من الإذن الفعلي قائمة، ولا يوجد محتوى seed.

## مخطط MySQL المنتج

هذا المخطط يناسب قاعدة Mihwar الحالية (MySQL + Drizzle). ملفات PDF تحفظ ككائنات في تخزين Manus؛ لا تحفظ بايتاتها أو روابط التنزيل المؤقتة في SQL. تحفظ SQL فقط مفتاح الكائن والبيانات الوصفية، وتصدر روابط القراءة الموقعة وقت الطلب بعد فحص حالة المورد وصلاحية المستخدم. أسماء الأعمدة أدناه وصفية؛ ملف Drizzle والترحيل في المشروع هما مصدر التنفيذ.

```sql
CREATE TABLE library_resources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  countryCode ENUM('EG','AE','SA') NOT NULL,
  curriculumCode VARCHAR(32) NOT NULL,
  stageCode ENUM('primary','preparatory','intermediate','secondary','cycle_1','cycle_2','cycle_3') NOT NULL,
  cycleCode ENUM('cycle_1','cycle_2','cycle_3') NULL,
  gradeCode VARCHAR(16) NOT NULL,
  subjectCode VARCHAR(40) NOT NULL,
  termCode ENUM('term_1','term_2','year') NOT NULL DEFAULT 'year',
  academicYear VARCHAR(16) NULL,
  category ENUM('official_textbook','authorized_reference','study_notes','past_exams','question_bank') NOT NULL,
  format ENUM('pdf','interactive_quiz','video_summary','external_link') NOT NULL,
  title VARCHAR(240) NOT NULL,
  description TEXT NULL,
  publisherName VARCHAR(180) NULL,
  sourceUrl VARCHAR(1024) NULL,
  externalUrl VARCHAR(1024) NULL,
  storageKey VARCHAR(512) NULL,
  rightsType ENUM('official_portal','teacher_original','licensed_use','external_authorized_link') NOT NULL,
  rightsNote TEXT NOT NULL,
  alignmentAuthority VARCHAR(40) NULL,
  alignmentReference VARCHAR(160) NULL,
  status ENUM('pending','approved','rejected','archived') NOT NULL DEFAULT 'pending',
  uploaderUserId INT NOT NULL,
  uploaderTeacherProfileId INT NULL,
  reviewerUserId INT NULL,
  reviewNote TEXT NULL,
  reviewedAt TIMESTAMP NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX library_resources_filter_idx (countryCode, curriculumCode, gradeCode, subjectCode, termCode, status),
  INDEX library_resources_category_idx (category, format, status),
  INDEX library_resources_stage_idx (stageCode, cycleCode, status),
  FOREIGN KEY (uploaderUserId) REFERENCES users(id),
  FOREIGN KEY (uploaderTeacherProfileId) REFERENCES teacher_profiles(id),
  FOREIGN KEY (reviewerUserId) REFERENCES users(id)
);

CREATE TABLE library_bookmarks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  resourceId INT NOT NULL,
  pageNumber INT NOT NULL DEFAULT 1,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT library_bookmarks_user_resource_uq UNIQUE (userId, resourceId),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (resourceId) REFERENCES library_resources(id)
);
```

يتحقق التطبيق من أن مفاتيح مصر والإمارات والسعودية والصفوف والمناهج متسقة، ويضع قيدًا على فئة الملف المرفوع. رفع PDF للمعلم متاح للمذكرات أو الأعمال الأصلية/المرخصة فقط، وليس لنسخ كتاب وزارة أو كتاب خارجي محمي. رابط كتاب الوزارة أو المرجع الخارجي يحفظ كرابط مع مصدر وبيان حق الاستخدام. `status` يضبط الوصول العام؛ المورد `pending` أو `rejected` لا يظهر للباحثين. قرار الرفض/الأرشفة منطقي، ولا يضمن حذف البايتات من مخزن الكائنات.

## تمثيل MongoDB البديل

لا يضاف MongoDB إلى التطبيق الحالي. عند نقل النظام إلى NoSQL يمكن تخزين سجل المورد كاملًا في مجموعة واحدة مع كائنات تصنيف مضمنة؛ يظل حفظ الإشارات المرجعية منفصلًا لمنع نمو مصفوفات المستخدمين داخل المورد.

```json
{
  "_id": "ObjectId",
  "taxonomy": {
    "countryCode": "AE",
    "curriculumCode": "AE_MOE",
    "stageCode": "cycle_2",
    "cycleCode": "cycle_2",
    "gradeCode": "AE_G6",
    "subjectCode": "science",
    "termCode": "term_1",
    "academicYear": "2026-2027"
  },
  "content": {
    "category": "study_notes",
    "format": "pdf",
    "title": "عنوان يحدده المساهم",
    "description": "وصف موجز",
    "publisherName": null,
    "externalUrl": null,
    "storageKey": "mihwar/library/random.pdf"
  },
  "rights": {
    "type": "teacher_original",
    "note": "إقرار بالملكية أو الإذن",
    "sourceUrl": null
  },
  "alignment": { "authority": "ADEK", "reference": "اختياري ويُراجع يدويًا" },
  "moderation": {
    "status": "pending",
    "uploaderUserId": 42,
    "uploaderTeacherProfileId": 11,
    "reviewerUserId": null,
    "reviewNote": null,
    "reviewedAt": null
  },
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

فهرس Mongo المقترح: مركب على `taxonomy.countryCode`, `taxonomy.curriculumCode`, `taxonomy.gradeCode`, `taxonomy.subjectCode`, `taxonomy.termCode`, `moderation.status`، وآخر على `content.category`, `content.format`, `moderation.status`. في bookmarks يستخدم فهرسًا فريدًا مركبًا `{userId:1, resourceId:1}`.

## واجهات الخدمة ومساراتها

واجهة الصفحة هي `/library`، ولا تتطلب تسجيل الدخول لتصفح الموارد المنشورة. يسجل الدخول لحفظ الصفحات، ويجب أن يكون المعلم معتمدًا ومؤهلاته reviewed حتى يرسل مساهمة. كل عمليات الإدارة محمية بصلاحية administrator على الخادم.

- `library.list` — بحث عام مرقم بالبلد والمنهج والصف والمادة والفصل والفئة والصيغة وكلمات العنوان؛ يعيد الموارد `approved` فقط ولا يكشف `storageKey` أو بيانات المساهم.
- `library.saved` — موارد وصفحات الحفظ للمستخدم الحالي، ويخفي الموارد التي لم تعد approved.
- `library.saveBookmark` — إنشاء/تحديث رقم صفحة بين 1 و100,000 لملف PDF approved.
- `library.removeBookmark` — حذف إشارة الحفظ للمستخدم الحالي.
- `library.canContribute` — يتطلب جلسة؛ يعيد true فقط لملف معلم approved و`credentialsVerified`.
- `library.downloadUrl` — يصدر رابطًا موقعًا قصير الأجل لملف داخلي بعد تحقق أن المورد approved، أو أن الطالب هو رافعه، أو أن المستدعي مشرف. الروابط الخارجية لا تحتاج وسيط التخزين.
- `library.submitContribution` — يتحقق من ملف المعلم ومراجعته، الحقول، الحقوق، وحجم PDF وتوقيع `%PDF-`؛ يرفع إلى التخزين ثم يحفظ سجلًا بحالة `pending`.
- `library.reviewQueue` و`library.review` — للإدارة فقط؛ استعراض pending ثم القبول أو الرفض أو الأرشفة مع ملاحظة مراجع.

التصفية لا تعتمد مطابقة نص حر للصف. يفحص الخادم اتساق `countryCode`, `curriculumCode`, و`gradeCode` وفق catalog المشترك، ويشتق `stageCode` و`cycleCode` من الصف قبل التخزين. ويطبق الحد الأعلى على نتائج البحث. يعاد فحص الصلاحية عند كل طلب تنزيل، لا عند عرض الزر فقط.

## شجرة الملفات والمكونات

```text
shared/
  library-catalog.ts                 # الرموز الثابتة والتسميات والصفوف والمراحل والفصول
server/
  library-router.ts                  # إجراءات tRPC والتحقق من الادوار والحقوق
  library-db.ts                      # list/search/bookmarks/moderation queries
  storage.ts                         # رفع PDF للمخزن الحالي (إعادة استخدام helper)
drizzle/
  schema.ts                          # library_resources + library_bookmarks
  0002_shocking_ken_ellis.sql        # ترحيل إضافي ينشئ جدولي المكتبة فقط
client/src/
  pages/LibraryPage.tsx              # المسار والفلاتر والنتائج وحالات الوصول
  components/library/
    LibraryFilters.tsx               # فلاتر البلد والصف والمادة والفصل والفئة والصيغة
    ResourceCard.tsx                 # المصدر والحقوق والحالة والعلامات
    PdfReader.tsx                     # قارئ المتصفح المضمن ورقم الصفحة والحفظ
    ContributionForm.tsx             # PDF أو رابط خارجي، والبيانات والحقوق
    AdminResourceReview.tsx          # طابور المراجعة وأفعال المدير
  styles/library.css                 # تخطيط متجاوب وRTL/LTR
client/src/App.tsx                   # lazy route /library
client/src/components/SiteShell.tsx  # رابط المكتبة في التنقل والتذييل
client/src/pages/AdminDashboard.tsx  # قسم طابور المساهمات
client/src/App.tsx                   # تسجيل المسار العام /library
```

## حدود قارئ الملفات في الإصدار الأول

يفتح PDF الذي رفعه المعلم داخل iframe من رابط تخزين موقع قصير الأجل؛ إضافة `#page=N` تنتقل للصفحة في عارض PDF المدمج بالمتصفح. رقم الصفحة لا يحفظ تلقائيًا إلا بعد اختيار «حفظ الموضع». عند تعذر عارض PDF على الهاتف، يستخدم الطالب زر «فتح الملف» في المتصفح. الكتب الرسمية والمراجع المرتبطة خارجيًا تفتح على موقع الناشر/الوزارة، لأن الموقع الخارجي قد يمنع تضمين PDF داخل iframe. صيغ الفيديو والاختبار التفاعلي تُفهرس كرابط خارجي في الإصدار الأول، ولا يدّعي النظام امتلاك مشغل فيديو أو محرك اختبارات خاص قبل تنفيذه.

## المصادر الرسمية

[1]: https://ellibrary.moe.gov.eg/Books/ "بوابة المكتبة الإلكترونية لوزارة التربية والتعليم المصرية"
[2]: https://ellibrary.moe.gov.eg/books/Books-Primary/ "صفحة كتب المرحلة الابتدائية المصرية"
[3]: https://www.adek.gov.ae/-/media/Project/TAMM/ADEK/Policies/School-Policies/Teaching-and-Learning/ADEK_S_Curriculum-Policy_EN_v1_2.pdf "سياسة ADEK للمناهج إصدار 1.2"
[4]: https://u.ae/en/information-and-services/education/online-training/diwan-ebook-reader "قارئ Diwan التعليمي على بوابة حكومة الإمارات"
[5]: https://ellibrary.moe.gov.eg/books/Books-sec/ "صفحة كتب المرحلة الثانوية المصرية"
[6]: https://www.moe.gov.sa/ar/education/general-education "وزارة التعليم السعودية — التعليم العام"
[7]: https://www.moe.gov.sa/ar/education/general-education/studyplans "وزارة التعليم السعودية — الخطط الدراسية المطورة"
[8]: https://www.moe.gov.sa/ar/education/general-education/secondaryschooltracks "وزارة التعليم السعودية — مسارات المرحلة الثانوية"
[9]: https://www.ientv.edu.sa/ar/doros "عين دروس — دليل الدروس والمراحل والصفوف"
