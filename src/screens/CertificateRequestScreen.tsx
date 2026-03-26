import React, { useState, useEffect } from 'react';
import {
  View, Text, Button, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList,
  SafeAreaView, ActivityIndicator, Alert, Modal, TextInput, Platform, Switch
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import UserStorage from '../utils/userStorage';
import { getCertificateRequests, getCertificateTypes, getCertificateDetails, saveCertificateRequest } from '../api/api';
import { AppColors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function CertificateRequestScreen({ navigation }: Props) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCertificateId, setEditingCertificateId] = useState<string>('');
  const [newRequest, setNewRequest] = useState({
    referenceNo: '',
    requestedDate: new Date(),
    certificateType: ''
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCertificateDropdown, setShowCertificateDropdown] = useState(false);
  const [certificateTypeModalVisible, setCertificateTypeModalVisible] = useState(false);
  const [selectedCertificateType, setSelectedCertificateType] = useState('');
  const [certificateTypes, setCertificateTypes] = useState<any[]>([]);
  const [loadingCertificateTypes, setLoadingCertificateTypes] = useState(false);
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
        const result = await getCertificateRequests(token, showAllData ? "1" : "0");
        setData(Array.isArray(result) ? result : []);
      } catch (err) {
        setError('Failed to fetch certificate requests');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showAllData]);

  const toggleAccordion = (idx: number) => {
    setOpenIndexes(openIndexes.includes(idx)
      ? [] // Close all accordions if the clicked one is already open
      : [idx]); // Open only the clicked accordion, closing all others
  };

  const handleNewRequest = () => {
    setIsEditMode(false);
    // Generate new reference number for new requests
    setNewRequest({
      referenceNo: '',
      requestedDate: new Date(),
      certificateType: ''
    });
    setSelectedCertificateType('');
    setModalVisible(true);
    fetchCertificateTypes(); // Fetch certificate types when modal opens
  };

  const handleSubmitRequest = async () => {
    try {
      // Validate form data
      if (!newRequest.certificateType) {
        Alert.alert('Error', 'Please select a certificate type.');
        return;
      }

      const token = await UserStorage.getToken();
      if (!token) {
        Alert.alert('Error', 'No authentication token found. Please login again.');
        return;
      }

      // Format date to YYYY-MM-DD format
      const year = newRequest.requestedDate.getFullYear();
      const month = String(newRequest.requestedDate.getMonth() + 1).padStart(2, '0');
      const day = String(newRequest.requestedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      // Determine mode and certificate ID
      const mode = isEditMode ? 'U' : 'I';
      const certificateId = isEditMode ? editingCertificateId : '0';

      // Make API call
      const response = await saveCertificateRequest(
        mode,
        certificateId,
        newRequest.certificateType,
        formattedDate,
        token
      );

      // Check response
      if (response && response.length > 0 && response[0].Status === 'Success') {
        const message = isEditMode ? 'Certificate request updated successfully!' : 'Certificate request submitted successfully!';
        Alert.alert('Success', message);
        setModalVisible(false);
        resetForm();

        // Refresh the certificate requests list
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
            const result = await getCertificateRequests(token, showAllData ? "1" : "0");
            setData(Array.isArray(result) ? result : []);
          } catch (err) {
            setError('Failed to fetch certificate requests');
          } finally {
            setLoading(false);
          }
        };
        fetchData();
      } else {
        Alert.alert('Error', 'Failed to save certificate request. Please try again.');
      }
    } catch (error) {
      console.error('Error saving certificate request:', error);
      Alert.alert('Error', 'Failed to save certificate request. Please try again.');
    }
  };

  const handleDeleteRequest = async () => {
    try {
      // Show confirmation dialog
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete this certificate request?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const token = await UserStorage.getToken();
                if (!token) {
                  Alert.alert('Error', 'No authentication token found. Please login again.');
                  return;
                }

                // Make API call with Mode "D"
                const response = await saveCertificateRequest(
                  'D',
                  editingCertificateId,
                  newRequest.certificateType,
                  '2025-01-01', // Dummy date for delete operation
                  token
                );

                // Check response
                if (response && response.length > 0 && response[0].Status === 'Success') {
                  Alert.alert('Success', 'Certificate request deleted successfully!');
                  setModalVisible(false);
                  resetForm();

                  // Refresh the certificate requests list
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
                      const result = await getCertificateRequests(token, showAllData ? "1" : "0");
                      setData(Array.isArray(result) ? result : []);
                    } catch (err) {
                      setError('Failed to fetch certificate requests');
                    } finally {
                      setLoading(false);
                    }
                  };
                  fetchData();
                } else {
                  Alert.alert('Error', 'Failed to delete certificate request. Please try again.');
                }
              } catch (error) {
                console.error('Error deleting certificate request:', error);
                Alert.alert('Error', 'Failed to delete certificate request. Please try again.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error in delete confirmation:', error);
    }
  };

  const handleCancelRequest = () => {
    setModalVisible(false);
    setCertificateTypeModalVisible(false);
    resetForm();
  };

  const resetForm = () => {
    setNewRequest({
      referenceNo: '',
      requestedDate: new Date(),
      certificateType: ''
    });
    setSelectedCertificateType('');
    setIsEditMode(false);
    setEditingCertificateId('');
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event?.type === 'set' && selectedDate) {
      setNewRequest((prev) => ({ ...prev, requestedDate: selectedDate }));
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const closeCertificateTypePicker = () => {
    setCertificateTypeModalVisible(false);
  };

  const handleOpenCertificateTypeModal = () => {
    setCertificateTypeModalVisible(true);
  };

  /** iOS does not reliably support a second Modal on top of the certificate form Modal (hangs / blank). Render picker as an overlay inside the same modal. */
  const renderCertificateTypePickerOverlay = () => {
    if (!certificateTypeModalVisible || !modalVisible) {
      return null;
    }
    return (
      <View style={styles.nestedPickerOverlay}>
        <TouchableOpacity
          style={styles.nestedPickerBackdrop}
          activeOpacity={1}
          onPress={closeCertificateTypePicker}
          accessibilityRole="button"
          accessibilityLabel="Dismiss picker"
        />
        <View style={styles.nestedPickerCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Certificate Type</Text>
            <TouchableOpacity onPress={closeCertificateTypePicker}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            style={styles.modalBody}
            data={certificateTypes}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                activeOpacity={0.7}
                onPress={() => handleCertificateTypeSelect(item)}>
                <Text style={styles.dropdownItemText}>{item.CertificateName}</Text>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={true}
            ListEmptyComponent={
              <View style={styles.dropdownItem}>
                <Text style={styles.dropdownItemText}>
                  {loadingCertificateTypes ? 'Loading...' : 'No certificate types available'}
                </Text>
              </View>
            }
          />
        </View>
      </View>
    );
  };

  const handleCertificateTypeSelect = (type: any) => {
    setSelectedCertificateType(type.CertificateName);
    setNewRequest((prev) => ({ ...prev, certificateType: type.ReportId.toString() }));
    closeCertificateTypePicker();
  };

  const handleEditRequest = async (item: any) => {
    try {
      const token = await UserStorage.getToken();
      if (!token) {
        Alert.alert('Error', 'No authentication token found. Please login again.');
        return;
      }

      // Fetch certificate details
      const certificateDetails = await getCertificateDetails(item.CertificateId.toString(), token);

      if (certificateDetails && certificateDetails.length > 0) {
        const details = certificateDetails[0];

        // Parse the date string to Date object (dd-MMM-yyyy format)
        const dateParts = details.RequestedDate.split('-');
        const day = parseInt(dateParts[0]);
        const monthStr = dateParts[1]; // e.g., "Jul"
        const year = parseInt(dateParts[2]);

        // Convert month abbreviation to month number (0-indexed)
        const monthMap: { [key: string]: number } = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        const month = monthMap[monthStr] || 0;

        const requestedDate = new Date(year, month, day);

        // Set form data
        setNewRequest({
          referenceNo: item.ReferenceNo,
          requestedDate: requestedDate,
          certificateType: details.CertificateTypeId.toString()
        });

        // Find and set the certificate type name for display
        const certificateType = certificateTypes.find(type => type.ReportId === details.CertificateTypeId);
        if (certificateType) {
          setSelectedCertificateType(certificateType.CertificateName);
        }

        // Store the certificate ID for update operations
        setEditingCertificateId(item.CertificateId.toString());

        // Open modal in edit mode
        setIsEditMode(true);
        setModalVisible(true);

        // Fetch certificate types if not already loaded
        if (certificateTypes.length === 0) {
          fetchCertificateTypes();
        }
      } else {
        Alert.alert('Error', 'No certificate details found.');
      }
    } catch (error) {
      console.error('Error fetching certificate details:', error);
      Alert.alert('Error', 'Failed to fetch certificate details.');
    }
  };

  const fetchCertificateTypes = async () => {
    setLoadingCertificateTypes(true);
    try {
      const token = await UserStorage.getToken();
      if (!token) {
        console.error('No authentication token found');
        setCertificateTypes([]);
        return;
      }

      const data = await getCertificateTypes(token);
      setCertificateTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching certificate types:', error);
      setCertificateTypes([]);
    } finally {
      setLoadingCertificateTypes(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#133F7C" />
          <Text style={styles.loadingText}>Loading certificate requests...</Text>
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
          <Text style={styles.pagetitle}>Certificate Requests</Text>
        </View>
        <TouchableOpacity style={styles.rightclick}></TouchableOpacity>
      </View>

      {/* Show All Data Switch and New Request Button */}
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
        <View style={styles.newRequestContainer}>
          <TouchableOpacity style={styles.newRequestButton} onPress={handleNewRequest}>
            <Text style={styles.newRequestButtonText}>New Request</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {data.length === 0 && <Text style={styles.lbl}>No certificate requests found.</Text>}
        {data.map((item, idx) => (
          <View key={idx} style={styles.accordion}>
            <TouchableOpacity style={[styles.accordionHeader, openIndexes.includes(idx) ? styles.accordionHeaderOpen : styles.accordionHeaderClosed]}
              onPress={() => toggleAccordion(idx)}>
              <View style={styles.hdrltficn}>
                <View style={styles.iconanddetail}>
                  <Image source={require('../../assets/images/innerpage/Certificate.png')} style={[styles.ltficn, styles.star]} resizeMode="contain" />
                  <Text style={styles.accordionTitle}>{item.ReferenceNo}</Text>
                  <Text style={styles.accordiondate}>{item.RequestedDate}</Text>
                </View>
                <View>
                  <Text style={[
                    styles.accordionStatus,
                    item.ApprovalStatus === 'Pending' && styles.statusPending,
                    item.ApprovalStatus === 'Progress' && styles.statusProgress,
                    item.ApprovalStatus === 'Approved' && styles.statusApproved,
                    item.ApprovalStatus === 'Rejected' && styles.statusRejected,
                  ]}>{item.ApprovalStatus}</Text>
                </View>
              </View>
              {/* <Text>{openIndexes.includes(idx) ? '▲' : '▼'}</Text> */}
            </TouchableOpacity>
            {openIndexes.includes(idx) && (
              <View style={styles.accordionContent}>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Reference No:</Text>
                  <Text style={styles.vlue}>{item.ReferenceNo}</Text>
                </View>
                <View style={styles.even}>
                  <Text style={styles.lbl}>Requested Date:</Text>
                  <Text style={styles.vlue}>{item.RequestedDate}</Text>
                </View>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Certificate Type:</Text>
                  <Text style={styles.vlue}>{item.CertificateType}</Text>
                </View>
                <View style={styles.even}>
                  <Text style={styles.lbl}>Approval Status:</Text>
                  <Text style={styles.vlue}>{item.ApprovalStatus}</Text>
                </View>
                {item.ApprovalStatus === 'Pending' && (
                  <View style={styles.savedLeaveActions}>
                    <View style={styles.editButtonContainer}>
                      <TouchableOpacity style={styles.editButton} onPress={() => handleEditRequest(item)}>
                        <Text style={styles.editIcon}>✏️</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.editButtonContainer}>
                      <TouchableOpacity style={styles.removeButton}>
                        <Text style={[styles.editIcon, { color: 'red' }]}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* New Request Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setCertificateTypeModalVisible(false);
          setModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditMode ? 'Edit Certificate Request' : 'New Certificate Request'}
              </Text>
              <TouchableOpacity onPress={handleCancelRequest}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Reference No:</Text>
                <TextInput
                  style={[styles.textInput, styles.readonlyInput]}
                  value={newRequest.referenceNo}
                  editable={false}
                  placeholder="Auto-generated reference number"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Requested Date:</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={showDatePickerModal}>
                  <Text style={styles.datePickerButtonText}>
                    {newRequest.requestedDate.toLocaleDateString().replace(/\//g, '-')}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={newRequest.requestedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                  />
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Certificate Type:</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={handleOpenCertificateTypeModal}
                  disabled={loadingCertificateTypes}>
                  <Text style={styles.dropdownButtonText}>
                    {loadingCertificateTypes ? 'Loading...' : (selectedCertificateType || 'Select certificate type')}
                  </Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelRequest}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              {isEditMode && (
                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteRequest}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmitRequest}>
                <Text style={styles.submitButtonText}>
                  {isEditMode ? 'Update' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {renderCertificateTypePickerOverlay()}
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
    color: AppColors.primary,
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
    width: '100%',
  },
  iconanddetail: {
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
  accordiondate: {
    fontSize: 11,
    marginLeft: 5,
    color: 'gray',
  },
  accordionStatus: {
    fontSize: 11,

    marginLeft: 5,
    color: 'gray',
    // fontWeight: '500',
  },
  statusPending: {
    color: '#DAA520', // Dark yellow
  },
  statusProgress: {
    color: '#FF8C00', // Orange
  },
  statusApproved: {
    color: '#228B22', // Green
  },
  statusRejected: {
    color: '#DC143C', // Red
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
    color: '#133F7C',
    fontSize: 18,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 18,
    textAlign: 'center',
  },
  newRequestContainer: {
    alignItems: 'flex-end',
    marginTop: 10,
    marginBottom: 10,
    paddingRight: 16,
  },
  newRequestButton: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: .5,
    borderColor: '#90a4c3ff',
  },
  newRequestButtonText: {
    color: '#133F7C',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.overlay,
    position: 'relative',
  },
  nestedPickerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  nestedPickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AppColors.overlaySoft,
  },
  nestedPickerCard: {
    backgroundColor: AppColors.surfaceSoft,
    borderRadius: 12,
    width: '90%',
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 1001,
    overflow: 'hidden',
  },
  modalContent: {
    backgroundColor: AppColors.surfaceSoft,
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
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
    fontSize: 17,
    color: AppColors.primary,
  },
  closeButton: {
    fontSize: 20,
    color: AppColors.danger,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    color: '#333',
    marginBottom: 5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: AppColors.surface,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 10,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: AppColors.surface,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffffff',
  },
  dropdownButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  dropdownListwrap: {
    padding: 5,
    paddingTop: 2,
  },
  dropdownList: {
    borderRadius: 0,
    marginTop: 1,
    padding: 0,
    paddingTop: 0,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#e3e6ffff',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    minHeight: 44,
    justifyContent: 'center',
  },
  dropdownItems: {
    borderColor: '#e3e6ffff',
    padding: 10,
    borderBottomWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  dropdownItemText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  readonlyInput: {
    backgroundColor: '#F5F5F5',
    color: '#666',
  },
  accordionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  removeButton: {
    padding: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#ffecefff',
    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  editButton: {
    padding: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#bdd8fdff',
    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  editIcon: {
    fontSize: 12,
  },
  savedLeaveActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editButtonContainer: {
    alignItems: 'flex-end',
    marginTop: 10,
    paddingRight: 10,
  },
  editButtonText: {
    fontSize: 14,
    color: '#133F7C',
    marginLeft: 5,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: AppColors.warning,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  submitButtonText: {
    color: AppColors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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
    marginHorizontal: 10,
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
});