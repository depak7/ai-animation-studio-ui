export interface GenerateRequest {
  prompt: string;
  chatId: number;
  conversationId: string;
  // Removed userId - will be sent in headers instead
}

export interface GenerateResponse {
  id: number;
  prompt: string;
  userId: string; // Keep for response mapping
  chatId: number;
  conversationId: string;
  jsonRepresentation: string;
  generatedCode: string;
  videoSource: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  prompt: string;
  timestamp: Date;
  isGenerating?: boolean;
  generationProgress?: number;
  apiResponse?: GenerateResponse;
  conversationId?: string;
  logs?: string[];
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  isStarred?: boolean;
  lastUpdated: Date;
  latestVideoUrl?: string;
}

export interface LogMessage {
  timestamp: string;
  level: string;
  message: string;
  conversationId: string;
}

export interface ChatListItem {
  id: number;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  starred: boolean;
}

export interface ChatHistoryItem {
  id: number;
  prompt: string;
  userId: string;
  chatId: number;
  jsonRepresentation: string;
  videoSource: string;
  createdAt: string;
}