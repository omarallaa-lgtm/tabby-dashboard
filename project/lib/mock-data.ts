export type TrendDirection = 'up' | 'down' | 'neutral';

export interface KpiMetric {
  id: string;
  label: string;
  value: string;
  rawValue: number;
  unit: string;
  target: string;
  trend: TrendDirection;
  trendValue: string;
  trendLabel: string;
  sparkline: number[];
}

export interface Agent {
  rank: number;
  name: string;
  avatar: string;
  team: string;
  csat: number;
  dsat: number;
  adherence: number;
  aht: string;
  ahtSeconds: number;
  calls: number;
  status: 'online' | 'break' | 'offline';
}

export interface TeamRow {
  team: string;
  floor: string;
  agents: number;
  csat: number;
  dsat: number;
  adherence: number;
  aht: string;
  calls: number;
  utilization: number;
}

export interface RequestItem {
  id: string;
  type: 'Time Off' | 'Shift Swap' | 'Schedule Change' | 'Equipment';
  agent: string;
  team: string;
  submitted: string;
  status: 'Pending' | 'Approved' | 'Denied';
  priority: 'Low' | 'Medium' | 'High';
  details: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  category: 'Policy' | 'Event' | 'Ops' | 'Training';
  author: string;
  date: string;
  pinned: boolean;
}

export const kpiMetrics: KpiMetric[] = [
  {
    id: 'csat',
    label: 'CSAT %',
    value: '92.4%',
    rawValue: 92.4,
    unit: '%',
    target: '90%',
    trend: 'up',
    trendValue: '+2.1%',
    trendLabel: 'vs last week',
    sparkline: [88, 89, 87, 90, 91, 90, 92, 92.4],
  },
  {
    id: 'dsat',
    label: 'DSAT Count',
    value: '147',
    rawValue: 147,
    unit: '',
    target: '< 120',
    trend: 'up',
    trendValue: '+18',
    trendLabel: 'vs last week',
    sparkline: [120, 125, 130, 128, 135, 140, 143, 147],
  },
  {
    id: 'adherence',
    label: 'Adherence %',
    value: '88.7%',
    rawValue: 88.7,
    unit: '%',
    target: '90%',
    trend: 'down',
    trendValue: '-1.3%',
    trendLabel: 'vs last week',
    sparkline: [91, 90, 92, 91, 90, 89, 89, 88.7],
  },
  {
    id: 'aht',
    label: 'AHT',
    value: '4:32',
    rawValue: 272,
    unit: 'min',
    target: '< 4:30',
    trend: 'down',
    trendValue: '-0:08',
    trendLabel: 'vs last week',
    sparkline: [280, 278, 275, 276, 274, 273, 272, 272],
  },
];

export const weeklyTrend = [
  { day: 'Mon', csat: 91, dsat: 22, aht: 275 },
  { day: 'Tue', csat: 89, dsat: 28, aht: 270 },
  { day: 'Wed', csat: 93, dsat: 18, aht: 268 },
  { day: 'Thu', csat: 90, dsat: 25, aht: 280 },
  { day: 'Fri', csat: 94, dsat: 20, aht: 265 },
  { day: 'Sat', csat: 95, dsat: 15, aht: 260 },
  { day: 'Sun', csat: 92, dsat: 19, aht: 272 },
];

export const hourlyVolume = [
  { hour: '8AM', calls: 145, chats: 88 },
  { hour: '9AM', calls: 210, chats: 120 },
  { hour: '10AM', calls: 280, chats: 165 },
  { hour: '11AM', calls: 320, chats: 190 },
  { hour: '12PM', calls: 290, chats: 175 },
  { hour: '1PM', calls: 250, chats: 150 },
  { hour: '2PM', calls: 310, chats: 185 },
  { hour: '3PM', calls: 340, chats: 210 },
  { hour: '4PM', calls: 300, chats: 195 },
  { hour: '5PM', calls: 260, chats: 160 },
  { hour: '6PM', calls: 220, chats: 140 },
  { hour: '7PM', calls: 180, chats: 110 },
];

export const agentLeaderboard: Agent[] = [
  {
    rank: 1,
    name: 'Sara Al-Mansoori',
    avatar: 'SA',
    team: 'Floor 1 — Retail',
    csat: 98.2,
    dsat: 1,
    adherence: 96,
    aht: '3:45',
    ahtSeconds: 225,
    calls: 142,
    status: 'online',
  },
  {
    rank: 2,
    name: 'Omar Khoury',
    avatar: 'OK',
    team: 'Floor 2 — Logistics',
    csat: 97.1,
    dsat: 2,
    adherence: 94,
    aht: '4:10',
    ahtSeconds: 250,
    calls: 138,
    status: 'online',
  },
  {
    rank: 3,
    name: 'Lina Habib',
    avatar: 'LH',
    team: 'Floor 1 — Retail',
    csat: 96.5,
    dsat: 3,
    adherence: 92,
    aht: '4:02',
    ahtSeconds: 242,
    calls: 151,
    status: 'break',
  },
  {
    rank: 4,
    name: 'Yousef Nasser',
    avatar: 'YN',
    team: 'Floor 3 — Payments',
    csat: 95.8,
    dsat: 4,
    adherence: 91,
    aht: '4:20',
    ahtSeconds: 260,
    calls: 127,
    status: 'online',
  },
  {
    rank: 5,
    name: 'Maya Tahir',
    avatar: 'MT',
    team: 'Floor 2 — Logistics',
    csat: 95.2,
    dsat: 5,
    adherence: 90,
    aht: '4:35',
    ahtSeconds: 275,
    calls: 133,
    status: 'online',
  },
  {
    rank: 6,
    name: 'Khalid Rashid',
    avatar: 'KR',
    team: 'Floor 3 — Payments',
    csat: 94.7,
    dsat: 6,
    adherence: 89,
    aht: '4:48',
    ahtSeconds: 288,
    calls: 119,
    status: 'break',
  },
  {
    rank: 7,
    name: 'Nadia Fares',
    avatar: 'NF',
    team: 'Floor 1 — Retail',
    csat: 94.1,
    dsat: 7,
    adherence: 88,
    aht: '4:55',
    ahtSeconds: 295,
    calls: 124,
    status: 'online',
  },
  {
    rank: 8,
    name: 'Bilal Saeed',
    avatar: 'BS',
    team: 'Floor 2 — Logistics',
    csat: 93.6,
    dsat: 8,
    adherence: 87,
    aht: '5:02',
    ahtSeconds: 302,
    calls: 116,
    status: 'offline',
  },
  {
    rank: 9,
    name: 'Reem Adel',
    avatar: 'RA',
    team: 'Floor 3 — Payments',
    csat: 93.0,
    dsat: 9,
    adherence: 86,
    aht: '5:10',
    ahtSeconds: 310,
    calls: 108,
    status: 'online',
  },
  {
    rank: 10,
    name: 'Tariq Mansour',
    avatar: 'TM',
    team: 'Floor 1 — Retail',
    csat: 92.4,
    dsat: 11,
    adherence: 85,
    aht: '5:25',
    ahtSeconds: 325,
    calls: 101,
    status: 'break',
  },
];

export const teamRows: TeamRow[] = [
  {
    team: 'Retail Support',
    floor: 'Floor 1',
    agents: 24,
    csat: 94.8,
    dsat: 32,
    adherence: 91.2,
    aht: '4:18',
    calls: 1820,
    utilization: 87,
  },
  {
    team: 'Logistics Desk',
    floor: 'Floor 2',
    agents: 18,
    csat: 93.1,
    dsat: 41,
    adherence: 88.5,
    aht: '4:42',
    calls: 1340,
    utilization: 82,
  },
  {
    team: 'Payments & Fraud',
    floor: 'Floor 3',
    agents: 15,
    csat: 90.5,
    dsat: 48,
    adherence: 86.0,
    aht: '5:05',
    calls: 980,
    utilization: 79,
  },
  {
    team: 'Returns & Refunds',
    floor: 'Floor 1',
    agents: 12,
    csat: 95.6,
    dsat: 18,
    adherence: 92.8,
    aht: '3:58',
    calls: 760,
    utilization: 90,
  },
  {
    team: 'VIP / Concierge',
    floor: 'Floor 3',
    agents: 8,
    csat: 97.2,
    dsat: 8,
    adherence: 94.5,
    aht: '4:30',
    calls: 420,
    utilization: 93,
  },
];

export const floorOverview = [
  { floor: 'Floor 1', teams: 2, agents: 36, avgCsat: 95.2, avgAdherence: 92.0, avgAht: '4:08', calls: 2580, status: 'On Target' },
  { floor: 'Floor 2', teams: 1, agents: 18, avgCsat: 93.1, avgAdherence: 88.5, avgAht: '4:42', calls: 1340, status: 'Watch' },
  { floor: 'Floor 3', teams: 2, agents: 23, avgCsat: 93.9, avgAdherence: 90.3, avgAht: '4:48', calls: 1400, status: 'On Target' },
];

export const requestItems: RequestItem[] = [
  {
    id: 'REQ-1042',
    type: 'Time Off',
    agent: 'Sara Al-Mansoori',
    team: 'Floor 1 — Retail',
    submitted: '2026-09-12',
    status: 'Pending',
    priority: 'Medium',
    details: 'Requested leave for Sept 20–22 (3 days). Coverage confirmed by team lead.',
  },
  {
    id: 'REQ-1041',
    type: 'Shift Swap',
    agent: 'Omar Khoury',
    team: 'Floor 2 — Logistics',
    submitted: '2026-09-11',
    status: 'Pending',
    priority: 'High',
    details: 'Swap Friday evening shift with Lina Habib. Both agents agreed verbally.',
  },
  {
    id: 'REQ-1040',
    type: 'Equipment',
    agent: 'Yousef Nasser',
    team: 'Floor 3 — Payments',
    submitted: '2026-09-10',
    status: 'Approved',
    priority: 'Low',
    details: 'Requesting noise-cancelling headset replacement. Current unit has hardware fault.',
  },
  {
    id: 'REQ-1039',
    type: 'Schedule Change',
    agent: 'Maya Tahir',
    team: 'Floor 2 — Logistics',
    submitted: '2026-09-09',
    status: 'Denied',
    priority: 'Medium',
    details: 'Requested permanent move to morning shift. No morning slots available on Floor 2.',
  },
  {
    id: 'REQ-1038',
    type: 'Time Off',
    agent: 'Khalid Rashid',
    team: 'Floor 3 — Payments',
    submitted: '2026-09-08',
    status: 'Approved',
    priority: 'Low',
    details: 'Half-day leave on Sept 16 for personal appointment.',
  },
  {
    id: 'REQ-1037',
    type: 'Shift Swap',
    agent: 'Nadia Fares',
    team: 'Floor 1 — Retail',
    submitted: '2026-09-07',
    status: 'Pending',
    priority: 'High',
    details: 'Urgent swap needed for Sept 17 morning shift due to family emergency.',
  },
  {
    id: 'REQ-1036',
    type: 'Equipment',
    agent: 'Bilal Saeed',
    team: 'Floor 2 — Logistics',
    submitted: '2026-09-06',
    status: 'Approved',
    priority: 'Low',
    details: 'Second monitor request for dual-screen workflow on complex logistics tickets.',
  },
  {
    id: 'REQ-1035',
    type: 'Schedule Change',
    agent: 'Reem Adel',
    team: 'Floor 3 — Payments',
    submitted: '2026-09-05',
    status: 'Pending',
    priority: 'Medium',
    details: 'Requesting 4-day compressed schedule (Mon–Thu, 10h shifts). Trial period.',
  },
  {
    id: 'REQ-1034',
    type: 'Time Off',
    agent: 'Tariq Mansour',
    team: 'Floor 1 — Retail',
    submitted: '2026-09-04',
    status: 'Denied',
    priority: 'Low',
    details: 'Requested leave during peak weekend. Denied due to staffing constraints.',
  },
];

export const announcements: Announcement[] = [
  {
    id: 'ANN-012',
    title: 'Q3 Performance Review Cycle Opens Sept 20',
    body: 'The Q3 performance review cycle begins on September 20. All team leads must submit agent evaluations by September 27. Please coordinate with HR for calibration sessions scheduled Sept 22–24.',
    category: 'Policy',
    author: 'Operations Director',
    date: '2026-09-13',
    pinned: true,
  },
  {
    id: 'ANN-011',
    title: 'New AHT Target: Under 4:30 Effective Oct 1',
    body: 'Starting October 1, the organization-wide AHT target tightens from 5:00 to 4:30. Floor leads should review agent-level AHT trends and identify coaching opportunities during the next two weeks.',
    category: 'Ops',
    author: 'Workforce Management',
    date: '2026-09-12',
    pinned: true,
  },
  {
    id: 'ANN-010',
    title: 'Customer Empathy Workshop — Sept 25',
    body: 'A mandatory customer empathy and de-escalation workshop is scheduled for September 25, 2:00–4:00 PM in the Floor 1 training room. All agents across floors are required to attend one of three available sessions.',
    category: 'Training',
    author: 'L&D Team',
    date: '2026-09-11',
    pinned: false,
  },
  {
    id: 'ANN-009',
    title: 'Tabby.ai Annual Team Iftar — Oct 3',
    body: 'Our annual team Iftar will be held on October 3 at the Ritz-Carlton ballroom. Partners and families welcome. RSVP through the internal portal by September 28. Transportation will be provided from all three floors.',
    category: 'Event',
    author: 'People & Culture',
    date: '2026-09-10',
    pinned: false,
  },
  {
    id: 'ANN-008',
    title: 'Updated Escalation Protocol for Payment Disputes',
    body: 'Effective immediately, all payment disputes exceeding AED 5,000 must be escalated to the Floor 3 senior agent within 10 minutes of first contact. The updated protocol document is available in the knowledge base under OPS-3.2.',
    category: 'Ops',
    author: 'Floor 3 Lead',
    date: '2026-09-08',
    pinned: false,
  },
  {
    id: 'ANN-007',
    title: 'New CSAT Survey Launches Next Week',
    body: 'We are rolling out an enhanced post-call CSAT survey on September 16. The new survey includes a free-text feedback field. Agents should encourage customers to complete the survey at the end of each call.',
    category: 'Policy',
    author: 'Quality Assurance',
    date: '2026-09-06',
    pinned: false,
  },
];

export const csatDistribution = [
  { label: '5 Stars', value: 68, color: 'hsl(var(--chart-1))' },
  { label: '4 Stars', value: 22, color: 'hsl(var(--chart-2))' },
  { label: '3 Stars', value: 6, color: 'hsl(var(--chart-3))' },
  { label: '2 Stars', value: 3, color: 'hsl(var(--chart-5))' },
  { label: '1 Star', value: 1, color: 'hsl(var(--destructive))' },
];

export const dsatReasons = [
  { reason: 'Long wait time', count: 42, pct: 29 },
  { reason: 'Unresolved issue', count: 38, pct: 26 },
  { reason: 'Agent knowledge gap', count: 27, pct: 18 },
  { reason: 'Rude interaction', count: 19, pct: 13 },
  { reason: 'System/tech error', count: 14, pct: 10 },
  { reason: 'Policy disagreement', count: 7, pct: 4 },
];
