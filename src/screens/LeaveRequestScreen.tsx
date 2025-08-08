import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, ActivityIndicator, FlatList, Modal, TextInput, Switch, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getMesseges, fetchMessageCategories, fetchSelectTypes, saveMessage, fetchMessageForEdit, fetchLeaveData, calculateLeaveDays, saveLeaveRequest, saveAllLeaves, fetchLeaveEditData } from '../api/api';
import UserStorage from '../utils/userStorage';

type Props = NativeStackScreenProps<RootStackParamList, 'LeaveRequest'>;

export default function LeaveRequestScreen({ navigation, route }: Props) {
  const [leaveReferenceNo, setLeaveReferenceNo] = useState('LR-2024-001');
  const [requestDate, setRequestDate] = useState('');
  const [rejoinStatus, setRejoinStatus] = useState('OPEN');
  const [remarks, setRemarks] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [leaveData, setLeaveData] = useState<any>(null);
  const [selectedLeaveType, setSelectedLeaveType] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startHD, setStartHD] = useState(false);
  const [endHD, setEndHD] = useState(false);
  const [leaveDays, setLeaveDays] = useState('0');
  const [holidays, setHolidays] = useState('0');
  const [leaveDropdownOpen, setLeaveDropdownOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [savedLeaves, setSavedLeaves] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [showValidationMessage, setShowValidationMessage] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  // Check if we're in edit mode and populate form with edit data
  useEffect(() => {
    if (route.params?.editData) {
      const data = route.params.editData;
      setEditData(data);
      setIsEditMode(true);
      
      // Populate form fields with edit data
      setLeaveReferenceNo(data.ReferenceNo || '');
      setRequestDate(data.StrTransactionDate || '');
      setRejoinStatus(data.StrLeaveType || 'OPEN');
      setRemarks(data.Remarks || '');
      // setStartDate(data.StrTransactionDateFrom || '');
      // setEndDate(data.StrTransactionDateTo || '');
      // setLeaveDays(data['Leave Count']?.toString() || '0');
      // setHolidays(data['Off Day Count']?.toString() || '0');
      
      console.log('Edit mode activated with data:', data);
      
      // Fetch detailed leave data for editing
      fetchDetailedLeaveData(data.LeaveRegisterId);
    }
  }, [route.params]);

  // Function to fetch detailed leave data for editing
  const fetchDetailedLeaveData = async (leaveRegisterId: string) => {
    try {
      const token = await UserStorage.getToken();
      if (token && leaveRegisterId) {
        console.log('Fetching detailed leave data for LeaveRegisterId:', leaveRegisterId);
        const response = await fetchLeaveEditData(token, leaveRegisterId);
        console.log('Detailed leave data response:', response);
        
        if (response && response.Da5011List && Array.isArray(response.Da5011List)) {
          // Map the Da5011List data to savedLeaves format
          const mappedLeaves = response.Da5011List.map((item: any) => ({
            id: item.LeaveRegisterDtlsId?.toString() || '',
            leaveType: item.PayHeadName || '',
            startDate:  item.StrLeaveStartDate || '',
            endDate: item.StrLeaveEndDate || '',
            leaveDays: item.DayCount?.toString() || '0',
            holidays: item.offCount?.toString() || '0',
            payHeadId: item.FkPayHeadId || 0,
            startHD: item.HalfDayStartDate === 1,
            endHD: item.HalfDayEndDate === 1
          }));
          
          setSavedLeaves(mappedLeaves);
          console.log('Mapped leaves for editing:', mappedLeaves);
        }
      }
    } catch (error) {
      console.error('Error fetching detailed leave data:', error);
    }
  };

  // Debug: Log when isCalculating changes
  useEffect(() => {
    console.log('isCalculating changed to:', isCalculating);
  }, [isCalculating]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setRequestDate(selectedDate.toISOString().split('T')[0]); // Format as YYYY-MM-DD
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const handleRightUndoPress = async () => {
    try {
      const token = await UserStorage.getToken();
      if (token) {
        const result = await fetchLeaveData(token);
        setLeaveData(result);
        setPopupVisible(true);
      }
    } catch (error) {
      console.error('Error fetching leave data:', error);
    }
  };

  const handlePopupClose = () => {
    setPopupVisible(false);
    setLeaveData(null);
    setSelectedLeaveType(null);
    setStartDate('');
    setEndDate('');
    setStartHD(false);
    setEndHD(false);
    setLeaveDays('0');
    setHolidays('0');
    setIsCalculating(false);
    setEditingLeaveId(null);
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setStartDate(formattedDate);
      // Use the new formattedDate instead of startDate state
      calculateLeaveDaysAndHolidays(formattedDate, endDate, startHD, endHD);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setEndDate(formattedDate);
      // Use the new formattedDate instead of endDate state
      calculateLeaveDaysAndHolidays(startDate, formattedDate, startHD, endHD);
    }
  };

  const handleStartHDChange = (value: boolean) => {
    setStartHD(value);
    // Use the new value instead of startHD state
    calculateLeaveDaysAndHolidays(startDate, endDate, value, endHD);
  };

  const handleEndHDChange = (value: boolean) => {
    setEndHD(value);
    // Use the new value instead of endHD state
    calculateLeaveDaysAndHolidays(startDate, endDate, startHD, value);
  };

  const calculateLeaveDaysAndHolidays = async (start: string, end: string, startHD: boolean, endHD: boolean) => {
    console.log('calculateLeaveDaysAndHolidays called with:', { start, end, startHD, endHD });
    
    // Always set calculating to true when function is called
    setIsCalculating(true);
    
    if (start && end && start <= end) {
      try {
        const token = await UserStorage.getToken();
        if (token) {
          // Convert dates to DD-MMM-YYYY format
          const startDateFormatted = formatDateForAPI(start);
          const endDateFormatted = formatDateForAPI(end);
          
          console.log('Calling API with:', { startDateFormatted, endDateFormatted, startHD, endHD });
          const result = await calculateLeaveDays(token, startDateFormatted, endDateFormatted, startHD, endHD);
          
          if (Array.isArray(result) && result.length >= 2) {
            setLeaveDays(result[0].toString());
            setHolidays(result[1].toString());
          }
        }
      } catch (error) {
        console.error('Error calculating leave days:', error);
        setLeaveDays('0');
        setHolidays('0');
      } finally {
        setIsCalculating(false);
      }
    } else {
      console.log('Condition not met, setting to 0');
      setLeaveDays('0');
      setHolidays('0');
      setIsCalculating(false);
    }
  };

  const formatDateForAPI = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const showStartDatePickerModal = () => {
    setShowStartDatePicker(true);
  };

  const showEndDatePickerModal = () => {
    setShowEndDatePicker(true);
  };

  const validateLeaveData = () => {
    if (!selectedLeaveType) {
      return 'Please select a leave type';
    }
    if (!startDate) {
      return 'Please select start date';
    }
    if (!endDate) {
      return 'Please select end date';
    }
    if (startDate > endDate) {
      return 'Start date cannot be after end date';
    }
    if (parseInt(leaveDays) <= 0) {
      return 'Please select valid dates to calculate leave days';
    }
    
    // Check if start date is greater than previously saved end dates
    if (savedLeaves.length > 0) {
      // Find the latest end date from all saved leaves
      const latestEndDate = savedLeaves.reduce((latest, leave) => {
        const currentEndDate = new Date(leave.endDate);
        const latestDate = new Date(latest);
        return currentEndDate > latestDate ? leave.endDate : latest;
      }, savedLeaves[0].endDate);
      
      // Compare dates
      const newStartDate = new Date(startDate);
      const latestEnd = new Date(latestEndDate);
      
      if (newStartDate <= latestEnd) {
        return `Start date must be after ${latestEndDate} (last saved leave end date)`;
      }
    }
    
    return null;
  };

  const handleSaveLeave = async () => {
    // Skip validation if we're updating an existing leave (editingLeaveId is set)
    if (!editingLeaveId) {
      const validationError = validateLeaveData();
      if (validationError) {
        setValidationMessage(validationError);
        setShowValidationMessage(true);
        setTimeout(() => setShowValidationMessage(false), 3000);
        return;
      }
    }

    setIsSaving(true);
    try {
      const token = await UserStorage.getToken();
      if (token && selectedLeaveType !== null) {
        const leaveRequestData = {
          Da5011List: [
            {
              LeaveRegisterDtlsId: "0",
              FkPayHeadId: selectedLeaveType.toString(),
              LeaveStartDate: formatDateForAPI(startDate),
              LeaveEndDate: formatDateForAPI(endDate),
              HalfDayStartDate: startHD ? "1" : "0",
              HalfDayEndDate: endHD ? "1" : "0",
              DayCount: leaveDays,
              offCount: holidays
            }
          ]
        };

        console.log('Saving leave request:', leaveRequestData);
        const result = await saveLeaveRequest(token, leaveRequestData);

        if (result?.Table && result.Table.length > 0) {
          const response = result.Table[0];
          if (response.RequestStatus === 'Success') {
            const updatedLeave = {
              id: editingLeaveId || Date.now().toString(),
              leaveType: leaveData?.Item2?.find((item: any) => item.PayheadId === selectedLeaveType)?.PayHeadName,
              startDate: startDate,
              endDate: endDate,
              leaveDays: leaveDays,
              holidays: holidays,
              startHD: startHD,
              endHD: endHD,
              payHeadId: selectedLeaveType
            };

            // Update existing leave or add new one
            if (editingLeaveId) {
              // Update existing leave
              setSavedLeaves(savedLeaves.map(leave => 
                leave.id === editingLeaveId ? updatedLeave : leave
              ));
              setValidationMessage('Leave updated successfully!');
            } else {
              // Add new leave
              setSavedLeaves([...savedLeaves, updatedLeave]);
              setValidationMessage('Leave request saved successfully!');
            }
            
            // Reset form
            setSelectedLeaveType(null);
            setStartDate('');
            setEndDate('');
            setStartHD(false);
            setEndHD(false);
            setLeaveDays('0');
            setHolidays('0');
            setLeaveDropdownOpen(false);
            setEditingLeaveId(null);
            
            setShowValidationMessage(true);
            setTimeout(() => setShowValidationMessage(false), 3000);
            
            // Close the popup after successful save
            setPopupVisible(false);
          } else {
            setValidationMessage(response.ResponseMessage || 'Failed to save leave request');
            setShowValidationMessage(true);
            setTimeout(() => setShowValidationMessage(false), 3000);
          }
        }
      }
    } catch (error) {
      console.error('Error saving leave request:', error);
      setValidationMessage('Something went wrong please try after some time');
      setShowValidationMessage(true);
      setTimeout(() => setShowValidationMessage(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const [editingLeaveId, setEditingLeaveId] = useState<string | null>(null);

  const handleEditLeave = async (leave: any) => {
    // Fetch leave data if not already available
    if (!leaveData) {
      try {
        const token = await UserStorage.getToken();
        if (token) {
          const result = await fetchLeaveData(token);
          setLeaveData(result);
        }
      } catch (error) {
        console.error('Error fetching leave data for edit:', error);
      }
    }
    
    // Set the form values
    setSelectedLeaveType(leave.payHeadId);
    setStartDate(leave.startDate);
    setEndDate(leave.endDate);
    setStartHD(leave.startHD);
    setEndHD(leave.endHD);
    setLeaveDays(leave.leaveDays);
    setHolidays(leave.holidays);
    
    // Store the leave ID being edited
    setEditingLeaveId(leave.id);
    
    // Open the popup
    setPopupVisible(true);
  };

  const handleRemoveLeave = (leaveId: string) => {
    setSavedLeaves(savedLeaves.filter(leave => leave.id !== leaveId));
  };

  const handleSaveAllLeaves = async () => {
    if (savedLeaves.length === 0) {
      setValidationMessage('No leaves to save');
      setShowValidationMessage(true);
      setTimeout(() => setShowValidationMessage(false), 3000);
      return;
    }

    setIsSavingAll(true);
    try {
      const token = await UserStorage.getToken();
      if (token) {
        // Calculate total leave days
        const totalLeaveDays = savedLeaves.reduce((sum, leave) => sum + parseInt(leave.leaveDays), 0);
        
        // Get first and last dates
        const sortedLeaves = [...savedLeaves].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        const firstStartDate = sortedLeaves[0].startDate;
        const lastEndDate = sortedLeaves[sortedLeaves.length - 1].endDate;
        
        // Get current date in DD-MMM-YYYY format
        const currentDate = formatDateForAPI(new Date().toISOString().split('T')[0]);
        
        const allLeavesData = {
          Mode: "I",
          LeaveRegisterId: "0",
          TransactionDate: currentDate,
          FkFieldIdLeaveStatus: "1",
          LeaveDays: totalLeaveDays.toString(),
          LeaveStartDate: formatDateForAPI(firstStartDate),
          LeaveEndDate: formatDateForAPI(lastEndDate),
          Remarks: remarks || "Request From Mobile App",
          Da5011List: savedLeaves.map(leave => ({
            LeaveRegisterDtlsId: "0",
            FkPayHeadId: leave.payHeadId.toString(),
            LeaveStartDate: formatDateForAPI(leave.startDate),
            LeaveEndDate: formatDateForAPI(leave.endDate),
            HalfDayStartDate: leave.startHD ? "1" : "0",
            HalfDayEndDate: leave.endHD ? "1" : "0",
            DayCount: leave.leaveDays,
            offCount: leave.holidays
          }))
        };

        console.log('Saving all leaves:', allLeavesData);
        const result = await saveAllLeaves(token, allLeavesData);

        if (result) {
          if (result.IsSuccess === true) {
            setValidationMessage('Leave applied successfully!');
            setShowValidationMessage(true);
            setTimeout(() => setShowValidationMessage(false), 3000);
            
            // Clear saved leaves after successful save
            setSavedLeaves([]);
            setRemarks('');
          } else if (result.ErrorCodes && Array.isArray(result.ErrorCodes)) {
            const errorMessage = result.ErrorCodes.join(', ');
            setValidationMessage(errorMessage);
            setShowValidationMessage(true);
            setTimeout(() => setShowValidationMessage(false), 3000);
          } else {
            setValidationMessage('Something went wrong please try after some time');
            setShowValidationMessage(true);
            setTimeout(() => setShowValidationMessage(false), 3000);
          }
        }
      }
    } catch (error) {
      console.error('Error saving all leaves:', error);
      setValidationMessage('Something went wrong please try after some time');
      setShowValidationMessage(true);
      setTimeout(() => setShowValidationMessage(false), 3000);
    } finally {
      setIsSavingAll(false);
    }
  };

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
          <Text style={styles.pagetitle}>{isEditMode ? 'Edit Leave Request' : 'Leave Request'}</Text>
        </View>
        <TouchableOpacity style={styles.rightclick}></TouchableOpacity>
      </View>

             <ScrollView style={styles.scrollContainer}>
        <View style={styles.formContainer}>
          {/* Leave Reference No */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Leave Reference No</Text>
            <TextInput
              style={[styles.textInput, styles.readOnlyInput]}
              value={leaveReferenceNo}
              editable={false}
              placeholder="Leave Reference No"
            />
          </View>

          {/* Request Date */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Request Date</Text>
            <TouchableOpacity style={styles.datePicker} onPress={showDatePickerModal}>
              <Text style={styles.datePickerText}>
                {requestDate || 'Select Date'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={requestDate ? new Date(requestDate) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          {/* Rejoin Status */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Rejoin Status</Text>
            <TextInput
              style={[styles.textInput, styles.readOnlyInput]}
              value={rejoinStatus}
              editable={false}
              placeholder="Rejoin Status"
            />
          </View>

          {/* Remarks */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Remarks</Text>
                         <TextInput
               style={[styles.textInput, styles.textArea]}
               value={remarks}
               onChangeText={setRemarks}
               placeholder="Enter remarks"
               multiline
               numberOfLines={4}
               textAlignVertical="top"
             />
           </View>

           {/* Select Leaves Button */}
           <View style={styles.selectLeavesContainer}>
             <TouchableOpacity style={styles.selectLeavesButton} onPress={handleRightUndoPress}>
               <Text style={styles.selectLeavesButtonText}>Select Leaves</Text>
             </TouchableOpacity>
           </View>

           {/* Saved Leaves List */}
           {savedLeaves.length > 0 && (
             <View style={styles.savedLeavesContainer}>
               <Text style={styles.savedLeavesTitle}>Saved Leaves</Text>
               {savedLeaves.map((leave, index) => (
                 <View key={leave.id} style={styles.savedLeaveItem}>
                   <View style={styles.savedLeaveInfo}>
                     <Text style={styles.savedLeaveType}>{leave.leaveType}</Text>
                     <Text style={styles.savedLeaveDates}>
                       {leave.startDate} - {leave.endDate}
                     </Text>
                     <Text style={styles.savedLeaveDetails}>
                       Days: {leave.leaveDays} | Holidays: {leave.holidays}
                       {leave.startHD && ' | Start HD'} {leave.endHD && ' | End HD'}
                     </Text>
                   </View>
                   <View style={styles.savedLeaveActions}>
                     <TouchableOpacity 
                       style={styles.editButton} 
                       onPress={() => handleEditLeave(leave)}
                     >
                       <Text style={styles.editButtonText}>Edit</Text>
                     </TouchableOpacity>
                     <TouchableOpacity 
                       style={styles.removeButton} 
                       onPress={() => handleRemoveLeave(leave.id)}
                     >
                       <Text style={styles.removeButtonText}>Remove</Text>
                     </TouchableOpacity>
                   </View>
                 </View>
               ))}
               
               {/* Save All Button */}
               <View style={styles.saveAllContainer}>
                 <TouchableOpacity 
                   style={[styles.saveAllButton, isSavingAll && styles.disabledButton]} 
                   onPress={handleSaveAllLeaves}
                   disabled={isSavingAll}
                 >
                   {isSavingAll ? (
                     <ActivityIndicator size="small" color="#fff" />
                   ) : (
                     <Text style={styles.saveAllButtonText}>Save All Leaves</Text>
                   )}
                 </TouchableOpacity>
               </View>
             </View>
           )}
         </View>
       </ScrollView>

       {/* Validation Message for Main Screen */}
       {showValidationMessage && (
         <View style={styles.validationContainer}>
           <Text style={styles.validationText}>{validationMessage}</Text>
         </View>
       )}

      {/* RightUndo Popup Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={popupVisible}
        onRequestClose={handlePopupClose}>

        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
                         <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>
                 {editingLeaveId ? 'Edit Leave Details' : 'Leave Request Details'}
               </Text>
               <TouchableOpacity onPress={handlePopupClose}>
                 <Text style={styles.closeButton}>✕</Text>
               </TouchableOpacity>
             </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.popupContent}>
                {/* Leave Type Dropdown */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Leave Type</Text>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setLeaveDropdownOpen(!leaveDropdownOpen)}>
                    <Text style={styles.dropdownText}>
                      {selectedLeaveType !== null && leaveData?.Item2 
                        ? leaveData.Item2.find((item: any) => item.PayheadId === selectedLeaveType)?.PayHeadName 
                        : 'Select Leave Type'}
                    </Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {leaveDropdownOpen && leaveData?.Item2 && (
                    <View style={styles.dropdownListwrap}>
                      <View style={styles.dropdownList}>
                        {leaveData.Item2.map((item: any) => (
                          <TouchableOpacity
                            key={item.PayheadId}
                            style={styles.dropdownItem}
                            activeOpacity={0.7}
                            onPress={() => {
                              setSelectedLeaveType(item.PayheadId);
                              setLeaveDropdownOpen(false);
                            }}>
                            <Text style={styles.dropdownText}>{item.PayHeadName}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>

                {/* Start Date */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Start Date</Text>
                  <TouchableOpacity style={styles.datePicker} onPress={showStartDatePickerModal}>
                    <Text style={styles.datePickerText}>
                      {startDate || 'Select Start Date'}
                    </Text>
                  </TouchableOpacity>
                  {showStartDatePicker && (
                    <DateTimePicker
                      value={startDate ? new Date(startDate) : new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleStartDateChange}
                      minimumDate={new Date()}
                    />
                  )}
                </View>

                {/* End Date */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>End Date</Text>
                  <TouchableOpacity style={styles.datePicker} onPress={showEndDatePickerModal}>
                    <Text style={styles.datePickerText}>
                      {endDate || 'Select End Date'}
                    </Text>
                  </TouchableOpacity>
                  {showEndDatePicker && (
                    <DateTimePicker
                      value={endDate ? new Date(endDate) : new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleEndDateChange}
                      minimumDate={new Date()}
                    />
                  )}
                </View>

                {/* Start HD Checkbox */}
                <View style={styles.formGroup}>
                  <View style={styles.checkboxContainer}>
                    <Switch
                      value={startHD}
                      onValueChange={handleStartHDChange}
                      trackColor={{ false: '#767577', true: '#133F7C' }}
                      thumbColor={startHD ? '#fff' : '#f4f3f4'}
                    />
                    <Text style={styles.checkboxLabel}>Start HD</Text>
                  </View>
                </View>

                {/* End HD Checkbox */}
                <View style={styles.formGroup}>
                  <View style={styles.checkboxContainer}>
                    <Switch
                      value={endHD}
                      onValueChange={handleEndHDChange}
                      trackColor={{ false: '#767577', true: '#133F7C' }}
                      thumbColor={endHD ? '#fff' : '#f4f3f4'}
                    />
                    <Text style={styles.checkboxLabel}>End HD</Text>
                  </View>
                </View>

                {/* Leave Days */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Leave Days</Text>
                  <TextInput
                    style={[styles.textInput, styles.readOnlyInput]}
                    value={leaveDays}
                    editable={false}
                    placeholder="Leave Days"
                  />
                </View>

                {/* Loading Indicator */}
                {isCalculating && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#133F7C" />
                    <Text style={styles.loadingText}>Calculating leave days...</Text>
                  </View>
                )}

                {/* Holidays */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Holidays</Text>
                  <TextInput
                    style={[styles.textInput, styles.readOnlyInput]}
                    value={holidays}
                    editable={false}
                    placeholder="Holidays"
                  />
                </View>
              </View>
            </ScrollView>

            {/* Modal Buttons */}
            <View style={styles.modalButtons}>
                             <TouchableOpacity 
                 style={[styles.saveButton, isSaving && styles.disabledButton]} 
                 onPress={handleSaveLeave}
                 disabled={isSaving}
               >
                 {isSaving ? (
                   <ActivityIndicator size="small" color="#fff" />
                 ) : (
                   <Text style={styles.saveButtonText}>
                     {editingLeaveId ? 'Update' : 'Save'}
                   </Text>
                 )}
               </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={handlePopupClose}>
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
            </View>

            {/* Validation Message */}
            {showValidationMessage && (
              <View style={styles.validationContainer}>
                <Text style={styles.validationText}>{validationMessage}</Text>
              </View>
            )}
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
    width: 50,
    alignItems: 'center',
  },
  rightUndoButton: {
    fontSize: 24,
    color: '#133F7C',
    fontWeight: 'bold',
  },
  scrollContainer: {
    padding: 16,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 15,
    color: '#333',
    marginBottom: 5,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  readOnlyInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  datePicker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
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
    color: '#133F7C',
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 20,
    color: '#930606ff',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  popupContent: {
    paddingVertical: 10,
  },
  popupText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 20,
  },
  popupFormGroup: {
    marginTop: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#133F7C',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#fce2e5ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#7c1313ff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectLeavesContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  selectLeavesButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#133F7C',
    backgroundColor: '#133F7C',
  },
  selectLeavesButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffffff',
  },
  dropdownText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#555',
  },
  disabledButton: {
    opacity: 0.6,
  },
  validationContainer: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    margin: 10,
  },
  validationText: {
    color: '#721c24',
    fontSize: 14,
    textAlign: 'center',
  },
  savedLeavesContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  savedLeavesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#133F7C',
    marginBottom: 12,
  },
  savedLeaveItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  savedLeaveInfo: {
    marginBottom: 8,
  },
  savedLeaveType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  savedLeaveDates: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  savedLeaveDetails: {
    fontSize: 11,
    color: '#888',
  },
  savedLeaveActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#133F7C',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  saveAllContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  saveAllButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 150,
    alignItems: 'center',
  },
  saveAllButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

