/**
 * PUTER CLOUD SYNC - Synkar användardata till Puter.js Cloud (100% GRATIS)
 * 
 * Synkar:
 * - GLOSA-korrigeringar (AI Learning)
 * - Tumme upp/ner feedback
 * - "Ändra tecken" val
 * - Meningsfeedback
 */

import { 
    feedbackMap, 
    positiveFeedbackMap, 
    negativeFeedbackMap, 
    sentenceFeedbackMap,
    learnedPreferences,
    questionClarifications 
} from '../../state';
import { aiLearningSystem } from '../sts-glossing/aiLearningSystem';

const CLOUD_KEYS = {
    AI_LEARNING: 'sts_ai_learning',
    FEEDBACK: 'sts_feedback',
    POSITIVE_FEEDBACK: 'sts_positive_feedback',
    NEGATIVE_FEEDBACK: 'sts_negative_feedback',
    SENTENCE_FEEDBACK: 'sts_sentence_feedback',
    LEARNED_PREFERENCES: 'sts_learned_preferences',
    QUESTION_CLARIFICATIONS: 'sts_question_clarifications',
    LAST_SYNC: 'sts_last_sync'
};

function mapToObject(map: Map<any, any>): Record<string, any> {
    const obj: Record<string, any> = {};
    for (const [key, value] of map) {
        if (value instanceof Map) {
            obj[key] = mapToObject(value);
        } else {
            obj[key] = value;
        }
    }
    return obj;
}

function objectToNestedMap(obj: Record<string, any>): Map<string, Map<string, any>> {
    const outerMap = new Map<string, Map<string, any>>();
    for (const [outerKey, innerObj] of Object.entries(obj)) {
        if (typeof innerObj === 'object' && innerObj !== null && !Array.isArray(innerObj)) {
            const innerMap = new Map<string, any>();
            for (const [innerKey, value] of Object.entries(innerObj)) {
                innerMap.set(innerKey, value);
            }
            outerMap.set(outerKey, innerMap);
        }
    }
    return outerMap;
}

function ensureString(data: any): string {
    if (typeof data === 'string') {
        return data;
    }
    return JSON.stringify(data);
}

function safeJsonParse(data: any): any {
    if (typeof data === 'string') {
        try {
            return JSON.parse(data);
        } catch {
            return null;
        }
    }
    return data;
}

class PuterCloudSync {
    private syncInProgress = false;
    private syncDebounceTimer: number | null = null;
    private DEBOUNCE_MS = 2000;

    private getPuter(): any {
        return (window as any).puter;
    }

    public async isAuthenticated(): Promise<boolean> {
        const puter = this.getPuter();
        if (!puter?.auth) return false;
        
        try {
            return puter.auth.isSignedIn();
        } catch {
            return false;
        }
    }

    public async ensureAuthenticated(): Promise<boolean> {
        const puter = this.getPuter();
        if (!puter?.auth) {
            console.warn('⚠️ Puter.js not available for cloud sync');
            return false;
        }

        try {
            if (!puter.auth.isSignedIn()) {
                console.log('🔐 Signing in to Puter for cloud sync...');
                await puter.auth.signIn();
            }
            return true;
        } catch (error) {
            console.warn('Cloud auth failed:', error);
            return false;
        }
    }

    public async syncToCloud(): Promise<boolean> {
        if (this.syncInProgress) {
            console.log('⏳ Sync already in progress, skipping...');
            return false;
        }

        const puter = this.getPuter();
        if (!puter?.kv) {
            console.warn('⚠️ Puter KV not available');
            return false;
        }

        this.syncInProgress = true;
        console.log('☁️ Starting cloud sync...');

        try {
            const aiLearningData = aiLearningSystem.exportData();
            await puter.kv.set(CLOUD_KEYS.AI_LEARNING, aiLearningData);
            console.log('✅ AI Learning synced to cloud');

            if (feedbackMap.size > 0) {
                await puter.kv.set(CLOUD_KEYS.FEEDBACK, JSON.stringify(mapToObject(feedbackMap)));
                console.log(`✅ Feedback synced: ${feedbackMap.size} entries`);
            }

            if (positiveFeedbackMap.size > 0) {
                await puter.kv.set(CLOUD_KEYS.POSITIVE_FEEDBACK, JSON.stringify(mapToObject(positiveFeedbackMap)));
                console.log(`✅ Positive feedback synced: ${positiveFeedbackMap.size} entries`);
            }

            if (negativeFeedbackMap.size > 0) {
                await puter.kv.set(CLOUD_KEYS.NEGATIVE_FEEDBACK, JSON.stringify(mapToObject(negativeFeedbackMap)));
                console.log(`✅ Negative feedback synced: ${negativeFeedbackMap.size} entries`);
            }

            if (sentenceFeedbackMap.size > 0) {
                await puter.kv.set(CLOUD_KEYS.SENTENCE_FEEDBACK, JSON.stringify(mapToObject(sentenceFeedbackMap)));
                console.log(`✅ Sentence feedback synced: ${sentenceFeedbackMap.size} entries`);
            }

            if (learnedPreferences.size > 0) {
                await puter.kv.set(CLOUD_KEYS.LEARNED_PREFERENCES, JSON.stringify(mapToObject(learnedPreferences)));
                console.log(`✅ Learned preferences synced: ${learnedPreferences.size} entries`);
            }

            if (questionClarifications.size > 0) {
                await puter.kv.set(CLOUD_KEYS.QUESTION_CLARIFICATIONS, JSON.stringify(mapToObject(questionClarifications)));
                console.log(`✅ Question clarifications synced: ${questionClarifications.size} entries`);
            }

            await puter.kv.set(CLOUD_KEYS.LAST_SYNC, new Date().toISOString());

            console.log('☁️ Cloud sync complete!');
            return true;
        } catch (error) {
            console.error('❌ Cloud sync failed:', error);
            return false;
        } finally {
            this.syncInProgress = false;
        }
    }

    public async loadFromCloud(): Promise<boolean> {
        const puter = this.getPuter();
        if (!puter?.kv) {
            console.warn('⚠️ Puter KV not available');
            return false;
        }

        console.log('☁️ Loading data from cloud...');

        try {
            const aiLearningData = await puter.kv.get(CLOUD_KEYS.AI_LEARNING);
            if (aiLearningData) {
                const dataString = ensureString(aiLearningData);
                aiLearningSystem.importData(dataString);
                console.log('✅ AI Learning loaded from cloud');
            }

            const feedbackData = await puter.kv.get(CLOUD_KEYS.FEEDBACK);
            if (feedbackData) {
                const parsed = safeJsonParse(feedbackData);
                if (parsed) {
                    feedbackMap.clear();
                    for (const [key, value] of Object.entries(parsed)) {
                        feedbackMap.set(key, value as any);
                    }
                    console.log(`✅ Feedback loaded: ${feedbackMap.size} entries`);
                }
            }

            const positiveData = await puter.kv.get(CLOUD_KEYS.POSITIVE_FEEDBACK);
            if (positiveData) {
                const parsed = safeJsonParse(positiveData);
                if (parsed) {
                    const nestedMap = objectToNestedMap(parsed);
                    positiveFeedbackMap.clear();
                    for (const [key, innerMap] of nestedMap) {
                        positiveFeedbackMap.set(key, innerMap);
                    }
                    console.log(`✅ Positive feedback loaded: ${positiveFeedbackMap.size} entries`);
                }
            }

            const negativeData = await puter.kv.get(CLOUD_KEYS.NEGATIVE_FEEDBACK);
            if (negativeData) {
                const parsed = safeJsonParse(negativeData);
                if (parsed) {
                    const nestedMap = objectToNestedMap(parsed);
                    negativeFeedbackMap.clear();
                    for (const [key, innerMap] of nestedMap) {
                        negativeFeedbackMap.set(key, innerMap);
                    }
                    console.log(`✅ Negative feedback loaded: ${negativeFeedbackMap.size} entries`);
                }
            }

            const sentenceData = await puter.kv.get(CLOUD_KEYS.SENTENCE_FEEDBACK);
            if (sentenceData) {
                const parsed = safeJsonParse(sentenceData);
                if (parsed) {
                    sentenceFeedbackMap.clear();
                    for (const [key, value] of Object.entries(parsed)) {
                        sentenceFeedbackMap.set(key, value as string);
                    }
                    console.log(`✅ Sentence feedback loaded: ${sentenceFeedbackMap.size} entries`);
                }
            }

            const prefData = await puter.kv.get(CLOUD_KEYS.LEARNED_PREFERENCES);
            if (prefData) {
                const parsed = safeJsonParse(prefData);
                if (parsed) {
                    const nestedMap = objectToNestedMap(parsed);
                    learnedPreferences.clear();
                    for (const [key, innerMap] of nestedMap) {
                        learnedPreferences.set(key, innerMap);
                    }
                    console.log(`✅ Learned preferences loaded: ${learnedPreferences.size} entries`);
                }
            }

            const clarData = await puter.kv.get(CLOUD_KEYS.QUESTION_CLARIFICATIONS);
            if (clarData) {
                const parsed = safeJsonParse(clarData);
                if (parsed) {
                    questionClarifications.clear();
                    for (const [key, value] of Object.entries(parsed)) {
                        questionClarifications.set(key, value as string);
                    }
                    console.log(`✅ Question clarifications loaded: ${questionClarifications.size} entries`);
                }
            }

            const lastSync = await puter.kv.get(CLOUD_KEYS.LAST_SYNC);
            if (lastSync) {
                console.log(`📅 Last cloud sync: ${lastSync}`);
            }

            console.log('☁️ Cloud load complete!');
            return true;
        } catch (error) {
            console.error('❌ Cloud load failed:', error);
            return false;
        }
    }

    public scheduleSyncToCloud(): void {
        if (this.syncDebounceTimer) {
            clearTimeout(this.syncDebounceTimer);
        }

        this.syncDebounceTimer = window.setTimeout(async () => {
            const puter = this.getPuter();
            if (!puter?.kv) return;
            
            const isAuth = await this.isAuthenticated();
            if (isAuth) {
                await this.syncToCloud();
            } else {
                console.log('☁️ Not signed in to Puter, skipping cloud sync');
            }
        }, this.DEBOUNCE_MS);
    }

    public async getLastSyncTime(): Promise<string | null> {
        const puter = this.getPuter();
        if (!puter?.kv) return null;

        try {
            return await puter.kv.get(CLOUD_KEYS.LAST_SYNC);
        } catch {
            return null;
        }
    }

    public async clearCloudData(): Promise<boolean> {
        const puter = this.getPuter();
        if (!puter?.kv) return false;

        try {
            for (const key of Object.values(CLOUD_KEYS)) {
                await puter.kv.del(key);
            }
            console.log('🗑️ Cloud data cleared');
            return true;
        } catch (error) {
            console.error('Failed to clear cloud data:', error);
            return false;
        }
    }
}

export const puterCloudSync = new PuterCloudSync();
