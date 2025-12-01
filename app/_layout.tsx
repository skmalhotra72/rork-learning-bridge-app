import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { UserProvider } from "@/contexts/UserContext";
import { initOfflineSync } from "@/services/offlineSync";
import { ErrorBoundary } from "@/components/ErrorBoundary";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="grade-selection" options={{ headerShown: false }} />
      <Stack.Screen name="language-selection" options={{ headerShown: false }} />
      <Stack.Screen name="subject-selection" options={{ headerShown: false }} />
      <Stack.Screen name="subject-details" options={{ headerShown: false }} />
      <Stack.Screen name="chapter-selection" options={{ headerShown: false }} />
      <Stack.Screen name="profile-confirmation" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="progress" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="assessment-intro" options={{ headerShown: false }} />
      <Stack.Screen name="assessment-quiz" options={{ headerShown: false }} />
      <Stack.Screen name="assessment-results" options={{ headerShown: false }} />
      <Stack.Screen name="ai-tutor" options={{ headerShown: false }} />
      <Stack.Screen name="badges" options={{ headerShown: false }} />
      <Stack.Screen name="parent-dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="add-child" options={{ headerShown: false }} />
      <Stack.Screen name="create-goal" options={{ headerShown: false }} />
      <Stack.Screen name="subject-detail" options={{ headerShown: false }} />
      <Stack.Screen name="chapter-index" options={{ headerShown: false }} />
      <Stack.Screen name="topic-detail" options={{ headerShown: false }} />
      <Stack.Screen name="practice-questions" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
    initOfflineSync();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <UserProvider>
            <RootLayoutNav />
          </UserProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
