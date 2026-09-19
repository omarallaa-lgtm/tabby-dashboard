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

// Parser for Metrics.csv extracting all 12 operational metrics
export const processMetricsFile = (rows: any[]) => {
  const agentMetrics: Record<string, Record<string, number>> = {};
  const teamAverages: Record<string, number> = {};
  const floorAverages: Record<string, number> = {};

  rows.forEach((row, index) => {
    // 1. Agent-Level Extraction (Columns C, D, E -> Positional indices 2, 3, 4)
    const agentEmail = String(getColVal(row, ['Agent', 'agent'], 2) || '').trim().toLowerCase();
    const metricName = String(getColVal(row, ['Unnamed: 3', 'Metric Name'], 3) || '').trim();
    const metricVal = parseCleanNumber(getColVal(row, ['01/09/26', 'Value', 'E'], 4));

    if (agentEmail && metricName) {
      if (!agentMetrics[agentEmail]) agentMetrics[agentEmail] = {};
      agentMetrics[agentEmail][metricName] = metricVal;
    }

    // 2. Team Overall & Floor Average Extraction (Columns K & L -> Positional indices 10 & 11)
    const teamKey = String(getColVal(row, ['Unnamed: 10', 'Metric'], 10) || '').trim();
    const teamVal = parseCleanNumber(getColVal(row, ['1/9/2026', 'Value', 'L'], 11));

    if (teamKey) {
      // Rows 0..20: Team Overall
      if (index <= 20) {
        teamAverages[teamKey] = teamVal;
      } 
      // Rows 24..44: Floor Average
      else if (index >= 24 && index <= 44) {
        floorAverages[teamKey] = teamVal;
      }
    }
  });

  return { agentMetrics, teamAverages, floorAverages };
};
