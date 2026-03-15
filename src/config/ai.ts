export const AI_PROVIDERS = [
  { 
    id: 'openai', 
    name: 'OpenAI', 
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o'
  },
  { 
    id: 'gemini', 
    name: 'Google Gemini', 
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    defaultModel: 'gemini-1.5-pro'
  },
  {
    id: 'custom',
    name: 'Custom REST Endpoint (Own AI)',
    apiUrl: '',
    defaultModel: 'custom'
  }
] as const;

export type AiProviderId = typeof AI_PROVIDERS[number]['id'];

export const AI_MODELS: Record<AiProviderId, { id: string, name: string }[]> = {
  openai: [
    { id: 'gpt-4o', name: 'gpt-4o' },
    { id: 'gpt-4-turbo', name: 'gpt-4-turbo' },
    { id: 'gpt-4o-mini', name: 'gpt-4o-mini' },
  ],
  gemini: [
    { id: 'gemini-1.5-pro', name: 'gemini-1.5-pro' },
    { id: 'gemini-1.5-flash', name: 'gemini-1.5-flash' },
    { id: 'gemini-2.0-flash', name: 'gemini-2.0-flash' },
  ],
  custom: [
    { id: 'custom', name: 'Custom Model' }
  ]
};

// Helper function to get the base API URL for a provider
export function getProviderApiUrl(providerId: AiProviderId): string {
  return AI_PROVIDERS.find(p => p.id === providerId)?.apiUrl || '';
}

// Helper function to get the default model for a provider
export function getDefaultModel(providerId: AiProviderId): string {
  return AI_PROVIDERS.find(p => p.id === providerId)?.defaultModel || '';
}
