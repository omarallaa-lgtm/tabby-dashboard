import type { Scenario } from './types';

// Tabby Card (Pay Later card): statement & repayments, limits, status, fees,
// Tabby Plus, refunds, self-service and the Visa dispute flows
export const CARD: Scenario[] = [
  // ---------------- How the card works ----------------
  {
    id: 'card-statement',
    topic: 'card-how',
    title: 'How the Tabby Card statement works',
    when: 'The customer asks how Tabby Card repayments work or why it differs from normal orders.',
    keys: 'how card works statement monthly bill due date كيف تعمل البطاقة كشف الحساب الفاتورة',
    en: {
      ack: 'I’ll be happy to explain how your Tabby Card works.',
      body: [
        'The Tabby Card works with a monthly statement, which is different from regular Pay Later orders. All card purchases made during the statement period are grouped into one statement with one due date.',
        'When the statement is issued, you can choose how much to pay from the repayment options shown in the app, and you can review everything under Money → Tabby Card → Transactions.',
      ],
    },
    ar: {
      ack: 'يسعدني توضيح طريقة عمل بطاقة تابي لك.',
      body: [
        'تعمل بطاقة تابي بنظام كشف حساب شهري، وهو يختلف عن طلبات الدفع لاحقًا المعتادة، حيث تُجمع كل مشتريات البطاقة خلال فترة الكشف في كشف حساب واحد بتاريخ استحقاق واحد.',
        'وعند صدور الكشف، يمكنك اختيار المبلغ الذي تريد سداده من خيارات السداد الظاهرة في التطبيق، ويمكنك مراجعة كل التفاصيل من الأموال ← بطاقة تابي ← المعاملات.',
      ],
    },
    subject: { en: 'How your Tabby Card works', ar: 'طريقة عمل بطاقة تابي' },
    related: ['card-repay-options'],
  },
  {
    id: 'card-repay-options',
    topic: 'card-how',
    title: 'Repayment options (No-Fee Minimum / Minimum / Full)',
    when: 'The customer asks about the payment options or the difference between them.',
    keys: 'no fee minimum minimum payment 25% 10% full statement custom payment options خيارات السداد الحد الأدنى بدون رسوم',
    tip: 'From the team sheets: No-Fee Minimum 25% (default AutoPay), Minimum Payment 10% + 4.5% fee on the rolled-over balance, full statement with no fees.',
    en: {
      ack: 'Of course, let me explain the repayment options for your Tabby Card statement.',
      body: [
        '• No-Fee Minimum: pay 25% of your statement with no fees. This spreads eligible purchases across 4 monthly payments at no extra cost, and it’s the default AutoPay option.',
        '• Minimum Payment: pay as little as 10% of your statement. A 4.5% fee applies to the remaining balance that moves to your next statement.',
        '• Full statement: pay the full statement amount to close it with no fees. You can also pay any custom amount, but if it’s less than the 25% No-Fee Minimum, the fee applies to the remaining balance.',
      ],
      next: 'The exact amounts for each option are always shown on your statement in the app before you pay.',
    },
    ar: {
      ack: 'بالتأكيد، دعني أوضح لك خيارات سداد كشف حساب بطاقة تابي.',
      body: [
        '• الحد الأدنى بدون رسوم: سداد 25% من كشف الحساب دون أي رسوم، ويتيح لك توزيع المشتريات المؤهلة على 4 دفعات شهرية دون تكلفة إضافية، وهو الخيار الافتراضي للسداد التلقائي.',
        '• الحد الأدنى للسداد: سداد 10% فقط من كشف الحساب، مع تطبيق رسوم 4.5% على الرصيد المتبقي الذي ينتقل إلى الكشف التالي.',
        '• كامل الكشف: سداد كامل مبلغ الكشف وإغلاقه دون رسوم. ويمكنك أيضًا سداد أي مبلغ تختاره، لكن إذا كان أقل من 25% (الحد الأدنى بدون رسوم) فستُطبق الرسوم على الرصيد المتبقي.',
      ],
      next: 'وتظهر المبالغ الدقيقة لكل خيار دائمًا في كشف الحساب داخل التطبيق قبل السداد.',
    },
    subject: { en: 'Your Tabby Card repayment options', ar: 'خيارات سداد بطاقة تابي' },
  },
  {
    id: 'card-autopay',
    topic: 'card-how',
    title: 'AutoPay – how it works / why it changed',
    when: 'The customer asks what AutoPay collects or why it turned off.',
    keys: 'autopay automatic payment changed turned off auto charge السداد التلقائي',
    en: {
      ack: 'Sure, I’ll explain how AutoPay works on your Tabby Card.',
      body: [
        'AutoPay is set to the No-Fee Minimum by default. If you don’t pay manually, it collects the No-Fee Minimum automatically on the due date, with no fees.',
        'If you pay manually during the statement (the Minimum Payment, the No-Fee Minimum or a custom amount), AutoPay turns off for that statement to avoid charging you twice, and it switches back on automatically for your next statement.',
      ],
    },
    ar: {
      ack: 'بالتأكيد، سأوضح لك طريقة عمل السداد التلقائي في بطاقة تابي.',
      body: [
        'السداد التلقائي مضبوط افتراضيًا على الحد الأدنى بدون رسوم، فإذا لم تقم بالسداد يدويًا، يتم تحصيل الحد الأدنى بدون رسوم تلقائيًا في تاريخ الاستحقاق دون أي رسوم.',
        'وإذا قمت بالسداد يدويًا خلال فترة الكشف (الحد الأدنى للسداد، أو الحد الأدنى بدون رسوم، أو أي مبلغ تختاره)، يتوقف السداد التلقائي لهذا الكشف فقط حتى لا يتم الخصم مرتين، ثم يعود للعمل تلقائيًا في الكشف التالي.',
      ],
    },
    subject: { en: 'How AutoPay works on your Tabby Card', ar: 'طريقة عمل السداد التلقائي' },
  },
  {
    id: 'card-repay-plus',
    topic: 'card-how',
    title: 'New repayment method – Tabby Plus fee reduction (first 3 months)',
    when: 'A Tabby Plus subscriber asks how the new repayment options and fees work for them.',
    keys: 'new repayment method tabby plus subscriber fee reduction 15% 30% 45% minimum payment no fee طريقة السداد الجديدة تخفيض الرسوم',
    tip: 'Start with: the core repayment process hasn’t changed, two options were added. Send one option per message.',
    en: {
      ack: 'Of course, I’ll be happy to explain the new repayment options. The core repayment process hasn’t changed; the main update is two new options.',
      body: [
        'No-Fee Minimum: this replaces the previous free split in 4. When your statement is due, you can pay 25% of it with no fees, and the rest moves to your next statement. You can keep paying 25% each month for up to 4 months, so you keep the same benefit with more flexibility.',
        'Minimum Payment: for purchases not paid with the No-Fee Minimum or a post-split plan, you pay 10% each month and a 4.5% monthly fee applies to the remaining balance.',
        'As a Tabby Plus subscriber, your fees are reduced for the first 3 months:\n• Month 1: calculated on 15% of the order amount instead of 90%\n• Month 2: on 30% instead of 80%\n• Month 3: on 45% instead of 70%\nFrom month 4, the 4.5% fee is calculated on the actual remaining balance.',
        'During those first 3 months you can switch from Minimum Payment to No-Fee Minimum by paying the difference needed to reach 25% of that statement.',
      ],
      next: 'One important point: if the statement isn’t paid by the due date, AutoPay collects the No-Fee Minimum by default. If you prefer the Minimum Payment, please pay at least 10% before the due date.',
    },
    ar: {
      ack: 'بالتأكيد، يسعدني توضيح خيارات السداد الجديدة. طريقة السداد الأساسية لم تتغير، والتحديث الرئيسي هو إضافة خيارين جديدين.',
      body: [
        'الحد الأدنى بدون رسوم: يحل محل التقسيم المجاني على 4 دفعات، فعند استحقاق كشف الحساب يمكنك سداد 25% منه دون رسوم، وينتقل الباقي إلى الكشف التالي، ويمكنك الاستمرار في سداد 25% شهريًا لمدة تصل إلى 4 أشهر، فتحصل على الميزة نفسها بمرونة أكبر.',
        'الحد الأدنى للسداد: للمشتريات غير المسددة بخيار الحد الأدنى بدون رسوم أو بخطة تقسيم بعد الشراء، تسدد 10% شهريًا، وتُطبق رسوم شهرية بنسبة 4.5% على الرصيد المتبقي.',
        'وبصفتك مشتركًا في تابي بلس، تحصل على تخفيض في الرسوم خلال أول 3 أشهر:\n• الشهر الأول: تُحتسب على 15% من مبلغ الطلب بدلًا من 90%\n• الشهر الثاني: على 30% بدلًا من 80%\n• الشهر الثالث: على 45% بدلًا من 70%\nوابتداءً من الشهر الرابع تُحتسب رسوم 4.5% على الرصيد المتبقي الفعلي.',
        'وخلال هذه الأشهر الثلاثة يمكنك التحويل من الحد الأدنى للسداد إلى الحد الأدنى بدون رسوم بسداد الفرق المطلوب للوصول إلى 25% من الكشف.',
      ],
      next: 'ونقطة مهمة: إذا لم يُسدد الكشف قبل تاريخ الاستحقاق، يحصّل السداد التلقائي الحد الأدنى بدون رسوم افتراضيًا، وإذا كنت تفضّل الحد الأدنى للسداد، يُرجى سداد 10% على الأقل قبل تاريخ الاستحقاق.',
    },
    subject: { en: 'Your Tabby Card repayment options', ar: 'خيارات سداد بطاقة تابي' },
    related: ['card-repay-options', 'card-autopay', 'card-switch-nofee'],
  },
  {
    id: 'card-future-statements',
    topic: 'card-how',
    title: 'Why upcoming months aren’t all shown in advance',
    when: 'The customer wants to see every future card payment and thinks it is a bug.',
    keys: 'future months upcoming payments not shown next statements plan ahead الأشهر القادمة الدفعات القادمة',
    en: {
      ack: 'I understand you’d like to see all your upcoming Tabby Card payments so you can plan ahead.',
      body: [
        'This isn’t a technical issue. With the new repayment system, each statement is handled independently: once you choose how to pay the current statement, the next one is updated based on the remaining balance and the option you chose.',
        'Upcoming amounts can also include remaining instalments from earlier purchases you split, not only new purchases. You can follow your transactions and upcoming instalments under Money → Tabby Card → Transactions.',
      ],
      next: 'If you’d like, I can clarify any specific amount and its due date for you.',
    },
    ar: {
      ack: 'أتفهم رغبتك في معرفة جميع دفعات بطاقة تابي القادمة حتى تخطط لها مسبقًا.',
      body: [
        'وهذا ليس خطأً تقنيًا، فمع نظام السداد الجديد يُتعامل مع كل كشف حساب بشكل مستقل، وبعد اختيار طريقة سداد الكشف الحالي يتم تحديث الكشف التالي بناءً على الرصيد المتبقي والخيار الذي اخترته.',
        'وقد تشمل المبالغ القادمة أيضًا أقساطًا متبقية من مشتريات سابقة قمت بتقسيطها، وليس فقط مشتريات جديدة، ويمكنك متابعة معاملاتك وأقساطك القادمة من الأموال ← بطاقة تابي ← المعاملات.',
      ],
      next: 'وإذا رغبت، يسعدني توضيح أي مبلغ محدد وتاريخ استحقاقه لك.',
    },
    subject: { en: 'About your upcoming card payments', ar: 'بخصوص دفعات البطاقة القادمة' },
  },
  {
    id: 'card-why-fee',
    topic: 'card-how',
    title: 'Why a fee appeared on the statement',
    when: 'The customer sees a fee on their Tabby Card statement.',
    keys: 'fee on statement 4.5% rollover fee why charged رسوم على كشف الحساب',
    en: {
      ack: 'I understand your concern about the fee on your statement, and I’m happy to clarify it.',
      body: ['This fee applies only when a balance is rolled over using the Minimum Payment option. It’s 4.5% of the balance remaining after your payment, and it appears on your next statement.'],
      next: 'To avoid it completely, you can pay at least the No-Fee Minimum (25%) or the full statement amount before the due date.',
    },
    ar: {
      ack: 'أتفهم استفسارك بخصوص الرسوم على كشف حسابك، ويسعدني توضيحها.',
      body: ['تُطبق هذه الرسوم فقط عند ترحيل رصيد باستخدام خيار الحد الأدنى للسداد، وهي 4.5% من الرصيد المتبقي بعد السداد، وتظهر في الكشف التالي.'],
      next: 'ولتجنبها تمامًا، يمكنك سداد الحد الأدنى بدون رسوم (25%) على الأقل أو كامل مبلغ الكشف قبل تاريخ الاستحقاق.',
    },
    subject: { en: 'About the fee on your statement', ar: 'بخصوص الرسوم على كشف حسابك' },
  },
  {
    id: 'card-switch-nofee',
    topic: 'card-how',
    title: 'Switch from Minimum Payment to No-Fee Minimum',
    when: 'The customer paid the 10% minimum and wants to avoid the fee.',
    keys: 'switch no fee pay difference avoid fee التحويل إلى بدون رسوم',
    en: {
      ack: 'Good question, and yes, you may still be able to avoid the fee.',
      body: ['If you paid the Minimum Payment, you can switch to the No-Fee Minimum during the applicable period by paying the difference needed to reach 25% of that statement. Paying more than the minimum is always possible.'],
    },
    ar: {
      ack: 'سؤال في محله، ونعم، قد يكون بإمكانك تجنب الرسوم.',
      body: ['إذا قمت بسداد الحد الأدنى للسداد، يمكنك التحويل إلى الحد الأدنى بدون رسوم خلال الفترة المحددة بسداد الفرق المطلوب للوصول إلى 25% من هذا الكشف، ويمكنك دائمًا سداد مبلغ أكبر من الحد الأدنى.'],
    },
    subject: { en: 'Avoiding the rollover fee', ar: 'تجنب رسوم الترحيل' },
  },
  {
    id: 'card-old-vs-new',
    topic: 'card-how',
    title: 'Why purchases don’t split in 4 like before',
    when: 'The customer expects the old automatic “split in 4” on card purchases.',
    keys: 'split in 4 before old card changed new repayment لماذا لم تعد تقسم على 4',
    en: {
      ack: 'I understand why the repayment looks different from what you’ve seen before.',
      body: ['Your Tabby Card now uses the newer statement repayment options. Instead of each purchase becoming a separate four-payment plan, the No-Fee Minimum lets you pay 25% of your statement each month with no fees, and the rest carries forward according to the schedule shown in the app.'],
    },
    ar: {
      ack: 'أتفهم سبب اختلاف طريقة السداد عما اعتدت عليه سابقًا.',
      body: ['تعمل بطاقة تابي الآن بخيارات سداد الكشف الجديدة، فبدلًا من تحويل كل عملية شراء إلى خطة منفصلة من أربع دفعات، يتيح لك الحد الأدنى بدون رسوم سداد 25% من كشف حسابك كل شهر دون رسوم، وينتقل الباقي حسب الجدول الظاهر في التطبيق.'],
    },
    subject: { en: 'About your Tabby Card repayments', ar: 'بخصوص سداد بطاقة تابي' },
  },
  {
    id: 'card-post-split',
    topic: 'card-how',
    title: 'Split a card purchase after buying (post-split)',
    when: 'The customer wants to split a card purchase or cannot see the option.',
    keys: 'post split split purchase after buying cannot split تقسيم بعد الشراء',
    en: {
      ack: 'I understand you’d like to split your card purchase.',
      body: [
        'If eligible, you’ll find it under Money → Tabby Card → “You have purchases ready to split”, where all eligible purchases are listed. Any fee is shown before you confirm.',
        'The option depends on the purchase amount, your statement status and your current eligibility. If it doesn’t appear for a purchase, it isn’t available for it at the moment, and we’re unable to enable it manually.',
      ],
    },
    ar: {
      ack: 'أتفهم رغبتك في تقسيم عملية الشراء بالبطاقة.',
      body: [
        'إذا كانت العملية مؤهلة، ستجد الخيار من الأموال ← بطاقة تابي ← "لديك مشتريات جاهزة للتقسيم"، حيث تظهر كل المشتريات المؤهلة، وتظهر أي رسوم قبل التأكيد.',
        'ويعتمد توفر الخيار على مبلغ الشراء وحالة كشف الحساب وأهليتك الحالية، وإذا لم يظهر لعملية ما فهذا يعني أنه غير متاح لها حاليًا، ولا يمكننا تفعيله يدويًا.',
      ],
    },
    subject: { en: 'Splitting your card purchase', ar: 'تقسيم عملية الشراء بالبطاقة' },
  },
  {
    id: 'card-not-accepted',
    topic: 'card-how',
    title: 'Card not accepted at a store showing the Tabby logo',
    when: 'A store offers Tabby but the Tabby Card payment did not work there.',
    keys: 'store not accept card tabby logo checkout not working المتجر لا يقبل البطاقة',
    en: {
      ack: 'I understand why this is confusing.',
      body: ['A store offering Tabby at checkout doesn’t always mean it accepts the Tabby Card as a card payment at that branch. Please check the payment options at checkout, or confirm with the store whether the Tabby Card is accepted there.'],
    },
    ar: {
      ack: 'أتفهم سبب الالتباس في هذا الأمر.',
      body: ['ظهور تابي ضمن خيارات الدفع لدى المتجر لا يعني دائمًا أن الفرع يقبل بطاقة تابي كوسيلة دفع بالبطاقة، لذلك يُرجى مراجعة خيارات الدفع عند إتمام الشراء، أو التأكد من المتجر مما إذا كانت بطاقة تابي مقبولة لديهم.'],
    },
    subject: { en: 'About using your Tabby Card in store', ar: 'بخصوص استخدام بطاقة تابي في المتجر' },
  },

  // ---------------- Limits ----------------
  {
    id: 'card-limit-increase',
    topic: 'card-limit',
    title: 'Wants a higher card limit',
    when: 'The customer asks to increase their Tabby Card limit.',
    keys: 'increase limit higher limit card limit raise زيادة حد البطاقة',
    en: {
      ack: 'I understand you’d like a higher Tabby Card limit.',
      body: [
        'Your card limit is reviewed automatically every day, based on your account and repayment history and how you use the card, so we’re unable to increase it manually.',
        'Using your card regularly and keeping your payments on time helps strengthen your account over time, although a higher limit can’t be guaranteed.',
        'In the meantime: for an in-store purchase you can request a temporary in-store limit from the app, at eligible partner stores you can check whether Increase Budget is available, and you can also check whether Pay Later (split in 4) is available for the purchase.',
      ],
    },
    ar: {
      ack: 'أتفهم رغبتك في الحصول على حد أعلى لبطاقة تابي.',
      body: [
        'تتم مراجعة حد بطاقتك تلقائيًا كل يوم بناءً على سجل حسابك وسدادك وطريقة استخدامك للبطاقة، لذلك لا يمكننا زيادته يدويًا.',
        'واستخدام البطاقة بانتظام مع الالتزام بالسداد في المواعيد يساعد في تعزيز حسابك مع الوقت، مع العلم بأنه لا يمكن ضمان زيادة الحد.',
        'وفي هذه الأثناء: يمكنك طلب حد مؤقت للشراء داخل المتجر من التطبيق، وفي المتاجر الشريكة المؤهلة يمكنك التحقق من توفر خيار "زيادة الميزانية"، كما يمكنك التحقق من توفر خيار الدفع لاحقًا (التقسيم على 4) لعملية الشراء.',
      ],
    },
    subject: { en: 'About your Tabby Card limit', ar: 'بخصوص حد بطاقة تابي' },
    related: ['card-otl', 'card-limit-ontime', 'card-limit-nothing-works'],
  },
  {
    id: 'card-otl',
    topic: 'card-limit',
    title: 'Temporary in-store limit (72 hours)',
    when: 'The customer needs a higher amount at a specific store.',
    keys: 'in store limit temporary limit shop in store otl 72 hours حد مؤقت داخل المتجر',
    tip: 'Automated decision. Several active orders and many requests can affect it.',
    en: {
      ack: 'Sure, you can request a temporary limit for a specific store.',
      body: [
        'In the app: Money → Tabby Card → Shop in-store → choose the store → enter the amount you need → submit the request.',
        'The request is assessed automatically. If it’s approved, the limit is available at that store for 72 hours; after that, you’d need to request it again. If it isn’t approved, please allow some time and try again with a lower amount.',
      ],
    },
    ar: {
      ack: 'بالتأكيد، يمكنك طلب حد مؤقت لمتجر محدد.',
      body: [
        'من التطبيق: الأموال ← بطاقة تابي ← التسوق داخل المتجر ← اختيار المتجر ← إدخال المبلغ المطلوب ← إرسال الطلب.',
        'يتم تقييم الطلب تلقائيًا، وفي حال الموافقة يكون الحد متاحًا في هذا المتجر لمدة 72 ساعة، وبعدها تحتاج إلى طلبه مرة أخرى. وإذا لم تتم الموافقة، يُرجى الانتظار بعض الوقت والمحاولة بمبلغ أقل.',
      ],
    },
    subject: { en: 'Requesting a temporary in-store limit', ar: 'طلب حد مؤقت للشراء داخل المتجر' },
  },
  {
    id: 'card-limit-decrease',
    topic: 'card-limit',
    title: 'Limit decreased – customer not happy',
    when: 'The customer complains that the card limit went down.',
    keys: 'limit decreased reduced lower limit انخفاض الحد',
    en: {
      ack: 'I understand your concern about the change in your Tabby Card limit.',
      body: ['The limit is calculated automatically based on your account activity, payment history and outstanding purchases, and it can’t be adjusted manually. Keeping your payments on time and settling outstanding balances helps support future reviews, although an increase can’t be guaranteed.'],
    },
    ar: {
      ack: 'أتفهم قلقك بخصوص تغير حد بطاقة تابي.',
      body: ['يُحتسب الحد تلقائيًا بناءً على نشاط حسابك وسجل سدادك والمشتريات القائمة، ولا يمكن تعديله يدويًا. والالتزام بالسداد في المواعيد وتسوية المبالغ المستحقة يدعم المراجعات القادمة، مع العلم بأنه لا يمكن ضمان الزيادة.'],
    },
    subject: { en: 'About your Tabby Card limit', ar: 'بخصوص حد بطاقة تابي' },
  },
  {
    id: 'card-limit-ontime',
    topic: 'card-limit',
    title: 'Objection – “I pay on time, why no increase?”',
    when: 'The customer feels it is unfair because they always pay on time.',
    keys: 'pay on time unfair no increase good history limit same الحد لم يزد رغم السداد',
    en: {
      ack: 'I understand why this feels unfair, especially when you always pay on time, and we truly appreciate that.',
      body: ['Timely payments are important, but the limit depends on several factors and can’t be changed manually. At an eligible partner store, you can check whether Increase Budget is available. A higher limit can’t be guaranteed.'],
    },
    ar: {
      ack: 'أتفهم سبب شعورك بأن الأمر غير منصف، خاصة مع التزامك الدائم بالسداد في المواعيد، وهذا أمر نقدّره كثيرًا.',
      body: ['الالتزام بالسداد مهم بالفعل، لكن الحد يعتمد على عدة عوامل ولا يمكن تغييره يدويًا. وفي المتاجر الشريكة المؤهلة، يمكنك التحقق من توفر خيار "زيادة الميزانية"، مع العلم بأنه لا يمكن ضمان زيادة الحد.'],
    },
    subject: { en: 'About your Tabby Card limit', ar: 'بخصوص حد بطاقة تابي' },
  },
  {
    id: 'card-limit-nothing-works',
    topic: 'card-limit',
    title: 'Objection – tried every suggestion, limit still the same',
    when: 'The customer says they followed all the tips and nothing changed.',
    keys: 'tried everything suggestions not working limit still same جربت كل شيء',
    en: {
      ack: 'I understand your concern, and I appreciate that you’ve already tried the suggested steps.',
      body: ['Your Tabby Card limit is determined automatically and can’t be changed manually. Avoiding payment delays, using your card where available and keeping your profile updated all support future reviews, but we can’t guarantee when or whether the limit will increase.'],
    },
    ar: {
      ack: 'أتفهم استفسارك، وأقدّر أنك جربت الخطوات المقترحة بالفعل.',
      body: ['يُحدد حد بطاقة تابي آليًا ولا يمكن تغييره يدويًا، وتجنب التأخر في السداد، واستخدام البطاقة عند توفرها، وتحديث بياناتك، كلها تدعم المراجعات القادمة، لكن لا يمكننا ضمان موعد زيادة الحد أو حدوثها.'],
    },
    subject: { en: 'About your Tabby Card limit', ar: 'بخصوص حد بطاقة تابي' },
  },
  {
    id: 'card-limit-bnpl',
    topic: 'card-limit',
    title: 'Card limit dropped after a Pay Later (online) purchase',
    when: 'The available card limit went down after the customer placed Pay Later / online orders.',
    keys: 'limit dropped after bnpl online purchase shared limit pay later order reduced الحد انخفض بعد الشراء أونلاين',
    en: {
      ack: 'I’ve reviewed your account, and I can confirm that your available Tabby Card limit went down because of your recent online Pay Later purchases.',
      body: ['When you make a large purchase, or several purchases of relatively high value, your available limit is used to help approve those purchases smoothly. As you pay them, the amount becomes available again.'],
    },
    ar: {
      ack: 'راجعت حسابك، ويمكنني تأكيد أن الحد المتاح لبطاقة تابي انخفض بسبب مشترياتك الأخيرة عبر الإنترنت بخدمة الدفع لاحقًا.',
      body: ['فعند إجراء عملية شراء بمبلغ كبير أو عدة عمليات بقيم مرتفعة نسبيًا، يُستخدم الحد المتاح لمساعدتك في الموافقة على هذه المشتريات بسهولة، ومع سدادها يعود المبلغ متاحًا مرة أخرى.'],
    },
    subject: { en: 'About your available limit', ar: 'بخصوص الحد المتاح' },
    related: ['card-total-available'],
  },
  {
    id: 'card-balance-mismatch',
    topic: 'card-limit',
    title: 'Available balance doesn’t match – raised to the team',
    when: 'After checking, the card’s available balance is genuinely wrong (known incident or mismatch).',
    keys: 'available balance not matched mismatch wrong limit incident raised الرصيد المتاح غير مطابق',
    tip: 'Raise it (JIRA / incident). Suggest Pay Later in the meantime. Never promise a fix time.',
    en: {
      ack: 'I’ve fully reviewed your account, and I can see that your Tabby Card available balance isn’t matching as it should.',
      body: ['I’ve raised this with the relevant team, and we’ll update you as soon as we receive any news. In the meantime, you can still use Pay Later for eligible purchases.'],
    },
    ar: {
      ack: 'راجعت حسابك بالكامل، ولاحظت أن الرصيد المتاح لبطاقة تابي غير مطابق كما يجب.',
      body: ['وقد رفعت الأمر إلى الفريق المختص، وسنبلغك فور وصول أي تحديث. وفي هذه الأثناء، يمكنك الاستمرار في استخدام خدمة الدفع لاحقًا للمشتريات المؤهلة.'],
    },
    subject: { en: 'About your Tabby Card balance', ar: 'بخصوص رصيد بطاقة تابي' },
  },
  {
    id: 'card-limit-zero',
    topic: 'card-limit',
    title: 'Limit is 0 after old late payments (already settled)',
    when: 'The customer settled everything but the card limit is still 0.',
    keys: 'limit zero 0 after paying overdue settled الحد صفر',
    tip: 'Not actionable. Do not escalate just because a manual review is requested.',
    en: {
      ack: 'I completely understand your question, especially since you’ve already settled your previous balance.',
      body: [
        'Your current limit is subject to our automated reviews, and there isn’t a manual review or override available for it.',
        'Your previous repayment history can still be one of the factors considered, even after it’s fully settled. This doesn’t mean the limit will stay at 0 forever, but we’re unable to give a timeframe for when it may change.',
      ],
    },
    ar: {
      ack: 'أتفهم تمامًا استفسارك، خاصة أنك سددت رصيدك السابق بالكامل.',
      body: [
        'يخضع حدك الحالي للمراجعات الآلية، ولا توجد مراجعة أو تعديل يدوي متاح له.',
        'وقد يبقى سجل السداد السابق أحد العوامل التي تُؤخذ في الاعتبار حتى بعد سداده بالكامل، وهذا لا يعني أن الحد سيبقى صفرًا دائمًا، لكن لا يمكننا تحديد موعد لتغيره.',
      ],
    },
    subject: { en: 'About your Tabby Card limit', ar: 'بخصوص حد بطاقة تابي' },
  },
  {
    id: 'card-total-available',
    topic: 'card-limit',
    title: 'Total limit vs available limit',
    when: 'The customer sees two different amounts and thinks the limit was cut.',
    keys: 'total limit available limit two amounts different الحد الإجمالي الحد المتاح',
    en: {
      ack: 'I understand why seeing two different amounts can be confusing.',
      body: ['Your total limit is the overall amount assigned to your Tabby Card, while the available limit is what’s currently free for new purchases. The available amount changes with purchases, repayments and refunds, so a lower available amount doesn’t mean your total limit was reduced.'],
    },
    ar: {
      ack: 'أتفهم سبب الالتباس عند رؤية مبلغين مختلفين.',
      body: ['الحد الإجمالي هو المبلغ الكلي المخصص لبطاقة تابي، أما الحد المتاح فهو المبلغ المتوفر حاليًا للمشتريات الجديدة، ويتغير مع عمليات الشراء والسداد والاسترداد، لذلك فإن انخفاض المبلغ المتاح لا يعني تخفيض الحد الإجمالي.'],
    },
    subject: { en: 'About your Tabby Card limit', ar: 'بخصوص حد بطاقة تابي' },
  },
  {
    id: 'card-limit-after-payment',
    topic: 'card-limit',
    title: 'Paid the statement but the limit didn’t go up by the same amount',
    when: 'After a payment the available limit increased by less than what was paid.',
    keys: 'paid but limit not restored difference fee post split credit card fee دفعت ولم يرجع الحد',
    en: {
      ack: 'I understand why you expected your available limit to increase by the full amount you paid.',
      body: ['Fees, such as split fees or the processing fee for paying with a credit card, are part of the amount you pay but don’t restore the available limit. Only the purchase amount is added back. Your limit may also be shared with Pay Later purchases.'],
      next: 'If the difference still looks unclear, please share the payment details and I’ll check the breakdown for you.',
    },
    ar: {
      ack: 'أتفهم أنك كنت تتوقع زيادة الحد المتاح بكامل المبلغ الذي دفعته.',
      body: ['الرسوم، مثل رسوم التقسيط أو رسوم المعالجة عند السداد ببطاقة ائتمانية، تكون ضمن المبلغ المدفوع لكنها لا تُعيد الحد المتاح، فقط قيمة المشتريات هي التي تُضاف مرة أخرى. وقد يكون الحد أيضًا مشتركًا مع مشتريات الدفع لاحقًا.'],
      next: 'وإذا بقي الفرق غير واضح، يُرجى مشاركة تفاصيل الدفعة وسأراجع التفاصيل لك.',
    },
    subject: { en: 'About your available limit', ar: 'بخصوص الحد المتاح' },
  },
  {
    id: 'card-cc-fee',
    topic: 'card-limit',
    title: '1% fee when paying with a credit card',
    when: 'The customer was charged slightly more because they paid the statement by credit card.',
    keys: 'credit card fee 1% extra paid more repayment fee رسوم 1% بطاقة ائتمان',
    tip: 'Normal policy: explain. If the customer proves it is a DEBIT card classified as credit, investigate / escalate.',
    en: {
      ack: 'I understand your concern about the additional amount on your payment.',
      body: ['When a Tabby Card statement is paid with a credit card, a 1% processing fee is added to the payment. Only the repayment amount itself is added back to your available limit, and the fee doesn’t increase the limit.'],
      next: 'Paying with a debit card avoids this fee.',
    },
    ar: {
      ack: 'أتفهم استفسارك بخصوص المبلغ الإضافي على دفعتك.',
      body: ['عند سداد كشف حساب بطاقة تابي ببطاقة ائتمانية، تُضاف رسوم معالجة بنسبة 1% على الدفعة، ويُضاف مبلغ السداد نفسه فقط إلى الحد المتاح، ولا تزيد الرسوم من الحد.'],
      next: 'ويمكنك تجنب هذه الرسوم بالسداد ببطاقة خصم مباشر.',
    },
    subject: { en: 'About the fee on your payment', ar: 'بخصوص الرسوم على دفعتك' },
  },

  // ---------------- Card status & applications ----------------
  {
    id: 'card-apply',
    topic: 'card-status',
    title: 'How to get a Tabby Card',
    when: 'The customer asks how to apply for the card.',
    keys: 'apply get tabby card new card how to get طلب بطاقة تابي',
    en: {
      ack: 'I’ll be happy to guide you.',
      body: ['In the app, open Money → Get in-store card and follow the screens: scan the front and back of your ID, complete the face verification, optionally scan your ID’s NFC chip (you can skip this), then confirm your details are correct. You can also start from the card page: https://tabby.ai/en-AE/card'],
      next: 'The application is assessed automatically, and the result appears in the app.',
    },
    ar: {
      ack: 'يسعدني إرشادك.',
      body: ['من التطبيق، افتح الأموال ← الحصول على البطاقة واتبع الشاشات: تصوير الهوية من الأمام والخلف، وإكمال التحقق من الوجه، ومسح شريحة NFC في الهوية اختياريًا (يمكنك تخطي هذه الخطوة)، ثم التأكد من صحة البيانات. ويمكنك أيضًا البدء من صفحة البطاقة: https://tabby.ai/en-AE/card'],
      next: 'ويتم تقييم الطلب تلقائيًا، وتظهر النتيجة في التطبيق.',
    },
    subject: { en: 'How to get your Tabby Card', ar: 'طريقة الحصول على بطاقة تابي' },
  },
  {
    id: 'card-app-declined',
    topic: 'card-status',
    title: 'Card application not approved',
    when: 'The customer applied for the card and was not approved.',
    keys: 'card application rejected not approved رفض طلب البطاقة',
    en: {
      ack: 'I understand you were looking forward to using the Tabby Card, and I’m sorry it wasn’t approved this time.',
      body: ['Card applications are assessed automatically using several factors, and the decision can’t be changed manually. Paying your instalments on time, keeping your details up to date and using Tabby where it’s available can help build your purchase history.'],
    },
    ar: {
      ack: 'أتفهم أنك كنت تتطلع لاستخدام بطاقة تابي، وأعتذر لعدم الموافقة على الطلب هذه المرة.',
      body: ['يتم تقييم طلبات البطاقة تلقائيًا بناءً على عدة عوامل، ولا يمكن تغيير القرار يدويًا. والالتزام بسداد الأقساط في مواعيدها، وتحديث بياناتك، واستخدام تابي عند توفره، يساعد في بناء سجل مشترياتك.'],
    },
    subject: { en: 'About your Tabby Card application', ar: 'بخصوص طلب بطاقة تابي' },
  },
  {
    id: 'card-blocked',
    topic: 'card-status',
    title: 'Card blocked / suspended – wants it unblocked',
    when: 'The card is unavailable after an automated review.',
    keys: 'card blocked suspended unblock reactivate frozen by system البطاقة محظورة فك الحظر',
    tip: 'Never promise a reactivation date or "wait 24–48 hours and we will restore it".',
    en: {
      ack: 'I understand you’d like to use your Tabby Card again, and I appreciate how inconvenient this is.',
      body: [
        'The card’s availability is managed through an automated review, so we’re unable to unblock or reactivate it manually, and it isn’t possible to predict when its status may change.',
        'The good news is that your Buy Now, Pay Later service is still active, so you can continue using Tabby for eligible purchases.',
      ],
      next: 'Keeping your payments on time supports future reviews, and any change to the card status will appear in the app.',
    },
    ar: {
      ack: 'أتفهم رغبتك في استخدام بطاقة تابي مرة أخرى، وأقدّر مدى الإزعاج في هذا الموقف.',
      body: [
        'تتم إدارة إمكانية استخدام البطاقة من خلال مراجعة آلية، لذلك لا يمكننا فك الحظر أو إعادة التفعيل يدويًا، ولا يمكن التنبؤ بموعد تغير حالتها.',
        'والخبر الجيد أن خدمة "اشترِ الآن وادفع لاحقًا" لا تزال نشطة على حسابك، فيمكنك الاستمرار في استخدام تابي للمشتريات المؤهلة.',
      ],
      next: 'والالتزام بالسداد في المواعيد يدعم المراجعات القادمة، وسيظهر أي تغيير في حالة البطاقة داخل التطبيق.',
    },
    subject: { en: 'About your Tabby Card status', ar: 'بخصوص حالة بطاقة تابي' },
  },
  {
    id: 'card-blocked-id',
    topic: 'card-status',
    title: 'Card blocked because the ID expired',
    when: 'The card is suspended because the Emirates ID / Civil ID expired.',
    keys: 'id expired emirates id civil id renew update id card blocked انتهاء الهوية تحديث الهوية',
    en: {
      ack: 'I understand you’d like to restore access to your Tabby Card, and I’ll guide you through it.',
      body: [
        'The card is currently paused because your ID has expired, so we need your updated ID to complete the verification.',
        'You can update it in the app: Profile → Personal Information → tap the arrow next to your ID, then follow the verification steps.',
      ],
      next: 'Once the verification is completed, the card status will update according to the review outcome.',
    },
    ar: {
      ack: 'أتفهم رغبتك في استعادة استخدام بطاقة تابي، وسأرشدك إلى الخطوات.',
      body: [
        'البطاقة متوقفة حاليًا بسبب انتهاء صلاحية الهوية، لذلك نحتاج إلى الهوية المحدثة لاستكمال التحقق.',
        'ويمكنك تحديثها من التطبيق: الملف الشخصي ← المعلومات الشخصية ← الضغط على السهم بجانب الهوية، ثم اتباع خطوات التحقق.',
      ],
      next: 'وبعد اكتمال التحقق، ستتحدث حالة البطاقة حسب نتيجة المراجعة.',
    },
    subject: { en: 'Updating your ID for your Tabby Card', ar: 'تحديث الهوية لبطاقة تابي' },
  },
  {
    id: 'card-blocked-overdue',
    topic: 'card-status',
    title: 'Card suspended because of past long-overdue payments',
    when: 'No overdue now, but the card is still suspended due to old long-overdue history.',
    keys: 'suspended long overdue history paid everything still blocked تأخير طويل سابق',
    en: {
      ack: 'I understand why you’d want to use your Tabby Card again, especially after clearing your outstanding payments.',
      body: [
        'Your card is currently unavailable because of a previous period of long-overdue payments. Although there’s no overdue balance now, this history can still be considered in future automated reviews.',
        'There isn’t a manual process to remove the suspension, and we can’t confirm when it may change. Keeping future payments on time supports future reviews, and in the meantime you can use Pay Later or Pay Next Month if they’re available to you.',
      ],
    },
    ar: {
      ack: 'أتفهم رغبتك في استخدام بطاقة تابي مرة أخرى، خاصة بعد سداد المبالغ المستحقة.',
      body: [
        'البطاقة غير متاحة حاليًا بسبب فترة سابقة من التأخير الطويل في السداد، ورغم عدم وجود مبالغ متأخرة الآن، قد يُؤخذ هذا السجل في الاعتبار في المراجعات الآلية القادمة.',
        'ولا يوجد إجراء يدوي لإزالة التعليق، ولا يمكننا تحديد موعد لتغيره، والالتزام بسداد الدفعات القادمة في مواعيدها يدعم المراجعات القادمة، وفي هذه الأثناء يمكنك استخدام خدمة "ادفع لاحقًا" أو "ادفع الشهر القادم" إذا كانت متاحة لك.',
      ],
    },
    subject: { en: 'About your Tabby Card status', ar: 'بخصوص حالة بطاقة تابي' },
  },
  {
    id: 'card-freeze-vs-suspend',
    topic: 'card-status',
    title: 'Wants to “freeze” the payment because the card is suspended',
    when: 'The customer has an overdue statement and asks to freeze the card / payment.',
    keys: 'freeze payment pause statement suspended card overdue تجميد السداد',
    en: {
      ack: 'I understand you’re looking for a way to pause things while you sort out the payment.',
      body: ['Your card is already suspended, so it can’t be used. This is different from a freeze, and it doesn’t pause the payment, so the outstanding statement still needs to be settled.'],
      next: 'You can pay it from Money → Tabby Card → Pay now.',
    },
    ar: {
      ack: 'أتفهم أنك تبحث عن طريقة لإيقاف الأمور مؤقتًا إلى أن تتمكن من السداد.',
      body: ['بطاقتك معلقة بالفعل ولا يمكن استخدامها، وهذا يختلف عن التجميد، ولا يوقف السداد، لذلك لا يزال كشف الحساب المستحق بحاجة إلى السداد.'],
      next: 'ويمكنك سداده من الأموال ← بطاقة تابي ← ادفع الآن.',
    },
    subject: { en: 'About your Tabby Card statement', ar: 'بخصوص كشف حساب بطاقة تابي' },
  },
  {
    id: 'card-verified',
    topic: 'card-status',
    title: 'Card verification approved',
    when: 'The card verification request was approved.',
    keys: 'verification approved card verified can use now تمت الموافقة على التحقق',
    en: {
      ack: 'Good news! Your Tabby Card verification has been approved successfully.',
      body: ['You can now use your card as normal, including through your digital wallet.'],
    },
    ar: {
      ack: 'خبر سار! تمت الموافقة على التحقق الخاص ببطاقة تابي بنجاح.',
      body: ['ويمكنك الآن استخدام بطاقتك بشكل طبيعي، بما في ذلك من خلال المحفظة الرقمية.'],
    },
    subject: { en: 'Your Tabby Card verification is approved', ar: 'تمت الموافقة على التحقق من بطاقة تابي' },
  },
  {
    id: 'card-close',
    topic: 'card-status',
    title: 'Close the Tabby Card',
    when: 'The customer wants to close their Tabby Card (Pay Later).',
    keys: 'close card cancel card stop card إغلاق البطاقة',
    en: {
      ack: 'I understand you’d like to close your Tabby Card.',
      body: ['Before closing, please make sure there’s no outstanding statement balance, instalments or pending transactions, as these need to be settled or completed first. You can check the card management options in Money → Tabby Card → the three dots.'],
      next: 'If the closure option isn’t available in your app, let us know and we’ll guide you through the next steps based on your account.',
    },
    ar: {
      ack: 'أتفهم رغبتك في إغلاق بطاقة تابي.',
      body: ['قبل الإغلاق، يُرجى التأكد من عدم وجود رصيد مستحق في كشف الحساب أو أقساط أو معاملات معلقة، لأنها تحتاج إلى السداد أو الاكتمال أولًا، ويمكنك مراجعة خيارات إدارة البطاقة من الأموال ← بطاقة تابي ← النقاط الثلاث.'],
      next: 'وإذا لم يظهر خيار الإغلاق في التطبيق، أخبرنا وسنرشدك إلى الخطوات التالية حسب حسابك.',
    },
    subject: { en: 'Closing your Tabby Card', ar: 'إغلاق بطاقة تابي' },
  },

  // ---------------- Tabby Plus ----------------
  {
    id: 'plus-what',
    topic: 'card-plus',
    title: 'What is Tabby Plus?',
    when: 'The customer asks about Tabby Plus and its cashback.',
    keys: 'tabby plus subscription cashback 5% categories تابي بلس',
    tip: 'Figures from the team sheets (49 AED / month, 5% cashback up to 200 AED). Check the current offer if unsure.',
    en: {
      ack: 'I’ll be happy to explain Tabby Plus.',
      body: [
        'Tabby Plus is a monthly subscription (49 AED per month) for your Tabby Card. It lets you use the card in and outside Tabby partner stores and gives you 5% cashback, up to 200 AED per statement.',
        'To receive the cashback, you choose 3 categories at the start of each statement and pay the statement on time. The cashback shows as pending and is added the day after the statement due date.',
      ],
    },
    ar: {
      ack: 'يسعدني توضيح خدمة تابي بلس لك.',
      body: [
        'تابي بلس اشتراك شهري (49 درهمًا شهريًا) لبطاقة تابي، يتيح لك استخدام البطاقة داخل وخارج المتاجر الشريكة لتابي، مع كاش باك بنسبة 5% بحد أقصى 200 درهم لكل كشف حساب.',
        'وللحصول على الكاش باك، يتم اختيار 3 فئات في بداية كل كشف حساب، مع سداد الكشف في موعده، ويظهر الكاش باك كمبلغ قيد الانتظار ثم يُضاف في اليوم التالي لتاريخ استحقاق الكشف.',
      ],
    },
    subject: { en: 'About Tabby Plus', ar: 'بخصوص تابي بلس' },
  },
  {
    id: 'plus-charge',
    topic: 'card-plus',
    title: 'Unexpected Tabby Plus charge',
    when: 'The customer sees the monthly subscription amount and does not recognise it.',
    keys: '49 aed deducted subscription charge tabby plus what is this مبلغ 49 درهم',
    en: {
      ack: 'I understand your concern about this charge, and I’m happy to clarify it.',
      body: ['This is the monthly Tabby Plus subscription on your Tabby Card, which gives you cashback on your chosen categories when the statement is paid on time.'],
      next: 'If you’d prefer not to continue, you can switch to the free plan from Money → Tabby Card → Active payment plans → choose the Free plan.',
    },
    ar: {
      ack: 'أتفهم استفسارك بخصوص هذا المبلغ، ويسعدني توضيحه.',
      body: ['هذا هو الاشتراك الشهري في تابي بلس على بطاقة تابي، والذي يمنحك كاش باك على الفئات التي تختارها عند سداد الكشف في موعده.'],
      next: 'وإذا كنت لا ترغب في الاستمرار، يمكنك التحويل إلى الخطة المجانية من الأموال ← بطاقة تابي ← خطط الدفع النشطة ← اختيار الخطة المجانية.',
    },
    subject: { en: 'About the Tabby Plus subscription', ar: 'بخصوص اشتراك تابي بلس' },
  },
  {
    id: 'plus-activate',
    topic: 'card-plus',
    title: 'Activate Tabby Plus',
    when: 'The customer wants to subscribe to Tabby Plus.',
    keys: 'activate subscribe upgrade tabby plus join تفعيل تابي بلس اشتراك',
    tip: 'Team sheet: first month free. Check the current offer shown in the app before promising it.',
    en: {
      ack: 'Great choice! You can activate it in a few steps.',
      body: ['In the app: Money → Tabby Card → Tabby Plus (or Upgrade to Plus) → review the benefits → Activate. Any current offer, such as a free first month, is shown on that screen before you confirm.'],
    },
    ar: {
      ack: 'اختيار رائع! يمكنك تفعيله بخطوات بسيطة.',
      body: ['من التطبيق: الأموال ← بطاقة تابي ← تابي بلس (أو الترقية إلى بلس) ← مراجعة المزايا ← تفعيل، وأي عرض حالي، مثل الشهر الأول المجاني، يظهر في هذه الشاشة قبل التأكيد.'],
    },
    subject: { en: 'Activating Tabby Plus', ar: 'تفعيل تابي بلس' },
  },
  {
    id: 'plus-pay',
    topic: 'card-plus',
    title: 'Pay the Tabby Plus subscription',
    when: 'The subscription payment is due or failed and the customer wants to pay it.',
    keys: 'pay subscription plus plan payment failed renew سداد اشتراك تابي بلس',
    en: {
      ack: 'Sure, you can pay it directly from the app.',
      body: ['Open Profile → Plans → Plus Plan, then use the payment button to pay with your bank card, or with your wallet balance if it’s enough.'],
    },
    ar: {
      ack: 'بالتأكيد، يمكنك سداده مباشرة من التطبيق.',
      body: ['افتح الملف الشخصي ← الخطط ← خطة بلس، ثم استخدم زر الدفع للسداد ببطاقتك البنكية، أو برصيد المحفظة إذا كان كافيًا.'],
    },
    subject: { en: 'Paying your Tabby Plus subscription', ar: 'سداد اشتراك تابي بلس' },
  },
  {
    id: 'plus-cancel',
    topic: 'card-plus',
    title: 'Cancel Tabby Plus',
    when: 'The customer wants to stop the subscription.',
    keys: 'cancel tabby plus stop subscription free plan إلغاء الاشتراك',
    en: {
      ack: 'Sure, I’ll guide you through cancelling Tabby Plus.',
      body: ['In the app: Profile → Your Plan → Cancel Tabby Plus, then follow the prompts to confirm. On some app versions it’s under Money → Tabby Card → Active payment plans → choose the Free plan. Before confirming, please review the renewal date and any details shown about the end of the subscription.'],
      next: 'If the option doesn’t appear, or you notice a charge after cancelling, let us know and we’ll check it.',
    },
    ar: {
      ack: 'بالتأكيد، سأرشدك إلى طريقة إلغاء تابي بلس.',
      body: ['من التطبيق: الملف الشخصي ← خطتك ← إلغاء تابي بلس، ثم اتباع الخطوات للتأكيد. وفي بعض إصدارات التطبيق يكون الخيار من الأموال ← بطاقة تابي ← خطط الدفع النشطة ← اختيار الخطة المجانية. وقبل التأكيد يُرجى مراجعة تاريخ التجديد وأي تفاصيل تظهر عن انتهاء الاشتراك.'],
      next: 'وإذا لم يظهر الخيار، أو لاحظت أي خصم بعد الإلغاء، أخبرنا وسنتحقق من الأمر.',
    },
    subject: { en: 'Cancelling Tabby Plus', ar: 'إلغاء تابي بلس' },
  },
  {
    id: 'plus-categories',
    topic: 'card-plus',
    title: 'Choose the cashback categories',
    when: 'The customer asks how to select the Tabby Plus categories.',
    keys: 'select categories cashback categories choose 3 اختيار الفئات',
    en: {
      ack: 'Happy to help you set them up.',
      body: ['In the app: Money → Tabby Card → Categories, then choose 3 different categories. Please select them at the start of each statement so your purchases qualify for cashback.'],
    },
    ar: {
      ack: 'يسعدني مساعدتك في اختيارها.',
      body: ['من التطبيق: الأموال ← بطاقة تابي ← الفئات، ثم اختيار 3 فئات مختلفة، ويُرجى اختيارها في بداية كل كشف حساب حتى تكون مشترياتك مؤهلة للكاش باك.'],
    },
    subject: { en: 'Choosing your cashback categories', ar: 'اختيار فئات الكاش باك' },
  },
  {
    id: 'plus-cashback-pending',
    topic: 'card-plus',
    title: 'Tabby Plus cashback pending',
    when: 'The customer’s Tabby Plus cashback still shows as pending.',
    keys: 'tabby plus cashback pending not received كاش باك تابي بلس معلق',
    en: {
      ack: 'I understand you’re waiting for your cashback.',
      body: ['Tabby Plus cashback stays pending until the statement is paid on time, and it’s transferred the day after the statement due date.'],
    },
    ar: {
      ack: 'أتفهم أنك بانتظار الكاش باك.',
      body: ['يبقى كاش باك تابي بلس قيد الانتظار حتى يتم سداد كشف الحساب في موعده، ثم يتم تحويله في اليوم التالي لتاريخ الاستحقاق.'],
    },
    subject: { en: 'About your Tabby Plus cashback', ar: 'بخصوص كاش باك تابي بلس' },
  },
  {
    id: 'plus-category-mismatch',
    topic: 'card-plus',
    title: 'Store in the wrong cashback category',
    when: 'The customer says the merchant belongs to one of their categories but no cashback was given.',
    keys: 'wrong category merchant category mismatch dining grocery الفئة خاطئة',
    tip: 'Send the internal "Category mismatch review" email with the location link the customer shared.',
    en: {
      ack: 'Thank you for pointing this out, and I understand you expected cashback on this purchase.',
      body: ['I’ve raised the store’s category with the relevant team for review. If the category is corrected, the applicable cashback will be added to your cashback wallet.'],
      next: 'You’ll receive an update within 24–48 hours.',
    },
    ar: {
      ack: 'شكرًا لتنبيهنا، وأتفهم أنك كنت تتوقع الحصول على كاش باك على هذه العملية.',
      body: ['قمت برفع تصنيف المتجر إلى الفريق المختص لمراجعته، وفي حال تصحيح التصنيف ستتم إضافة الكاش باك المستحق إلى محفظة الكاش باك.'],
      next: 'وستصلك التحديثات خلال 24 إلى 48 ساعة.',
    },
    subject: { en: 'Your cashback request is under review', ar: 'طلب الكاش باك قيد المراجعة' },
  },

  // ---------------- Refunds on the Tabby Card ----------------
  // Tabby Card works like any Visa card: the store refunds the card, and it can take up to
  // 15 days from the store's refund date to reflect (or the store's SLA if longer).
  // After that: refund receipt + proof of communication → chargeback (dispute form).
  // (Pay Later orders are different: the refund shows on the order instantly – orders.ts.)
  {
    id: 'crf-not-initiated',
    topic: 'card-refund',
    title: 'Card refund – the store hasn’t refunded yet',
    when: 'Tabby Card purchase: the customer cancelled or returned it, but the store hasn’t issued the refund.',
    keys: 'tabby card refund store not refunded yet returned cancelled card purchase استرداد بطاقة تابي المتجر لم يسترد',
    tip: 'The store must issue the refund to the card. Give the store 15 days to respond before the dispute route (defective / not as described: 15 days to resolve with the store first).',
    en: {
      ack: 'I understand you’re waiting for the refund on your Tabby Card purchase.',
      body: ['Refunds on Tabby Card purchases are issued by the store, just like with any Visa card, so the refund starts once the store processes it to your card.'],
      next: 'Please ask the store to process the refund to your Tabby Card. Once they do, it can take up to 15 days from the refund date to reflect on your card.',
    },
    ar: {
      ack: 'أتفهم أنك بانتظار استرداد مبلغ عملية الشراء ببطاقة تابي.',
      body: ['يتم إصدار استرداد مشتريات بطاقة تابي من قبل المتجر، مثل أي بطاقة Visa، لذلك يبدأ الاسترداد بمجرد معالجة المتجر له إلى بطاقتك.'],
      next: 'يُرجى طلب معالجة الاسترداد من المتجر إلى بطاقة تابي، وبعد ذلك قد يستغرق ظهوره على بطاقتك مدة تصل إلى 15 يومًا من تاريخ الاسترداد.',
    },
    subject: { en: 'About your card refund', ar: 'بخصوص استرداد البطاقة' },
  },
  {
    id: 'crf-15days',
    topic: 'card-refund',
    title: 'Store refunded – wait up to 15 days from the refund date',
    when: 'Tabby Card purchase: the store issued the refund less than 15 days ago and it isn’t on the card yet.',
    keys: 'card refund not showing merchant refunded 15 days tabby card refund pending استرداد البطاقة لم يظهر 15 يوم',
    tip: '15 days from the store’s refund date, or the store’s SLA if longer. Pay Later orders don’t wait – this is for the Tabby Card only.',
    en: {
      ack: 'Thank you for checking with the store, and I understand you’d like to see the refund on your card.',
      body: ['When a store refunds a Tabby Card purchase, it can take up to 15 days from the refund date to reflect on your card. Once it does, it’s applied to your card balance.'],
      next: 'If it still isn’t showing after 15 days, please contact us with the store’s refund receipt and we’ll take it from there.',
    },
    ar: {
      ack: 'شكرًا لتواصلك مع المتجر، وأتفهم رغبتك في رؤية الاسترداد على بطاقتك.',
      body: ['عندما يسترد المتجر مبلغ عملية شراء ببطاقة تابي، قد يستغرق ظهوره على بطاقتك مدة تصل إلى 15 يومًا من تاريخ الاسترداد، وبمجرد ظهوره يُطبق على رصيد بطاقتك.'],
      next: 'وإذا لم يظهر بعد مرور 15 يومًا، يُرجى التواصل معنا مع إيصال الاسترداد من المتجر وسنتابع الأمر من هناك.',
    },
    subject: { en: 'About your card refund', ar: 'بخصوص استرداد البطاقة' },
  },
  {
    id: 'crf-proof',
    topic: 'card-refund',
    title: 'Not on the card after 15 days – ask for the refund receipt and proof',
    when: 'Tabby Card purchase: more than 15 days since the store’s refund date and it still isn’t on the card.',
    keys: 'card refund not received after 15 days refund receipt proof communication merchant chargeback إيصال الاسترداد إثبات التواصل مع المتجر',
    tip: 'Accepted proof: refund receipt, the store’s email, app screenshot showing “Refunded” with full order details, official WhatsApp / support chat. Different currency → ask the customer to confirm the AED amount with the store. Deadline: 120 days from the refund date (Visa rule – don’t present it as Tabby’s). Tabby Card → Escalations team; Tabby Cash → CCU.',
    en: {
      ack: 'I understand you’ve been waiting for this refund, and I’d like to raise it for you.',
      body: [
        'To proceed, please share the refund receipt or confirmation from the store, showing the refund amount, the refund date, the last four digits of your Tabby Card and the reference number, if available.',
        'Please also share your communication with the store about the refund, such as their email or chat screenshots.',
      ],
      next: 'Once we receive them, we’ll raise your case with the relevant team right away.',
    },
    ar: {
      ack: 'أتفهم أنك تنتظر هذا الاسترداد منذ فترة، وأود رفعه من أجلك.',
      body: [
        'ولمتابعة الإجراء، يُرجى مشاركة إيصال أو تأكيد الاسترداد من المتجر، يظهر فيه مبلغ الاسترداد وتاريخه وآخر أربعة أرقام من بطاقة تابي والرقم المرجعي إن وُجد.',
        'ويُرجى أيضًا مشاركة تواصلك مع المتجر بخصوص الاسترداد، مثل رسالة البريد الإلكتروني منهم أو لقطات شاشة من المحادثة.',
      ],
      next: 'وفور استلامها، سنرفع حالتك إلى الفريق المختص مباشرة.',
    },
    subject: { en: 'Information needed for your card refund', ar: 'معلومات مطلوبة بخصوص استرداد البطاقة' },
    related: ['crd-form-email'],
  },
  {
    id: 'crf-currency',
    topic: 'card-refund',
    title: 'Refund in another currency – confirm the AED amount',
    when: 'The store’s refund receipt is in a foreign currency.',
    keys: 'refund foreign currency usd eur aed amount exchange عملة أخرى المبلغ بالدرهم',
    en: {
      ack: 'Thank you for sharing the refund receipt.',
      body: ['As the refund is shown in a different currency, could you please confirm the exact refund amount in AED with the store?'],
      next: 'Once we have it, we’ll continue with your case.',
    },
    ar: {
      ack: 'شكرًا لمشاركة إيصال الاسترداد.',
      body: ['بما أن الاسترداد يظهر بعملة مختلفة، هل يمكنك تأكيد مبلغ الاسترداد بالدرهم الإماراتي بدقة مع المتجر؟'],
      next: 'وفور الحصول عليه، سنكمل الإجراءات على حالتك.',
    },
    subject: { en: 'Information needed for your card refund', ar: 'معلومات مطلوبة بخصوص استرداد البطاقة' },
  },
  {
    id: 'crf-pending',
    topic: 'card-refund',
    title: 'Card purchase still pending (store hasn’t completed it)',
    when: 'The Tabby Card transaction shows Pending (CRM: Unsettled).',
    keys: 'pending transaction unsettled card cancelled order still pending 32 days معاملة قيد المعالجة معلقة',
    tip: 'Pending can’t be disputed (except fraud). Still pending after 32 days → report it as a technical issue in the procedures.',
    en: {
      ack: 'I’ve checked your Tabby Card transaction for you.',
      body: [
        'It’s still pending, which means the store hasn’t completed the payment yet. The store can complete it within about 32 days of the transaction date.',
        'If they don’t, the amount is released automatically, the transaction shows as cancelled, and any amount you paid toward it is returned.',
      ],
    },
    ar: {
      ack: 'راجعت معاملة بطاقة تابي من أجلك.',
      body: [
        'ولا تزال قيد المعالجة، مما يعني أن المتجر لم يُتم عملية الدفع حتى الآن، ويمكن للمتجر إتمامها خلال 32 يومًا تقريبًا من تاريخ المعاملة.',
        'وإذا لم يتم ذلك، يُحرر المبلغ تلقائيًا وتظهر المعاملة كملغاة، ويُرد أي مبلغ دفعته عنها.',
      ],
    },
    subject: { en: 'About your pending transaction', ar: 'بخصوص المعاملة قيد المعالجة' },
  },
  {
    id: 'crf-applied',
    topic: 'card-refund',
    title: 'Card refund used for the statement balance first',
    when: 'The Tabby Card refund reduced the statement instead of going to the bank card.',
    keys: 'card refund statement balance not to bank استرداد البطاقة على كشف الحساب',
    en: {
      ack: 'I’ve checked your Tabby Card refund, and I’m happy to explain how it was applied.',
      body: ['A card refund is first used toward the remaining balance on your statement, which reduces the amount you need to pay. If the refund is more than the amount due, the extra amount is returned to your bank card.'],
      next: 'You can see the details of how the refund was applied in the app.',
    },
    ar: {
      ack: 'راجعت استرداد بطاقة تابي، ويسعدني توضيح طريقة تطبيقه.',
      body: ['يُستخدم استرداد البطاقة أولًا لتغطية الرصيد المتبقي في كشف الحساب، فيقل المبلغ المطلوب منك، وإذا كان الاسترداد أكبر من المبلغ المستحق، يُرد المبلغ الزائد إلى بطاقتك البنكية.'],
      next: 'ويمكنك رؤية تفاصيل تطبيق الاسترداد في التطبيق.',
    },
    subject: { en: 'How your card refund was applied', ar: 'طريقة تطبيق استرداد البطاقة' },
  },
  {
    id: 'crf-to-bank',
    topic: 'card-refund',
    title: 'Card refund sent back to the bank card',
    when: 'No other purchases remained on the statement, so the refund went to the bank card.',
    keys: 'card refund to bank card no other purchases استرداد إلى البطاقة البنكية',
    en: {
      ack: 'I’ve checked your Tabby Card statement.',
      body: ['As there were no other purchases remaining on it, the refund was processed back to your bank card. It can take 5–7 working days to appear, depending on your bank.'],
    },
    ar: {
      ack: 'راجعت كشف حساب بطاقة تابي.',
      body: ['وبما أنه لم تتبقَّ عليه مشتريات أخرى، تمت معالجة الاسترداد إلى بطاقتك البنكية، وقد يستغرق ظهوره من 5 إلى 7 أيام عمل حسب البنك.'],
    },
    subject: { en: 'Your card refund has been processed', ar: 'تمت معالجة استرداد البطاقة' },
  },
  {
    id: 'crf-instore',
    topic: 'card-refund',
    title: 'In-store refund – tap the card again',
    when: 'An in-store card purchase needs to be refunded at the store.',
    keys: 'in store refund tap card pos استرداد في المتجر',
    en: {
      ack: 'Thanks for checking this with us.',
      body: ['For some in-store purchases, the store may need you to tap your Tabby Card again on their payment terminal to complete the refund. Please check with the store whether this step is needed.'],
    },
    ar: {
      ack: 'شكرًا لتواصلك معنا بخصوص هذا الأمر.',
      body: ['في بعض عمليات الشراء من المتجر، قد يحتاج المتجر إلى تمرير بطاقة تابي مرة أخرى على جهاز الدفع لإتمام الاسترداد، لذلك يُرجى التأكد من المتجر إن كانت هذه الخطوة مطلوبة.'],
    },
    subject: { en: 'About your in-store refund', ar: 'بخصوص الاسترداد من المتجر' },
  },

  // ---------------- Unauthorized card transaction – Visa dispute flow ----------------
  {
    id: 'cd-form-email',
    topic: 'card-dispute',
    title: 'Send the dispute form (unauthorized transaction)',
    when: 'Step 1 (email): the customer reports a card transaction they did not make. Attach the dispute form.',
    keys: 'unauthorized transaction dont recognise unknown charge not me did not make fraud stolen card dispute form chargeback معاملة غير مصرح بها لا اعرف العملية نموذج الاعتراض',
    tip: 'Attach the dispute form. Ask the customer to freeze the card in the app. Keep the ticket open 72 hours.',
    en: {
      ack: 'I understand how worrying it is to see a transaction you don’t recognise, and we’re here to help you through it.',
      body: [
        'To raise the transaction with the relevant team for investigation, please fill out the attached dispute form:',
        '• Tick the section: “These transaction(s) were not authorized or made by me, and the card has remained in my possession throughout.”\n• Fill in the date, your address and the cardholder’s signature at the end of the form.',
        'Then please reply to this email with the completed form, so we can proceed with your dispute. For your security, you can also freeze your card from Money → Tabby Card → the three dots → Freeze.',
      ],
      next: 'We’ll keep this request open for the next 72 hours to give you enough time to complete the form. If it closes after that, you can contact us again at any time about the same complaint.',
    },
    ar: {
      ack: 'أتفهم مدى القلق عند رؤية معاملة لا تعرفها، ونحن هنا لمساعدتك في كل خطوة.',
      body: [
        'ولرفع المعاملة إلى الفريق المختص للتحقيق فيها، يُرجى تعبئة نموذج الاعتراض المرفق:',
        '• وضع علامة على الخيار: «These transaction(s) were not authorized or made by me, and the card has remained in my possession throughout.»\n• كتابة التاريخ والعنوان وتوقيع صاحب البطاقة في نهاية النموذج.',
        'ثم يُرجى الرد على هذا البريد بالنموذج بعد تعبئته حتى نتمكن من متابعة الاعتراض، وحرصًا على أمانك يمكنك أيضًا تجميد البطاقة من الأموال ← بطاقة تابي ← النقاط الثلاث ← تجميد.',
      ],
      next: 'وسنُبقي هذا الطلب مفتوحًا خلال الـ 72 ساعة القادمة لمنحك وقتًا كافيًا لتعبئة النموذج، وإذا تم إغلاقه بعد ذلك يمكنك التواصل معنا مرة أخرى في أي وقت بخصوص الشكوى نفسها.',
    },
    subject: { en: 'Dispute form for your Tabby Card transaction', ar: 'نموذج الاعتراض على معاملة بطاقة تابي' },
  },
  {
    id: 'cd-form-chat',
    topic: 'card-dispute',
    title: 'Ask the customer to check the email and fill the form',
    when: 'Step 2 (chat): after sending the dispute form email.',
    keys: 'check email inbox spam fill form dispute form sent تحقق من البريد النموذج',
    channels: ['chat'],
    en: {
      ack: 'I completely understand your concern, and I’m here to help you raise this transaction for investigation.',
      body: [
        'I’ve just sent you an email with the dispute form. Please check your inbox, and the spam or junk folder too, just in case.',
        'In the form, please tick “These transaction(s) were not authorized or made by me…”, then add the date, your address and your signature at the end.',
        'Once it’s filled, simply reply to that same email with the completed form, and we’ll raise it to the relevant team right away.',
      ],
      next: 'Please send it within 72 hours, so your request stays open while you complete it.',
    },
    ar: {
      ack: 'أتفهم تمامًا قلقك، وأنا هنا لمساعدتك في رفع هذه المعاملة للتحقيق.',
      body: [
        'أرسلت لك الآن بريدًا إلكترونيًا يحتوي على نموذج الاعتراض، يُرجى مراجعة صندوق الوارد، وكذلك مجلد الرسائل غير المرغوب فيها احتياطًا.',
        'وفي النموذج، يُرجى وضع علامة على خيار «These transaction(s) were not authorized or made by me…»، ثم كتابة التاريخ والعنوان والتوقيع في النهاية.',
        'وبعد تعبئته، فقط قم بالرد على البريد نفسه بالنموذج، وسنرفعه إلى الفريق المختص مباشرة.',
      ],
      next: 'يُرجى إرساله خلال 72 ساعة حتى يبقى طلبك مفتوحًا أثناء تعبئته.',
    },
  },
  {
    id: 'cd-form-received',
    topic: 'card-dispute',
    title: 'Form received – raised to the relevant team',
    when: 'Step 3: the customer sent the completed dispute form.',
    keys: 'form received raised submitted dispute استلام النموذج',
    en: {
      ack: 'Thank you for sending the completed dispute form.',
      body: ['We’ve received it and raised your dispute with the relevant team for investigation.'],
      next: 'We’ll update you as soon as we receive confirmation from them on the next step.',
    },
    ar: {
      ack: 'شكرًا لإرسال نموذج الاعتراض بعد تعبئته.',
      body: ['استلمناه، وقمنا برفع الاعتراض إلى الفريق المختص للتحقيق فيه.'],
      next: 'وسنوافيك بالمستجدات فور وصول تأكيد منهم بالخطوة التالية.',
    },
    subject: { en: 'We’ve received your dispute form', ar: 'استلمنا نموذج الاعتراض' },
  },
  {
    id: 'cd-visa-accepted',
    topic: 'card-dispute',
    title: 'Visa accepted the dispute (up to 31 days)',
    when: 'Step 4: the relevant team confirmed the dispute was raised and accepted by Visa.',
    keys: 'visa accepted 31 days investigation chargeback raised فيزا 31 يوم',
    en: {
      ack: 'We have an update on your dispute.',
      body: [
        'Your dispute form has been successfully raised with Visa for investigation. The investigation can take up to 31 days, which is the maximum timeframe set by Visa, although the outcome may come sooner.',
        'Please rest assured that we’re actively following up on your case. We’ll close this ticket so you can contact our team freely about anything else, but your complaint itself remains open and won’t be closed.',
      ],
      next: 'Once we receive the outcome from Visa, we’ll contact you and share the result.',
    },
    ar: {
      ack: 'لدينا تحديث بخصوص الاعتراض الخاص بك.',
      body: [
        'تم رفع نموذج الاعتراض بنجاح إلى Visa للتحقيق، وقد يستغرق التحقيق مدة تصل إلى 31 يومًا، وهي المدة القصوى التي تحددها Visa، وقد تصدر النتيجة قبل ذلك.',
        'وكن مطمئنًا بأننا نتابع حالتك باستمرار، وسنقوم بإغلاق هذه التذكرة حتى تتمكن من التواصل مع فريقنا بخصوص أي استفسار آخر، لكن الشكوى نفسها تبقى مفتوحة ولن يتم إغلاقها.',
      ],
      next: 'وفور استلام النتيجة من Visa، سنتواصل معك ونشاركك إياها.',
    },
    subject: { en: 'Your dispute has been raised with Visa', ar: 'تم رفع اعتراضك إلى Visa' },
  },
  {
    id: 'cd-call-answered',
    topic: 'card-dispute',
    title: 'Visa update – after speaking with the customer',
    when: 'Step 5a: you called the customer about the Visa update and they answered. Send this recap.',
    keys: 'call answered spoke visa update recap تحدثنا هاتفيا',
    en: {
      ack: 'It was a pleasure speaking with you over the phone today.',
      body: [
        'As discussed, your dispute has been accepted by Visa for investigation, which can take up to 31 days.',
        'Your complaint remains open while we follow up, and we’ll contact you as soon as we receive the final outcome.',
      ],
    },
    ar: {
      ack: 'سعدنا بالتحدث معك هاتفيًا اليوم.',
      body: [
        'وكما تم التوضيح، قبلت Visa الاعتراض الخاص بك للتحقيق، وقد يستغرق ذلك مدة تصل إلى 31 يومًا.',
        'وتبقى شكواك مفتوحة أثناء متابعتنا، وسنتواصل معك فور استلام النتيجة النهائية.',
      ],
    },
    subject: { en: 'Following our call about your dispute', ar: 'متابعةً لمكالمتنا بخصوص الاعتراض' },
  },
  {
    id: 'cd-call-no-answer',
    topic: 'card-dispute',
    title: 'Visa update – we called, no answer',
    when: 'Step 5b: you tried to call about the Visa update and could not reach the customer.',
    keys: 'no answer visa accepted call unreachable لم يرد فيزا',
    en: {
      ack: 'We tried to reach you by phone today, but unfortunately we were unable to connect.',
      body: [
        'We’d like to update you that Visa has accepted your dispute for investigation, which can take up to 31 days.',
        'We’ll continue following up on your case and contact you once we receive the final outcome.',
      ],
      emailClose: 'Thank you for your patience and understanding.',
    },
    ar: {
      ack: 'حاولنا التواصل معك هاتفيًا اليوم، ولكن للأسف لم نتمكن من الوصول إليك.',
      body: [
        'ونود إبلاغك بأن Visa قبلت الاعتراض الخاص بك للتحقيق، وقد يستغرق ذلك مدة تصل إلى 31 يومًا.',
        'وسنواصل متابعة حالتك ونتواصل معك فور استلام النتيجة النهائية.',
      ],
      emailClose: 'نشكرك على صبرك وتفهمك.',
    },
    subject: { en: 'Update on your Tabby Card dispute', ar: 'تحديث بخصوص الاعتراض على معاملة بطاقة تابي' },
  },
  {
    id: 'cd-followup',
    topic: 'card-dispute',
    title: 'Customer follows up during the Visa investigation',
    when: 'Step 6: the customer asks for an update while Visa is still investigating.',
    keys: 'any update visa still investigating follow up dispute متابعة فيزا',
    en: {
      ack: 'Thank you for following up, and I understand you’re waiting for the result.',
      body: ['Your dispute is still under investigation with Visa, which can take up to 31 days from when it was raised. Your complaint remains open, and we’re following up on it.'],
      next: 'As soon as Visa shares the outcome, we’ll contact you right away.',
    },
    ar: {
      ack: 'شكرًا لمتابعتك، وأتفهم أنك بانتظار النتيجة.',
      body: ['لا يزال الاعتراض قيد التحقيق لدى Visa، وقد يستغرق ذلك مدة تصل إلى 31 يومًا من تاريخ رفعه، وتبقى شكواك مفتوحة ونحن نتابعها.'],
      next: 'وفور مشاركة Visa للنتيجة، سنتواصل معك مباشرة.',
    },
    subject: { en: 'Update on your Tabby Card dispute', ar: 'تحديث بخصوص الاعتراض' },
  },
  {
    id: 'cd-outcome-won',
    topic: 'card-dispute',
    title: 'Outcome – dispute decided in the customer’s favour',
    when: 'Step 7a: Visa’s investigation concluded in the customer’s favour.',
    keys: 'dispute won approved favour refunded credited كسب الاعتراض',
    tip: 'Confirm in the records how and where the amount was credited before sending.',
    en: {
      ack: 'Good news! Visa’s investigation of your dispute has now been completed in your favour.',
      body: ['The disputed amount has been credited back, and you can see the update on your Tabby Card in the app.'],
      close: 'Thank you so much for your patience throughout the investigation.',
    },
    ar: {
      ack: 'خبر سار! انتهى تحقيق Visa في الاعتراض الخاص بك لصالحك.',
      body: ['وتم رد المبلغ المعترض عليه، ويمكنك رؤية التحديث على بطاقة تابي في التطبيق.'],
      close: 'شكرًا جزيلًا لصبرك طوال فترة التحقيق.',
    },
    subject: { en: 'Your dispute has been resolved in your favour', ar: 'تم حل الاعتراض لصالحك' },
  },
  {
    id: 'cd-outcome-lost',
    topic: 'card-dispute',
    title: 'Outcome – dispute not approved',
    when: 'Step 7b: Visa’s investigation did not approve the dispute.',
    keys: 'dispute declined lost not approved visa outcome رفض الاعتراض',
    en: {
      ack: 'Thank you for your patience while Visa completed the investigation. I’m sorry that this isn’t the outcome you were hoping for.',
      body: ['Visa’s review has concluded that the dispute couldn’t be approved, because {{reason}}. As a result, the transaction remains on your Tabby Card.'],
      next: 'If you have any new information about the transaction that wasn’t shared before, please send it to us and we’ll check what can be done.',
    },
    ar: {
      ack: 'شكرًا لصبرك حتى أنهت Visa التحقيق، وأعتذر لأن هذه ليست النتيجة التي كنت تتمناها.',
      body: ['انتهت مراجعة Visa إلى عدم إمكانية قبول الاعتراض بسبب {{reason}}، وبالتالي تبقى المعاملة على بطاقة تابي.'],
      next: 'وإذا كانت لديك أي معلومات جديدة عن المعاملة لم تتم مشاركتها من قبل، يُرجى إرسالها إلينا وسنتحقق مما يمكن فعله.',
    },
    subject: { en: 'Outcome of your Tabby Card dispute', ar: 'نتيجة الاعتراض على معاملة بطاقة تابي' },
  },
  {
    id: 'cd-form-expired',
    topic: 'card-dispute',
    title: 'Form not received within 72 hours',
    when: 'The ticket closed because the form was not sent in time and the customer comes back.',
    keys: 'form not sent 72 hours expired closed resend النموذج لم يصل',
    en: {
      ack: 'Thank you for getting back to us, and no worries at all.',
      body: ['Your previous request closed because the dispute form wasn’t received within the 72-hour period. I’ll send you the form again now, so you can complete it and reply with it.'],
      next: 'Once we receive it, your dispute will continue through the usual process.',
    },
    ar: {
      ack: 'شكرًا لعودتك إلينا، ولا داعي للقلق إطلاقًا.',
      body: ['تم إغلاق طلبك السابق لأن نموذج الاعتراض لم يصلنا خلال مدة الـ 72 ساعة، وسأرسل لك النموذج مرة أخرى الآن حتى تتمكن من تعبئته والرد به.'],
      next: 'وفور استلامه، سيستمر الاعتراض حسب الإجراءات المعتادة.',
    },
    subject: { en: 'Dispute form for your Tabby Card transaction', ar: 'نموذج الاعتراض على معاملة بطاقة تابي' },
  },
  {
    id: 'cd-recognised',
    topic: 'card-dispute',
    title: 'Customer recognised the card user',
    when: 'During the call the customer recognised who used the card.',
    keys: 'recognised the person family used card known user تعرف على الشخص',
    en: {
      ack: 'It was a pleasure speaking with you over the phone, and we’re glad to know that you’ve recognised the card user.',
      body: ['Please know that we’re always here to help if you have any further questions or concerns.'],
    },
    ar: {
      ack: 'سعدنا بالتحدث معك هاتفيًا، ويسعدنا أنك تعرفت على الشخص الذي استخدم البطاقة.',
      body: ['ونحن دائمًا في خدمتك إذا كانت لديك أي استفسارات أو ملاحظات أخرى.'],
    },
    subject: { en: 'Following our call', ar: 'متابعةً لمكالمتنا' },
  },
  {
    id: 'cd-compensation',
    topic: 'card-dispute',
    title: 'Customer asks for compensation because of fraud',
    when: 'The customer asks Tabby to compensate them for the fraudulent transaction.',
    keys: 'compensation compensate fraud loss تعويض',
    en: {
      ack: 'I understand how serious and stressful this situation is for you.',
      body: ['We’re handling your case through the dispute process so the transaction is properly investigated. Compensation isn’t available for this type of case, but we’ll keep you updated with every step and the final outcome.'],
    },
    ar: {
      ack: 'أتفهم مدى خطورة هذا الموقف والضغط الذي يسببه لك.',
      body: ['نتعامل مع حالتك من خلال إجراءات الاعتراض حتى يتم التحقيق في المعاملة بالشكل الصحيح، ولا يتوفر تعويض لهذا النوع من الحالات، لكننا سنطلعك على كل خطوة وعلى النتيجة النهائية.'],
    },
    subject: { en: 'About your Tabby Card dispute', ar: 'بخصوص الاعتراض على معاملة بطاقة تابي' },
  },
  {
    id: 'cd-subscription',
    topic: 'card-dispute',
    title: 'Unrecognised subscription charge on the card',
    when: 'The charge is a recurring subscription (e.g. streaming or membership) the customer doesn’t recognise.',
    keys: 'subscription recurring membership prime netflix charge اشتراك متكرر',
    tip: 'Two separate things: stopping future charges (merchant) and investigating the charge (dispute flow).',
    en: {
      ack: 'I understand your concern, especially as you don’t recognise this subscription charge.',
      body: [
        'I’ve checked the transaction, and it was completed as a subscription payment to the merchant. To stop future charges, please check your account with that merchant and cancel any active membership, as Tabby can’t cancel a merchant subscription from our side.',
        'If you didn’t authorise the charge itself, we can raise it for investigation through the dispute process.',
      ],
    },
    ar: {
      ack: 'أتفهم قلقك، خاصة أنك لا تعرف رسوم هذا الاشتراك.',
      body: [
        'راجعت المعاملة، وتمت كدفعة اشتراك لدى التاجر، ولإيقاف الخصومات القادمة يُرجى مراجعة حسابك لدى هذا التاجر وإلغاء أي اشتراك نشط، لأن تابي لا تستطيع إلغاء اشتراكات التاجر من جانبها.',
        'وإذا لم تكن قد وافقت على الخصم نفسه، يمكننا رفعه للتحقيق من خلال إجراءات الاعتراض.',
      ],
    },
    subject: { en: 'About the subscription charge on your card', ar: 'بخصوص رسوم الاشتراك على بطاقتك' },
  },

  // ---------------- Card refund not received – dispute flow ----------------
  {
    id: 'crd-form-email',
    topic: 'card-refund-dispute',
    title: 'Send the dispute form (returned / cancelled, no refund)',
    when: 'Step 1 (email): after the refund receipt / proof – the store refunded more than 15 days ago (or won’t refund a return / cancellation) and nothing reached the card.',
    keys: 'returned cancelled no refund card dispute form merchant did not refund أرجعت ولم يتم الاسترداد',
    tip: 'Attach the dispute form. Raise within 120 days of the refund date (Visa rule). Tabby Card → Escalations team; Tabby Cash → CCU.',
    en: {
      ack: 'I understand you’ve already cancelled or returned your purchase and are still waiting for the refund, and I’m sorry for the wait.',
      body: [
        'To raise the refund with the relevant team, please fill out the attached dispute form:',
        '• Fill in the order details: order date, store name and amount.\n• Tick the section: “I have cancelled the transaction(s)/returned the goods but have not received credit/refund for the same.”\n• Add the date, your address and the cardholder’s signature at the end.',
        'Please reply to this email with the completed form, together with any proof of the cancellation or return from the store.',
      ],
      next: 'We’ll keep this request open for the next 72 hours to give you time to complete it.',
    },
    ar: {
      ack: 'أتفهم أنك قمت بالفعل بإلغاء أو إرجاع مشترياتك ولا تزال بانتظار الاسترداد، وأعتذر عن هذا الانتظار.',
      body: [
        'ولرفع الاسترداد إلى الفريق المختص، يُرجى تعبئة نموذج الاعتراض المرفق:',
        '• كتابة تفاصيل الطلب: تاريخ الطلب واسم المتجر والمبلغ.\n• وضع علامة على الخيار: «I have cancelled the transaction(s)/returned the goods but have not received credit/refund for the same.»\n• كتابة التاريخ والعنوان وتوقيع صاحب البطاقة في النهاية.',
        'ثم يُرجى الرد على هذا البريد بالنموذج بعد تعبئته، مع أي إثبات للإلغاء أو الإرجاع من المتجر.',
      ],
      next: 'وسنُبقي هذا الطلب مفتوحًا خلال الـ 72 ساعة القادمة لمنحك الوقت الكافي لتعبئته.',
    },
    subject: { en: 'Dispute form for your Tabby Card refund', ar: 'نموذج الاعتراض لاسترداد مبلغ بطاقة تابي' },
  },
  {
    id: 'crd-form-chat',
    topic: 'card-refund-dispute',
    title: 'Ask the customer to check the email (refund dispute)',
    when: 'Step 2 (chat): after sending the refund dispute form email.',
    keys: 'check email form refund dispute cancelled returned تحقق من البريد',
    channels: ['chat'],
    en: {
      ack: 'I understand you’ve been waiting for this refund, and I’m here to help you move it forward.',
      body: [
        'I’ve just emailed you the dispute form. Please check your inbox, and the spam folder as well.',
        'Please fill in the order details, tick “I have cancelled the transaction(s)/returned the goods but have not received credit/refund…”, and add the date, your address and your signature.',
        'Then reply to the same email with the form and any return or cancellation proof from the store, within 72 hours.',
      ],
    },
    ar: {
      ack: 'أتفهم أنك تنتظر هذا الاسترداد منذ فترة، وأنا هنا لمساعدتك في متابعته.',
      body: [
        'أرسلت لك الآن نموذج الاعتراض عبر البريد الإلكتروني، يُرجى مراجعة صندوق الوارد ومجلد الرسائل غير المرغوب فيها أيضًا.',
        'ويُرجى تعبئة تفاصيل الطلب، ووضع علامة على خيار «I have cancelled the transaction(s)/returned the goods but have not received credit/refund…»، ثم كتابة التاريخ والعنوان والتوقيع.',
        'وبعدها الرد على البريد نفسه بالنموذج مع أي إثبات للإرجاع أو الإلغاء من المتجر، خلال 72 ساعة.',
      ],
    },
  },

  // ---------------- Self-service ----------------
  {
    id: 'cself-freeze',
    topic: 'card-self',
    title: 'Freeze or reissue the card',
    when: 'The customer lost the card, suspects misuse, or wants a new card number.',
    keys: 'freeze card lost stolen reissue new card number تجميد البطاقة إعادة إصدار',
    en: {
      ack: 'Sure, you can do this instantly from the app.',
      body: [
        'To freeze the card: Money → Tabby Card → the three dots at the top → Freeze → Freeze Tabby Card.',
        'To reissue it with new card details: Money → Tabby Card → the three dots → Reissue → Reissue Tabby Card.',
      ],
    },
    ar: {
      ack: 'بالتأكيد، يمكنك القيام بذلك فورًا من التطبيق.',
      body: [
        'لتجميد البطاقة: الأموال ← بطاقة تابي ← النقاط الثلاث في الأعلى ← تجميد ← تجميد بطاقة تابي.',
        'ولإعادة إصدارها ببيانات جديدة: الأموال ← بطاقة تابي ← النقاط الثلاث ← إعادة إصدار ← إعادة إصدار بطاقة تابي.',
      ],
    },
    subject: { en: 'Freezing or reissuing your Tabby Card', ar: 'تجميد أو إعادة إصدار بطاقة تابي' },
  },
  {
    id: 'cself-wallet',
    topic: 'card-self',
    title: 'Add the card to Apple Pay / Google Pay / Samsung Pay',
    when: 'The customer wants to add the Tabby Card to a digital wallet.',
    keys: 'apple pay google pay samsung pay wallet add card إضافة البطاقة للمحفظة',
    en: {
      ack: 'Happy to help you add it.',
      body: ['In the app: Money → Tabby Card → the three dots → Add card to wallet, then follow the steps on screen. On iPhone choose Add to Apple Wallet, on Samsung choose Samsung Pay or Save to phone, and on other Android phones choose Save to phone (Google Pay).'],
    },
    ar: {
      ack: 'يسعدني مساعدتك في إضافتها.',
      body: ['من التطبيق: الأموال ← بطاقة تابي ← النقاط الثلاث ← إضافة البطاقة إلى المحفظة، ثم اتباع الخطوات على الشاشة. على الآيفون اختر Add to Apple Wallet، وعلى سامسونج اختر Samsung Pay أو Save to phone، وعلى أجهزة أندرويد الأخرى اختر Save to phone (Google Pay).'],
    },
    subject: { en: 'Adding your Tabby Card to your wallet', ar: 'إضافة بطاقة تابي إلى المحفظة الرقمية' },
  },
  {
    id: 'cself-pay',
    topic: 'card-self',
    title: 'Pay the statement / top up / view transactions',
    when: 'The customer asks how to pay the card statement or where to see transactions.',
    keys: 'pay statement top up view transactions card payments سداد كشف الحساب المعاملات',
    en: {
      ack: 'Sure, here’s where to find everything.',
      body: [
        'To pay: Money → Tabby Card → Pay now (or Top-up), choose any amount from 1 AED up to the statement amount, then select the bank card.',
        'To view your transactions and repayments: Money → Tabby Card → Transactions.',
      ],
    },
    ar: {
      ack: 'بالتأكيد، هذه أماكن كل التفاصيل.',
      body: [
        'للسداد: الأموال ← بطاقة تابي ← ادفع الآن (أو إضافة رصيد)، واختيار أي مبلغ من 1 درهم حتى مبلغ الكشف، ثم اختيار البطاقة البنكية.',
        'ولعرض المعاملات والمدفوعات: الأموال ← بطاقة تابي ← المعاملات.',
      ],
    },
    subject: { en: 'Paying your Tabby Card statement', ar: 'سداد كشف حساب بطاقة تابي' },
  },
  {
    id: 'cself-details',
    topic: 'card-self',
    title: 'Show the card number and details',
    when: 'The customer needs the card number, expiry or CVV for an online purchase.',
    keys: 'card details card number cvv expiry show hide online بيانات البطاقة رقم البطاقة',
    en: {
      ack: 'Sure, you can view your card details securely in the app.',
      body: ['Open Money → Tabby Card, then tap Show to reveal the card details (and Hide to hide them again).'],
      next: 'For your security, please never share these details with anyone, including anyone claiming to be from Tabby.',
    },
    ar: {
      ack: 'بالتأكيد، يمكنك عرض بيانات بطاقتك بأمان من التطبيق.',
      body: ['افتح الأموال ← بطاقة تابي، ثم اضغط على "إظهار" لعرض بيانات البطاقة (و"إخفاء" لإخفائها مرة أخرى).'],
      next: 'وحفاظًا على أمانك، يُرجى عدم مشاركة هذه البيانات مع أي شخص، حتى لو ادعى أنه من تابي.',
    },
    subject: { en: 'Viewing your Tabby Card details', ar: 'عرض بيانات بطاقة تابي' },
  },
  {
    id: 'cself-linked',
    topic: 'card-self',
    title: 'View or add linked payment methods (card repayments)',
    when: 'The customer wants to see or add the bank card used to repay the Tabby Card.',
    keys: 'linked payment method add card repay tabby card payment methods طرق الدفع المرتبطة',
    en: {
      ack: 'Sure, here’s where to manage them.',
      body: ['Open Money → Tabby Card → the three dots at the top → Linked payment methods. You’ll see all your payment methods there, with the option to add another one.'],
    },
    ar: {
      ack: 'بالتأكيد، هذا مكان إدارتها.',
      body: ['افتح الأموال ← بطاقة تابي ← النقاط الثلاث في الأعلى ← طرق الدفع المرتبطة، وستظهر لك جميع طرق الدفع مع خيار إضافة طريقة أخرى.'],
    },
    subject: { en: 'Managing your payment methods', ar: 'إدارة طرق الدفع' },
  },
  {
    id: 'cself-autopay',
    topic: 'card-self',
    title: 'Set up AutoPay for the card',
    when: 'The customer wants the statement to be paid automatically.',
    keys: 'set up autopay automatic payment auto charge statement تفعيل السداد التلقائي',
    en: {
      ack: 'Sure, you can set it up in a few steps.',
      body: ['Open Money → Tabby Card → the three dots at the top → Set up autopayment, then choose what should be collected automatically: the minimum amount (with the applicable fee) or the full statement amount.'],
    },
    ar: {
      ack: 'بالتأكيد، يمكنك إعداده بخطوات بسيطة.',
      body: ['افتح الأموال ← بطاقة تابي ← النقاط الثلاث في الأعلى ← إعداد السداد التلقائي، ثم اختر ما يتم تحصيله تلقائيًا: الحد الأدنى (مع الرسوم المطبقة) أو كامل مبلغ الكشف.'],
    },
    subject: { en: 'Setting up AutoPay', ar: 'إعداد السداد التلقائي' },
    related: ['card-autopay'],
  },
  {
    id: 'cself-google-manual',
    topic: 'card-self',
    title: 'Add the card to Google Wallet manually',
    when: 'Adding from the Tabby app didn’t work on an Android phone.',
    keys: 'google wallet google pay manually add card android إضافة البطاقة جوجل باي يدويًا',
    en: {
      ack: 'No problem, you can also add it manually from Google Wallet.',
      body: ['Open the Google Wallet (Google Pay) app → tap Add a card → Debit or credit card → scan the card or enter the details manually → if asked to verify, choose an option and enter the verification code.'],
      next: 'You can find your card details in the Tabby app under Money → Tabby Card → Show.',
    },
    ar: {
      ack: 'لا مشكلة، يمكنك إضافتها يدويًا من تطبيق Google Wallet أيضًا.',
      body: ['افتح تطبيق Google Wallet (Google Pay) ← اضغط على إضافة بطاقة ← بطاقة خصم أو ائتمان ← امسح البطاقة أو أدخل البيانات يدويًا ← وإذا طُلب منك التحقق، اختر إحدى الطرق وأدخل رمز التحقق.'],
      next: 'ويمكنك العثور على بيانات بطاقتك في تطبيق تابي من الأموال ← بطاقة تابي ← إظهار.',
    },
    subject: { en: 'Adding your Tabby Card to Google Wallet', ar: 'إضافة بطاقة تابي إلى Google Wallet' },
    related: ['cself-wallet'],
  },
];
