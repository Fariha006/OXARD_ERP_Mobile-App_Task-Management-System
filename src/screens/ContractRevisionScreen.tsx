import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, ActivityIndicator } from 'react-native';
import { getContractRevisionData } from '../api/api';
import UserStorage from '../utils/userStorage';

export default function ContractRevisionScreen({ navigation }: { navigation?: any }) {
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
        const result = await getContractRevisionData(token);
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
          <Text style={styles.loadingText}>Loading contract revisions...</Text>
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
          <Text style={styles.pagetitle}>Contract Revision</Text>
        </View>
        <TouchableOpacity style={styles.rightclick}></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.accordion}>
          <TouchableOpacity style={styles.accordionHeader}
            onPress={() => setAccordionOpen(!accordionOpen)}>
            <View style={styles.hdrltficn}>
              <Image source={require('../../assets/images/innerpage/star.png')} style={[styles.ltficn, styles.star]} resizeMode="contain" />
              <Text style={styles.accordionTitle}>Revision Effective from</Text>
            </View>
            <Text>{accordionOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {accordionOpen && (
            <View style={styles.accordionContent}>
              {data.length === 0 && <Text style={styles.lbl}>No data found.</Text>}
              {data.map((item, idx) => (
                <View key={idx} style={idx % 2 === 0 ? styles.odd : styles.even}>
                  <Text style={styles.lbl}>Revision Type:</Text>
                  <Text style={styles.vlue}>{item['Revision Type']}</Text>
                  <Text style={styles.lbl}>Probation:</Text>
                  <Text style={styles.vlue}>{item['Probstatus'] ?? '-'}</Text>
                  <Text style={styles.lbl}>Branch:</Text>
                  <Text style={styles.vlue}>{item['BranchNam']}</Text>
                  <Text style={styles.lbl}>Department:</Text>
                  <Text style={styles.vlue}>{item['DeptDesc']}</Text>
                  <Text style={styles.lbl}>Designation:</Text>
                  <Text style={styles.vlue}>{item['DesgNam']}</Text>
                </View>
              ))}
              
                        <View style={styles.mydeskbtnfirstraw}>
                          <View style={styles.tile}>
                            <TouchableOpacity style={styles.algnbtn} onPress={() => navigation.navigate('Main', { screen: 'Salary' })}>
                              <Image source={require('../../assets/images/innerpage/cntractinfo.png')} style={styles.image} />
                              <Text style={styles.title}>Contract Info</Text>
                            </TouchableOpacity>
                          </View>
                          <View style={styles.tile}>
                            <TouchableOpacity style={styles.algnbtn} onPress={() => navigation.navigate('Main', { screen: 'Eligibilities' })}>
                              <Image source={require('../../assets/images/innerpage/salary.png')} style={styles.image} />
                              <Text style={styles.title}>Salary</Text>
                            </TouchableOpacity>
                          </View>
                          <View style={styles.tile}>
                            <TouchableOpacity style={styles.algnbtn} onPress={() => navigation.navigate('Main', { screen: 'ContractRevision' })}>
                              <Image source={require('../../assets/images/innerpage/eligibility.png')} style={styles.image} />
                              <Text style={styles.title}>Eligibilities</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
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
    backgroundColor: '#E1E6EC',
    borderRadius: 20,
  },
  accordionHeaderOpen: {
    backgroundColor: '#E1E6EC',
  },
  accordionHeaderClosed: {
    borderColor: '#DEECFF',
    borderWidth: 1,
    borderStyle: 'solid',
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  accordionContent: {
    marginTop: 10,
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
    fontSize: 16,
    color: '#000000',
    paddingLeft: 12,
  },
  vlue: {
    fontSize: 16,
    fontWeight: '600',
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
  mydeskbtnfirstraw: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 2,
    paddingRight: 2,
    paddingTop: 25,
    paddingBottom: 5,
  },
  tile: {
    height: 32,
    borderRadius: 20,
    marginBottom: 0,
    backgroundColor: '#002F63',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    paddingLeft: 18,
    paddingRight: 18,
  },

  algnbtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 12,
    textAlign: 'center',
    color: '#ffffff',
    marginLeft: 6,
  },
  image: {
    width: 16,
    height: 16,
    marginBottom: 0,
    resizeMode: 'contain',
    alignItems: 'center'
  },
});
