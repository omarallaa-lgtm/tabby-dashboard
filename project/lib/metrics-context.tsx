export const mergeDashboardData = (kscatData: any, metricsData: any, pvfData: any) => {
  const { agentMetrics, teamAverages, floorAverages } = metricsData;
  const allEmails = Array.from(
    new Set([
      ...Object.keys(kscatData || {}),
      ...Object.keys(agentMetrics || {}),
      ...Object.keys(pvfData || {}),
    ])
  );

  const combinedAgents = allEmails.map((email) => {
    const kscat = kscatData[email] || {};
    const metrics = agentMetrics[email] || {};
    const pvf = pvfData[email] || {};

    return {
      agent_email: email,
      agent_name: email.split('@')[0].replace('.', ' '),
      csat: kscat.csat || 0,
      kscat: kscat.kscat || 0,
      dsat: kscat.dsat || 0,
      total_count: kscat.totalCount || 0,
      total_wo_karma: kscat.totalWoKarma || 0,
      kscat_percent: kscat.kscatPercent || 0,
      csat_percent: kscat.csatPercent || 0,
      variance: kscat.variance || 0,

      abt: metrics['Average basket time'] || 0,
      productivity: metrics['Productivity 8-hrs'] || 0,
      productivity_online: metrics['Productivity Online 8-hrs'] || 0,
      escalation_rate: metrics['Escalation rate %'] || 0,
      deescalation_rate: metrics['Deescalation rate %'] || 0,
      adherence: metrics['Adherence, %'] || 0,
      agbt: metrics['Average group basket time'] || 0,
      aht: metrics['Average handling time'] || 0,
      closed_after_resolution: metrics['Closed after resolution, %'] || 0,
      closed_tickets_pct: metrics['Closed tickets, %'] || 0,
      fcr_percent: metrics['FCR, %'] || 0,

      tardy_minutes: pvf.tardyMinutes || 0,
      idle_time_avg: pvf.idleTimeAvg || 0,
    };
  });

  return {
    agents: combinedAgents,
    teamAverages,
    floorAverages,
  };
};
