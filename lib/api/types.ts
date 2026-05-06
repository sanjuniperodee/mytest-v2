// Shared API types for mytest

export interface User {
  id: string
  phone?: string | null
  username?: string | null
  fullName?: string | null
  avatarUrl?: string | null
  preferredLanguage?: "ru" | "kk" | string | null
  timezone?: string | null
  isAdmin?: boolean | null
  isPremium?: boolean | null
  createdAt?: string | null
  [key: string]: unknown
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface ExamType {
  id: string
  code?: string
  name: string
  description?: string | null
  isActive?: boolean
  iconUrl?: string | null
}

export interface Subject {
  id: string
  examTypeId: string
  code?: string
  name: string
  isProfile?: boolean
  isMandatory?: boolean
}

export interface TestTemplate {
  id: string
  examTypeId: string
  name: string
  description?: string | null
  durationMins?: number
  totalQuestions?: number
  isActive?: boolean
  isPremium?: boolean
}

export interface AnswerOption {
  id: string
  text?: string
  imageUrl?: string | null
}

export interface Question {
  id: string
  text?: string
  imageUrl?: string | null
  subjectId?: string
  subjectName?: string
  options: AnswerOption[]
  selectedIds?: string[]
  multiSelect?: boolean
}

export interface SessionSection {
  id: string
  title?: string
  subjectName?: string
  questions: Question[]
}

export interface TestSession {
  id: string
  status: "in_progress" | "completed" | "timed_out" | "abandoned"
  startedAt?: string
  finishedAt?: string | null
  durationMins?: number
  serverTimeRemaining?: number | null
  templateId?: string
  templateName?: string
  examTypeId?: string
  examTypeName?: string
  language?: "ru" | "kk"
  sections?: SessionSection[]
  questions?: Question[]
  totalScore?: number | null
  maxScore?: number | null
}

export interface SessionListItem {
  id: string
  status: TestSession["status"]
  startedAt?: string
  finishedAt?: string | null
  templateName?: string
  examTypeName?: string
  totalScore?: number | null
  maxScore?: number | null
}

export interface ReviewQuestion {
  id: string
  text?: string
  imageUrl?: string | null
  subjectName?: string
  options: (AnswerOption & { isCorrect?: boolean; isSelected?: boolean })[]
  isCorrect?: boolean
  hasExplanation?: boolean
}

export interface ReviewSection {
  id: string
  title?: string
  subjectName?: string
  questions: ReviewQuestion[]
  correctCount?: number
  totalCount?: number
  score?: number
}

export interface ReviewResponse {
  sessionId: string
  totalScore?: number
  maxScore?: number
  correctCount?: number
  totalQuestions?: number
  sections?: ReviewSection[]
}

export interface BillingPlan {
  id: string
  code: string
  name: string
  description?: string | null
  priceCents?: number
  price?: number
  currency?: string
  durationDays?: number
  isPremium?: boolean
  features?: string[]
  oldPrice?: number | null
  badge?: string | null
}

export interface UserStats {
  totalTests?: number
  completedTests?: number
  averageScore?: number
  bestScore?: number
  totalQuestions?: number
  correctAnswers?: number
  totalTimeSpentMins?: number
  weeklyStreak?: number
  rank?: number
}

export interface MistakesSummary {
  totalMistakes?: number
  bySubject?: { subjectId: string; subjectName: string; count: number }[]
  byExamType?: { examTypeId: string; examTypeName: string; count: number }[]
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  fullName?: string | null
  username?: string | null
  avatarUrl?: string | null
  bestScore: number
  totalTests?: number
}

// Admission
export interface AdmissionCycle {
  id: string
  slug: string
  sortOrder: number
}

export interface University {
  code: number
  name: string
  shortName: string
}

export interface AdmissionProgram {
  id: string
  code: string
  profileVariant?: number
  name: string
  profileSubjects?: string
  profileShortLabel?: string
}

export interface CompareResult {
  total: number
  passesEntThresholds: boolean
  cutoff: number | null
  hasCutoff: boolean
  gapToCutoff: number | null
}

export interface ChanceProgram {
  cycleSlug: string
  programId: string
  programCode: string
  programName: string
  profileSubjects: string
  profileVariant?: number
  displayedQuotaType: "GRANT" | "RURAL"
  displayedMinScore: number | null
  universityCount: number
  isPass: boolean
  total: number
  gapToCutoff: number | null
}

export interface ChanceUniversity {
  cycleSlug: string
  universityCode: number
  universityName: string
  universityShortName: string
  programId: string
  programCode: string
  programName: string
  profileSubjects: string
  profileVariant?: number
  displayedQuotaType: "GRANT" | "RURAL"
  displayedMinScore: number | null
  isPass: boolean
  total: number
  gapToCutoff: number | null
}
