import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, ActivityIndicator, Alert, Switch } from 'react-native';
import { getLeaveHistoryData, deleteLeaveRequest } from '../api/api';
import UserStorage from '../utils/userStorage';

export default function LeaveHistoryScreen({ navigation }: { navigation?: any }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
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
        const result = await getLeaveHistoryData(token, showAllData ? "1" : "0");
        setData(Array.isArray(result) ? result : []);
      } catch (err) {
        setError('Failed to fetch data');
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

  const handleDeleteLeaveRequest = async (leaveRegisterId: string) => {
    Alert.alert(
      'Delete Leave Request',
      'Are you sure you want to delete this leave request?',
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
              
              const response = await deleteLeaveRequest(token, leaveRegisterId);
              
              // Check if the response indicates success
              if (response === true || response === 'true' || (response && response.success === true)) {
                Alert.alert('Success', 'Leave request deleted successfully.');
                
                // Refresh the data
                const result = await getLeaveHistoryData(token);
                setData(Array.isArray(result) ? result : []);
              } else {
                Alert.alert('Error', 'Something went wrong. Please try after some time.');
              }
            } catch (error) {
              console.error('Delete leave request error:', error);
              Alert.alert('Error', 'Something went wrong. Please try after some time.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#133F7C" />
          <Text style={styles.loadingText}>Loading leave history...</Text>
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
          <Text style={styles.pagetitle}>Leave History</Text>
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
        <View style={styles.newRequestContainer}>
          <TouchableOpacity style={styles.newRequestButton} onPress={() => navigation.navigate('LeaveRequest')}>
            <Text style={styles.newRequestButtonText}>New Request</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {data.length === 0 && <Text style={styles.lbl}>No data found.</Text>}
        {data.map((item, idx) => (
          <View key={idx} style={styles.accordion}>
            <TouchableOpacity style={[styles.accordionHeader, openIndexes.includes(idx) ? styles.accordionHeaderOpen : styles.accordionHeaderClosed]}
              onPress={() => toggleAccordion(idx)}>
              <View style={styles.hdrltficn}>
                <View style={styles.iconanddetail}>
                  <Image source={require('../../assets/images/innerpage/leaverqst.png')} style={[styles.ltficn, styles.star]} resizeMode="contain" />
                  <View style={styles.headerContent}>
                    <Text style={styles.accordionTitle}>{item.ReferenceNo}</Text>
                    <Text style={styles.dateInfo}>Start date: {item.StrTransactionDateFrom} | End date: {item.StrTransactionDateTo}</Text>
                  </View>
                </View>
                <View>
                  <Text style={[
                    styles.accordionStatus,
                    item.ApprovalStatus === 'Pending' && styles.statusPending,
                    item.ApprovalStatus === 'Progress' && styles.statusProgress,
                    item.ApprovalStatus === 'Approved' && styles.statusApproved,
                    item.ApprovalStatus === 'Rejected' && styles.statusRejected,
                  ]}>{item.ApprovalStatus || 'N/A'}</Text>
                </View>
              </View>
              {/* <Text>{openIndexes.includes(idx) ? '▲' : '▼'}</Text> */}
            </TouchableOpacity>
            {openIndexes.includes(idx) && (
              <View style={styles.accordionContent}>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Leave Reference No:</Text>
                  <Text style={styles.vlue}>{item.ReferenceNo}</Text>
                </View>
                <View style={styles.even}>
                  <Text style={styles.lbl}>Request Date:</Text>
                  <Text style={styles.vlue}>{item.StrTransactionDate}</Text>
                </View>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Rejoin Status:</Text>
                  <Text style={styles.vlue}>{item.StrLeaveType}</Text>
                </View>
                <View style={styles.even}>
                  <Text style={styles.lbl}>Remarks:</Text>
                  <Text style={styles.vlue}>{item.Remarks}</Text>
                </View>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Start Date:</Text>
                  <Text style={styles.vlue}>{item.StrTransactionDateFrom}</Text>
                </View>
                <View style={styles.even}>
                  <Text style={styles.lbl}>End Date:</Text>
                  <Text style={styles.vlue}>{item.StrTransactionDateTo}</Text>
                </View>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Leave Days:</Text>
                  <Text style={styles.vlue}>{item['Leave Count']}</Text>
                </View>
                <View style={styles.even}>
                  <Text style={styles.lbl}>Off or Holidays:</Text>
                  <Text style={styles.vlue}>{item['Off Day Count']}</Text>
                </View>
                {item.EditFlag == 'True' ? (
                <View style={styles.savedLeaveActions}>  
                    {/* <View style={styles.editButtonContainer}>
                  <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('LeaveRequest', { editData: item,type: 'view' })}>
                      <Text style={styles.editIcon}>👁️</Text>
                    </TouchableOpacity>
                   
                  </View> */}
                  <View style={styles.editButtonContainer}>
                    <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('LeaveRequest', { editData: item,type: 'edit' })}>
                      <Text style={styles.editIcon}>✏️</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.editButtonContainer}>
                    <TouchableOpacity style={styles.removeButton} onPress={() => handleDeleteLeaveRequest(item.LeaveRegisterId)}>
                      <Text style={[styles.editIcon, { color: 'red' }]}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                ) : (
                  <View style={styles.savedLeaveActions}>  
                  <View style={styles.editButtonContainer}>
                  <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('LeaveRequest', { editData: item,type: 'view' })}>
                      <Text style={styles.editIcon}>👁️</Text>
                    </TouchableOpacity>
                   
                  </View>
                  </View>
                )}
              </View>

            )}
          </View>
        ))}
      </ScrollView>
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
    marginLeft: 15,
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
  switchText: {
    fontSize: 12,
    color: '#333',
    marginRight: 6,
    fontWeight: '500',
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
  headerContent: {
    marginLeft: 5,
  },
  dateInfo: {
    fontSize: 10,
    color: 'gray',
    marginTop: 2,
  },
  approvalStatus: {
    fontSize: 10,
    color: 'gray',
    marginTop: 2,
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
    fontSize: 12,
    fontWeight: '600',
  },
  accordionStatus: {
    fontSize: 11,
    marginLeft: 5,
    color: 'gray',
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
  newRequestContainer: {
    alignItems: 'flex-end',
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
    removeButton: {
    padding: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#fce2e5ff',
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
});
