export interface KyroModel {
  id: string;
  name: string;
  group: string;
  provider?: 'openai' | 'gemini' | 'image';
}

export const KYRO_MODELS: KyroModel[] = [
  // Image
  { id: 'kyro-img-2.3', name: 'Kyro Img-2.3', group: 'Image', provider: 'image' },

  // KYRO GEMMA (Powered by Gemini)
  { id: 'gemini-3.1-pro-preview', name: 'KYRO-GEMMA 3.1 Pro', group: 'KYRO GEMMA', provider: 'gemini' },
  { id: 'gemini-flash-latest', name: 'KYRO-GEMMA 3 Flash', group: 'KYRO GEMMA', provider: 'gemini' },
  { id: 'gemini-2.5-flash', name: 'KYRO-GEMMA 2.5 Flash', group: 'KYRO GEMMA', provider: 'gemini' },
  { id: 'gemini-2.5-pro', name: 'KYRO-GEMMA 2.5 Pro', group: 'KYRO GEMMA', provider: 'gemini' },

  // Elite
  { id: 'gpt-5', name: 'KYRO-5', group: 'Elite', provider: 'openai' },
  { id: 'gpt-5-mini', name: 'KYRO-5 Mini', group: 'Elite', provider: 'openai' },
  { id: 'gpt-5-nano', name: 'KYRO-5 Nano', group: 'Elite', provider: 'openai' },

  // Pro
  { id: 'gpt-4.1', name: 'KYRO-4.1', group: 'Pro', provider: 'openai' },
  { id: 'gpt-4.1-mini', name: 'KYRO-4.1 Mini', group: 'Pro', provider: 'openai' },
  { id: 'gpt-4.1-nano', name: 'KYRO-4.1 Nano', group: 'Pro', provider: 'openai' },

  // Standard
  { id: 'gpt-4o', name: 'KYRO-4o', group: 'Standard', provider: 'openai' },
  { id: 'gpt-4o-mini', name: 'KYRO-4o Mini', group: 'Standard', provider: 'openai' },
  { id: 'gpt-3.5-turbo', name: 'KYRO-3.5 Turbo', group: 'Standard', provider: 'openai' },

  // Reasoning
  { id: 'deepseek-r1', name: 'KYRO-DEV-R1', group: 'Reasoning', provider: 'openai' },
  { id: 'deepseek-v3', name: 'KYRO-DEV-V3', group: 'Reasoning', provider: 'openai' },
  { id: 'deepseek-v3-2-exp', name: 'KYRO-DEV-V3.2 Exp', group: 'Reasoning', provider: 'openai' },
];

export const IMAGE_MODEL_ID = 'kyro-img-2.3';
export const IMAGE_MODEL_NAME = 'Kyro Img-2.3';
export const DEFAULT_MODEL = 'gpt-4o-mini';

export function modelDisplayName(id?: string | null): string {
  if (!id) return 'Kyro';
  const m = KYRO_MODELS.find((x) => x.id === id);
  return m?.name ?? id;
}

export function getProvider(id: string): 'openai' | 'gemini' | 'image' {
  return KYRO_MODELS.find((m) => m.id === id)?.provider ?? 'openai';
}
