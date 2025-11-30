export type Grade = "9" | "10" | "11" | "12";

export type SubjectType =
  | "mathematics"
  | "physics"
  | "chemistry"
  | "biology"
  | "english"
  | "hindi"
  | "socialScience"
  | "computerScience";

export interface Subject {
  id: SubjectType;
  name: string;
  icon: string;
  color: string;
}

export interface SubjectDetails {
  subjectId: SubjectType;
  currentChapter: string;
  confidence: number;
  stuckPoints: string;
}

export interface UserProfile {
  name: string;
  email: string;
  grade: Grade;
  selectedSubjects: SubjectType[];
  subjectDetails: SubjectDetails[];
  hasCompletedOnboarding: boolean;
}

export interface OnboardingProgress {
  currentStep: number;
  completedSteps: string[];
}

export const SUBJECTS: Subject[] = [
  { id: "mathematics", name: "Mathematics", icon: "🔢", color: "#3B82F6" },
  { id: "physics", name: "Physics", icon: "⚛️", color: "#8B5CF6" },
  { id: "chemistry", name: "Chemistry", icon: "🧪", color: "#10B981" },
  { id: "biology", name: "Biology", icon: "🧬", color: "#EF4444" },
  { id: "english", name: "English", icon: "📝", color: "#F97316" },
  { id: "hindi", name: "Hindi", icon: "🇮🇳", color: "#F59E0B" },
  { id: "socialScience", name: "Social Science", icon: "🌍", color: "#14B8A6" },
  { id: "computerScience", name: "Computer Science", icon: "💻", color: "#6B7280" },
];

export const CHAPTERS = Array.from({ length: 15 }, (_, i) => ({
  id: `chapter-${i + 1}`,
  name: `Chapter ${i + 1}`,
}));

export const CONFIDENCE_LABELS = [
  { range: [1, 2], emoji: "😰", label: "Need lots of help" },
  { range: [3, 4], emoji: "😟", label: "Struggling" },
  { range: [5, 6], emoji: "😐", label: "It's okay" },
  { range: [7, 8], emoji: "🙂", label: "Pretty good" },
  { range: [9, 10], emoji: "😄", label: "I've got this!" },
];

export function getConfidenceLabel(confidence: number): { emoji: string; label: string } {
  const found = CONFIDENCE_LABELS.find(
    (item) => confidence >= item.range[0] && confidence <= item.range[1]
  );
  return found ? { emoji: found.emoji, label: found.label } : { emoji: "😐", label: "It's okay" };
}
