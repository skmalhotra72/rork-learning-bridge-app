import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Config, isOpenAIConfigured } from '@/constants/config';

export default function TestAIConnectionScreen() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{
    apiKeyConfigured: boolean;
    apiKeyPrefix: string;
    apiKeyLength: number;
    apiCallSuccess: boolean;
    apiResponse?: string;
    error?: string;
  } | null>(null);

  const testConnection = async () => {
    setTesting(true);
    setResults(null);

    const apiKeyConfigured = isOpenAIConfigured();
    const apiKeyPrefix = Config.OPENAI_API_KEY?.substring(0, 10) || 'None';
    const apiKeyLength = Config.OPENAI_API_KEY?.length || 0;

    console.log('=== TESTING AI CONNECTION ===');
    console.log('API Key Configured:', apiKeyConfigured);
    console.log('API Key Prefix:', apiKeyPrefix);
    console.log('API Key Length:', apiKeyLength);

    if (!apiKeyConfigured) {
      setResults({
        apiKeyConfigured: false,
        apiKeyPrefix: 'Not set',
        apiKeyLength: 0,
        apiCallSuccess: false,
        error: 'API key not configured in env file'
      });
      setTesting(false);
      return;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Config.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful tutor.'
            },
            {
              role: 'user',
              content: 'Say "Hello! OpenAI is connected!" in exactly those words.'
            }
          ],
          temperature: 0.7,
          max_tokens: 50,
        }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API Error:', errorData);
        
        setResults({
          apiKeyConfigured: true,
          apiKeyPrefix,
          apiKeyLength,
          apiCallSuccess: false,
          error: `API Error ${response.status}: ${errorData?.error?.message || 'Unknown error'}`
        });
        setTesting(false);
        return;
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || 'No response';

      console.log('✅ AI Response:', aiResponse);

      setResults({
        apiKeyConfigured: true,
        apiKeyPrefix,
        apiKeyLength,
        apiCallSuccess: true,
        apiResponse: aiResponse
      });

    } catch (error) {
      console.error('❌ Test failed:', error);
      setResults({
        apiKeyConfigured: true,
        apiKeyPrefix,
        apiKeyLength,
        apiCallSuccess: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    setTesting(false);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>AI Connection Test</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>🔍 Test OpenAI Connection</Text>
            <Text style={styles.description}>
              This will test if your OpenAI API key is working correctly.
            </Text>

            <Pressable
              style={[styles.testButton, testing && styles.testButtonDisabled]}
              onPress={testConnection}
              disabled={testing}
            >
              {testing ? (
                <>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={styles.testButtonText}>Testing...</Text>
                </>
              ) : (
                <Text style={styles.testButtonText}>🧪 Run Test</Text>
              )}
            </Pressable>
          </View>

          {results && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>📊 Test Results</Text>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>API Key Configured:</Text>
                <Text style={results.apiKeyConfigured ? styles.resultSuccess : styles.resultError}>
                  {results.apiKeyConfigured ? '✅ Yes' : '❌ No'}
                </Text>
              </View>

              {results.apiKeyConfigured && (
                <>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>API Key Prefix:</Text>
                    <Text style={styles.resultValue}>{results.apiKeyPrefix}...</Text>
                  </View>

                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>API Key Length:</Text>
                    <Text style={styles.resultValue}>{results.apiKeyLength} chars</Text>
                  </View>
                </>
              )}

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>OpenAI API Call:</Text>
                <Text style={results.apiCallSuccess ? styles.resultSuccess : styles.resultError}>
                  {results.apiCallSuccess ? '✅ Success' : '❌ Failed'}
                </Text>
              </View>

              {results.apiResponse && (
                <View style={styles.responseCard}>
                  <Text style={styles.responseTitle}>AI Response:</Text>
                  <Text style={styles.responseText}>{results.apiResponse}</Text>
                </View>
              )}

              {results.error && (
                <View style={styles.errorCard}>
                  <Text style={styles.errorTitle}>❌ Error:</Text>
                  <Text style={styles.errorText}>{results.error}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>💡 What This Means</Text>

            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>✅ If Test Passes:</Text>
              <Text style={styles.infoText}>
                • Your OpenAI API key is working correctly{'\n'}
                • AI Tutor should provide real AI responses{'\n'}
                • You should get intelligent, context-aware answers
              </Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>❌ If Test Fails:</Text>
              <Text style={styles.infoText}>
                • Check if your API key is valid{'\n'}
                • Verify it starts with &ldquo;sk-proj-&rdquo; or &ldquo;sk-&rdquo;{'\n'}
                • Check if you have API credits in OpenAI account{'\n'}
                • App will use simulated responses as fallback
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>🔧 Troubleshooting</Text>

            <View style={styles.troubleshootingItem}>
              <Text style={styles.troubleshootingNumber}>1.</Text>
              <View style={styles.troubleshootingContent}>
                <Text style={styles.troubleshootingTitle}>Check env file</Text>
                <Text style={styles.troubleshootingText}>
                  Verify EXPO_PUBLIC_OPENAI_API_KEY is set in your env file
                </Text>
              </View>
            </View>

            <View style={styles.troubleshootingItem}>
              <Text style={styles.troubleshootingNumber}>2.</Text>
              <View style={styles.troubleshootingContent}>
                <Text style={styles.troubleshootingTitle}>Restart app</Text>
                <Text style={styles.troubleshootingText}>
                  Environment variables require app restart to take effect
                </Text>
              </View>
            </View>

            <View style={styles.troubleshootingItem}>
              <Text style={styles.troubleshootingNumber}>3.</Text>
              <View style={styles.troubleshootingContent}>
                <Text style={styles.troubleshootingTitle}>Check OpenAI account</Text>
                <Text style={styles.troubleshootingText}>
                  Visit platform.openai.com to verify your API key and credits
                </Text>
              </View>
            </View>
          </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  testButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  resultValue: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  resultSuccess: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '700' as const,
  },
  resultError: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '700' as const,
  },
  responseCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  responseTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#059669',
    marginBottom: 8,
  },
  responseText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#DC2626',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#B91C1C',
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  infoSection: {
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  troubleshootingItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  troubleshootingNumber: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginRight: 12,
    width: 24,
  },
  troubleshootingContent: {
    flex: 1,
  },
  troubleshootingTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  troubleshootingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
