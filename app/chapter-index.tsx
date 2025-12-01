import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, BookOpen, Clock } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import {
  getBook,
  getChapters,
  getTopics,
  type CBSEBook,
  type CBSEChapter,
  type CBSETopic,
} from "@/services/contentLibrary";

export default function ChapterIndexScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    subjectCode: string;
    gradeNumber: string;
  }>();

  const { subjectCode, gradeNumber } = params;
  const gradeNum = parseInt(gradeNumber || "10", 10);

  const [book, setBook] = useState<CBSEBook | null>(null);
  const [chapters, setChapters] = useState<CBSEChapter[]>([]);
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [chapterTopics, setChapterTopics] = useState<Record<string, CBSETopic[]>>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadContent = async () => {
    try {
      console.log("Loading content for:", { subjectCode, gradeNumber: gradeNum });

      const bookData = await getBook(gradeNum, subjectCode);
      if (!bookData) {
        console.error("No book found");
        setLoading(false);
        return;
      }
      setBook(bookData);

      const chaptersData = await getChapters(bookData.id);
      setChapters(chaptersData);

      setLoading(false);
    } catch (error) {
      console.error("Load content error:", error);
      setLoading(false);
    }
  };

  const toggleChapter = async (chapterId: string) => {
    const isExpanded = expandedChapters[chapterId];

    if (isExpanded) {
      setExpandedChapters((prev) => ({ ...prev, [chapterId]: false }));
    } else {
      setExpandedChapters((prev) => ({ ...prev, [chapterId]: true }));

      if (!chapterTopics[chapterId]) {
        const topics = await getTopics(chapterId);
        setChapterTopics((prev) => ({ ...prev, [chapterId]: topics }));
      }
    }
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case "beginner":
        return "#10B981";
      case "intermediate":
        return "#F59E0B";
      case "advanced":
        return "#EF4444";
      default:
        return Colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={["#EEF2FF", "#FFFFFF"]} style={StyleSheet.absoluteFillObject} />
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading curriculum...</Text>
        </SafeAreaView>
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={["#EEF2FF", "#FFFFFF"]} style={StyleSheet.absoluteFillObject} />
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.errorContainer}>
          <Text style={styles.errorText}>📚 Book not found</Text>
          <Text style={styles.errorSubtext}>
            This curriculum content is not yet available.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.backButtonAlt, pressed && styles.backButtonPressed]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonTextAlt}>← Go Back</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#EEF2FF", "#FFFFFF"]} style={StyleSheet.absoluteFillObject} />
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.primary} />
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={styles.headerIcon}>{book.subject?.icon_emoji || "📚"}</Text>
            <Text style={styles.headerTitle}>{book.subject?.subject_name}</Text>
            <Text style={styles.headerSubtitle}>{book.grade?.display_name}</Text>
          </View>
        </View>

        <View style={styles.bookInfo}>
          <BookOpen size={20} color={Colors.primary} />
          <View style={styles.bookTextContainer}>
            <Text style={styles.bookTitle}>{book.book_title}</Text>
            <Text style={styles.bookMeta}>
              {book.publisher} • {book.total_chapters} Chapters
            </Text>
          </View>
        </View>

        <ScrollView style={styles.chaptersContainer} showsVerticalScrollIndicator={false}>
          {chapters.map((chapter) => (
            <View key={chapter.id} style={styles.chapterCard}>
              <Pressable
                style={({ pressed }) => [
                  styles.chapterHeader,
                  pressed && styles.chapterHeaderPressed,
                ]}
                onPress={() => toggleChapter(chapter.id)}
              >
                <View style={styles.chapterNumberBadge}>
                  <Text style={styles.chapterNumber}>{chapter.chapter_number}</Text>
                </View>

                <View style={styles.chapterInfo}>
                  <Text style={styles.chapterTitle}>{chapter.chapter_title}</Text>
                  {chapter.chapter_description && (
                    <Text style={styles.chapterDescription} numberOfLines={2}>
                      {chapter.chapter_description}
                    </Text>
                  )}
                  <View style={styles.chapterMeta}>
                    <View
                      style={[
                        styles.difficultyBadge,
                        { backgroundColor: getDifficultyColor(chapter.difficulty_level) + "15" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.difficultyText,
                          { color: getDifficultyColor(chapter.difficulty_level) },
                        ]}
                      >
                        {chapter.difficulty_level}
                      </Text>
                    </View>
                    {chapter.weightage_marks !== null && chapter.weightage_marks !== undefined && (
                      <Text style={styles.weightage}>📊 {chapter.weightage_marks} marks</Text>
                    )}
                    {chapter.estimated_duration_hours !== null &&
                      chapter.estimated_duration_hours !== undefined && (
                        <View style={styles.durationContainer}>
                          <Clock size={12} color={Colors.textSecondary} />
                          <Text style={styles.duration}>
                            {chapter.estimated_duration_hours}h
                          </Text>
                        </View>
                      )}
                  </View>
                </View>

                <Text style={styles.expandIcon}>
                  {expandedChapters[chapter.id] ? "▼" : "▶"}
                </Text>
              </Pressable>

              {expandedChapters[chapter.id] && (
                <View style={styles.topicsContainer}>
                  {chapterTopics[chapter.id] ? (
                    chapterTopics[chapter.id].length > 0 ? (
                      chapterTopics[chapter.id].map((topic) => (
                        <Pressable
                          key={topic.id}
                          style={({ pressed }) => [
                            styles.topicItem,
                            pressed && styles.topicItemPressed,
                          ]}
                          onPress={() => {
                            console.log('Topic tapped:', topic.topic_title);
                          }}
                        >
                          <View style={styles.topicNumber}>
                            <Text style={styles.topicNumberText}>{topic.topic_number}</Text>
                          </View>
                          <View style={styles.topicInfo}>
                            <Text style={styles.topicTitle}>{topic.topic_title}</Text>
                            {topic.estimated_duration_minutes && (
                              <View style={styles.topicDuration}>
                                <Clock size={12} color={Colors.textSecondary} />
                                <Text style={styles.topicDurationText}>
                                  {topic.estimated_duration_minutes} min
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.topicArrow}>→</Text>
                        </Pressable>
                      ))
                    ) : (
                      <Text style={styles.noTopics}>No topics available yet</Text>
                    )
                  ) : (
                    <View style={styles.topicLoadingContainer}>
                      <ActivityIndicator size="small" color={Colors.primary} />
                      <Text style={styles.topicLoadingText}>Loading topics...</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}

          {chapters.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📖</Text>
              <Text style={styles.emptyText}>No chapters available yet</Text>
            </View>
          )}
        </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: "600" as const,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  backButtonAlt: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  backButtonTextAlt: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
  },
  backButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
    alignItems: "center",
  },
  headerIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  bookInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  bookTextContainer: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 2,
  },
  bookMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  chaptersContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  chapterCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chapterHeader: {
    flexDirection: "row",
    padding: 16,
    alignItems: "flex-start",
  },
  chapterHeaderPressed: {
    backgroundColor: Colors.cardBackground,
  },
  chapterNumberBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  chapterNumber: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.primary,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 6,
    lineHeight: 22,
  },
  chapterDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  chapterMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: "600" as const,
    textTransform: "capitalize",
  },
  weightage: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  duration: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
  expandIcon: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  topicsContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.cardBackground,
  },
  topicItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topicItemPressed: {
    backgroundColor: "#FFFFFF",
  },
  topicNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topicNumberText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  topicInfo: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  topicDuration: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  topicDurationText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  topicArrow: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  noTopics: {
    padding: 20,
    textAlign: "center",
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  topicLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 12,
  },
  topicLoadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
