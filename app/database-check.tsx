import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { supabase } from '@/lib/supabase';
import Colors from '@/constants/colors';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: string;
}

export default function DatabaseCheckScreen() {
  const router = useRouter();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runDatabaseTests = async () => {
    setTesting(true);
    const testResults: TestResult[] = [];

    const updateResult = (result: TestResult) => {
      testResults.push(result);
      setResults([...testResults]);
    };

    updateResult({
      name: 'Supabase Connection',
      status: 'pending',
      message: 'Testing connection...',
    });

    try {
      const { error } = await supabase.from('cbse_grades').select('id').limit(1);
      
      if (error) {
        updateResult({
          name: 'Supabase Connection',
          status: 'error',
          message: 'Connection failed',
          details: error.message,
        });
      } else {
        updateResult({
          name: 'Supabase Connection',
          status: 'success',
          message: 'Connected successfully',
        });
      }
    } catch (error) {
      updateResult({
        name: 'Supabase Connection',
        status: 'error',
        message: 'Connection error',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    const tables = [
      'cbse_grades',
      'cbse_subjects',
      'cbse_books',
      'cbse_chapters',
      'student_chapter_progress',
      'user_stats',
      'profiles',
      'subject_progress',
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('id').limit(1);
        
        if (error) {
          updateResult({
            name: `Table: ${table}`,
            status: 'error',
            message: 'Table query failed',
            details: error.message,
          });
        } else {
          updateResult({
            name: `Table: ${table}`,
            status: 'success',
            message: `Exists (${data?.length || 0} rows checked)`,
          });
        }
      } catch (error) {
        updateResult({
          name: `Table: ${table}`,
          status: 'error',
          message: 'Query error',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const views = [
      'student_subject_progress',
      'student_recent_activity',
      'student_dashboard_summary',
    ];

    for (const view of views) {
      try {
        const { data, error } = await supabase.from(view).select('*').limit(1);
        
        if (error) {
          updateResult({
            name: `View: ${view}`,
            status: 'error',
            message: 'View query failed',
            details: error.message,
          });
        } else {
          updateResult({
            name: `View: ${view}`,
            status: 'success',
            message: `Exists (${data?.length || 0} rows)`,
          });
        }
      } catch (error) {
        updateResult({
          name: `View: ${view}`,
          status: 'error',
          message: 'Query error',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    setTesting(false);

    const hasErrors = testResults.some(r => r.status === 'error');
    if (hasErrors) {
      Alert.alert(
        '⚠️ Database Setup Required',
        'Some database tables or views are missing. Please run the database-setup.sql script in your Supabase SQL Editor.\n\nSee DATABASE_SETUP_GUIDE.md for instructions.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        '✅ All Tests Passed!',
        'Your database is set up correctly and ready to use.',
        [{ text: 'Great!' }]
      );
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'pending':
        return '⏳';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      case 'pending':
        return '#F59E0B';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Database Check</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoCard}>
          <Text style={styles.infoEmoji}>🗄️</Text>
          <Text style={styles.infoTitle}>Database Status Checker</Text>
          <Text style={styles.infoText}>
            This tool checks if your Supabase database is properly set up.
            {'\n\n'}
            If you see errors, please run the SQL scripts in your Supabase SQL Editor:
            {'\n'}• database-setup.sql
            {'\n'}• database-sample-data.sql
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.testButton, testing && styles.testButtonDisabled]}
          onPress={runDatabaseTests}
          disabled={testing}
        >
          {testing ? (
            <>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.testButtonText}>Running Tests...</Text>
            </>
          ) : (
            <Text style={styles.testButtonText}>🔍 Run Database Tests</Text>
          )}
        </TouchableOpacity>

        {results.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Test Results</Text>
            {results.map((result, index) => (
              <View key={index} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultIcon}>{getStatusIcon(result.status)}</Text>
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{result.name}</Text>
                    <Text
                      style={[
                        styles.resultMessage,
                        { color: getStatusColor(result.status) },
                      ]}
                    >
                      {result.message}
                    </Text>
                    {result.details && (
                      <Text style={styles.resultDetails}>{result.details}</Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {results.length === 0 && !testing && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>
              Click the button above to run database tests
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600' as const,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  infoEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  testButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  resultsContainer: {
    marginTop: 8,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  resultCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  resultIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  resultMessage: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  resultDetails: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
