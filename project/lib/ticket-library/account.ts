import type { Scenario } from './types';

// Account, access, security & fraud
export const ACCOUNT: Scenario[] = [
  // ---------------- Update details ----------------
  {
    id: 'acc-phone',
    topic: 'acc-details',
    title: 'Change the phone number',
    when: 'The customer wants to update the phone number on the account.',
    keys: 'change phone number new number update mobile تغيير رقم الهاتف الجوال الموبايل اغير رقمي',
    tip: 'If the customer cannot log in: they email help@tabby.ai from the registered email with the old and new number (new number must not be registered on Tabby).',
    en: {
      ack: 'Sure, I’ll help you update your phone number.',
      body: [
        'If you can still log in: open Profile → Personal Information → tap the arrow next to your phone number → enter the new number, then confirm with the code sent to it. The new number must not already be registered on Tabby.',
        'If you can’t log in, please email help@tabby.ai from the email address registered on your account, including your old number and your new number, and our team will help you from there.',
      ],
    },
    ar: {
      ack: 'بالتأكيد، سأساعدك في تحديث رقم الهاتف.',
      body: [
        'إذا كنت تستطيع تسجيل الدخول: افتح الملف الشخصي ← المعلومات الشخصية ← اضغط على السهم بجانب رقم الهاتف ← أدخل الرقم الجديد، ثم أكّد بالرمز المرسل إليه، مع العلم بأن الرقم الجديد يجب ألا يكون مسجلًا في تابي من قبل.',
        'وإذا لم تتمكن من تسجيل الدخول، يُرجى مراسلة help@tabby.ai من البريد الإلكتروني المسجل في حسابك، مع ذكر الرقم القديم والرقم الجديد، وسيساعدك فريقنا من هناك.',
      ],
    },
    subject: { en: 'Updating your phone number', ar: 'تحديث رقم الهاتف' },
  },
  {
    id: 'acc-phone-updated',
    topic: 'acc-details',
    title: 'Phone number / details updated successfully',
    when: 'You updated the customer’s phone number or details.',
    keys: 'phone updated details updated success log in again تم تحديث الرقم',
    en: {
      ack: 'Good news! Your details have been updated successfully.',
      body: ['You can now log out of the Tabby app and log back in using your updated phone number.'],
    },
    ar: {
      ack: 'خبر سار! تم تحديث بياناتك بنجاح.',
      body: ['ويمكنك الآن تسجيل الخروج من تطبيق تابي ثم تسجيل الدخول مرة أخرى برقم الهاتف المحدث.'],
    },
    subject: { en: 'Your details have been updated', ar: 'تم تحديث بياناتك' },
  },
  {
    id: 'acc-email',
    topic: 'acc-details',
    title: 'Change the email address',
    when: 'The customer wants to update the email on the account.',
    keys: 'change email update email address تغيير البريد الإلكتروني الايميل',
    en: {
      ack: 'Sure, you can update your email directly from the app.',
      body: ['Open Profile → Personal Information → tap the arrow next to your email → enter the new email, then confirm it with the code sent to your new inbox.'],
    },
    ar: {
      ack: 'بالتأكيد، يمكنك تحديث بريدك الإلكتروني مباشرة من التطبيق.',
      body: ['افتح الملف الشخصي ← المعلومات الشخصية ← اضغط على السهم بجانب البريد الإلكتروني ← أدخل البريد الجديد، ثم أكّده بالرمز المرسل إلى بريدك الجديد.'],
    },
    subject: { en: 'Updating your email address', ar: 'تحديث البريد الإلكتروني' },
  },
  {
    id: 'acc-id',
    topic: 'acc-details',
    title: 'Add or update the ID',
    when: 'The customer needs to add a new or renewed Emirates ID / Civil ID.',
    keys: 'add id update id renewed emirates id civil id kyc إضافة الهوية تحديث الهوية',
    en: {
      ack: 'I’ll be happy to guide you through updating your ID.',
      body: ['Open Profile → Personal Information → tap the arrow next to your ID, then follow the verification steps on screen, including scanning your ID.'],
      next: 'If any error appears, please send us a screenshot and we’ll help right away.',
    },
    ar: {
      ack: 'يسعدني إرشادك إلى خطوات تحديث الهوية.',
      body: ['افتح الملف الشخصي ← المعلومات الشخصية ← اضغط على السهم بجانب الهوية، ثم اتبع خطوات التحقق الظاهرة، ومنها تصوير الهوية.'],
      next: 'وإذا ظهرت لك أي رسالة خطأ، يُرجى إرسال لقطة شاشة وسنساعدك مباشرة.',
    },
    subject: { en: 'Updating your ID', ar: 'تحديث الهوية' },
  },
  {
    id: 'acc-name',
    topic: 'acc-details',
    title: 'Name on the account is wrong',
    when: 'The name shown on the account is incorrect.',
    keys: 'wrong name incorrect name spelling الاسم خطأ',
    en: {
      ack: 'I understand you’d like your name to show correctly.',
      body: ['The name on your account is taken from your ID. Please update or re-add your ID from Profile → Personal Information, so the name is read again from it.'],
      next: 'If the name still looks wrong after that, please let us know and we’ll review it.',
    },
    ar: {
      ack: 'أتفهم رغبتك في ظهور اسمك بشكل صحيح.',
      body: ['يُؤخذ الاسم في حسابك من الهوية، لذلك يُرجى تحديث الهوية أو إعادة إضافتها من الملف الشخصي ← المعلومات الشخصية حتى تتم قراءة الاسم منها مجددًا.'],
      next: 'وإذا بقي الاسم غير صحيح بعد ذلك، أخبرنا وسنقوم بمراجعته.',
    },
    subject: { en: 'About the name on your account', ar: 'بخصوص الاسم في حسابك' },
  },

  // ---------------- Login & access ----------------
  {
    id: 'acc-email-not-linked',
    topic: 'acc-details',
    title: 'Contacted from an email that isn’t on the account',
    when: 'The email (or chat) comes from an address not linked to any Tabby account, so you can’t verify the customer.',
    keys: 'email not linked not registered different email cannot find account verify البريد غير مرتبط بالحساب',
    tip: 'Never share or change account details for an unverified sender.',
    en: {
      ack: 'We understand your concern, and we’re here to help.',
      body: [
        'The first step is to reach your Tabby account, but the email address you’re using isn’t currently linked to an account in our system.',
        'To help you securely, please contact us in one of these ways:\n• Reply from the email address registered on your Tabby account\n• Use Contact Us inside the Tabby app\n• Call us on 800 82229 (UAE)',
      ],
    },
    ar: {
      ack: 'نتفهم استفسارك، ونحن هنا لمساعدتك.',
      body: [
        'الخطوة الأولى هي الوصول إلى حسابك في تابي، لكن البريد الإلكتروني الذي تستخدمه غير مرتبط حاليًا بأي حساب في نظامنا.',
        'ولمساعدتك بشكل آمن، يُرجى التواصل معنا بإحدى الطرق التالية:\n• الرد من البريد الإلكتروني المسجل في حسابك في تابي\n• استخدام خيار "تواصل معنا" داخل تطبيق تابي\n• الاتصال بنا على الرقم 800 82229 (الإمارات)',
      ],
    },
    subject: { en: 'Helping you securely with your request', ar: 'مساعدتك بشكل آمن في طلبك' },
  },
  {
    id: 'acc-otp-email',
    topic: 'acc-access',
    title: 'Wants the login code by email',
    when: 'The customer cannot receive the SMS code and asks for it by email.',
    keys: 'otp email code sms not received login رمز التحقق بالبريد',
    en: {
      ack: 'I understand how frustrating it is when you can’t get the code.',
      body: ['For security, the login code is sent only to the mobile number registered on your account, and it can’t be sent by email. Please make sure you have access to that number and good signal.'],
      next: 'If you no longer have that number, we can help you update it.',
    },
    ar: {
      ack: 'أتفهم مدى الإزعاج عندما لا يصلك الرمز.',
      body: ['حرصًا على الأمان، يُرسل رمز الدخول فقط إلى رقم الهاتف المسجل في حسابك، ولا يمكن إرساله عبر البريد الإلكتروني، لذلك يُرجى التأكد من إمكانية الوصول إلى هذا الرقم ومن جودة الشبكة.'],
      next: 'وإذا لم يعد الرقم متاحًا لديك، يمكننا مساعدتك في تحديثه.',
    },
    subject: { en: 'About your login code', ar: 'بخصوص رمز الدخول' },
    related: ['acc-phone'],
  },
  {
    id: 'acc-abroad',
    topic: 'acc-access',
    title: 'Cannot log in while abroad',
    when: 'The customer is travelling and cannot access the account.',
    keys: 'abroad travelling outside country cannot login خارج الدولة',
    en: {
      ack: 'I understand you need access to your account while you’re travelling.',
      body: ['Access to your Tabby account can be limited outside your country, depending on regional requirements. Please log in with your registered mobile number, and if a specific error appears, send us a screenshot so we can guide you.'],
    },
    ar: {
      ack: 'أتفهم حاجتك للوصول إلى حسابك أثناء السفر.',
      body: ['قد يكون الوصول إلى حساب تابي محدودًا خارج دولتك حسب المتطلبات الإقليمية، لذلك يُرجى تسجيل الدخول برقم الهاتف المسجل، وإذا ظهرت لك رسالة خطأ محددة أرسل لنا لقطة شاشة لها حتى نرشدك.'],
    },
    subject: { en: 'About accessing your account', ar: 'بخصوص الوصول إلى حسابك' },
  },
  {
    id: 'acc-pin',
    topic: 'acc-access',
    title: 'Forgot the PIN',
    when: 'The customer forgot the app PIN.',
    keys: 'forgot pin passcode reset نسيت الرمز السري',
    en: {
      ack: 'No worries, you can reset it in a minute.',
      body: ['On the PIN screen, tap “Forgot?”. You’ll be logged out, then enter your registered phone number, confirm the code you receive, and set a new PIN.'],
    },
    ar: {
      ack: 'لا تقلق، يمكنك إعادة تعيينه خلال دقيقة.',
      body: ['من شاشة إدخال الرمز، اضغط على "Forgot?"، وسيتم تسجيل خروجك، ثم أدخل رقم هاتفك المسجل، وأكّد الرمز الذي يصلك، ثم عيّن رمزًا جديدًا.'],
    },
    subject: { en: 'Resetting your PIN', ar: 'إعادة تعيين الرمز السري' },
  },
  {
    id: 'acc-recovery',
    topic: 'acc-access',
    title: 'ID linked to an older account – recover access',
    when: 'The customer’s ID is already linked to an older Tabby account they own.',
    keys: 'old account id linked previous account recovery حساب قديم استرجاع',
    en: {
      ack: 'I can see your ID is linked to an older Tabby account, and I’ll help you get back to it.',
      body: ['Open the Tabby app, start logging in, and follow the Account Recovery steps to verify your identity. This will give you access to the correct account.'],
    },
    ar: {
      ack: 'لاحظت أن هويتك مرتبطة بحساب قديم في تابي، وسأساعدك في الوصول إليه.',
      body: ['افتح تطبيق تابي وابدأ تسجيل الدخول، ثم اتبع خطوات استرجاع الحساب للتحقق من هويتك، وبذلك ستصل إلى الحساب الصحيح.'],
    },
    subject: { en: 'Recovering your Tabby account', ar: 'استرجاع حسابك في تابي' },
  },
  {
    id: 'acc-app-issue',
    topic: 'acc-access',
    title: 'App not working / error message',
    when: 'The customer reports an error or the app is not loading.',
    keys: 'app not working error crash bug loading التطبيق لا يعمل خطأ',
    en: {
      ack: 'I’m sorry for the trouble with the app, and I’ll help you get it working.',
      body: ['Please make sure the Tabby app is updated to the latest version, then close it fully and open it again. If the issue continues, please send us a screenshot of the message you see.'],
    },
    ar: {
      ack: 'أعتذر عن المشكلة التي تواجهها في التطبيق، وسأساعدك في حلها.',
      body: ['يُرجى التأكد من تحديث تطبيق تابي إلى أحدث إصدار، ثم إغلاقه بالكامل وفتحه مرة أخرى، وإذا استمرت المشكلة يُرجى إرسال لقطة شاشة للرسالة التي تظهر لك.'],
    },
    subject: { en: 'About the issue with the app', ar: 'بخصوص مشكلة التطبيق' },
  },

  // ---------------- Close account ----------------
  {
    id: 'acc-delete',
    topic: 'acc-close',
    title: 'Close / delete the Tabby account',
    when: 'The customer wants to close their account.',
    keys: 'delete account close account remove account حذف الحساب إغلاق الحساب امسح حسابي',
    tip: 'Outstanding orders must be settled first. The in-app Delete account option is on iPhone (iOS) only; for Android, help the customer submit the request.',
    en: {
      ack: 'I’m sorry to see you go, and I’ll guide you through it.',
      body: [
        'On iPhone, you can close your account from the app: Profile → Personal Information → Delete account → Continue → choose a reason → Delete account. If you’re using Android, just let us know and we’ll help you submit the request.',
        'Please make sure all outstanding payments are settled first. You can restore the account within 180 days of closing it; after that, the account data may be permanently deleted.',
      ],
    },
    ar: {
      ack: 'يؤسفنا رحيلك، وسأرشدك إلى الخطوات.',
      body: [
        'على الآيفون، يمكنك إغلاق حسابك من التطبيق: الملف الشخصي ← المعلومات الشخصية ← حذف الحساب ← متابعة ← اختيار السبب ← حذف الحساب. وإذا كنت تستخدم أندرويد، أخبرنا وسنساعدك في تقديم الطلب.',
        'ويُرجى التأكد من سداد جميع المبالغ المستحقة أولًا، ويمكنك استعادة الحساب خلال 180 يومًا من إغلاقه، وبعد ذلك قد يتم حذف بيانات الحساب نهائيًا.',
      ],
    },
    subject: { en: 'Closing your Tabby account', ar: 'إغلاق حسابك في تابي' },
  },
  {
    id: 'acc-delete-raised',
    topic: 'acc-close',
    title: 'Account closure request submitted',
    when: 'You submitted the closure request for the customer.',
    keys: 'closure submitted account deleted 24 hours تم رفع طلب الإغلاق',
    en: {
      ack: 'Your account closure request has been submitted.',
      body: ['The account will be closed within 24 hours. If you change your mind, you can restore it within 180 days of the closure date.'],
      close: 'It was a pleasure assisting you, and you’re always welcome back at Tabby.',
    },
    ar: {
      ack: 'تم رفع طلب إغلاق حسابك.',
      body: ['وسيتم إغلاق الحساب خلال 24 ساعة، وإذا غيرت رأيك يمكنك استعادته خلال 180 يومًا من تاريخ الإغلاق.'],
      close: 'سعدنا بخدمتك، ومرحبًا بك دائمًا في تابي.',
    },
    subject: { en: 'Your account closure request', ar: 'طلب إغلاق حسابك' },
  },

  // ---------------- Details linked to another account ----------------
  {
    id: 'acc-linked-verify',
    topic: 'acc-linked',
    title: 'ID / phone / email linked to someone else’s account',
    when: 'Step 1: the customer cannot use their details because they are on another account they do not own.',
    keys: 'id used phone used email used linked another account someone else مسجل على حساب آخر',
    tip: 'First confirm the customer does not recognise / cannot access the other account. Verify before escalating.',
    en: {
      ack: 'I understand how frustrating it is when your details are linked to an account that isn’t yours, and I’ll help you sort it out.',
      body: [
        'To review this safely, please send us a clear photo of the front and back of your ID (photos, not a scan), plus a clear selfie of you holding the ID next to your face.',
        'Please contact us from the phone number or email you want to use for your own account.',
      ],
      next: 'Once we receive the documents, we’ll review the case and update you.',
    },
    ar: {
      ack: 'أتفهم مدى الإزعاج عندما تكون بياناتك مرتبطة بحساب لا يخصك، وسأساعدك في حل الأمر.',
      body: [
        'ولمراجعة الأمر بشكل آمن، يُرجى إرسال صورة واضحة للهوية من الأمام والخلف (صور وليست نسخة ممسوحة)، مع صورة شخصية واضحة وأنت تحمل الهوية بجانب وجهك.',
        'ويُرجى التواصل معنا من رقم الهاتف أو البريد الإلكتروني الذي ترغب في استخدامه لحسابك الخاص.',
      ],
      next: 'وفور استلام المستندات، سنراجع الحالة ونوافيك بالمستجدات.',
    },
    subject: { en: 'About your details on another account', ar: 'بخصوص بياناتك المرتبطة بحساب آخر' },
  },
  {
    id: 'acc-id-removed',
    topic: 'acc-linked',
    title: 'Resolved – ID removed from the old account',
    when: 'Step 2: the ID was removed from the other account.',
    keys: 'id removed old account add id new account تمت إزالة الهوية',
    en: {
      ack: 'Good news! Your issue has been resolved, and your ID has been removed from the old account.',
      body: ['You can now add it to your account: Profile → Personal Information → ID, then complete the verification steps.'],
    },
    ar: {
      ack: 'خبر سار! تم حل المشكلة، وتمت إزالة هويتك من الحساب القديم.',
      body: ['ويمكنك الآن إضافتها إلى حسابك: الملف الشخصي ← المعلومات الشخصية ← الهوية، ثم إكمال خطوات التحقق.'],
    },
    subject: { en: 'Your ID is ready to use', ar: 'هويتك جاهزة للاستخدام' },
  },
  {
    id: 'acc-phone-freed',
    topic: 'acc-linked',
    title: 'Resolved – phone / email removed from the other account',
    when: 'Step 2: the phone number and email were removed from the former owner’s account.',
    keys: 'phone removed email removed former owner create new account تمت إزالة الرقم',
    en: {
      ack: 'Good news! Your phone number and email have been removed from the other account, which belonged to the previous owner of the number.',
      body: ['Please log out, then use your phone number and email to create your own Tabby account, and link your own ID to it for a smooth experience.'],
    },
    ar: {
      ack: 'خبر سار! تمت إزالة رقم هاتفك وبريدك الإلكتروني من الحساب الآخر الذي كان يخص المالك السابق للرقم.',
      body: ['يُرجى تسجيل الخروج، ثم استخدام رقم هاتفك وبريدك الإلكتروني لإنشاء حسابك الخاص في تابي، وربط هويتك به لتجربة سلسة.'],
    },
    subject: { en: 'Your details are ready to use', ar: 'بياناتك جاهزة للاستخدام' },
  },
  {
    id: 'acc-email-freed',
    topic: 'acc-linked',
    title: 'Resolved – email removed from another account',
    when: 'Step 2: the customer’s email was removed from someone else’s account.',
    keys: 'email removed used email automated email تمت إزالة البريد',
    en: {
      ack: 'Good news! Your email address has been removed from the other Tabby account, and you can now use it with your own account.',
      body: [
        'You may still receive one final automated email under the other person’s name. It’s sent automatically and doesn’t mean your email is still linked.',
        'To add the email to your account, open Profile → Personal Information → Email and update it.',
      ],
    },
    ar: {
      ack: 'خبر سار! تمت إزالة بريدك الإلكتروني من حساب تابي الآخر، ويمكنك الآن استخدامه في حسابك الخاص.',
      body: [
        'وقد تصلك رسالة تلقائية أخيرة باسم الشخص الآخر، وهي مرسلة تلقائيًا ولا تعني أن بريدك لا يزال مرتبطًا.',
        'ولإضافة البريد إلى حسابك، افتح الملف الشخصي ← المعلومات الشخصية ← البريد الإلكتروني وقم بتحديثه.',
      ],
    },
    subject: { en: 'Your email is ready to use', ar: 'بريدك الإلكتروني جاهز للاستخدام' },
  },

  // ---------------- Fraud & scams ----------------
  {
    id: 'fraud-not-mine',
    topic: 'acc-fraud',
    title: 'Customer doesn’t recognise an order (unauthorized BNPL)',
    when: 'Step 1: the customer says they never placed a Pay Later order.',
    keys: 'not my order unauthorized fraud did not buy someone used my account طلب ليس لي احتيال',
    tip: 'Follow the fraud flow: secure the account, verify, escalate. Investigation is about 2 working days. Never promise a refund.',
    en: {
      ack: 'I understand how worrying it is to see an order you don’t recognise, and I’m taking steps to protect your account right away.',
      body: [
        'I’ve placed a security restriction on your account to prevent any further activity while the case is reviewed.',
        'To proceed with the investigation, please share a clear photo of the front and back of your ID, plus a clear selfie of you holding the ID next to your face.',
      ],
      next: 'Once we receive them, the case will go to our security team, and we’ll keep you updated on the outcome.',
    },
    ar: {
      ack: 'أتفهم مدى القلق عند رؤية طلب لا تعرفه، وأقوم الآن باتخاذ الخطوات اللازمة لحماية حسابك.',
      body: [
        'قمت بوضع قيد أمني على حسابك لمنع أي نشاط آخر أثناء مراجعة الحالة.',
        'ولاستكمال التحقيق، يُرجى مشاركة صورة واضحة للهوية من الأمام والخلف، مع صورة شخصية واضحة وأنت تحمل الهوية بجانب وجهك.',
      ],
      next: 'وفور استلامها، ستُحال الحالة إلى فريق الأمان، وسنوافيك بالنتيجة.',
    },
    subject: { en: 'About the order you don’t recognise', ar: 'بخصوص الطلب الذي لا تعرفه' },
  },
  {
    id: 'fraud-resolved',
    topic: 'acc-fraud',
    title: 'Outcome – investigation confirmed the customer didn’t place the orders',
    when: 'Step 2a: the investigation found the customer did not place the orders.',
    keys: 'investigation completed not placed removed id from account تم التحقق لم يقم بالطلب',
    en: {
      ack: 'Thank you for your patience. We’ve completed our investigation and confirmed that you didn’t place the orders on that account.',
      body: ['We’ve removed your ID, phone number and email from it, so your details are free to use again. Please log out and log back in with your details to create your own Tabby account.'],
    },
    ar: {
      ack: 'شكرًا لصبرك. أنهينا التحقيق، وتأكدنا من أنك لم تقم بإجراء الطلبات على ذلك الحساب.',
      body: ['وقمنا بإزالة هويتك ورقم هاتفك وبريدك الإلكتروني منه، فأصبحت بياناتك متاحة للاستخدام مرة أخرى. يُرجى تسجيل الخروج ثم الدخول ببياناتك لإنشاء حسابك الخاص في تابي.'],
    },
    subject: { en: 'Outcome of our investigation', ar: 'نتيجة التحقيق' },
  },
  {
    id: 'fraud-otp',
    topic: 'acc-fraud',
    title: 'Outcome – the OTP was compromised',
    when: 'Step 2b: the investigation found the orders were placed with a valid OTP sent to the customer.',
    keys: 'otp compromised shared code suspicious link outcome اختراق رمز التحقق',
    tip: 'Firm but kind. The account holder is responsible per the terms; advise cancelling with the merchant.',
    en: {
      ack: 'Thank you for your patience while we reviewed your case. I understand how distressing this situation is.',
      body: [
        'Our investigation found that the orders were placed through your Tabby account using a one-time password (OTP) that was sent to your registered number. This can happen after clicking a suspicious link, sharing the code, or someone gaining access to your phone.',
        'To protect you, we’ve placed a temporary block on your account to prevent any further activity.',
        'Under Tabby’s terms, the account holder is responsible for activity made with their OTP, so Tabby can’t cancel or amend these orders. If you’d like to cancel them, please contact the merchant directly. If they accept the cancellation, the remaining payments will stop.',
      ],
      next: 'For your safety, please never share your OTP or personal details, and avoid unknown links, even if they show Tabby’s name or logo.',
    },
    ar: {
      ack: 'شكرًا لصبرك أثناء مراجعة حالتك، وأتفهم مدى صعوبة هذا الموقف.',
      body: [
        'أظهر التحقيق أن الطلبات تمت من خلال حسابك في تابي باستخدام رمز تحقق (OTP) أُرسل إلى رقمك المسجل، وقد يحدث ذلك بعد الضغط على رابط مشبوه، أو مشاركة الرمز، أو وصول شخص ما إلى هاتفك.',
        'وحرصًا على حمايتك، قمنا بإيقاف حسابك مؤقتًا لمنع أي نشاط آخر.',
        'ووفقًا لشروط تابي، يتحمل صاحب الحساب مسؤولية العمليات التي تتم برمز التحقق الخاص به، لذلك لا تستطيع تابي إلغاء هذه الطلبات أو تعديلها. وإذا رغبت في إلغائها، يُرجى التواصل مع التاجر مباشرة، وفي حال موافقته على الإلغاء ستتوقف الدفعات المتبقية.',
      ],
      next: 'وحفاظًا على أمانك، يُرجى عدم مشاركة رمز التحقق أو بياناتك الشخصية أبدًا، وتجنب الروابط غير المعروفة حتى لو ظهر عليها اسم تابي أو شعارها.',
    },
    subject: { en: 'Outcome of our review', ar: 'نتيجة المراجعة' },
  },
  {
    id: 'fraud-scam',
    topic: 'acc-fraud',
    title: 'Outcome – customer shared details with a scammer (fake Tabby / loan / job)',
    when: 'Step 2c: the customer confirmed sharing details or an OTP with someone posing as Tabby, a loan or a job offer.',
    keys: 'scam fake tabby employee micro loan job offer shared otp محتال قرض وظيفة',
    en: {
      ack: 'Thank you for speaking with us and explaining what happened. I truly understand how difficult this situation is.',
      body: [
        'As you confirmed, your details were shared with someone who falsely claimed to be from Tabby or to offer a service through Tabby, and this allowed them to access your account and place an order.',
        'We’ve placed a temporary block on your account to prevent any further activity. Under Tabby’s terms, users are responsible for keeping their login details and OTPs safe, so Tabby can’t cancel or amend the order, as the merchant has already been paid.',
        'If you’d like to cancel the order, please contact the merchant directly. If they accept the cancellation under their policy, the future payments on your account will stop.',
      ],
      next: 'Please remember that Tabby will never ask for your OTP, and Tabby doesn’t offer loans or jobs through messages or social media.',
    },
    ar: {
      ack: 'شكرًا لتحدثك معنا وتوضيح ما حدث، وأتفهم تمامًا صعوبة هذا الموقف.',
      body: [
        'وكما أكدت، تمت مشاركة بياناتك مع شخص ادعى زورًا أنه من تابي أو أنه يقدم خدمة من خلال تابي، مما مكّنه من الوصول إلى حسابك وإجراء طلب.',
        'وقمنا بإيقاف حسابك مؤقتًا لمنع أي نشاط آخر. ووفقًا لشروط تابي، يتحمل المستخدم مسؤولية الحفاظ على بيانات الدخول ورموز التحقق، لذلك لا تستطيع تابي إلغاء الطلب أو تعديله، لأن التاجر قد استلم قيمته بالفعل.',
        'وإذا رغبت في إلغاء الطلب، يُرجى التواصل مع التاجر مباشرة، وفي حال موافقته على الإلغاء وفق سياسته ستتوقف الدفعات القادمة على حسابك.',
      ],
      next: 'ونذكّرك بأن تابي لن تطلب منك رمز التحقق أبدًا، ولا تقدم قروضًا أو وظائف عبر الرسائل أو وسائل التواصل الاجتماعي.',
    },
    subject: { en: 'Following our conversation', ar: 'متابعةً لمحادثتنا' },
  },
  {
    id: 'fraud-handled-before',
    topic: 'acc-fraud',
    title: 'Same fraud case contacted again – already investigated',
    when: 'The customer follows up on a fraud case that was already concluded.',
    keys: 'already investigated same complaint fraud again previous outcome تم التحقيق مسبقا',
    en: {
      ack: 'Thank you for contacting us again, and I understand this situation is still on your mind.',
      body: ['This concern has already been investigated by our team, and the outcome we shared previously remains in place. As the order was processed by the merchant, the quickest way to request a cancellation is to contact the merchant directly.'],
      next: 'If you have any new information that wasn’t shared before, please send it and we’ll review it.',
    },
    ar: {
      ack: 'شكرًا لتواصلك معنا مرة أخرى، وأتفهم أن هذا الموقف لا يزال يشغلك.',
      body: ['سبق أن حقق فريقنا في هذا الأمر، وتبقى النتيجة التي شاركناها معك سابقًا كما هي، وبما أن الطلب تمت معالجته من خلال التاجر، فإن أسرع طريقة لطلب الإلغاء هي التواصل مع التاجر مباشرة.'],
      next: 'وإذا كانت لديك أي معلومات جديدة لم تتم مشاركتها من قبل، يُرجى إرسالها وسنقوم بمراجعتها.',
    },
    subject: { en: 'About your previous case', ar: 'بخصوص حالتك السابقة' },
  },
  {
    id: 'fraud-tips',
    topic: 'acc-fraud',
    title: 'Security tips',
    when: 'Share after any security or fraud conversation.',
    keys: 'security tips protect account otp safety نصائح الأمان',
    en: {
      ack: 'Your security matters to us, so here are a few quick tips to keep your account safe:',
      body: ['• Never share your OTP or PIN with anyone, including people who say they’re from Tabby.\n• Avoid unknown links, even if they show Tabby’s name or logo.\n• Log in only through the official Tabby app or website.'],
    },
    ar: {
      ack: 'أمانك يهمنا، وهذه بعض النصائح السريعة للحفاظ على حسابك:',
      body: ['• عدم مشاركة رمز التحقق أو الرمز السري مع أي شخص، حتى لو ادعى أنه من تابي.\n• تجنب الروابط غير المعروفة حتى لو ظهر عليها اسم تابي أو شعارها.\n• تسجيل الدخول فقط من خلال تطبيق تابي الرسمي أو موقعه الإلكتروني.'],
    },
    subject: { en: 'Keeping your account safe', ar: 'الحفاظ على أمان حسابك' },
  },

  // ---------------- Other ----------------
  {
    id: 'acc-loans',
    topic: 'acc-other',
    title: 'Loans / cash advance not available',
    when: 'The customer asks for a loan or cash advance.',
    keys: 'loan cash advance borrow money tabby advance قرض سلفة',
    en: {
      ack: 'Thank you for asking.',
      body: ['Loans and cash advances aren’t available through Tabby at the moment. If this changes, you’ll be notified in the Tabby app.'],
      next: 'Please be careful with anyone offering a “Tabby loan” through messages or social media, as these offers aren’t from Tabby.',
    },
    ar: {
      ack: 'شكرًا لسؤالك.',
      body: ['خدمة القروض أو السلف النقدية غير متاحة عبر تابي حاليًا، وفي حال حدوث أي تغيير ستصلك إشعارات من خلال تطبيق تابي.'],
      next: 'ويُرجى الحذر من أي شخص يعرض "قرضًا من تابي" عبر الرسائل أو وسائل التواصل الاجتماعي، فهذه العروض ليست من تابي.',
    },
    subject: { en: 'About loans with Tabby', ar: 'بخصوص القروض في تابي' },
  },
  {
    id: 'acc-refer',
    topic: 'acc-other',
    title: 'Invite a friend',
    when: 'The customer asks how to refer a friend.',
    keys: 'refer invite friend link دعوة صديق',
    en: {
      ack: 'Happy to help!',
      body: ['Open Profile → Invite friends, then tap Copy to send your link, or Share to choose who to send it to.'],
    },
    ar: {
      ack: 'يسعدني مساعدتك!',
      body: ['افتح الملف الشخصي ← دعوة الأصدقاء، ثم اضغط على "نسخ" لإرسال الرابط، أو "مشاركة" لاختيار الشخص الذي تريد إرساله إليه.'],
    },
    subject: { en: 'Inviting your friends to Tabby', ar: 'دعوة أصدقائك إلى تابي' },
  },
];
