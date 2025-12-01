import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Stack } from 'expo-router';
import { runDatabaseIntegrityCheck, IntegrityReport, CheckResult } from '@/utils/databaseIntegrityCheck';
import { AlertCircle, CheckCircle2, AlertTriangle, Play } from 'lucide-react-native';

export default function DatabaseCheckScreen() {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<IntegrityReport | null>(null);

  const runCheck = async () => {
    setIsRunning(true);
    setReport(null);
    
    try {
      const result = await runDatabaseIntegrityCheck();
      setReport(result);
    } catch (error) {
      console.error('Check failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return '#10B981';
      case 'fail':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
    }
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return CheckCircle2;
      case 'fail':
        return AlertCircle;
      case 'warning':
        return AlertTriangle;
    }
  };

  const groupedChecks = report?.checks.reduce((acc, check) => {
    if (!acc[check.category]) {
      acc[check.category] = [];
    }
    acc[check.category].push(check);
    return acc;
  }, {} as Record<string, CheckResult[]>);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Database Integrity Check' }} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Database Integrity Check</Text>
          <Text style={styles.subtitle}>
            Comprehensive verification of all database components
          </Text>
          
          <TouchableOpacity
            style={[styles.runButton, isRunning && styles.runButtonDisabled]}
            onPress={runCheck}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <ActivityIndicator color="#fff" size="small" style={styles.buttonIcon} />
                <Text style={styles.runButtonText}>Running Checks...</Text>
              </>
            ) : (
              <>
                <Play size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.runButtonText}>Run Full Check</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {report && (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Overall Status:</Text>
                <Text
                  style={[
                    styles.summaryStatus,
                    { color: getStatusColor(report.overallStatus) },
                  ]}
                >
                  {report.overallStatus.toUpperCase()}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Checks:</Text>
                <Text style={styles.summaryValue}>{report.summary.total}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>✅ Passed:</Text>
                <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                  {report.summary.passed}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>❌ Failed:</Text>
                <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
                  {report.summary.failed}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>⚠️ Warnings:</Text>
                <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
                  {report.summary.warnings}
                </Text>
              </View>
              <Text style={styles.timestamp}>
                Timestamp: {new Date(report.timestamp).toLocaleString()}
              </Text>
            </View>

            {groupedChecks && Object.entries(groupedChecks).map(([category, checks]) => {
              const passed = checks.filter(c => c.status === 'pass').length;
              const failed = checks.filter(c => c.status === 'fail').length;
              const warnings = checks.filter(c => c.status === 'warning').length;

              return (
                <View key={category} style={styles.categoryCard}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryTitle}>{category}</Text>
                    <Text style={styles.categoryStats}>
                      {passed}/{checks.length} passed
                      {failed > 0 && ` • ${failed} failed`}
                      {warnings > 0 && ` • ${warnings} warnings`}
                    </Text>
                  </View>

                  {checks.map((check, index) => {
                    const Icon = getStatusIcon(check.status);
                    const color = getStatusColor(check.status);

                    return (
                      <View key={index} style={styles.checkItem}>
                        <Icon size={18} color={color} style={styles.checkIcon} />
                        <View style={styles.checkContent}>
                          <Text style={styles.checkName}>{check.name}</Text>
                          <Text style={styles.checkMessage}>{check.message}</Text>
                          {check.details && (
                            <View style={styles.detailsBox}>
                              <Text style={styles.detailsText}>
                                {JSON.stringify(check.details, null, 2)}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </>
        )}

        {!report && !isRunning && (
          <View style={styles.emptyState}>
            <AlertCircle size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              Click &quot;Run Full Check&quot; to start the database integrity verification
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
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  runButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  runButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  buttonIcon: {
    marginRight: 8,
  },
  runButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  summaryStatus: {
    fontSize: 16,
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  categoryStats: {
    fontSize: 13,
    color: '#6B7280',
  },
  checkItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  checkIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  checkContent: {
    flex: 1,
  },
  checkName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  checkMessage: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  detailsBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  detailsText: {
    fontSize: 11,
    color: '#4B5563',
    fontFamily: 'monospace',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 280,
  },
});
