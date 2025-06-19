const API_BASE_URL = 'http://localhost:5000/api';

interface UserData {
  username: string;
  email: string;
  profileImage: string;
  id: string;
}

export const userService = {
  async updateProfileImage(userId: string, base64Image: string) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/profile-image`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ profileImage: base64Image })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile image');
    }

    return data;
  },

  async updateUsername(userId: string, newUsername: string) {
    if (!newUsername.trim()) {
      throw new Error('Username cannot be empty');
    }

    if (newUsername.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }

    if (newUsername.length > 30) {
      throw new Error('Username cannot exceed 30 characters');
    }

    // Regular expression to check if username contains only allowed characters
    const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!usernameRegex.test(newUsername)) {
      throw new Error('Username can only contain letters, numbers, underscores, dots, and hyphens');
    }

    const response = await fetch(`${API_BASE_URL}/users/${userId}/username`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ username: newUsername })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update username');
    }

    return data;
  },

  getUserFromStorage(): UserData {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return {
      username: user.username || '',
      email: user.email || '',
      profileImage: user.profileImage || '',
      id: user.id || ''
    };
  },

  updateUserStorage(userData: UserData) {
    localStorage.setItem('user', JSON.stringify(userData));
  }
};