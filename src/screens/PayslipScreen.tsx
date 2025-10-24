import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, ActivityIndicator, Alert, Platform, Modal, Switch } from 'react-native';
import { getPayslips, downloadPayslipPdf } from '../api/api';
import UserStorage from '../utils/userStorage';
import RNFS from 'react-native-fs';
import Pdf from 'react-native-pdf';
import { Buffer } from 'buffer';
import NotificationService from '../services/NotificationService';

// Add these declarations at the top for web compatibility
// @ts-ignore
// eslint-disable-next-line
declare var window: any;
// @ts-ignore
// eslint-disable-next-line
declare var document: any;

export default function PayslipScreen({ navigation }: { navigation?: any }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [pdfSource, setPdfSource] = useState<{ uri: string } | null>(null);
  const [base64Data, setBase64Data] = useState<string>('');
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [showAllData, setShowAllData] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await UserStorage.getToken();
        if (!token) {
          setError('No authentication token found. Please login again.');
          setLoading(false);
          return;
        }
        const result = await getPayslips(token, showAllData ? "1" : "0");
        setData(Array.isArray(result) ? result : []);
      } catch (err) {
        setError('Failed to fetch payslips');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showAllData]);

  const toggleAccordion = (idx: number) => {
    setOpenIndexes(openIndexes.includes(idx)
      ? openIndexes.filter(i => i !== idx)
      : [...openIndexes, idx]);
  };

  const handleDownload = async (payslipId: number, referenceNo: string) => {
    setDownloadingId(payslipId);
    try {
      await NotificationService.init();

      const token = await UserStorage.getToken();
      if (!token) {
        Alert.alert('No authentication token found. Please login again.');
        setDownloadingId(null);
        return;
      }
      if (Platform.OS === 'web') {
        // On web, fetch blob directly (not base64)
        const response = await fetch('http://216.48.184.187:8081/api/Report/Download', {
          method: 'POST',
          headers: {
            // 'Content-Type': 'application/json', // removed for binary safety
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ ReportCode: 'da6110', Id: payslipId.toString() }),
        });
        if (!response.ok) throw new Error('Failed to download PDF');
        const blob = await response.blob();
        // Type guard for window and document
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Payslip_${referenceNo}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        }
       // Alert.alert('Success', `Payslip ${referenceNo} downloaded.`);
       await NotificationService.showDownloadComplete(`Payslip_${referenceNo}.pdf`, `${RNFS.DownloadDirectoryPath}/Payslip_${referenceNo}.pdf`);
      } else {
        // Mobile: use downloadPayslipPdf from api.tsx
        const base64data = await downloadPayslipPdf('da6110', payslipId.toString(), token);
        console.log('PDF base64 preview (mobile):', base64data.substring(0, 40));
        if (!base64data.startsWith('JVBERi0')) {
          Alert.alert('Warning', 'Invalid PDF file data.');
          return;
        }
        
        // Prepare inline Base64 source for react-native-pdf
        const source = { uri: `data:application/pdf;base64,${base64data}` };
        setPdfSource(source);
        setBase64Data(base64data);
        setPdfModalVisible(true);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to download payslip.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleClosePdf = () => {
    setPdfModalVisible(false);
    setPdfSource(null);
    setBase64Data('');
  };

  const handleSavePdf = async (referenceNo: string) => {
    if (!base64Data) {
      Alert.alert('Error', 'No PDF data to save.');
      return;
    }

    try {
      const fileName = `Payslip_${referenceNo}.pdf`;
      const path =
        Platform.OS === 'android'
          ? `${RNFS.DownloadDirectoryPath}/${fileName}`
          : `${RNFS.DocumentDirectoryPath}/${fileName}`;

      await RNFS.writeFile(path, base64Data, 'base64');
      //Alert.alert('Success', `PDF saved to ${path}`);
      await NotificationService.showDownloadComplete(`Payslip_${referenceNo}.pdf`, `${RNFS.DownloadDirectoryPath}/Payslip_${referenceNo}.pdf`);
    } catch (error) {
      console.error('Error saving PDF:', error);
      Alert.alert('Error', 'Failed to save PDF to device.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#133F7C" />
          <Text style={styles.loadingText}>Loading payslips...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.back, styles.toptitle]}>
        <TouchableOpacity onPress={() => navigation?.goBack && navigation.goBack()}>
          <View style={styles.backicon}>
            <Image source={require('../../assets/images/backarow.png')}
              style={styles.backiconimg} resizeMode="contain" />
          </View>
        </TouchableOpacity>
        <View style={styles.pagewrap}>
          <Text style={styles.pagetitle}>Payslips</Text>
        </View>
        <TouchableOpacity style={styles.rightclick}></TouchableOpacity>
      </View>
      
      {/* Show All Data Switch */}
      <View style={styles.topControlsContainer}>
        <View style={styles.showAllDataContainer}>
          <Text style={styles.showAllDataLabel}>Show all data</Text>
          <View style={styles.switchContainer}>
            <Switch
              value={showAllData}
              onValueChange={setShowAllData}
              trackColor={{ false: '#767577', true: '#133F7C' }}
              thumbColor={showAllData ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {data.length === 0 && <Text style={styles.lbl}>No payslips found.</Text>}
        {data.map((item, idx) => (
          <View key={idx} style={styles.accordion}>
            <TouchableOpacity style={[styles.accordionHeader, openIndexes.includes(idx) ? styles.accordionHeaderOpen : styles.accordionHeaderClosed]}
              onPress={() => toggleAccordion(idx)}>
              <View style={styles.hdrltficn}>
                <Image source={require('../../assets/images/innerpage/payslip.png')} style={[styles.ltficn, styles.star]} resizeMode="contain" />
                <View style={styles.headerContent}>
                  <Text style={styles.accordionTitle}>{item.ReferenceNo}</Text>
                  <Text style={styles.accordionhdrsubtitle}> {item.PayslipType} ({item.Month}, {item.Year})</Text>
                </View>
                {/* <Text style={styles.accordiondate}>{item.TransactionDate}</Text> */}
              </View>
              <View style={styles.rightbtn}>
                <TouchableOpacity
                  style={styles.downloadBtn}
                  onPress={() => handleDownload(item.PayslipId, item.ReferenceNo)}
                  disabled={downloadingId === item.PayslipId}>
                  <View style={styles.dwnloadicon}>
                    <Image source={require('../../assets/images/innerpage/download.png')} style={styles.downloadimage} resizeMode="contain" />
                    {/* <Text style={styles.downloadBtnText}> {downloadingId === item.PayslipId ? 'Downloading...' : 'Download'}</Text> */}
                  </View>
                </TouchableOpacity>
                {/* <Text>{openIndexes.includes(idx) ? '▲' : '▼'}</Text> */}
              </View>
            </TouchableOpacity>
            {openIndexes.includes(idx) && (
              <View style={styles.accordionContent}>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Reference No:</Text>
                  <Text style={styles.vlue}>{item.ReferenceNo}</Text>
                </View>
                <View style={styles.even}>
                  <Text style={styles.lbl}>Transaction Date:</Text>
                  <Text style={styles.vlue}>{item.TransactionDate}</Text>
                </View>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Employee Name:</Text>
                  <Text style={styles.vlue}>{item.EmployeeName}</Text>
                </View>
                <View style={styles.even}>
                  <Text style={styles.lbl}>Payslip Type:</Text>
                  <Text style={styles.vlue}>{item.PayslipType}</Text>
                </View>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Total Earnings:</Text>
                  <Text style={styles.vlue}>{item.TotalEarnings}</Text>
                </View>
                <View style={styles.even}>
                  <Text style={styles.lbl}>Total Deductions:</Text>
                  <Text style={styles.vlue}>{item.ToalDeductions}</Text>
                </View>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Net Amount:</Text>
                  <Text style={styles.vlue}>{item.NetAmount}</Text>
                </View>
                <View style={styles.even}>
                  <Text style={styles.lbl}>Year:</Text>
                  <Text style={styles.vlue}>{item.Year}</Text>
                </View>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Month:</Text>
                  <Text style={styles.vlue}>{item.Month}</Text>
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* PDF Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={pdfModalVisible}
        onRequestClose={handleClosePdf}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payslip Report</Text>
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
              <TouchableOpacity style={styles.saveButton} onPress={() => handleSavePdf(data.find(item => item.PayslipId === downloadingId)?.ReferenceNo || '')}>
                <Text style={styles.saveButtonText}>Save PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  back: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  toptitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 10,
  },
  pagewrap: {
    width: '100%',
    paddingRight: 50,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  pagetitle: {
    fontSize: 22,
    color: '#133F7C',
  },
  backicon: {
    marginLeft: 20,
  },
  backiconimg: {
    width: 25,
    height: 25,
  },
  rightclick: {
    width: 110,
  },
  topControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  showAllDataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  showAllDataLabel: {
    fontSize: 12,
    color: '#333',
    marginRight: 8,
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContainer: {
    padding: 16,
  },
  accordion: {
    borderRadius: 8,
    padding: 0,
    marginBottom: 10,
  },
  hdrltficn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ltficn: {
    width: 15,
    height: 22,
  },
  star: {
    width: 20,
    height: 22,
  },
  headerContent: {
    marginLeft: 5,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
  },
  rightbtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dwnloadicon: {},
    downloadimage: {
    width: 24,
    height: 26,
    },
    accordionHeaderOpen: {
      backgroundColor: '#E2EDFC',
  },
  accordionHeaderClosed: {
    borderColor: '#DEECFF',
    borderWidth: 1,
    borderStyle: 'solid',
  },
  accordionTitle: {
    fontSize: 12,
    marginLeft: 5,
    fontWeight: '600',
  },
  accordiondate: {
    fontSize: 11,
    marginLeft: 12,
    color: 'gray',
  },
  accordionhdrsubtitle: {
    fontSize: 11,
    marginLeft: 1,
    color: 'gray',
  },
  accordionContent: {
    marginTop: 1,
    paddingLeft: 6,
    paddingRight: 6,
  },
  odd: {
    backgroundColor: '#ffffff',
    marginBottom: 5,
    paddingBottom: 2,
    paddingTop: 2,
  },
  even: {
    backgroundColor: '#F1F6FD',
    marginBottom: 5,
    paddingBottom: 2,
    paddingTop: 2,
  },
  lbl: {
    fontSize: 11,
    color: 'gray',
    paddingLeft: 12,
    fontWeight: '600',
  },
  vlue: {
    fontSize: 11,
    color: '#000000',
    paddingLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: '#133F7C',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  errorText: {
    fontSize: 18,
    color: '#FF0000',
    textAlign: 'center',
  },
  downloadBtn: {
    borderRadius: 8,
    marginRight: 10,
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
  },
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
  }
});