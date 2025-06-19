import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  username: string;
  icrRatio?: number;
  profileImage?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    icrRatio?: number;
  };
  message: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(
        `${API_URL}/auth/login`,
        credentials
      );
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log(localStorage.getItem('user'));
        console.log(response.data.user);
      }
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(
        `${API_URL}/auth/register`,
        credentials
      );
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private handleError(error: any): Error {
    if (error.response) {
      throw new Error(error.response.data.message || 'An error occurred');
    }
    throw new Error('Network error occurred');
  }
}

export default new AuthService(); 