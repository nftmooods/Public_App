export interface Step {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
}

export interface TranscriptionData {
  text: string;
  language: string;
  speakers: Speaker[];
  timestamps: Timestamp[];
  duration: number;
  tokenCount: number;
  estimatedCost: number;
}

export interface Speaker {
  id: string;
  name: string;
  color: string;
  speakingTime: number;
}

export interface Timestamp {
  start: number;
  end: number;
  text: string;
  speaker: string;
}

export interface KeyPoint {
  id: string;
  text: string;
  timestamp: number;
  speaker: string;
  category: 'theme' | 'quote' | 'insight' | 'question';
  editable: boolean;
  webLinks?: string[];
}

export interface ContentSettings {
  title: string;
  subtitle: string;
  summary: string;
  format: 'article' | 'bullets' | 'thread' | 'faq';
  tone: 'professional' | 'casual' | 'neutral' | 'engaging';
  language: string;
}

export interface PaymentInfo {
  accepted: boolean;
  method: 'crypto' | 'card' | null;
  amount: number;
  currency: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  apiKeys: UserApiKeys;
  subscription?: UserSubscription;
}

export interface ApiKeyConfig {
  key: string;
  enabled: boolean;
  lastTested?: string;
  isValid?: boolean;
}

export interface UserApiKeys {
  googleAI?: ApiKeyConfig;
  openAI?: ApiKeyConfig;
  anthropic?: ApiKeyConfig;
  mistral?: ApiKeyConfig;
  elevenLabs?: ApiKeyConfig;
  twitterAPI?: {
    apiKey: string;
    apiSecret: string;
    enabled: boolean;
    lastTested?: string;
    isValid?: boolean;
  };
}

export interface UserSubscription {
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired';
  expiresAt?: string;
}

export interface AppState {
  currentStep: number;
  audioUrl: string;
  youtubeUrl: string;
  audioFile: File | null;
  textContent: string;
  textFile: File | null;
  transcription: TranscriptionData | null;
  translation: TranscriptionData | null;
  keyPoints: KeyPoint[];
  contentSettings: ContentSettings;
  generatedContent: string;
  paymentInfo: PaymentInfo;
  isProcessing: boolean;
  user: User | null;
  isAuthenticated: boolean;
}

// Déclarations TypeScript pour l'API Web Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};