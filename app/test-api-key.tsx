import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Config, isOpenAIConfigured } from '@/constants/config';
import Colors from '@/constants/colors';

export default function TestAPIKeyScreen() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [testMessage, setTestMessage] = useState('What is 2+2?');

  useEffect(() => {
    checkAPIKey();
  }, []);

  const checkAPIKey = () => {
    const apiKey = Config.OPENAI_API_KEY;
    const configured = isOpenAIConfigured();

    let result = '=== API KEY DIAGNOSTICS ===\n\n';
    result += `✓ API Key Exists: ${!!apiKey ? 'YES' : 'NO'}\n`;
    result += `✓ API Key Length: ${apiKey?.length || 0} characters\n`;
    result += `✓ Starts with 'sk-': ${apiKey?.startsWith('sk-') ? 'YES' : 'NO'}\n`;
    result += `✓ Not Placeholder: ${apiKey !== 'your_openai_api_key_here' ? 'YES' : 'NO'}\n`;
    result += `✓ Is Configured: ${configured ? 'YES ✅' : 'NO ❌'}\n\n`;
    
    if (apiKey) {
      result += `Preview: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}\n\n`;
    }

    if (!configured) {
      result += '❌ API KEY NOT CONFIGURED\n\n';
      result += 'TO FIX:\n';
      result += '1. Open the "env" file in your project root\n';
      result += '2. Replace the API key with your real key\n';
      result += '3. Make sure it starts with "sk-"\n';
      result += '4. Restart the app completely\n';
    } else {
      result += '✅ API KEY IS CONFIGURED!\n\n';
      result += 'Your OpenAI API key appears to be set up correctly.\n';
      result += 'You can test it below.\n';
    }

    setTestResult(result);
  };

  const testAPICall = async () => {
    if (!isOpenAIConfigured()) {
      setTestResult(prev => prev + '\n\n❌ Cannot test - API key not configured');
      return;
    }

    setIsLoading(true);
    setTestResult(prev => prev + '\n\n🔄 Testing OpenAI API...\n');

    try {
      const apiKey = Config.OPENAI_API_KEY!;
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: testMessage }
          ],
          temperature: 0.7,
          max_tokens: 100,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
        setTestResult(prev => prev + `\n❌ API Error: ${errorMsg}\n`);
        setTestResult(prev => prev + '\nPossible issues:\n');
        setTestResult(prev => prev + '- Invalid API key\n');
        setTestResult(prev => prev + '- API key expired or revoked\n');
        setTestResult(prev => prev + '- No credits remaining\n');
        setTestResult(prev => prev + '- Rate limit exceeded\n');
      } else {
        const data = await response.json();
        const aiResponse = data.choices[0]?.message?.content;
        
        setTestResult(prev => prev + '\n✅ API TEST SUCCESSFUL!\n\n');
        setTestResult(prev => prev + `AI Response: ${aiResponse}\n\n`);
        setTestResult(prev => prev + `Model: ${data.model}\n`);
        setTestResult(prev => prev + `Tokens Used: ${data.usage?.total_tokens || 0}\n\n`);
        setTestResult(prev => prev + '🎉 Your OpenAI integration is working!\n');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setTestResult(prev => prev + `\n❌ Network Error: ${errorMsg}\n`);
      setTestResult(prev => prev + '\nCheck your internet connection.\n');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>API Key Diagnostics</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.resultText}>{testResult}</Text>
          </View>

          {isOpenAIConfigured() && (
            <View style={styles.testSection}>
              <Text style={styles.sectionTitle}>Test API Call</Text>
              <TextInput
                style={styles.input}
                value={testMessage}
                onChangeText={setTestMessage}
                placeholder="Enter test message"
                placeholderTextColor={Colors.textSecondary}
              />
              <TouchableOpacity
                style={[styles.testButton, isLoading && styles.testButtonDisabled]}
                onPress={testAPICall}
                disabled={isLoading}
              >
                <Text style={styles.testButtonText}>
                  {isLoading ? '⏳ Testing...' : '🧪 Test OpenAI API'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>📝 How to Fix API Key Issues</Text>
            <Text style={styles.infoText}>
              1. Get your API key from:{'\n'}
              https://platform.openai.com/api-keys{'\n\n'}
              
              2. Open the &quot;env&quot; file in project root{'\n\n'}
              
              3. Replace the value of:{'\n'}
              EXPO_PUBLIC_OPENAI_API_KEY={'\n\n'}
              
              4. Restart the app completely{'\n\n'}
              
              5. Come back to this screen to verify
            </Text>
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultText: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: Colors.text,
    lineHeight: 20,
  },
  testSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 12,
  },
  testButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  infoCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
});
