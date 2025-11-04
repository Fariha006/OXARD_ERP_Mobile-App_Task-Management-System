import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  Platform, Alert, ActivityIndicator, Image, Modal, PermissionsAndroid, NativeModules
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { downloadLeaveOutstandingPdf } from '../api/api';
import UserStorage from '../utils/userStorage';
import Pdf from 'react-native-pdf';
import RNFS from 'react-native-fs';
import RNFetchBlob from 'react-native-blob-util';
import NotificationService from '../services/NotificationService';
const { MediaStoreModule } = NativeModules;

const LeaveOutstandingScreen = ({ navigation }: { navigation?: any }) => {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [pdfSource, setPdfSource] = useState<{ uri: string } | null>(null);
  const [base64Data, setBase64Data] = useState<string>('');
  const [pdfModalVisible, setPdfModalVisible] = useState(false);

  const onChange = (_event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  const formatDate = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const formattedDate = formatDate(date);
      const token = await UserStorage.getToken();

      if (!token) {
        Alert.alert('No authentication token found. Please login again.');
        return;
      }

      const base64data = await downloadLeaveOutstandingPdf('da5010', formattedDate, token);
      if (!base64data.startsWith('JVBERi0')) {
        Alert.alert('Warning', 'Invalid PDF file data.');
        return;
      }

             // Prepare inline Base64 source for react-native-pdf
       const source = { uri: `data:application/pdf;base64,${base64data}` };
       setPdfSource(source);
       setBase64Data(base64data);
       setPdfModalVisible(true);

    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to download PDF.');
    } finally {
      setDownloading(false);
    }
     };

   const handleClosePdf = () => {
     setPdfModalVisible(false);
     setPdfSource(null);
     setBase64Data('');
   };

   const handleSavePdf = async () => {
    await NotificationService.init();
     if (!base64Data) {
       Alert.alert('Error', 'No PDF data to save.');
       return;
     }
     const hasPermission = await requestStoragePermission();
     if (!hasPermission) {
       Alert.alert('Error', 'Storage permission not granted.');
       return;
     }
     try {
       const formattedDate = formatDate(date);
       const fileName = `LeaveOutstanding_${formattedDate}.pdf`;

       const { fs, android } = RNFetchBlob;
       const downloadDir = fs.dirs.DownloadDir;
       const filePath = `${downloadDir}/${fileName}`;

       // Write Base64 data
       await fs.writeFile(filePath, base64Data, 'base64');
       
       // Save to downloads using MediaStoreModule
       const uri = await MediaStoreModule.saveFileToDownloads(filePath, fileName, 'application/pdf');

       if (Platform.OS === 'android') {
         android.addCompleteDownload({
           title: fileName,
           description: 'Leave Outstanding File downloaded successfully',
           mime: 'application/pdf',
           path: filePath,
           showNotification: true,
         });

         await android.actionViewIntent(filePath, 'application/pdf');
         await NotificationService.showDownloadComplete(fileName, filePath);
       }
     } catch (error) {
       console.error('Error saving PDF:', error);
       Alert.alert('Error', 'Failed to save PDF to device.');
     }
   };

   async function requestStoragePermission() {
     if (Platform.OS === 'android') {
       try {
         const granted = await PermissionsAndroid.request(
           PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
           {
             title: 'Storage Permission',
             message: 'App needs access to your storage to download files',
             buttonNeutral: 'Ask Me Later',
             buttonNegative: 'Cancel',
             buttonPositive: 'OK',
           },
         );
         return granted === PermissionsAndroid.RESULTS.GRANTED;
       } catch (err) {
         console.warn(err);
         return false;
       }
     } else {
       return true; // iOS doesn't require this
     }
   }

   return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.back, styles.toptitle]}>
        <TouchableOpacity onPress={() => navigation?.goBack && navigation.goBack()}>
          <View style={styles.backicon}>
            <Image
              source={require('../../assets/images/backarow.png')}
              style={styles.backiconimg}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>
        <View style={styles.pagewrap}>
          <Text style={styles.pagetitle}>Leave Outstanding</Text>
        </View>
        <TouchableOpacity style={styles.rightclick}></TouchableOpacity>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>As on Date</Text>
        <TouchableOpacity style={styles.dateInput} onPress={() => setShowPicker(true)}>
          <Text style={styles.dateText}>{formatDate(date)}</Text>
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onChange}
          />
        )}
      </View>

      <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload} disabled={downloading}>
        {downloading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Image
            source={require('../../assets/images/innerpage/download.png')}
            resizeMode="contain"
          />
        )}
             </TouchableOpacity>

      {/* PDF Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={pdfModalVisible}
        onRequestClose={handleClosePdf}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Leave Outstanding Report</Text>
              <TouchableOpacity onPress={handleClosePdf}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.pdfContainer}>
              {pdfSource && (
                <Pdf
                  source={pdfSource}
                  style={styles.pdfViewer}
                  onError={(error) => {
                    console.log('PDF render error:', error);
                    Alert.alert('Error', 'Failed to display PDF.');
                  }}
                  onLoadComplete={(numberOfPages, filePath) => {
                    console.log(`PDF loaded: ${numberOfPages} pages`);
                  }}
                />
              )}
            </View>
            
            {/* PDF Action Buttons */}
            <View style={styles.pdfActionButtons}>
              <TouchableOpacity style={styles.closeButton} onPress={handleClosePdf}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSavePdf}>
                <Text style={styles.saveButtonText}>Save PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', alignItems: 'center' },
  back: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10 },
  toptitle: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  pagewrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pagetitle: { fontSize: 22, color: '#133F7C' },
  backicon: { marginLeft: 20 },
  backiconimg: { width: 25, height: 25 },
  rightclick: { width: 110 },
  formGroup: { width: '90%', marginBottom: 24, marginTop: 40 },
  label: { fontSize: 16, color: '#343434ff', marginBottom: 8 },
  dateInput: { borderWidth: 0.5, borderColor: '#637b9cff', borderRadius: 8, padding: 12, backgroundColor: '#fff' },
  dateText: { fontSize: 16, color: '#000' },
  downloadBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#cacacaff' },
  pdfActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  closeButton: {
    backgroundColor: '#fce2e5ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.48
  },
  closeButtonText: {
    color: '#7c1313ff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  saveButton: {
    backgroundColor: '#133F7C',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.48
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#E5EEFD',
    borderRadius: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    width: '95%',
    height: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#133F7C',
  },
  modalCloseButton: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  pdfContainer: {
    flex: 1,
    padding: 10,
  },
  pdfViewer: {
    flex: 1,
    backgroundColor: '#fff',
  }
});

export default LeaveOutstandingScreen;
