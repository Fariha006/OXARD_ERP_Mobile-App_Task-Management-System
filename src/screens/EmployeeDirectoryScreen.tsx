import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, ActivityIndicator, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getEmployeeDirectory } from '../api/api';
import UserStorage from '../utils/userStorage';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function EmployeeDirectoryScreen({ navigation }: Props) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const result = await getEmployeeDirectory(token);
        setData(Array.isArray(result) ? result : []);
      } catch (err) {
        setError('Failed to fetch employee directory');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#133F7C" />
          <Text style={styles.loadingText}>Loading employee directory...</Text>
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
          <Text style={styles.pagetitle}>Employee Directory</Text>
        </View>
        <TouchableOpacity style={styles.rightclick}></TouchableOpacity>
      </View>
      <FlatList
        data={data}
        keyExtractor={(item, idx) => item.empl_id?.toString() || idx.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.lbl}>No employees found.</Text>}
        renderItem={({ item, index }) => (
          <View style={[styles.row, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
            <Text style={styles.rowTitle}>{item.empl_name}</Text>
            <Text style={styles.rowLabel}>Employee No: <Text style={styles.rowValue}>{item.empl_no}</Text></Text>
            <Text style={styles.rowLabel}>Designation: <Text style={styles.rowValue}>{item.desg_nam}</Text></Text>
            <Text style={styles.rowLabel}>Branch: <Text style={styles.rowValue}>{item.branch_nam}</Text></Text>
            <Text style={styles.rowLabel}>Cost Center: <Text style={styles.rowValue}>{item.cost_center}</Text></Text>
            <Text style={styles.rowLabel}>Phone: <Text style={styles.rowValue}>{item.phone || '-'}</Text></Text>
            <Text style={styles.rowLabel}>Mobile: <Text style={styles.rowValue}>{item.mobile || '-'}</Text></Text>
            <Text style={styles.rowLabel}>Email: <Text style={styles.rowValue}>{item.email || '-'}</Text></Text>
          </View>
        )}
      />
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
    fontSize: 11,
    color: 'gray',
    paddingLeft: 12,
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
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
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
});