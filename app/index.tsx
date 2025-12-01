import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View, Text, TouchableOpacity, Platform } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Updates from 'expo-updates';

import Colors from "@/constants/colors";
import { useUser } from "@/contexts/UserContext";

export default function Index() {
  const { user, isLoading, connectionError } = useUser();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    const complete = await AsyncStorage.getItem('@onboarding_complete');
    setOnboardingComplete(complete === 'true');
  };

  const handleRetry = async () => {
    if (Platform.OS === 'web') {
      window.location.reload();
    } else {
      try {
        await Updates.reloadAsync();
      } catch (e) {
        console.error('Failed to reload:', e);
      }
    }
  };

  if (connectionError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorEmoji}>🔌</Text>
        <Text style={styles.errorTitle}>Connection Error</Text>
        <Text style={styles.errorMessage}>{connectionError}</Text>
        <Text style={styles.errorHint}>
          Please check your internet connection and try again.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading || onboardingComplete === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (onboardingComplete === false) {
    return <Redirect href="/onboarding" />;
  }

  if (!user) {
    return <Redirect href="/welcome" />;
  }

  if (!user.hasCompletedOnboarding) {
    return <Redirect href="/welcome" />;
  }

  return <Redirect href="/home" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
