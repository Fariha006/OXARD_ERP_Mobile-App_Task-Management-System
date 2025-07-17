import axios from 'axios';
import { API_CONFIG, getApiUrl } from '../config/apiConfig';
import { Alert } from 'react-native';

/**
 * API Service for Oxard ERP
 * 
 * Available API methods:
 * - loginUser(credentials): Login authentication
 * - getPersonalInfo(token): Get personal information (Mode: "ONE")
 * - getAddressInfo(token): Get address information (Mode: "TWO")
 * 
 * Example usage:
 * const token = await UserStorage.getToken();
 * const addressResponse = await getAddressInfo(token);
 * if (addressResponse.success) {
 *   console.log('Address:', addressResponse.addressInfo);
 * }
 */

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

// Address information interface
export interface AddressInfo {
  EmpId: number;
  EmpNo: string;
  EmployeeName: string;
  AddressC: string;
  CityCodC: string | null;
  CityNamC: string | null;
  CntryNamC: string | null;
  StateNamC: string | null;
  DistrictC: string | null;
  BuildingNoC: string | null;
  PostalCodeC: string | null;
  StreetC: string | null;
  ZipCodeC: string;
  PhoneC: string | null;
  MobileC: string | null;
  AddressP: string;
  CntryNamP: string | null;
  StateNamP: string | null;
  CityCodP: string | null;
  CityNamP: string | null;
  ZipCodeP: string;
  PhoneP: string;
  MobileP: string;
  ContactPersonP: string;
  AddressE: string;
  CityCodE: string | null;
  CityNamE: string | null;
  ZipCodeE: string;
  CntryNamE: string | null;
  StateNamE: string | null;
  PhoneE: string;
  MobileE: string;
  PersonalEmailId: string;
  OfficialEmailId: string;
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

// Address info response
export interface AddressInfoResponse {
  success: boolean;
  message?: string;
  addressInfo?: AddressInfo;
}

// Dependent information interface
export interface DependentInfo {
  EmpId: number;
  EmpNo: string;
  EmployeeName: string;
  DependentName: string;
  Relation: string;
  DateofBirthDependent: string;
  GenderDependent: string;
  MaritalStatusDependent: string;
  DependentVisa: string;
  DependentVisaNo: string;
  DependentVisaIssueDate: string | null;
  DependentVisaExpiryDate: string | null;
  DependentNationalityCode: string;
  DependentNationality: string;
  DependentPassportNo: string;
  DependentPassportPlaceofIssue: string;
  DependentUIDNo: string;
  NationalIdDependent: string;
  NationalIDExpiryDependent: string;
  DependentInsuranceNo: string;
  DependentInsuranceClass: string;
  DependentInsuranceStatus: string | null;
  DependentInsuranceEffectiveDate: string | null;
  DependentInsuranceEndDate: string | null;
}

// Payment information interface
export interface PaymentInfo {
  "Payment Mode": string;
  "Branch ": string;
  "Bank Branch ": string;
  "Account No": string;
  "IBAN No": string;
  "Beneficiary Name": string;
  "Salary A/C (Yes/NO)": string;
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
        "Mode": "One"
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

  // Get address information API call
  async getAddressInfo(token: string): Promise<AddressInfoResponse> {
    try {
      const apiurl = getApiUrl('/api/Mob1010/MyDesk');
      console.log('Address Info API URL:', apiurl);
      console.log('Address Info Token:', token ? `Bearer ${token.substring(0, 20)}...` : 'No token provided');
      
      const requestBody = {
        "Mode": "Two"
      };
      
      console.log('Address Info Request Body:', requestBody);
      
      const response = await axios.post<AddressInfo[]>(apiurl, requestBody, {
        headers: {
          ...API_CONFIG.DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`,
        },
        timeout: API_CONFIG.TIMEOUT,
      });

      console.log('Address Info API Response:', response.data);

      // Check if we have address info data
      if (response.data && response.data.length > 0) {
        const addressInfo = response.data[0];
        
        return {
          success: true,
          message: 'Address information retrieved successfully',
          addressInfo: addressInfo,
        };
      } else {
        return {
          success: false,
          message: 'No address information received',
        };
      }
    } catch (error: any) {
      console.error('Address Info API Error:', error);
      
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

  // Get dependents API call
  async getDependents(token: string): Promise<DependentInfo[]> {
    const apiurl = getApiUrl('/api/Mob1010/MyDesk');
    const requestBody = { "Mode": "Three" };
    const response = await axios.post<DependentInfo[]>(apiurl, requestBody, {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      timeout: API_CONFIG.TIMEOUT,
    });
    return response.data;
  }

  // Get payments API call
  async getPayments(token: string): Promise<PaymentInfo[]> {
    const apiurl = getApiUrl('/api/Mob1010/MyDesk');
    const requestBody = { "Mode": "Four" };
    const response = await axios.post<PaymentInfo[]>(apiurl, requestBody, {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      timeout: API_CONFIG.TIMEOUT,
    });
    return response.data;
  }

  // Get qualification data API call
  async getQualificationData(token: string): Promise<any> {
    const apiurl = getApiUrl('/api/Mob1010/MyDesk');
    const requestBody = { "Mode": "Five" };
    const response = await axios.post<any>(apiurl, requestBody, {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      timeout: API_CONFIG.TIMEOUT,
    });
    return response.data;
  }

  // Get document data API call
  async getDocumentData(token: string): Promise<any> {
    const apiurl = getApiUrl('/api/Mob1010/MyDesk');
    const requestBody = { "Mode": "Six" };
    const response = await axios.post<any>(apiurl, requestBody, {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      timeout: API_CONFIG.TIMEOUT,
    });
    return response.data;
  }

  // Get contact info data API call
  async getContactInfoData(token: string): Promise<any> {
    const apiurl = getApiUrl('/api/Mob1010/MyDesk');
    const requestBody = { "Mode": "Seven" };
    const response = await axios.post<any>(apiurl, requestBody, {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      timeout: API_CONFIG.TIMEOUT,
    });
    return response.data;
  }

  // Get salary data API call
  async getSalaryData(token: string): Promise<any> {
    const apiurl = getApiUrl('/api/Mob1010/MyDesk');
    const requestBody = { "Mode": "Eight" };
    const response = await axios.post<any>(apiurl, requestBody, {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      timeout: API_CONFIG.TIMEOUT,
    });
    return response.data;
  }
}

// Create and export API service instance
export const apiService = new ApiService();

// Export individual functions for easier use
export const loginUser = (credentials: LoginRequest) => apiService.login(credentials);
export const getPersonalInfo = (token: string) => apiService.getPersonalInfo(token);
export const getAddressInfo = (token: string) => apiService.getAddressInfo(token);
export const getDependents = (token: string) => apiService.getDependents(token);
export const getPayments = (token: string) => apiService.getPayments(token);
export const getQualificationData = (token: string) => apiService.getQualificationData(token);
export const getDocumentData = (token: string) => apiService.getDocumentData(token);
export const getContactInfoData = (token: string) => apiService.getContactInfoData(token);
export const getSalaryData = (token: string) => apiService.getSalaryData(token);
