import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserData, MenuItem } from '../api/api';

// Storage keys
const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  USER_DATA: 'userData',
  MENU_ITEMS: 'menuItems',
  FCM_TOKEN: 'fcmToken',
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
      console.log('UserStorage: Attempting to get user data...');
      const userDataString = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      console.log('UserStorage: Raw user data string:', userDataString);
      
      if (userDataString) {
        const parsedData = JSON.parse(userDataString) as UserData;
        console.log('UserStorage: Parsed user data:', parsedData);
        console.log('UserStorage: AttendanceId type:', typeof parsedData.AttendanceId);
        console.log('UserStorage: AttendanceId value:', parsedData.AttendanceId);
        return parsedData;
      }
      console.log('UserStorage: No user data found');
      return null;
    } catch (error) {
      console.error('UserStorage: Error getting user data:', error);
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

  // Store FCM token
  static async storeFcmToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, token);
      console.log('FCM token stored successfully');
    } catch (error) {
      console.error('Error storing FCM token:', error);
      throw error;
    }
  }

  // Get FCM token
  static async getFcmToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.FCM_TOKEN);
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
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

  // Debug method to check and fix AttendanceId issues
  static async debugAttendanceId(): Promise<void> {
    try {
      const userData = await this.getUserData();
      if (userData) {
        console.log('Debug - Current AttendanceId:', userData.AttendanceId);
        console.log('Debug - AttendanceId type:', typeof userData.AttendanceId);
        console.log('Debug - AttendanceId length check:', userData.AttendanceId?.length);
        
        // If AttendanceId is not a string or is empty, regenerate it
        if (!userData.AttendanceId || typeof userData.AttendanceId !== 'string' || userData.AttendanceId.length === 0) {
          console.log('Debug - Regenerating AttendanceId...');
          const newAttendanceId = `ATT_${userData.EmpId}_${Date.now()}`;
          userData.AttendanceId = newAttendanceId;
          await this.storeUserData(userData);
          console.log('Debug - New AttendanceId stored:', newAttendanceId);
        }
      }
    } catch (error) {
      console.error('Debug - Error checking AttendanceId:', error);
    }
  }
}

export default UserStorage; 