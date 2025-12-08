/**
 * AI LEARNING SYSTEM - Appen lär sig från AI-resultat för att förbättra offline-motorn
 * Varje AI-translation lagras så offline-motorn kan återanvända det nästa gång
 */

interface LearnedTranslation {
  input: string;
  output: string;
  timestamp: number;
  confidence: number; // 0-1, högt värde = säker
  model: string; // 'puter-gpt-5.1', 'puter-claude', etc
}

class AILearningSystem {
  private learningCache: Map<string, LearnedTranslation> = new Map();
  private STORAGE_KEY = 'sts_ai_learning_db';
  private MAX_LEARNINGS = 1000; // Begräns lagring

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Spara ett AI-resultat för framtida offline-användning
   */
  public recordLearning(input: string, output: string, model: string = 'puter-gpt-5.1', confidence: number = 0.95) {
    const key = this.normalizeKey(input);
    
    if (this.learningCache.size >= this.MAX_LEARNINGS) {
      // Ta bort äldsta om vi når gränsen
      const oldestKey = Array.from(this.learningCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.learningCache.delete(oldestKey);
    }

    this.learningCache.set(key, {
      input,
      output,
      model,
      confidence,
      timestamp: Date.now()
    });

    this.saveToStorage();
    console.log(`📚 AI Learning recorded: "${input.substring(0, 30)}..." → confidence: ${(confidence * 100).toFixed(0)}%`);
  }

  /**
   * Hämta tidigare AI-resultat för samma input
   */
  public getLearnedTranslation(input: string): LearnedTranslation | null {
    const key = this.normalizeKey(input);
    const learned = this.learningCache.get(key);
    
    if (learned) {
      console.log(`✅ AI Learning HIT: Found cached translation for "${input.substring(0, 30)}..."`);
      return learned;
    }

    return null;
  }

  /**
   * Kontrollera om vi har något liknande sparad tidigare (fuzzy matching)
   */
  public findSimilarLearning(input: string, similarityThreshold: number = 0.7): LearnedTranslation | null {
    const normalizedInput = this.normalizeKey(input);
    let bestMatch: LearnedTranslation | null = null;
    let bestScore = similarityThreshold;

    for (const [, learning] of this.learningCache) {
      const score = this.calculateSimilarity(normalizedInput, this.normalizeKey(learning.input));
      if (score > bestScore) {
        bestScore = score;
        bestMatch = learning;
      }
    }

    if (bestMatch) {
      console.log(`🔍 AI Learning FUZZY MATCH: Similarity ${(bestScore * 100).toFixed(0)}%`);
      return bestMatch;
    }

    return null;
  }

  /**
   * Få statistik om vad appen har lärt sig
   */
  public getStats() {
    return {
      totalLearnings: this.learningCache.size,
      models: Array.from(new Set(Array.from(this.learningCache.values()).map(l => l.model))),
      avgConfidence: Array.from(this.learningCache.values()).reduce((sum, l) => sum + l.confidence, 0) / this.learningCache.size || 0
    };
  }

  /**
   * Rensa allt (om användaren vill starta om)
   */
  public clear() {
    this.learningCache.clear();
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🗑️ AI Learning system cleared');
  }

  /**
   * Exportera all AI Learning data som JSON
   * Du kan ladda ner detta och mata in senare
   */
  public exportData(): string {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      learnings: Array.from(this.learningCache.entries()).map(([key, value]) => ({
        key,
        ...value
      }))
    };
    console.log(`📥 Exported ${data.learnings.length} AI learnings`);
    return JSON.stringify(data, null, 2);
  }

  /**
   * Importera AI Learning data från JSON
   * Använd detta för att mata in tidigare sparad data
   */
  public importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (!data.learnings || !Array.isArray(data.learnings)) {
        throw new Error('Invalid data format');
      }

      let imported = 0;
      for (const item of data.learnings) {
        const { key, input, output, model, confidence, timestamp } = item;
        if (key && input && output) {
          this.learningCache.set(key, { input, output, model, confidence, timestamp });
          imported++;
        }
      }

      this.saveToStorage();
      console.log(`📤 Imported ${imported} AI learnings successfully`);
      return true;
    } catch (e) {
      console.error('❌ Failed to import AI learning data:', e);
      return false;
    }
  }

  /**
   * Ladda ner data som fil
   */
  public downloadAsFile(filename: string = 'ai-learning-backup.json') {
    const jsonData = this.exportData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log(`💾 Downloaded: ${filename}`);
  }

  // --- PRIVATA HJÄLPFUNKTIONER ---

  private normalizeKey(text: string): string {
    return text.toLowerCase().trim().replace(/[.,!?;:]/g, '');
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Enkel Levenshtein-liknande likhet (0-1)
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(s1: string, s2: string): number {
    const costs: number[] = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }

  private saveToStorage() {
    try {
      const data = Array.from(this.learningCache.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      
      // Trigga cloud-synk (debounced)
      this.triggerCloudSync();
    } catch (e) {
      console.warn('Could not save AI learning to localStorage:', e);
    }
  }

  private async triggerCloudSync() {
    try {
      const { puterCloudSync } = await import('../cloud/puterCloudSync');
      puterCloudSync.scheduleSyncToCloud();
    } catch (e) {
      // Cloud sync not available, ignore
    }
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const entries = JSON.parse(data);
        this.learningCache = new Map(entries);
        console.log(`📚 Loaded ${this.learningCache.size} AI learnings from storage`);
      }
    } catch (e) {
      console.warn('Could not load AI learning from localStorage:', e);
    }
  }
}

// Singleton instance
export const aiLearningSystem = new AILearningSystem();
