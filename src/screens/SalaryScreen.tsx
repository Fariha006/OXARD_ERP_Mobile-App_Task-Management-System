import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, ActivityIndicator } from 'react-native';
import { getSalaryData } from '../api/api';
import UserStorage from '../utils/userStorage';

export default function SalaryScreen({ navigation }: { navigation?: any }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accordionOpen, setAccordionOpen] = useState(true);

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
        const result = await getSalaryData(token);
        setData(Array.isArray(result) ? result : []);
      } catch (err) {
        setError('Failed to fetch data');
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
          <Text style={styles.loadingText}>Loading salary details...</Text>
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
          <Text style={styles.pagetitle}>Salary</Text>
        </View>
        <TouchableOpacity style={styles.rightclick}></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.accordion}>
          <TouchableOpacity style={styles.accordionHeader} onPress={() => setAccordionOpen(!accordionOpen)}>
            <View style={styles.hdrltficn}>
              <Image source={require('../../assets/images/innerpage/salry.png')} style={[styles.ltficn, styles.star]} resizeMode="contain" />
              <Text style={styles.accordionTitle}>Salary Details</Text>
            </View>
            {/* <Text>{accordionOpen ? '▲' : '▼'}</Text> */}
          </TouchableOpacity>
          {accordionOpen && (
            <View style={styles.accordionContent}>
              {data.length === 0 && <Text style={styles.lbl}>No data found.</Text>}
              {data.map((item, idx) => (
                <View key={item.PayHeadId || idx} style={idx % 2 === 0 ? styles.odd : styles.even}>
                  <Text style={styles.lbl}>{item.PayHeadName}:</Text>

                  <Text style={styles.vlue}>{item.BaseAmount}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
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
    color: '#811458',
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
    backgroundColor: '#F0F0F0',
    padding: 10,
    borderRadius: 20,
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
    backgroundColor: '#F0F0F0',
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
});
