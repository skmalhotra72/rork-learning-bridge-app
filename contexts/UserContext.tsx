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
      console.log("Starting signup process...");
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (error) {
        console.error("Auth signup error:", error);
        let errorMessage = "Failed to create account";
        
        if (error.message.includes("already registered")) {
          errorMessage = "This email is already registered";
        } else if (error.message.includes("Password")) {
          errorMessage = "Password must be at least 6 characters";
        } else if (error.message.includes("email")) {
          errorMessage = "Invalid email format";
        } else if (error.message.includes("network")) {
          errorMessage = "Network error - check your connection";
        } else {
          errorMessage = error.message || "Failed to create account";
        }
        
        return { success: false, error: errorMessage };
      }

      if (!data?.user) {
        console.error("No user returned from signup");
        return { success: false, error: "Failed to create account. Please try again." };
      }

      const userId = data.user.id;
      console.log("Auth user created successfully. User ID:", userId);

      await new Promise(resolve => setTimeout(resolve, 500));
      console.log("Creating profile manually...");

      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          full_name: name.trim(),
          email: email.trim().toLowerCase(),
          grade: "9",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        console.error("Profile error code:", profileError.code);
        console.error("Profile error details:", profileError.details);
        console.error("Profile error hint:", profileError.hint);
        
        if (profileError.code === "23505") {
          console.log("Profile already exists (duplicate key), trying to update instead...");
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              full_name: name.trim(),
              grade: "9",
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);
          
          if (updateError) {
            console.error("Profile update error:", updateError);
          } else {
            console.log("Profile updated successfully");
          }
        } else {
          console.warn("Profile creation failed but continuing...");
        }
      } else {
        console.log("Profile created successfully");
      }

      console.log("Creating user stats manually...");
      const { error: statsError } = await supabase
        .from("user_stats")
        .insert({
          user_id: userId,
          total_xp: 0,
          current_level: 1,
          streak_count: 0,
          last_activity: new Date().toISOString(),
          concepts_mastered: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (statsError) {
        console.error("Stats creation error:", statsError);
        console.error("Stats error code:", statsError.code);
        
        if (statsError.code === "23505") {
          console.log("Stats already exist (duplicate key), trying to update instead...");
          const { error: updateStatsError } = await supabase
            .from("user_stats")
            .update({
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
          
          if (updateStatsError) {
            console.error("Stats update error:", updateStatsError);
          } else {
            console.log("Stats updated successfully");
          }
        } else {
          console.warn("Stats creation failed but continuing...");
        }
      } else {
        console.log("User stats created successfully");
      }

      console.log("Signup completed successfully!");
      
      const tempUser: UserProfile = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        grade: "9",
        selectedSubjects: [],
        subjectDetails: [],
        hasCompletedOnboarding: false,
      };
      setUser(tempUser);

      console.log("Navigating to grade selection...");
      router.push("/grade-selection");
      return { success: true };
    } catch (error) {
      console.error("Signup exception:", error);
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
