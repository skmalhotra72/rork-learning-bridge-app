import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { CHAPTERS, getConfidenceLabel, SUBJECTS } from "@/constants/types";
import type { SubjectDetails, SubjectType } from "@/constants/types";
import { useUser } from "@/contexts/UserContext";
import { getSubjectsForGrade } from "@/services/contentLibrary";
import type { CBSESubject } from "@/services/contentLibrary";

export default function SubjectDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const schoolMedium = params.schoolMedium as string;
  const preferredLanguage = params.preferredLanguage as string;
  const allowCodeMixing = params.allowCodeMixing === 'true';
  
  const { user, updateSubjectDetails } = useUser();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [subjectDetailsMap, setSubjectDetailsMap] = useState<
    Map<SubjectType, SubjectDetails>
  >(new Map());
  const [cbseSubjects, setCbseSubjects] = useState<CBSESubject[]>([]);

  const selectedSubjects = user?.selectedSubjects || [];
  const currentSubjectId = selectedSubjects[currentIndex];
  const currentSubject = SUBJECTS.find((s) => s.id === currentSubjectId);
  const isLastSubject = currentIndex === selectedSubjects.length - 1;

  const currentDetails = subjectDetailsMap.get(currentSubjectId) || {
    subjectId: currentSubjectId,
    currentChapter: "",
    confidence: 5,
    stuckPoints: "",
  };

  useEffect(() => {
    if (user?.subjectDetails) {
      const map = new Map<SubjectType, SubjectDetails>();
      user.subjectDetails.forEach((detail) => {
        map.set(detail.subjectId, detail);
      });
      setSubjectDetailsMap(map);
    }
  }, [user?.subjectDetails]);

  useEffect(() => {
    loadCBSESubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCBSESubjects = async () => {
    try {
      const gradeNum = user?.grade ? parseInt(user.grade) : 10;
      const subjects = await getSubjectsForGrade(gradeNum);
      setCbseSubjects(subjects);
    } catch (error) {
      console.error('Error loading CBSE subjects:', error);
    }
  };

  const updateCurrentDetails = (updates: Partial<SubjectDetails>) => {
    const updated = { ...currentDetails, ...updates };
    setSubjectDetailsMap((prev) => new Map(prev).set(currentSubjectId, updated));
  };

  const handleNext = async () => {
    if (!currentDetails.currentChapter) {
      Alert.alert("Missing information", "Please select your current chapter");
      return;
    }

    await updateSubjectDetails(currentDetails);

    if (isLastSubject) {
      const selectedCbseSubjects = cbseSubjects.filter(cbseSubj => 
        selectedSubjects.includes(cbseSubj.subject_code as SubjectType)
      );
      
      router.push({
        pathname: "/chapter-selection" as any,
        params: {
          selectedGrade: user?.grade || '10',
          schoolMedium,
          preferredLanguage,
          allowCodeMixing: allowCodeMixing.toString(),
          selectedSubjects: JSON.stringify(selectedCbseSubjects)
        }
      });
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  if (!currentSubject) {
    return null;
  }

  const confidenceInfo = getConfidenceLabel(currentDetails.confidence);
  const progress = ((currentIndex + 1) / selectedSubjects.length) * 50 + 50;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#EEF2FF", "#FFFFFF"]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Step 3 of 4</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.subjectIcon}>{currentSubject.icon}</Text>
            <Text style={styles.title}>Tell us about {currentSubject.name}</Text>
            <Text style={styles.subtitle}>
              {currentSubject.name} ({currentIndex + 1} of {selectedSubjects.length}{" "}
              subjects)
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Chapter</Text>
            <Text style={styles.sectionSubtitle}>
              Which chapter are you currently on?
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chapterList}
            >
              {CHAPTERS.map((chapter) => (
                <Pressable
                  key={chapter.id}
                  style={({ pressed }) => [
                    styles.chapterPill,
                    currentDetails.currentChapter === chapter.name &&
                      styles.chapterPillSelected,
                    pressed && styles.chapterPillPressed,
                  ]}
                  onPress={() =>
                    updateCurrentDetails({ currentChapter: chapter.name })
                  }
                >
                  <Text
                    style={[
                      styles.chapterText,
                      currentDetails.currentChapter === chapter.name &&
                        styles.chapterTextSelected,
                    ]}
                  >
                    {chapter.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Confidence Level</Text>
            <Text style={styles.sectionSubtitle}>
              How confident are you with this subject?
            </Text>

            <View style={styles.confidenceDisplay}>
              <Text style={styles.confidenceEmoji}>{confidenceInfo.emoji}</Text>
              <Text style={styles.confidenceLabel}>{confidenceInfo.label}</Text>
              <Text style={styles.confidenceValue}>
                {currentDetails.confidence}/10
              </Text>
            </View>

            <View style={styles.sliderContainer}>
              <View style={styles.sliderTrack}>
                <View
                  style={[
                    styles.sliderFill,
                    {
                      width: `${(currentDetails.confidence / 10) * 100}%`,
                      backgroundColor: currentSubject.color,
                    },
                  ]}
                />
              </View>
              <View style={styles.sliderMarks}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (
                  <Pressable
                    key={value}
                    style={styles.sliderMark}
                    onPress={() => updateCurrentDetails({ confidence: value })}
                  >
                    <View
                      style={[
                        styles.sliderDot,
                        currentDetails.confidence === value &&
                          styles.sliderDotActive,
                        currentDetails.confidence === value && {
                          backgroundColor: currentSubject.color,
                        },
                      ]}
                    />
                    <Text style={styles.sliderLabel}>{value}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What are you stuck on?</Text>
            <Text style={styles.sectionSubtitle}>(Optional)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="e.g., I don't understand quadratic equations, word problems are confusing..."
              placeholderTextColor={Colors.textSecondary}
              value={currentDetails.stuckPoints}
              onChangeText={(text) =>
                updateCurrentDetails({ stuckPoints: text })
              }
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCounter}>
              {currentDetails.stuckPoints.length}/500
            </Text>
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
              !currentDetails.currentChapter && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleNext}
            disabled={!currentDetails.currentChapter}
          >
            <LinearGradient
              colors={
                currentDetails.currentChapter
                  ? [Colors.gradients.primary[0], Colors.gradients.primary[1]]
                  : [Colors.border, Colors.border]
              }
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text
                style={[
                  styles.buttonText,
                  !currentDetails.currentChapter && styles.buttonTextDisabled,
                ]}
              >
                {isLastSubject ? "Save & Continue" : "Save & Next Subject"}
              </Text>
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
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  subjectIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  chapterList: {
    gap: 8,
    paddingVertical: 4,
  },
  chapterPill: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chapterPillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chapterPillPressed: {
    opacity: 0.7,
  },
  chapterText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  chapterTextSelected: {
    color: "#FFFFFF",
  },
  confidenceDisplay: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    marginBottom: 20,
  },
  confidenceEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  confidenceLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  confidenceValue: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  sliderContainer: {
    gap: 12,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  sliderFill: {
    height: "100%",
    borderRadius: 4,
  },
  sliderMarks: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderMark: {
    alignItems: "center",
    gap: 8,
  },
  sliderDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.border,
  },
  sliderDotActive: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  sliderLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600" as const,
  },
  textArea: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 120,
  },
  charCounter: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "right",
    marginTop: 8,
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
  buttonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
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
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  buttonTextDisabled: {
    color: Colors.textSecondary,
  },
});
