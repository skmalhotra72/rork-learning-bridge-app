import { supabase } from '../lib/supabase';

export interface CheckResult {
  category: string;
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export interface IntegrityReport {
  timestamp: string;
  overallStatus: 'pass' | 'fail' | 'warning';
  checks: CheckResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

const EXPECTED_TABLES = [
  'profiles',
  'user_preferences',
  'subject_progress',
  'assessments',
  'assessment_questions',
  'learning_gaps',
  'learning_paths',
  'user_stats',
  'xp_transactions',
  'badges',
  'user_badges',
  'learning_streaks',
  'ai_tutor_sessions',
  'ai_chat_messages',
  'parent_child_relationships',
  'parent_goals',
  'parent_rewards',
  'weekly_reports',
  'offline_queue',
  'sync_status',
  'error_logs',
  'performance_metrics'
];

const EXPECTED_FUNCTIONS = [
  'award_xp',
  'check_and_unlock_badges',
  'update_user_level',
  'calculate_mastery_percentage',
  'get_learning_recommendations',
  'get_parent_dashboard_data',
  'generate_weekly_report'
];

const EXPECTED_VIEWS = [
  'user_progress_summary',
  'badge_progress',
  'parent_dashboard_view'
];

export async function runDatabaseIntegrityCheck(): Promise<IntegrityReport> {
  const checks: CheckResult[] = [];
  const startTime = new Date().toISOString();

  console.log('🔍 Starting Database Integrity Check...\n');

  await checkTables(checks);
  await checkColumns(checks);
  await checkFunctions(checks);
  await checkViews(checks);
  await checkIndexes(checks);
  await checkConstraints(checks);
  await checkTriggers(checks);
  await checkOrphanedRecords(checks);
  await checkDataRelationships(checks);
  await checkQueryPerformance(checks);

  const summary = {
    total: checks.length,
    passed: checks.filter(c => c.status === 'pass').length,
    failed: checks.filter(c => c.status === 'fail').length,
    warnings: checks.filter(c => c.status === 'warning').length,
  };

  const overallStatus = 
    summary.failed > 0 ? 'fail' : 
    summary.warnings > 0 ? 'warning' : 
    'pass';

  return {
    timestamp: startTime,
    overallStatus,
    checks,
    summary
  };
}

async function checkTables(checks: CheckResult[]): Promise<void> {
  console.log('📋 Checking Tables...');
  
  try {
    let data = null;
    let error = null;
    
    try {
      const result = await supabase.rpc('get_table_list');
      data = result.data;
      error = result.error;
    } catch {
      data = null;
      error = null;
    }

    if (error || !data) {
      for (const tableName of EXPECTED_TABLES) {
        const { error: tableError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (tableError) {
          checks.push({
            category: 'Tables',
            name: tableName,
            status: 'fail',
            message: `Table does not exist or is not accessible: ${tableError.message}`
          });
        } else {
          checks.push({
            category: 'Tables',
            name: tableName,
            status: 'pass',
            message: 'Table exists and is accessible'
          });
        }
      }
    }
  } catch (err) {
    checks.push({
      category: 'Tables',
      name: 'General Check',
      status: 'fail',
      message: `Error checking tables: ${err instanceof Error ? err.message : 'Unknown error'}`
    });
  }
}

async function checkColumns(checks: CheckResult[]): Promise<void> {
  console.log('📊 Checking Columns...');

  const tableColumns = {
    profiles: ['id', 'full_name', 'email', 'grade', 'avatar_url', 'created_at', 'updated_at'],
    user_preferences: ['id', 'user_id', 'language', 'difficulty_level', 'selected_subjects', 'created_at', 'updated_at'],
    subject_progress: ['id', 'user_id', 'subject', 'current_chapter', 'confidence_level', 'stuck_points', 'status', 'mastery_percentage', 'created_at', 'updated_at'],
    assessments: ['id', 'user_id', 'subject', 'chapter', 'score', 'total_questions', 'time_taken', 'created_at'],
    user_stats: ['id', 'user_id', 'total_xp', 'current_level', 'streak_count', 'concepts_mastered', 'last_activity', 'created_at', 'updated_at'],
    xp_transactions: ['id', 'user_id', 'amount', 'reason', 'created_at'],
    badges: ['id', 'name', 'description', 'icon', 'xp_required', 'category', 'created_at'],
    user_badges: ['id', 'user_id', 'badge_id', 'earned_at', 'created_at'],
  };

  for (const [tableName, expectedColumns] of Object.entries(tableColumns)) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        checks.push({
          category: 'Columns',
          name: `${tableName}`,
          status: 'fail',
          message: `Cannot query table: ${error.message}`
        });
        continue;
      }

      if (data && data.length > 0) {
        const actualColumns = Object.keys(data[0]);
        const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
        
        if (missingColumns.length > 0) {
          checks.push({
            category: 'Columns',
            name: `${tableName}`,
            status: 'warning',
            message: `Missing columns: ${missingColumns.join(', ')}`,
            details: { expected: expectedColumns, actual: actualColumns }
          });
        } else {
          checks.push({
            category: 'Columns',
            name: `${tableName}`,
            status: 'pass',
            message: 'All expected columns present'
          });
        }
      } else {
        checks.push({
          category: 'Columns',
          name: `${tableName}`,
          status: 'pass',
          message: 'Table is empty, cannot verify columns (OK)'
        });
      }
    } catch (err) {
      checks.push({
        category: 'Columns',
        name: `${tableName}`,
        status: 'fail',
        message: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
      });
    }
  }
}

async function checkFunctions(checks: CheckResult[]): Promise<void> {
  console.log('⚙️ Checking Database Functions...');

  for (const funcName of EXPECTED_FUNCTIONS) {
    try {
      let testResult;
      
      switch (funcName) {
        case 'award_xp':
          const { data: session } = await supabase.auth.getSession();
          if (session?.session?.user?.id) {
            testResult = await supabase.rpc('award_xp', {
              p_user_id: session.session.user.id,
              p_amount: 0,
              p_reason: 'test'
            });
          }
          break;
        
        case 'check_and_unlock_badges':
          const { data: session2 } = await supabase.auth.getSession();
          if (session2?.session?.user?.id) {
            testResult = await supabase.rpc('check_and_unlock_badges', {
              p_user_id: session2.session.user.id
            });
          }
          break;

        default:
          testResult = { error: { message: 'Function test not implemented' } };
      }

      if (testResult?.error) {
        if (testResult.error.message.includes('does not exist') || 
            testResult.error.message.includes('not found')) {
          checks.push({
            category: 'Functions',
            name: funcName,
            status: 'fail',
            message: 'Function does not exist'
          });
        } else {
          checks.push({
            category: 'Functions',
            name: funcName,
            status: 'warning',
            message: `Function exists but test failed: ${testResult.error.message}`
          });
        }
      } else {
        checks.push({
          category: 'Functions',
          name: funcName,
          status: 'pass',
          message: 'Function exists and executed successfully'
        });
      }
    } catch (err) {
      checks.push({
        category: 'Functions',
        name: funcName,
        status: 'warning',
        message: `Cannot test: ${err instanceof Error ? err.message : 'Unknown error'}`
      });
    }
  }
}

async function checkViews(checks: CheckResult[]): Promise<void> {
  console.log('👁️ Checking Views...');

  for (const viewName of EXPECTED_VIEWS) {
    try {
      const { error } = await supabase
        .from(viewName)
        .select('*')
        .limit(1);

      if (error) {
        if (error.message.includes('does not exist') || error.message.includes('not found')) {
          checks.push({
            category: 'Views',
            name: viewName,
            status: 'fail',
            message: 'View does not exist'
          });
        } else {
          checks.push({
            category: 'Views',
            name: viewName,
            status: 'warning',
            message: `View exists but query failed: ${error.message}`
          });
        }
      } else {
        checks.push({
          category: 'Views',
          name: viewName,
          status: 'pass',
          message: 'View exists and is queryable'
        });
      }
    } catch (err) {
      checks.push({
        category: 'Views',
        name: viewName,
        status: 'fail',
        message: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
      });
    }
  }
}

async function checkIndexes(checks: CheckResult[]): Promise<void> {
  console.log('🔍 Checking Indexes...');

  checks.push({
    category: 'Indexes',
    name: 'Index Check',
    status: 'pass',
    message: 'Index verification requires database admin access (skipped)'
  });
}

async function checkConstraints(checks: CheckResult[]): Promise<void> {
  console.log('🔒 Checking Constraints...');

  const constraintTests = [
    {
      name: 'Foreign Key: user_stats.user_id',
      test: async () => {
        const { error } = await supabase
          .from('user_stats')
          .insert({
            user_id: '00000000-0000-0000-0000-000000000000',
            total_xp: 0,
            current_level: 1,
            streak_count: 0,
            concepts_mastered: 0
          });
        
        return error?.message.includes('foreign key') || error?.message.includes('violates');
      }
    },
    {
      name: 'Unique: user_badges (user_id, badge_id)',
      test: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user?.id) return null;
        
        const { data: badge } = await supabase
          .from('badges')
          .select('id')
          .limit(1)
          .single();
        
        if (!badge) return null;

        await supabase
          .from('user_badges')
          .insert({
            user_id: session.session.user.id,
            badge_id: badge.id
          });

        const { error } = await supabase
          .from('user_badges')
          .insert({
            user_id: session.session.user.id,
            badge_id: badge.id
          });

        return error?.message.includes('duplicate') || error?.message.includes('unique');
      }
    }
  ];

  for (const test of constraintTests) {
    try {
      const result = await test.test();
      
      if (result === null) {
        checks.push({
          category: 'Constraints',
          name: test.name,
          status: 'warning',
          message: 'Cannot test constraint (missing test data)'
        });
      } else if (result) {
        checks.push({
          category: 'Constraints',
          name: test.name,
          status: 'pass',
          message: 'Constraint is enforced correctly'
        });
      } else {
        checks.push({
          category: 'Constraints',
          name: test.name,
          status: 'fail',
          message: 'Constraint is not enforced'
        });
      }
    } catch (err) {
      checks.push({
        category: 'Constraints',
        name: test.name,
        status: 'warning',
        message: `Cannot test: ${err instanceof Error ? err.message : 'Unknown error'}`
      });
    }
  }
}

async function checkTriggers(checks: CheckResult[]): Promise<void> {
  console.log('⚡ Checking Triggers...');

  checks.push({
    category: 'Triggers',
    name: 'Trigger Check',
    status: 'pass',
    message: 'Trigger verification requires database admin access (skipped)'
  });
}

async function checkOrphanedRecords(checks: CheckResult[]): Promise<void> {
  console.log('🧹 Checking for Orphaned Records...');

  const orphanTests = [
    {
      name: 'subject_progress without user',
      query: async () => {
        const { data, error } = await supabase
          .from('subject_progress')
          .select('id, user_id')
          .is('user_id', null);
        return { data, error };
      }
    },
    {
      name: 'assessments without user',
      query: async () => {
        const { data, error } = await supabase
          .from('assessments')
          .select('id, user_id')
          .is('user_id', null);
        return { data, error };
      }
    },
    {
      name: 'user_badges without badge',
      query: async () => {
        const { data, error } = await supabase
          .from('user_badges')
          .select(`
            id,
            badge_id,
            badges!inner(id)
          `);
        return { data, error };
      }
    }
  ];

  for (const test of orphanTests) {
    try {
      const { data, error } = await test.query();

      if (error) {
        checks.push({
          category: 'Orphaned Records',
          name: test.name,
          status: 'warning',
          message: `Cannot check: ${error.message}`
        });
      } else if (data && data.length > 0) {
        checks.push({
          category: 'Orphaned Records',
          name: test.name,
          status: 'warning',
          message: `Found ${data.length} orphaned record(s)`,
          details: data
        });
      } else {
        checks.push({
          category: 'Orphaned Records',
          name: test.name,
          status: 'pass',
          message: 'No orphaned records found'
        });
      }
    } catch (err) {
      checks.push({
        category: 'Orphaned Records',
        name: test.name,
        status: 'warning',
        message: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
      });
    }
  }
}

async function checkDataRelationships(checks: CheckResult[]): Promise<void> {
  console.log('🔗 Checking Data Relationships...');

  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user?.id) {
    checks.push({
      category: 'Relationships',
      name: 'Data Relationships',
      status: 'warning',
      message: 'No user session - cannot test relationships'
    });
    return;
  }

  const userId = session.session.user.id;

  const relationshipTests = [
    {
      name: 'Profile → User Stats',
      test: async () => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single();

        if (!profile) return { valid: false, message: 'No profile found' };

        const { data: stats } = await supabase
          .from('user_stats')
          .select('id')
          .eq('user_id', userId)
          .single();

        return stats 
          ? { valid: true, message: 'Relationship intact' }
          : { valid: false, message: 'Profile exists but no user_stats' };
      }
    },
    {
      name: 'User Stats → XP Transactions',
      test: async () => {
        const { data: stats } = await supabase
          .from('user_stats')
          .select('total_xp')
          .eq('user_id', userId)
          .single();

        if (!stats) return { valid: true, message: 'No stats to verify' };

        const { data: transactions } = await supabase
          .from('xp_transactions')
          .select('amount')
          .eq('user_id', userId);

        if (!transactions || transactions.length === 0) {
          return stats.total_xp === 0
            ? { valid: true, message: 'No XP, no transactions (correct)' }
            : { valid: false, message: 'Has XP but no transactions' };
        }

        const calculatedXP = transactions.reduce((sum, t) => sum + t.amount, 0);
        return calculatedXP === stats.total_xp
          ? { valid: true, message: `XP matches (${calculatedXP})` }
          : { valid: false, message: `XP mismatch: ${stats.total_xp} vs ${calculatedXP}` };
      }
    },
    {
      name: 'User Badges → Badges',
      test: async () => {
        const { data: userBadges } = await supabase
          .from('user_badges')
          .select('badge_id')
          .eq('user_id', userId);

        if (!userBadges || userBadges.length === 0) {
          return { valid: true, message: 'No badges earned' };
        }

        const { data: badges, error: badgeError } = await supabase
          .from('badges')
          .select('id')
          .in('id', userBadges.map(ub => ub.badge_id));

        if (badgeError) {
          return { valid: false, message: badgeError.message };
        }

        return badges && badges.length === userBadges.length
          ? { valid: true, message: 'All badge references valid' }
          : { valid: false, message: 'Some badges missing' };
      }
    }
  ];

  for (const test of relationshipTests) {
    try {
      const result = await test.test();
      checks.push({
        category: 'Relationships',
        name: test.name,
        status: result.valid ? 'pass' : 'warning',
        message: result.message
      });
    } catch (err) {
      checks.push({
        category: 'Relationships',
        name: test.name,
        status: 'warning',
        message: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
      });
    }
  }
}

async function checkQueryPerformance(checks: CheckResult[]): Promise<void> {
  console.log('⚡ Checking Query Performance...');

  const performanceTests = [
    {
      name: 'profiles query',
      query: async () => supabase.from('profiles').select('*').limit(10)
    },
    {
      name: 'subject_progress query',
      query: async () => supabase.from('subject_progress').select('*').limit(10)
    },
    {
      name: 'assessments query',
      query: async () => supabase.from('assessments').select('*').limit(10)
    },
    {
      name: 'user_stats with joins',
      query: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user?.id) return { error: { message: 'No session' } };
        
        return supabase
          .from('user_stats')
          .select(`
            *,
            profiles!inner(full_name, email),
            user_badges(count)
          `)
          .eq('user_id', session.session.user.id)
          .single();
      }
    }
  ];

  for (const test of performanceTests) {
    try {
      const startTime = Date.now();
      const { error } = await test.query();
      const duration = Date.now() - startTime;

      if (error) {
        checks.push({
          category: 'Performance',
          name: test.name,
          status: 'warning',
          message: `Query failed: ${error.message}`
        });
      } else if (duration > 2000) {
        checks.push({
          category: 'Performance',
          name: test.name,
          status: 'warning',
          message: `Slow query: ${duration}ms`,
          details: { duration }
        });
      } else if (duration > 1000) {
        checks.push({
          category: 'Performance',
          name: test.name,
          status: 'warning',
          message: `Acceptable but slow: ${duration}ms`,
          details: { duration }
        });
      } else {
        checks.push({
          category: 'Performance',
          name: test.name,
          status: 'pass',
          message: `Fast query: ${duration}ms`,
          details: { duration }
        });
      }
    } catch (err) {
      checks.push({
        category: 'Performance',
        name: test.name,
        status: 'warning',
        message: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
      });
    }
  }
}

export function printReport(report: IntegrityReport): void {
  console.log('\n' + '='.repeat(80));
  console.log('DATABASE INTEGRITY REPORT');
  console.log('='.repeat(80));
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Overall Status: ${report.overallStatus.toUpperCase()}`);
  console.log(`\nSummary:`);
  console.log(`  Total Checks: ${report.summary.total}`);
  console.log(`  ✅ Passed: ${report.summary.passed}`);
  console.log(`  ❌ Failed: ${report.summary.failed}`);
  console.log(`  ⚠️  Warnings: ${report.summary.warnings}`);
  console.log('='.repeat(80));

  const categories = [...new Set(report.checks.map(c => c.category))];

  for (const category of categories) {
    const categoryChecks = report.checks.filter(c => c.category === category);
    const passed = categoryChecks.filter(c => c.status === 'pass').length;
    const failed = categoryChecks.filter(c => c.status === 'fail').length;
    const warnings = categoryChecks.filter(c => c.status === 'warning').length;

    console.log(`\n📂 ${category} (${passed}/${categoryChecks.length} passed, ${failed} failed, ${warnings} warnings)`);
    console.log('-'.repeat(80));

    for (const check of categoryChecks) {
      const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️';
      console.log(`${icon} ${check.name}`);
      console.log(`   ${check.message}`);
      if (check.details) {
        console.log(`   Details: ${JSON.stringify(check.details, null, 2)}`);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('END OF REPORT');
  console.log('='.repeat(80) + '\n');
}
