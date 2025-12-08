// Tracks API usage quota for all 5 AI models
type ApiModel = 'anthropic' | 'openai' | 'groq' | 'mistral' | 'google';

interface QuotaConfig {
    [key in ApiModel]: number;
}

const DAILY_QUOTAS: QuotaConfig = {
    anthropic: 1000,    // Claude - high daily limit
    openai: 1000,       // GPT - high daily limit
    groq: 2000,         // Groq - very high (fast)
    mistral: 1000,      // Mistral - high limit
    google: 1500        // Google GenAI - high limit
};

export class QuotaTracker {
    private today = new Date().toISOString().slice(0, 10);
    
    static getInstance() {
        return new QuotaTracker();
    }

    private getKey(model: ApiModel): string {
        return `api_quota_${model}_${this.today}`;
    }

    incrementUsage(model: ApiModel) {
        const key = this.getKey(model);
        const current = +(localStorage.getItem(key) || '0');
        localStorage.setItem(key, (current + 1).toString());
        this.updateUI();
    }

    getUsagePercentage(model: ApiModel): number {
        const key = this.getKey(model);
        const used = +(localStorage.getItem(key) || '0');
        const quota = DAILY_QUOTAS[model];
        // Returnerar AVAILABLE procent (remaining/quota)
        const available = Math.max(0, quota - used);
        return Math.round(100 * available / quota);
    }

    getAveragePercentage(): number {
        const models: ApiModel[] = ['anthropic', 'openai', 'groq', 'mistral', 'google'];
        const total = models.reduce((sum, model) => sum + this.getUsagePercentage(model), 0);
        return Math.round(total / models.length);
    }

    updateUI() {
        const el = document.getElementById('hf-api-quota');
        if (!el) return;

        const avgPct = this.getAveragePercentage();
        el.textContent = avgPct + '%';
        
        // Color coding: Red < 25%, Yellow 25-50%, Green > 50%
        if (avgPct > 50) {
            el.style.background = '#d1fae5';
            el.style.color = '#065f46';
        } else if (avgPct > 25) {
            el.style.background = '#fef9c3';
            el.style.color = '#92400e';
        } else {
            el.style.background = '#fee2e2';
            el.style.color = '#b91c1c';
        }
    }

    getDetailedStats(): { [key in ApiModel]: number } {
        return {
            anthropic: this.getUsagePercentage('anthropic'),
            openai: this.getUsagePercentage('openai'),
            groq: this.getUsagePercentage('groq'),
            mistral: this.getUsagePercentage('mistral'),
            google: this.getUsagePercentage('google')
        };
    }

    getTooltipText(): string {
        const stats = this.getDetailedStats();
        return `Claude: ${stats.anthropic}% | OpenAI: ${stats.openai}% | Groq: ${stats.groq}% | Mistral: ${stats.mistral}% | Google: ${stats.google}%`;
    }
}

export const quotaTracker = QuotaTracker.getInstance();
