import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Globe } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

interface Language {
  code: string;
  name: string;
  emoji: string;
  native: string;
}

const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'English', name: 'English', emoji: '🇬🇧', native: 'English' },
  { code: 'Hindi', name: 'Hindi', emoji: '🇮🇳', native: 'हिंदी' },
  { code: 'Hinglish', name: 'Hinglish', emoji: '🇮🇳', native: 'Hinglish (Mix)' },
  { code: 'Marathi', name: 'Marathi', emoji: '🇮🇳', native: 'मराठी' },
  { code: 'Tamil', name: 'Tamil', emoji: '🇮🇳', native: 'தமிழ்' },
  { code: 'Telugu', name: 'Telugu', emoji: '🇮🇳', native: 'తెలుగు' },
  { code: 'Kannada', name: 'Kannada', emoji: '🇮🇳', native: 'ಕನ್ನಡ' },
  { code: 'Malayalam', name: 'Malayalam', emoji: '🇮🇳', native: 'മലയാളം' },
  { code: 'Bengali', name: 'Bengali', emoji: '🇮🇳', native: 'বাংলা' },
  { code: 'Gujarati', name: 'Gujarati', emoji: '🇮🇳', native: 'ગુજરાતી' },
  { code: 'Punjabi', name: 'Punjabi', emoji: '🇮🇳', native: 'ਪੰਜਾਬੀ' }
];

const SCHOOL_LANGUAGES = SUPPORTED_LANGUAGES.filter(l => l.code !== 'Hinglish');

export default function LanguageSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const selectedGrade = params.selectedGrade as string;
  
  const [schoolMedium, setSchoolMedium] = useState<string>('English');
  const [preferredLanguage, setPreferredLanguage] = useState<string>('English');
  const [allowCodeMixing, setAllowCodeMixing] = useState<boolean>(true);

  const handleNext = () => {
    router.push({
      pathname: "/subject-selection" as any,
      params: {
        selectedGrade,
        schoolMedium,
        preferredLanguage,
        allowCodeMixing: allowCodeMixing.toString()
      }
    });
  };

  const handleBack = () => {
    router.back();
  };

  const getExampleText = (language: string, codeMixing: boolean): string => {
    const examples: Record<string, string> = {
      'English': "Let's understand quadratic equations step by step. First, we'll look at the basic form: ax² + bx + c = 0",
      'Hindi': "चलिए द्विघात समीकरण को कदम-दर-कदम समझते हैं। पहले, हम मूल रूप देखेंगे: ax² + bx + c = 0",
      'Hinglish': "Chalo quadratic equations ko step by step samajhte hain. Pehle, hum basic form dekhenge: ax² + bx + c = 0",
      'Tamil': "இருபடிச் சமன்பாடுகளை படிப்படியாகப் புரிந்துகொள்வோம். முதலில், அடிப்படை வடிவத்தைப் பார்ப்போம்: ax² + bx + c = 0",
      'Telugu': "చతురస్ర సమీకరణాలను దశల వారీగా అర్థం చేసుకుందాం. మొదట, ప్రాథమిక రూపాన్ని చూద్దాం: ax² + bx + c = 0",
      'Marathi': "चला द्विघात समीकरणे पायरीने समजून घेऊया. प्रथम, आपण मूळ स्वरूप पाहू: ax² + bx + c = 0",
      'Bengali': "চলো ধাপে ধাপে দ্বিঘাত সমীকরণ বুঝি। প্রথমে, আমরা মূল রূপ দেখব: ax² + bx + c = 0",
      'Gujarati': "ચાલો દ્વિઘાત સમીકરણને પગલે પગલે સમજીએ. પહેલાં, આપણે મૂળભૂત સ્વરૂપ જોઈશું: ax² + bx + c = 0",
      'Punjabi': "ਆਓ ਕਦਮ-ਬਾ-ਕਦਮ ਵਰਗ ਸਮੀਕਰਣ ਨੂੰ ਸਮਝੀਏ। ਪਹਿਲਾਂ, ਅਸੀਂ ਮੂਲ ਰੂਪ ਵੇਖਾਂਗੇ: ax² + bx + c = 0",
      'Kannada': "ಚತುರ್ಭುಜ ಸಮೀಕರಣಗಳನ್ನು ಹಂತ ಹಂತವಾಗಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳೋಣ. ಮೊದಲು, ನಾವು ಮೂಲ ರೂಪವನ್ನು ನೋಡೋಣ: ax² + bx + c = 0",
      'Malayalam': "നമുക്ക് ദ്വിഘാത സമവാക്യങ്ങൾ ഘട്ടം ഘട്ടമായി മനസ്സിലാക്കാം. ആദ്യം, നമുക്ക് അടിസ്ഥാന രൂപം കാണാം: ax² + bx + c = 0"
    };

    if (codeMixing && language === 'Hindi') {
      return examples['Hinglish'];
    }

    return examples[language] || examples['English'];
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#EEF2FF", "#FFFFFF"]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Step 2 of 4</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "50%" }]} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconContainer}>
            <Globe size={48} color={Colors.primary} strokeWidth={2} />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Language Preferences</Text>
            <Text style={styles.subtitle}>
              Help us teach you in the language you&apos;re most comfortable with
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              What language does your school teach in?
            </Text>
            <Text style={styles.sectionHint}>
              This is your medium of instruction
            </Text>
            
            <View style={styles.languageGrid}>
              {SCHOOL_LANGUAGES.map(lang => (
                <Pressable
                  key={lang.code}
                  style={({ pressed }) => [
                    styles.languageCard,
                    schoolMedium === lang.code && styles.languageCardSelected,
                    pressed && styles.languageCardPressed
                  ]}
                  onPress={() => setSchoolMedium(lang.code)}
                >
                  <Text style={styles.languageEmoji}>{lang.emoji}</Text>
                  <Text style={styles.languageName}>{lang.native}</Text>
                  {schoolMedium === lang.code && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Which language are you most comfortable learning in?
            </Text>
            <Text style={styles.sectionHint}>
              Buddy will explain concepts in this language
            </Text>
            
            <View style={styles.languageGrid}>
              {SUPPORTED_LANGUAGES.map(lang => (
                <Pressable
                  key={lang.code}
                  style={({ pressed }) => [
                    styles.languageCard,
                    preferredLanguage === lang.code && styles.languageCardSelected,
                    pressed && styles.languageCardPressed
                  ]}
                  onPress={() => setPreferredLanguage(lang.code)}
                >
                  <Text style={styles.languageEmoji}>{lang.emoji}</Text>
                  <Text style={styles.languageName}>{lang.native}</Text>
                  {preferredLanguage === lang.code && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.toggleSection}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>
                  Mix languages when explaining
                </Text>
                <Text style={styles.toggleHint}>
                  Use both English and {preferredLanguage} together{preferredLanguage === 'Hindi' ? ' (Hinglish)' : ''}
                </Text>
              </View>
              <Switch
                value={allowCodeMixing}
                onValueChange={setAllowCodeMixing}
                trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                thumbColor={allowCodeMixing ? '#FFFFFF' : '#F3F4F6'}
              />
            </View>
          </View>

          <View style={styles.exampleSection}>
            <Text style={styles.exampleTitle}>Preview how Buddy will talk:</Text>
            <View style={styles.exampleCard}>
              <View style={styles.exampleHeader}>
                <Text style={styles.exampleAvatar}>🦉</Text>
                <Text style={styles.exampleLabel}>Buddy</Text>
              </View>
              <Text style={styles.exampleText}>
                {getExampleText(preferredLanguage, allowCodeMixing)}
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            onPress={handleBack}
          >
            <ArrowLeft size={20} color={Colors.primary} />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleNext}
          >
            <LinearGradient
              colors={[Colors.gradients.primary[0], Colors.gradients.primary[1]]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonText}>Next</Text>
            </LinearGradient>
          </Pressable>
        </View>
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
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: "600" as const,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  languageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  languageCard: {
    width: "30%",
    backgroundColor: Colors.cardBackground,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    position: "relative",
    minHeight: 80,
  },
  languageCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#EEF2FF",
  },
  languageCardPressed: {
    transform: [{ scale: 0.97 }],
  },
  languageEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  languageName: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.text,
    textAlign: "center",
  },
  checkmark: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold" as const,
  },
  toggleSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  toggleHint: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  exampleSection: {
    marginBottom: 80,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  exampleCard: {
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  exampleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  exampleAvatar: {
    fontSize: 20,
  },
  exampleLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  exampleText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  backButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  button: {
    flex: 1,
    borderRadius: 12,
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
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
});
