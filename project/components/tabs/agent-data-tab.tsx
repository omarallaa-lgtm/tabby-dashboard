const combinedRecords = allEmails.map((email) => {
  const k = kscatData[email] || {};
  const m = agentMetrics[email] || {};
  const p = pvfData[email] || {};

  return {
    period_id: periodId,
    agent_email: email,
    agent_name: email, // Preserves full user email (e.g. omar.allaa@tabby.ai)
    csat: k.csat || 0,
    kscat: k.kscat || 0,
    dsat: k.dsat || 0,
    total_count: k.totalCount || 0,
    total_wo_karma: k.totalWoKarma || 0,
    kscat_percent: k.kscatPercent || 0,
    csat_percent: k.csatPercent || 0,
    variance: k.variance || 0,
    tardy_minutes: p.tardyMinutes || 0,
    idle_time_avg: p.idleTimeAvg || 0,
    abt: m['Average basket time'] || 0,
    productivity_8hrs: m['Productivity 8-hrs'] || 0,
    productivity_online_8hrs: m['Productivity Online 8-hrs'] || 0,
    escalation_rate: m['Escalation rate %'] || 0,
    deescalation_rate: m['Deescalation rate %'] || 0,
    adherence: m['Adherence, %'] || 0,
    agbt: m['Average group basket time'] || 0,
    aht: m['Average handling time'] || 0,
    closed_after_resolution: m['Closed after resolution, %'] || 0,
    closed_tickets_pct: m['Closed tickets, %'] || 0,
    fcr_percent: m['FCR, %'] || 0,
  };
});
