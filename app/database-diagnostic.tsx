import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";

interface DiagnosticResult {
  name: string;
  status: "success" | "error" | "warning";
  message: string;
  details?: string;
}

export default function DatabaseDiagnosticScreen() {
  const { authUser } = useUser();
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const diagnostics: DiagnosticResult[] = [];

    try {
      diagnostics.push({
        name: "1. Check User Authentication",
        status: authUser ? "success" : "error",
        message: authUser
          ? `Authenticated as ${authUser.id}`
          : "No authenticated user",
      });

      diagnostics.push({
        name: "2. Check Grades Table",
        status: "success",
        message: "Checking...",
      });
      const { data: grades, error: gradesError } = await supabase
        .from("cbse_grades")
        .select("*")
        .limit(10);
      
      if (gradesError) {
        diagnostics[diagnostics.length - 1] = {
          name: "2. Check Grades Table",
          status: "error",
          message: "Failed to query grades table",
          details: gradesError.message,
        };
      } else {
        diagnostics[diagnostics.length - 1] = {
          name: "2. Check Grades Table",
          status: grades.length > 0 ? "success" : "warning",
          message: `Found ${grades.length} grades`,
          details: grades.length === 0 ? "Run database-setup.sql" : undefined,
        };
      }

      diagnostics.push({
        name: "3. Check Subjects Table",
        status: "success",
        message: "Checking...",
      });
      const { data: subjects, error: subjectsError } = await supabase
        .from("cbse_subjects")
        .select("*")
        .limit(10);
      
      if (subjectsError) {
        diagnostics[diagnostics.length - 1] = {
          name: "3. Check Subjects Table",
          status: "error",
          message: "Failed to query subjects table",
          details: subjectsError.message,
        };
      } else {
        diagnostics[diagnostics.length - 1] = {
          name: "3. Check Subjects Table",
          status: subjects.length > 0 ? "success" : "warning",
          message: `Found ${subjects.length} subjects`,
          details: subjects.length === 0 ? "Run database-setup.sql" : undefined,
        };
      }

      diagnostics.push({
        name: "4. Check Books Table",
        status: "success",
        message: "Checking...",
      });
      const { data: books, error: booksError } = await supabase
        .from("cbse_books")
        .select("*")
        .limit(10);
      
      if (booksError) {
        diagnostics[diagnostics.length - 1] = {
          name: "4. Check Books Table",
          status: "error",
          message: "Failed to query books table",
          details: booksError.message,
        };
      } else {
        diagnostics[diagnostics.length - 1] = {
          name: "4. Check Books Table",
          status: books.length > 0 ? "success" : "warning",
          message: `Found ${books.length} books`,
          details: books.length === 0 ? "Run database-sample-data.sql" : undefined,
        };
      }

      diagnostics.push({
        name: "5. Check Chapters Table",
        status: "success",
        message: "Checking...",
      });
      const { data: chapters, error: chaptersError } = await supabase
        .from("cbse_chapters")
        .select("*")
        .limit(10);
      
      if (chaptersError) {
        diagnostics[diagnostics.length - 1] = {
          name: "5. Check Chapters Table",
          status: "error",
          message: "Failed to query chapters table",
          details: chaptersError.message,
        };
      } else {
        diagnostics[diagnostics.length - 1] = {
          name: "5. Check Chapters Table",
          status: chapters.length > 0 ? "success" : "warning",
          message: `Found ${chapters.length} chapters`,
          details: chapters.length === 0 ? "Run database-sample-data.sql" : undefined,
        };
      }

      if (authUser) {
        diagnostics.push({
          name: "6. Check User Progress",
          status: "success",
          message: "Checking...",
        });
        const { data: progress, error: progressError } = await supabase
          .from("student_chapter_progress")
          .select("*")
          .eq("user_id", authUser.id)
          .limit(10);
        
        if (progressError) {
          diagnostics[diagnostics.length - 1] = {
            name: "6. Check User Progress",
            status: "error",
            message: "Failed to query progress table",
            details: progressError.message,
          };
        } else {
          diagnostics[diagnostics.length - 1] = {
            name: "6. Check User Progress",
            status: "success",
            message: `Found ${progress.length} progress records`,
            details: progress.length === 0 ? "User hasn't started any chapters yet" : undefined,
          };
        }

        diagnostics.push({
          name: "7. Check Subject Progress View",
          status: "success",
          message: "Checking...",
        });
        const { data: subjectProgress, error: subjectProgressError } = await supabase
          .from("student_subject_progress")
          .select("*")
          .eq("user_id", authUser.id)
          .limit(10);
        
        if (subjectProgressError) {
          diagnostics[diagnostics.length - 1] = {
            name: "7. Check Subject Progress View",
            status: "error",
            message: "View query failed",
            details: subjectProgressError.message + " - Run database-views-fix.sql",
          };
        } else {
          diagnostics[diagnostics.length - 1] = {
            name: "7. Check Subject Progress View",
            status: "success",
            message: `View working: ${subjectProgress.length} subjects`,
          };
        }

        diagnostics.push({
          name: "8. Check Dashboard Summary View",
          status: "success",
          message: "Checking...",
        });
        const { data: summary, error: summaryError } = await supabase
          .from("student_dashboard_summary")
          .select("*")
          .eq("user_id", authUser.id)
          .single();
        
        if (summaryError) {
          diagnostics[diagnostics.length - 1] = {
            name: "8. Check Dashboard Summary View",
            status: "error",
            message: "View query failed",
            details: summaryError.message + " - Run database-views-fix.sql",
          };
        } else {
          diagnostics[diagnostics.length - 1] = {
            name: "8. Check Dashboard Summary View",
            status: "success",
            message: `View working: ${summary ? "Data found" : "No data"}`,
          };
        }

        diagnostics.push({
          name: "9. Check Recent Activity View",
          status: "success",
          message: "Checking...",
        });
        const { data: activity, error: activityError } = await supabase
          .from("student_recent_activity")
          .select("*")
          .eq("user_id", authUser.id)
          .limit(10);
        
        if (activityError) {
          diagnostics[diagnostics.length - 1] = {
            name: "9. Check Recent Activity View",
            status: "error",
            message: "View query failed",
            details: activityError.message + " - Run database-views-fix.sql",
          };
        } else {
          diagnostics[diagnostics.length - 1] = {
            name: "9. Check Recent Activity View",
            status: "success",
            message: `View working: ${activity.length} activities`,
          };
        }
      }

    } catch (error) {
      diagnostics.push({
        name: "Critical Error",
        status: "error",
        message: "Diagnostic crashed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }

    setResults(diagnostics);
    setIsRunning(false);

    const errorCount = diagnostics.filter((d) => d.status === "error").length;
    const warningCount = diagnostics.filter((d) => d.status === "warning").length;

    if (errorCount === 0 && warningCount === 0) {
      Alert.alert(
        "✅ All Checks Passed",
        "Your database is properly configured!",
        [{ text: "OK" }]
      );
    } else if (errorCount > 0) {
      Alert.alert(
        "❌ Errors Found",
        `Found ${errorCount} error(s) and ${warningCount} warning(s). See details below.`,
        [{ text: "OK" }]
      );
    } else {
      Alert.alert(
        "⚠️ Warnings Found",
        `Found ${warningCount} warning(s). Database is functional but may need setup.`,
        [{ text: "OK" }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Database Diagnostics</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.description}>
          This tool checks if your database is properly configured.
          {"\n"}Run this if you&apos;re seeing errors on the home screen.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.runButton,
            pressed && styles.runButtonPressed,
            isRunning && styles.runButtonDisabled,
          ]}
          onPress={runDiagnostics}
          disabled={isRunning}
        >
          <Text style={styles.runButtonText}>
            {isRunning ? "Running Diagnostics..." : "Run Diagnostics"}
          </Text>
        </Pressable>

        {results.length > 0 && (
          <View style={styles.results}>
            <Text style={styles.resultsTitle}>Results:</Text>
            {results.map((result, index) => (
              <View
                key={index}
                style={[
                  styles.resultCard,
                  result.status === "success" && styles.resultSuccess,
                  result.status === "error" && styles.resultError,
                  result.status === "warning" && styles.resultWarning,
                ]}
              >
                <View style={styles.resultHeader}>
                  <Text style={styles.resultIcon}>
                    {result.status === "success" && "✅"}
                    {result.status === "error" && "❌"}
                    {result.status === "warning" && "⚠️"}
                  </Text>
                  <Text style={styles.resultName}>{result.name}</Text>
                </View>
                <Text style={styles.resultMessage}>{result.message}</Text>
                {result.details && (
                  <Text style={styles.resultDetails}>{result.details}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>📚 Common Fixes:</Text>
          <Text style={styles.instructionText}>
            1. If tables are empty: Run database-setup.sql in Supabase
          </Text>
          <Text style={styles.instructionText}>
            2. If no books/chapters: Run database-sample-data.sql
          </Text>
          <Text style={styles.instructionText}>
            3. If views fail: Run database-views-fix.sql
          </Text>
          <Text style={styles.instructionText}>
            4. Check DATABASE_FIX_INSTRUCTIONS.md for detailed steps
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.cardBackground,
  },
  backButton: {
    paddingVertical: 8,
  },
  backText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  runButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  runButtonPressed: {
    opacity: 0.8,
  },
  runButtonDisabled: {
    opacity: 0.5,
  },
  runButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  results: {
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  resultCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  resultSuccess: {
    borderColor: "#10B981",
  },
  resultError: {
    borderColor: "#EF4444",
  },
  resultWarning: {
    borderColor: "#F59E0B",
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  resultIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  resultName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    flex: 1,
  },
  resultMessage: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  resultDetails: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: "italic" as const,
    marginTop: 4,
  },
  instructions: {
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
});
