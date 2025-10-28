import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, ActivityIndicator, FlatList, Modal, TextInput, Switch, Platform, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { pick, types, keepLocalCopy } from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import { getFileUrl } from '../config/apiConfig';


import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getMesseges, fetchMessageCategories, fetchSelectTypes, saveMessage, fetchMessageForEdit, fetchLeaveData, calculateLeaveDays, saveLeaveRequest, saveAllLeaves, fetchLeaveEditData, uploadDocument } from '../api/api';
import UserStorage from '../utils/userStorage';
import NotificationService from '../services/NotificationService';

type Props = NativeStackScreenProps<RootStackParamList, 'LeaveRequest'>;

export default function LeaveRequestScreen({ navigation, route }: Props) {
  const [leaveReferenceNo, setLeaveReferenceNo] = useState('LR-2024-001');
  const [requestDate, setRequestDate] = useState(new Date().toISOString().split('T')[0]);
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
  const [leaveTypeModalVisible, setLeaveTypeModalVisible] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [savedLeaves, setSavedLeaves] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [showValidationMessage, setShowValidationMessage] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [editType, setEditType] = useState<any>(null);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [modalScrollViewRef, setModalScrollViewRef] = useState<any>(null);

  // Check if we're in edit mode and populate form with edit data
  useEffect(() => {
    if (route.params?.editData && route.params?.type) {
      const data = route.params.editData;
      const type = route.params.type;

    
      setEditData(data);
      setEditType(type);
      setIsEditMode(true);

      // Populate form fields with edit data
      setLeaveReferenceNo(data.ReferenceNo || '');
      // Convert date to YYYY-MM-DD format for internal consistency
      if (data.StrTransactionDate) {
        const parsedDate = parseDateString(data.StrTransactionDate);
        setRequestDate(parsedDate.toISOString().split('T')[0]);
      } else {
        setRequestDate('');
      }
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
            startDate: item.StrLeaveStartDate || '',
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

        // Handle existing attachments from AttachmentList
        if (response && response.AttachmentList && Array.isArray(response.AttachmentList)) {
          const mappedAttachments = response.AttachmentList.map((attachment: any, index: number) => ({
            id: `existing-${index}-${Date.now()}`,
            fileName: attachment.FileNameServer || attachment.FileNameSelected || 'Unknown',
            tmpFileName: attachment.FileNameServer || '',
            fileSize: 0, // Size not available from existing attachments
            leaveRegisterId: '', // Not available for existing attachments
            attachmentItem: {
              PageName: attachment.PageName || "da5010",
              TableName: attachment.TableName || attachment["Table Name"] || "da5010",
              FileNameSelected: attachment.FileNameSelected || 'Unknown',
              FileNameServer: attachment.FileNameServer || '',
              AutoId: attachment.AutoId || "0",
              FileId: attachment.FileId || "0",
              Folder: attachment.Folder || "temppath"
            }
          }));

          setUploadedFiles(mappedAttachments);
          console.log('Mapped existing attachments:', mappedAttachments);
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

  // Helper function to parse various date formats
  const parseDateString = (dateString: string): Date => {
    if (!dateString) return new Date();

    // Try standard Date parsing first (YYYY-MM-DD, etc.)
    let parsedDate = new Date(dateString);

    // If standard parsing fails, try custom formats
    if (isNaN(parsedDate.getTime())) {
      // Check if it's in DD-MMM YYYY format (e.g., "09-Aug 2025")
      const ddMmmYyyyMatch = dateString.match(/^(\d{1,2})-([A-Za-z]{3})\s+(\d{4})$/);
      if (ddMmmYyyyMatch) {
        const [, day, monthStr, year] = ddMmmYyyyMatch;
        const monthMap: { [key: string]: number } = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        const month = monthMap[monthStr];
        if (month !== undefined) {
          parsedDate = new Date(parseInt(year), month, parseInt(day));
        }
      }

      // Check if it's in DD-MMM-YYYY format (e.g., "09-Aug-2025")
      if (isNaN(parsedDate.getTime())) {
        const ddMmmYyyyDashMatch = dateString.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
        if (ddMmmYyyyDashMatch) {
          const [, day, monthStr, year] = ddMmmYyyyDashMatch;
          const monthMap: { [key: string]: number } = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
          };
          const month = monthMap[monthStr];
          if (month !== undefined) {
            parsedDate = new Date(parseInt(year), month, parseInt(day));
          }
        }
      }
    }

    // If all parsing attempts fail, return current date
    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      // Store in YYYY-MM-DD format for internal consistency
      setRequestDate(selectedDate.toISOString().split('T')[0]);
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
    setLeaveTypeModalVisible(false);
    setSelectedDocument(null);
    setModalScrollViewRef(null);
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

  // const formatDateForAPI = (dateString: string): string => {
  //    const [day, monthStr, year] = dateStr.split("-");
  //   const date = new Date(dateString);
  //   const day = date.getDate().toString().padStart(2, '0');
  //   const month = date.toLocaleString('en', { month: 'short' });
  //   const year = date.getFullYear();
  //   return `${day}-${month}-${year}`;
  // };
  const formatDateForAPI = (dateString: string): string => {
    const [days, monthStr, years] = dateString.split("-");
    if (monthStr.length == 3) {
      return dateString;
    }
    else {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('en', { month: 'short' });
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
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
              //setValidationMessage('Leave request saved successfully!');
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
            // Uploaded files are now global and persist across leave additions

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
    
    // Uploaded files are now global to the entire leave request, not per leave item

    // Store the leave ID being edited
    setEditingLeaveId(leave.id);

    // Open the popup
    setPopupVisible(true);
  };

  const handleRemoveLeave = (leaveId: string) => {
    setSavedLeaves(savedLeaves.filter(leave => leave.id !== leaveId));
  };

  const handleRemoveUploadedFile = (fileId: string) => {
    setUploadedFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));
  };

  const handleFileDownload = async (file: any) => {
    try {
      await NotificationService.init();
      // Construct the file path using Folder + '/' + FileNameServer
      let filePath = `${file.attachmentItem.Folder}/${file.attachmentItem.FileNameServer}`;
      
      // Get the full file URL
      //const downloadUrl = getFileUrl('/' + filePath);

      if(!filePath.startsWith('http')){
        filePath = getFileUrl('/UploadFiles/DocManager/temp/' + file.attachmentItem.FileNameServer);
      }
      //console.log('Downloading file from URL:', downloadUrl);
      console.log('File path:', filePath);
      
      // Get the original filename for saving
      const fileName = file.attachmentItem.FileNameSelected || file.fileName;
      
      // Download path
      const path = RNFS.DownloadDirectoryPath + "/" + fileName;
      
      // Download the file
      const result = await RNFS.downloadFile({
        fromUrl: filePath,
        toFile: path,
      }).promise;

      if (result.statusCode === 200) {
        //Alert.alert("Success", `File saved to: ${path}`);
        await NotificationService.showDownloadComplete(fileName, path);
      } else {
        Alert.alert("Failed", "Download failed");
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download file');
    }
  };

  const scrollToUploadedFiles = () => {
    if (modalScrollViewRef) {
      // Scroll to the bottom of the modal to show uploaded files
      setTimeout(() => {
        modalScrollViewRef.scrollToEnd({ animated: true });
      }, 500); // Increased delay to ensure the file is added to the list and UI is updated
    }
  };

  // Alternative scroll function that scrolls to a specific position
  const scrollToSpecificPosition = (y: number) => {
    if (modalScrollViewRef) {
      setTimeout(() => {
        modalScrollViewRef.scrollTo({ x: 0, y: y, animated: true });
      }, 500);
    }
  };

  const handleDocumentPicker = async () => {
    try {
      const [file] = await pick({ types: [types.allFiles], allowMultiSelection: false });
      if (file.uri) {
        // if you need a local copy:
        const [copyResult] = await keepLocalCopy({ files: [{ uri: file.uri, fileName: file.name?file.name:'' }], destination: 'documentDirectory' });
        setSelectedDocument(file);
        
        // Upload document to API
        const token = await UserStorage.getToken();
        if (token) {
          try {
            const uploadResult = await uploadDocument(token, file);
            console.log('Document upload response:', uploadResult);
            
            // Check if upload was successful
            if (uploadResult && uploadResult.Status === "Success") {
              // Create attachment object in the required format
              const attachmentItem = {
                PageName: "da5010",
                TableName: "da5010", 
                FileNameSelected: file.name || "Unknown",
                FileNameServer: uploadResult.TmpFileName,
                AutoId: "0",
                FileId: "0",
                Folder: uploadResult.UploadFilePath || "temppath"
              };

              // Add the uploaded file to the list with both formats for display and API
              const newUploadedFile = {
                id: Date.now().toString(),
                fileName: uploadResult.FileName,
                tmpFileName: uploadResult.TmpFileName,
                fileSize: uploadResult.FileSize,
                leaveRegisterId: uploadResult.LeaveRegisterId,
                attachmentItem: attachmentItem // Store the attachment format for API
              };
            
              
              setUploadedFiles(prevFiles => [...prevFiles, newUploadedFile]);
              setValidationMessage('Document uploaded successfully!');
              setShowValidationMessage(true);
              setTimeout(() => setShowValidationMessage(false), 3000);
              
              // Auto-scroll to show the uploaded file
              scrollToUploadedFiles();
            } else {
              setValidationMessage('Something went wrong please try after some time');
              setShowValidationMessage(true);
              setTimeout(() => setShowValidationMessage(false), 3000);
            }
          } catch (uploadError) {
            console.error('Document upload error:', uploadError);
            setValidationMessage('Something went wrong please try after some time');
            setShowValidationMessage(true);
            setTimeout(() => setShowValidationMessage(false), 3000);
          }
        }
      }
    } catch (error) {
      console.error('Document picker error:', error);
    }
  };

  const handleSaveAllLeaves = async () => {
    debugger;
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

        // Create AttachmentList from uploaded files
        const attachmentList = uploadedFiles.map(file => file.attachmentItem);

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
          })),
          AttachmentList: attachmentList
        };

        console.log('Saving all leaves:', allLeavesData);
        const result = await saveAllLeaves(token, allLeavesData);

        if (result) {
          if (result.IsSuccess === true) {
            navigation.navigate('Main', { screen: 'LeaveHistory' });
            setValidationMessage('Leave applied successfully!');
            setShowValidationMessage(true);
            setTimeout(() => setShowValidationMessage(false), 3000);

            // Clear saved leaves and uploaded files after successful save
            setSavedLeaves([]);
            setRemarks('');
            setUploadedFiles([]);
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
            <Text style={styles.formLabel}>Leave Reference No{editType}</Text>
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
                value={requestDate ? parseDateString(requestDate) : new Date()}
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
          {editType != 'view' && (
          <View style={styles.selectLeavesContainer} >
            <TouchableOpacity style={styles.selectLeavesButton} onPress={handleRightUndoPress}>
              <Text style={styles.selectLeavesButtonText}>Add Leaves</Text>
            </TouchableOpacity>
          </View>
          )}

          {/* Select Document */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Select Document</Text>
            <TouchableOpacity style={styles.fileUploadButton} onPress={handleDocumentPicker}>
              <Text style={styles.fileUploadButtonText}>
                📎 Select Document
              </Text>
            </TouchableOpacity>
          </View>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <View style={styles.uploadedFilesContainer}>
              <Text style={styles.uploadedFilesTitle}>Uploaded Documents</Text>
              {uploadedFiles.map((file, index) => (
                <View key={file.id} style={styles.uploadedFileItem}>
                  <Image 
                    source={require('../../assets/images/innerpage/documentd.png')} 
                    style={styles.uploadedFileIcon} 
                    resizeMode="contain" 
                  />
                  <View style={styles.uploadedFileInfo}>
                    <TouchableOpacity onPress={() => handleFileDownload(file)}>
                      <Text style={[styles.uploadedFileName, styles.downloadableFileName]}>{file.attachmentItem?.FileNameSelected || file.fileName}</Text>
                    </TouchableOpacity>
                    <Text style={styles.uploadedFileSize}>
                      {file.fileSize > 0 ? `Size: ${(file.fileSize / 1024).toFixed(2)} KB` : 'Existing Document'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.removeFileButton}
                    onPress={() => handleRemoveUploadedFile(file.id)}
                  >
                    <Text style={styles.removeFileButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Saved Leaves List */}
          {savedLeaves.length > 0 && (
            <View style={styles.savedLeavesContainer}>
              <Text style={styles.savedLeavesTitle}>Leave Details</Text>
              {savedLeaves.map((leave, index) => (
                <View style={styles.savedLeaveItem}>
                  <View key={leave.id} style={styles.savedleaveicon}>
                    <View style={styles.leaviconview}>
                      <Image source={require('../../assets/images/completed.png')}
                        style={styles.leavicon} resizeMode="contain" />
                    </View>
                    <View>
                      <View style={styles.savedLeaveInfo}>
                        <Text style={styles.savedLeaveType}>{leave.leaveType}</Text>
                        <Text style={styles.savedLeaveDates}> From {leave.startDate} To {leave.endDate}
                        </Text>
                        <Text style={styles.savedLeaveDetails}>
                          Days: {leave.leaveDays} | Holidays: {leave.holidays}
                          {leave.startHD && ' | Start HD'} {leave.endHD && ' | End HD'}
                        </Text>
                      </View>
                      {editType != 'view' && (
                      <View style={styles.savedLeaveActions}>
                        <View style={styles.editButtonContainer}>
                          <TouchableOpacity style={styles.editButton} onPress={() => handleEditLeave(leave)}>
                            <Text style={styles.editIcon}>✏️</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.editButtonContainer}>
                          <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveLeave(leave.id)}>
                            <Text style={[styles.editIcon, { color: 'red' }]}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
              {/* Save All Button */}
              {editType != 'view' && (
              <View style={styles.saveAllContainer}>
                <TouchableOpacity
                  style={[styles.saveAllButton, isSavingAll && styles.disabledButton]}
                  onPress={handleSaveAllLeaves}
                  disabled={isSavingAll}
                >
                  {isSavingAll ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveAllButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Validation Message for Main Screen */}
      {/* {showValidationMessage && (
        <View style={styles.validationContainer}>
          <Text style={styles.validationText}>{validationMessage}</Text>
        </View>
      )} */}

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

            <ScrollView 
              ref={setModalScrollViewRef}
              style={styles.modalBody}
            >
              <View style={styles.popupContent}>
                {/* Leave Type Dropdown */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Leave Type</Text>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setLeaveTypeModalVisible(true)}>
                    <Text style={styles.dropdownText}>
                      {selectedLeaveType !== null && leaveData?.Item2
                        ? leaveData.Item2.find((item: any) => item.PayheadId === selectedLeaveType)?.PayHeadName
                        : 'Select Leave Type'}
                    </Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
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
                      value={startDate ? parseDateString(startDate) : new Date()}
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
                      value={endDate ? parseDateString(endDate) : new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleEndDateChange}
                      minimumDate={new Date()}
                    />
                  )}
                </View>

                <View style={[styles.actionbtnwraper, styles.spcbtwn]}>
                  <View style={[styles.formGroup, styles.formGroupbtm]}>
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
                  <View style={[styles.formGroup, styles.formGroupbtm]}>
                    <View style={styles.checkboxContainer}>
                      <Switch
                        value={endHD}
                        onValueChange={handleEndHDChange}
                        trackColor={{ false: '#767577', true: '#133F7C' }}
                        thumbColor={endHD ? '#fff' : '#f4f3f4'} />
                      <Text style={styles.checkboxLabel}>End HD</Text>
                    </View>
                  </View>
                </View>
                {/* Start HD Checkbox */}

                <View style={styles.actionbtnwraper}>
                  {/* Leave Days */}
                  <View style={[styles.formGroup, styles.marrgt]}>
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

                  {/* Document Upload */}
              
                </View>



                
              </View>
            </ScrollView>

            {/* Modal Buttons */}
            <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handlePopupClose}>
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, isSaving && styles.disabledButton]}
                onPress={handleSaveLeave} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingLeaveId ? 'Update' : 'Add to List'}
                  </Text>
                )}
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

      {/* Leave Type Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={leaveTypeModalVisible}
        onRequestClose={() => setLeaveTypeModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Leave Type</Text>
              <TouchableOpacity onPress={() => setLeaveTypeModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              style={styles.modalBody}
              data={leaveData?.Item2 || []}
              keyExtractor={(item) => item.PayheadId.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedLeaveType(item.PayheadId);
                    setLeaveTypeModalVisible(false);
                  }}>
                  <Text style={styles.dropdownText}>{item.PayHeadName}</Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={true}
            />
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
    backgroundColor: '#E2EDFC',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionbtnwraper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  spcbtwn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DEECFF',
    borderRadius: 8,
    padding: 6,
    marginBottom: 10,
  },
  formGroupbtm: {
    marginBottom: 0,
  },
  marrgt: {
    marginRight: 20,
  },
  formGroup: {
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 15,
    color: '#333',
    marginBottom: 5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#DEECFF',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#000',
    backgroundColor: '#ffffff',
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
    borderColor: '#DEECFF',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#FFFFFF',
  },
  datePickerText: {
    fontSize: 14,
    color: '#000',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#E5EEFD',
    borderRadius: 10,
    padding: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 17,
    color: '#133F7C',
  },
  closeButton: {
    fontSize: 20,
    color: '#930606ff',
  },
  modalBody: {
    width: '100%',
    marginBottom: 0,
    height:'55%'
  },
  popupContent: {
    marginBottom: 0,
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
    borderTopWidth: 1,
    borderTopColor: '#d3d3d3ff',
    marginTop: 0,
    paddingTop: 10,
    width: '100%',
  },
  saveButton: {
    backgroundColor: '#133F7C',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
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
    alignItems: 'flex-end',
    marginTop: 10,
    marginBottom: 10,
    paddingRight: 0,
  },
  selectLeavesButton: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: .5,
    borderColor: '#90a4c3ff',
  },
  selectLeavesButtonText: {
    color: '#133F7C',
    fontSize: 12,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#DEECFF',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 14,
    color: '#133F7C',
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
    fontSize: 14,
    color: '#333',
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
    paddingTop: 6,
    paddingLeft: 6,
    paddingRight: 6,
    backgroundColor: '#eff7ffff',
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
  savedleaveicon: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  leaviconview: {
    marginRight: 8,
  },
  leavicon: {
    width: 20,
    height: 20,
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
    width: '100%',
    paddingRight: 20,
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
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
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
    backgroundColor: '#133F7C',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 130,
    alignItems: 'center',
  },
  saveAllButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  editIcon: {
    fontSize: 12,
  },
  fileUploadButton: {
    borderWidth: 1,
    borderColor: '#DEECFF',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileUploadButtonText: {
    fontSize: 14,
    color: '#133F7C',
    fontWeight: '500',
  },
  uploadedFilesContainer: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  uploadedFilesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#133F7C',
    marginBottom: 10,
  },
  uploadedFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  uploadedFileIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  uploadedFileInfo: {
    flex: 1,
  },
  uploadedFileName: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    marginBottom: 2,
  },
  downloadableFileName: {
    color: '#133F7C',
    textDecorationLine: 'underline',
  },
  uploadedFileSize: {
    fontSize: 11,
    color: '#666',
  },
  removeFileButton: {
    padding: 4,
    marginLeft: 8,
    backgroundColor: '#f8d7da',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeFileButtonText: {
    fontSize: 12,
    color: '#721c24',
    fontWeight: 'bold',
  },



















});