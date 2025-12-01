import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { testOpenAIConnection, testOpenAIWithPrompt } from '@/utils/testOpenAI';

export default function TestOpenAIScreen() {
  const [isTestingBasic, setIsTestingBasic] = useState(false);
  const [isTestingCustom, setIsTestingCustom] = useState(false);
  const [basicResult, setBasicResult] = useState<string | null>(null);
  const [customResult, setCustomResult] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('Explain photosynthesis in simple terms');

  const handleBasicTest = async () => {
    setIsTestingBasic(true);
    setBasicResult(null);

    console.log('🧪 Starting basic OpenAI API test...');

    try {
      const result = await testOpenAIConnection();

      if (result.success) {
        const message = `✅ SUCCESS!\n\n${result.message}\n\nResponse:\n${result.response}`;
        setBasicResult(message);
        console.log('✅ Basic test passed');
        Alert.alert('Success! 🎉', 'OpenAI API is working correctly!');
      } else {
        const message = `❌ FAILED\n\n${result.message}\n\nError:\n${result.error}`;
        setBasicResult(message);
        console.error('❌ Basic test failed:', result.error);
        Alert.alert('Test Failed', result.error || 'Unknown error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setBasicResult(`❌ EXCEPTION\n\n${errorMessage}`);
      console.error('❌ Basic test exception:', error);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsTestingBasic(false);
    }
  };

  const handleCustomTest = async () => {
    if (!customPrompt.trim()) {
      Alert.alert('Error', 'Please enter a test prompt');
      return;
    }

    setIsTestingCustom(true);
    setCustomResult(null);

    console.log('🧪 Starting custom prompt test...');
    console.log('Prompt:', customPrompt);

    try {
      const result = await testOpenAIWithPrompt(customPrompt);

      if (result.success) {
        const message = `✅ SUCCESS!\n\n${result.message}\n\nResponse:\n${result.response}`;
        setCustomResult(message);
        console.log('✅ Custom test passed');
        Alert.alert('Success! 🎉', 'OpenAI responded successfully!');
      } else {
        const message = `❌ FAILED\n\n${result.message}\n\nError:\n${result.error}`;
        setCustomResult(message);
        console.error('❌ Custom test failed:', result.error);
        Alert.alert('Test Failed', result.error || 'Unknown error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setCustomResult(`❌ EXCEPTION\n\n${errorMessage}`);
      console.error('❌ Custom test exception:', error);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsTestingCustom(false);
    }
  };

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
          <Text style={styles.headerTitle}>Test OpenAI API</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>🧪 API Connection Test</Text>
            <Text style={styles.infoText}>
              Test if your OpenAI API key is configured correctly and responding
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Basic Connection Test</Text>
            <Text style={styles.sectionSubtitle}>
              Send a simple test message to verify API connectivity
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.testButton,
                isTestingBasic && styles.testButtonDisabled,
                pressed && styles.testButtonPressed,
              ]}
              onPress={handleBasicTest}
              disabled={isTestingBasic}
            >
              {isTestingBasic ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.testButtonText}>Testing...</Text>
                </>
              ) : (
                <Text style={styles.testButtonText}>Run Basic Test</Text>
              )}
            </Pressable>

            {basicResult && (
              <View style={styles.resultCard}>
                <ScrollView style={styles.resultScroll}>
                  <Text style={styles.resultText}>{basicResult}</Text>
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Custom Prompt Test</Text>
            <Text style={styles.sectionSubtitle}>
              Test with your own prompt to see how the AI responds
            </Text>

            <TextInput
              style={styles.promptInput}
              value={customPrompt}
              onChangeText={setCustomPrompt}
              placeholder="Enter your test prompt..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={3}
            />

            <Pressable
              style={({ pressed }) => [
                styles.testButton,
                isTestingCustom && styles.testButtonDisabled,
                pressed && styles.testButtonPressed,
              ]}
              onPress={handleCustomTest}
              disabled={isTestingCustom}
            >
              {isTestingCustom ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.testButtonText}>Testing...</Text>
                </>
              ) : (
                <Text style={styles.testButtonText}>Send Custom Prompt</Text>
              )}
            </Pressable>

            {customResult && (
              <View style={styles.resultCard}>
                <ScrollView style={styles.resultScroll}>
                  <Text style={styles.resultText}>{customResult}</Text>
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.tipTitle}>💡 Tips</Text>
            <Text style={styles.tipText}>
              • Check console logs for detailed debugging info{'\n'}
              • If tests fail, verify your API key in the env file{'\n'}
              • Make sure your API key has credits remaining{'\n'}
              • Response time should be under 3 seconds
            </Text>
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
  infoCard: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.primary + '15',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  testButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  testButtonPressed: {
    opacity: 0.8,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  resultCard: {
    marginTop: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 300,
  },
  resultScroll: {
    padding: 16,
  },
  resultText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
    marginVertical: 24,
  },
  promptInput: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 32,
  },
});
