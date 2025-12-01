import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Config, isOpenAIConfigured } from '@/constants/config';

export default function CheckEnvScreen() {
  const apiKeyConfigured = isOpenAIConfigured();
  const apiKeyExists = !!Config.OPENAI_API_KEY;
  const apiKeyLength = Config.OPENAI_API_KEY?.length || 0;
  const apiKeyPrefix = Config.OPENAI_API_KEY?.substring(0, 7) || 'N/A';

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <ArrowLeft size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Environment Check</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔍 OpenAI Configuration</Text>
            
            <View style={styles.checkRow}>
              {apiKeyConfigured ? (
                <CheckCircle size={24} color="#10B981" />
              ) : (
                <XCircle size={24} color="#EF4444" />
              )}
              <Text style={styles.checkLabel}>API Key Configured</Text>
              <Text style={[
                styles.checkStatus,
                apiKeyConfigured ? styles.statusSuccess : styles.statusError
              ]}>
                {apiKeyConfigured ? 'YES' : 'NO'}
              </Text>
            </View>

            <View style={styles.checkRow}>
              {apiKeyExists ? (
                <CheckCircle size={24} color="#10B981" />
              ) : (
                <XCircle size={24} color="#EF4444" />
              )}
              <Text style={styles.checkLabel}>Key Exists</Text>
              <Text style={[
                styles.checkStatus,
                apiKeyExists ? styles.statusSuccess : styles.statusError
              ]}>
                {apiKeyExists ? 'YES' : 'NO'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Key Length:</Text>
              <Text style={styles.infoValue}>{apiKeyLength} characters</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Key Prefix:</Text>
              <Text style={styles.infoValue}>{apiKeyPrefix}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {!apiKeyConfigured && (
            <View style={styles.errorCard}>
              <AlertCircle size={24} color="#EF4444" />
              <Text style={styles.errorTitle}>Configuration Required</Text>
              <Text style={styles.errorText}>
                The OpenAI API key is not configured. Please follow these steps:
              </Text>
              <View style={styles.stepsList}>
                <Text style={styles.stepText}>1. Open the <Text style={styles.codeText}>env</Text> file in your project root</Text>
                <Text style={styles.stepText}>2. Add or update: <Text style={styles.codeText}>EXPO_PUBLIC_OPENAI_API_KEY=your_key_here</Text></Text>
                <Text style={styles.stepText}>3. <Text style={styles.boldText}>Restart the app completely</Text> (stop and start again)</Text>
                <Text style={styles.stepText}>4. Come back to this screen to verify</Text>
              </View>
            </View>
          )}

          {apiKeyConfigured && (
            <View style={styles.successCard}>
              <CheckCircle size={24} color="#10B981" />
              <Text style={styles.successTitle}>✅ Configuration Valid</Text>
              <Text style={styles.successText}>
                Your OpenAI API key is configured and ready to use!
              </Text>
              <Text style={styles.tipText}>
                You can now test the API connection on the test screen.
              </Text>
            </View>
          )}

          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>💡 Important Notes</Text>
            <Text style={styles.infoCardText}>
              • Environment variables are bundled at build time{'\n'}
              • You MUST restart the app after changing .env files{'\n'}
              • The key should start with &ldquo;sk-&rdquo; or &ldquo;sk-proj-&rdquo;{' \n'}
              • Make sure there are no extra spaces or quotes{'\n'}
              • Keep your API key secure and never commit it to git
            </Text>
          </View>

          <View style={styles.debugSection}>
            <Text style={styles.debugTitle}>🐛 Debug Info</Text>
            <Text style={styles.debugText}>Platform: {Platform.OS}</Text>
            <Text style={styles.debugText}>Raw value exists: {String(!!Config.OPENAI_API_KEY)}</Text>
            <Text style={styles.debugText}>Is configured: {String(apiKeyConfigured)}</Text>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
    marginRight: 40,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  checkLabel: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
  checkStatus: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  statusSuccess: {
    color: '#10B981',
  },
  statusError: {
    color: '#EF4444',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
    marginVertical: 16,
  },
  errorCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#DC2626',
    marginTop: 12,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#7F1D1D',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepsList: {
    alignSelf: 'stretch',
  },
  stepText: {
    fontSize: 14,
    color: '#7F1D1D',
    marginBottom: 8,
    lineHeight: 20,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#FCA5A5' + '40',
    paddingHorizontal: 4,
  },
  boldText: {
    fontWeight: '600' as const,
  },
  successCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#059669',
    marginTop: 12,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#064E3B',
    textAlign: 'center',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#065F46',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoCard: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.primary + '15',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  infoCardText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  debugSection: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  bottomPadding: {
    height: 32,
  },
});
