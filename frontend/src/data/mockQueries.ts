import type { QueryIntent, RecentQuery } from "../types/satquery";

// No preloaded queries — users discover analysis through free-form search
export const suggestedQueries: Array<{ text: string; intent: QueryIntent }> = [];

export const initialRecentQueries: RecentQuery[] = [];
