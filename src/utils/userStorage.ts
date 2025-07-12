import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserData, MenuItem } from '../api/api';

// Storage keys
const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  USER_DATA: 'userData',
  MENU_ITEMS: 'menuItems',
};

// User storage utility class
class UserStorage {
  // Store user token
  static async storeToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, token);
    } catch (error) {
      console.error('Error storing token:', error);
      throw error;
    }
  }

  // Get user token
  static async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Store user data
  static async storeUserData(userData: UserData): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Error storing user data:', error);
      throw error;
    }
  }

  // Get user data
  static async getUserData(): Promise<UserData | null> {
    try {
      const userDataString = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (userDataString) {
        return JSON.parse(userDataString) as UserData;
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Store menu items
  static async storeMenuItems(menuItems: MenuItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(menuItems));
    } catch (error) {
      console.error('Error storing menu items:', error);
      throw error;
    }
  }

  // Get menu items
  static async getMenuItems(): Promise<MenuItem[] | null> {
    try {
      const menuItemsString = await AsyncStorage.getItem(STORAGE_KEYS.MENU_ITEMS);
      if (menuItemsString) {
        return JSON.parse(menuItemsString) as MenuItem[];
      }
      return null;
    } catch (error) {
      console.error('Error getting menu items:', error);
      return null;
    }
  }

  // Store all user session data
  static async storeSessionData(userData: UserData, menuItems: MenuItem[], token: string): Promise<void> {
    try {
      await Promise.all([
        this.storeToken(token),
        this.storeUserData(userData),
        this.storeMenuItems(menuItems),
      ]);
    } catch (error) {
      console.error('Error storing session data:', error);
      throw error;
    }
  }

  // Clear all user session data (logout)
  static async clearSessionData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.MENU_ITEMS,
      ]);
    } catch (error) {
      console.error('Error clearing session data:', error);
      throw error;
    }
  }

  // Check if user is logged in
  static async isLoggedIn(): Promise<boolean> {
    try {
      const token = await this.getToken();
      return token !== null;
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  }

  // Get user's employee name
  static async getEmployeeName(): Promise<string | null> {
    try {
      const userData = await this.getUserData();
      return userData?.EmployeeName || null;
    } catch (error) {
      console.error('Error getting employee name:', error);
      return null;
    }
  }

  // Get user's department
  static async getDepartment(): Promise<string | null> {
    try {
      const userData = await this.getUserData();
      return userData?.DeptDesc || null;
    } catch (error) {
      console.error('Error getting department:', error);
      return null;
    }
  }

  // Get user's designation
  static async getDesignation(): Promise<string | null> {
    try {
      const userData = await this.getUserData();
      return userData?.DesgNam || null;
    } catch (error) {
      console.error('Error getting designation:', error);
      return null;
    }
  }

  // Get user's photo URL
  static async getEmployeePhotoUrl(): Promise<string | null> {
    try {
      const userData = await this.getUserData();
      return userData?.EmployeePhotoUrl || null;
    } catch (error) {
      console.error('Error getting employee photo URL:', error);
      return null;
    }
  }
}

export default UserStorage; 