export const parseCleanNumber = (val: any): number => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).replace(/%/g, '').replace(/,/g, '').trim();
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
};

// SECTION 10: KSCAT CALCULATIONS
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

    // Rule: CSAT = COUNTIFS(C:C, agent, I:I, "good")
    if (csatStatus === 'good') {
      agentMap[assignee].csat += 1;
    } else if (csatStatus === 'bad') {
      // Rule: KSCAT = COUNTIFS(C:C, agent, I:I, "bad", A:A, "<>"&agent)
      if (resolver !== assignee) {
        agentMap[assignee].kscat += 1;
      } 
      // Rule: DSAT = COUNTIFS(C:C, agent, I:I, "bad", A:A, agent)
      else {
        agentMap[assignee].dsat += 1;
      }
    }
  });

  const results: Record<string, any> = {};
  Object.keys(agentMap).forEach((email) => {
    const { csat, kscat, dsat } = agentMap[email];
    
    // Total Count = B3 + C3 + D3 (CSAT + KSCAT + DSAT)
    const totalCount = csat + kscat + dsat;
    
    // Total w/o Karma = B3 + D3 (CSAT + DSAT)
    const totalWoKarma = csat + dsat;

    // KSCAT % = IFERROR(CSAT / Total Count, 0)
    const kscatPct = totalCount > 0 ? (csat / totalCount) * 100 : 0;

    // CSAT % = IFERROR(CSAT / Total w/o Karma, 0)
    const csatPct = totalWoKarma > 0 ? (csat / totalWoKarma) * 100 : 0;

    // Variance = CSAT % - KSCAT %
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

// SECTION 12: PVF CALCULATIONS
export const processPVFFile = (rows: any[]) => {
  const pvfMap: Record<string, { tardySum: number; idleTimeSum: number; count: number }> = {};

  rows.forEach((row) => {
    const email = String(row['agent_email (clickable)'] || row['agent_email'] || row['A'] || '').trim().toLowerCase();
    if (!email) return;

    // Tardy/minute = SUMIFS(PVF!AJ:AJ, PVF!A:A, A3, PVF!AJ:AJ, ">0")
    const tardyVal = parseCleanNumber(row['Unnamed: 35'] || row['AJ'] || row['tardy']);
    
    // Idle Time = AVERAGEIFS(PVF!L:L, PVF!A:A, A3)
    const idleVal = parseCleanNumber(row['time_not_working_h_shift_adjusted'] || row['L'] || row['idle']);

    if (!pvfMap[email]) {
      pvfMap[email] = { tardySum: 0, idleTimeSum: 0, count: 0 };
    }

    if (tardyVal > 0) {
      pvfMap[email].tardySum += tardyVal;
    }
    
    pvfMap[email].idleTimeSum += idleVal;
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

// SECTIONS 13, 14, 15, 16: METRICS FILE PARSER
export const processMetricsFile = (rows: any[]) => {
  const agentMetrics: Record<string, Record<string, number>> = {};
  const teamAverages: Record<string, number> = {};
  const floorAverages: Record<string, number> = {};

  rows.forEach((row, index) => {
    // 1. Individual Agent Mapping (Columns C, D, E)
    const agentEmail = String(row['Agent'] || row['agent'] || '').trim().toLowerCase();
    const metricName = String(row['Unnamed: 3'] || row['Metric Name'] || '').trim();
    const metricVal = parseCleanNumber(row['01/09/26'] || row['Value'] || row['E']);

    if (agentEmail && metricName) {
      if (!agentMetrics[agentEmail]) agentMetrics[agentEmail] = {};
      agentMetrics[agentEmail][metricName] = metricVal;
    }

    // 2. Team Overall Averages (Rows 1-22, Columns K & L -> Unnamed: 10 & 1/9/2026)
    const teamKey = String(row['Unnamed: 10'] || '').trim();
    const teamVal = parseCleanNumber(row['1/9/2026']);

    if (teamKey) {
      if (index <= 22) {
        teamAverages[teamKey] = teamVal;
      } else if (index >= 24 && index <= 46) {
        // 3. Floor Averages (Rows 25-46, Columns K & L)
        floorAverages[teamKey] = teamVal;
      }
    }
  });

  return { agentMetrics, teamAverages, floorAverages };
};
