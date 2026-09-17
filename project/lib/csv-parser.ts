// Helper to safely parse numbers and clean percentage symbols
export const parseCleanNumber = (val: any): number => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).replace(/%/g, '').replace(/,/g, '').trim();
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
};

// 1. Process KSCAT Calc File
export const processKSCATCalc = (rows: any[]) => {
  const agentMap: Record<string, { csat: number; kscat: number; dsat: number }> = {};

  rows.forEach((row) => {
    const assignee = String(row['assignee'] || row['Assignee'] || '').trim().toLowerCase();
    const resolver = String(row['resolver'] || row['Resolver'] || '').trim().toLowerCase();
    const csatStatus = String(row['csat'] || row['CSAT'] || '').trim().toLowerCase();

    if (!assignee) return;

    if (!agentMap[assignee]) {
      agentMap[assignee] = { csat: 0, kscat: 0, dsat: 0 };
    }

    if (csatStatus === 'good') {
      agentMap[assignee].csat += 1;
    } else if (csatStatus === 'bad') {
      if (resolver !== assignee) {
        agentMap[assignee].kscat += 1;
      } else {
        agentMap[assignee].dsat += 1;
      }
    }
  });

  const results: Record<string, any> = {};
  Object.keys(agentMap).forEach((email) => {
    const { csat, kscat, dsat } = agentMap[email];
    const totalCount = csat + kscat + dsat;
    const totalWoKarma = csat + dsat;
    const kscatPct = totalCount > 0 ? (csat / totalCount) * 100 : 0;
    const csatPct = totalWoKarma > 0 ? (csat / totalWoKarma) * 100 : 0;
    const variance = csatPct - kscatPct;

    results[email] = {
      csat,
      kscat,
      dsat,
      totalCount,
      totalWoKarma,
      kscatPercent: Number(kscatPct.toFixed(2)),
      csatPercent: Number(csatPct.toFixed(2)),
      variance: Number(variance.toFixed(2)),
    };
  });

  return results;
};

// 2. Process Metrics File (Agent Rows + Team/Floor Averages)
export const processMetricsFile = (rows: any[]) => {
  const agentMetrics: Record<string, Record<string, number>> = {};
  const teamAverages: Record<string, number> = {};
  const floorAverages: Record<string, number> = {};

  rows.forEach((row, index) => {
    // Agent calculations (Columns C, D, E)
    const agentEmail = String(row['Agent'] || row['agent'] || '').trim().toLowerCase();
    const metricName = String(row['Unnamed: 3'] || row['Metric Name'] || row['Metric'] || '').trim();
    const metricVal = parseCleanNumber(row['01/09/26'] || row['Value'] || row['E']);

    if (agentEmail && metricName) {
      if (!agentMetrics[agentEmail]) agentMetrics[agentEmail] = {};
      agentMetrics[agentEmail][metricName] = metricVal;
    }

    // Team Overall Averages (Rows 1-22, Columns K & L -> Unnamed: 10 & 1/9/2026)
    const teamMetricName = String(row['Unnamed: 10'] || '').trim();
    const teamMetricVal = parseCleanNumber(row['1/9/2026']);

    if (teamMetricName) {
      if (index <= 22) {
        teamAverages[teamMetricName] = teamMetricVal;
      } else if (index >= 24 && index <= 46) {
        floorAverages[teamMetricName] = teamMetricVal;
      }
    }
  });

  return { agentMetrics, teamAverages, floorAverages };
};

// 3. Process PVF File (Tardy & Idle Time)
export const processPVFFile = (rows: any[]) => {
  const pvfMap: Record<string, { tardySum: number; idleTimeSum: number; count: number }> = {};

  rows.forEach((row) => {
    const email = String(row['agent_email (clickable)'] || row['agent_email'] || '').trim().toLowerCase();
    if (!email) return;

    const tardy = parseCleanNumber(row['Unnamed: 35'] || row['AJ']);
    const idleTime = parseCleanNumber(row['time_not_working_h_shift_adjusted'] || row['L']);

    if (!pvfMap[email]) {
      pvfMap[email] = { tardySum: 0, idleTimeSum: 0, count: 0 };
    }

    if (tardy > 0) pvfMap[email].tardySum += tardy;
    pvfMap[email].idleTimeSum += idleTime;
    pvfMap[email].count += 1;
  });

  const results: Record<string, { tardyMinutes: number; idleTimeAvg: number }> = {};
  Object.keys(pvfMap).forEach((email) => {
    const { tardySum, idleTimeSum, count } = pvfMap[email];
    results[email] = {
      tardyMinutes: tardySum,
      idleTimeAvg: count > 0 ? Number((idleTimeSum / count).toFixed(2)) : 0,
    };
  });

  return results;
};
