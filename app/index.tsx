import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import Colors from "@/constants/colors";
import { useUser } from "@/contexts/UserContext";

export default function Index() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
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
