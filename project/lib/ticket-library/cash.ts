import type { Scenario } from './types';

// Tabby Cash (debit account) and transfers
export const CASH: Scenario[] = [
  // ---------------- About Tabby Cash ----------------
  {
    id: 'cash-what',
    topic: 'cash-about',
    title: 'What is Tabby Cash?',
    when: 'The customer asks what Tabby Cash is or what it includes.',
    keys: 'tabby cash what is iban debit account cash card تابي كاش ما هو',
    tip: 'Figures from the team sheets (cashback up to 3% on 3 categories, up to 200 AED / month). Check the current offer if unsure.',
    en: {
      ack: 'I’d be happy to tell you about Tabby Cash.',
      body: [
        'Tabby Cash is a debit account built into your Tabby app, so you manage and spend your own money, rather than a Pay Later service.',
        'Depending on your eligibility, it can include a personal IBAN through our partner bank Emirates NBD, a prepaid Cash Card for everyday purchases, transfers to other Tabby Cash users and to local bank accounts, your full transaction history, and cashback of up to 3% on 3 categories you choose (up to 200 AED per month), with no subscription fees.',
      ],
    },
    ar: {
      ack: 'يسعدني تعريفك بخدمة تابي كاش.',
      body: [
        'تابي كاش حساب خصم مباشر مدمج في تطبيق تابي، تدير وتنفق من خلاله أموالك الخاصة، وهو ليس خدمة للدفع لاحقًا.',
        'وبحسب أهليتك، قد يشمل رقم IBAN شخصيًا من خلال البنك الشريك Emirates NBD، وبطاقة كاش مسبقة الدفع للمشتريات اليومية، والتحويل إلى مستخدمي تابي كاش الآخرين وإلى الحسابات البنكية المحلية، وسجل معاملات كامل، وكاش باك يصل إلى 3% على 3 فئات تختارها (بحد أقصى 200 درهم شهريًا)، دون رسوم اشتراك.',
      ],
    },
    subject: { en: 'About Tabby Cash', ar: 'بخصوص تابي كاش' },
  },
  {
    id: 'cash-eligibility',
    topic: 'cash-about',
    title: 'Who can get Tabby Cash / how to set it up',
    when: 'The customer cannot find Tabby Cash or asks how to get it.',
    keys: 'eligible eligibility set up not showing how to get tabby cash الأهلية تفعيل تابي كاش',
    en: {
      ack: 'I understand you’d like to start using Tabby Cash.',
      body: ['Tabby Cash is currently available to eligible UAE residents aged 18 or above with a valid Emirates ID, and access is being rolled out to selected customers. If you’re eligible, the option to set it up will appear directly in your Tabby app, and you can follow the steps shown there.'],
    },
    ar: {
      ack: 'أتفهم رغبتك في البدء باستخدام تابي كاش.',
      body: ['تابي كاش متاح حاليًا للمقيمين المؤهلين في الإمارات ممن تبلغ أعمارهم 18 عامًا أو أكثر ولديهم هوية إماراتية سارية، ويتم إتاحته تدريجيًا لعملاء محددين. وإذا كنت مؤهلًا، سيظهر لك خيار الإعداد مباشرة في تطبيق تابي، ويمكنك اتباع الخطوات الظاهرة.'],
    },
    subject: { en: 'About getting Tabby Cash', ar: 'بخصوص الحصول على تابي كاش' },
  },
  {
    id: 'cash-limits',
    topic: 'cash-about',
    title: 'Tabby Cash balance and spending limits',
    when: 'The customer asks about the maximum balance or spending limits.',
    keys: 'limit balance daily monthly spending maximum حدود الإنفاق الرصيد الأقصى',
    en: {
      ack: 'Sure, here are your Tabby Cash limits.',
      body: ['The maximum account balance is 25,000 AED, the daily spending limit is up to 10,000 AED, and the monthly spending limit is up to 25,000 AED. Transfers count toward the daily and monthly limits, and you can check your remaining limits in the app.'],
    },
    ar: {
      ack: 'بالتأكيد، هذه حدود تابي كاش.',
      body: ['الحد الأقصى لرصيد الحساب 25,000 درهم، وحد الإنفاق اليومي يصل إلى 10,000 درهم، وحد الإنفاق الشهري يصل إلى 25,000 درهم، وتُحتسب التحويلات ضمن الحدين اليومي والشهري، ويمكنك مراجعة الحدود المتبقية في التطبيق.'],
    },
    subject: { en: 'Your Tabby Cash limits', ar: 'حدود تابي كاش' },
  },
  {
    id: 'cash-used-for-payment',
    topic: 'cash-about',
    title: 'Tabby Cash balance used for a due payment',
    when: 'The customer asks why money was taken from their Tabby Cash balance.',
    keys: 'cash balance used deducted payment due last resort تم الخصم من رصيد تابي كاش',
    en: {
      ack: 'I understand your concern about the deduction from your Tabby Cash balance.',
      body: ['When a payment is due and the other payment methods on your account aren’t successful, Tabby may use your available Tabby Cash balance toward it as a last resort, as stated in the terms. You can see the payment it was used for in your transaction history.'],
    },
    ar: {
      ack: 'أتفهم استفسارك بخصوص الخصم من رصيد تابي كاش.',
      body: ['عندما تكون هناك دفعة مستحقة ولا تنجح طرق الدفع الأخرى على حسابك، قد تستخدم تابي الرصيد المتاح في تابي كاش لسدادها كحل أخير، وفقًا للشروط والأحكام، ويمكنك رؤية الدفعة التي استُخدم فيها في سجل المعاملات.'],
    },
    subject: { en: 'About your Tabby Cash balance', ar: 'بخصوص رصيد تابي كاش' },
  },

  // ---------------- Top-ups ----------------
  {
    id: 'cash-topup-methods',
    topic: 'cash-topup',
    title: 'How to top up Tabby Cash',
    when: 'The customer asks how to add money, or tried a credit card or an ATM.',
    keys: 'top up add money atm credit card prepaid deposit شحن الرصيد إيداع',
    en: {
      ack: 'Happy to help you add money to Tabby Cash.',
      body: ['You can top up using a debit card, or by bank transfer to your Tabby Cash IBAN. Credit cards and prepaid cards aren’t supported for top-ups, and direct ATM deposits aren’t available. You’ll see all the available methods when you open Tabby Cash in the app.'],
    },
    ar: {
      ack: 'يسعدني مساعدتك في إضافة رصيد إلى تابي كاش.',
      body: ['يمكنك الشحن باستخدام بطاقة خصم مباشر، أو عبر تحويل بنكي إلى رقم IBAN الخاص بتابي كاش، مع العلم بأن البطاقات الائتمانية والبطاقات مسبقة الدفع غير مدعومة للشحن، ولا يتوفر الإيداع المباشر من أجهزة الصراف الآلي، وتظهر لك جميع الطرق المتاحة عند فتح تابي كاش في التطبيق.'],
    },
    subject: { en: 'Topping up your Tabby Cash', ar: 'شحن رصيد تابي كاش' },
  },
  {
    id: 'cash-topup-limit',
    topic: 'cash-topup',
    title: 'Top-up limit reached',
    when: 'The app says the top-up limit has been reached.',
    keys: 'top up limit reached cannot add more monthly reset تجاوز حد الشحن',
    en: {
      ack: 'I understand you’d like to add more money to your Tabby Cash.',
      body: ['Your top-up limit is calculated from your opening balance plus the amounts added during the month, and it resets on the 1st of each month. You’ll be able to top up again once it resets.'],
    },
    ar: {
      ack: 'أتفهم رغبتك في إضافة رصيد أكثر إلى تابي كاش.',
      body: ['يُحتسب حد الشحن بناءً على الرصيد الافتتاحي والمبالغ المضافة خلال الشهر، ويتجدد في اليوم الأول من كل شهر، وستتمكن من الشحن مرة أخرى بعد تجدده.'],
    },
    subject: { en: 'About your top-up limit', ar: 'بخصوص حد الشحن' },
  },
  {
    id: 'cash-incoming-missing',
    topic: 'cash-topup',
    title: 'Money sent to Tabby Cash not received',
    when: 'The customer transferred money into Tabby Cash and it is not in the balance.',
    keys: 'transfer to tabby cash not received incoming deposit missing statement تحويل إلى تابي كاش لم يصل',
    en: {
      ack: 'I understand your concern about the transfer that hasn’t appeared in your Tabby Cash balance, and I’ll help you check it.',
      body: ['To investigate, please share a bank statement for the sending account and IBAN, covering the transfer date until today, along with the transfer date and amount.'],
      next: 'Once we receive it, the relevant team will review the transaction and we’ll keep you updated.',
    },
    ar: {
      ack: 'أتفهم قلقك بخصوص التحويل الذي لم يظهر في رصيد تابي كاش، وسأساعدك في التحقق منه.',
      body: ['وللتحقق من الأمر، يُرجى مشاركة كشف حساب للحساب المحوِّل ورقم IBAN، يغطي الفترة من تاريخ التحويل حتى اليوم، مع توضيح تاريخ التحويل ومبلغه.'],
      next: 'وفور استلامه، سيراجع الفريق المختص العملية وسنوافيك بالمستجدات.',
    },
    subject: { en: 'About your transfer to Tabby Cash', ar: 'بخصوص تحويلك إلى تابي كاش' },
  },

  // ---------------- Local transfers ----------------
  {
    id: 'cash-local-delay',
    topic: 'cash-transfer',
    title: 'Local bank transfer has not arrived',
    when: 'An outgoing transfer from Tabby Cash to a UAE bank account has not arrived.',
    keys: 'local transfer not arrived iban uae bank 3 working days تحويل محلي لم يصل',
    en: {
      ack: 'I understand you’re waiting for your transfer to arrive.',
      body: ['Local transfers to UAE bank accounts are usually completed instantly, but in some cases they can take up to 3 working days.'],
      next: 'If it still hasn’t arrived after that, please share the transfer details and a bank statement of the receiving account for that period, and we’ll review it.',
    },
    ar: {
      ack: 'أتفهم أنك بانتظار وصول التحويل.',
      body: ['عادةً ما تتم التحويلات المحلية إلى الحسابات البنكية في الإمارات فورًا، ولكنها قد تستغرق في بعض الحالات مدة تصل إلى 3 أيام عمل.'],
      next: 'وإذا لم يصل بعد ذلك، يُرجى مشاركة تفاصيل التحويل وكشف حساب للحساب المستلم عن تلك الفترة، وسنقوم بمراجعته.',
    },
    subject: { en: 'About your transfer', ar: 'بخصوص التحويل' },
  },
  {
    id: 'cash-p2p',
    topic: 'cash-transfer',
    title: 'Send money to another Tabby Cash user',
    when: 'The customer asks how to transfer to another Tabby user.',
    keys: 'p2p send money friend phone number tabby cash user تحويل لمستخدم آخر',
    en: {
      ack: 'Sure, sending money to another Tabby Cash user is easy.',
      body: ['You only need the phone number registered on their Tabby account, with no IBAN needed. The minimum transfer is 1 AED, and these transfers are free. Please double-check the phone number before confirming.'],
    },
    ar: {
      ack: 'بالتأكيد، التحويل إلى مستخدم آخر في تابي كاش سهل جدًا.',
      body: ['كل ما تحتاجه هو رقم الهاتف المسجل في حسابه على تابي، دون الحاجة إلى IBAN، والحد الأدنى للتحويل درهم واحد، وهذه التحويلات مجانية. يُرجى التأكد من رقم الهاتف قبل التأكيد.'],
    },
    subject: { en: 'Sending money with Tabby Cash', ar: 'التحويل عبر تابي كاش' },
  },
  {
    id: 'cash-transfer-review',
    topic: 'cash-transfer',
    title: 'Transfer under review (up to 24 hours)',
    when: 'The transfer shows as under review.',
    keys: 'transfer under review pending check قيد المراجعة',
    en: {
      ack: 'I’ve checked your transfer.',
      body: ['It’s currently under review, which can take up to 24 hours. If any additional information is needed, you’ll receive a notification in the app.'],
    },
    ar: {
      ack: 'راجعت التحويل الخاص بك.',
      body: ['وهو حاليًا قيد المراجعة، وقد يستغرق ذلك مدة تصل إلى 24 ساعة، وإذا احتجنا إلى أي معلومات إضافية سيصلك إشعار في التطبيق.'],
    },
    subject: { en: 'Your transfer is under review', ar: 'تحويلك قيد المراجعة' },
  },
  {
    id: 'cash-transfer-sla',
    topic: 'cash-transfer',
    title: 'Transfer past the expected time – escalated',
    when: 'The review time has passed and the transfer is still pending.',
    keys: 'transfer delayed past time escalate تأخر التحويل',
    en: {
      ack: 'I understand your concern, as the transfer has passed its expected processing time.',
      body: ['I’ve raised it with the relevant team for review.'],
      next: 'You’ll receive an update within 24 hours.',
    },
    ar: {
      ack: 'أتفهم قلقك، فقد تجاوز التحويل مدة المعالجة المتوقعة.',
      body: ['قمت برفعه إلى الفريق المختص لمراجعته.'],
      next: 'وستصلك التحديثات خلال 24 ساعة.',
    },
    subject: { en: 'Update on your transfer', ar: 'تحديث بخصوص التحويل' },
  },

  // ---------------- Global transfers ----------------
  {
    id: 'glob-not-received',
    topic: 'cash-global',
    title: 'Global transfer delivered, but the recipient hasn’t got it',
    when: 'The international transfer shows Delivered but the recipient cannot find the money.',
    keys: 'global transfer international delivered not received recipient تحويل دولي لم يستلم',
    tip: 'Send the internal Lulu Exchange email (Internal & partner emails).',
    en: {
      ack: 'I understand how worrying it is when the transfer shows as delivered but the recipient can’t find the money.',
      body: ['I’ve raised it with the transfer team to verify it with the receiving side. In the meantime, the recipient can check with their bank using the transfer reference, in case it’s still being processed on their side.'],
      next: 'We’ll share an update as soon as we receive the team’s response.',
    },
    ar: {
      ack: 'أتفهم مدى القلق عندما يظهر التحويل كمستلم بينما لا يجد المستفيد المبلغ.',
      body: ['قمت برفع الأمر إلى فريق التحويلات للتحقق منه مع الجهة المستلمة، وفي هذه الأثناء يمكن للمستفيد مراجعة بنكه بالرقم المرجعي للتحويل، في حال كان لا يزال قيد المعالجة لديهم.'],
      next: 'وسنوافيك بالمستجدات فور وصول رد الفريق.',
    },
    subject: { en: 'About your international transfer', ar: 'بخصوص تحويلك الدولي' },
  },
  {
    id: 'glob-cancelled',
    topic: 'cash-global',
    title: 'Cancelled global transfer – when is the money back?',
    when: 'A global transfer was cancelled and the customer is waiting for the money.',
    keys: 'cancelled transfer refund back to balance تحويل ملغي استرجاع المبلغ',
    en: {
      ack: 'I understand you’re waiting for the amount of the cancelled transfer.',
      body: ['The amount is returned to your Tabby Cash balance as soon as possible under the applicable process. Please check your balance.'],
      next: 'If it hasn’t returned yet, let us know and we’ll follow up with the transfer team.',
    },
    ar: {
      ack: 'أتفهم أنك بانتظار مبلغ التحويل الملغي.',
      body: ['يُعاد المبلغ إلى رصيد تابي كاش في أقرب وقت ممكن وفق الإجراءات المعمول بها، يُرجى مراجعة رصيدك.'],
      next: 'وإذا لم يعد المبلغ بعد، أخبرنا وسنتابع الأمر مع فريق التحويلات.',
    },
    subject: { en: 'About your cancelled transfer', ar: 'بخصوص التحويل الملغي' },
  },
  {
    id: 'glob-name',
    topic: 'cash-global',
    title: 'Beneficiary name does not match their ID',
    when: 'The transfer failed or was cancelled because of a name mismatch.',
    keys: 'name mismatch beneficiary name wrong id اسم المستفيد غير مطابق',
    en: {
      ack: 'I understand you’d like to complete your transfer.',
      body: ['The beneficiary’s name needs to match the name on their official ID exactly. Once the amount from the cancelled transfer is back in your Tabby Cash balance, you can create a new transfer using the name exactly as it appears on their ID.'],
    },
    ar: {
      ack: 'أتفهم رغبتك في إتمام التحويل.',
      body: ['يجب أن يتطابق اسم المستفيد تمامًا مع الاسم في هويته الرسمية، وبعد عودة مبلغ التحويل الملغي إلى رصيد تابي كاش، يمكنك إنشاء تحويل جديد باسم المستفيد كما هو مكتوب في هويته تمامًا.'],
    },
    subject: { en: 'About your transfer', ar: 'بخصوص التحويل' },
  },
  {
    id: 'glob-kyc',
    topic: 'cash-global',
    title: 'Verification needed for international transfers',
    when: 'The customer asks why identity verification is needed or it is still pending.',
    keys: 'kyc verification international transfer pending 2 working days التحقق من الهوية',
    en: {
      ack: 'I understand you’d like to send your international transfer.',
      body: ['Identity verification is required before using the international transfer service. It’s usually completed instantly, but a manual review can take up to 2 working days. Please complete the steps shown in the app, and you’ll be notified once it’s done.'],
    },
    ar: {
      ack: 'أتفهم رغبتك في إرسال التحويل الدولي.',
      body: ['يلزم التحقق من الهوية قبل استخدام خدمة التحويل الدولي، وعادةً ما يكتمل فورًا، لكن المراجعة اليدوية قد تستغرق حتى يومي عمل. يُرجى إكمال الخطوات الظاهرة في التطبيق، وسيصلك إشعار عند الانتهاء.'],
    },
    subject: { en: 'Verification for international transfers', ar: 'التحقق لخدمة التحويل الدولي' },
  },
  {
    id: 'glob-rfi',
    topic: 'cash-global',
    title: 'Additional information needed for a global transfer',
    when: 'The transfer partner requested more information to release the transfer.',
    keys: 'additional information rfi documents purpose relation معلومات إضافية',
    en: {
      ack: 'Thank you for your patience with your international transfer.',
      body: [
        'To complete the review, please share the following:',
        '• A valid ID copy\n• Full name, including father’s name\n• Date of birth and place of birth\n• Your relationship to the recipient\n• The purpose of the transfer',
      ],
      next: 'Once we receive it, we’ll continue the process and keep you updated.',
    },
    ar: {
      ack: 'شكرًا لصبرك بخصوص تحويلك الدولي.',
      body: [
        'ولاستكمال المراجعة، يُرجى مشاركة ما يلي:',
        '• نسخة سارية من الهوية\n• الاسم الكامل مع اسم الأب\n• تاريخ ومكان الميلاد\n• صلة القرابة بالمستفيد\n• الغرض من التحويل',
      ],
      next: 'وفور استلامها، سنكمل الإجراءات ونوافيك بالمستجدات.',
    },
    subject: { en: 'Information needed for your transfer', ar: 'معلومات مطلوبة لاستكمال التحويل' },
  },
  {
    id: 'glob-rate',
    topic: 'cash-global',
    title: 'Exchange rate changed',
    when: 'The customer saw the exchange rate change while preparing the transfer.',
    keys: 'exchange rate changed 30 minutes rate different سعر الصرف تغير',
    en: {
      ack: 'Good question!',
      body: ['Exchange rates can change while you’re preparing a transfer. If you stay on the transfer page for 30 minutes or more, the app may let you know the rate has changed. Please review the updated rate and total before confirming.'],
    },
    ar: {
      ack: 'سؤال في محله!',
      body: ['قد تتغير أسعار الصرف أثناء إعداد التحويل، وإذا بقيت في صفحة التحويل 30 دقيقة أو أكثر، قد ينبهك التطبيق بتغير السعر، لذلك يُرجى مراجعة السعر والإجمالي المحدثين قبل التأكيد.'],
    },
    subject: { en: 'About the exchange rate', ar: 'بخصوص سعر الصرف' },
  },

  // ---------------- Reviews & account ----------------
  {
    id: 'cash-kyc-review',
    topic: 'cash-review',
    title: 'Tabby Cash verification (KYC) under review',
    when: 'The customer’s Tabby Cash KYC is pending.',
    keys: 'kyc under review verification pending tabby cash التحقق قيد المراجعة',
    en: {
      ack: 'Thank you for completing your Tabby Cash verification.',
      body: ['It’s currently under review, which can take up to 2 working days. If anything else is needed, you’ll receive a notification with the next steps.'],
    },
    ar: {
      ack: 'شكرًا لإكمال التحقق الخاص بتابي كاش.',
      body: ['وهو حاليًا قيد المراجعة، وقد يستغرق ذلك حتى يومي عمل، وإذا احتجنا إلى أي شيء آخر سيصلك إشعار بالخطوات التالية.'],
    },
    subject: { en: 'Your verification is under review', ar: 'التحقق الخاص بك قيد المراجعة' },
  },
  {
    id: 'cash-account-review',
    topic: 'cash-review',
    title: 'Tabby Cash account under review',
    when: 'The Tabby Cash account is under review.',
    keys: 'account under review restricted tabby cash 5 working days الحساب قيد المراجعة',
    en: {
      ack: 'I understand you’d like to use your Tabby Cash account.',
      body: ['Your account is currently under review, which can take up to 5 working days. We’ll let you know if any action is needed from your side.'],
    },
    ar: {
      ack: 'أتفهم رغبتك في استخدام حساب تابي كاش.',
      body: ['حسابك حاليًا قيد المراجعة، وقد يستغرق ذلك حتى 5 أيام عمل، وسنبلغك إذا كان هناك أي إجراء مطلوب منك.'],
    },
    subject: { en: 'Your Tabby Cash account is under review', ar: 'حساب تابي كاش قيد المراجعة' },
  },
  {
    id: 'cash-close',
    topic: 'cash-review',
    title: 'Close the Tabby Cash account',
    when: 'The customer wants to close Tabby Cash.',
    keys: 'close tabby cash account delete إغلاق حساب تابي كاش',
    en: {
      ack: 'I understand you’d like to close your Tabby Cash account.',
      body: ['Before closing, please make sure there’s no remaining balance and no pending transactions, as these need to be completed first. Please also read the information shown carefully before confirming, as a completed closure may not be reversible.'],
      next: 'If you can’t find the closing option in the app, let us know what you see and we’ll guide you.',
    },
    ar: {
      ack: 'أتفهم رغبتك في إغلاق حساب تابي كاش.',
      body: ['قبل الإغلاق، يُرجى التأكد من عدم وجود رصيد متبقٍ أو معاملات معلقة، لأنها تحتاج إلى الاكتمال أولًا، كما يُرجى قراءة المعلومات الظاهرة بعناية قبل التأكيد، لأن الإغلاق بعد إتمامه قد لا يكون قابلًا للتراجع.'],
      next: 'وإذا لم تجد خيار الإغلاق في التطبيق، أخبرنا بما يظهر لك وسنرشدك.',
    },
    subject: { en: 'Closing your Tabby Cash account', ar: 'إغلاق حساب تابي كاش' },
  },
];
