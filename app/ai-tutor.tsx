import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Send, ImagePlus } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
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

import { useRorkAgent } from "@rork-ai/toolkit-sdk";
import Colors from "@/constants/colors";
import { useUser } from "@/contexts/UserContext";

import { saveLearningSession, updateConceptMastery } from "@/services/learningHistory";
import { getLanguageSettings, LanguageSettings, buildMultilingualSystemPrompt, buildMultilingualPracticeProblemPrompt } from "@/services/multilingualPrompts";
import { addXP, updateStreak, checkBadgeEligibility } from "@/services/gamification";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  imageUri?: string;
}

export default function AITutorScreen() {
  const params = useLocalSearchParams();
  const subjectName = params.subjectName as string;
  const subjectIcon = params.subjectIcon as string;

  const { authUser } = useUser();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [inputText, setInputText] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `Hi! I'm Buddy ${subjectIcon}\n\nI'm your personal ${subjectName} tutor. I've analyzed your assessment and I'm here to help you master the concepts you found challenging.\n\nYou can ask me to:\n📖 Explain concepts in simple terms\n✏️ Give you practice problems\n🤔 Answer your questions\n💡 Break down complex topics\n📷 Analyze uploaded images\n\nWhat would you like to learn about today?`,
      timestamp: new Date(),
    },
  ]);
  const [sessionData, setSessionData] = useState({
    conceptsExplained: [] as string[],
    keyPoints: [] as string[],
    examples: [] as string[],
    problemsAttempted: 0,
    problemsSolved: 0,
    mistakes: [] as string[],
    questionsAsked: 0,
    aiResponses: 0,
    confidenceBefore: 5,
    startTime: Date.now(),
    tutoringLanguage: 'English'
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [languageSettings, setLanguageSettings] = useState<LanguageSettings | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string>('');

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

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        console.log('Camera permission not granted');
      }
    })();
  }, []);

  useEffect(() => {
    void loadLanguageSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLanguageSettings = async () => {
    if (!authUser?.id) return;
    
    try {
      console.log('=== LOADING LANGUAGE SETTINGS ===');
      const settings = await getLanguageSettings(authUser.id);
      setLanguageSettings(settings);
      console.log('✅ Language settings loaded');
      console.log('Preferred language:', settings.preferred_tutoring_language);
      console.log('Code mixing:', settings.allow_code_mixing);

      await buildAndSetSystemPrompt(settings);
      
      // Update the initial greeting based on language
      const greeting = getLocalizedGreeting(settings.preferred_tutoring_language);
      setChatMessages([{
        id: "1",
        role: "assistant",
        content: greeting,
        timestamp: new Date(),
      }]);
    } catch (error) {
      console.error('❌ Load language settings error:', error);
    }
  };

  const getLocalizedGreeting = (language: string): string => {
    const greetings: Record<string, string> = {
      'Hindi': `नमस्ते! मैं Buddy ${subjectIcon} हूँ\n\nमैं आपका ${subjectName} tutor हूँ। मैं यहाँ आपकी help करने के लिए हूँ।\n\nआप मुझसे:
📖 Concepts explain करवा सकते हैं
✏️ Practice problems माँग सकते हैं
🤔 Questions पूछ सकते हैं
💡 Complex topics समझ सकते हैं
📷 Images upload कर सकते हैं\n\nआज आप क्या सीखना चाहेंगे?`,
      'Hinglish': `Hi! Main Buddy ${subjectIcon} hoon\n\nMain aapka ${subjectName} tutor hoon. Main yahaan help karne ke liye hoon.\n\nAap mujhse:
📖 Concepts explain karwa sakte hain
✏️ Practice problems maang sakte hain
🤔 Questions pooch sakte hain
💡 Complex topics samajh sakte hain
📷 Images upload kar sakte hain\n\nAaj aap kya seekhna chahenge?`,
      'English': `Hi! I'm Buddy ${subjectIcon}\n\nI'm your personal ${subjectName} tutor. I'm here to help you master the concepts you found challenging.\n\nYou can ask me to:
📖 Explain concepts in simple terms
✏️ Give you practice problems
🤔 Answer your questions
💡 Break down complex topics
📷 Analyze uploaded images\n\nWhat would you like to learn about today?`
    };
    
    return greetings[language] || greetings['English'];
  };

  const buildAndSetSystemPrompt = async (settings?: LanguageSettings) => {
    if (!authUser?.id) return;

    const lang = settings || languageSettings;
    if (!lang) {
      console.log('No language settings, using default');
      return;
    }

    try {
      console.log('=== BUILDING MULTILINGUAL SYSTEM PROMPT ===');
      const prompt = await buildMultilingualSystemPrompt(
        authUser.id,
        subjectName,
        'Interactive Learning',
        undefined
      );
      
      setSystemPrompt(prompt);
      console.log('✅ System prompt built');
      console.log('Language:', lang.preferred_tutoring_language);
      console.log('Prompt length:', prompt.length, 'characters');
    } catch (error) {
      console.error('❌ Build system prompt error:', error);
    }
  };

  useEffect(() => {
    return () => {
      void saveSession();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSession = async () => {
    if (!authUser?.id) return;
    
    const duration = Math.floor((Date.now() - sessionData.startTime) / 1000);
    
    if (duration < 10) {
      console.log('Session too short (<10s), not saving');
      return;
    }
    
    if (sessionData.conceptsExplained.length === 0 && sessionData.problemsSolved === 0 && sessionData.questionsAsked === 0) {
      console.log('No meaningful interaction, not saving');
      return;
    }
    
    try {
      console.log('=== SAVING SESSION ON EXIT ===');
      console.log('Duration:', duration, 'seconds');
      console.log('Concepts explained:', sessionData.conceptsExplained.length);
      console.log('Questions asked:', sessionData.questionsAsked);
      console.log('Problems solved:', sessionData.problemsSolved);
      
      const sessionParts = [];
      if (sessionData.conceptsExplained.length > 0) {
        sessionParts.push(`Explored ${sessionData.conceptsExplained.length} concepts`);
      }
      if (sessionData.problemsSolved > 0) {
        sessionParts.push(`Solved ${sessionData.problemsSolved} problems`);
      }
      if (sessionData.questionsAsked > 0) {
        sessionParts.push(`Asked ${sessionData.questionsAsked} questions`);
      }
      
      const summary = sessionParts.length > 0 
        ? sessionParts.join('. ') 
        : 'Learning session with AI tutor';
      
      const understandingScore = Math.min(10, 5 + Math.floor(sessionData.problemsSolved / 2) + Math.floor(sessionData.questionsAsked / 3));
      const confidenceAfter = Math.min(10, sessionData.confidenceBefore + Math.floor(sessionData.problemsSolved / 2));
      
      const result = await saveLearningSession({
        user_id: authUser.id,
        subject: subjectName,
        chapter: 'AI Tutor Session',
        concept: 'Interactive Learning',
        session_type: 'explanation',
        conversation_summary: summary,
        key_points_learned: sessionData.keyPoints,
        concepts_explained: sessionData.conceptsExplained,
        examples_used: sessionData.examples,
        problems_attempted: sessionData.problemsAttempted,
        problems_solved: sessionData.problemsSolved,
        mistakes_made: sessionData.mistakes,
        understanding_level: understandingScore,
        confidence_before: sessionData.confidenceBefore,
        confidence_after: confidenceAfter,
        questions_asked: sessionData.questionsAsked,
        ai_responses_count: sessionData.aiResponses,
        session_duration: duration
      });
      
      if (result.success) {
        console.log('✅ Learning session saved successfully');
        
        // Award bonus XP for completing a meaningful session
        if (duration >= 60) {
          const sessionXP = Math.min(50, Math.floor(duration / 60) * 10);
          await addXP(
            authUser.id,
            sessionXP,
            `Completed ${Math.floor(duration / 60)} minute learning session`,
            'tutoring',
            subjectName
          );
          console.log(`✅ Awarded ${sessionXP} XP for session completion`);
        }
        
        if (sessionData.problemsSolved > 0) {
          const masteryLevel = Math.min(100, sessionData.problemsSolved * 20);
          await updateConceptMastery(
            authUser.id,
            subjectName,
            'Interactive Learning',
            {
              chapter: 'AI Tutor Session',
              masteryLevel: masteryLevel,
              attempts: sessionData.problemsAttempted,
              successfulAttempts: sessionData.problemsSolved,
              status: masteryLevel >= 80 ? 'mastered' : 'learning'
            }
          );
          console.log('✅ Concept mastery updated');

          // Check for badges based on problems solved
          await checkBadgeEligibility(
            authUser.id,
            'concept_mastered',
            sessionData.problemsSolved,
            { subject: subjectName }
          );
        }
      } else {
        console.error('❌ Failed to save session:', result.error);
      }
    } catch (error) {
      console.error('❌ Session save error:', error);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return;

    const userMessage = inputText.trim();
    setInputText("");

    console.log("=== SENDING MESSAGE TO AI ===");
    console.log("User message:", userMessage);
    console.log("Language:", languageSettings?.preferred_tutoring_language);
    console.log("Code mixing:", languageSettings?.allow_code_mixing);
    console.log("Selected image:", selectedImage ? 'Yes' : 'No');

    try {
      if (!authUser?.id) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Build system prompt if not already built
      let currentPrompt = systemPrompt;
      if (!currentPrompt) {
        console.log('⚠️ Warning: No system prompt set, building now...');
        await buildAndSetSystemPrompt();
        currentPrompt = systemPrompt || '';
      }

      if (currentPrompt) {
        console.log('Using multilingual system prompt');
        console.log('Prompt language:', languageSettings?.preferred_tutoring_language);
        console.log('Code mixing:', languageSettings?.allow_code_mixing);
      }
      
      if (selectedImage) {
        console.log('Note: Image selected but image analysis not yet implemented');
      }
      
      // Send message with system prompt context
      const messageWithContext = currentPrompt 
        ? `${currentPrompt}\n\nStudent's question: ${userMessage}`
        : userMessage;
      
      await sendMessage(messageWithContext);
      console.log("✅ Message sent successfully");

      setSessionData(prev => ({
        ...prev,
        conceptsExplained: [...prev.conceptsExplained, 'Current Topic'],
        questionsAsked: prev.questionsAsked + 1,
        aiResponses: prev.aiResponses + 1,
        tutoringLanguage: languageSettings?.preferred_tutoring_language || 'English'
      }));

      // Award XP for active learning (asking questions)
      await addXP(
        authUser.id,
        5,
        `Asked question about ${subjectName}`,
        'tutoring',
        subjectName
      );

      console.log('✅ Awarded 5 XP for active learning');

      setSelectedImage(null);
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

  const handleExplainConcept = async () => {
    if (!authUser?.id) return;

    console.log('=== EXPLAIN CONCEPT REQUESTED ===');
    console.log('Language:', languageSettings?.preferred_tutoring_language);

    const message = "Can you explain the main concepts I need to focus on?";
    setInputText(message);
    
    setSessionData(prev => ({
      ...prev,
      conceptsExplained: [...prev.conceptsExplained, 'Main Concepts'],
      keyPoints: [...prev.keyPoints, 'Concept explanation requested']
    }));

    // Award XP for requesting concept explanation
    await addXP(
      authUser.id,
      20,
      `Learned about ${subjectName} concepts`,
      'tutoring',
      subjectName,
      'Main Concepts'
    );

    // Update streak
    await updateStreak(authUser.id);

    console.log('✅ Awarded 20 XP for learning concepts');
  };

  const handlePracticeProblem = async () => {
    if (!authUser?.id) return;

    console.log('=== PRACTICE PROBLEM REQUESTED ===');
    console.log('Language:', languageSettings?.preferred_tutoring_language);

    try {
      const problemPrompt = await buildMultilingualPracticeProblemPrompt(
        authUser.id,
        subjectName,
        'Practice Problem'
      );
      
      console.log('✅ Practice problem prompt built');
      const message = "Can you give me a practice problem to solve? " + 
                     `Use ${languageSettings?.preferred_tutoring_language} language and ` +
                     "follow this format:\n" + problemPrompt;
      setInputText(message);
    } catch (error) {
      console.error('❌ Build practice prompt error:', error);
      const message = "Can you give me a practice problem to solve?";
      setInputText(message);
    }
    
    setSessionData(prev => ({
      ...prev,
      problemsAttempted: prev.problemsAttempted + 1,
      keyPoints: [...prev.keyPoints, 'Practice problem requested']
    }));

    // Award XP for attempting practice problem
    await addXP(
      authUser.id,
      15,
      `Practiced ${subjectName} problems`,
      'practice',
      subjectName,
      'Practice Problem'
    );

    console.log('✅ Awarded 15 XP for practice problem');
  };



  const handleTakePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        handleImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        handleImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleImageSelected = (imageUri: string) => {
    setSelectedImage(imageUri);
    
    Alert.alert(
      'Image Selected',
      'What would you like me to help with?',
      [
        {
          text: 'Explain this',
          onPress: () => {
            setInputText('Can you explain what\'s in this image?');
          }
        },
        {
          text: 'Solve this problem',
          onPress: () => {
            setInputText('Can you help me solve this problem?');
          }
        },
        {
          text: 'Check my work',
          onPress: () => {
            setInputText('Can you check if my work is correct?');
          }
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setSelectedImage(null)
        }
      ]
    );
  };

  const handleImageUpload = () => {
    Alert.alert(
      '📷 Add Image',
      'Upload an image from your textbook or homework for help',
      [
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose from Gallery', onPress: handlePickImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
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
              onPress={handleImageUpload}
            >
              <ImagePlus size={16} color={Colors.text} />
              <Text style={styles.quickButtonText}>📷 Image</Text>
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
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
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
