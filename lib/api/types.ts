// Shared API types for mytest

import type { LocalizedText } from "./i18n"

export interface User {
  id: string
  phone?: string | null
  username?: string | null
  fullName?: LocalizedText
  firstName?: LocalizedText
  lastName?: LocalizedText
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
  name: LocalizedText
  description?: LocalizedText
  isActive?: boolean
  iconUrl?: string | null
}

export interface Subject {
  id: string
  examTypeId: string
  code?: string
  name: LocalizedText
  isProfile?: boolean
  isMandatory?: boolean
}

export interface TestTemplate {
  id: string
  examTypeId: string
  name: LocalizedText
  description?: LocalizedText
  durationMins?: number
  totalQuestions?: number
  isActive?: boolean
  isPremium?: boolean
}

export interface AnswerOption {
  id: string
  text?: LocalizedText
  imageUrl?: string | null
}

export interface Question {
  id: string
  text?: LocalizedText
  imageUrl?: string | null
  subjectId?: string
  subjectName?: LocalizedText
  options: AnswerOption[]
  selectedIds?: string[]
  multiSelect?: boolean
}

export interface SessionSection {
  id: string
  title?: LocalizedText
  subjectName?: LocalizedText
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
  templateName?: LocalizedText
  examTypeId?: string
  examTypeName?: LocalizedText
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
  templateName?: LocalizedText
  examTypeName?: LocalizedText
  totalScore?: number | null
  maxScore?: number | null
}

export interface ReviewQuestion {
  id: string
  text?: LocalizedText
  imageUrl?: string | null
  subjectName?: LocalizedText
  options: (AnswerOption & { isCorrect?: boolean; isSelected?: boolean })[]
  isCorrect?: boolean
  hasExplanation?: boolean
}

export interface ReviewSection {
  id: string
  title?: LocalizedText
  subjectName?: LocalizedText
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
  code?: string
  name: LocalizedText
  description?: LocalizedText
  // Backend uses priceKzt / originalPriceKzt; older clients may expect priceCents/price
  priceKzt?: number | null
  originalPriceKzt?: number | null
  priceCents?: number | null
  price?: number | null
  currency?: string
  durationDays?: number
  isPremium?: boolean
  features?: LocalizedText[]
  oldPrice?: number | null
  // Backend "highlight" doubles as a "badge" string e.g. "популярно"
  highlight?: string | null
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
  bySubject?: { subjectId: string; subjectName: LocalizedText; count: number }[]
  byExamType?: { examTypeId: string; examTypeName: LocalizedText; count: number }[]
}

export interface LeaderboardEntry {
  rank?: number | null
  position?: number | null
  userId?: string | null
  user?: {
    id?: string
    fullName?: LocalizedText
    firstName?: LocalizedText
    lastName?: LocalizedText
    name?: LocalizedText
    displayName?: LocalizedText
    username?: string | null
    phone?: string | null
    avatarUrl?: string | null
  } | null
  fullName?: LocalizedText
  firstName?: LocalizedText
  lastName?: LocalizedText
  name?: LocalizedText
  displayName?: LocalizedText
  username?: string | null
  phone?: string | null
  avatarUrl?: string | null
  // Multiple possible fields for the score
  bestScore?: number | null
  score?: number | null
  totalScore?: number | null
  total?: number | null
  points?: number | null
  value?: number | null
  // Multiple possible fields for total tests
  totalTests?: number | null
  testsCount?: number | null
  attempts?: number | null
  attemptsCount?: number | null
  [key: string]: unknown
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
