import axios from 'axios';
import { API_CONFIG, getApiUrl, getFileUrl } from '../config/apiConfig';
import { Alert } from 'react-native';
import { Buffer } from 'buffer';

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
  AttendanceId: string;
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

  // Save FCM token to backend
  async managetoken(token: string, bearerToken?: string): Promise<any> {
    try {
      const apiurl = getApiUrl('/api/Login/SaveToken');
      console.log('Save FCM Token API URL:', apiurl);
      console.log('FCM Token to save:', token ? `${token.substring(0, 20)}...` : 'No token provided');
      console.log('Bearer Token:', bearerToken ? `Bearer ${bearerToken.substring(0, 20)}...` : 'No bearer token provided');
      
      const requestBody = {
        "Token": token
      };
      
      console.log('Save FCM Token Request Body:', requestBody);
      
      const headers = {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${bearerToken}`,
      };
      
      const response = await axios.post<any>(apiurl, requestBody, {
        headers,
        timeout: API_CONFIG.TIMEOUT,
      });
  
      console.log('Save FCM Token API Response:', response.data);
  
      return {
        success: true,
        message: 'FCM token saved successfully',
        data: response.data,
      };
    } catch (error: any) {
      console.error('Save FCM Token API Error:', error);
      
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

  // Get personal information API call
  async getPersonalInfo(token: string): Promise<PersonalInfoResponse> {
    try {
      const apiurl = getApiUrl('/api/MobBa1010/MyDesk');
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
      const apiurl = getApiUrl('/api/MobBa1010/MyDesk');
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
    const apiurl = getApiUrl('/api/MobBa1010/MyDesk');
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
    const apiurl = getApiUrl('/api/MobBa1010/MyDesk');
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
    const apiurl = getApiUrl('/api/MobBa1010/MyDesk');
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
    const apiurl = getApiUrl('/api/MobBa1010/MyDesk');
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
    const apiurl = getApiUrl('/api/MobBa1010/MyDesk');
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
    const apiurl = getApiUrl('/api/MobBa1010/MyDesk');
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

  // Get eligibility data API call
  async getEligibilityData(token: string): Promise<any> {
    const apiurl = getApiUrl('/api/MobBa1010/MyDesk');
    const requestBody = { "Mode": "Nine" };
    const response = await axios.post<any>(apiurl, requestBody, {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      timeout: API_CONFIG.TIMEOUT,
    });
    return response.data;
  }

  // Get contract revision data API call
  async getContractRevisionData(token: string): Promise<any> {
    const apiurl = getApiUrl('/api/MobBa1010/MyDesk');
    const requestBody = { "Mode": "Ten" };
    const response = await axios.post<any>(apiurl, requestBody, {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      timeout: API_CONFIG.TIMEOUT,
    });
    return response.data;
  }

  // Get assets data API call
  async getAssetsData(token: string): Promise<any> {
    const apiurl = getApiUrl('/api/MobBa1010/MyDesk');
    const requestBody = { "Mode": "Eleven" };
    const response = await axios.post<any>(apiurl, requestBody, {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      timeout: API_CONFIG.TIMEOUT,
    });
    return response.data;
  }

  // Get leave history data API call
  async getLeaveHistoryData(token: string): Promise<any> {
    const apiurl = getApiUrl('/api/MobBa1010/MyDesk');
    const requestBody = { "Mode": "Twelve" };
    const response = await axios.post<any>(apiurl, requestBody, {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      timeout: API_CONFIG.TIMEOUT,
    });
    return response.data;
  }

  // Get notifications (My Desk) API call
  async getMesseges(token: string): Promise<any[]> {
    try {
      const apiurl = getApiUrl('/api/MobAdm0009/LG_Mode');
      const requestBody = { "Mode": "TWO" };
      const response = await axios.post<any[]>(apiurl, requestBody, {
        headers: {
          ...API_CONFIG.DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`,
        },
        timeout: API_CONFIG.TIMEOUT,
      });
      return response.data;
    } catch (error: any) {
      console.error('Notifications API Error:', error);
      throw error;
    }
  }
  async getNotifications(token: string): Promise<any> {
    try {
      const apiurl = getApiUrl('/api/MobBa1010/MyDesk');
      const requestBody = { "Mode": "Fifteen" };
      const response = await axios.post<any>(apiurl, requestBody, {
        headers: {
          ...API_CONFIG.DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`,
        },
        timeout: API_CONFIG.TIMEOUT,
      });
      return response.data;
    } catch (error: any) {
      console.error('Notifications API Error:', error);
      throw error;
    }
  }

  // Get payslips data API call
  async getPayslips(token: string): Promise<any> {
    const apiurl = getApiUrl('/api/MobDa6110/Payslips');
    const response = await axios.post<any>(apiurl, {}, {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      timeout: API_CONFIG.TIMEOUT,
    });
    return response.data;
  }

  // Download payslip PDF API call
  async downloadPayslipPdf(reportCode: string, id: string, token: string): Promise<string> {
    const apiurl = getApiUrl('/api/Report/Download');
    const response = await axios.post(apiurl, {
      ReportCode: reportCode,
      Id: id,
    }, {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      responseType: 'arraybuffer',
      timeout: API_CONFIG.TIMEOUT,
    });
    // Convert arraybuffer to base64
    const base64 = Buffer.from(response.data).toString('base64');
    console.log('PDF base64 preview:', base64.substring(0, 40)); // Should start with JVBERi0
    return base64;
  }

  // Download Leave Outstanding PDF API call
  async downloadLeaveOutstandingPdf(reportCode: string, dateAsOn: string, token: string): Promise<string> {
    const apiurl = getApiUrl('/api/Report/Download');
    const response = await axios.post(apiurl, {
      ReportCode: reportCode,
      DateAsOn: dateAsOn,
    }, {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      responseType: 'arraybuffer',
      timeout: API_CONFIG.TIMEOUT,
    });
    // Convert arraybuffer to base64
    const base64 = Buffer.from(response.data).toString('base64');
    return base64;
  }

  // Certificate Request API call
  async getCertificateRequests(token: string): Promise<any[]> {
    const apiurl = getApiUrl('/api/MobBa1010/MyDesk');
    const requestBody = { "Mode": "Thirteen" };
    const response = await axios.post<any[]>(apiurl, requestBody, {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      timeout: API_CONFIG.TIMEOUT,
    });
    return response.data;
  }

  // Get approvals data API call
  async getApprovals(token: string): Promise<any> {
    const apiurl = getApiUrl('/api/MobBa1010/MyDesk');
    const requestBody = { "Mode": "Fourteen" };
    const response = await axios.post<any>(apiurl, requestBody, {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      timeout: API_CONFIG.TIMEOUT,
    });
    return response.data;
  }

  // Get employee directory API call
  async getEmployeeDirectory(token: string): Promise<any[]> {
    const apiurl = getApiUrl('/api/MobBa1010/MyDesk');
    const requestBody = { "Mode": "Sixteen" };
    const response = await axios.post<any[]>(apiurl, requestBody, {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      timeout: API_CONFIG.TIMEOUT,
    });
    return response.data;
  }

  // Get certificate types API call
  async getCertificateTypes(token: string): Promise<any[]> {
    try {
      const apiurl = getApiUrl('/api/MobDa6700/LO_Mode');
      const response = await axios.post<any[]>(apiurl, {}, {
        headers: {
          ...API_CONFIG.DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`,
        },
        timeout: API_CONFIG.TIMEOUT,
      });
      return response.data;
    } catch (error: any) {
      console.error('Certificate Types API Error:', error);
      throw error;
    }
  }

  // Get certificate details by ID API call
  async getCertificateDetails(certificateId: string, token: string): Promise<any[]> {
    try {
      const apiurl = getApiUrl('/api/MobDa6700/SE_Mode');
      const requestBody = {
        "Mode": "I",
        "CertificateId": certificateId
      };
      const response = await axios.post<any[]>(apiurl, requestBody, {
        headers: {
          ...API_CONFIG.DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`,
        },
        timeout: API_CONFIG.TIMEOUT,
      });
      return response.data;
    } catch (error: any) {
      console.error('Certificate Details API Error:', error);
      throw error;
    }
  }  

  // Submit approval decision API call
  async submitApproval(decisionId: string, decision: string, remarks: string, token: string): Promise<any> {
    try {
      const apiurl = getApiUrl('/api/MobUsr0070/Approval');
      const requestBody = {
        DecisionId: decisionId,
        Decision: decision,
        Remarks: remarks
      };
      
      console.log('Submit Approval API URL:', apiurl);
      console.log('Submit Approval Request Body:', requestBody);
      
      const response = await axios.post<any>(apiurl, requestBody, {
        headers: {
          ...API_CONFIG.DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`,
        },
        timeout: API_CONFIG.TIMEOUT,
      });
      
      console.log('Submit Approval API Response:', response.data);
      
      // Check if response has the expected format with Status field
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const statusItem = response.data[0];
        if (statusItem.Status === 'Success') {
          return { success: true, message: 'Approval submitted successfully' };
        } else {
          throw new Error(statusItem.Status || 'Approval submission failed');
        }
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('Submit Approval API Error:', error);
      
      if (error.response) {
        // Server responded with error status
        console.error('Server Error Status:', error.response.status);
        console.error('Server Error Data:', error.response.data);
        throw new Error(error.response.data?.message || `Server error: ${error.response.status}`);
      } else if (error.request) {
        // Network error
        console.error('Network Error:', error.request);
        throw new Error('Network error. Please check your internet connection.');
      } else {
        // Other error
        console.error('Other Error:', error.message);
        throw new Error(error.message || 'An unexpected error occurred.');
      }
    }
  }

  // Save or update certificate request API call
  async saveCertificateRequest(mode: string, certificateId: string, certificateTypeId: string, requestedDate: string, token: string): Promise<any[]> {
    try {
      const apiurl = getApiUrl('/api/MobDa6700/I_U_D_Mode');
      const requestBody = {
        "Mode": mode,
        "CertificateId": certificateId,
        "CertificateTypeId": certificateTypeId,
        "RequestedDate": requestedDate
      };
      const response = await axios.post<any[]>(apiurl, requestBody, {
        headers: {
          ...API_CONFIG.DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`,
        },
        timeout: API_CONFIG.TIMEOUT,
      });
      return response.data;
    } catch (error: any) {
      console.error('Save Certificate Request API Error:', error);
      throw error;
    }
  }

  // Submit attendance (check-in/check-out) API call
  async submitAttendance(attendanceData: {
    Mode: string;
    AttendanceId: string;
    Latitude: string;
    Longitude: string;
    Place: string;
    PunchDate: string;
    PunchTime: string;
  }, token: string): Promise<any> {
    try {
      const apiurl = getApiUrl('/api/MobDa5100/I_U_D_Mode');
      console.log('Submit Attendance API URL:', apiurl);
      console.log('Submit Attendance Request Body:', attendanceData);
      
      const response = await axios.post<any>(apiurl, attendanceData, {
        headers: {
          ...API_CONFIG.DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`,
        },
        timeout: API_CONFIG.TIMEOUT,
      });
      
      console.log('Submit Attendance API Response:', response.data);
      
      // Check if response has the expected format
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const statusItem = response.data[0];
        if (statusItem.Status === 'Success') {
          return { 
            success: true, 
            message: 'Attendance submitted successfully',
            attendanceId: statusItem.AttendanceId 
          };
        } else {
          throw new Error(statusItem.Status || 'Attendance submission failed');
        }
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('Submit Attendance API Error:', error);
      
      if (error.response) {
        // Server responded with error status
        console.error('Server Error Status:', error.response.status);
        console.error('Server Error Data:', error.response.data);
        throw new Error(error.response.data?.message || `Server error: ${error.response.status}`);
      } else if (error.request) {
        // Network error
        console.error('Network Error:', error.request);
        throw new Error('Network error. Please check your internet connection.');
      } else {
        // Other error
        console.error('Other Error:', error.message);
        throw new Error(error.message || 'An unexpected error occurred.');
      }
    }
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
export const getEligibilityData = (token: string) => apiService.getEligibilityData(token);
export const getContractRevisionData = (token: string) => apiService.getContractRevisionData(token);
export const getAssetsData = (token: string) => apiService.getAssetsData(token);
export const getLeaveHistoryData = (token: string) => apiService.getLeaveHistoryData(token);
export const getNotifications = (token: string) => apiService.getNotifications(token);
export const getPayslips = (token: string) => apiService.getPayslips(token);
export const downloadPayslipPdf = (reportCode: string, id: string, token: string) => apiService.downloadPayslipPdf(reportCode, id, token);
export const downloadLeaveOutstandingPdf = (reportCode: string, dateAsOn: string, token: string) => apiService.downloadLeaveOutstandingPdf(reportCode, dateAsOn, token);
export const getCertificateRequests = (token: string) => apiService.getCertificateRequests(token);
export const getApprovals = (token: string) => apiService.getApprovals(token);
export const getEmployeeDirectory = (token: string) => apiService.getEmployeeDirectory(token);
export const getCertificateTypes = (token: string) => apiService.getCertificateTypes(token);
export const getCertificateDetails = (certificateId: string, token: string) => apiService.getCertificateDetails(certificateId, token);
export const saveCertificateRequest = (mode: string, certificateId: string, certificateTypeId: string, requestedDate: string, token: string) => apiService.saveCertificateRequest(mode, certificateId, certificateTypeId, requestedDate, token);
export const getMesseges = (token: string) => apiService.getMesseges(token);
export const submitApproval = (decisionId: string, decision: string, remarks: string, token: string) => apiService.submitApproval(decisionId, decision, remarks, token);
export const submitAttendance = (attendanceData: any, token: string) => apiService.submitAttendance(attendanceData, token);
export { getFileUrl };
export const managetoken = (token: string, bearerToken?: string) => apiService.managetoken(token, bearerToken);

export async function fetchMessageCategories(token: string) {
  try {
    const apiurl = getApiUrl('/api/MobAdm0009/LO_Mode');
    const requestBody = {
      "Mode": "TWO"
    };
    const response = await axios.post<any>(apiurl, requestBody, {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      timeout: API_CONFIG.TIMEOUT,
    });
    return response.data;
  } catch (error: any) {
    console.error('Message Categories API Error:', error);
    throw error;
  }
}

export async function fetchSelectTypes(token: string, employeeCategoryId: number) {
  try {
    const apiurl = getApiUrl('/api/MobAdm0009/EL_Mode');
    const requestBody = {
      "EmployeeCategoryId": employeeCategoryId
    };
    const response = await axios.post<any>(apiurl, requestBody, {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      timeout: API_CONFIG.TIMEOUT,
    });
    return response.data;
  } catch (error: any) {
    console.error('Select Types API Error:', error);
    throw error;
  }
}

export async function saveMessage(token: string, messageData: {
  Mode: string;
  NotificationId: string;
  FkCategoryId: string;
  Title: string;
  NotificationDate: string;
  NotificationContent: string;
  EmployeeCategoryId: string;
  EmployeeCategoryListIds: string;
}) {
  try {
    const apiurl = getApiUrl('/api/MobAdm0009/I_U_D_Mode');
    const response = await axios.post<any>(apiurl, messageData, {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      timeout: API_CONFIG.TIMEOUT,
    });
    return response.data;
  } catch (error: any) {
    console.error('Save Message API Error:', error);
    throw error;
  }
}

export async function fetchMessageForEdit(token: string, notificationId: string) {
  try {
    const apiurl = getApiUrl('/api/MobAdm0009/SE_Mode');
    const requestBody = {
      "NotificationId": notificationId
    };
    const response = await axios.post<any>(apiurl, requestBody, {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      timeout: API_CONFIG.TIMEOUT,
    });
    return response.data;
  } catch (error: any) {
    console.error('Fetch Message for Edit API Error:', error);
    throw error;
  }
}

export async function fetchLeaveData(token: string) {
  try {
    const apiurl = getApiUrl('/api/MobDa5010/LO_Mode');
    const requestBody = {};
    const response = await axios.post<any>(apiurl, requestBody, {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      timeout: API_CONFIG.TIMEOUT,
    });
    return response.data;
  } catch (error: any) {
    console.error('Fetch Leave Data API Error:', error);
    throw error;
  }
}

export async function calculateLeaveDays(token: string, startDate: string, endDate: string, halfDayStart: boolean, halfDayEnd: boolean) {
  try {
    const apiurl = getApiUrl('/api/MobDa5010/V1_Mode');
    const requestBody = {
      "startdate": startDate,
      "enddate": endDate,
      "halfdaystartdate": halfDayStart.toString(),
      "halfdayenddate": halfDayEnd.toString()
    };
    const response = await axios.post<any>(apiurl, requestBody, {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      timeout: API_CONFIG.TIMEOUT,
    });
    return response.data;
  } catch (error: any) {
    console.error('Calculate Leave Days API Error:', error);
    throw error;
  }
}

export async function saveLeaveRequest(token: string, leaveData: any) {
  try {
    const apiurl = getApiUrl('/api/MobDa5010/V2_Mode');
    const response = await axios.post<any>(apiurl, leaveData, {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      timeout: API_CONFIG.TIMEOUT,
    });
    return response.data;
  } catch (error: any) {
    console.error('Save Leave Request API Error:', error);
    throw error;
  }
}

export async function saveAllLeaves(token: string, leaveData: any) {
  try {
    const apiurl = getApiUrl('/api/MobDa5010/I_U_D_Mode');
    const response = await axios.post<any>(apiurl, leaveData, {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      timeout: API_CONFIG.TIMEOUT,
    });
    return response.data;
  } catch (error: any) {
    console.error('Save All Leaves API Error:', error);
    throw error;
  }
}

export async function fetchLeaveEditData(token: string, leaveRegisterId: string) {
  try {
    const apiurl = getApiUrl('/api/MobDa5010/SE_Mode');
    const requestBody = {
      "LeaveRegisterId": leaveRegisterId
    };
    const response = await axios.post<any>(apiurl, requestBody, {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      timeout: API_CONFIG.TIMEOUT,
    });
    return response.data;
  } catch (error: any) {
    console.error('Fetch Leave Edit Data API Error:', error);
    throw error;
  }
}

export async function deleteLeaveRequest(token: string, leaveRegisterId: string) {
  try {
    const apiurl = getApiUrl('/api/MobDa5010/I_U_D_Mode');
    const requestBody = {
      "Mode": "D",
      "LeaveRegisterId": leaveRegisterId
    };
    const response = await axios.post<any>(apiurl, requestBody, {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
      timeout: API_CONFIG.TIMEOUT,
    });
    return response.data;
  } catch (error: any) {
    console.error('Delete Leave Request API Error:', error);
    throw error;
  }
}

export async function uploadDocument(token: string, file: any, leaveRegisterId?: string) {
  try {
    //const apiurl = getApiUrl('/api/Document/Upload');
    const apiurl ='http://localhost:50963/api/Document/Upload';
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'application/octet-stream',
      name: file.name || 'document',
    } as any);
    
    if (leaveRegisterId) {
      formData.append('leaveRegisterId', leaveRegisterId);
    }
    
    console.log('Upload Document API URL:', apiurl);
    console.log('Upload Document File:', file.name);
    
    const response = await axios.post<any>(apiurl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
        // 'Authorization': `Bearer ${token}`,
      },
      timeout: API_CONFIG.TIMEOUT,
    });
    
    console.log('Upload Document API Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Upload Document API Error:', error);
    throw error;
  }
}

// Download file function
export async function downloadFile(filePath: string, token: string): Promise<string> {
  try {
    // Construct the full URL with proper backslash handling
    const baseUrl = API_CONFIG.BASE_URL.endsWith('/') ? API_CONFIG.BASE_URL : `${API_CONFIG.BASE_URL}/`;
    const path = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const fullFileUrl = `${baseUrl}${path}`;
    
    console.log('Downloading file from URL:', fullFileUrl);
    
    // For direct download, we just return the URL
    // The actual download will be handled by the system when opening the URL
    return fullFileUrl;
  } catch (error: any) {
    console.error('Download File API Error:', error);
    throw error;
  }
}