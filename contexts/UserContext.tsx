import createContextHook from "@nkzw/create-context-hook";
import type { Session, User } from "@supabase/supabase-js";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

import type { Grade, SubjectDetails, SubjectType, UserProfile } from "@/constants/types";
import type { Profile, SubjectProgress, UserStats } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";

export const [UserProvider, useUser] = createContextHook(() => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        setSession(session);
        setAuthUser(session?.user ?? null);

        if (session?.user) {
          await loadUserProfile(session.user.id);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      
      console.log("Auth state changed:", _event);
      setSession(session);
      setAuthUser(session?.user ?? null);
      
      if (_event === "SIGNED_OUT") {
        setUser(null);
        setStats(null);
        router.replace("/welcome");
      } else if (_event === "SIGNED_IN" && session?.user) {
        loadUserProfile(session.user.id);
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [router]);



  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error loading profile:", profileError);
        setIsLoading(false);
        return;
      }

      if (!profile) {
        setIsLoading(false);
        return;
      }

      const { data: subjects, error: subjectsError } = await supabase
        .from("subject_progress")
        .select("*")
        .eq("user_id", userId);

      if (subjectsError) {
        console.error("Error loading subjects:", subjectsError);
      }

      const { data: userStats, error: statsError } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (statsError) {
        console.error("Error loading stats:", statsError);
      } else {
        setStats(userStats);
      }

      const selectedSubjects: SubjectType[] = [];
      const subjectDetails: SubjectDetails[] = [];

      if (subjects && subjects.length > 0) {
        subjects.forEach((s: SubjectProgress) => {
          const subjectId = s.subject as SubjectType;
          selectedSubjects.push(subjectId);
          subjectDetails.push({
            subjectId,
            currentChapter: s.current_chapter,
            confidence: s.confidence_level,
            stuckPoints: s.stuck_points || "",
          });
        });
      }

      const userData: UserProfile = {
        name: profile.full_name,
        email: profile.email,
        grade: profile.grade as Grade,
        selectedSubjects,
        subjectDetails,
        hasCompletedOnboarding: !!(subjects && subjects.length > 0),
      };

      setUser(userData);
    } catch (error) {
      console.error("Error in loadUserProfile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log("========== SIGNUP PROCESS STARTED ==========");
      console.log("Timestamp:", new Date().toISOString());
      console.log("Email:", email.trim().toLowerCase());
      console.log("Name:", name.trim());
      console.log("Password length:", password.length);
      
      console.log("\n[STEP 1] Creating auth user...");
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (authError) {
        console.error("❌ [STEP 1] Auth error occurred:");
        console.error("Error object:", JSON.stringify(authError, null, 2));
        console.error("Error message:", authError.message);
        console.error("Error status:", authError.status);
        console.error("Error name:", authError.name);
        
        let errorMessage = "Failed to create account";
        
        if (authError.message.includes("already registered")) {
          errorMessage = "This email is already registered";
        } else if (authError.message.includes("Password")) {
          errorMessage = "Password must be at least 6 characters";
        } else if (authError.message.includes("email")) {
          errorMessage = "Invalid email format";
        } else if (authError.message.includes("network")) {
          errorMessage = "Network error - check your connection";
        } else {
          errorMessage = authError.message || "Failed to create account";
        }
        
        console.error("User-facing error message:", errorMessage);
        return { success: false, error: errorMessage };
      }

      if (!authData?.user?.id) {
        console.error("❌ [STEP 1] No user ID returned");
        console.error("Auth data received:", JSON.stringify(authData, null, 2));
        return { success: false, error: "Signup failed - no user created" };
      }

      const userId = authData.user.id;
      console.log("✓ [STEP 1] Auth user created successfully");
      console.log("User ID:", userId);
      console.log("User email:", authData.user.email);
      console.log("User created at:", authData.user.created_at);

      console.log("\n[STEP 2] Waiting for auth to fully process...");
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log("✓ [STEP 2] Wait complete");

      console.log("\n[STEP 3] Creating profile (required for foreign keys)...");
      const profileData = {
        id: userId,
        full_name: name.trim(),
        email: email.trim().toLowerCase(),
        grade: "10"
      };
      console.log("Profile data to insert:", JSON.stringify(profileData, null, 2));
      
      const { data: profileInsertData, error: profileError } = await supabase
        .from("profiles")
        .insert(profileData)
        .select()
        .single();

      if (profileError) {
        console.error("❌ [STEP 3] Profile error occurred:");
        console.error("Error code:", profileError.code);
        console.error("Error message:", profileError.message);
        console.error("Error details:", profileError.details);
        console.error("Error hint:", profileError.hint);
        console.error("Full error object:", JSON.stringify(profileError, null, 2));
        
        console.log("\n[STEP 3.1] Checking if profile exists from trigger...");
        const { data: checkProfile, error: checkError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
        
        if (checkError) {
          console.error("❌ [STEP 3.1] Profile check error:", JSON.stringify(checkError, null, 2));
          return { success: false, error: `Profile creation failed: ${profileError.message || 'Unknown error'}` };
        }

        if (checkProfile) {
          console.log("✓ [STEP 3.1] Profile already exists from trigger");
          console.log("Existing profile:", JSON.stringify(checkProfile, null, 2));
        } else {
          console.error("❌ [STEP 3.1] Profile does not exist and could not be created");
          return { success: false, error: "Failed to create profile" };
        }
      } else {
        console.log("✓ [STEP 3] Profile created successfully");
        console.log("Profile data:", JSON.stringify(profileInsertData, null, 2));
      }

      console.log("\n[STEP 4] Creating user stats (after profile exists)...");
      const statsData = {
        user_id: userId,
        total_xp: 0,
        current_level: 1,
        streak_count: 0,
        last_activity_date: new Date().toISOString().split('T')[0],
        concepts_mastered: 0,
        quizzes_completed: 0
      };
      console.log("Stats data to insert:", JSON.stringify(statsData, null, 2));
      
      const { data: statsInsertData, error: statsError } = await supabase
        .from("user_stats")
        .insert(statsData)
        .select()
        .single();

      if (statsError) {
        console.error("❌ [STEP 4] Stats error occurred:");
        console.error("Error code:", statsError.code);
        console.error("Error message:", statsError.message);
        console.error("Full error object:", JSON.stringify(statsError, null, 2));
        
        console.log("\n[STEP 4.1] Checking if stats exist from trigger...");
        const { data: checkStats, error: checkStatsError } = await supabase
          .from("user_stats")
          .select("*")
          .eq("user_id", userId)
          .single();
        
        if (checkStatsError) {
          console.error("❌ [STEP 4.1] Stats check error:", JSON.stringify(checkStatsError, null, 2));
        } else if (checkStats) {
          console.log("✓ [STEP 4.1] Stats already exist from trigger");
          console.log("Existing stats:", JSON.stringify(checkStats, null, 2));
        } else {
          console.error("⚠️ [STEP 4.1] Stats creation failed but not critical");
        }
      } else {
        console.log("✓ [STEP 4] User stats created successfully");
        console.log("Stats data:", JSON.stringify(statsInsertData, null, 2));
      }

      console.log("\n[STEP 5] Setting up local user state...");
      const tempUser: UserProfile = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        grade: "10",
        selectedSubjects: [],
        subjectDetails: [],
        hasCompletedOnboarding: false,
      };
      setUser(tempUser);
      console.log("✓ [STEP 5] Local user state set");

      console.log("\n[STEP 6] Navigating to grade selection...");
      router.push("/grade-selection");
      console.log("✓ [STEP 6] Navigation initiated");
      
      console.log("\n========== SIGNUP PROCESS COMPLETED SUCCESSFULLY ==========");
      return { success: true };
    } catch (error) {
      console.error("\n========== SIGNUP PROCESS FAILED ==========");
      console.error("Unexpected error caught:");
      console.error("Error type:", typeof error);
      console.error("Error instanceof Error:", error instanceof Error);
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      console.error("Full error object:", JSON.stringify(error, null, 2));
      console.error("String representation:", String(error));
      
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      return { success: false, error: errorMessage };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (error) {
        console.error("Login error:", error);
        let errorMessage = "Failed to login";
        
        if (error.message.includes("Invalid")) {
          errorMessage = "Invalid email or password";
        } else if (error.message.includes("not found")) {
          errorMessage = "Account not found";
        } else if (error.message.includes("network")) {
          errorMessage = "Network error - check your connection";
        }
        
        return { success: false, error: errorMessage };
      }

      if (!data.user) {
        return { success: false, error: "Failed to login" };
      }

      await loadUserProfile(data.user.id);

      const { data: subjects } = await supabase
        .from("subject_progress")
        .select("*")
        .eq("user_id", data.user.id);

      if (subjects && subjects.length > 0) {
        router.replace("/home");
      } else {
        router.push("/grade-selection");
      }

      return { success: true };
    } catch (error) {
      console.error("Login exception:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const updateGrade = async (grade: Grade) => {
    if (!user || !authUser) return;

    const updated = { ...user, grade };
    setUser(updated);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ grade })
        .eq("id", authUser.id);

      if (error) {
        console.error("Error updating grade:", error);
        setUser(user);
      }
    } catch (error) {
      console.error("Update grade exception:", error);
      setUser(user);
    }
  };

  const updateSelectedSubjects = async (subjects: SubjectType[]) => {
    if (!user) return;
    const updated = { ...user, selectedSubjects: subjects };
    setUser(updated);
  };

  const updateSubjectDetails = async (details: SubjectDetails) => {
    if (!user) return;
    const existingDetails = user.subjectDetails.filter(
      (d) => d.subjectId !== details.subjectId
    );
    const updated = {
      ...user,
      subjectDetails: [...existingDetails, details],
    };
    setUser(updated);
  };

  const completeOnboarding = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user || !authUser) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          grade: user.grade,
          updated_at: new Date().toISOString(),
        })
        .eq("id", authUser.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        return { success: false, error: "Failed to save profile" };
      }

      const subjectData = user.subjectDetails.map((detail) => {
        return {
          user_id: authUser.id,
          subject: detail.subjectId,
          current_chapter: detail.currentChapter,
          confidence_level: detail.confidence,
          stuck_points: detail.stuckPoints || null,
          status: "getting_to_know_you",
          mastery_percentage: 0,
        };
      });

      const { error: subjectsError } = await supabase
        .from("subject_progress")
        .upsert(subjectData, { onConflict: "user_id,subject" });

      if (subjectsError) {
        console.error("Subjects save error:", subjectsError);
        return { success: false, error: "Failed to save subjects" };
      }

      const { error: statsError } = await supabase
        .from("user_stats")
        .upsert({
          user_id: authUser.id,
          total_xp: 0,
          current_level: 1,
          streak_count: 0,
          concepts_mastered: 0,
          last_activity: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (statsError) {
        console.error("Stats initialization error:", statsError);
      }

      const updated = { ...user, hasCompletedOnboarding: true };
      setUser(updated);

      router.replace("/home");
      return { success: true };
    } catch (error) {
      console.error("Complete onboarding exception:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        Alert.alert("Error", "Failed to logout. Please try again.");
        return;
      }

      setUser(null);
      setAuthUser(null);
      setSession(null);
      setStats(null);
      router.replace("/welcome");
    } catch (error) {
      console.error("Logout exception:", error);
      Alert.alert("Error", "An unexpected error occurred");
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!user || !authUser) {
      return { success: false, error: "User not authenticated" };
    }

    const updated = { ...user, ...updates };
    setUser(updated);

    try {
      const dbUpdates: Partial<Profile> = {};
      if (updates.name) dbUpdates.full_name = updates.name;
      if (updates.grade) dbUpdates.grade = updates.grade;

      const { error } = await supabase
        .from("profiles")
        .update({ ...dbUpdates, updated_at: new Date().toISOString() })
        .eq("id", authUser.id);

      if (error) {
        console.error("Profile update error:", error);
        setUser(user);
        return { success: false, error: "Failed to update profile" };
      }

      return { success: true };
    } catch (error) {
      console.error("Update profile exception:", error);
      setUser(user);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const refreshData = async () => {
    if (authUser) {
      await loadUserProfile(authUser.id);
    }
  };

  return {
    user,
    isLoading,
    authUser,
    session,
    stats,
    signup,
    login,
    logout,
    updateGrade,
    updateSelectedSubjects,
    updateSubjectDetails,
    completeOnboarding,
    updateProfile,
    refreshData,
  };
});
