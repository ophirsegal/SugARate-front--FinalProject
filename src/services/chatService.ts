// services/chatService.ts
import axios from 'axios';
import authService from './authService';

const API_URL = 'http://localhost:5000/api/messages';

export interface ChatPreview {
  userId: string;
  username: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

class ChatService {
  private getAuthHeader() {
    const token = authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getUserChats(userId: string): Promise<ChatPreview[]> {
    try {
      const response = await axios.get<ChatPreview[]>(
        `${API_URL}/contacts/${userId}`,
        { headers: this.getAuthHeader() }
      );
      console.log(response.data);
      return response.data.contacts;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getAllChats(): Promise<ChatPreview[]> {
    try {
      const response = await axios.get<ChatPreview[]>(
        `${API_URL}/chats`,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }
  
  async getChatMessages(userId1: string, userId2: string): Promise<ChatMessage[]> {
    try {
      const response = await axios.get(
        `${API_URL}/chat/${userId1}/${userId2}`,
        { headers: this.getAuthHeader() }
      );
      return response.data.map((msg: any) => ({
        id: msg._id,
        senderId: msg.senderId,
        text: msg.text,
        timestamp: new Date(msg.timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }));
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // New method: mark messages as read for a given chat
  async markMessagesAsRead(userId: string, receiverId: string): Promise<void> {
    try {
      await axios.put(
        `${API_URL}/chat/read/${userId}/${receiverId}`,
        {},
        { headers: this.getAuthHeader() }
      );
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Network error occurred');
  }
}

export default new ChatService();
