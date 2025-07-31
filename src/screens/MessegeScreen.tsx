import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, ActivityIndicator, FlatList, Modal, TextInput, Switch, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getMesseges, fetchMessageCategories, fetchSelectTypes, saveMessage } from '../api/api';
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
    if (modalVisible) {
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
  }, [modalVisible]);

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
        "Mode": "I",
        "NotificationId": "0",
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
        setModalVisible(false);
        setSelectedCategory(null);
        setTitle('');
        setMessage('');
        setTillDate('');
        setSendViaEmail(false);
        setSelectedFilterType(null);
        setSelectedSelectTypes([]);
        setSelectTypes([]);
        
        // Optionally refresh the messages list
        // You can add a callback here to refresh the main list
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
      <View style={styles.newButtonContainer}>
        <TouchableOpacity style={styles.newButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.newButtonText}>New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item, idx) => item.NotificationId?.toString() || idx.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.lbl}>No notifications found.</Text>}
        renderItem={({ item, index }) => (
          <View style={[styles.row, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
            <Text style={styles.rowTitle}>{item.Title}</Text>
            <Text style={styles.rowLabel}>Notification ID: <Text style={styles.rowValue}>{item.NotificationId}</Text></Text>
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
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Message</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {/* Category Dropdown */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                                 <TouchableOpacity
                   style={styles.dropdown}
                   onPress={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                 >
                  <Text style={styles.dropdownText}>
                    {selectedCategory !== null ? categories.find(c => c.FieldID === selectedCategory)?.FieldValue : 'Select Category'}
                  </Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
                                 {categoryDropdownOpen && (
                   <View style={styles.dropdownList}>
                     {categories.map(cat => (
                                               <TouchableOpacity
                          key={cat.FieldID}
                          style={styles.dropdownItem}
                          activeOpacity={0.7}
                          onPress={() => {
                            setSelectedCategory(cat.FieldID);
                            setCategoryDropdownOpen(false);
                          }}
                        >
                         <Text style={styles.dropdownText}>{cat.FieldValue}</Text>
                       </TouchableOpacity>
                     ))}
                   </View>
                 )}
              </View>

                             {/* Filter Types Dropdown */}
               <View style={styles.formGroup}>
                 <Text style={styles.formLabel}>Filter Types</Text>
                                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setFilterTypeDropdownOpen(!filterTypeDropdownOpen)}
                  >
                   <Text style={styles.dropdownText}>
                     {selectedFilterType !== null ? filterTypes.find(f => f.EmployeeCategoryId === selectedFilterType)?.EmployeeCategory : 'Select Filter Type'}
                   </Text>
                   <Text style={styles.dropdownArrow}>▼</Text>
                 </TouchableOpacity>
                                  {filterTypeDropdownOpen && (
                    <View style={styles.dropdownList}>
                      {filterTypes.map(ft => (
                        <TouchableOpacity
                          key={ft.EmployeeCategoryId}
                          style={styles.dropdownItem}
                          activeOpacity={0.7}
                          onPress={() => {
                            setSelectedFilterType(ft.EmployeeCategoryId);
                            setFilterTypeDropdownOpen(false);
                            // loadSelectTypes(ft.EmployeeCategoryId);
                          }}
                        >
                          <Text style={styles.dropdownText}>{ft.EmployeeCategory}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
               </View>

               {/* Select Types Dropdown */}
               <View style={styles.formGroup}>
                 <Text style={styles.formLabel}>Select Types</Text>
                                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={async () => {
                      if (!selectTypeDropdownOpen && selectedFilterType !== null) {
                        try {
                          const token = await UserStorage.getToken();
                          if (token) {
                            const result = await fetchSelectTypes(token, selectedFilterType);
                            setSelectTypes(result || []);
                          } else {
                            console.error('No authentication token found');
                            setSelectTypes([]);
                          }
                        } catch (e) {
                          console.error('Failed to fetch select types:', e);
                          setSelectTypes([]);
                        }
                      }
                      setSelectTypeDropdownOpen(!selectTypeDropdownOpen);
                    }}
                  >
                                        <Text style={styles.dropdownText}>
                      {selectedSelectTypes.length > 0 
                        ? `${selectedSelectTypes.length} selected` 
                        : 'Select Types'}
                    </Text>
                   <Text style={styles.dropdownArrow}>▼</Text>
                 </TouchableOpacity>
                                  {selectTypeDropdownOpen && (
                    <View style={styles.dropdownList}>
                      {selectTypes.map(st => (
                        <TouchableOpacity
                          key={st.Id}
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
                          }}
                        >
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
                      ))}
                    </View>
                  )}
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
            </ScrollView>

            {/* Modal Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                <Text style={styles.cancelButtonText}>Close</Text>
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
    marginLeft: 15,
  },
  backiconimg: {
    width: 13,
    height: 20,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#133F7C',
    marginBottom: 2,
  },
  rowDetails: {
    fontSize: 14,
    color: '#333',
    flexWrap: 'wrap',
  },
  rowValue: {
    fontWeight: '600',
    color: '#000',
  },
  rowLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 1,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#133F7C',
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 16,
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
    backgroundColor: '#fff',
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#133F7C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 180,
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
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
});