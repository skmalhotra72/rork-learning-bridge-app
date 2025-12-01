import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Colors from "@/constants/colors";
import { useUser } from "@/contexts/UserContext";

export default function Index() {
  const { user, isLoading } = useUser();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    const complete = await AsyncStorage.getItem('@onboarding_complete');
    setOnboardingComplete(complete === 'true');
  };

  if (isLoading || onboardingComplete === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
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
  },
});
