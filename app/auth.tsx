import { LinearGradient } from "expo-linear-gradient";
import { Check, Eye, EyeOff, Mail, User, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useUser } from "@/contexts/UserContext";

type TabType = "signup" | "login";

export default function AuthScreen() {
  const { signup, login } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>("signup");

  const [signupName, setSignupName] = useState<string>("");
  const [signupEmail, setSignupEmail] = useState<string>("");
  const [signupPassword, setSignupPassword] = useState<string>("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState<string>("");
  const [showSignupPassword, setShowSignupPassword] = useState<boolean>(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState<boolean>(false);

  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getPasswordStrength = (password: string): "weak" | "medium" | "strong" | null => {
    if (!password) return null;
    if (password.length < 6) return "weak";
    if (password.length >= 8 && /[0-9]/.test(password) && /[a-zA-Z]/.test(password)) return "strong";
    return "medium";
  };

  const handleEmailChange = (email: string, setter: (value: string) => void) => {
    setter(email);
    if (email.length > 0) {
      setEmailValid(validateEmail(email));
    } else {
      setEmailValid(null);
    }
  };

  const handlePasswordChange = (password: string) => {
    setSignupPassword(password);
    setPasswordStrength(getPasswordStrength(password));
  };

  const handleSignup = async () => {
    if (!signupName.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }
    if (!validateEmail(signupEmail)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }
    if (signupPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signup(signupName, signupEmail, signupPassword);
      
      if (!result.success) {
        Alert.alert("Error", result.error || "Failed to create account");
      } else {
        Alert.alert("Success", "Account created! ✓");
      }
    } catch (error) {
      console.error("Signup error:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }
    if (!validateEmail(loginEmail)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }
    if (!loginPassword) {
      Alert.alert("Error", "Please enter your password");
      return;
    }

    setIsLoading(true);
    console.log("Attempting login for:", loginEmail.trim().toLowerCase());
    
    try {
      const result = await login(loginEmail, loginPassword);
      
      if (!result.success) {
        console.error("Login failed:", result.error);
        Alert.alert("Login Failed", result.error || "Failed to login. Please try again.");
      } else {
        console.log("Login successful!");
      }
    } catch (error) {
      console.error("Unexpected login error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#EEF2FF", "#FFFFFF"]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Text style={styles.title}>Welcome!</Text>
              <Text style={styles.subtitle}>
                Start your learning journey today
              </Text>
            </View>

            <View style={styles.tabContainer}>
              <Pressable
                style={[
                  styles.tab,
                  activeTab === "signup" && styles.activeTab,
                ]}
                onPress={() => setActiveTab("signup")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "signup" && styles.activeTabText,
                  ]}
                >
                  Sign Up
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.tab,
                  activeTab === "login" && styles.activeTab,
                ]}
                onPress={() => setActiveTab("login")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "login" && styles.activeTabText,
                  ]}
                >
                  Login
                </Text>
              </Pressable>
            </View>

            {activeTab === "signup" ? (
              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={styles.inputWrapper}>
                    <User size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputWithIcon}
                      placeholder="Enter your full name"
                      placeholderTextColor={Colors.textSecondary}
                      value={signupName}
                      onChangeText={setSignupName}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <View style={[styles.inputWrapper, emailValid === false && styles.inputError]}>
                    <Mail size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputWithIcon}
                      placeholder="Enter your email"
                      placeholderTextColor={Colors.textSecondary}
                      value={signupEmail}
                      onChangeText={(text) => handleEmailChange(text, setSignupEmail)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    {emailValid === true && <Check size={20} color={Colors.secondary} />}
                    {emailValid === false && <X size={20} color={Colors.error} />}
                  </View>
                  {emailValid === false && (
                    <Text style={styles.errorText}>Please enter a valid email</Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Enter your password"
                      placeholderTextColor={Colors.textSecondary}
                      value={signupPassword}
                      onChangeText={handlePasswordChange}
                      secureTextEntry={!showSignupPassword}
                      autoCapitalize="none"
                    />
                    <Pressable
                      onPress={() => setShowSignupPassword(!showSignupPassword)}
                      style={styles.eyeIcon}
                    >
                      {showSignupPassword ? (
                        <EyeOff size={20} color={Colors.textSecondary} />
                      ) : (
                        <Eye size={20} color={Colors.textSecondary} />
                      )}
                    </Pressable>
                  </View>
                  {passwordStrength && (
                    <View style={styles.strengthContainer}>
                      <View style={styles.strengthBar}>
                        <View
                          style={[
                            styles.strengthFill,
                            passwordStrength === "weak" && styles.strengthWeak,
                            passwordStrength === "medium" && styles.strengthMedium,
                            passwordStrength === "strong" && styles.strengthStrong,
                            {
                              width:
                                passwordStrength === "weak"
                                  ? "33%"
                                  : passwordStrength === "medium"
                                    ? "66%"
                                    : "100%",
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.strengthText,
                          passwordStrength === "weak" && { color: Colors.error },
                          passwordStrength === "medium" && { color: Colors.accent },
                          passwordStrength === "strong" && { color: Colors.secondary },
                        ]}
                      >
                        {passwordStrength === "weak" && "Too short"}
                        {passwordStrength === "medium" && "Good"}
                        {passwordStrength === "strong" && "Strong!"}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Confirm your password"
                      placeholderTextColor={Colors.textSecondary}
                      value={signupConfirmPassword}
                      onChangeText={setSignupConfirmPassword}
                      secureTextEntry={!showSignupConfirmPassword}
                      autoCapitalize="none"
                    />
                    <Pressable
                      onPress={() =>
                        setShowSignupConfirmPassword(!showSignupConfirmPassword)
                      }
                      style={styles.eyeIcon}
                    >
                      {showSignupConfirmPassword ? (
                        <EyeOff size={20} color={Colors.textSecondary} />
                      ) : (
                        <Eye size={20} color={Colors.textSecondary} />
                      )}
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    pressed && styles.buttonPressed,
                    isLoading && styles.buttonDisabled,
                  ]}
                  onPress={handleSignup}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={[Colors.gradients.primary[0], Colors.gradients.primary[1]]}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.buttonText}>Sign Up</Text>
                    )}
                  </LinearGradient>
                </Pressable>

                <Pressable
                  onPress={() => setActiveTab("login")}
                  style={styles.linkContainer}
                >
                  <Text style={styles.linkText}>
                    Already have an account?{" "}
                    <Text style={styles.link}>Login</Text>
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor={Colors.textSecondary}
                    value={loginEmail}
                    onChangeText={setLoginEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Enter your password"
                      placeholderTextColor={Colors.textSecondary}
                      value={loginPassword}
                      onChangeText={setLoginPassword}
                      secureTextEntry={!showLoginPassword}
                      autoCapitalize="none"
                    />
                    <Pressable
                      onPress={() => setShowLoginPassword(!showLoginPassword)}
                      style={styles.eyeIcon}
                    >
                      {showLoginPassword ? (
                        <EyeOff size={20} color={Colors.textSecondary} />
                      ) : (
                        <Eye size={20} color={Colors.textSecondary} />
                      )}
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    pressed && styles.buttonPressed,
                    isLoading && styles.buttonDisabled,
                  ]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={[Colors.gradients.primary[0], Colors.gradients.primary[1]]}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.buttonText}>Login</Text>
                    )}
                  </LinearGradient>
                </Pressable>

                <Pressable
                  onPress={() => setActiveTab("signup")}
                  style={styles.linkContainer}
                >
                  <Text style={styles.linkText}>
                    Don&apos;t have an account?{" "}
                    <Text style={styles.link}>Sign Up</Text>
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  formContainer: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  eyeIcon: {
    paddingHorizontal: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputWithIcon: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  strengthContainer: {
    marginTop: 8,
    gap: 4,
  },
  strengthBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: 2,
  },
  strengthWeak: {
    backgroundColor: Colors.error,
  },
  strengthMedium: {
    backgroundColor: Colors.accent,
  },
  strengthStrong: {
    backgroundColor: Colors.secondary,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  button: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  linkContainer: {
    marginTop: 8,
    alignItems: "center",
  },
  linkText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  link: {
    color: Colors.primary,
    fontWeight: "600" as const,
  },
});
