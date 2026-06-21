import type { SummaryConfig } from '../config/schema.js';
export interface TranscriptSummary {
    transcriptPath?: string;
    lastUserMessage?: string;
    lastAssistantSummary?: string;
}
export declare function inferTranscriptPath(sessionId: string | undefined, cwd: string | undefined): string | undefined;
export declare function extractTranscriptSummary(options: {
    hookPayload: Record<string, unknown>;
    sessionId?: string;
    cwd?: string;
    config: SummaryConfig;
}): TranscriptSummary;
