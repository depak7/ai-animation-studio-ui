import { GenerateRequest, GenerateResponse, ChatListItem, ChatHistoryItem } from '../types/api';
import { AuthService, User } from './auth';

const BASE_URL = 'https://ai-animator-backend.livelyocean-b0186b38.southindia.azurecontainerapps.io';
// const BASE_URL = 'http://localhost:8080';

export interface CustomCodeRequest {
  prompt: string; // always 'user custom code'
  customCode: string;
  skipllmResponse: boolean;
  chatId: number;
  conversationId: string;
}

export class ApiService {
  static async generateAnimation(
    prompt: string, 
    user: User | null,
    chatId: number, 
    conversationId: string
  ): Promise<GenerateResponse> {
    const headers = AuthService.getAuthHeaders(user);

    const request: GenerateRequest = {
      prompt,
      chatId,
      conversationId
    };

    try {
      const response = await fetch(`${BASE_URL}/api/diagrams/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const data = await response.json();
      
      // Validate the response structure
      if (!data || !data.success) {
        throw new Error('Invalid response from server');
      }

      // Extract diagram data from the response
      const diagram = data.diagram;
      if (!diagram) {
        throw new Error('No diagram data in response');
      }

      // Map the response to our expected format
      return {
        id: diagram.id,
        prompt: diagram.prompt,
        userId: diagram.userId?.toString() || '',
        chatId: diagram.chatId,
        conversationId: conversationId,
        jsonRepresentation: diagram.jsonRepresentation || '{}',
        generatedCode: diagram.generatedCode || '',
        videoSource: diagram.videoSource || '',
        createdAt: diagram.createdAt || new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check your connection.');
      }
      throw error;
    }
  }

  static async getAllChats(user: User | null): Promise<ChatListItem[]> {
    const headers = AuthService.getAuthHeaders(user);

    try {
      const response = await fetch(`${BASE_URL}/api/chats/get-all-chats-of-user`, {
        headers
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch chats: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check your connection.');
      }
      throw error;
    }
  }

  static async getChatHistory(user: User | null, chatId: number): Promise<ChatHistoryItem[]> {
    const headers = AuthService.getAuthHeaders(user);

    try {
      const response = await fetch(`${BASE_URL}/api/chats/get-chat-history?chatId=${chatId}`, {
        headers
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch chat history: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check your connection.');
      }
      throw error;
    }
  }

  static async deleteChat(user: User | null, chatId: number): Promise<void> {
    const headers = AuthService.getAuthHeaders(user);

    try {
      const response = await fetch(`${BASE_URL}/api/chats/delete-chats?chatId=${chatId}`, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete chat: ${response.status} ${response.statusText}. ${errorText}`);
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check your connection.');
      }
      throw error;
    }
  }

  static async runCustomCode(
    code: string,
    user: User | null,
    chatId: number,
    conversationId: string
  ): Promise<GenerateResponse> {
    const headers = AuthService.getAuthHeaders(user);
    const request: CustomCodeRequest = {
      prompt: 'user custom code',
      customCode: code,
      skipllmResponse: true,
      chatId,
      conversationId
    };
    try {
      const response = await fetch(`${BASE_URL}/api/diagrams/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorText}`);
      }
      const data = await response.json();
      if (!data || !data.success) {
        throw new Error('Invalid response from server');
      }
      const diagram = data.diagram;
      if (!diagram) {
        throw new Error('No diagram data in response');
      }
      return {
        id: diagram.id,
        prompt: diagram.prompt,
        userId: diagram.userId?.toString() || '',
        chatId: diagram.chatId,
        conversationId: conversationId,
        jsonRepresentation: diagram.jsonRepresentation || '{}',
        generatedCode: diagram.generatedCode || '',
        videoSource: diagram.videoSource || '',
        createdAt: diagram.createdAt || new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check your connection.');
      }
      throw error;
    }
  }
}