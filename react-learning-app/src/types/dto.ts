// Frontend DTO type definitions mirroring backend response contracts
// These interfaces provide consistent shapes for API data across the app.
// Optional fields are marked based on backend "nullable" usage and defensive client parsing.

// Leaderboard row returned by /stats endpoints
export interface LeaderboardRowResponse {
    userId: number | null; // user or lesson identifier
    name?: string | null;
    avatar?: string | null;
    bestScore?: number | null; // highest score for lesson leaderboard
    avgScore?: number | null; // average score for period
    attempts?: number | null; // number of attempts in lesson context
    completionCount?: number | null; // number of completions (daily/weekly)
    improvementRate?: number | null; // improvement metric vs previous period
    timestamp?: string | null; // ISO timestamp
}

// Aggregated stats row (daily or weekly period)
export interface PeriodStatRowResponse {
    periodStart: string; // ISO date (day start or week start)
    avgScore?: number | null;
    count?: number | null;
    durationSeconds?: number | null;
}

// Lesson summary + content collections
export interface LessonDetailResponse {
    id: number;
    title: string;
    order?: number | null;
    conversations: ConversationResponse[];
    vocabularies: VocabularyResponse[];
}

export interface LessonResponse {
    id: number;
    title: string;
    order?: number | null;
}

export interface ConversationResponse {
    id: number;
    order?: number | null;
    section?: string | null;
    vnTranslation?: string | null;
    audioPublicId?: string | null;
    audioUrl?: string | null;
    lines: ConversationLineResponse[];
}

export interface ConversationLineResponse {
    id: number;
    externalId?: number | null;
    order?: number | null;
    speaker?: string | null;
    zh?: string | null; // Chinese text
    pinyin?: string | null;
    vn?: string | null; // Vietnamese translation
    audioPublicId?: string | null;
    audioUrl?: string | null;
}

export interface VocabularyResponse {
    id: number;
    externalId?: number | null;
    contentHash?: string | null;
    word?: string | null;
    pinyin?: string | null;
    type?: string | null;
    meaning?: string | null;
    lesson?: LessonResponse | null;
    order?: number | null;
    audioPublicId?: string | null;
    audioUrl?: string | null;
    example?: LineResponse | null;
}

export interface LineResponse {
    id: number;
    externalId?: number | null;
    contentHash?: string | null;
    zhText?: string | null;
    pinyin?: string | null;
    vnTranslation?: string | null;
    audioPublicId?: string | null;
    audioUrl?: string | null;
}

// Phoneme details inside word scoring
export interface PhonemeScoreDetail {
    phoneme?: string | null;
    phoneme_display?: string | string[] | null;
    score?: number | null;
    pronunciation?: number | null; // legacy variant
    mono_tone?: string | number | null; // may embed numeric tone marker
}

// Per word details in ISE scoring responses
export interface WordScoreDetail {
    word?: string | null;
    text?: string | null; // fallback alias
    overall?: number | null;
    total_score?: number | null; // legacy
    totalScore?: number | null; // alt camelCase
    initial_score?: number | null;
    final_score?: number | null;
    tone_score?: number | null;
    duration?: number | null;
    time_len?: number | null; // legacy duration
    fluency?: number | null;
    phonemes?: PhonemeScoreDetail[] | null;
    phones?: PhonemeScoreDetail[] | null; // legacy alias
    phoneme_list?: PhonemeScoreDetail[] | null; // alt alias
    details?: Record<string, unknown> | null; // nested detail variants
}

// Normalized object returned by adaptIseScore()
export interface IseScoreNormalized {
    totalScore: number | null;
    fluency: number | null;
    completeness: number | null;
    wrongWords: (string | null)[];
    sid: string | number | null;
    status: string | null;
    rawXml: string | null;
    words: WordScoreDetail[];
    isRejected: boolean;
    exceptInfo: string | null;
    warning: string | null;
    legacy: {
        total_score: number | null;
        fluency: number | null;
        completeness: number | null;
        wrong_words: (string | null)[];
        raw_xml: string | null;
        is_rejected: boolean;
        except_info: string | null;
    };
    original: unknown; // original raw payload for debugging
}

// Attempt metadata for profile/history views
export interface PronunciationAttempt {
    id?: number | null;
    userId?: number | null;
    lessonId?: number | null;
    vocabularyId?: number | null;
    source?: string | null; // 'sentence' | 'vocab-practice' etc.
    totalScore?: number | null;
    fluency?: number | null;
    completeness?: number | null;
    createdAt?: string | null; // ISO timestamp
}

export type Nullable<T> = { [K in keyof T]: T[K] | null };

// Utility mapped type for partial updates
export type PartialUpdate<T> = { [K in keyof T]?: T[K] };

// Re-export for convenience
export type { LeaderboardRowResponse as LeaderboardRow, PeriodStatRowResponse as PeriodStatRow };
