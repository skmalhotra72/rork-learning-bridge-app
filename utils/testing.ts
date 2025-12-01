import { supabase } from '@/lib/supabase';
import { getPendingActions } from '@/services/offlineSync';

export interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  details?: string;
  error?: string;
}

export interface TestResults {
  passed: number;
  failed: number;
  warnings: number;
  tests: TestResult[];
}

// Feature testing checklist
export const runFeatureTests = async (userId: string): Promise<TestResults> => {
  const results: TestResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
  };

  // Test 1: User authentication
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profile && !error) {
      results.tests.push({ name: 'Authentication', status: 'PASS' });
      results.passed++;
    } else {
      throw new Error('No profile found');
    }
  } catch (error) {
    results.tests.push({ 
      name: 'Authentication', 
      status: 'FAIL', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    results.failed++;
  }

  // Test 2: Subject progress
  try {
    const { data: subjects, error } = await supabase
      .from('subject_progress')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    if (subjects && subjects.length > 0) {
      results.tests.push({ 
        name: 'Subject Progress', 
        status: 'PASS',
        details: `${subjects.length} subjects found`
      });
      results.passed++;
    } else {
      results.tests.push({ 
        name: 'Subject Progress', 
        status: 'WARN',
        details: 'No subjects found'
      });
      results.warnings++;
    }
  } catch (error) {
    results.tests.push({ 
      name: 'Subject Progress', 
      status: 'FAIL', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    results.failed++;
  }

  // Test 3: Gamification
  try {
    const { data: stats, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    
    if (stats && stats.total_xp >= 0) {
      results.tests.push({ 
        name: 'Gamification', 
        status: 'PASS',
        details: `XP: ${stats.total_xp}, Level: ${stats.current_level}`
      });
      results.passed++;
    } else {
      throw new Error('Invalid stats data');
    }
  } catch (error) {
    results.tests.push({ 
      name: 'Gamification', 
      status: 'FAIL', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    results.failed++;
  }

  // Test 4: Offline sync
  try {
    const pendingActions = await getPendingActions();
    results.tests.push({ 
      name: 'Offline Sync', 
      status: 'PASS',
      details: `${pendingActions.length} pending actions`
    });
    results.passed++;
  } catch (error) {
    results.tests.push({ 
      name: 'Offline Sync', 
      status: 'FAIL', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    results.failed++;
  }

  // Test 5: Database connection
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error) throw error;
    
    results.tests.push({ 
      name: 'Database Connection', 
      status: 'PASS'
    });
    results.passed++;
  } catch (error) {
    results.tests.push({ 
      name: 'Database Connection', 
      status: 'FAIL', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    results.failed++;
  }

  return results;
};

// Performance monitoring
export const measurePerformance = () => {
  const start = Date.now();
  
  return {
    end: () => {
      const duration = Date.now() - start;
      console.log(`⏱️ Performance: ${duration}ms`);
      return duration;
    }
  };
};

// Memory usage check (web only)
export const checkMemoryUsage = (): { used: number; total: number; limit: number } | null => {
  if (typeof window !== 'undefined' && (window as any).performance?.memory) {
    const memory = (window as any).performance.memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576),
      total: Math.round(memory.totalJSHeapSize / 1048576),
      limit: Math.round(memory.jsHeapSizeLimit / 1048576)
    };
  }
  return null;
};

// Network latency test
export const testNetworkLatency = async (): Promise<number> => {
  const start = Date.now();
  try {
    await supabase.from('profiles').select('id').limit(1);
    return Date.now() - start;
  } catch {
    return -1;
  }
};

// Check app health
export const checkAppHealth = async (userId: string): Promise<{
  healthy: boolean;
  issues: string[];
  warnings: string[];
}> => {
  const issues: string[] = [];
  const warnings: string[] = [];

  try {
    // Check user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      issues.push('User profile not found');
    }

    // Check user stats exist
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (statsError || !stats) {
      warnings.push('User stats not initialized');
    }

    // Check pending offline actions
    const pending = await getPendingActions();
    if (pending.length > 10) {
      warnings.push(`${pending.length} pending offline actions`);
    }

    // Check network latency
    const latency = await testNetworkLatency();
    if (latency > 2000) {
      warnings.push(`High network latency: ${latency}ms`);
    } else if (latency === -1) {
      issues.push('Network connection failed');
    }

  } catch (error) {
    issues.push(`Health check error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  return {
    healthy: issues.length === 0,
    issues,
    warnings
  };
};

// Diagnostic information
export const getDiagnosticInfo = async (userId: string) => {
  const memoryInfo = checkMemoryUsage();
  const pendingActions = await getPendingActions();
  const latency = await testNetworkLatency();
  const health = await checkAppHealth(userId);

  return {
    timestamp: new Date().toISOString(),
    userId,
    memory: memoryInfo,
    network: {
      latency: latency === -1 ? 'Failed' : `${latency}ms`,
      connected: latency !== -1
    },
    offline: {
      pendingActions: pendingActions.length,
      actions: pendingActions.map(a => ({ type: a.type, timestamp: a.timestamp }))
    },
    health
  };
};
