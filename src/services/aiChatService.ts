import axios from 'axios';

export interface ChatResponse {
  message: string;
  timestamp: Date;
}

export interface Message {
  id: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: Date;
}

export class AIChatService {
  private baseURL: string;
  private token: string | null;

  constructor() {
    // Adjust the base URL if your backend is hosted elsewhere.
    this.baseURL = 'http://localhost:5000/api/ai';
    this.token = localStorage.getItem('token');
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
    };
  }

  async sendMessage(message: string): Promise<ChatResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/ai-chat`,
        { message },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('[AIChatService] Error sending message:', error);
      throw error;
    }
  }

  // Static helper method for formatting messages
  static formatMessage(content: string, type: 'user' | 'ai'): Message {
    return {
      id: Date.now().toString(),
      content,
      type,
      timestamp: new Date(),
    };
  }
}

// Default export is an instance for calling instance methods
export default new AIChatService();
