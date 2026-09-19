export const parseCleanNumber = (val: any): number => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).replace(/%/g, '').replace(/,/g, '').trim();
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
};

const getColVal = (row: any, keys: string[], posIdx?: number): any => {
  if (Array.isArray(row)) {
    if (posIdx !== undefined && posIdx < row.length) return row[posIdx];
  } else if (typeof row === 'object' && row !== null) {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== '') return row[key];
    }
    const objKeys = Object.keys(row);
    if (posIdx !== undefined && posIdx < objKeys.length) {
      return row[objKeys[posIdx]];
    }
  }
  return '';
};

// 1. KSCAT Calc Parser (Exact SheetCOUNTIFS & Channel Awareness)
export const processKSCATCalc = (rows: any[]) => {
  const agentMap: Record<string, { 
    csat: number; kscat: number; dsat: number;
    chatCsat: number; chatKscat: number; chatDsat: number;
    phoneCsat: number; phoneKscat: number; phoneDsat: number;
  }> = {};

  rows.forEach((row) => {
    const assignee = String(getColVal(row, ['assignee', 'Assignee'], 2) || '').trim().toLowerCase();
    const resolver = String(getColVal(row, ['resolver', 'Resolver'], 0) || '').trim().toLowerCase();
    const csatStatus = String(getColVal(row, ['csat', 'CSAT'], 8) || '').trim().toLowerCase();
    const channel = String(getColVal(row, ['ticket_channel', 'Channel'], 7) || '').trim().toLowerCase();

    if (!assignee) return;

    if (!agentMap[assignee]) {
      agentMap[assignee] = { 
        csat: 0, kscat: 0, dsat: 0, 
        chatCsat: 0, chatKscat: 0, chatDsat: 0, 
        phoneCsat: 0, phoneKscat: 0, phoneDsat: 0 
      };
    }

    if (csatStatus === 'good') {
      agentMap[assignee].csat += 1;
      if (channel === 'chat') agentMap[assignee].chatCsat += 1;
      if (channel === 'phone') agentMap[assignee].phoneCsat += 1;
    } else if (csatStatus === 'bad') {
      if (resolver !== assignee) {
        agentMap[assignee].kscat += 1;
        if (channel === 'chat') agentMap[assignee].chatKscat += 1;
        if (channel === 'phone') agentMap[assignee].phoneKscat += 1;
      } else {
        agentMap[assignee].dsat += 1;
        if (channel === 'chat') agentMap[assignee].chatDsat += 1;
        if (channel === 'phone') agentMap[assignee].phoneDsat += 1;
      }
    }
  });

  const agentResults: Record<string, any> = {};
  let totalCsat = 0, totalKscat = 0, totalDsat = 0;

  Object.keys(agentMap).forEach((email) => {
    const a = agentMap[email];
    totalCsat += a.csat;
    totalKscat += a.kscat;
    totalDsat += a.dsat;

    const totalCount = a.csat + a.kscat + a.dsat;
    const totalWoKarma = a.csat + a.dsat;
    const kscatPct = totalCount > 0 ? (a.csat / totalCount) * 100 : 0;
    const csatPct = totalWoKarma > 0 ? (a.csat / totalWoKarma) * 100 : 0;

    agentResults[email] = {
      csat: a.csat,
      kscat: a.kscat,
      dsat: a.dsat,
      totalCount,
      totalWoKarma,
      kscatPercent: Number(kscatPct.toFixed(2)),
      csatPercent: Number(csatPct.toFixed(2)),
      variance: Number((csatPct - kscatPct).toFixed(2)),
      chatCsat: a.chatCsat,
      chatKscat: a.chatKscat,
      chatDsat: a.chatDsat,
      phoneCsat: a.phoneCsat,
      phoneKscat: a.phoneKscat,
      phoneDsat: a.phoneDsat,
    };
  });

  const teamTotalCount = totalCsat + totalKscat + totalDsat;
  const teamTotalWoKarma = totalCsat + totalDsat;

  return {
    agentResults,
    teamKscatTotals: {
      CSAT: totalCsat,
      KSCAT: totalKscat,
      DSAT: totalDsat,
      'Total Count': teamTotalCount,
      'Total w/o Karma': teamTotalWoKarma,
      'CSAT %': teamTotalWoKarma > 0 ? Number(((totalCsat / teamTotalWoKarma) * 100).toFixed(2)) : 0,
      'KSCAT %': teamTotalCount > 0 ? Number(((totalCsat / teamTotalCount) * 100).toFixed(2)) : 0,
    },
  };
};

// 2. Process PVF File
export const processPVFFile = (rows: any[]) => {
  const pvfMap: Record<string, { tardySum: number; idleTimeSum: number; count: number }> = {};

  rows.forEach((row) => {
    const email = String(getColVal(row, ['agent_email (clickable)', 'agent_email'], 0) || '').trim().toLowerCase();
    if (!email) return;

    const tardyVal = parseCleanNumber(getColVal(row, ['AJ', 'tardy_minute', 'Unnamed: 35'], 35));
    const idleVal = parseCleanNumber(getColVal(row, ['time_not_working_h_shift_adjusted', 'L'], 11));

    if (!pvfMap[email]) {
      pvfMap[email] = { tardySum: 0, idleTimeSum: 0, count: 0 };
    }

    if (tardyVal > 0) pvfMap[email].tardySum += tardyVal;
    pvfMap[email].idleTimeSum += idleVal;
    pvfMap[email].count += 1;
  });

  const results: Record<string, { tardyMinutes: number; idleTimeAvg: number }> = {};
  Object.keys(pvfMap).forEach((email) => {
    const { tardySum, idleTimeSum, count } = pvfMap[email];
    results[email] = {
      tardyMinutes: Number(tardySum.toFixed(2)),
      idleTimeAvg: count > 0 ? Number((idleTimeSum / count).toFixed(2)) : 0,
    };
  });

  return results;
};

// 3. Process Metrics File (Exact Row 1-22 Team & Row 25-46 Floor Extraction)
export const processMetricsFile = (rows: any[]) => {
  const agentMetrics: Record<string, Record<string, number>> = {};
  const teamAverages: Record<string, number> = {};
  const floorAverages: Record<string, number> = {};

  rows.forEach((row, index) => {
    // Agent Extraction
    const agentEmail = String(getColVal(row, ['Agent', 'agent'], 2) || '').trim().toLowerCase();
    const metricName = String(getColVal(row, ['Unnamed: 3', 'Metric Name'], 3) || '').trim();
    const metricVal = parseCleanNumber(getColVal(row, ['01/09/26', 'Value', 'E'], 4));

    if (agentEmail && metricName) {
      if (!agentMetrics[agentEmail]) agentMetrics[agentEmail] = {};
      agentMetrics[agentEmail][metricName] = metricVal;
    }

    // Team Overall & Floor Extraction (Columns K & L)
    const teamKey = String(getColVal(row, ['Unnamed: 10', 'Metric'], 10) || '').trim();
    const teamVal = parseCleanNumber(getColVal(row, ['1/9/2026', 'Value', 'L'], 11));

    if (teamKey) {
      if (index <= 22) {
        teamAverages[teamKey] = teamVal;
      } else if (index >= 24 && index <= 46) {
        floorAverages[teamKey] = teamVal;
      }
    }
  });

  return { agentMetrics, teamAverages, floorAverages };
};
