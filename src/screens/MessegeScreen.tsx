import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, ActivityIndicator, FlatList, Modal, TextInput, Switch, Platform, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getMesseges, fetchMessageCategories, fetchSelectTypes, saveMessage, fetchMessageForEdit } from '../api/api';
import UserStorage from '../utils/userStorage';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function MessegeScreen({ navigation }: Props) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [tillDate, setTillDate] = useState('');
  const [sendViaEmail, setSendViaEmail] = useState(false);
  const [categories, setCategories] = useState<{ FieldID: number, FieldValue: string }[]>([]);
  const [filterTypes, setFilterTypes] = useState<{ EmployeeCategoryId: number, EmployeeCategory: string }[]>([]);
  const [selectedFilterType, setSelectedFilterType] = useState<number | null>(null);
  const [selectTypes, setSelectTypes] = useState<any[]>([]);
  const [selectedSelectTypes, setSelectedSelectTypes] = useState<number[]>([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [filterTypeDropdownOpen, setFilterTypeDropdownOpen] = useState(false);
  const [selectTypeDropdownOpen, setSelectTypeDropdownOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string>('');
  
  // Dropdown modals
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [filterTypeModalVisible, setFilterTypeModalVisible] = useState(false);
  const [selectTypeModalVisible, setSelectTypeModalVisible] = useState(false);

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
        const result = await getMesseges(token);
        setData(Array.isArray(result) ? result : []);
      } catch (err) {
                  setError('Failed to fetch notifications');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (modalVisible || editModalVisible) {
      (async () => {
        try {
          const token = await UserStorage.getToken();
          if (token) {
            const result = await fetchMessageCategories(token);
            setCategories(result.Item1 || []);
            setFilterTypes(result.Item2 || []);
          }
        } catch (e) {
          // handle error
        }
      })();
    }
  }, [modalVisible, editModalVisible]);

  useEffect(() => {
    if (selectedFilterType !== null) {
      (async () => {
        try {
          const token = await UserStorage.getToken();
          if (token) {
            const result = await fetchSelectTypes(token, selectedFilterType);
            setSelectTypes(result || []);
            setSelectedSelectTypes([]); // Reset selection when filter type changes
          }
        } catch (e) {
          console.error('Failed to fetch select types:', e);
          setSelectTypes([]);
        }
      })();
    } else {
      setSelectTypes([]);
      setSelectedSelectTypes([]);
    }
  }, [selectedFilterType]);

  const loadSelectTypes = async (filterTypeId: number) => {
    const token = await UserStorage.getToken();
    if (token) {
      const result = await fetchSelectTypes(token, filterTypeId);
      setSelectTypes(result || []);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setTillDate(selectedDate.toISOString().split('T')[0]); // Format as YYYY-MM-DD
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };        

  const handleSave = async () => {
    try {
      const token = await UserStorage.getToken();
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      // Convert selectedSelectTypes array to comma-separated string
      const employeeCategoryListIds = selectedSelectTypes.join(',');

      const messageData = {
        "Mode": isEditMode ? "U" : "I",
        "NotificationId": isEditMode ? selectedNotificationId : "0",
        "FkCategoryId": selectedCategory?.toString() || "",
        "Title": title,
        "NotificationDate": tillDate || "",
        "NotificationContent": message,
        "EmployeeCategoryId": selectedFilterType?.toString() || "",
        "EmployeeCategoryListIds": employeeCategoryListIds
      };

      console.log('Posting data:', messageData);

      // Make API call using the api.tsx function
      const result = await saveMessage(token, messageData);
      console.log('Save response:', result);
      
      // Check if the response indicates success
      if (result && Array.isArray(result) && result.length > 0 && result[0].Status === "Success") {
        console.log('Message saved successfully!');
        
        // Close modal and reset form
        if (isEditMode) {
          setEditModalVisible(false);
          setIsEditMode(false);
          setEditData(null);
          setSelectedNotificationId('');
        } else {
          setModalVisible(false);
        }
        setSelectedCategory(null);
        setTitle('');
        setMessage('');
        setTillDate('');
        setSendViaEmail(false);
        setSelectedFilterType(null);
        setSelectedSelectTypes([]);
        setSelectTypes([]);
        
        // Reload the messages data
        try {
          setLoading(true);
          const result = await getMesseges(token);
          setData(Array.isArray(result) ? result : []);
        } catch (err) {
          setError('Failed to refresh notifications');
        } finally {
          setLoading(false);
        }
      } else {
        console.error('Save failed - unexpected response format:', result);
        // Handle unexpected response format
      }
    } catch (error) {
      console.error('Error saving message:', error);
      // Handle error - you might want to show an error message to the user
    }
  };

  const handleClose = () => {
    setModalVisible(false);
    // Reset form
    setSelectedCategory(null);
    setTitle('');
    setMessage('');
    setTillDate('');
    setSendViaEmail(false);
    setSelectedFilterType(null);
    setSelectedSelectTypes([]);
    setSelectTypes([]);
  };

  const handleEditPress = async (notificationId: string) => {
    try {
      setSelectedNotificationId(notificationId);
      const token = await UserStorage.getToken();
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      const result = await fetchMessageForEdit(token, notificationId);
      setEditData(result);
      setIsEditMode(true);
      setEditModalVisible(true);
      
      // Pre-fill the form with edit data
      if (result.Item1 && result.Item1.length > 0) {
        const messageData = result.Item1[0];
        setSelectedCategory(messageData.FkCategoryId);
        setTitle(messageData.Title);
        setMessage(messageData.NotificationContent);
        setTillDate(messageData.NotificationDate);
      }
    } catch (error) {
      console.error('Error fetching message for edit:', error);
    }
  };

  const handleEditClose = () => {
    setEditModalVisible(false);
    setIsEditMode(false);
    setEditData(null);
    setSelectedNotificationId('');
    // Reset form
    setSelectedCategory(null);
    setTitle('');
    setMessage('');
    setTillDate('');
    setSendViaEmail(false);
    setSelectedFilterType(null);
    setSelectedSelectTypes([]);
    setSelectTypes([]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#133F7C" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
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
          <Text style={styles.pagetitle}>Messeges</Text>
        </View>
        <TouchableOpacity style={styles.rightclick}></TouchableOpacity>
      </View>
      
      {/* New Button */}
      <View style={styles.newRequestContainer}>
        <TouchableOpacity style={styles.newRequestButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.newRequestButtonText}>New</Text>
        </TouchableOpacity>
      </View>


      <FlatList
        data={data}
        keyExtractor={(item, idx) => `notification-${item.NotificationId?.toString() || idx.toString()}`}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.lbl}>No notifications found.</Text>}
        renderItem={({ item, index }) => (
          <View style={[styles.row, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
            <View style={styles.rowHeader}>
              <Text style={styles.rowTitle}>{item.Title}</Text>
              <View style={styles.editButtonContainer}>
                <TouchableOpacity style={styles.editButton} onPress={() => handleEditPress(item.NotificationId)}>
                    <Text style={styles.editIcon}>✏️</Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* <Text style={styles.rowLabel}>Notification ID: <Text style={styles.rowValue}>{item.NotificationId}</Text></Text> */}
            <Text style={styles.rowLabel}>Document Type: <Text style={styles.rowValue}>{item.DocType}</Text></Text>
            <Text style={styles.rowLabel}>Date: <Text style={styles.rowValue}>{item.NotificationDate}</Text></Text>
            <Text style={styles.rowLabel}>Content: <Text style={styles.rowValue}>{item.NotificationContent}</Text></Text>
          </View>
        )}
      />

      {/* New Message Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleClose}>

        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Message</Text>
              <TouchableOpacity onPress={handleClose}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
                         <FlatList
               style={styles.modalBody}
               data={[{ key: 'form' }]}
               renderItem={() => (
                 <View>
                                       {/* Category Dropdown */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Category</Text>
                      <TouchableOpacity
                        style={styles.dropdown}
                        onPress={() => setCategoryModalVisible(true)}>
                        <Text style={styles.dropdownText}>
                          {selectedCategory !== null ? categories.find(c => c.FieldID === selectedCategory)?.FieldValue : 'Select Category'}
                        </Text>
                        <Text style={styles.dropdownArrow}>▼</Text>
                      </TouchableOpacity>
                    </View>

                                                                     {/* Filter Types Dropdown */}
                     <View style={styles.formGroup}>
                       <Text style={styles.formLabel}>Filter Types</Text>
                       <TouchableOpacity
                         style={styles.dropdown}
                         onPress={() => setFilterTypeModalVisible(true)}
                       >
                         <Text style={styles.dropdownText}>
                           {selectedFilterType !== null ? filterTypes.find(f => f.EmployeeCategoryId === selectedFilterType)?.EmployeeCategory : 'Select Filter Type'}
                         </Text>
                         <Text style={styles.dropdownArrow}>▼</Text>
                       </TouchableOpacity>
                     </View>

                                         {/* Select Types Dropdown */}
                     <View style={styles.formGroup}>
                       <Text style={styles.formLabel}>Select Types</Text>
                       <TouchableOpacity
                         style={styles.dropdown}
                         onPress={async () => {
                           if (selectedFilterType !== null) {
                             try {
                               const token = await UserStorage.getToken();
                               if (token) {
                                 const result = await fetchSelectTypes(token, selectedFilterType);
                                 setSelectTypes(result || []);
                                 setSelectTypeModalVisible(true);
                               } else {
                                 console.error('No authentication token found');
                                 setSelectTypes([]);
                               }
                             } catch (e) {
                               console.error('Failed to fetch select types:', e);
                               setSelectTypes([]);
                             }
                                                        } else {
                               // Show alert or message that Filter Type must be selected first
                               Alert.alert('Warning', 'Please select Filter Type first');
                             }
                         }}>
                         <Text style={styles.dropdownText}>
                           {selectedSelectTypes.length > 0 
                             ? `${selectedSelectTypes.length} selected` 
                             : 'Select Types'}
                         </Text>
                         <Text style={styles.dropdownArrow}>▼</Text>
                       </TouchableOpacity>
                     </View>

                   {/* Title TextBox */}
                   <View style={styles.formGroup}>
                     <Text style={styles.formLabel}>Title</Text>
                     <TextInput
                       style={styles.textInput}
                       value={title}
                       onChangeText={setTitle}
                       placeholder="Enter title"
                     />
                   </View>

                   {/* Message Rich Text */}
                   <View style={styles.formGroup}>
                     <Text style={styles.formLabel}>Message</Text>
                     <TextInput
                       style={[styles.textInput, styles.textArea]}
                       value={message}
                       onChangeText={setMessage}
                       placeholder="Enter message"
                       multiline
                       numberOfLines={4}
                       textAlignVertical="top"
                     />
                   </View>

                   {/* Till Date DatePicker */}
                   <View style={styles.formGroup}>
                     <Text style={styles.formLabel}>Till Date</Text>
                     <TouchableOpacity style={styles.datePicker} onPress={showDatePickerModal}>
                       <Text style={styles.datePickerText}>
                         {tillDate || 'Select Date'}
                       </Text>
                     </TouchableOpacity>
                     {showDatePicker && (
                       <DateTimePicker
                         value={tillDate ? new Date(tillDate) : new Date()}
                         mode="date"
                         display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                         onChange={handleDateChange}
                         minimumDate={new Date()}
                       />
                     )}
                   </View>

                   {/* Send Via Email Checkbox */}
                   <View style={styles.formGroup}>
                     <View style={styles.checkboxContainer}>
                       <Switch
                         value={sendViaEmail}
                         onValueChange={setSendViaEmail}
                         trackColor={{ false: '#767577', true: '#133F7C' }}
                         thumbColor={sendViaEmail ? '#fff' : '#f4f3f4'}
                       />
                       <Text style={styles.checkboxLabel}>Send Via Email</Text>
                     </View>
                   </View>
                 </View>
               )}
               keyExtractor={(item) => item.key}
               showsVerticalScrollIndicator={true}
             />

            {/* Modal Buttons */}
            <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Message Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={handleEditClose}>

        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Message</Text>
              <TouchableOpacity onPress={handleEditClose}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
                         <FlatList
               style={styles.modalBody}
               data={[{ key: 'form' }]}
               renderItem={() => (
                 <View>
                                       {/* Category Dropdown */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Category</Text>
                      <TouchableOpacity
                        style={styles.dropdown}
                        onPress={() => setCategoryModalVisible(true)}>
                        <Text style={styles.dropdownText}>
                          {selectedCategory !== null ? categories.find(c => c.FieldID === selectedCategory)?.FieldValue : 'Select Category'}
                        </Text>
                        <Text style={styles.dropdownArrow}>▼</Text>
                      </TouchableOpacity>
                    </View>

                   {/* Title TextBox */}
                   <View style={styles.formGroup}>
                     <Text style={styles.formLabel}>Title</Text>
                     <TextInput
                       style={styles.textInput}
                       value={title}
                       onChangeText={setTitle}
                       placeholder="Enter title"
                     />
                   </View>

                   {/* Message Rich Text */}
                   <View style={styles.formGroup}>
                     <Text style={styles.formLabel}>Message</Text>
                     <TextInput
                       style={[styles.textInput, styles.textArea]}
                       value={message}
                       onChangeText={setMessage}
                       placeholder="Enter message"
                       multiline
                       numberOfLines={4}
                       textAlignVertical="top"
                     />
                   </View>

                   {/* Till Date DatePicker */}
                   <View style={styles.formGroup}>
                     <Text style={styles.formLabel}>Till Date</Text>
                     <TouchableOpacity style={styles.datePicker} onPress={showDatePickerModal}>
                       <Text style={styles.datePickerText}>
                         {tillDate || 'Select Date'}
                       </Text>
                     </TouchableOpacity>
                     {showDatePicker && (
                       <DateTimePicker
                         value={tillDate ? new Date(tillDate) : new Date()}
                         mode="date"
                         display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                         onChange={handleDateChange}
                         minimumDate={new Date()}
                       />
                     )}
                   </View>

                   {/* Send Via Email Checkbox */}
                   <View style={styles.formGroup}>
                     <View style={styles.checkboxContainer}>
                       <Switch
                         value={sendViaEmail}
                         onValueChange={setSendViaEmail}
                         trackColor={{ false: '#767577', true: '#133F7C' }}
                         thumbColor={sendViaEmail ? '#fff' : '#f4f3f4'}
                       />
                       <Text style={styles.checkboxLabel}>Send Via Email</Text>
                     </View>
                   </View>

                   {/* Employee Tags Section */}
                   {editData && editData.Item2 && editData.Item2.length > 0 && (
                     <View style={styles.formGroup}>
                       <Text style={styles.formLabel}>Employees</Text>
                       <View style={styles.tagsContainer}>
                         {editData.Item2.map((employee: any, index: number) => (
                           <View key={`employee-${employee.EmpNo || index}`} style={styles.tag}>
                             <Text style={styles.tagText}>
                               {employee.EmpNo} - {employee.EmployeeName}
                             </Text>
                           </View>
                         ))}
                       </View>
                     </View>
                   )}
                 </View>
               )}
               keyExtractor={(item) => item.key}
               showsVerticalScrollIndicator={true}
             />

            {/* Modal Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleEditClose}>
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
                         </View>
           </View>
         </View>
       </Modal>

       {/* Category Selection Modal */}
       <Modal
         animationType="slide"
         transparent={true}
         visible={categoryModalVisible}
         onRequestClose={() => setCategoryModalVisible(false)}>
         <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
             <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>Select Category</Text>
               <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                 <Text style={styles.closeButton}>✕</Text>
               </TouchableOpacity>
             </View>
             <FlatList
               style={styles.modalBody}
               data={categories}
               keyExtractor={(item) => item.FieldID.toString()}
               renderItem={({ item: cat }) => (
                 <TouchableOpacity
                   style={styles.dropdownItem}
                   activeOpacity={0.7}
                   onPress={() => {
                     setSelectedCategory(cat.FieldID);
                     setCategoryModalVisible(false);
                   }}>
                   <Text style={styles.dropdownText}>{cat.FieldValue}</Text>
                 </TouchableOpacity>
               )}
               showsVerticalScrollIndicator={true}
             />
           </View>
         </View>
       </Modal>

       {/* Filter Type Selection Modal */}
       <Modal
         animationType="slide"
         transparent={true}
         visible={filterTypeModalVisible}
         onRequestClose={() => setFilterTypeModalVisible(false)}>
         <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
             <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>Select Filter Type</Text>
               <TouchableOpacity onPress={() => setFilterTypeModalVisible(false)}>
                 <Text style={styles.closeButton}>✕</Text>
               </TouchableOpacity>
             </View>
             <FlatList
               style={styles.modalBody}
               data={filterTypes}
               keyExtractor={(item) => item.EmployeeCategoryId.toString()}
               renderItem={({ item: ft }) => (
                 <TouchableOpacity
                   style={styles.dropdownItem}
                   activeOpacity={0.7}
                   onPress={() => {
                     setSelectedFilterType(ft.EmployeeCategoryId);
                     setFilterTypeModalVisible(false);
                   }}>
                   <Text style={styles.dropdownText}>{ft.EmployeeCategory}</Text>
                 </TouchableOpacity>
               )}
               showsVerticalScrollIndicator={true}
             />
           </View>
         </View>
       </Modal>

       {/* Select Types Selection Modal */}
       <Modal
         animationType="slide"
         transparent={true}
         visible={selectTypeModalVisible}
         onRequestClose={() => setSelectTypeModalVisible(false)}>
         <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
             <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>Select Types</Text>
               <TouchableOpacity onPress={() => setSelectTypeModalVisible(false)}>
                 <Text style={styles.closeButton}>✕</Text>
               </TouchableOpacity>
             </View>
             <FlatList
               style={styles.modalBody}
               data={selectTypes}
               keyExtractor={(item) => item.Id.toString()}
               renderItem={({ item: st }) => (
                 <TouchableOpacity
                   style={[
                     styles.dropdownItem,
                     selectedSelectTypes.includes(st.Id) && styles.dropdownItemSelected
                   ]}
                   activeOpacity={0.7}
                   onPress={() => {
                     setSelectedSelectTypes(prev => {
                       if (prev.includes(st.Id)) {
                         return prev.filter(id => id !== st.Id);
                       } else {
                         return [...prev, st.Id];
                       }
                     });
                   }}>
                   <Text style={[
                     styles.dropdownText,
                     selectedSelectTypes.includes(st.Id) && styles.dropdownTextSelected
                   ]}>
                     {st.Descr}
                   </Text>
                   {selectedSelectTypes.includes(st.Id) && (
                     <Text style={styles.checkmark}>✓</Text>
                   )}
                 </TouchableOpacity>
               )}
               showsVerticalScrollIndicator={true}
             />
             <View style={styles.modalButtons}>
               <TouchableOpacity 
                 style={styles.cancelButton} 
                 onPress={() => setSelectTypeModalVisible(false)}>
                 <Text style={styles.cancelButtonText}>Close</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 style={styles.saveButton} 
                 onPress={() => setSelectTypeModalVisible(false)}>
                 <Text style={styles.saveButtonText}>OK</Text>
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
  scrollContainer: {
    padding: 16,
  },
  card: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#133F7C',
    marginBottom: 6,
  },
  cardLabel: {
    fontSize: 15,
    color: '#333',
    marginBottom: 2,
  },
  cardValue: {
    fontWeight: '600',
    color: '#000',
  },
  lbl: {
    fontSize: 16,
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
  listContainer: {
    padding: 16,
  },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: '#fff',
  },
  rowEven: {
    backgroundColor: '#F1F6FD',
  },
  rowOdd: {
    backgroundColor: '#fff',
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#133F7C',
    marginBottom: 2,
  },
  editButtonContainer: {
    alignItems: 'flex-end',
    marginTop: 10,
    paddingRight: 10,
  },
  editIcon: {
    fontSize: 16,
  },
  rowDetails: {
    fontSize: 14,
    color: '#333',
    flexWrap: 'wrap',
  },
  rowValue: {
    fontSize: 11,
    color: '#000000',
    paddingLeft: 12,
  },
  rowLabel: {
    fontSize: 11,
    color: 'gray',
    paddingLeft: 12,
    fontWeight: '600',
    marginBottom: 1,
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






  // New Button Styles
  newButtonContainer: {
    padding: 16,
    paddingBottom: 8,
    alignItems: 'flex-end',
  },
  newButton: {
    backgroundColor: '#133F7C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  newButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    // backgroundColor: '#fff',
    backgroundColor: '#E5EEFD',
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
  },
  closeButton: {
    fontSize: 20,
    color: '#930606ff',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 15,
    color: '#333',
    marginBottom: 5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
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
  dropdownListwrap:{
    padding: 5,
    paddingTop: 2,
    elevation: 5,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownList: {
    borderRadius: 8,
    marginTop: 1,
    padding: 0,
    paddingTop: 0,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e3e6ffff',
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    // backgroundColor: '#fff',
    minHeight: 44,
    justifyContent: 'center',
  },
  dropdownItemSelected: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 3,
    borderLeftColor: '#133F7C',
  },
  dropdownTextSelected: {
    color: '#133F7C',
    fontWeight: '600',
  },
  checkmark: {
    position: 'absolute',
    right: 12,
    color: '#133F7C',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editButton: {
    padding: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#bbd2f5ff',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  tagText: {
    color: '#133F7C',
    fontSize: 12,
    fontWeight: '500',
  },
});