import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for biometric settings
const BIOMETRIC_ENABLED_KEY = 'biometricEnabled';

class BiometricSettings {
  // Check if biometric authentication is enabled
  static async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric enabled status:', error);
      return false;
    }
  }

  // Enable biometric authentication
  static async enableBiometric(): Promise<boolean> {
    try {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
      return true;
    } catch (error) {
      console.error('Error enabling biometric:', error);
      return false;
    }
  }

  // Disable biometric authentication
  static async disableBiometric(): Promise<boolean> {
    try {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
      return true;
    } catch (error) {
      console.error('Error disabling biometric:', error);
      return false;
    }
  }

  // Toggle biometric authentication
  static async toggleBiometric(): Promise<boolean> {
    try {
      const currentStatus = await this.isBiometricEnabled();
      const newStatus = !currentStatus;
      
      if (newStatus) {
        return await this.enableBiometric();
      } else {
        return await this.disableBiometric();
      }
    } catch (error) {
      console.error('Error toggling biometric:', error);
      return false;
    }
  }

  // Clear biometric settings
  static async clearBiometricSettings(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing biometric settings:', error);
      return false;
    }
  }
}

export default BiometricSettings;
