const fetchMetrics = async (user?: UserProfile) => {
  setLoading(true);
  const activeUser = user || currentUser;

  try {
    // Order by created_at descending so the newest upload comes first
    let query = supabase
      .from('agent_metrics')
      .select('*')
      .order('created_at', { ascending: false });

    if (activeUser && activeUser.role === 'Agent') {
      query = query.eq('agent_email', activeUser.user_email);
    } else if (activeUser && activeUser.role === 'Team Leader') {
      query = query.eq('team_name', activeUser.team_name);
    }

    const { data: agentData } = await query;

    if (agentData) {
      // Filter out duplicate agent rows across multiple backup uploads (keep newest upload)
      const uniqueAgentsMap = new Map();
      agentData.forEach((row) => {
        if (!uniqueAgentsMap.has(row.agent_email)) {
          uniqueAgentsMap.set(row.agent_email, row);
        }
      });

      const deduplicatedAgentMetrics = Array.from(uniqueAgentsMap.values());
      setAgentMetrics(deduplicatedAgentMetrics);
    }

    const { data: aggData } = await supabase
      .from('level_aggregates')
      .select('*')
      .order('created_at', { ascending: false });

    if (aggData) {
      const teamMap: Record<string, any> = {};
      const floorMap: Record<string, any> = {};

      aggData.forEach((item) => {
        if (item.level_type === 'Team Overall' && !teamMap[item.metric_key]) {
          teamMap[item.metric_key] = item.metric_value;
        } else if (item.level_type === 'Floor Average' && !floorMap[item.metric_key]) {
          floorMap[item.metric_key] = item.metric_value;
        }
      });

      setTeamMetrics(teamMap);
      setFloorAverages(floorMap);
    }
  } catch (e) {
    console.error('Error fetching dashboard context:', e);
  } finally {
    setLoading(false);
  }
};
