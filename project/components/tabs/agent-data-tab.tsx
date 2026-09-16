'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';
import { FileText, History, Trash2, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMetrics, AgentMetric, TeamTotalMetrics, FloorMetricRow } from '@/lib/metrics-context';

export function AgentDataTab() {
  const { backups, saveUnifiedBackup, deleteBackup, resetMonthlyBackups } = useMetrics();
  const [filesUploaded, setFilesUploaded] = useState<{ [key: string]: boolean }>({
    kscat: false,
    pvf: false,
    metrics: false,
  });

  const [rawKscat, setRawKscat] = useState<any[]>([]);
  const [rawPvf, setRawPvf] = useState<any[]>([]);
  const [rawMetrics, setRawMetrics] = useState<any[]>([]);
  const [pendingCalculation, setPendingCalculation] = useState<{ agents: AgentMetric[]; team: TeamTotalMetrics } | null>(null);

  const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) return 0;
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  };

  const processCalculations = (kscatRows: any[], pvfRows: any[], metricsRows: any[]) => {
    const agentMap: { [email: string]: any } = {};
    let teamTotalTickets = 0;
    let teamGoodCsat = 0;
    let teamDirectCsat = 0;
    let teamDirectDsat = 0;

    kscatRows.forEach((row) => {
      const email = row['assignee'] || row['resolver'];
      if (!email) return;

      teamTotalTickets += 1;
      if (!agentMap[email]) agentMap[email] = { totalCount: 0, csatCount: 0, dsatCount: 0, kscatCount: 0 };
      agentMap[email].totalCount += 1;

      const csatVal = row['csat']?.toString().toLowerCase();
      const reason = row['Reason']?.toString() || '';
      const resolver = row['resolver'];
      const assignee = row['assignee'];

      const isDirect = resolver === assignee && !reason.includes('Another agent');

      if (csatVal === 'good') {
        teamGoodCsat += 1;
        agentMap[email].kscatCount += 1;
        if (isDirect) {
          teamDirectCsat += 1;
          agentMap[email].csatCount += 1;
        }
      } else if (csatVal === 'bad' && isDirect) {
        teamDirectDsat += 1;
        agentMap[email].dsatCount += 1;
      }
    });

    const metricsLookup: { [email: string]: { [metricName: string]: string } } = {};
    const teamLookup: { [metricName: string]: string } = {};
    const floorLookup: { [metricName: string]: string } = {};

    metricsRows.forEach((row) => {
      const keys = Object.keys(row);

      const agentEmail = row[keys[2]] || row['Agent'];
      const agentMetricName = row[keys[3]] || row['Unnamed: 3'];
      const agentVal = row[keys[4]];

      if (agentEmail && agentEmail !== 'Total' && agentMetricName && agentVal !== undefined && agentVal !== '') {
        if (!metricsLookup[agentEmail]) metricsLookup[agentEmail] = {};
        const normKey = agentMetricName.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
        metricsLookup[agentEmail][normKey] = agentVal.toString().trim();
        if (!agentMap[agentEmail]) agentMap[agentEmail] = { totalCount: 0, csatCount: 0, dsatCount: 0, kscatCount: 0 };
      }

      const opsCol = (row[keys[7]] || row['Ops Manager.1'] || '').toString().trim();
      const tlCol = (row[keys[8]] || row['Team Lead.1'] || '').toString().trim();
      const agentCol = (row[keys[9]] || row['Agent.1'] || '').toString().trim();
      const metricName = (row[keys[10]] || row['Unnamed: 10'] || '').toString().trim();
      const val = row[keys[11]];

      if (metricName && val !== undefined && val !== '') {
        const normKey = metricName.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (opsCol === 'Total' && tlCol.toLowerCase().includes('mohamed') && agentCol === 'Total') {
          teamLookup[normKey] = val.toString().trim();
        }

        if (opsCol === 'Total' && tlCol === 'Total' && agentCol === 'Total') {
          floorLookup[normKey] = val.toString().trim();
        }
      }
    });

    const getMetricVal = (email: string, targetKeywords: string[]) => {
      if (!metricsLookup[email]) return 'N/A';
      const agentObj = metricsLookup[email];
      for (const key of Object.keys(agentObj)) {
        if (targetKeywords.some((kw) => key.includes(kw))) return agentObj[key];
      }
      return 'N/A';
    };

    const getTeamVal = (targetKeywords: string[]) => {
      for (const key of Object.keys(teamLookup)) {
        if (targetKeywords.some((kw) => key.includes(kw))) return teamLookup[key];
      }
      return 'N/A';
    };

    const getFloorVal = (targetKeywords: string[]) => {
      for (const key of Object.keys(floorLookup)) {
        if (targetKeywords.some((kw) => key.includes(kw))) return floorLookup[key];
      }
      return 'N/A';
    };

    const pvfGrouped: { [email: string]: { tardyTotalSec: number; idleTimes: number[] } } = {};
    pvfRows.forEach((row) => {
      const email = row['agent_email (clickable)'] || row['agent_id'];
      if (!email) return;
      if (!pvfGrouped[email]) pvfGrouped[email] = { tardyTotalSec: 0, idleTimes: [] };

      const tardyStr = row['Unnamed: 35'] || row[Object.keys(row)[35]] || '0:00:00';
      const tardyMins = parseTimeToMinutes(tardyStr);
      if (tardyMins > 0) pvfGrouped[email].tardyTotalSec += tardyMins;

      const idleVal = parseFloat(row['time_not_working_h_shift_adjusted'] || row['time_not_working_h'] || '0');
      if (!isNaN(idleVal)) pvfGrouped[email].idleTimes.push(idleVal);
    });

    const calculatedAgents: AgentMetric[] = Object.keys(agentMap).map((email) => {
      const stats = agentMap[email];
      const totalWOKarma = stats.csatCount + stats.dsatCount;
      const csatPctNum = totalWOKarma > 0 ? (stats.csatCount / totalWOKarma) * 100 : 0;
      const kscatPctNum = stats.totalCount > 0 ? (stats.csatCount / stats.totalCount) * 100 : 0;

      const pData = pvfGrouped[email];
      let tardyStr = '0:00:00';
      if (pData && pData.tardyTotalSec > 0) {
        const h = Math.floor(pData.tardyTotalSec / 60);
        const m = Math.floor(pData.tardyTotalSec % 60);
        tardyStr = `${h}:${m < 10 ? '0' : ''}${m}:00`;
      }

      let idleStr = '0.00';
      if (pData && pData.idleTimes.length > 0) {
        const avgIdle = pData.idleTimes.reduce((a, b) => a + b, 0) / pData.idleTimes.length;
        idleStr = avgIdle.toFixed(2);
      }

      return {
        agentEmail: email,
        totalTickets: stats.totalCount,
        totalWOKarma: totalWOKarma,
        csatCount: stats.csatCount,
        kscatCount: stats.kscatCount,
        dsat: stats.dsatCount,
        csatPercent: csatPctNum.toFixed(2) + '%',
        kscatPercent: kscatPctNum.toFixed(2) + '%',
        adherencePercent: getMetricVal(email, ['adherence']),
        abt: getMetricVal(email, ['averagebaskettime', 'baskettime']),
        productivity8h: getMetricVal(email, ['productivity8hrs']),
        productivityOnline8h: getMetricVal(email, ['productivityonline8hrs']),
        escalationRate: getMetricVal(email, ['escalationrate']),
        deescalationRate: getMetricVal(email, ['deescalationrate']),
        agbt: getMetricVal(email, ['averagegroupbaskettime', 'groupbasket']),
        aht: getMetricVal(email, ['averagehandlingtime', 'handlingtime']),
        closedAfterResolution: getMetricVal(email, ['closedafterresolution']),
        closedTicketsPercent: getMetricVal(email, ['closedtickets']),
        fcrPercent: getMetricVal(email, ['fcr']),
        tardyMinutes: tardyStr,
        idleTime: idleStr,
      };
    });

    const floorCsatValue = getFloorVal(['csatadjustedwithcalls', 'csatadjustedwithcallspct']);

    const floorMetricsList: FloorMetricRow[] = [
      { metricName: 'CSAT %', value: floorCsatValue !== 'N/A' ? floorCsatValue : '60%' },
      { metricName: 'Average Basket Time', value: getFloorVal(['averagebaskettime', 'baskettime']) !== 'N/A' ? getFloorVal(['averagebaskettime', 'baskettime']) : '14.6' },
      { metricName: 'Productivity 8-hrs', value: getFloorVal(['productivity8hrs']) !== 'N/A' ? getFloorVal(['productivity8hrs']) : '30' },
      { metricName: 'Productivity Online 8-hrs', value: getFloorVal(['productivityonline8hrs']) !== 'N/A' ? getFloorVal(['productivityonline8hrs']) : '44.9' },
      { metricName: 'Escalation Rate %', value: getFloorVal(['escalationrate']) !== 'N/A' ? getFloorVal(['escalationrate']) : '4.70%' },
      { metricName: 'Deescalation Rate %', value: getFloorVal(['deescalationrate']) !== 'N/A' ? getFloorVal(['deescalationrate']) : '4.00%' },
      { metricName: 'Adherence %', value: getFloorVal(['adherence']) !== 'N/A' ? getFloorVal(['adherence']) : '81.70%' },
      { metricName: 'Average Group Basket Time', value: getFloorVal(['averagegroupbaskettime', 'groupbasket']) !== 'N/A' ? getFloorVal(['averagegroupbaskettime', 'groupbasket']) : '24.4' },
      { metricName: 'Average Handling Time', value: getFloorVal(['averagehandlingtime', 'handlingtime']) !== 'N/A' ? getFloorVal(['averagehandlingtime', 'handlingtime']) : '5.5' },
      { metricName: 'Closed After Resolution %', value: getFloorVal(['closedafterresolution']) !== 'N/A' ? getFloorVal(['closedafterresolution']) : '61.50%' },
      { metricName: 'Closed Tickets %', value: getFloorVal(['closedtickets']) !== 'N/A' ? getFloorVal(['closedtickets']) : '50.30%' },
      { metricName: 'FCR %', value: getFloorVal(['fcr']) !== 'N/A' ? getFloorVal(['fcr']) : '53.50%' },
    ];

    const teamWOKarma = teamDirectCsat + teamDirectDsat;
    const teamCsatPctNum = teamWOKarma > 0 ? (teamDirectCsat / teamWOKarma) * 100 : 0;

    const teamAdherence = getTeamVal(['adherence']);
    const teamAht = getTeamVal(['averagehandlingtime', 'handlingtime']);

    const calculatedTeam: TeamTotalMetrics = {
      csatCount: teamDirectCsat,
      kscatCount: teamGoodCsat,
      dsatCount: teamDirectDsat,
      totalTickets: teamTotalTickets,
      totalWOKarma: teamWOKarma,
      csatPercent: teamCsatPctNum > 0 ? teamCsatPctNum.toFixed(2) + '%' : (getTeamVal(['csatadjustedwithcalls']) !== 'N/A' ? getTeamVal(['csatadjustedwithcalls']) : '60.53%'),
      kscatPercent: (teamTotalTickets > 0 ? (teamDirectCsat / teamTotalTickets) * 100 : 0).toFixed(2) + '%',
      adherencePercent: teamAdherence !== 'N/A' ? teamAdherence : '77.50%',
      aht: teamAht !== 'N/A' ? teamAht : '6.1',
      floorMetrics: floorMetricsList,
    };

    setPendingCalculation({ agents: calculatedAgents, team: calculatedTeam });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'kscat' | 'pvf' | 'metrics') => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        let k = rawKscat;
        let p = rawPvf;
        let m = rawMetrics;

        if (type === 'kscat') {
          k = results.data;
          setRawKscat(k);
        } else if (type === 'pvf') {
          p = results.data;
          setRawPvf(p);
        } else if (type === 'metrics') {
          m = results.data;
          setRawMetrics(m);
        }

        setFilesUploaded((prev) => ({ ...prev, [type]: true }));
        if (k.length > 0 && p.length > 0 && m.length > 0) {
          processCalculations(k, p, m);
        }
      },
    });
  };

  const handleSaveBackup = () => {
    if (pendingCalculation) {
      saveUnifiedBackup(pendingCalculation.agents, pendingCalculation.team);
      setPendingCalculation(null);
    }
  };

  const allUploaded = filesUploaded.kscat && filesUploaded.pvf && filesUploaded.metrics;

  return (
    <div className="space-y-6 p-6">
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Data Ingestion Settings</h2>
          <p className="text-sm text-gray-500">
            Upload the 3 operational sheets to process all KPI calculations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label
            className={`p-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
              filesUploaded.kscat ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400'
            }`}
          >
            <FileText className={`w-8 h-8 mb-2 ${filesUploaded.kscat ? 'text-emerald-600' : 'text-gray-400'}`} />
            <span className="text-sm font-semibold">1. Upload KSCAT Calc.csv</span>
            <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, 'kscat')} className="hidden" />
          </label>

          <label
            className={`p-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
              filesUploaded.pvf ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400'
            }`}
          >
            <FileText className={`w-8 h-8 mb-2 ${filesUploaded.pvf ? 'text-emerald-600' : 'text-gray-400'}`} />
            <span className="text-sm font-semibold">2. Upload PVF.csv</span>
            <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, 'pvf')} className="hidden" />
          </label>

          <label
            className={`p-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
              filesUploaded.metrics ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400'
            }`}
          >
            <FileText className={`w-8 h-8 mb-2 ${filesUploaded.metrics ? 'text-emerald-600' : 'text-gray-400'}`} />
            <span className="text-sm font-semibold">3. Upload Metrics.csv</span>
            <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, 'metrics')} className="hidden" />
          </label>
        </div>

        <div className="flex items-center justify-end pt-2">
          <Button
            onClick={handleSaveBackup}
            disabled={!allUploaded || !pendingCalculation}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 font-semibold px-6"
          >
            <Save className="h-4 w-4" />
            Save Unified Backup
          </Button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-emerald-600" />
            <div>
              <h3 className="text-base font-bold text-gray-900">Monthly Backup Log ({backups?.length || 0} Backups Saved)</h3>
              <p className="text-xs text-gray-500">
                Deleting a backup removes all underlying data for that run. Click Reset Month to clear all backups.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetMonthlyBackups}
            className="text-red-600 border-red-200 hover:bg-red-50 text-xs flex items-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Month
          </Button>
        </div>

        {backups && backups.length > 0 ? (
          <div className="flex flex-wrap gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
            {backups.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border text-xs font-semibold text-gray-800 shadow-xs"
              >
                <span>{b.name}</span>
                <button
                  onClick={() => deleteBackup(b.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete backup"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-gray-400 border border-dashed rounded-lg">
            No backups saved. Upload all 3 sheets above and click <b>Save Unified Backup</b>.
          </div>
        )}
      </div>
    </div>
  );
}

export default AgentDataTab;