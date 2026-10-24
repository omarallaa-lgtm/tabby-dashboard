import type { Scenario } from './types';

// Buy Now Pay Later (BNPL / Pay Later purchases)
export const BNPL: Scenario[] = [
  // ---------------- Purchase declined ----------------
  {
    id: 'bnpl-dec-general',
    topic: 'bnpl-decline',
    title: 'Purchase declined – account is active',
    when: 'Purchase not approved; account active with no restriction. Start here, then add the matching reason.',
    keys: 'rejected declined not approved refused order failed default non terminal رفض الطلب لم تتم الموافقة',
    tip: 'Gs_Chat structure: 1) this default message → 2) ONE matching reason (first purchase, big jump, recent smaller purchases, many attempts, only tried once, late payments, active instalments) → 3) “How approval works” to conclude. Approval is 100% automated: never promise approval or a manual review.',
    en: {
      ack: 'I’ve reviewed your account and can see that your recent purchase attempt wasn’t approved at this time. I understand how important this purchase is to you, and I’m here to clarify things.',
      body: [
        'Approval decisions are fully automated, with no one approving orders manually, and they can vary from one purchase to another. They depend on several factors, such as your purchase history and the amount requested.',
        'Your account is active with no restrictions, so not being approved for one purchase doesn’t mean there’s a problem with your account.',
      ],
      next: 'To support your next attempts, we recommend avoiding several tries on the same day, leaving 24–48 hours between attempts, starting with a smaller amount, and keeping your instalments paid on time.',
      close: 'I truly hope your next purchase goes smoothly. 🌷',
    },
    ar: {
      ack: 'راجعت حسابك، ولاحظت أن محاولة الشراء الأخيرة لم تتم الموافقة عليها حاليًا. وأتفهم مدى أهمية هذه العملية بالنسبة لك، وأنا هنا لتوضيح الأمر.',
      body: [
        'قرارات الموافقة آلية بالكامل، ولا يوجد أي شخص يوافق على الطلبات يدويًا، وقد تختلف من عملية شراء إلى أخرى، وتعتمد على عدة عوامل مثل سجل مشترياتك والمبلغ المطلوب.',
        'وحسابك نشط ولا توجد عليه أي قيود، فعدم الموافقة على عملية شراء واحدة لا يعني وجود مشكلة في الحساب.',
      ],
      next: 'ولدعم محاولاتك القادمة، ننصحك بتجنب تكرار المحاولة في اليوم نفسه، وترك 24 إلى 48 ساعة بين كل محاولة وأخرى، والبدء بمبلغ أقل، مع الالتزام بسداد الأقساط في مواعيدها.',
      close: 'أتمنى من قلبي أن تتم عملية الشراء القادمة بكل سهولة. 🌷',
    },
    subject: { en: 'About your recent purchase attempt', ar: 'بخصوص محاولة الشراء الأخيرة' },
    related: ['bnpl-dec-first', 'bnpl-dec-jump', 'bnpl-dec-recent-small', 'bnpl-dec-attempts', 'bnpl-dec-once', 'bnpl-dec-overdue', 'bnpl-dec-active', 'bnpl-dec-summary'],
  },
  {
    id: 'bnpl-dec-first',
    topic: 'bnpl-decline',
    title: 'Reason – first purchase with Tabby',
    when: 'Declined on the customer’s first ever purchase attempt.',
    keys: 'first purchase new customer first time أول عملية شراء',
    en: {
      ack: 'I can see this was your first purchase attempt with Tabby, and I understand it’s disappointing when it isn’t approved straight away.',
      body: ['We recommend starting with a smaller amount and increasing your purchase amounts gradually as you build your purchase history with Tabby.'],
      next: 'This can help improve your chances of approval for future purchases.',
    },
    ar: {
      ack: 'لاحظت أن هذه أول محاولة شراء لك مع تابي، وأتفهم أن عدم الموافقة من المرة الأولى أمر محبط.',
      body: ['ننصحك بالبدء بمبلغ أقل، ثم زيادة قيمة مشترياتك تدريجيًا مع بناء سجل مشترياتك مع تابي.'],
      next: 'فهذا قد يساعد في تحسين فرص الموافقة على مشترياتك القادمة.',
    },
    subject: { en: 'About your first purchase with Tabby', ar: 'بخصوص أول عملية شراء مع تابي' },
  },
  {
    id: 'bnpl-dec-jump',
    topic: 'bnpl-decline',
    title: 'Reason – amount much higher than usual',
    when: 'Declined amount is much higher than the customer’s usual approved purchases.',
    keys: 'big amount high amount jump higher than usual expensive مبلغ كبير أعلى من المعتاد',
    en: {
      ack: 'I’ve reviewed your recent purchases, and I can see the amount you tried this time is higher than your usual purchases with Tabby.',
      body: [
        'A big jump in the purchase amount can affect the automated decision.',
        'We recommend increasing your purchase amounts gradually, keeping them closer to your recent purchase history. If you need several items, you can also split them across smaller orders.',
      ],
      next: 'This can help strengthen your purchase history and your chances of approval over time.',
    },
    ar: {
      ack: 'راجعت مشترياتك الأخيرة، ولاحظت أن المبلغ الذي حاولت الشراء به هذه المرة أعلى من مشترياتك المعتادة مع تابي.',
      body: [
        'والزيادة الكبيرة في قيمة الشراء قد تؤثر على القرار الآلي.',
        'ننصحك بزيادة قيمة مشترياتك بشكل تدريجي، بحيث تكون قريبة من سجل مشترياتك الأخير. وإذا كنت بحاجة إلى عدة منتجات، يمكنك تقسيمها على أكثر من طلب بقيمة أقل.',
      ],
      next: 'فهذا يساعد مع الوقت في تعزيز سجل مشترياتك وفرص الموافقة.',
    },
    subject: { en: 'About your recent purchase attempt', ar: 'بخصوص محاولة الشراء الأخيرة' },
  },
  {
    id: 'bnpl-dec-recent-small',
    topic: 'bnpl-decline',
    title: 'Reason – recent purchases were smaller',
    when: 'The amount is close to some older purchases, but the most recent approved purchases were much smaller.',
    keys: 'recent purchases smaller big jump last orders lower amounts آخر المشتريات بمبالغ أقل',
    en: {
      ack: 'I’ve reviewed your recent purchases. Although this amount may be close to some of your earlier purchases, your most recent Tabby purchases were for smaller amounts.',
      body: ['We recommend keeping the amount closer to your most recent purchases, which may help improve your chances of approval.'],
    },
    ar: {
      ack: 'راجعت مشترياتك الأخيرة، ورغم أن هذا المبلغ قد يكون قريبًا من بعض مشترياتك السابقة، إلا أن آخر مشترياتك مع تابي كانت بمبالغ أقل.',
      body: ['لذلك ننصحك بأن يكون المبلغ أقرب إلى مشترياتك الأخيرة، فهذا قد يساعد في تحسين فرص الموافقة.'],
    },
    subject: { en: 'About your recent purchase attempt', ar: 'بخصوص محاولة الشراء الأخيرة' },
  },
  {
    id: 'bnpl-dec-attempts',
    topic: 'bnpl-decline',
    title: 'Reason – several attempts in a short time',
    when: 'The customer tried many times (often with different amounts) on the same day.',
    keys: 'many attempts tried several times again and again same day محاولات متكررة',
    en: {
      ack: 'I can see you tried several times to complete your purchase, and I understand how frustrating that must be.',
      body: [
        'Many unsuccessful attempts within a short period can affect the automated assessment of the next attempts.',
        'We recommend pausing for now and leaving at least 24–48 hours between attempts. The longer the gap, the better, and trying with a smaller amount can also help.',
      ],
    },
    ar: {
      ack: 'لاحظت أنك حاولت عدة مرات لإتمام عملية الشراء، وأتفهم تمامًا مدى الإحباط في هذا الموقف.',
      body: [
        'تكرار المحاولات غير الناجحة خلال فترة قصيرة قد يؤثر على التقييم الآلي للمحاولات التالية.',
        'ننصحك بالتوقف عن المحاولة حاليًا، وترك 24 إلى 48 ساعة على الأقل بين كل محاولة وأخرى، وكلما كانت المدة أطول كان ذلك أفضل، كما أن تجربة مبلغ أقل قد تساعد أيضًا.',
      ],
    },
    subject: { en: 'About your recent purchase attempts', ar: 'بخصوص محاولات الشراء الأخيرة' },
  },
  {
    id: 'bnpl-dec-once',
    topic: 'bnpl-decline',
    title: 'Reason – only tried once today',
    when: 'The customer tried a single time and is about to retry straight away.',
    keys: 'tried once one attempt only first try today محاولة واحدة',
    en: {
      ack: 'I’ve reviewed your purchase attempts and can see this was your only attempt today.',
      body: ['We recommend avoiding further attempts today and trying again after some time, as repeated attempts in a short period can affect your chances of approval.'],
    },
    ar: {
      ack: 'راجعت محاولات الشراء، ولاحظت أن هذه كانت محاولتك الوحيدة اليوم.',
      body: ['ننصحك بتجنب أي محاولات إضافية اليوم، والمحاولة مرة أخرى بعد فترة، لأن تكرار المحاولات خلال وقت قصير قد يؤثر على فرص الموافقة.'],
    },
    subject: { en: 'About your recent purchase attempt', ar: 'بخصوص محاولة الشراء الأخيرة' },
  },
  {
    id: 'bnpl-dec-overdue',
    topic: 'bnpl-decline',
    title: 'Reason – previous late payments',
    when: 'The account has a history of overdue payments, even if they are now settled.',
    keys: 'late payments overdue history delay before تأخير سابق في السداد',
    tip: 'Be kind: late payments happen to anyone. Mention that the extension option exists to protect the history next time.',
    en: {
      ack: 'I’ve reviewed your account, and I can see there were some late payments previously. I completely understand that unexpected circumstances can happen to anyone.',
      body: [
        'Previous delays can still be considered in the automated assessment, even after the payments have been settled.',
        'If you have active instalments, paying them on their due dates is the best way to strengthen your purchase history. If you don’t have any right now, making sure future payments are on time whenever a purchase is approved will help. You can also use Extend Due Date in the app before a due date if you ever need more time.',
      ],
    },
    ar: {
      ack: 'راجعت حسابك، ولاحظت وجود بعض التأخيرات السابقة في السداد، وأتفهم تمامًا أن الظروف الطارئة قد تمر على أي شخص.',
      body: [
        'وقد تُؤخذ التأخيرات السابقة في الاعتبار ضمن التقييم الآلي، حتى بعد سداد المبالغ.',
        'وإذا كانت لديك أقساط حالية، فإن سدادها في مواعيدها هو أفضل طريقة لتعزيز سجل مشترياتك، وإذا لم تكن لديك أقساط حاليًا، فالحرص على السداد في المواعيد عند الموافقة على مشترياتك القادمة سيساعدك. ويمكنك أيضًا استخدام خيار تمديد موعد السداد من التطبيق قبل تاريخ الاستحقاق إذا احتجت إلى وقت إضافي.',
      ],
    },
    subject: { en: 'About your recent purchase attempt', ar: 'بخصوص محاولة الشراء الأخيرة' },
    related: ['bnpl-ext-how'],
  },
  {
    id: 'bnpl-dec-active',
    topic: 'bnpl-decline',
    title: 'Reason – several active instalment plans',
    when: 'The customer already has several active Pay Later orders.',
    keys: 'active orders many instalments open plans أقساط نشطة طلبات قائمة',
    en: {
      ack: 'I’ve reviewed your account, and I can see you currently have several active instalment plans.',
      body: ['Your active orders are also considered in the automated assessment of a new purchase. Paying your instalments on time, or settling some of them early, can help strengthen your account over time.'],
    },
    ar: {
      ack: 'راجعت حسابك، ولاحظت وجود عدة خطط أقساط نشطة حاليًا.',
      body: ['والطلبات النشطة تُؤخذ في الاعتبار أيضًا عند التقييم الآلي لأي عملية شراء جديدة. والالتزام بسداد الأقساط في مواعيدها، أو سداد بعضها مبكرًا، قد يساعد في تعزيز حسابك مع الوقت.'],
    },
    subject: { en: 'About your recent purchase attempt', ar: 'بخصوص محاولة الشراء الأخيرة' },
  },
  {
    id: 'bnpl-dec-details',
    topic: 'bnpl-decline',
    title: 'Tip – keep personal details updated',
    when: 'Add as an extra tip, or when the customer recently updated their details.',
    keys: 'update details personal information keep updated tip تحديث البيانات',
    en: {
      ack: 'Thank you for keeping your Tabby account details up to date.',
      body: ['Please continue to update your information whenever anything changes, as this helps keep your account information current.'],
    },
    ar: {
      ack: 'شكرًا لحرصك على تحديث بيانات حسابك في تابي.',
      body: ['ويُرجى الاستمرار في تحديث بياناتك كلما طرأ أي تغيير، فهذا يساعد على إبقاء معلومات حسابك محدثة.'],
    },
    subject: { en: 'Keeping your details up to date', ar: 'تحديث بيانات حسابك' },
  },
  {
    id: 'bnpl-dec-summary',
    topic: 'bnpl-decline',
    title: 'Conclusion – how approval works (after the tips)',
    when: 'Last message of a decline conversation, after the default message and the matching reason.',
    keys: 'conclusion how approval works automated factors purchase history try again 3 months في النهاية آلية الموافقة',
    tip: 'If Events shows a specific date the customer can try again, type it instead of “after 3 months”.',
    en: {
      ack: 'You have every right to understand how approval works at Tabby.',
      body: [
        'Every purchase is assessed through a fully automated process, without any manual intervention. It considers several factors, including:\n• Your purchase history\n• The amount requested\n• Other factors that aren’t visible to us, to protect the security and privacy of your data',
        'The tips I shared can help improve these factors and your chances of approval. If the same issue continues, we recommend trying again after 3 months. If this purchase is urgent, another payment method may be the quickest option for now.',
      ],
      close: 'We’re always here if you need any further help.',
    },
    ar: {
      ack: 'من حقك أن تعرف آلية الموافقة على الطلبات في تابي.',
      body: [
        'يتم تقييم كل عملية شراء من خلال عملية آلية بالكامل، دون أي تدخل يدوي، وتعتمد على عدة عوامل، منها:\n• سجل مشترياتك\n• قيمة المبلغ المطلوب\n• عوامل أخرى لا تظهر لنا، حفاظًا على أمان بياناتك وخصوصيتها',
        'والنصائح التي شاركتها معك تساعد في تحسين هذه العوامل وفرص الموافقة. وإذا استمر الأمر نفسه، ننصحك بالمحاولة مرة أخرى بعد 3 أشهر. وإذا كانت هذه العملية عاجلة، فقد يكون استخدام وسيلة دفع أخرى هو الخيار الأسرع حاليًا.',
      ],
      close: 'ونحن دائمًا هنا إذا احتجت إلى أي مساعدة إضافية.',
    },
    subject: { en: 'How purchase approval works at Tabby', ar: 'آلية الموافقة على المشتريات في تابي' },
  },
  {
    id: 'bnpl-dec-goodhistory',
    topic: 'bnpl-decline',
    title: 'Objection – “I always pay on time” / “it worked before”',
    when: 'The customer says they have a good history or were approved before.',
    keys: 'always pay on time good history worked before previously approved دائما أسدد في الموعد كان يقبل',
    en: {
      ack: 'I completely understand why this feels confusing, especially since you’ve used Tabby successfully before and kept your payments on time, which we truly appreciate.',
      body: [
        'Each purchase is assessed independently, so a previous approval doesn’t guarantee the next one. Every new attempt is a fresh assessment of your account.',
        'Your good payment history is definitely working in your favour, so please continue as you are and try again after some time, preferably with a smaller amount.',
      ],
    },
    ar: {
      ack: 'أتفهم تمامًا سبب استغرابك، خاصة أنك استخدمت تابي بنجاح من قبل والتزمت بالسداد في المواعيد، وهذا أمر نقدّره كثيرًا.',
      body: [
        'يتم تقييم كل عملية شراء بشكل مستقل، لذلك فإن الموافقة السابقة لا تضمن الموافقة على العملية التالية، وكل محاولة جديدة هي تقييم جديد للحساب.',
        'وسجل سدادك الجيد يصب في مصلحتك بالتأكيد، لذا ننصحك بالاستمرار على ذلك والمحاولة مرة أخرى بعد فترة، ويُفضّل بمبلغ أقل.',
      ],
    },
    subject: { en: 'About your recent purchase attempt', ar: 'بخصوص محاولة الشراء الأخيرة' },
  },
  {
    id: 'bnpl-dec-reason',
    topic: 'bnpl-decline',
    title: 'Objection – wants the exact reason or a manual approval',
    when: 'The customer asks for the exact reason, an escalation, or a manual approval.',
    keys: 'why exact reason escalate manager manual approve complaint ليش السبب تصعيد موافقة يدوية',
    tip: 'Do not escalate a declined purchase. There is no complaint process that changes an automated decision.',
    en: {
      ack: 'I understand you’d like to know exactly why, and I wish I could give you a different answer.',
      body: [
        'The approval process is fully automated, and the specific factors behind an individual decision aren’t visible to our support team. For the same reason, there isn’t an escalation or complaint process that can change the decision manually.',
        'You can find the general eligibility details in the Tabby terms and conditions: https://tabby.ai/en-AE/legal/terms-and-conditions-bnpl/latest',
      ],
    },
    ar: {
      ack: 'أتفهم رغبتك في معرفة السبب بالتحديد، وكنت أتمنى أن تكون لدي إجابة مختلفة لك.',
      body: [
        'عملية الموافقة آلية بالكامل، والعوامل المحددة وراء كل قرار لا تظهر لفريق الدعم، وللسبب نفسه لا يوجد إجراء تصعيد أو شكوى يمكنه تغيير القرار يدويًا.',
        'ويمكنك الاطلاع على تفاصيل الأهلية العامة في الشروط والأحكام: https://tabby.ai/en-AE/legal/terms-and-conditions-bnpl/latest',
      ],
    },
    subject: { en: 'About your recent purchase attempt', ar: 'بخصوص محاولة الشراء الأخيرة' },
  },
  {
    id: 'bnpl-dec-insists',
    topic: 'bnpl-decline',
    title: 'Objection – customer insists again',
    when: 'Second time the customer asks to change the decision in the same contact.',
    keys: 'insist again please approve still want مصر مرة ثانية',
    en: {
      ack: 'I truly understand that you’d like to complete the purchase now, and I appreciate your patience with me.',
      body: [
        'As the decision is automated, it can’t be reviewed or changed manually from our side.',
        'The tips I shared can help with your future purchases. If you’re still not approved after following them, we recommend trying again after 3 months.',
      ],
      close: 'Thank you so much for your understanding.',
    },
    ar: {
      ack: 'أتفهم تمامًا رغبتك في إتمام عملية الشراء الآن، وأقدّر صبرك معي.',
      body: [
        'وبما أن القرار آلي، فلا يمكن مراجعته أو تغييره يدويًا من جانبنا.',
        'والنصائح التي شاركتها معك قد تساعدك في مشترياتك القادمة، وإذا لم تتم الموافقة بعد اتباعها، ننصحك بالمحاولة مرة أخرى بعد 3 أشهر.',
      ],
      close: 'شكرًا جزيلًا لتفهمك.',
    },
    subject: { en: 'About your recent purchase attempt', ar: 'بخصوص محاولة الشراء الأخيرة' },
  },
  {
    id: 'bnpl-dec-again',
    topic: 'bnpl-decline',
    title: 'Objection – contacts again about the same decline',
    when: 'The customer comes back (new chat or ticket) asking to change the same decision.',
    keys: 'again contacted again same decline second time objection 2 تواصل مرة أخرى نفس الرفض',
    tip: 'Do not repeat the full explanation. Stay short and consistent.',
    en: {
      ack: 'Thank you for reaching out again, and I understand you hoped for a different outcome.',
      body: ['The decision is automated and can’t be manually reviewed or changed. You can find the eligibility details here: https://tabby.ai/en-AE/legal/terms-and-conditions-bnpl/latest'],
    },
    ar: {
      ack: 'شكرًا لتواصلك معنا مرة أخرى، وأتفهم أنك كنت تتمنى نتيجة مختلفة.',
      body: ['القرار آلي ولا يمكن مراجعته أو تغييره يدويًا، ويمكنك الاطلاع على تفاصيل الأهلية هنا: https://tabby.ai/en-AE/legal/terms-and-conditions-bnpl/latest'],
    },
    subject: { en: 'About your recent purchase attempt', ar: 'بخصوص محاولة الشراء الأخيرة' },
  },
  {
    id: 'bnpl-dec-when',
    topic: 'bnpl-decline',
    title: 'When will I be approved again?',
    when: 'The customer wants a date when instalments will be available again.',
    keys: 'when eligible again date how long wait متى أقدر أشتري متى يرجع',
    en: {
      ack: 'I understand you’d like to know when you can use instalments again.',
      body: ['As eligibility is assessed automatically for every purchase, we’re unable to give a specific date. The best way to support your next attempt is to keep your payments on time and leave some time between attempts.'],
    },
    ar: {
      ack: 'أتفهم رغبتك في معرفة متى يمكنك استخدام التقسيط مرة أخرى.',
      body: ['وبما أن الأهلية تُقيّم آليًا مع كل عملية شراء، فلا يمكننا تحديد موعد معين. وأفضل ما يدعم محاولتك القادمة هو الالتزام بالسداد في المواعيد، وترك فترة كافية بين المحاولات.'],
    },
    subject: { en: 'About using instalments again', ar: 'بخصوص استخدام التقسيط مرة أخرى' },
  },
  {
    id: 'bnpl-dec-terminal',
    topic: 'bnpl-decline',
    title: 'Tabby not available for this customer (blocked / terminal)',
    when: 'The account is blocked or Tabby is not available after an automated review.',
    keys: 'blocked terminal not available account blocked use another payment محظور غير متاح',
    tip: 'Do not mention internal labels (terminal / pre-scoring / general risk).',
    en: {
      ack: 'I understand you’d like to use Tabby for your purchase, and I’m sorry I don’t have better news.',
      body: ['After an automated review based on our internal criteria, Tabby’s payment options aren’t available on your account at the moment, and this can’t be changed manually.'],
      next: 'We recommend using an alternative payment method for your purchase. You can find the eligibility details here: https://tabby.ai/en-AE/legal/terms-and-conditions-bnpl/latest',
    },
    ar: {
      ack: 'أتفهم رغبتك في استخدام تابي لإتمام عملية الشراء، وأعتذر لأنني لا أحمل لك أخبارًا أفضل.',
      body: ['بعد تقييم آلي وفقًا لمعاييرنا الداخلية، خيارات الدفع من تابي غير متاحة على حسابك حاليًا، ولا يمكن تغيير ذلك يدويًا.'],
      next: 'ننصحك باستخدام وسيلة دفع أخرى لإتمام عملية الشراء، ويمكنك الاطلاع على تفاصيل الأهلية هنا: https://tabby.ai/en-AE/legal/terms-and-conditions-bnpl/latest',
    },
    subject: { en: 'About your Tabby account', ar: 'بخصوص حسابك في تابي' },
  },
  {
    id: 'bnpl-dec-no-id',
    topic: 'bnpl-decline',
    title: 'Cannot place an order – ID not added',
    when: 'The account has no ID added, which stops the purchase.',
    keys: 'add id emirates id civil id not added identity إضافة الهوية',
    en: {
      ack: 'I’ve checked your account, and I can see your ID hasn’t been added yet, which is needed to complete purchases with Tabby.',
      body: ['You can add it from the app: open Profile → Personal Information → tap the arrow next to ID, then follow the verification steps.'],
      next: 'Once your ID is added, you can try your purchase again. If any message appears, please send us a screenshot and we’ll help right away.',
    },
    ar: {
      ack: 'راجعت حسابك، ولاحظت أنه لم تتم إضافة الهوية بعد، وهي مطلوبة لإتمام عمليات الشراء مع تابي.',
      body: ['يمكنك إضافتها من التطبيق: افتح الملف الشخصي ← المعلومات الشخصية ← اضغط على السهم بجانب الهوية، ثم اتبع خطوات التحقق.'],
      next: 'وبعد إضافة الهوية، يمكنك تجربة عملية الشراء مرة أخرى. وإذا ظهرت لك أي رسالة، يُرجى إرسال لقطة شاشة لها وسنساعدك مباشرة.',
    },
    subject: { en: 'Adding your ID to complete purchases', ar: 'إضافة الهوية لإتمام عمليات الشراء' },
  },

  // ---------------- Pay in Full & limits ----------------
  {
    id: 'bnpl-pif',
    topic: 'bnpl-pif',
    title: 'Only “Pay in Full” is offered',
    when: 'Checkout shows Pay in Full / Settle full amount today instead of instalments.',
    keys: 'pay in full settle full amount today no split no instalments دفع كامل المبلغ',
    tip: 'Pay in Full is an alternative approval, not a rejection or a block. Never say "next time you will get Split in 4".',
    en: {
      ack: 'I understand you were hoping to split this purchase into instalments.',
      body: [
        'For this purchase, the option available is Pay in Full, which means the order can still be completed through Tabby by paying the full amount upfront. This isn’t a rejection, and it doesn’t mean your account is restricted.',
        'The payment options shown at checkout are decided automatically for each purchase and can vary with the amount and your account history, so we’re unable to switch it to instalments manually.',
      ],
      next: 'You can try a lower order amount and check the available options again. Paying in full can also help build your payment history, although future instalments can’t be guaranteed.',
    },
    ar: {
      ack: 'أتفهم أنك كنت تتمنى تقسيم قيمة هذه العملية على أقساط.',
      body: [
        'الخيار المتاح لهذه العملية هو الدفع بالكامل، أي أنه يمكنك إتمام الطلب عبر تابي بدفع المبلغ كاملًا. وهذا ليس رفضًا، ولا يعني وجود أي قيود على حسابك.',
        'يتم تحديد خيارات الدفع عند إتمام الشراء بشكل آلي لكل عملية، وقد تختلف حسب المبلغ وسجل حسابك، لذلك لا يمكننا تحويلها إلى أقساط يدويًا.',
      ],
      next: 'يمكنك تجربة طلب بمبلغ أقل ومراجعة الخيارات المتاحة مرة أخرى. كما أن الدفع بالكامل قد يساعد في بناء سجل السداد، مع العلم بأنه لا يمكن ضمان التقسيط مستقبلًا.',
    },
    subject: { en: 'About the Pay in Full option', ar: 'بخصوص خيار الدفع بالكامل' },
  },
  {
    id: 'bnpl-downpayment',
    topic: 'bnpl-pif',
    title: 'Higher down payment than 25% (order approved)',
    when: 'Checkout asked for a first payment above 25% and the customer thinks it was rejected.',
    keys: 'higher down payment first payment more than 25% upfront bigger first instalment دفعة أولى أعلى',
    tip: 'This is an approval, not a rejection. Explain why, then offer to try a lower amount if the customer can’t pay the higher first payment.',
    en: {
      ack: 'I can see you were asked to make a first payment higher than 25%. Let me clarify that your order wasn’t rejected. It was approved, with a slightly higher first payment.',
      body: [
        'At first, the automated process wants to understand your purchasing habits better, so the first payment was increased slightly to raise the chance of your order being approved.',
        'Completing this purchase and paying on time builds a good purchase history with Tabby, which can help more of your future orders get approved for higher amounts.',
      ],
      next: 'If the higher first payment doesn’t suit you right now, you can try a lower order amount and check the options again.',
    },
    ar: {
      ack: 'لاحظت أنه طُلب منك دفع دفعة أولى أعلى من 25%. وأود التوضيح بأن طلبك لم يُرفض، بل تمت الموافقة عليه مع دفعة أولى أعلى قليلًا.',
      body: [
        'ففي البداية، تحتاج العملية الآلية إلى التعرف على عاداتك الشرائية بشكل أفضل، لذلك تمت زيادة الدفعة الأولى قليلًا لرفع فرصة الموافقة على طلبك.',
        'وإتمام هذه العملية مع الالتزام بالسداد في المواعيد يبني سجل مشتريات جيدًا مع تابي، وهذا قد يساعد في الموافقة على طلباتك القادمة بمبالغ أعلى.',
      ],
      next: 'وإذا لم تكن الدفعة الأولى الأعلى مناسبة لك حاليًا، يمكنك تجربة طلب بمبلغ أقل ومراجعة الخيارات مرة أخرى.',
    },
    subject: { en: 'About the first payment on your order', ar: 'بخصوص الدفعة الأولى لطلبك' },
  },
  {
    id: 'bnpl-pif-jump',
    topic: 'bnpl-pif',
    title: 'Pay in Full because of a big jump in amount',
    when: 'Pay in Full appeared because the amount is much higher than the customer’s recent purchases.',
    keys: 'pay in full big jump higher amount than usual دفع كامل مبلغ أعلى',
    en: {
      ack: 'I’ve reviewed your recent purchases, and I can see this amount is noticeably higher than your usual purchases with Tabby.',
      body: ['A significant increase can lead to Pay in Full being offered instead of instalments. Eligibility is decided automatically, so increasing your purchase amounts gradually, keeping your details updated and paying on time can help, although future instalments can’t be guaranteed.'],
    },
    ar: {
      ack: 'راجعت مشترياتك الأخيرة، ولاحظت أن هذا المبلغ أعلى بشكل واضح من مشترياتك المعتادة مع تابي.',
      body: ['والزيادة الكبيرة في المبلغ قد تؤدي إلى ظهور خيار الدفع بالكامل بدلًا من التقسيط. وتُحدد الأهلية آليًا، لذلك فإن زيادة قيمة مشترياتك تدريجيًا، وتحديث بياناتك، والالتزام بالسداد في المواعيد قد يساعدك، مع العلم بأنه لا يمكن ضمان التقسيط مستقبلًا.'],
    },
    subject: { en: 'About the Pay in Full option', ar: 'بخصوص خيار الدفع بالكامل' },
  },
  {
    id: 'bnpl-pif-objection',
    topic: 'bnpl-pif',
    title: 'Objection – wants instalments, not Pay in Full',
    when: 'The customer insists on splitting the payment after you explained Pay in Full.',
    keys: 'want instalments not pay in full split in 4 object insist أريد تقسيط لا أريد الدفع كامل',
    en: {
      ack: 'Of course, I completely understand that you’d like to use Tabby for instalments.',
      body: [
        'If the full amount is available to you, we recommend paying it through Tabby rather than directly to the store, as this builds your purchase history and can increase your chances of instalment approval in the future.',
        'If the full amount isn’t available right now, you can try a lower purchase amount, which may be available in instalments.',
      ],
    },
    ar: {
      ack: 'بالتأكيد، أتفهم تمامًا رغبتك في استخدام تابي للتقسيط.',
      body: [
        'وإذا كان المبلغ كاملًا متاحًا لديك، ننصحك بدفعه من خلال تابي بدلًا من الدفع للمتجر مباشرة، فهذا يبني سجل مشترياتك وقد يزيد من فرص الموافقة على التقسيط مستقبلًا.',
        'وإذا لم يكن المبلغ كاملًا متاحًا حاليًا، يمكنك تجربة عملية شراء بمبلغ أقل، فقد تكون متاحة بالتقسيط.',
      ],
    },
    subject: { en: 'About the Pay in Full option', ar: 'بخصوص خيار الدفع بالكامل' },
  },
  {
    id: 'bnpl-limit',
    topic: 'bnpl-pif',
    title: 'Pay Later spending limit / wants a higher limit',
    when: 'The customer asks what their limit is or to increase it.',
    keys: 'limit increase higher limit how much can I spend credit limit الحد زيادة الحد',
    en: {
      ack: 'I understand you’d like a higher spending limit with Tabby.',
      body: [
        'There isn’t a fixed Pay Later limit. The amount available is assessed automatically for each purchase, based on factors such as your purchase history and account activity, so we’re unable to set or increase it manually.',
        'Starting with smaller amounts and increasing them gradually, while paying on time, is the best way to build a stronger history with Tabby.',
      ],
    },
    ar: {
      ack: 'أتفهم رغبتك في الحصول على حد إنفاق أعلى مع تابي.',
      body: [
        'لا يوجد حد ثابت لخدمة الدفع لاحقًا، فالمبلغ المتاح يُقيّم آليًا مع كل عملية شراء بناءً على عوامل مثل سجل مشترياتك ونشاط حسابك، لذلك لا يمكننا تحديده أو زيادته يدويًا.',
        'والبدء بمبالغ صغيرة ثم زيادتها تدريجيًا، مع الالتزام بالسداد في المواعيد، هو أفضل طريقة لبناء سجل أقوى مع تابي.',
      ],
    },
    subject: { en: 'About your Tabby spending limit', ar: 'بخصوص حد الإنفاق في تابي' },
  },

  // ---------------- Payment plans ----------------
  {
    id: 'bnpl-plan-change',
    topic: 'bnpl-plan',
    title: 'Change to a longer plan (6 / 8 / 12 months)',
    when: 'The customer wants smaller instalments on an existing order (post-split).',
    keys: 'longer plan 6 8 12 months change payment plan post split smaller instalments تغيير خطة الدفع',
    tip: 'Only before paying the 2nd instalment and only if the option appears. Any fee is shown in the app.',
    en: {
      ack: 'I understand you’d like to spread this order over a longer period.',
      body: [
        'If your order is eligible, you can change the payment plan from the app: Money → Pay Later purchases → choose the order → Change payment plan, then select the plan you prefer.',
        'The available plans can include 6, 8 or 12 months, and this needs to be done before paying the 2nd instalment. Any applicable fee is shown in the app before you confirm.',
      ],
      next: 'If the option doesn’t appear for this order, it means a longer plan isn’t available for it at the moment.',
    },
    ar: {
      ack: 'أتفهم رغبتك في تقسيم هذا الطلب على فترة أطول.',
      body: [
        'إذا كان طلبك مؤهلًا، يمكنك تغيير خطة الدفع من التطبيق: الأموال ← مشتريات الدفع لاحقًا ← اختيار الطلب ← تغيير خطة الدفع، ثم اختيار الخطة المناسبة.',
        'وقد تشمل الخطط المتاحة 6 أو 8 أو 12 شهرًا، ويجب إتمام ذلك قبل سداد الدفعة الثانية، وتظهر أي رسوم مطبقة في التطبيق قبل التأكيد.',
      ],
      next: 'وإذا لم يظهر الخيار لهذا الطلب، فهذا يعني أن الخطة الأطول غير متاحة له حاليًا.',
    },
    subject: { en: 'Changing your payment plan', ar: 'تغيير خطة الدفع' },
  },
  {
    id: 'bnpl-plan-locked',
    topic: 'bnpl-plan',
    title: 'Plan cannot be changed after confirming',
    when: 'The customer wants to change a confirmed plan (or the 2nd instalment is already paid).',
    keys: 'change plan after confirm cannot modify instalments number تعديل عدد الدفعات',
    en: {
      ack: 'I understand you’d like to change the instalment plan for this order.',
      body: ['Once a payment plan has been confirmed, it can’t be changed or modified manually. For future purchases, please review the available plans carefully before confirming.'],
    },
    ar: {
      ack: 'أتفهم رغبتك في تغيير خطة التقسيط لهذا الطلب.',
      body: ['بعد تأكيد خطة الدفع، لا يمكن تغييرها أو تعديلها يدويًا. ونوصيك في المشتريات القادمة بمراجعة الخطط المتاحة بعناية قبل التأكيد.'],
    },
    subject: { en: 'About your payment plan', ar: 'بخصوص خطة الدفع' },
  },
  {
    id: 'bnpl-plan-why-not',
    topic: 'bnpl-plan',
    title: 'Why can’t I see 6 / 8 / 12 instalments?',
    when: 'The customer only sees fewer instalments than expected.',
    keys: 'why no 6 8 12 only 4 instalments options لماذا لا يظهر 6 دفعات',
    en: {
      ack: 'I understand you were expecting to see more instalment options.',
      body: ['The plans available are decided automatically and can differ from one customer and purchase to another. At the moment you may be eligible for certain plans only, and this can change after future automatic assessments.'],
    },
    ar: {
      ack: 'أتفهم أنك كنت تتوقع ظهور خيارات تقسيط أكثر.',
      body: ['يتم تحديد الخطط المتاحة بشكل آلي، وقد تختلف من عميل إلى آخر ومن عملية شراء إلى أخرى. وقد تكون مؤهلًا حاليًا لخطط معينة فقط، ويمكن أن يتغير ذلك بعد التقييمات الآلية القادمة.'],
    },
    subject: { en: 'About the instalment options', ar: 'بخصوص خيارات التقسيط' },
  },

  // ---------------- Extensions & late payments ----------------
  {
    id: 'bnpl-ext-how',
    topic: 'bnpl-extend',
    title: 'How to extend a due date',
    when: 'The customer needs more time to pay an upcoming instalment.',
    keys: 'extend due date more time postpone delay payment salary تمديد تأجيل الدفعة امدد اجل القسط',
    tip: 'Extension: before the due date, once per instalment, 7 / 14 / 21 days, fee shown in the app.',
    en: {
      ack: 'I completely understand that sometimes you need a little more time, and I appreciate you taking care of your payment history.',
      body: [
        'You can extend the due date directly from the app: Money (UAE) or Payments (Kuwait) → choose the order → Manage order → Extend due date, then choose 7, 14 or 21 days and pay the extension fee shown.',
        'The extension needs to be done before the due date and can be used once per instalment.',
      ],
      next: 'If the option doesn’t appear for this instalment, please let me know and I’ll check it with you.',
    },
    ar: {
      ack: 'أتفهم تمامًا أنك قد تحتاج أحيانًا إلى وقت إضافي، وأقدّر حرصك على الحفاظ على سجل سدادك.',
      body: [
        'يمكنك تمديد موعد السداد مباشرة من التطبيق: الأموال (في الإمارات) أو المدفوعات (في الكويت) ← اختيار الطلب ← إدارة الطلب ← تمديد تاريخ الاستحقاق، ثم اختيار 7 أو 14 أو 21 يومًا ودفع رسوم التمديد الظاهرة.',
        'ويجب إتمام التمديد قبل تاريخ الاستحقاق، ويمكن استخدامه مرة واحدة لكل دفعة.',
      ],
      next: 'وإذا لم يظهر لك الخيار لهذه الدفعة، أخبرني وسأتحقق من الأمر معك.',
    },
    subject: { en: 'How to extend your due date', ar: 'طريقة تمديد موعد السداد' },
  },
  {
    id: 'bnpl-ext-used',
    topic: 'bnpl-extend',
    title: 'Extension not available (already used / date passed)',
    when: 'The instalment was already extended, or the due date has passed.',
    keys: 'already extended cannot extend again due date passed no extension option لا يمكن التمديد',
    en: {
      ack: 'I truly understand the situation you’re in, and I wish there were more flexibility here.',
      body: ['I’ve checked this instalment, and the extension option is no longer available for it, as the extension can only be used once per instalment and before its due date.'],
      next: 'To avoid late fees and protect your purchase history, we recommend settling the payment as soon as you can through the app. I sincerely hope things get easier for you soon.',
    },
    ar: {
      ack: 'أتفهم تمامًا الظرف الذي تمر به، وكنت أتمنى لو كانت هناك مرونة أكبر في هذا الأمر.',
      body: ['راجعت هذه الدفعة، وخيار التمديد لم يعد متاحًا لها، لأن التمديد يمكن استخدامه مرة واحدة فقط لكل دفعة وقبل تاريخ استحقاقها.'],
      next: 'ولتجنب رسوم التأخير والحفاظ على سجل مشترياتك، ننصحك بسداد الدفعة في أقرب وقت ممكن من خلال التطبيق. وأتمنى صادقًا أن تتيسر أمورك قريبًا.',
    },
    subject: { en: 'About extending your payment', ar: 'بخصوص تمديد الدفعة' },
  },
  {
    id: 'bnpl-late-fee',
    topic: 'bnpl-extend',
    title: 'Late / collection charge applied',
    when: 'The customer asks why a late or collection charge was added.',
    keys: 'late fee collection charge penalty رسوم تأخير رسوم تحصيل',
    tip: 'If the case is eligible for a waiver per the current guide, use the waiver review (decision within 24 hours).',
    en: {
      ack: 'I understand your concern about the charge on your order.',
      body: ['I’ve checked your account, and the charge was applied because the payment remained unpaid after its due date.'],
      next: 'To avoid charges in the future, please make sure payments are completed by the due date, or use the Extend Due Date option before the due date when it’s available.',
    },
    ar: {
      ack: 'أتفهم استفسارك بخصوص الرسوم المضافة على طلبك.',
      body: ['راجعت حسابك، وتم تطبيق الرسوم لأن الدفعة بقيت غير مسددة بعد تاريخ الاستحقاق.'],
      next: 'ولتجنب أي رسوم مستقبلًا، يُرجى التأكد من السداد قبل تاريخ الاستحقاق، أو استخدام خيار تمديد موعد السداد قبل الموعد عند توفره.',
    },
    subject: { en: 'About the charge on your order', ar: 'بخصوص الرسوم على طلبك' },
  },
  {
    id: 'bnpl-avoid-charges',
    topic: 'bnpl-extend',
    title: 'Avoid collection charges – pay or extend before the due date',
    when: 'The customer asks how to avoid charges, or worries about an upcoming due date.',
    keys: 'avoid collection charge late fee pay before due date extend تجنب رسوم التأخير',
    en: {
      ack: 'Good question, and I’m happy to help you avoid any charges.',
      body: ['Please make sure the payment is completed by the due date. If you need more time, you can use the Extend Due Date option in the app before the due date, if it’s available on your account.'],
    },
    ar: {
      ack: 'سؤال في محله، ويسعدني مساعدتك في تجنب أي رسوم.',
      body: ['يُرجى التأكد من إتمام السداد قبل تاريخ الاستحقاق، وإذا احتجت إلى وقت إضافي، يمكنك استخدام خيار تمديد موعد السداد من التطبيق قبل تاريخ الاستحقاق إذا كان متاحًا على حسابك.'],
    },
    subject: { en: 'Avoiding collection charges', ar: 'تجنب رسوم التحصيل' },
    related: ['bnpl-ext-how'],
  },
  {
    id: 'bnpl-waiver',
    topic: 'bnpl-extend',
    title: 'Collection charge review – eligible case (decision within 24 hours)',
    when: 'The case meets the waiver criteria and you submitted the review request.',
    keys: 'waiver waive collection charge refund fee review eligible إعفاء من الرسوم',
    tip: 'Only for cases that meet the waiver criteria. Never promise the outcome.',
    en: {
      ack: 'I’ve reviewed your case, and I can submit it for a collection charge review.',
      body: ['I’ve now submitted the request, and you’ll receive the decision within 24 hours.'],
    },
    ar: {
      ack: 'راجعت حالتك، ويمكنني رفعها لمراجعة رسوم التحصيل.',
      body: ['وقد رفعت الطلب الآن، وستصلك النتيجة خلال 24 ساعة.'],
    },
    subject: { en: 'Your collection charge review', ar: 'مراجعة رسوم التحصيل' },
  },
  {
    id: 'bnpl-hardship',
    topic: 'bnpl-extend',
    title: 'Financial hardship / job loss – raised to the team',
    when: 'The customer can’t pay because of job loss or another hardship.',
    keys: 'lost job hardship cannot pay financial difficulty unemployed فقدان الوظيفة ظروف مالية لا أستطيع السداد',
    tip: 'Be human first. Do not discuss the reason in detail in the ticket; note it in the CIA note and raise it to the team.',
    en: {
      ack: 'I truly understand how difficult this situation must be, and thank you for letting us know.',
      body: ['I’ve raised a request to the relevant team, and they’ll reach out to you within 24–48 hours to discuss the options available.'],
    },
    ar: {
      ack: 'أتفهم تمامًا صعوبة هذا الموقف، وشكرًا لإبلاغنا.',
      body: ['وقد رفعت طلبًا إلى الفريق المختص، وسيتواصل معك خلال 24 إلى 48 ساعة لمناقشة الخيارات المتاحة.'],
    },
    subject: { en: 'Your request has been raised', ar: 'تم رفع طلبك' },
  },
  {
    id: 'bnpl-reminders',
    topic: 'bnpl-extend',
    title: 'Customer annoyed by payment reminders',
    when: 'The customer complains about reminder messages (e.g. waiting for salary).',
    keys: 'reminders messages annoying calls waiting for salary رسائل تذكير الراتب',
    en: {
      ack: 'I’m sorry if the reminders have been bothering you, and I completely understand.',
      body: [
        'The reminders are only there to help you keep a good purchase history, as late days on the account can affect your future purchases.',
        'If you’re waiting for your salary, you can use the Extend Due Date option in the app before the due date to get extra time without affecting your history.',
      ],
    },
    ar: {
      ack: 'أعتذر إذا كانت رسائل التذكير قد سببت لك أي إزعاج، وأتفهم ذلك تمامًا.',
      body: [
        'الهدف من رسائل التذكير هو مساعدتك في الحفاظ على سجل مشتريات جيد، لأن أيام التأخير قد تؤثر على مشترياتك القادمة.',
        'وإذا كنت بانتظار الراتب، يمكنك استخدام خيار تمديد موعد السداد من التطبيق قبل تاريخ الاستحقاق للحصول على وقت إضافي دون التأثير على سجلك.',
      ],
    },
    subject: { en: 'About your payment reminders', ar: 'بخصوص رسائل التذكير بالسداد' },
    related: ['bnpl-ext-how'],
  },

  // ---------------- Making payments ----------------
  {
    id: 'bnpl-pay-how',
    topic: 'bnpl-pay',
    title: 'How to make a payment',
    when: 'The customer wants to pay an instalment or pay early.',
    keys: 'how to pay pay now early payment settle سداد الدفعة ادفع الآن',
    en: {
      ack: 'I’ll be happy to guide you.',
      body: ['You can pay directly from the Tabby app: open the order, select the payment, and tap Pay Now. You can also pay early or settle the full order at any time.'],
    },
    ar: {
      ack: 'يسعدني إرشادك.',
      body: ['يمكنك السداد مباشرة من تطبيق تابي: افتح الطلب، واختر الدفعة، ثم اضغط على "ادفع الآن". ويمكنك أيضًا السداد مبكرًا أو تسوية الطلب بالكامل في أي وقت.'],
    },
    subject: { en: 'How to make your payment', ar: 'طريقة السداد' },
  },
  {
    id: 'bnpl-pay-failed',
    topic: 'bnpl-pay',
    title: 'Payment failed – try another card',
    when: 'A payment attempt was not charged successfully.',
    keys: 'payment failed card declined not charged error الدفع فشل لم يتم الخصم',
    en: {
      ack: 'I’m sorry for the trouble with your payment.',
      body: ['I’ve checked the attempt, and the card wasn’t charged successfully. To avoid more failed attempts, please don’t retry many times in a row.'],
      next: 'You can try another eligible card, or remove and re-add the same card and try once more.',
    },
    ar: {
      ack: 'أعتذر عن الصعوبة التي واجهتها أثناء السداد.',
      body: ['راجعت المحاولة، ولم يتم الخصم من البطاقة بنجاح. وتجنبًا لمزيد من المحاولات غير الناجحة، يُرجى عدم تكرار المحاولة عدة مرات متتالية.'],
      next: 'يمكنك تجربة بطاقة أخرى مؤهلة، أو حذف البطاقة نفسها وإضافتها من جديد ثم المحاولة مرة واحدة.',
    },
    subject: { en: 'About your payment attempt', ar: 'بخصوص محاولة السداد' },
  },
  {
    id: 'bnpl-pay-insufficient',
    topic: 'bnpl-pay',
    title: 'Payment failed – insufficient funds',
    when: 'The bank response shows insufficient balance.',
    keys: 'insufficient funds balance not enough رصيد غير كاف',
    en: {
      ack: 'I’ve checked your payment attempt.',
      body: ['It couldn’t be completed because there weren’t enough funds available on the card at the time.'],
      next: 'Once the card has enough balance, you can try the payment again, or use another eligible card.',
    },
    ar: {
      ack: 'راجعت محاولة السداد.',
      body: ['لم تكتمل العملية لعدم توفر رصيد كافٍ على البطاقة وقت المحاولة.'],
      next: 'وبعد توفر الرصيد الكافي، يمكنك إعادة محاولة السداد، أو استخدام بطاقة أخرى مؤهلة.',
    },
    subject: { en: 'About your payment attempt', ar: 'بخصوص محاولة السداد' },
  },
  {
    id: 'bnpl-pay-bank-declined',
    topic: 'bnpl-pay',
    title: 'Payment declined by the bank',
    when: 'The bank did not approve the transaction.',
    keys: 'bank declined rejected by bank البنك رفض العملية',
    en: {
      ack: 'I understand how inconvenient this is.',
      body: ['I’ve checked the payment attempt, and the transaction wasn’t approved by your bank.'],
      next: 'You can try another eligible card, or contact your bank to check the reason on their side.',
    },
    ar: {
      ack: 'أتفهم مدى الإزعاج في هذا الموقف.',
      body: ['راجعت محاولة السداد، ولم تتم الموافقة على العملية من قبل البنك.'],
      next: 'يمكنك تجربة بطاقة أخرى مؤهلة، أو التواصل مع البنك لمعرفة السبب من جهتهم.',
    },
    subject: { en: 'About your payment attempt', ar: 'بخصوص محاولة السداد' },
  },
  {
    id: 'bnpl-pay-verification',
    topic: 'bnpl-pay',
    title: 'Payment stopped during verification (OTP / 3D Secure)',
    when: 'The payment did not complete because the verification step was interrupted.',
    keys: '3d secure otp verification interrupted closed app التحقق توقف',
    en: {
      ack: 'I’ve checked the payment attempt.',
      body: ['It wasn’t completed because the bank verification step was interrupted.'],
      next: 'Please complete the payment in one go, without closing the app or leaving the payment screen until it’s confirmed.',
    },
    ar: {
      ack: 'راجعت محاولة السداد.',
      body: ['لم تكتمل العملية لأن خطوة التحقق من البنك توقفت قبل انتهائها.'],
      next: 'يُرجى إتمام السداد في خطوة واحدة دون إغلاق التطبيق أو مغادرة شاشة الدفع حتى يظهر التأكيد.',
    },
    subject: { en: 'About your payment attempt', ar: 'بخصوص محاولة السداد' },
  },
  {
    id: 'bnpl-pay-processing',
    topic: 'bnpl-pay',
    title: 'Payment still processing / not reflected yet',
    when: 'The customer paid but the app does not show it yet.',
    keys: 'paid not showing processing pending not reflected دفعت ولم يظهر',
    en: {
      ack: 'Thank you for letting me know, and I understand you want to be sure it went through.',
      body: ['I’ve checked, and the payment is still being processed. Once it’s completed, the status will update automatically on your account, and there’s no need to pay again.'],
    },
    ar: {
      ack: 'شكرًا لإبلاغي، وأتفهم حرصك على التأكد من إتمام السداد.',
      body: ['راجعت الأمر، والدفعة لا تزال قيد المعالجة. وبمجرد اكتمالها ستتحدث الحالة تلقائيًا على حسابك، ولا داعي للسداد مرة أخرى.'],
    },
    subject: { en: 'About your recent payment', ar: 'بخصوص دفعتك الأخيرة' },
  },
  {
    id: 'bnpl-pay-repeat',
    topic: 'bnpl-pay',
    title: 'Payment failed – please don’t retry repeatedly',
    when: 'The customer keeps retrying the same card after failures.',
    keys: 'retry many times multiple payment attempts failed again محاولات دفع متكررة',
    en: {
      ack: 'I can see a few payment attempts didn’t go through, and I understand how frustrating that is.',
      body: ['To avoid further failed attempts, please don’t retry the payment repeatedly. You can try another eligible card, or wait a little before trying again.'],
    },
    ar: {
      ack: 'لاحظت أن بعض محاولات الدفع لم تنجح، وأتفهم مدى الإزعاج في ذلك.',
      body: ['وتجنبًا لمحاولات فاشلة إضافية، يُرجى عدم تكرار محاولة الدفع عدة مرات، ويمكنك تجربة بطاقة أخرى مؤهلة، أو الانتظار قليلًا قبل المحاولة مرة أخرى.'],
    },
    subject: { en: 'About your payment attempts', ar: 'بخصوص محاولات الدفع' },
  },
  {
    id: 'bnpl-pay-received',
    topic: 'bnpl-pay',
    title: 'Payment successfully received',
    when: 'The customer asks if the payment went through and it did.',
    keys: 'payment received confirmed paid successfully تم استلام الدفعة',
    en: {
      ack: 'I’ve checked your account, and I can confirm that your payment was received successfully.',
      body: ['It has been applied to {{detail}}, and the updated status is showing on your account.'],
    },
    ar: {
      ack: 'راجعت حسابك، ويمكنني تأكيد استلام دفعتك بنجاح.',
      body: ['وقد تم تطبيقها على {{detail}}، والحالة المحدثة ظاهرة الآن على حسابك.'],
    },
    subject: { en: 'Your payment has been received', ar: 'تم استلام دفعتك' },
  },
  {
    id: 'bnpl-pay-cannot',
    topic: 'bnpl-pay',
    title: 'Customer can’t pay – app first, then a payment link',
    when: 'The customer can’t find how to pay or the app isn’t working for them.',
    keys: 'cannot pay how to pay app not working payment link لا أستطيع الدفع',
    en: {
      ack: 'I’m here to help you complete the payment.',
      body: ['The best way to pay is through the Tabby app: Money (UAE) or Payments (Kuwait) → choose the order → Pay. If the app isn’t working for you, I can share a payment link instead.'],
    },
    ar: {
      ack: 'أنا هنا لمساعدتك في إتمام الدفع.',
      body: ['أفضل طريقة للدفع هي من خلال تطبيق تابي: الأموال (الإمارات) أو المدفوعات (الكويت) ← اختيار الطلب ← ادفع. وإذا لم يعمل التطبيق معك، يمكنني إرسال رابط دفع بدلًا من ذلك.'],
    },
    subject: { en: 'How to complete your payment', ar: 'طريقة إتمام الدفع' },
    related: ['bnpl-pay-link'],
  },
  {
    id: 'bnpl-pay-link',
    topic: 'bnpl-pay',
    title: 'Send a payment link',
    when: 'The app is not working for the customer and a payment link is allowed.',
    keys: 'payment link pay by link app not working رابط الدفع',
    en: {
      ack: 'No problem at all, I can help you complete the payment using a payment link.',
      body: ['Here is your link: {{link}}'],
      next: 'Please complete the payment in one session, and let me know if you face anything.',
    },
    ar: {
      ack: 'لا مشكلة إطلاقًا، يمكنني مساعدتك في إتمام السداد من خلال رابط دفع.',
      body: ['هذا هو الرابط: {{link}}'],
      next: 'يُرجى إتمام السداد في جلسة واحدة، وأخبرني إذا واجهت أي شيء.',
    },
    subject: { en: 'Your payment link', ar: 'رابط الدفع الخاص بك' },
  },
  {
    id: 'bnpl-transfer-received',
    topic: 'bnpl-pay',
    title: 'Bank transfer received',
    when: 'The customer paid by bank transfer and it has arrived.',
    keys: 'bank transfer received paid by transfer iban arrived تم استلام التحويل',
    en: {
      ack: 'I’ve checked the transfer details, and I can confirm that your transfer has been received.',
      body: ['It will be applied to your account within the usual processing time.'],
    },
    ar: {
      ack: 'راجعت تفاصيل التحويل، ويمكنني تأكيد استلام تحويلك.',
      body: ['وسيتم تطبيقه على حسابك خلال مدة المعالجة المعتادة.'],
    },
    subject: { en: 'Your transfer has been received', ar: 'تم استلام تحويلك' },
  },
  {
    id: 'bnpl-transfer-pending',
    topic: 'bnpl-pay',
    title: 'Bank transfer not reflected yet',
    when: 'The customer sent a bank transfer that isn’t showing on the account yet.',
    keys: 'bank transfer not reflected not showing sent transfer pending التحويل لم يظهر',
    tip: 'Ask for the transfer receipt if it is past the usual time, then investigate.',
    en: {
      ack: 'I’ve checked your account, and the transfer isn’t reflected yet.',
      body: ['Once the transfer is received and matched to your account, the amount will be added accordingly.'],
      next: 'If it still isn’t showing after the usual bank processing time, please send us the transfer receipt so we can trace it.',
    },
    ar: {
      ack: 'راجعت حسابك، ولم يظهر التحويل بعد.',
      body: ['وفور استلام التحويل ومطابقته مع حسابك، سيُضاف المبلغ بحسب ذلك.'],
      next: 'وإذا لم يظهر بعد مدة المعالجة المعتادة لدى البنك، يُرجى إرسال إيصال التحويل حتى نتمكن من تتبعه.',
    },
    subject: { en: 'About your bank transfer', ar: 'بخصوص تحويلك البنكي' },
  },
  {
    id: 'bnpl-viban',
    topic: 'bnpl-pay',
    title: 'Pay by bank transfer to the Virtual IBAN',
    when: 'The account shows a Tabby Virtual IBAN for repayments.',
    keys: 'virtual iban pay by bank transfer iban repayment آيبان افتراضي تحويل بنكي',
    tip: 'Share only the Virtual IBAN shown on this customer’s account.',
    en: {
      ack: 'Sure, you can pay by bank transfer.',
      body: ['Please transfer the amount to the Tabby Virtual IBAN shown for your account. This IBAN is linked to your account only, so please don’t reuse it for a different transfer without contacting us first.'],
    },
    ar: {
      ack: 'بالتأكيد، يمكنك السداد عن طريق التحويل البنكي.',
      body: ['يُرجى تحويل المبلغ إلى رقم الآيبان الافتراضي من تابي الظاهر لحسابك، وهذا الرقم مرتبط بحسابك فقط، لذلك يُرجى عدم استخدامه لتحويل آخر قبل التواصل معنا.'],
    },
    subject: { en: 'Paying by bank transfer', ar: 'السداد عن طريق التحويل البنكي' },
  },
  {
    id: 'bnpl-card-add',
    topic: 'bnpl-pay',
    title: 'Add / remove a card or set the default card',
    when: 'The customer wants to manage the bank cards on the account.',
    keys: 'add card remove card delete card default card payment methods إضافة بطاقة حذف بطاقة البطاقة الافتراضية',
    en: {
      ack: 'Sure, you can manage your cards directly from the app.',
      body: [
        'To add a card: Profile → Payment methods → Add new payment method, then enter the card details. A small verification amount (1 AED / 0.080 KWD) is held and returned immediately.',
        'To remove a card: Profile → Payment methods → choose the card → tap the arrow → Remove. You may need to settle any outstanding instalments on that card first.',
        'To choose the card for automatic payments: Profile → Payment methods → choose the card → Set as default card.',
      ],
    },
    ar: {
      ack: 'بالتأكيد، يمكنك إدارة بطاقاتك مباشرة من التطبيق.',
      body: [
        'لإضافة بطاقة: الملف الشخصي ← طرق الدفع ← إضافة طريقة دفع جديدة، ثم إدخال بيانات البطاقة. سيتم حجز مبلغ تحقق بسيط (1 درهم / 0.080 دينار) وإعادته فورًا.',
        'لحذف بطاقة: الملف الشخصي ← طرق الدفع ← اختيار البطاقة ← الضغط على السهم ← إزالة، وقد يلزم سداد أي أقساط مستحقة على هذه البطاقة أولًا.',
        'ولاختيار البطاقة الخاصة بالسداد التلقائي: الملف الشخصي ← طرق الدفع ← اختيار البطاقة ← تعيين كبطاقة افتراضية.',
      ],
    },
    subject: { en: 'Managing your payment cards', ar: 'إدارة بطاقات الدفع' },
  },

  // ---------------- Unexpected bank deduction (flow) ----------------
  {
    id: 'ded-ask',
    topic: 'bnpl-deduct',
    title: 'Unrecognized deduction – ask for the bank message',
    when: 'Step 1: the customer reports a deduction from their bank card they don’t recognize.',
    keys: 'deduction unknown charge bank card deducted money taken خصم غير معروف مبلغ مخصوم انخصم سحب من بطاقتي',
    tip: 'Then check payment gateway: saved on another account / failed attempt / the customer’s own instalment.',
    en: {
      ack: 'I completely understand your concern about this deduction, and I’ll help you get to the bottom of it.',
      body: ['To check it accurately, could you please share a screenshot of the debit message from your bank showing: Tabby as the merchant, the amount deducted, the date and time, and the last four digits of the card used?'],
      next: 'Please hide your full card number. Once I receive it, I’ll review the transaction right away.',
    },
    ar: {
      ack: 'أتفهم تمامًا قلقك بخصوص هذا الخصم، وسأساعدك في توضيح الأمر بالكامل.',
      body: ['حتى أتمكن من مراجعته بدقة، يُرجى مشاركة لقطة شاشة لرسالة الخصم من البنك يظهر فيها: اسم تابي كجهة الخصم، والمبلغ المخصوم، والتاريخ والوقت، وآخر أربعة أرقام من البطاقة المستخدمة.'],
      next: 'يُرجى إخفاء رقم البطاقة الكامل، وفور استلامها سأراجع العملية مباشرة.',
    },
    subject: { en: 'About the deduction on your card', ar: 'بخصوص الخصم على بطاقتك' },
  },
  {
    id: 'ded-other-account',
    topic: 'bnpl-deduct',
    title: 'Deduction – card saved on another Tabby account',
    when: 'Step 2: the card is saved on someone else’s Tabby account. Arrange a call.',
    keys: 'card used another account family friend someone else بطاقتي على حساب شخص آخر',
    tip: 'Do not share the other account’s details. Arrange a call to explain.',
    en: {
      ack: 'Thank you for sharing the details. I truly understand your concern, and I appreciate you checking this with us.',
      body: ['I’ve reviewed the transaction, and to explain its source clearly, we’d like to speak with you by phone.'],
      next: 'Could you please share a convenient time for us to call you?',
    },
    ar: {
      ack: 'شكرًا لمشاركة التفاصيل، وأتفهم تمامًا قلقك، وأقدّر تواصلك معنا للتحقق من الأمر.',
      body: ['راجعت العملية، وحتى نوضح لك مصدرها بشكل دقيق، نود التواصل معك هاتفيًا.'],
      next: 'يُرجى تزويدنا بوقت مناسب للاتصال بك.',
    },
    subject: { en: 'About the deduction on your card', ar: 'بخصوص الخصم على بطاقتك' },
  },
  {
    id: 'ded-call-answered',
    topic: 'bnpl-deduct',
    title: 'Deduction – after the call (recognised family / friend)',
    when: 'Step 3a: you spoke with the customer and they recognise the person using the card.',
    keys: 'recognised card user family friend after call تعرف على مستخدم البطاقة',
    en: {
      ack: 'It was a pleasure speaking with you, and I hope the call clarified everything.',
      body: [
        'As discussed, the amount was deducted because your card is saved on the Tabby account of someone you know.',
        'If you’d like to stop future charges, the account holder can remove the card from their app (Profile → Payment methods → choose the card → Remove).',
      ],
    },
    ar: {
      ack: 'سعدت بالتحدث معك، وأتمنى أن تكون المكالمة قد أوضحت كل شيء.',
      body: [
        'كما تم التوضيح، تم خصم المبلغ لأن بطاقتك محفوظة على حساب تابي لشخص تعرفه.',
        'وإذا رغبت في إيقاف أي خصومات مستقبلية، يمكن لصاحب الحساب حذف البطاقة من التطبيق (الملف الشخصي ← طرق الدفع ← اختيار البطاقة ← إزالة).',
      ],
    },
    subject: { en: 'Following our call', ar: 'متابعةً لمكالمتنا' },
  },
  {
    id: 'ded-call-no-answer',
    topic: 'bnpl-deduct',
    title: 'Deduction – we called but no answer',
    when: 'Step 3b: you tried to call about the card usage and could not reach the customer.',
    keys: 'no answer call card usage لم يرد',
    en: {
      ack: 'We tried to reach you by phone regarding the deduction on your bank card, but unfortunately we couldn’t connect.',
      body: ['Whenever you’re ready to talk, please reply to this conversation with a convenient time, and we’ll call you to explain the matter clearly.'],
    },
    ar: {
      ack: 'حاولنا التواصل معك هاتفيًا بخصوص الخصم على بطاقتك البنكية، ولكن للأسف لم نتمكن من الوصول إليك.',
      body: ['وعندما يكون الوقت مناسبًا لك، يُرجى الرد على هذه المحادثة بوقت مناسب، وسنتصل بك لتوضيح الأمر.'],
    },
    subject: { en: 'We tried to call you', ar: 'حاولنا التواصل معك' },
  },
  {
    id: 'ded-other-details',
    topic: 'bnpl-deduct',
    title: 'Customer asks for the other account holder’s details',
    when: 'The customer wants information about the other person’s account.',
    keys: 'who used my card name of person details privacy من استخدم بطاقتي',
    en: {
      ack: 'Thank you for clarifying the situation, and I understand why you’d like to know more.',
      body: ['For privacy and security reasons, we’re unable to share details about another person’s account or transactions.'],
      next: 'If the account holder needs assistance, they’re welcome to contact Tabby directly, and we’ll be glad to help them.',
    },
    ar: {
      ack: 'شكرًا لتوضيح الموقف، وأتفهم رغبتك في معرفة المزيد.',
      body: ['حفاظًا على الخصوصية والأمان، لا يمكننا مشاركة أي تفاصيل عن حساب شخص آخر أو معاملاته.'],
      next: 'وإذا احتاج صاحب الحساب إلى أي مساعدة، يمكنه التواصل مع تابي مباشرة وسنسعد بمساعدته.',
    },
    subject: { en: 'About your request', ar: 'بخصوص طلبك' },
  },
  {
    id: 'ded-failed-hold',
    topic: 'bnpl-deduct',
    title: 'Deduction – failed attempt / amount held by the bank',
    when: 'Step 2: the gateway shows the attempt failed, so Tabby did not receive the amount.',
    keys: 'failed transaction held amount pending bank hold reversal مبلغ محجوز عملية فاشلة',
    en: {
      ack: 'I completely understand your concern, and I’m sorry for any inconvenience.',
      body: [
        'I’ve checked the transaction, and the payment attempt didn’t go through, so the amount wasn’t received by Tabby. The reference for this attempt is {{reference}}.',
        'In this case the bank may hold the amount temporarily, and it’s usually released automatically within a few working days.',
      ],
      next: 'You can contact your bank with this reference to check the hold. If they confirm the amount wasn’t returned, please send us a recent bank statement and we’ll follow up with the payment gateway.',
    },
    ar: {
      ack: 'أتفهم قلقك تمامًا، وأعتذر عن أي إزعاج.',
      body: [
        'راجعت العملية، ومحاولة الدفع لم تكتمل، لذلك لم يصل المبلغ إلى تابي. والرقم المرجعي لهذه المحاولة هو {{reference}}.',
        'وفي هذه الحالة قد يحتجز البنك المبلغ مؤقتًا، وعادةً ما يتم الإفراج عنه تلقائيًا خلال عدة أيام عمل.',
      ],
      next: 'يمكنك التواصل مع البنك بهذا الرقم المرجعي للتحقق من الحجز، وإذا أكد البنك عدم إعادة المبلغ، يُرجى إرسال كشف حساب حديث لنا وسنتابع الأمر مع بوابة الدفع.',
    },
    subject: { en: 'About the deduction on your card', ar: 'بخصوص الخصم على بطاقتك' },
  },
  {
    id: 'ded-own-instalment',
    topic: 'bnpl-deduct',
    title: 'Deduction – it was the customer’s own instalment',
    when: 'Step 2: the deduction is a scheduled instalment on the customer’s own order.',
    keys: 'autopay automatic deduction instalment due my order خصم تلقائي قسط',
    en: {
      ack: 'Thank you for your patience while I checked this.',
      body: ['The deduction was the scheduled instalment for one of your Tabby orders, collected automatically from your saved card on its due date. You can see the payment under the order in the app.'],
    },
    ar: {
      ack: 'شكرًا لصبرك أثناء مراجعة الأمر.',
      body: ['الخصم كان دفعة مستحقة لأحد طلباتك في تابي، وتم تحصيلها تلقائيًا من بطاقتك المحفوظة في موعدها، ويمكنك رؤية الدفعة ضمن تفاصيل الطلب في التطبيق.'],
    },
    subject: { en: 'About the deduction on your card', ar: 'بخصوص الخصم على بطاقتك' },
  },

  // ---------------- KNET extra charge (Kuwait) ----------------
  {
    id: 'knet-explain',
    topic: 'bnpl-knet',
    title: 'KNET – extra amount on an instalment',
    when: 'Step 1 (Kuwait): the deducted amount is slightly higher than the instalment.',
    keys: 'knet extra charge fee kuwait more than instalment bank fee كي نت رسوم إضافية',
    tip: 'Attach the payment-gateway screenshot showing Tabby collected only the instalment amount.',
    en: {
      ack: 'I truly understand the inconvenience of seeing an extra amount on your payment, and I’m here to clarify everything for you.',
      body: [
        'The additional amount isn’t charged by Tabby. As the payment was made with a bank card on the KNET network, the bank or KNET can sometimes apply a fee to the transaction.',
        'I’ve attached a screenshot from our payment gateway showing that Tabby collected only the instalment amount, with no extra charges from our side.',
      ],
    },
    ar: {
      ack: 'أتفهم تمامًا الإزعاج من ظهور مبلغ إضافي على دفعتك، وأنا هنا لتوضيح كل التفاصيل لك.',
      body: [
        'المبلغ الإضافي لا يتم خصمه من طرف تابي، فبما أن الدفع تم ببطاقة بنكية على شبكة كي نت، قد يقوم البنك أو كي نت أحيانًا بفرض رسوم على العملية.',
        'وأرفقت لك لقطة شاشة من بوابة الدفع توضح أن تابي قامت بخصم قيمة الدفعة فقط، دون أي رسوم إضافية من جانبنا.',
      ],
    },
    subject: { en: 'About the extra amount on your payment', ar: 'بخصوص المبلغ الإضافي على دفعتك' },
  },
  {
    id: 'knet-compensate',
    topic: 'bnpl-knet',
    title: 'KNET – difference added to the Tabby wallet',
    when: 'Step 2 (Kuwait): Tabby covers the extra fee by crediting the wallet.',
    keys: 'compensate wallet refund difference knet cashback funds تعويض المحفظة',
    en: {
      ack: 'Your satisfaction matters to us, so Tabby will cover this extra cost for you.',
      body: ['We’ve added the difference to your Tabby wallet, and it will appear within 24 hours under Funds / Cashback in your Profile. You can use it toward your upcoming instalments.'],
      next: 'If this happens again on a future payment, just send us a screenshot of the deduction message and we’ll take care of it right away. 🙏',
    },
    ar: {
      ack: 'رضاك يهمنا، لذلك ستتحمل تابي هذه التكلفة الإضافية عنك.',
      body: ['أضفنا الفرق إلى محفظتك في تابي، وسيظهر خلال 24 ساعة ضمن قسم الأموال / الكاش باك في الملف الشخصي، ويمكنك استخدامه في سداد دفعاتك القادمة.'],
      next: 'وإذا تكرر الأمر في أي دفعة قادمة، فقط أرسل لنا لقطة شاشة لرسالة الخصم وسنتولى الأمر فورًا. 🙏',
    },
    subject: { en: 'We’ve covered the extra amount for you', ar: 'تحملنا المبلغ الإضافي عنك' },
  },
];
