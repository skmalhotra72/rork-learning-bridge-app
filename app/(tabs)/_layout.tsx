import { Tabs } from "expo-router";
import { BarChart3, Home, User } from "lucide-react-native";
import React from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        headerShown: true,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          backgroundColor: Colors.cardBackground,
          paddingBottom: Platform.OS === "ios" ? insets.bottom : 12,
          paddingTop: 8,
          height: Platform.OS === "ios" ? 84 + insets.bottom : 68,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Learning Bridge",
          headerTitle: "Learning Bridge",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          headerTitle: "Your Progress",
          tabBarIcon: ({ color }) => <BarChart3 size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerTitle: "Your Profile",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
