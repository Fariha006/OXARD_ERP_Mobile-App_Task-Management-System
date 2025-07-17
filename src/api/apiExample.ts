/**
 * Example usage of the Oxard ERP API
 * This file demonstrates how to use the API methods
 */

import { loginUser, getPersonalInfo, getAddressInfo } from './api';
import UserStorage from '../utils/userStorage';

// Example: Login and then fetch address information
export const exampleLoginAndGetAddress = async () => {
  try {
    // Step 1: Login
    const loginCredentials = {
      UserNam: 'your_username',
      UserLgnPwd: 'your_password'
    };
    
    const loginResponse = await loginUser(loginCredentials);
    
    if (!loginResponse.success) {
      console.error('Login failed:', loginResponse.message);
      return;
    }
    
    // Step 2: Store the token
    if (loginResponse.token) {
      await UserStorage.storeToken(loginResponse.token);
      console.log('Login successful, token stored');
    }
    
    // Step 3: Get address information
    const addressResponse = await getAddressInfo(loginResponse.token!);
    
    if (addressResponse.success && addressResponse.addressInfo) {
      console.log('Address Information:');
      console.log('Employee Name:', addressResponse.addressInfo.EmployeeName);
      console.log('Current Address:', addressResponse.addressInfo.CurrentAddress);
      console.log('Permanent Address:', addressResponse.addressInfo.PermanentAddress);
    } else {
      console.error('Failed to get address info:', addressResponse.message);
    }
    
  } catch (error) {
    console.error('Error in example:', error);
  }
};

// Example: Get address information using stored token
export const exampleGetAddressWithStoredToken = async () => {
  try {
    // Get stored token
    const token = await UserStorage.getToken();
    
    if (!token) {
      console.error('No token found. Please login first.');
      return;
    }
    
    // Get address information
    const addressResponse = await getAddressInfo(token);
    
    if (addressResponse.success && addressResponse.addressInfo) {
      console.log('Address Information:');
      console.log('Employee Name:', addressResponse.addressInfo.EmployeeName);
      console.log('Current City:', addressResponse.addressInfo.CurrentCity);
      console.log('Current State:', addressResponse.addressInfo.CurrentState);
      console.log('Permanent City:', addressResponse.addressInfo.PermanentCity);
      console.log('Permanent State:', addressResponse.addressInfo.PermanentState);
    } else {
      console.error('Failed to get address info:', addressResponse.message);
    }
    
  } catch (error) {
    console.error('Error getting address info:', error);
  }
};

// Example: Compare personal info vs address info
export const exampleComparePersonalAndAddress = async () => {
  try {
    const token = await UserStorage.getToken();
    
    if (!token) {
      console.error('No token found. Please login first.');
      return;
    }
    
    // Get both personal and address information
    const [personalResponse, addressResponse] = await Promise.all([
      getPersonalInfo(token),
      getAddressInfo(token)
    ]);
    
    if (personalResponse.success && addressResponse.success) {
      console.log('Employee Information Comparison:');
      console.log('Personal Info - Name:', personalResponse.personalInfo?.EmployeeName);
      console.log('Address Info - Name:', addressResponse.addressInfo?.EmployeeName);
      console.log('Personal Info - Employee ID:', personalResponse.personalInfo?.EmpNo);
      console.log('Address Info - Employee ID:', addressResponse.addressInfo?.EmpNo);
    } else {
      console.error('Failed to get information:', {
        personal: personalResponse.message,
        address: addressResponse.message
      });
    }
    
  } catch (error) {
    console.error('Error comparing information:', error);
  }
}; 