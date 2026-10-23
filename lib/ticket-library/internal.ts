import type { Scenario } from './types';

// Internal & partner emails and notes (English only, never sent to the customer as-is).
// Field lines are left blank on purpose: fill them from the ticket / back office.
const sign = '\n\nBest regards,\n{{agent_name}}\n{{team_name}}';

const internal = (
  s: Omit<Scenario, 'en' | 'channels' | 'internal'> & { summary: string; emailEn: string }
): Scenario => ({
  ...s,
  channels: ['email'],
  internal: true,
  en: { ack: s.summary, body: [] },
});

export const INTERNAL: Scenario[] = [
  // ---------------- Partners & merchants ----------------
  internal({
    id: 'int-merchant-cancel',
    topic: 'int-partner',
    title: 'Merchant – customer wants to cancel the order',
    when: 'Ask the merchant (Partner Team) to confirm the order status and update the Tabby dashboard.',
    keys: 'merchant cancel order partner team side ticket تاجر الغاء',
    summary: 'Cancellation request to the merchant.',
    subject: { en: 'Order cancellation request – {{order_ref}}', ar: '' },
    emailEn:
      'Dear Partner Team,\n\nI hope you are doing well.\n\nA customer has contacted us about an order placed at your store and would like to cancel it for the following reason: {{reason}}.\n\nKindly confirm the current order status and, if the cancellation is accepted, update it on the Tabby dashboard so the customer’s payments are adjusted.\n\nPayment ID: {{order_ref}}\nOrder number:\nOrder date:\n\nThank you for your support.' +
      sign,
  }),
  internal({
    id: 'int-partner-info-requested',
    topic: 'int-partner',
    title: 'Partner – we asked the customer for the information',
    when: 'Reply to a partner / merchant who asked for details we are collecting from the customer.',
    keys: 'partner reply requested information customer waiting طلبنا المعلومات',
    summary: 'Holding reply to a partner.',
    subject: { en: 'Re: {{ticket_id}}', ar: '' },
    emailEn:
      'Dear Team,\n\nI hope you are doing well.\n\nThank you for your email. We have asked the customer to provide the requested information, and we will update you as soon as we receive the response.' +
      sign,
  }),
  internal({
    id: 'int-partner-proof',
    topic: 'int-partner',
    title: 'Partner – sending the requested proof',
    when: 'Send proof (and Tabby’s terms if needed) back to a partner on an open case.',
    keys: 'send proof attached terms partner case ارسال الاثبات',
    summary: 'Proof sent to a partner.',
    subject: { en: 'Requested proof – {{ticket_id}}', ar: '' },
    emailEn:
      'Dear Team,\n\nI hope you are doing well.\n\nWith reference to case {{ticket_id}}, please find attached the requested proof, along with Tabby’s Terms and Conditions for your review.\n\nShould you need any additional information, please let us know.' +
      sign,
  }),
  internal({
    id: 'int-category',
    topic: 'int-partner',
    title: 'Merchant category mismatch (Tabby+ cashback)',
    when: 'The customer shows the merchant belongs to a different category than the one recorded.',
    keys: 'category mismatch merchant category cashback plus dining grocery تصنيف التاجر',
    summary: 'Category review request.',
    subject: { en: 'Merchant category review – {{merchant}}', ar: '' },
    emailEn:
      'Hi Team,\n\nCould you please review the category of the merchant {{merchant}}?\n\nThe merchant is currently categorised as {{category}}. However, the customer has shared a link confirming the merchant’s actual business type: {{link}}\n\nKindly review the category and, if appropriate, correct it. If the category is updated, please add the applicable Tabby+ cashback to the customer’s Cashback Wallet.\n\nThank you!' +
      sign,
  }),

  // ---------------- Transfers & wallet ----------------
  internal({
    id: 'int-lulu-status',
    topic: 'int-transfer',
    title: 'Lulu Exchange – global transfer status / pending verification',
    when: 'A Global Transfer is pending, delivered-but-not-received, or stuck in verification.',
    keys: 'lulu exchange global transfer pending verification status remittance لولو تحويل دولي',
    tip: 'Fill the fields from the back office. Do not paste anything the customer did not consent to share.',
    summary: 'Status request to Lulu Exchange.',
    subject: { en: 'Global transfer status – {{transfer_ref}}', ar: '' },
    emailEn:
      'Hello Team,\n\nI hope you are doing well.\n\nWe have a global transfer that needs your support. {{issue}} Could you please confirm the current status of the transfer and advise on the next steps required?\n\nTransfer details\nRef ID: {{transfer_ref}}\nInternal transfer ID: {{internal_id}}\nDate:\n\nRecipient details\nAccount holder name:\nNationality:\nCountry:\nRelationship:\nPhone:\n\nBank details\nBank:\nSWIFT:\nAccount number:\nAddress:\n\nThank you for your assistance.' +
      sign,
  }),
  internal({
    id: 'int-transfer-investigation',
    topic: 'int-transfer',
    title: 'Tabby transfer / top-up investigation',
    when: 'A local transfer, P2P transfer or top-up needs to be investigated by the payments team.',
    keys: 'transfer investigation top up p2p iban not received payments team تحقيق تحويل',
    summary: 'Transfer / top-up investigation request.',
    subject: { en: 'Transfer / top-up investigation – {{transfer_ref}}', ar: '' },
    emailEn:
      'Dear Team,\n\nI would appreciate your support in investigating this Tabby transfer / top-up.\n\nIssue: {{issue}}\n\nTransaction details\nTransaction / reference ID: {{transfer_ref}}\nTransfer amount:\nSender ID and IBAN:\nBeneficiary name and IBAN (for P2P: beneficiary phone number):\n\nThank you.' +
      sign,
  }),
  internal({
    id: 'int-wallet-receipt',
    topic: 'int-transfer',
    title: 'Wallet withdrawal – request the receipt',
    when: 'The customer says a wallet / cashback withdrawal did not reach the bank.',
    keys: 'wallet withdrawal receipt cashback not credited bank سحب المحفظة ايصال',
    summary: 'Withdrawal receipt request.',
    subject: { en: 'Wallet withdrawal receipt – {{reference}}', ar: '' },
    emailEn:
      'Hello Team,\n\nKindly share the receipt for this wallet withdrawal, as the customer has informed us that the amount has not yet been credited to their bank account.\n\nRow:\nAmount:\nEmail:\nPhone number:\nBank reference: {{reference}}\nComment:\n\nThank you.' +
      sign,
  }),
  internal({
    id: 'int-wallet-reversal',
    topic: 'int-transfer',
    title: 'Wallet withdrawal – was it reversed?',
    when: 'The bank says it did not receive the withdrawal; check whether it bounced back.',
    keys: 'withdrawal reversed bounced back bank did not receive ارتجاع السحب',
    summary: 'Withdrawal reversal check.',
    subject: { en: 'Withdrawal reversal check – {{reference}}', ar: '' },
    emailEn:
      'Hello Team,\n\nCould you please confirm whether this withdrawal was reversed back to our bank? The customer has informed us that their bank did not receive the transfer.\n\nBank reference: {{reference}}\n\nThank you.' +
      sign,
  }),
  internal({
    id: 'int-failed-withdrawal',
    topic: 'int-transfer',
    title: 'Withdrawal failed – not processed by the gateway',
    when: 'Evidence shows the withdrawal was never processed by Tabby / the payment gateway.',
    keys: 'failed withdrawal not processed gateway screenshot portal سحب فاشل',
    summary: 'Failed withdrawal report.',
    subject: { en: 'Failed withdrawal – {{reference}}', ar: '' },
    emailEn:
      'Hello Team,\n\nThe withdrawal below does not appear to have been processed through the Tabby system and the payment gateway, which resulted in a failed withdrawal.\n\nReference number: {{reference}}\n\nI have attached a screenshot of the payment portal as evidence. Kindly review and advise on the next steps.\n\nThank you.' +
      sign,
  }),

  // ---------------- Escalations & team support ----------------
  internal({
    id: 'int-supervisor-call',
    topic: 'int-escalate',
    title: 'TL – supervisor call request',
    when: 'The customer asks for a supervisor, or the case needs a TL call-back.',
    keys: 'supervisor call tl team leader call back escalation مشرف اتصال',
    summary: 'Supervisor call request to the TL.',
    subject: { en: 'Supervisor call request – {{ticket_id}}', ar: '' },
    emailEn:
      'Hello TL,\n\nI am seeking your assistance with a supervisor call.\n\nTicket ID: {{ticket_id}}\nCall-back time: {{callback_time}}\nReason for escalation: {{reason}}\nSummary of support given: {{actions_taken}}\n\nThank you.' +
      sign,
  }),
  internal({
    id: 'int-ticket-help',
    topic: 'int-escalate',
    title: 'Ticket assistance request (senior / TL)',
    when: 'You need a senior or TL to guide you on how to handle a ticket.',
    keys: 'ticket assistance help senior guidance stuck مساعدة تذكرة',
    summary: 'Ticket guidance request.',
    subject: { en: 'Ticket assistance – {{ticket_id}}', ar: '' },
    emailEn:
      'Hello Team,\n\nI would appreciate your guidance on the ticket below.\n\nTicket ID: {{ticket_id}}\nCustomer concern: {{issue}}\nWhat I checked / did: {{actions_taken}}\nWhere I need help: {{open_point}}\n\nThank you.' +
      sign,
  }),
  internal({
    id: 'int-31-days',
    topic: 'int-escalate',
    title: 'Card dispute – no Visa outcome after 31 days',
    when: 'The Visa investigation window has passed and no outcome was shared.',
    keys: 'visa 31 days no outcome chargeback senior follow up dispute overdue نزاع فيزا',
    summary: 'Dispute follow-up to seniors after 31 days.',
    subject: { en: 'Card dispute follow-up – {{ticket_id}}', ar: '' },
    emailEn:
      'Hello Team,\n\nThe Visa investigation window for the card dispute below has passed, and we have not yet received an outcome. Could you please check the status and advise what we should share with the customer?\n\nTicket ID: {{ticket_id}}\nDispute raised on:\nCustomer follow-ups so far: {{actions_taken}}\n\nThank you.' +
      sign,
  }),
  internal({
    id: 'int-transaction-review',
    topic: 'int-escalate',
    title: 'Transaction / dispute review request',
    when: 'A transaction or dispute needs a review by the relevant team (declined payment, card charge, refund not shown).',
    keys: 'transaction review dispute review declined card charge relevant team مراجعة عملية',
    summary: 'Transaction review request.',
    subject: { en: 'Transaction review – {{ticket_id}}', ar: '' },
    emailEn:
      'Hello Team,\n\nCould you please review the transaction below?\n\nTicket ID: {{ticket_id}}\nPayment / order ID: {{order_ref}}\nIssue: {{issue}}\nWhat the customer shared: {{proof}}\nWhat I checked: {{actions_taken}}\n\nThank you.' +
      sign,
  }),

  // ---------------- Internal notes ----------------
  internal({
    id: 'int-note-cia',
    topic: 'int-notes',
    title: 'Internal note – Context / Investigation / Actions (#CIA)',
    when: 'Add to every ticket before you solve, hold or escalate it.',
    keys: 'cia internal note context investigation actions ملاحظة داخلية',
    summary: 'Ticket note.',
    emailEn: '• Context: {{issue}}\n• Investigation: {{details}}\n• Actions: {{actions_taken}}\n\n#CIA',
  }),
  internal({
    id: 'int-note-call',
    topic: 'int-notes',
    title: 'Internal note – call summary',
    when: 'After an outbound or inbound call on a ticket.',
    keys: 'call summary note outbound call answered no answer ملخص المكالمة',
    summary: 'Call note.',
    emailEn:
      '• Call type: Outbound / Inbound\n• Result: {{status}}\n• Discussed: {{details}}\n• Agreed next step: {{action}}\n• Open point: {{open_point}}',
  }),
];
