import React, { useState, useEffect } from 'react';
import {
  View, Text, Button, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList,
  SafeAreaView, ActivityIndicator, Alert, Modal, TextInput
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import UserStorage from '../utils/userStorage';
import { getApprovals, submitApproval } from '../api/api';

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
                      <Text style={styles.lbl}>Transaction Date: <Text style={styles.vlue}>{item2.TransactionDate ? item2.TransactionDate.split('T')[0] : '-'}</Text></Text>
                      <Text style={styles.lbl}>Decision Level: <Text style={styles.vlue}>{item2.DecisionLevel ?? '-'}</Text></Text>
                    </View>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.viewBtn} 
                        onPress={() => openViewModal(item2.DecisionId || '0')}
                      >
                        <Text style={styles.viewBtnText}>View</Text>
                      </TouchableOpacity>
                      {item2.ReportFlag === 1 && (
                        <TouchableOpacity style={styles.downloadBtn} onPress={() => {/* TODO: implement download logic */ }}>
                          <View style={styles.dwnloadicon}>
                            <Image source={require('../../assets/images/innerpage/download.png')} style={styles.downloadimage} resizeMode="contain" />
                            {/* <Text style={styles.downloadBtnText}> {downloadingId === item.PayslipId ? 'Downloading...' : 'Download'}</Text> */}
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
                style={[styles.modalButton, styles.acceptButton]}
                onPress={() => submitDecision('1')}
                disabled={submitting}
              >
                <Text style={styles.modalButtonText}>
                  {submitting ? 'Submitting...' : 'Accept'}
                </Text>
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
                style={[styles.modalButton, styles.closeButton]}
                onPress={closeModal}
                disabled={submitting}
              >
                <Text style={styles.modalButtonText}>Close</Text>
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
  dwnloadicon: {},
    downloadimage: {
    width: 16,
    height: 18,
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
    backgroundColor: '#ffffff',
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
});