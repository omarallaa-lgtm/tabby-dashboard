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
    id: 'gen-greet-update',
    topic: 'gen-greet',
    title: 'Greeting + meaningful update (recommended)',
    when: 'New approach: you already reviewed the case before replying, so open with what you found.',
    keys: 'greeting update reviewed case found first message new approach مرحبا راجعت حالتك',
    channels: ['chat'],
    tip: 'Investigate first, then greet with the real update. Avoid sending a “please allow me some time” message as a standard opener.',
    en: {
      ack: 'Hi, I’m {{agent_name}}. I understand your concern, and I’ve already reviewed your case.',
      body: ['Here’s what I found: {{update}}'],
    },
    ar: {
      ack: 'مرحبًا، معك {{agent_name}}. أتفهم استفسارك، وقد راجعت حالتك بالفعل.',
      body: ['وهذا ما ظهر لي: {{update}}'],
    },
  },
  {
    id: 'gen-greet-name',
    topic: 'gen-greet',
    title: 'Greeting + ask how to address the customer',
    when: 'The customer’s name is not clear and you want to address them personally.',
    keys: 'name address how to call you greeting ask name الاسم كيف أناديك',
    channels: ['chat'],
    en: {
      ack: 'Hi, I’m {{agent_name}}, and I’m here to help with your request.',
      body: ['May I know how I should address you?'],
    },
    ar: {
      ack: 'مرحبًا، معك {{agent_name}}، وأنا هنا لمساعدتك في طلبك.',
      body: ['هل يمكنني معرفة الاسم الذي تفضّل أن أناديك به؟'],
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
    tip: 'Keep the customer with you while you check (see “Keep the customer updated while checking”). Come back with a meaningful update, not another wait message.',
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
    id: 'gen-checking-live',
    topic: 'gen-hold',
    title: 'Keep the customer updated while checking',
    when: 'You are checking the account and want the customer to feel you are with them.',
    keys: 'checking now reviewing history keep updated still with you أراجع الآن',
    channels: ['chat'],
    tip: 'Name what you are actually checking: purchase history, overdue history, dispute history or previous tickets.',
    en: {
      ack: 'I’m checking your account right now, including your purchase history, payment history and any previous requests, so I can help you accurately.',
      body: [],
    },
    ar: {
      ack: 'أراجع حسابك الآن، بما في ذلك سجل المشتريات وسجل السداد وأي طلبات سابقة، حتى أتمكن من مساعدتك بدقة.',
      body: [],
    },
  },
  {
    id: 'gen-critical-info',
    topic: 'gen-hold',
    title: 'Critical information needed to continue',
    when: 'You cannot continue without one specific detail from the customer.',
    keys: 'need information required detail confirm to proceed معلومة مطلوبة للمتابعة',
    channels: ['chat'],
    tip: 'Ask only for what you really need, and ask for it once, all together.',
    en: {
      ack: 'To proceed with your request, I need {{info}}.',
      body: ['Once you share it, I’ll continue with the required action right away.'],
    },
    ar: {
      ack: 'لمتابعة طلبك، أحتاج إلى {{info}}.',
      body: ['وفور مشاركتها، سأكمل الإجراء المطلوب مباشرة.'],
    },
  },
  {
    id: 'gen-info-received',
    topic: 'gen-hold',
    title: 'After the customer shares the information',
    when: 'The customer sent the detail you asked for and you have checked it.',
    keys: 'thanks for providing reviewed it information received شكرا على المعلومة',
    channels: ['chat'],
    en: {
      ack: 'Thank you for sharing that. I’ve reviewed it, and {{finding}}',
      body: [],
    },
    ar: {
      ack: 'شكرًا لمشاركتك هذه المعلومة. راجعتها، و{{finding}}',
      body: [],
    },
  },
  {
    id: 'gen-more-time',
    topic: 'gen-hold',
    title: 'Need a few more minutes (use rarely)',
    when: 'Only if the check is genuinely taking longer and the customer has been waiting.',
    keys: 'more time still checking patience مزيد من الوقت',
    channels: ['chat'],
    tip: 'New approach: this is no longer a standard template. Investigate first and send the meaningful update once you have it.',
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
    id: 'gen-esc-received',
    topic: 'gen-follow',
    title: 'Escalation team – inquiry received',
    when: 'First reply when the Escalation Team picks up an escalated chat or email.',
    keys: 'escalation received inquiry received under review complaint team receiving ticket استلام فريق الشكاوى قيد المعالجة',
    tip: 'Set your team name to “Tabby Escalation Team” in the name settings so the email signature matches.',
    en: {
      ack: 'Hello Valued Customer, thank you for reaching out to us.',
      body: ['Your inquiry has been received by the Tabby Escalation Team and is currently under review.'],
      next: 'We’ll get back to you with an update as soon as possible.',
    },
    ar: {
      ack: 'مرحبًا عزيزي العميل، نشكر تواصلك معنا.',
      body: ['نود إعلامك بأن فريق شكاوى تابي قد استلم استفسارك، وهو حاليًا قيد المعالجة.'],
      next: 'وسنوافيك بالمستجدات في أقرب وقت ممكن.',
    },
    subject: { en: 'Your inquiry has been received', ar: 'تم استلام استفسارك' },
    emailEn:
      'Hello Valued Customer,\n\nThank you for reaching out to us. Your inquiry has been received by the Tabby Escalation Team and is currently under review.\n\nWe will get back to you with an update as soon as possible.\n\nBest regards,\n{{agent_name}}\n{{team_name}}',
    emailAr:
      'مرحبًا عزيزي العميل،\n\nنشكر تواصلك معنا. نود إعلامك بأن فريق شكاوى تابي قد استلم استفسارك، وهو حاليًا قيد المعالجة.\n\nوسنوافيك بالمستجدات في أقرب وقت ممكن.\n\nمع أطيب التحيات،\n{{agent_name}}\n{{team_name}}',
  },
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
    id: 'gen-specialist',
    topic: 'gen-follow',
    title: 'Submitted to the specialist team (JIRA) – update after review',
    when: 'You raised a JIRA / specialist case that has no fixed timeframe.',
    keys: 'jira specialist team submitted technical team review no timeframe الفريق المختص جيرا',
    tip: 'Only give 24–48 hours when the process really has that SLA. For JIRA cases, promise the update after the review instead.',
    en: {
      ack: 'I’ve submitted your case to the relevant team for review.',
      body: ['The next update will be shared with you once their review is completed.'],
    },
    ar: {
      ack: 'تم رفع حالتك إلى الفريق المختص لمراجعتها.',
      body: ['وسنشاركك التحديث التالي فور اكتمال المراجعة.'],
    },
    subject: { en: 'Your case is with our specialist team', ar: 'حالتك لدى الفريق المختص' },
  },
  {
    id: 'gen-tech-followup',
    topic: 'gen-follow',
    title: 'Following up with the technical team (JIRA hold)',
    when: 'The customer asks again while a technical case is still open.',
    keys: 'technical team following up jira hold no update yet الفريق التقني متابعة',
    en: {
      ack: 'Thank you for your patience. We’re following up with the technical team on your case.',
      body: ['As soon as we receive an update, we’ll let you know right away. Thank you for your understanding.'],
    },
    ar: {
      ack: 'شكرًا لصبرك. نتابع حالتك مع الفريق التقني.',
      body: ['وفور وصول أي تحديث، سنبلغك به مباشرة. شكرًا لتفهمك.'],
    },
    subject: { en: 'Update on your request', ar: 'تحديث بخصوص طلبك' },
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
      body: [
        'I’ve added the new information you shared to the existing case, so the relevant team can continue the review there.',
        'To avoid duplication and get you a faster answer, we’ll continue assisting you through the active ticket, and this one will be closed.',
      ],
    },
    ar: {
      ack: 'شكرًا لتواصلك. لاحظنا أن استفسارك قيد المتابعة بالفعل من خلال تذكرة أخرى مفتوحة.',
      body: [
        'وقد أضفت المعلومات الجديدة التي شاركتها إلى الحالة القائمة، حتى يواصل الفريق المختص المراجعة من خلالها.',
        'وتجنبًا للتكرار وحرصًا على سرعة الرد، سنواصل مساعدتك من خلال التذكرة النشطة، وسيتم إغلاق هذه التذكرة.',
      ],
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
    related: ['gen-disagree-escalated'],
  },
  {
    id: 'gen-disagree-escalated',
    topic: 'gen-follow',
    title: 'Disagrees with the previous resolution – escalated (24–48 hours)',
    when: 'The customer has a genuine concern or new information about a previous outcome, and you escalated it.',
    keys: 'disagree previous resolution escalate review again outcome concern اعتراض على الحل تصعيد',
    tip: 'Escalate only with a real reason (new proof, wrong outcome, missing step). Same story with no new information: use “Customer disagrees with the previous answer”.',
    en: {
      ack: 'I’ve reviewed the previous resolution regarding {{issue}}, and I understand you have concerns about the outcome.',
      body: ['I’ve escalated your case to the relevant team for further review.'],
      next: 'You’ll receive an update within 24–48 hours.',
    },
    ar: {
      ack: 'راجعت الحل السابق بخصوص {{issue}}، وأتفهم أن لديك ملاحظات على النتيجة.',
      body: ['وقد قمت بتصعيد حالتك إلى الفريق المختص لمراجعتها مرة أخرى.'],
      next: 'وستصلك التحديثات خلال 24 إلى 48 ساعة.',
    },
    subject: { en: 'Your case is under review again', ar: 'حالتك قيد المراجعة مرة أخرى' },
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
    id: 'gen-screen-record',
    topic: 'gen-follow',
    title: 'Ask for a screenshot or screen recording',
    when: 'You need to see the error or the screen the customer is describing.',
    keys: 'screenshot screen recording video record error message show me لقطة شاشة تسجيل شاشة فيديو',
    en: {
      ack: 'I’d like to make sure I see exactly what you’re seeing.',
      body: ['Could you please send a screenshot or a short screen recording showing the issue here?'],
      next: 'Once we receive it, we’ll review it and continue from there.',
    },
    ar: {
      ack: 'أود التأكد من أنني أرى ما يظهر لك تمامًا.',
      body: ['هل يمكنك إرسال لقطة شاشة أو تسجيل شاشة قصير يوضح المشكلة هنا؟'],
      next: 'وفور استلامه، سنراجعه ونكمل معك.',
    },
    subject: { en: 'A screenshot to help with your request', ar: 'لقطة شاشة للمساعدة في طلبك' },
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
    id: 'gen-action-needed',
    topic: 'gen-follow',
    title: 'Customer needs to complete an action',
    when: 'The fix depends on a step the customer must take.',
    keys: 'next step customer action complete do this then الخطوة التالية مطلوب من العميل',
    en: {
      ack: 'I’ve checked your case, and the next step is {{action}}.',
      body: ['Once you complete this, {{result}}'],
    },
    ar: {
      ack: 'راجعت حالتك، والخطوة التالية هي {{action}}.',
      body: ['وبعد إتمامها، {{result}}'],
    },
    subject: { en: 'The next step for your request', ar: 'الخطوة التالية لطلبك' },
  },
  {
    id: 'gen-self-service',
    topic: 'gen-follow',
    title: 'Self-service – do it from the app',
    when: 'The customer can finish the request alone in the app. Type the path.',
    keys: 'self service app steps path do it yourself من التطبيق الخدمة الذاتية',
    tip: 'Product-specific steps are under each product (Card self-service, Pay Later, Account). Use this one for anything else.',
    en: {
      ack: 'Good news, you can do this directly from the Tabby app.',
      body: ['Go to {{path}} and select {{option}}, then follow the steps shown on screen.'],
    },
    ar: {
      ack: 'خبر جيد، يمكنك القيام بذلك مباشرة من تطبيق تابي.',
      body: ['اذهب إلى {{path}} واختر {{option}}، ثم اتبع الخطوات الظاهرة على الشاشة.'],
    },
    subject: { en: 'How to do this in the Tabby app', ar: 'طريقة القيام بذلك من تطبيق تابي' },
  },
  {
    id: 'gen-contact',
    topic: 'gen-follow',
    title: 'Contact numbers and working hours',
    when: 'The customer asks how to reach Tabby by phone or chat.',
    keys: 'phone number hotline contact hours call center رقم التواصل أوقات العمل',
    tip: 'Gs_Chat sheet: UAE 800 82229 (9 AM–10 PM Dubai time), Kuwait +965 2225 0182 (8 AM–9 PM). An older team sheet had Kuwait +965 2227 0163, so confirm with your TL if a customer says the number doesn’t work.',
    en: {
      ack: 'You can reach us at any time through the chat in the Tabby app: open Profile and tap Contact Us.',
      body: ['You can also call us:\nUAE: 800 82229 (every day, 9 AM to 10 PM Dubai time)\nKuwait: +965 2225 0182 (8 AM to 9 PM)'],
    },
    ar: {
      ack: 'يمكنك التواصل معنا في أي وقت من خلال المحادثة في تطبيق تابي: افتح الملف الشخصي واضغط على "تواصل معنا".',
      body: ['ويمكنك أيضًا الاتصال بنا:\nالإمارات: 800 82229 (يوميًا من 9 صباحًا حتى 10 مساءً بتوقيت دبي)\nالكويت: +965 2225 0182 (من 8 صباحًا حتى 9 مساءً)'],
    },
    subject: { en: 'How to contact Tabby', ar: 'طرق التواصل مع تابي' },
  },

  // ---------------- Closing ----------------
  {
    id: 'gen-close-anything',
    topic: 'gen-close',
    title: 'Clarity check – anything to clarify further?',
    when: 'You shared the resolution and want to make sure it is clear before closing.',
    keys: 'anything else further assistance clarity check clarify هل هناك شيء آخر توضيح',
    channels: ['chat'],
    en: {
      ack: 'I hope this clarifies the situation. Is there anything you’d like me to clarify further?',
      body: [],
    },
    ar: {
      ack: 'أتمنى أن يكون الأمر قد اتضح لك. هل هناك أي شيء تود أن أوضحه أكثر؟',
      body: [],
    },
  },
  {
    id: 'gen-close-final',
    topic: 'gen-close',
    title: 'Final closing',
    when: 'The customer has nothing else; close warmly.',
    keys: 'goodbye bye final closing end chat thanks إغلاق المحادثة مع السلامة',
    channels: ['chat'],
    en: {
      ack: 'It was truly a pleasure assisting you today, and thank you for choosing Tabby.',
      body: ['Whenever you need us, we’re just a message away. Have a wonderful day!'],
    },
    ar: {
      ack: 'سعدت جدًا بخدمتك اليوم، وشكرًا لاختيارك تابي.',
      body: ['ونحن دائمًا هنا متى احتجت إلينا. نتمنى لك يومًا سعيدًا!'],
    },
  },
  {
    id: 'gen-close-thanks',
    topic: 'gen-close',
    title: 'Customer says thank you / everything is clear',
    when: 'The customer thanks you or confirms everything is clear.',
    keys: 'thank you welcome appreciate clear understood شكرا العفو واضح',
    channels: ['chat'],
    en: {
      ack: 'You’re most welcome! I’m glad I could clarify this for you.',
      body: ['If you need anything in the future, we’re always here for you.'],
    },
    ar: {
      ack: 'العفو، ويسعدني أنني استطعت توضيح الأمر لك!',
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
      ack: 'I hope I’ve addressed all of your concerns today. As we haven’t heard back from you, we’ll go ahead and close this chat for now.',
      body: ['If you need any further assistance, feel free to reply to this conversation or start a new chat anytime. Thank you for contacting Tabby!'],
    },
    ar: {
      ack: 'أتمنى أن أكون قد أجبت على جميع استفساراتك اليوم. ونظرًا لعدم وصول رد منك، سنقوم بإغلاق المحادثة الآن.',
      body: ['وإذا احتجت إلى أي مساعدة أخرى، يمكنك الرد على هذه المحادثة أو بدء محادثة جديدة في أي وقت. شكرًا لتواصلك مع تابي!'],
    },
  },
  {
    id: 'gen-close-resolved-unresponsive',
    topic: 'gen-close',
    title: 'Close – resolution already shared, nothing needed from the customer',
    when: 'You gave the full resolution, nothing is pending from the customer, and they stopped replying.',
    keys: 'close resolution given unresponsive nothing needed ticket closed إغلاق تم الحل',
    channels: ['chat'],
    en: {
      ack: 'I’ve shared the full resolution for your request, and there’s nothing further needed from you, so I’ll close this chat now.',
      body: ['You can contact us again anytime if you need help with a new request.'],
    },
    ar: {
      ack: 'وضّحت لك الحل الكامل لطلبك، ولا يوجد أي إجراء إضافي مطلوب منك، لذلك سأقوم بإغلاق المحادثة الآن.',
      body: ['ويمكنك التواصل معنا مرة أخرى في أي وقت إذا احتجت إلى مساعدة في طلب جديد.'],
    },
  },
];
