import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { GraduationCap } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

export default function WelcomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, scaleAnim, floatAnim]);

  const handleGetStarted = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        tension: 50,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push("/auth" as any);
    });
  };

  const mascotTranslateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#EEF2FF", "#FFFFFF"]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.backgroundShapes}>
        <View style={[styles.shape, styles.shape1]} />
        <View style={[styles.shape, styles.shape2]} />
        <View style={[styles.shape, styles.shape3]} />
      </View>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <View style={styles.iconCircle}>
              <GraduationCap size={64} color={Colors.primary} strokeWidth={2} />
            </View>
            
            <Text style={styles.logoText}>Learning Bridge</Text>
            <Text style={styles.bridgeEmoji}>🌉</Text>
          </View>

          <Animated.View
            style={[
              styles.mascotContainer,
              {
                transform: [{ translateY: mascotTranslateY }],
              },
            ]}
          >
            <Text style={styles.mascotEmoji}>🦉</Text>
          </Animated.View>

          <View style={styles.textContainer}>
            <Text style={styles.tagline}>Your Personal Learning Companion</Text>
            <Text style={styles.welcomeMessage}>
              Let&apos;s make learning fun and remove your fear of difficult subjects!
            </Text>
          </View>

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleGetStarted}
            >
              <LinearGradient
                colors={[Colors.gradients.primary[0], Colors.gradients.primary[1]]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.buttonText}>Get Started</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          <Pressable
            style={styles.testButton}
            onPress={() => router.push('/test-api-key' as any)}
          >
            <Text style={styles.testButtonText}>🧪 Test OpenAI API</Text>
          </Pressable>

          <Text style={styles.footerText}>
            Join thousands of students mastering CBSE curriculum
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundShapes: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  shape: {
    position: "absolute" as const,
    borderRadius: 100,
    opacity: 0.05,
  },
  shape1: {
    width: 200,
    height: 200,
    backgroundColor: Colors.primary,
    top: 100,
    left: -50,
  },
  shape2: {
    width: 150,
    height: 150,
    backgroundColor: Colors.secondary,
    top: 300,
    right: -30,
  },
  shape3: {
    width: 180,
    height: 180,
    backgroundColor: Colors.accent,
    bottom: 150,
    left: 20,
  },
  floatingShape: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    opacity: 0.1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginTop: 8,
  },
  bridgeEmoji: {
    fontSize: 28,
    marginTop: 4,
  },
  mascotContainer: {
    marginBottom: 32,
  },
  mascotEmoji: {
    fontSize: 80,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  tagline: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.primary,
    marginBottom: 12,
    textAlign: "center",
  },
  welcomeMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  button: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 24,
    textAlign: "center",
  },
  testButton: {
    backgroundColor: Colors.cardBackground,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  testButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
});
