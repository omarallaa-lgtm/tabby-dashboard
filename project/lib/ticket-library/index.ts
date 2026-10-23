import type { Flow, Product, Scenario } from './types';
import { GENERAL } from './general';
import { BNPL } from './bnpl';
import { ORDERS } from './orders';
import { CARD } from './card';
import { CASH } from './cash';
import { ACCOUNT } from './account';
import { INTERNAL } from './internal';

export * from './types';

// ---------------------------------------------------------------------------
// Topic tree: Product -> Topic -> Scenario
// ---------------------------------------------------------------------------
export const PRODUCTS: Product[] = [
  {
    id: 'general',
    name: 'Conversation',
    nameAr: 'المحادثة',
    color: '#94a3b8',
    topics: [
      { id: 'gen-greet', name: 'Open the chat' },
      { id: 'gen-hold', name: 'Hold & checking' },
      { id: 'gen-empathy', name: 'Empathy, handover & calls' },
      { id: 'gen-follow', name: 'Follow-ups & updates' },
      { id: 'gen-close', name: 'Close the chat' },
    ],
  },
  {
    id: 'bnpl',
    name: 'Pay Later (BNPL)',
    nameAr: 'ادفع لاحقًا',
    color: '#3bffb0',
    topics: [
      { id: 'bnpl-decline', name: 'Purchase declined' },
      { id: 'bnpl-pif', name: 'Pay in Full only / limit' },
      { id: 'bnpl-plan', name: 'Change the plan' },
      { id: 'bnpl-extend', name: 'Extend due date & fees' },
      { id: 'bnpl-pay', name: 'Making payments' },
      { id: 'bnpl-deduct', name: 'Unrecognised deduction' },
      { id: 'bnpl-knet', name: 'KNET (Kuwait)' },
      { id: 'ord-cancel', name: 'Cancel / return an order' },
      { id: 'ord-refund', name: 'Refunds & timelines' },
      { id: 'ord-partial', name: 'Partial refund' },
      { id: 'ord-dispute', name: 'Report an issue with the store' },
      { id: 'ord-wallet', name: 'Wallet & cashback' },
    ],
  },
  {
    id: 'card',
    name: 'Tabby Card',
    nameAr: 'بطاقة تابي',
    color: '#a78bfa',
    topics: [
      { id: 'card-how', name: 'Statement & repayment' },
      { id: 'card-limit', name: 'Card limit' },
      { id: 'card-status', name: 'Apply, block & close' },
      { id: 'card-plus', name: 'Tabby Plus' },
      { id: 'card-refund', name: 'Card refunds' },
      { id: 'card-dispute', name: 'Dispute – unauthorised (Visa)' },
      { id: 'card-refund-dispute', name: 'Dispute – refund not received' },
      { id: 'card-self', name: 'Self-service in the app' },
    ],
  },
  {
    id: 'cash',
    name: 'Tabby Cash',
    nameAr: 'تابي كاش',
    color: '#38bdf8',
    topics: [
      { id: 'cash-about', name: 'About & limits' },
      { id: 'cash-topup', name: 'Top-up & incoming money' },
      { id: 'cash-transfer', name: 'Local & P2P transfers' },
      { id: 'cash-global', name: 'Global transfers' },
      { id: 'cash-review', name: 'Verification & account review' },
    ],
  },
  {
    id: 'account',
    name: 'Account & Security',
    nameAr: 'الحساب والأمان',
    color: '#fbbf24',
    topics: [
      { id: 'acc-details', name: 'Update details' },
      { id: 'acc-access', name: 'Login & access' },
      { id: 'acc-close', name: 'Close the account' },
      { id: 'acc-linked', name: 'Details on another account' },
      { id: 'acc-fraud', name: 'Fraud & scams' },
      { id: 'acc-other', name: 'Other questions' },
    ],
  },
  {
    id: 'internal',
    name: 'Internal & Partners',
    nameAr: 'داخلي وشركاء',
    color: '#f472b6',
    topics: [
      { id: 'int-partner', name: 'Merchants & partners' },
      { id: 'int-transfer', name: 'Transfers & wallet' },
      { id: 'int-escalate', name: 'Escalations & TL' },
      { id: 'int-notes', name: 'Ticket notes' },
    ],
  },
];

export const ALL_SCENARIOS: Scenario[] = [...GENERAL, ...BNPL, ...ORDERS, ...CARD, ...CASH, ...ACCOUNT, ...INTERNAL];

export const SCENARIO_BY_ID: Record<string, Scenario> = Object.fromEntries(ALL_SCENARIOS.map((s) => [s.id, s]));

export const TOPIC_TO_PRODUCT: Record<string, string> = Object.fromEntries(
  PRODUCTS.flatMap((p) => p.topics.map((t) => [t.id, p.id]))
);

export const TOPIC_NAME: Record<string, string> = Object.fromEntries(
  PRODUCTS.flatMap((p) => p.topics.map((t) => [t.id, t.name]))
);

export const PRODUCT_BY_ID: Record<string, Product> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

// ---------------------------------------------------------------------------
// Flows: cases that build on each other. Same step number = choose one branch.
// ---------------------------------------------------------------------------
export const FLOWS: Flow[] = [
  {
    id: 'flow-card-unauth',
    title: 'Card dispute – unauthorised transaction',
    product: 'card',
    steps: [
      { id: 'cd-form-email', step: 1, label: 'Email the form' },
      { id: 'cd-form-chat', step: 2, label: 'Chat: check email' },
      { id: 'cd-form-received', step: 3, label: 'Form received' },
      { id: 'cd-form-expired', step: 3, label: 'No form in 72h' },
      { id: 'cd-visa-accepted', step: 4, label: 'Visa accepted (31 days)' },
      { id: 'cd-call-answered', step: 5, label: 'Called – answered' },
      { id: 'cd-call-no-answer', step: 5, label: 'Called – no answer' },
      { id: 'cd-followup', step: 6, label: 'Customer follows up' },
      { id: 'cd-outcome-won', step: 7, label: 'Outcome – won' },
      { id: 'cd-outcome-lost', step: 7, label: 'Outcome – not approved' },
    ],
  },
  {
    id: 'flow-card-refund',
    title: 'Card dispute – refund not received',
    product: 'card',
    steps: [
      { id: 'crf-15days', step: 1, label: 'Wait up to 15 days' },
      { id: 'crd-form-email', step: 2, label: 'Email the form' },
      { id: 'crd-form-chat', step: 3, label: 'Chat: check email' },
      { id: 'cd-form-received', step: 4, label: 'Form received' },
      { id: 'cd-visa-accepted', step: 5, label: 'Visa accepted (31 days)' },
      { id: 'cd-call-answered', step: 6, label: 'Called – answered' },
      { id: 'cd-call-no-answer', step: 6, label: 'Called – no answer' },
      { id: 'cd-outcome-won', step: 7, label: 'Outcome – won' },
      { id: 'cd-outcome-lost', step: 7, label: 'Outcome – not approved' },
    ],
  },
  {
    id: 'flow-declined',
    title: 'Pay Later purchase declined',
    product: 'bnpl',
    steps: [
      { id: 'bnpl-dec-general', step: 1, label: 'Explain' },
      { id: 'bnpl-dec-first', step: 2, label: 'First purchase' },
      { id: 'bnpl-dec-jump', step: 2, label: 'Higher amount' },
      { id: 'bnpl-dec-attempts', step: 2, label: 'Many attempts' },
      { id: 'bnpl-dec-overdue', step: 2, label: 'Late payments' },
      { id: 'bnpl-dec-active', step: 2, label: 'Many active plans' },
      { id: 'bnpl-dec-goodhistory', step: 3, label: '“I pay on time”' },
      { id: 'bnpl-dec-reason', step: 3, label: 'Wants exact reason' },
      { id: 'bnpl-dec-insists', step: 4, label: 'Insists again' },
      { id: 'bnpl-dec-when', step: 5, label: 'When approved again?' },
    ],
  },
  {
    id: 'flow-deduction',
    title: 'Unrecognised deduction',
    product: 'bnpl',
    steps: [
      { id: 'ded-ask', step: 1, label: 'Ask for bank message' },
      { id: 'ded-own-instalment', step: 2, label: 'Own instalment' },
      { id: 'ded-failed-hold', step: 2, label: 'Failed / held amount' },
      { id: 'ded-other-account', step: 2, label: 'Card on another account' },
      { id: 'ded-call-answered', step: 3, label: 'Called – answered' },
      { id: 'ded-call-no-answer', step: 3, label: 'Called – no answer' },
      { id: 'ded-other-details', step: 4, label: 'Asks for holder details' },
    ],
  },
  {
    id: 'flow-refund',
    title: 'Refund timeline',
    product: 'bnpl',
    steps: [
      { id: 'ord-refund-not-processed', step: 1, label: 'Store not processed' },
      { id: 'ord-refund-15days', step: 2, label: 'Up to 15 days' },
      { id: 'ord-refund-15plus', step: 3, label: 'Over 15 days' },
      { id: 'ord-refund-bank', step: 4, label: 'Sent to bank (5–7 days)' },
      { id: 'ord-refund-wallet', step: 4, label: 'To Tabby wallet' },
      { id: 'ord-refund-to-balance', step: 4, label: 'Used for instalments' },
      { id: 'ord-refund-after-sla', step: 5, label: 'Not received after SLA' },
    ],
  },
  {
    id: 'flow-store-issue',
    title: 'Report an issue with the store',
    product: 'bnpl',
    steps: [
      { id: 'ord-dispute-how', step: 1, label: 'How to report' },
      { id: 'ord-dispute-active', step: 2, label: 'Under review' },
      { id: 'ord-dispute-proof', step: 2, label: 'Need proof' },
      { id: 'ord-dispute-declined', step: 3, label: 'Declined' },
      { id: 'ord-dispute-newproof', step: 4, label: 'New proof received' },
    ],
  },
  {
    id: 'flow-knet',
    title: 'KNET extra amount (Kuwait)',
    product: 'bnpl',
    steps: [
      { id: 'knet-explain', step: 1, label: 'Explain' },
      { id: 'knet-compensate', step: 2, label: 'Added to wallet' },
    ],
  },
  {
    id: 'flow-fraud',
    title: 'Order not recognised (fraud)',
    product: 'account',
    steps: [
      { id: 'fraud-not-mine', step: 1, label: 'Secure & verify' },
      { id: 'fraud-resolved', step: 2, label: 'Not placed by customer' },
      { id: 'fraud-otp', step: 2, label: 'OTP compromised' },
      { id: 'fraud-scam', step: 2, label: 'Shared with scammer' },
      { id: 'fraud-handled-before', step: 3, label: 'Contacts again' },
      { id: 'fraud-tips', step: 3, label: 'Security tips' },
    ],
  },
  {
    id: 'flow-linked',
    title: 'Details on another account',
    product: 'account',
    steps: [
      { id: 'acc-linked-verify', step: 1, label: 'Verify (ID + selfie)' },
      { id: 'acc-id-removed', step: 2, label: 'ID removed' },
      { id: 'acc-phone-freed', step: 2, label: 'Phone / email removed' },
      { id: 'acc-email-freed', step: 2, label: 'Email removed' },
    ],
  },
];

/** flows a scenario belongs to */
export const flowsOf = (id: string) => FLOWS.filter((f) => f.steps.some((s) => s.id === id));
