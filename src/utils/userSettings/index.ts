/**
 * User Settings Utility
 * 
 * This utility helps manage user settings like ICR ratio across the application.
 */

// User interface with settings
export interface User {
  id: string;
  username: string;
  email: string;
  icrRatio?: number;
  profileImage?: string;
  // Add other user properties as needed
}

/**
 * Get the current logged-in user from localStorage
 */
export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr) as User;
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
    return null;
  }
};

/**
 * Get user's ICR (Insulin-to-Carb Ratio)
 * Returns default value of 10 if not set
 */
export const getUserIcrRatio = (): number => {
  const user = getCurrentUser();
  return user?.icrRatio || 10; // Default to 10 if not set
};

/**
 * Update user's ICR ratio
 */
export const updateUserIcrRatio = (newRatio: number): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  
  try {
    // Update the user object
    user.icrRatio = newRatio;
    
    // Save back to localStorage
    localStorage.setItem('user', JSON.stringify(user));
    return true;
  } catch (error) {
    console.error('Error updating ICR ratio:', error);
    return false;
  }
};

/**
 * Update any user property
 */
export const updateUserProperty = <K extends keyof User>(property: K, value: User[K]): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  
  try {
    // Update the user object
    user[property] = value;
    
    // Save back to localStorage
    localStorage.setItem('user', JSON.stringify(user));
    return true;
  } catch (error) {
    console.error(`Error updating user property ${String(property)}:`, error);
    return false;
  }
};

// Export default object with all functions
const userSettings = {
  getCurrentUser,
  getUserIcrRatio,
  updateUserIcrRatio,
  updateUserProperty
};

export default userSettings;