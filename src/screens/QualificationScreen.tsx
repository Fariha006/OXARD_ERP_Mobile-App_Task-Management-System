import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, ActivityIndicator } from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getQualificationData } from '../api/api';
import UserStorage from '../utils/userStorage';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const ACCORDIONS = [
  { key: 'education', label: 'Education', item: 'Item1' },
  { key: 'skill', label: 'Skill', item: 'Item2' },
  { key: 'work', label: 'Work Experience', item: 'Item3' },
  { key: 'license', label: 'License', item: 'Item4' },
];

export default function QualificationScreen({ navigation }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openIndexes, setOpenIndexes] = useState<string[]>([]);


  const accordionImages: { [key: string]: any } = {
    Item1: require('../../assets/images/innerpage/educ.png'),
    Item2: require('../../assets/images/innerpage/skill.png'),
    Item3: require('../../assets/images/innerpage/wrkexp.png'),
    Item4: require('../../assets/images/innerpage/lcns.png'),
  };

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
        const result = await getQualificationData(token);
        setData(result);
      } catch (err) {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleAccordion = (key: string) => {
    setOpenIndexes(openIndexes.includes(key)
      ? openIndexes.filter(i => i !== key)
      : [...openIndexes, key]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#133F7C" />
          <Text style={styles.loadingText}>Loading qualifications...</Text>
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
          <Text style={styles.pagetitle}>Qualification</Text>
        </View>
        <TouchableOpacity style={styles.rightclick}></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {ACCORDIONS.map(({ key, label, item }) => (
          <View key={key} style={styles.accordion}>
            <TouchableOpacity style={[styles.accordionHeader, openIndexes.includes(key) ? styles.accordionHeaderOpen : styles.accordionHeaderClosed]}
              onPress={() => toggleAccordion(key)}>
              <View style={styles.hdrltficn}>
                <Image source={require('../../assets/images/innerpage/educ.png')} style={[styles.ltficn, styles.star]} resizeMode="contain" />
                <Text style={styles.accordionTitle}>{label}</Text>
              </View>
              <Text>{openIndexes.includes(key) ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {openIndexes.includes(key) && (
              <View style={styles.accordionContent}>
                {Array.isArray(data?.[item]) && data[item].length === 0 && (
                  <Text style={styles.lbl}>No data found.</Text>
                )}
                {item === 'Item1' && Array.isArray(data?.Item1) && data.Item1.map((q: any, idx: number) => (
                  <View key={idx} style={idx % 2 === 0 ? styles.odd : styles.even}>
                    <Text style={styles.lbl}>Qualification: <Text style={styles.vlue}>{q.Qualification}</Text></Text>
                    <Text style={styles.lbl}>Specialization: <Text style={styles.vlue}>{q.Specialization}</Text></Text>
                    <Text style={styles.lbl}>Institution: <Text style={styles.vlue}>{q.Institution}</Text></Text>
                    <Text style={styles.lbl}>Year Passed: <Text style={styles.vlue}>{q['Year Passed']}</Text></Text>
                    <Text style={styles.lbl}>Score: <Text style={styles.vlue}>{q.Score}</Text></Text>
                    <Text style={styles.lbl}>Remarks: <Text style={styles.vlue}>{q.Remarks}</Text></Text>
                  </View>
                ))}
                {item === 'Item2' && Array.isArray(data?.Item2) && data.Item2.map((s: any, idx: number) => (
                  <View key={idx} style={idx % 2 === 0 ? styles.odd : styles.even}>
                    <Text style={styles.lbl}>Skill: <Text style={styles.vlue}>{s.Skill}</Text></Text>
                    <Text style={styles.lbl}>Experience (Year): <Text style={styles.vlue}>{s['Experience(Year)']}</Text></Text>
                  </View>
                ))}
                {item === 'Item3' && Array.isArray(data?.Item3) && data.Item3.map((w: any, idx: number) => (
                  <View key={idx} style={idx % 2 === 0 ? styles.odd : styles.even}>
                    <Text style={styles.lbl}>Company Name: <Text style={styles.vlue}>{w['Company Name']}</Text></Text>
                    <Text style={styles.lbl}>Job Title: <Text style={styles.vlue}>{w.JobTitle}</Text></Text>
                    <Text style={styles.lbl}>Start Date: <Text style={styles.vlue}>{w['Start Date']}</Text></Text>
                    <Text style={styles.lbl}>End Date: <Text style={styles.vlue}>{w['End Date']}</Text></Text>
                    <Text style={styles.lbl}>Remarks: <Text style={styles.vlue}>{w.Remarks}</Text></Text>
                  </View>
                ))}
                {item === 'Item4' && Array.isArray(data?.Item4) && data.Item4.map((l: any, idx: number) => (
                  <View key={idx} style={idx % 2 === 0 ? styles.odd : styles.even}>
                    <Text style={styles.lbl}>License Type: <Text style={styles.vlue}>{l['License Type']}</Text></Text>
                    <Text style={styles.lbl}>License No: <Text style={styles.vlue}>{l['License No']}</Text></Text>
                    <Text style={styles.lbl}>Issue Date: <Text style={styles.vlue}>{l['Issue Date']}</Text></Text>
                    <Text style={styles.lbl}>Expiry Date: <Text style={styles.vlue}>{l['Expiry Date']}</Text></Text>
                  </View>
                ))}
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
    width: 13,
    height: 20,
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
    marginBottom: 3,
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
});
