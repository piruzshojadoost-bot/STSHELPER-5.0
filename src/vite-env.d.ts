/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HUGGINGFACE_TOKEN?: string;
  readonly VITE_GOOGLE_AI_STUDIO_KEY?: string;
  readonly VITE_MISTRAL_API_KEY?: string;
  readonly VITE_DEEPAI_KEY?: string;
  readonly VITE_OLLAMA_KEY?: string;
  readonly VITE_LAOZHANG_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
