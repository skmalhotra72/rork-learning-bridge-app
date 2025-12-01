import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { X, Play, Trash2, RefreshCw, Database, Wifi, WifiOff } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useUser } from '@/contexts/UserContext';
import Colors from '@/constants/colors';
import { APP_VERSION, BUILD_NUMBER, APP_CONFIG } from '@/constants/appConfig';
import { 
  runFeatureTests, 
  getDiagnosticInfo,
  checkAppHealth,
  testNetworkLatency,
  type TestResults 
} from '@/utils/testing';
import { syncPendingActions, clearCache, checkConnection } from '@/services/offlineSync';

interface DeveloperMenuProps {
  visible: boolean;
  onClose: () => void;
}

export default function DeveloperMenu({ visible, onClose }: DeveloperMenuProps) {
  const { authUser } = useUser();
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setDiagnostics] = useState<any>(null);
  const [networkStatus, setNetworkStatus] = useState<boolean | null>(null);

  const handleRunTests = async () => {
    if (!authUser) {
      Alert.alert('Error', 'No authenticated user');
      return;
    }

    setLoading(true);
    try {
      const results = await runFeatureTests(authUser.id);
      setTestResults(results);
      
      Alert.alert(
        'Tests Complete',
        `Passed: ${results.passed}\nFailed: ${results.failed}\nWarnings: ${results.warnings}`
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to run tests');
      console.error('Test error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCache();
              Alert.alert('Success', 'Cache cleared!');
            } catch {
              Alert.alert('Error', 'Failed to clear cache');
            }
          }
        }
      ]
    );
  };

  const handleResetOnboarding = async () => {
    Alert.alert(
      'Reset Onboarding',
      'This will reset the onboarding flow. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('@onboarding_complete');
              Alert.alert('Success', 'Onboarding reset! Restart the app to see changes.');
            } catch {
              Alert.alert('Error', 'Failed to reset onboarding');
            }
          }
        }
      ]
    );
  };

  const handleSyncOffline = async () => {
    setLoading(true);
    try {
      const result = await syncPendingActions();
      Alert.alert(
        'Sync Complete',
        `Synced: ${result.synced}\nFailed: ${result.failed}${result.reason ? `\nReason: ${result.reason}` : ''}`
      );
    } catch {
      Alert.alert('Error', 'Failed to sync offline actions');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckHealth = async () => {
    if (!authUser) {
      Alert.alert('Error', 'No authenticated user');
      return;
    }

    setLoading(true);
    try {
      const health = await checkAppHealth(authUser.id);
      
      let message = `Healthy: ${health.healthy ? '✅' : '❌'}\n\n`;
      
      if (health.issues.length > 0) {
        message += `Issues:\n${health.issues.map(i => `• ${i}`).join('\n')}\n\n`;
      }
      
      if (health.warnings.length > 0) {
        message += `Warnings:\n${health.warnings.map(w => `• ${w}`).join('\n')}`;
      }

      Alert.alert('App Health Check', message);
    } catch {
      Alert.alert('Error', 'Failed to check app health');
    } finally {
      setLoading(false);
    }
  };

  const handleGetDiagnostics = async () => {
    if (!authUser) {
      Alert.alert('Error', 'No authenticated user');
      return;
    }

    setLoading(true);
    try {
      const diag = await getDiagnosticInfo(authUser.id);
      setDiagnostics(diag);
      console.log('Diagnostics:', JSON.stringify(diag, null, 2));
      Alert.alert('Success', 'Diagnostics logged to console');
    } catch {
      Alert.alert('Error', 'Failed to get diagnostics');
    } finally {
      setLoading(false);
    }
  };

  const handleTestNetwork = async () => {
    setLoading(true);
    try {
      const isOnline = await checkConnection();
      const latency = await testNetworkLatency();
      
      setNetworkStatus(isOnline);
      
      Alert.alert(
        'Network Test',
        `Status: ${isOnline ? '🟢 Online' : '🔴 Offline'}\nLatency: ${latency === -1 ? 'Failed' : `${latency}ms`}`
      );
    } catch {
      Alert.alert('Error', 'Failed to test network');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllData = async () => {
    Alert.alert(
      '⚠️ Danger Zone',
      'This will clear ALL local data including cache, pending actions, and settings. This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'All local data cleared! Please restart the app.');
            } catch {
              Alert.alert('Error', 'Failed to clear data');
            }
          }
        }
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🔧 Developer Menu</Text>
          <Pressable
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed
            ]}
            onPress={onClose}
          >
            <X size={24} color={Colors.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          )}

          {/* Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version:</Text>
              <Text style={styles.infoValue}>{APP_VERSION}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Build:</Text>
              <Text style={styles.infoValue}>{BUILD_NUMBER}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Environment:</Text>
              <Text style={styles.infoValue}>{APP_CONFIG.ENV}</Text>
            </View>
            {authUser && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>User ID:</Text>
                <Text style={styles.infoValueSmall} numberOfLines={1}>
                  {authUser.id}
                </Text>
              </View>
            )}
          </View>

          {/* Testing Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Testing & Diagnostics</Text>
            
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed
              ]}
              onPress={handleRunTests}
              disabled={loading}
            >
              <Play size={20} color={Colors.primary} />
              <Text style={styles.buttonText}>Run Feature Tests</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed
              ]}
              onPress={handleCheckHealth}
              disabled={loading}
            >
              <Database size={20} color={Colors.secondary} />
              <Text style={styles.buttonText}>Check App Health</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed
              ]}
              onPress={handleTestNetwork}
              disabled={loading}
            >
              {networkStatus === null ? (
                <Wifi size={20} color={Colors.textSecondary} />
              ) : networkStatus ? (
                <Wifi size={20} color={Colors.secondary} />
              ) : (
                <WifiOff size={20} color={Colors.error} />
              )}
              <Text style={styles.buttonText}>Test Network Connection</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed
              ]}
              onPress={handleGetDiagnostics}
              disabled={loading}
            >
              <Database size={20} color={Colors.accent} />
              <Text style={styles.buttonText}>Get Full Diagnostics</Text>
            </Pressable>
          </View>

          {/* Test Results */}
          {testResults && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Test Results</Text>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsSummary}>
                  ✅ {testResults.passed} passed  ❌ {testResults.failed} failed  ⚠️ {testResults.warnings} warnings
                </Text>
              </View>
              {testResults.tests.map((test, i) => (
                <View key={i} style={styles.testRow}>
                  <View style={styles.testLeft}>
                    <Text style={styles.testName}>{test.name}</Text>
                    {test.details && (
                      <Text style={styles.testDetails}>{test.details}</Text>
                    )}
                    {test.error && (
                      <Text style={styles.testError}>{test.error}</Text>
                    )}
                  </View>
                  <View style={[
                    styles.testStatusBadge,
                    test.status === 'PASS' && styles.testPass,
                    test.status === 'FAIL' && styles.testFail,
                    test.status === 'WARN' && styles.testWarn
                  ]}>
                    <Text style={styles.testStatusText}>{test.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Data Management Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Management</Text>
            
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed
              ]}
              onPress={handleSyncOffline}
              disabled={loading}
            >
              <RefreshCw size={20} color={Colors.primary} />
              <Text style={styles.buttonText}>Sync Offline Actions</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed
              ]}
              onPress={handleClearCache}
              disabled={loading}
            >
              <Trash2 size={20} color={Colors.accent} />
              <Text style={styles.buttonText}>Clear Cache</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed
              ]}
              onPress={handleResetOnboarding}
              disabled={loading}
            >
              <RefreshCw size={20} color={Colors.secondary} />
              <Text style={styles.buttonText}>Reset Onboarding</Text>
            </Pressable>
          </View>

          {/* Danger Zone */}
          <View style={[styles.section, styles.dangerSection]}>
            <Text style={[styles.sectionTitle, styles.dangerTitle]}>⚠️ Danger Zone</Text>
            
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.dangerButton,
                pressed && styles.buttonPressed
              ]}
              onPress={handleClearAllData}
              disabled={loading}
            >
              <Trash2 size={20} color={Colors.error} />
              <Text style={[styles.buttonText, styles.dangerButtonText]}>
                Clear All Local Data
              </Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              This menu is only available in development builds
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.cardBackground,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  closeButtonPressed: {
    opacity: 0.6,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  infoValueSmall: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600' as const,
    maxWidth: 200,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonPressed: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  resultsHeader: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  resultsSummary: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  testRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  testLeft: {
    flex: 1,
    marginRight: 12,
  },
  testName: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  testDetails: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  testError: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  testStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  testPass: {
    backgroundColor: '#D1FAE5',
  },
  testFail: {
    backgroundColor: '#FEE2E2',
  },
  testWarn: {
    backgroundColor: '#FEF3C7',
  },
  testStatusText: {
    fontSize: 12,
    fontWeight: 'bold' as const,
  },
  dangerSection: {
    borderWidth: 2,
    borderColor: Colors.error,
  },
  dangerTitle: {
    color: Colors.error,
  },
  dangerButton: {
    borderColor: Colors.error,
  },
  dangerButtonText: {
    color: Colors.error,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
});
