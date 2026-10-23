import type { Scenario } from './types';

// Conversation essentials: greetings, hold, empathy, follow-ups, closings
export const GENERAL: Scenario[] = [
  // ---------------- Greetings & handover ----------------
  {
    id: 'gen-greet',
    topic: 'gen-greet',
    title: 'Greeting – new chat',
    when: 'First message when you pick up a new chat.',
    keys: 'hello hi welcome start مرحبا اهلا ترحيب',
    channels: ['chat'],
    en: {
      ack: 'Hello, and welcome to Tabby! My name is {{agent_name}}, and I’m happy to be assisting you today.',
      body: ['How can I help you today?'],
    },
    ar: {
      ack: 'مرحبًا، وأهلًا بك في تابي! معك {{agent_name}}، ويسعدني أن أكون في خدمتك اليوم.',
      body: ['كيف يمكنني مساعدتك؟'],
    },
  },
  {
    id: 'gen-takeover',
    topic: 'gen-greet',
    title: 'Taking over (after the assistant or a colleague)',
    when: 'You receive a chat that the virtual assistant or another agent already started.',
    keys: 'take over transferred bot ai colleague review chat استلام تحويل',
    channels: ['chat'],
    en: {
      ack: 'Thank you so much for waiting. My name is {{agent_name}}, and I’ll be taking care of your request from here.',
      body: ['I’ve read through the conversation, so you won’t need to repeat anything. Please give me a moment to review your account.'],
    },
    ar: {
      ack: 'شكرًا جزيلًا لانتظارك. معك {{agent_name}}، وسأتولى متابعة طلبك من الآن.',
      body: ['اطلعت على المحادثة بالكامل، فلا داعي لإعادة شرح أي شيء. اسمح لي بلحظات لمراجعة حسابك.'],
    },
  },
  {
    id: 'gen-confirm',
    topic: 'gen-greet',
    title: 'Confirm what the customer is asking',
    when: 'The question is not fully clear and you want to confirm before checking.',
    keys: 'clarify understand confirm inquiry توضيح تأكيد',
    channels: ['chat'],
    en: {
      ack: 'Thank you for explaining. Just to make sure I help with the right thing, you’re asking about {{issue}}, is that correct?',
      body: [],
    },
    ar: {
      ack: 'شكرًا على التوضيح. حتى أتأكد من أنني أساعدك في الأمر الصحيح، استفسارك بخصوص {{issue}}، أليس كذلك؟',
      body: [],
    },
  },
  {
    id: 'gen-need-details',
    topic: 'gen-greet',
    title: 'Ask for the order details',
    when: 'You need the order number, store name or purchase date to find the order.',
    keys: 'order number store purchase details رقم الطلب المتجر',
    channels: ['chat'],
    en: {
      ack: 'I’ll be glad to check this for you.',
      body: ['Could you please share the order number or the store name, along with the approximate purchase date?'],
    },
    ar: {
      ack: 'يسعدني التحقق من الأمر لك.',
      body: ['هل يمكنك مشاركة رقم الطلب أو اسم المتجر، مع تاريخ الشراء التقريبي؟'],
    },
  },

  // ---------------- Hold & updates ----------------
  {
    id: 'gen-hold',
    topic: 'gen-hold',
    title: 'Ask to hold while you check',
    when: 'You need a few minutes to review the account.',
    keys: 'wait hold moment check account انتظار لحظات',
    channels: ['chat'],
    en: {
      ack: 'I completely understand. Please allow me a few minutes to review your account, so I can give you accurate information.',
      body: [],
    },
    ar: {
      ack: 'أتفهم ذلك تمامًا. اسمح لي ببضع دقائق لمراجعة حسابك، حتى أتمكن من تزويدك بمعلومات دقيقة.',
      body: [],
    },
  },
  {
    id: 'gen-more-time',
    topic: 'gen-hold',
    title: 'Need a few more minutes',
    when: 'You are still checking and the customer has been waiting.',
    keys: 'more time still checking patience مزيد من الوقت',
    channels: ['chat'],
    en: {
      ack: 'Thank you for your patience. I’m still reviewing the details and need just a couple more minutes to complete the check.',
      body: [],
    },
    ar: {
      ack: 'شكرًا لصبرك. ما زلت أراجع التفاصيل، وأحتاج إلى دقيقتين إضافيتين فقط لإكمال المراجعة.',
      body: [],
    },
  },
  {
    id: 'gen-back',
    topic: 'gen-hold',
    title: 'Back from hold',
    when: 'You finished checking and are about to explain.',
    keys: 'back thank you for waiting reviewed شكرا لانتظارك',
    channels: ['chat'],
    en: {
      ack: 'Thank you for waiting. I’ve reviewed your account, and I’d like to clarify a few details for you.',
      body: [],
    },
    ar: {
      ack: 'شكرًا لانتظارك. راجعت حسابك، وأود توضيح بعض التفاصيل لك.',
      body: [],
    },
  },
  {
    id: 'gen-misunderstanding',
    topic: 'gen-hold',
    title: 'Back from hold – there is a misunderstanding',
    when: 'The account shows something different from what the customer believes.',
    keys: 'misunderstanding wrong clarify سوء فهم',
    channels: ['chat'],
    en: {
      ack: 'Thank you for your patience. I’ve checked the account, and I believe there may be a small misunderstanding. Let me clarify it for you.',
      body: [],
    },
    ar: {
      ack: 'شكرًا لصبرك. بعد مراجعة الحساب، أعتقد أن هناك سوء فهم بسيط، ويسعدني توضيحه لك.',
      body: [],
    },
  },
  {
    id: 'gen-tech-delay',
    topic: 'gen-hold',
    title: 'Sorry for the delay (technical issue on your side)',
    when: 'You were slow to reply because of a system issue.',
    keys: 'delay sorry technical issue system تأخير مشكلة تقنية',
    channels: ['chat'],
    en: {
      ack: 'Thank you so much for your patience, and I’m sorry for the delay.',
      body: ['I had a small technical issue on my side, but I’m here now and ready to help you.'],
    },
    ar: {
      ack: 'شكرًا جزيلًا لصبرك، وأعتذر عن التأخير.',
      body: ['واجهت مشكلة تقنية بسيطة من جهتي، لكنني الآن معك وجاهز لمساعدتك.'],
    },
  },

  // ---------------- Empathy & difficult moments ----------------
  {
    id: 'gen-frustrated',
    topic: 'gen-empathy',
    title: 'Customer is frustrated with the answer',
    when: 'The customer is upset because the policy does not allow what they want.',
    keys: 'angry upset frustrated not happy unfair زعلان منزعج غير راضي',
    channels: ['chat'],
    tip: 'Acknowledge the feeling, repeat the reason in one line, then offer what IS possible. Do not repeat the same policy text again and again.',
    en: {
      ack: 'I truly understand how disappointing this is, and I’m sorry this isn’t the answer you were hoping for.',
      body: [
        'I want to be completely transparent with you, so you have the right information and nothing is left unclear.',
        'While I can’t change this decision, I’ll make sure you know every option that is available to you.',
      ],
    },
    ar: {
      ack: 'أتفهم تمامًا مدى انزعاجك، وأعتذر لأن هذه ليست الإجابة التي كنت تتمنى سماعها.',
      body: [
        'أحرص على أن أكون واضحًا معك تمامًا، حتى تكون لديك المعلومات الصحيحة ولا يبقى أي أمر غير واضح.',
        'رغم أنني لا أستطيع تغيير هذا القرار، سأتأكد من أن تعرف جميع الخيارات المتاحة لك.',
      ],
    },
  },
  {
    id: 'gen-handover',
    topic: 'gen-empathy',
    title: 'Handing the chat to a colleague',
    when: 'Your shift or break starts and the chat must move to a colleague.',
    keys: 'handover transfer colleague shift تحويل زميل',
    channels: ['chat'],
    en: {
      ack: 'I’m handing this chat over to a colleague, who will review our conversation and continue with you shortly.',
      body: ['You won’t need to repeat anything. Thank you for your patience.'],
    },
    ar: {
      ack: 'سيتم تحويل المحادثة الآن إلى أحد الزملاء، وسيقوم بمراجعة ما تم مناقشته ومتابعة مساعدتك قريبًا.',
      body: ['لن تحتاج إلى إعادة شرح أي شيء. شكرًا لصبرك.'],
    },
  },
  {
    id: 'gen-handover-upset',
    topic: 'gen-empathy',
    title: 'Customer upset about talking to several agents',
    when: 'The customer complains that the chat keeps moving between agents.',
    keys: 'many agents transferred again repeat shifts عدة موظفين',
    channels: ['chat'],
    en: {
      ack: 'I’m truly sorry for the frustration, and I completely understand why speaking with several agents is annoying.',
      body: [
        'Our team works in shifts so that support is available throughout the day. When a shift ends or a scheduled break starts, the chat moves to the next available agent so you don’t have to wait.',
        'I’ve now read the full conversation, and I’ll take care of your case from here.',
      ],
    },
    ar: {
      ack: 'أعتذر بصدق عن هذا الإزعاج، وأتفهم تمامًا أن التحدث مع أكثر من موظف أمر مزعج.',
      body: [
        'يعمل فريقنا بنظام المناوبات حتى يكون الدعم متاحًا طوال اليوم، وعند انتهاء مناوبة أو بدء استراحة مجدولة تنتقل المحادثة إلى الموظف المتاح التالي حتى لا تضطر إلى الانتظار.',
        'اطلعت الآن على المحادثة بالكامل، وسأتولى متابعة حالتك من هذه النقطة.',
      ],
    },
  },
  {
    id: 'gen-callback',
    topic: 'gen-empathy',
    title: 'Arrange a phone call',
    when: 'The case is easier to explain by phone, or the customer asks for a call.',
    keys: 'call phone call back convenient time اتصال مكالمة',
    en: {
      ack: 'I understand that this would be easier to discuss over the phone.',
      body: ['Could you please share a convenient time for us to call you, so we can go through the details together?'],
    },
    ar: {
      ack: 'أتفهم أن مناقشة هذا الأمر هاتفيًا ستكون أسهل.',
      body: ['يُرجى تزويدنا بوقت مناسب للتواصل معك هاتفيًا، حتى نراجع التفاصيل معًا.'],
    },
    subject: { en: 'Arranging a call about your request', ar: 'تحديد موعد للتواصل بخصوص طلبك' },
  },
  {
    id: 'gen-call-no-answer',
    topic: 'gen-empathy',
    title: 'We called but could not reach the customer',
    when: 'You tried to call and there was no answer, or the call dropped.',
    keys: 'no answer unreachable missed call dropped لم نتمكن من الوصول',
    en: {
      ack: 'We tried to reach you by phone, but unfortunately we were unable to connect.',
      body: ['Please reply with a convenient time for a call, and we’ll be happy to explain everything related to your request.'],
      next: 'You can also reply here in writing at any time if you prefer.',
    },
    ar: {
      ack: 'حاولنا التواصل معك هاتفيًا، ولكن للأسف لم نتمكن من الوصول إليك.',
      body: ['يُرجى الرد بوقت مناسب للاتصال، ويسعدنا توضيح كل ما يتعلق بطلبك.'],
      next: 'ويمكنك أيضًا الرد هنا كتابيًا في أي وقت إذا كان ذلك أنسب لك.',
    },
    subject: { en: 'We tried to call you', ar: 'حاولنا التواصل معك' },
  },

  // ---------------- Escalation & follow-ups ----------------
  {
    id: 'gen-escalated',
    topic: 'gen-follow',
    title: 'Raised to the relevant team (24–48 hours)',
    when: 'The case genuinely needs another team and you have raised it.',
    keys: 'escalate escalated relevant team 24 48 hours تصعيد الفريق المختص',
    tip: 'Escalate only when the case needs it (missing refund after SLA, mismatch, fraud, technical issue), not because the customer is unhappy with a policy answer.',
    en: {
      ack: 'I understand how important it is to get this resolved.',
      body: ['I’ve reviewed your case and raised it with the relevant team for further review.'],
      next: 'You’ll receive an update within 24–48 hours, once they complete their review.',
    },
    ar: {
      ack: 'أتفهم مدى أهمية حل هذا الأمر بالنسبة لك.',
      body: ['راجعت حالتك، وقمت برفعها إلى الفريق المختص لمراجعتها بشكل أدق.'],
      next: 'ستصلك التحديثات خلال 24 إلى 48 ساعة بعد انتهاء الفريق من المراجعة.',
    },
    subject: { en: 'Your request is under review', ar: 'طلبك قيد المراجعة' },
  },
  {
    id: 'gen-pending-update',
    topic: 'gen-follow',
    title: 'Customer asks for an update (still pending)',
    when: 'The case is with another team and no answer has arrived yet.',
    keys: 'update any news follow up still waiting متابعة تحديث',
    en: {
      ack: 'Thank you for following up, and I understand you’re waiting for an answer.',
      body: ['Your case is still being reviewed by the relevant team, and we’re following up with them closely.'],
      next: 'As soon as we receive their update, we’ll share it with you right away.',
    },
    ar: {
      ack: 'شكرًا لمتابعتك، وأتفهم أنك بانتظار الرد.',
      body: ['لا تزال حالتك قيد المراجعة لدى الفريق المختص، ونتابع معهم باستمرار.'],
      next: 'وفور وصول التحديث، سنشاركه معك مباشرة.',
    },
    subject: { en: 'Update on your request', ar: 'تحديث بخصوص طلبك' },
  },
  {
    id: 'gen-duplicate',
    topic: 'gen-follow',
    title: 'Duplicate ticket – handled on the other ticket',
    when: 'The same concern is already being handled on another open ticket.',
    keys: 'duplicate another ticket same issue مكرر تذكرة أخرى',
    en: {
      ack: 'Thank you for reaching out. We can see that your concern is already being handled on another open ticket.',
      body: ['To avoid duplication and get you a faster answer, we’ll continue assisting you through the active ticket, and this one will be closed.'],
    },
    ar: {
      ack: 'شكرًا لتواصلك. لاحظنا أن استفسارك قيد المتابعة بالفعل من خلال تذكرة أخرى مفتوحة.',
      body: ['وتجنبًا للتكرار وحرصًا على سرعة الرد، سنواصل مساعدتك من خلال التذكرة النشطة، وسيتم إغلاق هذه التذكرة.'],
    },
    subject: { en: 'Your request is being handled on another ticket', ar: 'طلبك قيد المتابعة في تذكرة أخرى' },
  },
  {
    id: 'gen-disagree',
    topic: 'gen-follow',
    title: 'Customer disagrees with the previous answer',
    when: 'The customer contacts again about a case that was already answered.',
    keys: 'disagree previous resolution again repeated complaint اعتراض نفس الشكوى',
    tip: 'No new information: stand by the outcome politely. New information or proof: escalate (24–48h).',
    en: {
      ack: 'I understand you’re not satisfied with the previous outcome, and I appreciate you taking the time to contact us again.',
      body: [
        'I’ve reviewed the history of your case. The previous outcome was based on the details available on your account.',
        'If you have any new information or documents that weren’t shared before, please send them and I’ll make sure they’re reviewed.',
      ],
    },
    ar: {
      ack: 'أتفهم عدم رضاك عن النتيجة السابقة، وأقدّر تواصلك معنا مرة أخرى.',
      body: [
        'راجعت سجل حالتك، وكانت النتيجة السابقة مبنية على التفاصيل المتوفرة في حسابك.',
        'إذا كانت لديك أي معلومات أو مستندات جديدة لم تتم مشاركتها من قبل، يُرجى إرسالها وسأحرص على مراجعتها.',
      ],
    },
    subject: { en: 'About your previous request', ar: 'بخصوص طلبك السابق' },
  },
  {
    id: 'gen-need-proof',
    topic: 'gen-follow',
    title: 'Need a screenshot / proof to continue',
    when: 'You cannot continue without a document or screenshot from the customer.',
    keys: 'screenshot proof document attach send لقطة شاشة إثبات',
    en: {
      ack: 'I’d be glad to look into this further for you.',
      body: ['To continue reviewing your case, could you please share {{proof}}?'],
      next: 'Once we receive it, we’ll continue with the next step right away.',
    },
    ar: {
      ack: 'يسعدني متابعة الأمر لك.',
      body: ['لمواصلة مراجعة حالتك، يُرجى مشاركة {{proof}}.'],
      next: 'وفور استلامه، سنكمل الخطوة التالية مباشرة.',
    },
    subject: { en: 'Information needed for your request', ar: 'معلومات مطلوبة لاستكمال طلبك' },
  },
  {
    id: 'gen-resolved',
    topic: 'gen-follow',
    title: 'Issue fully resolved',
    when: 'You completed the required action and the account shows the update.',
    keys: 'resolved done fixed completed تم الحل',
    en: {
      ack: 'Good news! I’ve completed the required action, and your request has now been resolved.',
      body: ['The updated status is already reflected on your account.'],
    },
    ar: {
      ack: 'خبر سار! نفّذت الإجراء المطلوب، وتم حل طلبك بالفعل.',
      body: ['والتحديث ظاهر الآن على حسابك.'],
    },
    subject: { en: 'Your request has been resolved', ar: 'تم حل طلبك' },
  },
  {
    id: 'gen-contact',
    topic: 'gen-follow',
    title: 'Contact numbers and working hours',
    when: 'The customer asks how to reach Tabby by phone or chat.',
    keys: 'phone number hotline contact hours call center رقم التواصل أوقات العمل',
    tip: 'Numbers from the team sheets (UAE 800 82229, Kuwait +965 2227 0163). Check the current knowledge base if unsure.',
    en: {
      ack: 'You can reach us at any time through the chat in the Tabby app: open Profile and tap Contact Us.',
      body: ['Our phone support is available every day from 9 AM to 10 PM (Dubai time):\nUAE: 800 82229\nKuwait: +965 2227 0163'],
    },
    ar: {
      ack: 'يمكنك التواصل معنا في أي وقت من خلال المحادثة في تطبيق تابي: افتح الملف الشخصي واضغط على "تواصل معنا".',
      body: ['والدعم الهاتفي متاح يوميًا من الساعة 9 صباحًا حتى 10 مساءً بتوقيت دبي:\nالإمارات: 800 82229\nالكويت: +965 2227 0163'],
    },
    subject: { en: 'How to contact Tabby', ar: 'طرق التواصل مع تابي' },
  },

  // ---------------- Closing ----------------
  {
    id: 'gen-close-anything',
    topic: 'gen-close',
    title: 'Anything else I can help with?',
    when: 'You answered the question and want to check before closing.',
    keys: 'anything else further assistance هل هناك شيء آخر',
    channels: ['chat'],
    en: {
      ack: 'I hope this clarifies everything for you. Is there anything else I can help you with today?',
      body: [],
    },
    ar: {
      ack: 'أتمنى أن يكون التوضيح قد أجاب على استفسارك. هل هناك أي شيء آخر يمكنني مساعدتك به اليوم؟',
      body: [],
    },
  },
  {
    id: 'gen-close-final',
    topic: 'gen-close',
    title: 'Final closing + survey + notifications',
    when: 'The customer has nothing else; close warmly.',
    keys: 'goodbye bye survey rating notifications thanks closing إغلاق تقييم استبيان',
    channels: ['chat'],
    en: {
      ack: 'It was truly a pleasure assisting you today. Thank you for choosing Tabby!',
      body: [
        'Your opinion matters to us. After this chat, you’ll receive a short survey, and we’d really appreciate a moment of your time to share your experience.',
        'To make sure you never miss an important update from Tabby, please keep notifications enabled in your device settings. Have a wonderful day!',
      ],
    },
    ar: {
      ack: 'سعدت جدًا بخدمتك اليوم، وشكرًا لاختيارك تابي!',
      body: [
        'رأيك يهمنا، وبعد إغلاق هذه المحادثة سيصلك استبيان قصير، ونقدّر كثيرًا مشاركتنا تجربتك.',
        'وحتى لا تفوتك أي تحديثات مهمة من تابي، يُرجى إبقاء الإشعارات مفعلة في إعدادات جهازك. نتمنى لك يومًا سعيدًا!',
      ],
    },
  },
  {
    id: 'gen-close-thanks',
    topic: 'gen-close',
    title: 'Customer says thank you',
    when: 'The customer thanks you.',
    keys: 'thank you welcome appreciate شكرا العفو',
    channels: ['chat'],
    en: {
      ack: 'You’re most welcome! I’m glad I could help.',
      body: ['If you need anything in the future, we’re always here for you.'],
    },
    ar: {
      ack: 'العفو، وسعيد جدًا بأنني استطعت مساعدتك!',
      body: ['وإذا احتجت إلى أي شيء مستقبلًا، فنحن دائمًا في خدمتك.'],
    },
  },
  {
    id: 'gen-still-there',
    topic: 'gen-close',
    title: 'Customer went quiet – are we still connected?',
    when: 'No reply from the customer for a few minutes.',
    keys: 'no reply quiet still connected there هل ما زلنا على تواصل',
    channels: ['chat'],
    en: {
      ack: 'We haven’t heard from you for a little while. Are we still connected?',
      body: [],
    },
    ar: {
      ack: 'لم يصلنا ردك منذ قليل. هل ما زلنا على تواصل؟',
      body: [],
    },
  },
  {
    id: 'gen-close-unresponsive',
    topic: 'gen-close',
    title: 'Close – customer unresponsive',
    when: 'The customer stopped replying after you shared the resolution.',
    keys: 'unresponsive no response close inactive عدم الرد إغلاق',
    channels: ['chat'],
    en: {
      ack: 'I hope I’ve addressed your concern. As we haven’t heard back from you, I’ll close this chat for now.',
      body: ['If you need any further help, you can reply to this conversation or start a new chat at any time. Thank you for contacting Tabby!'],
    },
    ar: {
      ack: 'أتمنى أن أكون قد أجبت على استفسارك. ونظرًا لعدم وصول رد منك، سأقوم بإغلاق المحادثة الآن.',
      body: ['وإذا احتجت إلى أي مساعدة، يمكنك الرد على هذه المحادثة أو بدء محادثة جديدة في أي وقت. شكرًا لتواصلك مع تابي!'],
    },
  },
];
