import React, { useState, useEffect } from 'react';
import {
  View, Text, Button, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList,
  SafeAreaView, ActivityIndicator, Alert, Modal, TextInput, Platform
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import RNFS from 'react-native-fs';
import Pdf from 'react-native-pdf';
import { Buffer } from 'buffer';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import UserStorage from '../utils/userStorage';
import { getApprovals, submitApproval, downloadPayslipPdf } from '../api/api';

// Add these declarations at the top for web compatibility
// @ts-ignore
// eslint-disable-next-line
declare var window: any;
// @ts-ignore
// eslint-disable-next-line
declare var document: any;

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function ApprovalsScreen({ navigation }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [pdfSource, setPdfSource] = useState<{ uri: string } | null>(null);
  const [base64Data, setBase64Data] = useState<string>('');
  const [pdfModalVisible, setPdfModalVisible] = useState(false);

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
        const result = await getApprovals(token);
        setData(result);
      } catch (err) {
        setError('Failed to fetch approvals');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleAccordion = (idx: number) => {
    setOpenIndexes(openIndexes.includes(idx)
      ? openIndexes.filter(i => i !== idx)
      : [...openIndexes, idx]);
  };

  const openViewModal = (decisionId: string) => {
    setSelectedDecisionId(decisionId);
    setRemarks('');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedDecisionId('');
    setRemarks('');
  };

  const submitDecision = async (decision: string) => {
    if (!remarks.trim()) {
      Alert.alert('Error', 'Please enter remarks before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await UserStorage.getToken();
      if (!token) {
        Alert.alert('Error', 'No authentication token found. Please login again.');
        return;
      }

      const result = await submitApproval(selectedDecisionId, decision, remarks, token);

      if (result.success) {
        Alert.alert(
          'Success', 
          `Request ${decision === '1' ? 'approved' : 'rejected'} successfully.`,
          [{ text: 'OK', onPress: () => {
            closeModal();
            // Refresh the data
            const fetchData = async () => {
              try {
                const token = await UserStorage.getToken();
                if (token) {
                  const result = await getApprovals(token);
                  setData(result);
                }
              } catch (err) {
                console.error('Failed to refresh data:', err);
              }
            };
            fetchData();
          }}]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to submit decision.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit decision. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (transactionId: number, referenceNo: string) => {
    setDownloadingId(transactionId);
    try {
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
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ ReportCode: 'Da5010_APP', Id: transactionId.toString() }),
        });
        if (!response.ok) throw new Error('Failed to download PDF');
        const blob = await response.blob();
        // Type guard for window and document
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Approval_${referenceNo}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        }
        Alert.alert('Success', `Approval document ${referenceNo} downloaded.`);
      } else {
        // Mobile: use downloadPayslipPdf from api.tsx with custom ReportCode
        const base64data = await downloadPayslipPdf('Da5010_APP', transactionId.toString(), token);
        console.log('PDF base64 preview (mobile):', base64data.substring(0, 40));
        console.log('PDF base64 length:', base64data.length);
        if (!base64data.startsWith('JVBERi0')) {
          Alert.alert('Warning', 'Invalid PDF file data.');
          return;
        }
        
        // Prepare inline Base64 source for react-native-pdf
        const source = { uri: `data:application/pdf;base64,${base64data}` };
        console.log('PDF source URI:', source.uri.substring(0, 50) + '...');
        setPdfSource(source);
        setBase64Data(base64data);
        setPdfModalVisible(true);
        console.log('PDF modal should be visible now');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to download approval document.');
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
      const fileName = `Approval_${referenceNo}.pdf`;
      const path =
        Platform.OS === 'android'
          ? `${RNFS.DownloadDirectoryPath}/${fileName}`
          : `${RNFS.DocumentDirectoryPath}/${fileName}`;

      await RNFS.writeFile(path, base64Data, 'base64');
      Alert.alert('Success', `PDF saved to ${path}`);
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
          <Text style={styles.loadingText}>Loading approvals...</Text>
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <View style={styles.backicon}>
            <Image source={require('../../assets/images/backarow.png')}
              style={styles.backiconimg} resizeMode="contain" />
          </View>
        </TouchableOpacity>
        <View style={styles.pagewrap}>
          <Text style={styles.pagetitle}>Approvals</Text>
        </View>
        <TouchableOpacity style={styles.rightclick}></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {Array.isArray(data?.Item1) && data.Item1.length === 0 && <Text style={styles.lbl}>No approvals found.</Text>}
        {Array.isArray(data?.Item1) && data.Item1.map((item1: any, idx: number) => (
          <View key={idx} style={styles.accordion}>
            <TouchableOpacity style={[styles.accordionHeader, openIndexes.includes(idx) ? styles.accordionHeaderOpen : styles.accordionHeaderClosed]}
              onPress={() => toggleAccordion(idx)}>
              <View style={styles.hdrltficn}>
                <Image source={require('../../assets/images/innerpage/aproval.png')} style={[styles.ltficn, styles.star]} resizeMode="contain" />
                <Text style={styles.accordionTitle}>{item1.MenuDisplayName} ({item1.RecordCount})</Text>
              </View>
              {/* <Text>{openIndexes.includes(idx) ? '▲' : '▼'}</Text> */}
            </TouchableOpacity>
            {openIndexes.includes(idx) && (
              <View style={styles.accordionContent}>
                {Array.isArray(data?.Item2) && data.Item2.filter((item2: any) => item2.PageName === item1.PageName).length === 0 && (
                  <Text style={styles.lbl}>No records found.</Text>
                )}
                {Array.isArray(data?.Item2) && data.Item2.filter((item2: any) => item2.PageName === item1.PageName).map((item2: any, jdx: number) => (
                  <View key={jdx} style={jdx % 2 === 0 ? styles.odd : styles.even}>
                    <View>
                      <Text style={styles.lbl}>Reference No: <Text style={styles.vlue}>{item2.ReferenceNo || '-'}</Text></Text>
                      <Text style={styles.lbl}>Requested By: <Text style={styles.vlue}>{item2.EmpNo || '-'} {item2.EmployeeName || ''}</Text></Text>
                      <Text style={styles.lbl}>Transaction Date: <Text style={styles.vlue}>{item2.TransactionDate ? item2.TransactionDate.split('T')[0] : '-'}</Text></Text>
                      <Text style={styles.lbl}>Request Details: <Text style={styles.vlue}>{item2.Description ?? ' '}</Text></Text>
                      <Text style={styles.lbl}>Approval level: <Text style={styles.vlue}>{item2.DecisionLevel ?? '-'}</Text></Text>
                    </View>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.moreBtn} 
                        onPress={() => openViewModal(item2.DecisionId || '0')}
                      >
                         <View style={styles.dwnloadicon}>
                            <Image source={require('../../assets/images/innerpage/clicktoopen.png')} style={styles.downloadimage} resizeMode="contain" />
                            {/* <Text style={styles.downloadBtnText}> {downloadingId === item.PayslipId ? 'Downloading...' : 'Download'}</Text> */}
                          </View>
                        {/* <MaterialIcons name="more-vert" size={24} color="#133F7C" /> */}
                      </TouchableOpacity>
                      {item2.ReportFlag === 1 && (
                        <TouchableOpacity 
                          style={styles.downloadBtn} 
                          onPress={() => handleDownload(item2.TransactionId, item2.ReferenceNo)}
                          disabled={downloadingId === item2.TransactionId}
                        >
                          <View style={styles.dwnloadicon}>
                            <Image source={require('../../assets/images/innerpage/download.png')} style={styles.downloadimage} resizeMode="contain" />
                            {/* <Text style={styles.downloadBtnText}> {downloadingId === item2.TransactionId ? 'Downloading...' : 'Download'}</Text> */}
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Modal for Approval/Rejection */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Approval Decision</Text>
            
            <Text style={styles.modalLabel}>Remarks *</Text>
            <TextInput
              style={styles.remarksInput}
              placeholder="Enter your remarks..."
              value={remarks}
              onChangeText={setRemarks}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>

            <TouchableOpacity
                style={[styles.modalButton, styles.closeButton]}
                onPress={closeModal}
                disabled={submitting}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
          

              <TouchableOpacity
                style={[styles.modalButton, styles.rejectButton]}
                onPress={() => submitDecision('2')}
                disabled={submitting}
              >
                <Text style={styles.modalButtonText}>
                  {submitting ? 'Submitting...' : 'Reject'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.acceptButton]}
                onPress={() => submitDecision('1')}
                disabled={submitting}
              >
                <Text style={styles.modalButtonText}>
                  {submitting ? 'Submitting...' : 'Accept'}
                </Text>
              </TouchableOpacity>
           
            </View>
          </View>
        </View>
      </Modal>

      {/* PDF Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={pdfModalVisible}
        onRequestClose={handleClosePdf}>
        <View style={styles.modalOverlay}>
          <View style={styles.pdfModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Approval Document</Text>
              <TouchableOpacity onPress={handleClosePdf}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.pdfContainer}>
              {pdfSource ? (
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
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text>Loading PDF...</Text>
                </View>
              )}
            </View>
            
            {/* PDF Action Buttons */}
            <View style={styles.pdfActionButtons}>
              <TouchableOpacity style={styles.pdfCloseButton} onPress={handleClosePdf}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={() => handleSavePdf(data?.Item2?.find((item: any) => item.TransactionId === downloadingId)?.ReferenceNo || '')}>
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
  clpsclick: {
    backgroundColor: '#E2EDFC',
    borderRadius: 20,
    width: 110,
    padding: 6,
    paddingLeft: 8,
    paddingRight: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clpsclicktxt: {
    color: '#000000',
    fontSize: 14,
  },
  scrollContainer: {
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
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
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
  },
  accordionHeaderOpen: {
    backgroundColor: '#E2EDFC',
  },
  dwnloadicon: {
    marginLeft: 15,
  },
    downloadimage: {
    width: 24,
    height: 26,
    },
  accordionHeaderClosed: {
    borderColor: '#DEECFF',
    borderWidth: 1,
    borderStyle: 'solid',
  },
  accordionTitle: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: '600',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  even: {
    backgroundColor: '#F1F6FD',
    marginBottom: 5,
    paddingBottom: 2,
    paddingTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moreBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  viewBtn: {
    backgroundColor: '#133F7C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  viewBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
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
    paddingRight: 6,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#E2EDFC',
    borderRadius: 10,
    padding: 20,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#133F7C',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  remarksInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 14,
    minHeight: 80,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#28a745',
  },
  rejectButton: {
    backgroundColor: '#dc3545',
  },
  closeButton: {
    backgroundColor: '#6c757d',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  // PDF Modal styles
  pdfModalContent: {
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
  pdfCloseButton: {
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
});