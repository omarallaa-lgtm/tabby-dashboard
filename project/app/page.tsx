const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setErrorMessage('');
  const cleanEmail = email.trim().toLowerCase();

  // 1. Direct Admin Fallback Check
  if (cleanEmail === 'omar.allaa@tabby.ai' && password === 'Boyka@1322') {
    const adminUser = {
      user_email: cleanEmail,
      username: 'omar.allaa',
      role: 'Admin' as const,
      team_name: 'Support Tier 1',
      floor_name: 'Floor 1',
      account_status: 'Active' as const,
      allowed_tabs: ['overview', 'metrics', 'team', 'requests', 'announcements', 'agent-data', 'admin'],
    };
    setCurrentUser(adminUser);
    if (typeof refreshMetrics === 'function') refreshMetrics(adminUser);
    return;
  }

  // 2. Supabase User Profiles Lookup
  try {
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_email', cleanEmail)
      .single();

    if (userProfile && userProfile.password_hash === password) {
      setCurrentUser(userProfile);
      if (typeof refreshMetrics === 'function') refreshMetrics(userProfile);
      return;
    }
  } catch (err) {
    console.error('Supabase auth error:', err);
  }

  // 3. Fallback Error Message
  setErrorMessage("😼 Invalid email or password. Please verify your Tabby.ai credentials.");
};
