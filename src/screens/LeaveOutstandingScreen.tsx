import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, Alert, ActivityIndicator, Image } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNFS from 'react-native-fs';
import { Buffer } from 'buffer';
import { downloadLeaveOutstandingPdf } from '../api/api';
import UserStorage from '../utils/userStorage';

const LeaveOutstandingScreen = ({ navigation }: { navigation?: any }) => {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const onChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  const formatDate = (d: Date) => {
    // Format as yyyy-MM-dd
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const token = await UserStorage.getToken();
      if (!token) {
        Alert.alert('No authentication token found. Please login again.');
        setDownloading(false);
        return;
      }
      const base64data = await downloadLeaveOutstandingPdf('da5010', formattedDate, token);
      if (!base64data.startsWith('JVBERi0')) {
        Alert.alert('Warning', 'PDF base64 does not start with JVBERi0. The file may be invalid.');
      }
      const fileName = `LeaveOutstanding_${formattedDate}.pdf`;
      const path =
        Platform.OS === 'android'
          ? `${RNFS.DownloadDirectoryPath}/${fileName}`
          : `${RNFS.DocumentDirectoryPath}/${fileName}`;
      await RNFS.writeFile(path, base64data, 'base64');
      Alert.alert('Success', `PDF saved to ${path}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to download PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.back, styles.toptitle]}>
        <TouchableOpacity onPress={() => navigation?.goBack && navigation.goBack()}>
          <View style={styles.backicon}>
            <Image source={require('../../assets/images/backarow.png')} style={styles.backiconimg} resizeMode="contain" />
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
          <Text style={styles.dateText}>{date.toISOString().split('T')[0]}</Text>
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
          <Image source={require('../../assets/images/innerpage/download.png')} resizeMode="contain" />
          // <Text style={styles.downloadBtnText}>Download</Text>

        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
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
    width: '100%',
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
  formGroup: {
    width: '90%',
    marginBottom: 24,
    marginTop: 40,
  },
  label: {
    fontSize: 16,
    color: '#343434ff',
    marginBottom: 8,
  },
  dateInput: {
    borderWidth: .5,
    borderColor: '#637b9cff',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
    color: '#000',
  },
  downloadBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cacacaff',
  }
});

export default LeaveOutstandingScreen;