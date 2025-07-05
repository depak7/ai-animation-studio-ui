export class SSEService {
  private static instance: SSEService;
  private eventSource: EventSource | null = null;
  private subscribers: Map<string, (message: string) => void> = new Map();

  private constructor() {}

  static getInstance(): SSEService {
    if (!SSEService.instance) {
      SSEService.instance = new SSEService();
    }
    return SSEService.instance;
  }

  subscribe(conversationId: string, callback: (message: string) => void): void {
    this.subscribers.set(conversationId, callback);
    
    // Create new EventSource for this conversation
    const url = `http://localhost:8080/render/stream?conversationId=${conversationId}`;
    
    try {
      this.eventSource = new EventSource(url);

      this.eventSource.onmessage = (event) => {
        try {
          // Try to parse as JSON first
          const data = JSON.parse(event.data);
          if (data && data.data) {
            callback(data.data);
          } else if (typeof data === 'string') {
            callback(data);
          }
        } catch (error) {
          // If it's not JSON, treat as plain text
          if (event.data && typeof event.data === 'string') {
            callback(event.data);
          }
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        // Don't call callback on error to avoid undefined issues
      };

      this.eventSource.onopen = () => {
        console.log('SSE connection opened for conversation:', conversationId);
      };

    } catch (error) {
      console.error('Failed to create SSE connection:', error);
    }
  }

  unsubscribe(conversationId: string): void {
    this.subscribers.delete(conversationId);
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.subscribers.clear();
  }

  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}