import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Send } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

import { useRorkAgent } from "@rork-ai/toolkit-sdk";
import Colors from "@/constants/colors";
import { useUser } from "@/contexts/UserContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AITutorScreen() {
  const params = useLocalSearchParams();
  const subjectName = params.subjectName as string;
  const subjectIcon = params.subjectIcon as string;

  const { user } = useUser();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [inputText, setInputText] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `Hi! I'm Buddy ${subjectIcon}\n\nI'm your personal ${subjectName} tutor. I've analyzed your assessment and I'm here to help you master the concepts you found challenging.\n\nYou can ask me to:\n📖 Explain concepts in simple terms\n✏️ Give you practice problems\n🤔 Answer your questions\n💡 Break down complex topics\n\nWhat would you like to learn about today?`,
      timestamp: new Date(),
    },
  ]);

  const { messages, sendMessage } = useRorkAgent({
    tools: {},
  });

  useEffect(() => {
    const newMessages = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => {
        const textContent =
          m.parts
            ?.filter((p) => p.type === "text")
            .map((p) => (p as any).text)
            .join("\n") || "";

        return {
          id: m.id,
          role: m.role as "user" | "assistant",
          content: textContent,
          timestamp: new Date(),
        };
      });

    if (newMessages.length > 0) {
      setChatMessages((prev) => {
        const existingIds = new Set(prev.map((msg) => msg.id));
        const uniqueNew = newMessages.filter((msg) => !existingIds.has(msg.id));
        return [...prev, ...uniqueNew];
      });
    }
  }, [messages]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [chatMessages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setInputText("");

    console.log("=== SENDING MESSAGE TO AI ===");
    console.log("User message:", userMessage);
    console.log("User context:", {
      name: user?.name,
      grade: user?.grade,
      subject: subjectName,
    });

    const contextualMessage = `I am a CBSE Class ${user?.grade || "10"} student learning ${subjectName}. Please act as my friendly tutor Buddy 🦉.

Use simple language, Indian examples, and be encouraging. Break down concepts step-by-step.

My question: ${userMessage}`;

    try {
      await sendMessage(contextualMessage);
      console.log("✅ Message sent successfully");
    } catch (error) {
      console.error("❌ Error sending message:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again. 😔",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleExplainConcept = () => {
    const message = "Can you explain the main concepts I need to focus on?";
    setInputText(message);
  };

  const handlePracticeProblem = () => {
    const message = "Can you give me a practice problem to solve?";
    setInputText(message);
  };

  const handleHint = () => {
    const message = "Can you give me a hint?";
    setInputText(message);
  };

  const isLoading = messages.some(
    (m) => m.role === "assistant" && m.parts?.some((p) => (p as any).type === "text" && !(p as any).text)
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#EEF2FF", Colors.background]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
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
          <View style={styles.headerInfo}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerIcon}>{subjectIcon}</Text>
              <Text style={styles.headerTitle}>{subjectName}</Text>
            </View>
            <Text style={styles.headerSubtitle}>AI Tutor - Buddy 🦉</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {chatMessages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  message.role === "user" ? styles.userBubble : styles.aiBubble,
                ]}
              >
                {message.role === "assistant" && (
                  <View style={styles.aiAvatarContainer}>
                    <Text style={styles.aiAvatar}>🦉</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.messageContent,
                    message.role === "user"
                      ? styles.userMessageContent
                      : styles.aiMessageContent,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      message.role === "user" ? styles.userText : styles.aiText,
                    ]}
                  >
                    {message.content}
                  </Text>
                </View>
              </View>
            ))}

            {isLoading && (
              <View style={[styles.messageBubble, styles.aiBubble]}>
                <View style={styles.aiAvatarContainer}>
                  <Text style={styles.aiAvatar}>🦉</Text>
                </View>
                <View style={[styles.messageContent, styles.aiMessageContent]}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.loadingText}>Buddy is thinking...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.quickActions}>
            <Pressable
              style={({ pressed }) => [
                styles.quickButton,
                pressed && styles.quickButtonPressed,
              ]}
              onPress={handleExplainConcept}
            >
              <Text style={styles.quickButtonText}>📖 Explain</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.quickButton,
                pressed && styles.quickButtonPressed,
              ]}
              onPress={handlePracticeProblem}
            >
              <Text style={styles.quickButtonText}>✏️ Practice</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.quickButton,
                pressed && styles.quickButtonPressed,
              ]}
              onPress={handleHint}
            >
              <Text style={styles.quickButtonText}>💡 Hint</Text>
            </Pressable>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask Buddy anything..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              maxLength={500}
            />
            <Pressable
              style={({ pressed }) => [
                styles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled,
                pressed && inputText.trim() && styles.sendButtonPressed,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send size={20} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
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
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    marginBottom: 16,
    maxWidth: "85%",
  },
  userBubble: {
    alignSelf: "flex-end",
  },
  aiBubble: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  aiAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  aiAvatar: {
    fontSize: 18,
  },
  messageContent: {
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userMessageContent: {
    backgroundColor: Colors.primary,
  },
  aiMessageContent: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: "#FFFFFF",
  },
  aiText: {
    color: Colors.text,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: "italic",
    marginTop: 8,
  },
  quickActions: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  quickButtonText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
    backgroundColor: Colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    maxHeight: 100,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.5,
  },
  sendButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});
