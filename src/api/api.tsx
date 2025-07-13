import axios from 'axios';
import { API_CONFIG, getApiUrl } from '../config/apiConfig';
import { Alert } from 'react-native';

// API request types
export interface LoginRequest {
  UserNam: string;
  UserLgnPwd: string;
}

// User data interface
export interface UserData {
  UserId: number;
  UserNam: string;
  EmpId: number;
  EmpNo: string;
  EmployeeName: string;
  CompId: number;
  CompCod: string;
  CompNam: string;
  ValidUpTo: string;
  DeptCod: string;
  DeptDesc: string;
  DesgCod: string;
  DesgNam: string;
  CurrCod: string;
  CurrNam: string;
  FracNam: string;
  CurrFormat: string;
  EmployeePhotoUrl: string;
  Token: string;
  TokenStatus: string;
  UserLgnPwd: string | null;
}

// Personal information interface
export interface PersonalInfo {
  EmpId: number;
  EmpNo: string;
  EmployeeName: string;
  AliasName: string;
  Nationality: string;
  Gender: string;
  Religion: string;
  Caste: string;
  PlaceOfBirth: string;
  DateOfBirth: string;
  MartitalStatus: string;
  BloodGroup: string;
  MotherTounge: string;
  FamilyStatus: string;
  SocialInsuranceNo: string;
}

// Menu item interface
export interface MenuItem {
  MenuId: number;
  MenuDisplayCaption: string;
  PageUrl: string | null;
  IconTag: string | null;
  IconColour: string | null;
  ImagePath: string | null;
  ImageName: string | null;
}

// API response interface
export interface LoginResponse {
  Item1: UserData[];
  Item2: MenuItem[];
}

// Wrapped response for our app
export interface AppLoginResponse {
  success: boolean;
  message?: string;
  userData?: UserData;
  menuItems?: MenuItem[];
  token?: string;
}

// Personal info response
export interface PersonalInfoResponse {
  success: boolean;
  message?: string;
  personalInfo?: PersonalInfo;
}

// API service class
class ApiService {
  // Login API call
  async login(credentials: LoginRequest): Promise<AppLoginResponse> {
    try {
      const apiurl = getApiUrl('/api/Login/CheckAuthentication');
      const response = await axios.post<LoginResponse>(apiurl, credentials, {
        headers: API_CONFIG.DEFAULT_HEADERS,
        timeout: API_CONFIG.TIMEOUT,
      });

      const { Item1, Item2 } = response.data;

      // Check if we have user data
      if (Item1 && Item1.length > 0) {
        const userData = Item1[0];
        
        return {
          success: true,
          message: 'Login successful',
          userData: userData,
          menuItems: Item2 || [],
          token: userData.Token,
        };
      } else {
        return {
          success: false,
          message: 'No user data received',
        };
      }
    } catch (error: any) {

      Alert.alert('Login API Error:', error.message);
      console.error('Login API Error:', error);
      console.log('APIURL :'+API_CONFIG.BASE_URL+'/api/Login/CheckAuthentication');
      
      if (error.response) {
        // Server responded with error status
        return {
          success: false,
          message: error.response.data?.message || `Server error: ${error.response.status}`,
        };
      } else if (error.request) {
        // Network error
        return {
          success: false,
          message: 'Network error. Please check your internet connection.',
        };
      } else {
        // Other error
        return {
          success: false,
          message: 'An unexpected error occurred.',
        };
      }
    }
  }

  // Get personal information API call
  async getPersonalInfo(token: string): Promise<PersonalInfoResponse> {
    try {
      const apiurl = getApiUrl('/api/Mob1010/MyDesk');
      console.log('Personal Info API URL:', apiurl);
      console.log('Personal Info Token:', token ? `Bearer ${token.substring(0, 20)}...` : 'No token provided');
      
      const requestBody = {
        "Mode": "ONE"
      };
      
      console.log('Personal Info Request Body:', requestBody);
      
      const response = await axios.post<PersonalInfo[]>(apiurl, requestBody, {
        headers: {
          ...API_CONFIG.DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`,
        },
        timeout: API_CONFIG.TIMEOUT,
      });

      console.log('Personal Info API Response:', response.data);

      // Check if we have personal info data
      if (response.data && response.data.length > 0) {
        const personalInfo = response.data[0];
        
        return {
          success: true,
          message: 'Personal information retrieved successfully',
          personalInfo: personalInfo,
        };
      } else {
        return {
          success: false,
          message: 'No personal information received',
        };
      }
    } catch (error: any) {
      console.error('Personal Info API Error:', error);
      
      if (error.response) {
        // Server responded with error status
        console.error('Server Error Status:', error.response.status);
        console.error('Server Error Data:', error.response.data);
        console.error('Server Error Headers:', error.response.headers);
        
        if (error.response.status === 401) {
          return {
            success: false,
            message: 'Authentication failed. Please login again. (401 Unauthorized)',
          };
        }
        
        return {
          success: false,
          message: error.response.data?.message || `Server error: ${error.response.status}`,
        };
      } else if (error.request) {
        // Network error
        console.error('Network Error:', error.request);
        return {
          success: false,
          message: 'Network error. Please check your internet connection.',
        };
      } else {
        // Other error
        console.error('Other Error:', error.message);
        return {
          success: false,
          message: 'An unexpected error occurred.',
        };
      }
    }
  }
}

// Create and export API service instance
export const apiService = new ApiService();

// Export individual functions for easier use
export const loginUser = (credentials: LoginRequest) => apiService.login(credentials);
export const getPersonalInfo = (token: string) => apiService.getPersonalInfo(token);
