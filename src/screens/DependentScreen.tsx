import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Alert, StyleSheet, Image } from 'react-native';
import { getDependents, DependentInfo } from '../api/api';
import UserStorage from '../utils/userStorage';

export default function DependentScreen({ navigation }: { navigation: any }) {
  const [dependents, setDependents] = useState<DependentInfo[]>([]);
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDependents = async () => {
      setLoading(true);
      setError(null);
      const token = await UserStorage.getToken();
      if (!token) {
        setError('No token found');
        setLoading(false);
        return;
      }
      try {
        const data = await getDependents(token);
        setDependents(data);
      } catch (e) {
        setError('Failed to fetch dependents');
      } finally {
        setLoading(false);
      }
    };
    fetchDependents();
  }, []);

  const toggleAccordion = (idx: number) => {
    setOpenIndexes(openIndexes.includes(idx)
      ? [] // Close all accordions if the clicked one is already open
      : [idx]); // Open only the clicked accordion, closing all others
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
          <Text style={styles.pagetitle}>Dependents</Text>
        </View>
        <TouchableOpacity style={styles.rightclick}></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading dependents...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : dependents.length === 0 ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No dependents found</Text>
          </View>
        ) : (
          dependents.map((dep, idx) => (
            <View key={idx} style={styles.accordion}>
              <TouchableOpacity
                style={[styles.accordionHeader,
                openIndexes.includes(idx) ? styles.accordionHeaderOpen : styles.accordionHeaderClosed]}
                onPress={() => toggleAccordion(idx)}>
                <View style={styles.hdrltficnwrap}>
                <View style={styles.hdrltficn}>
                  <Image
                    source={require('../../assets/images/mydesk/depnds.png')}
                    style={[styles.ltficn, styles.star]} resizeMode="contain" />
                  <Text style={styles.accordionTitle}>{dep.DependentName}</Text>
                </View>
                  <Text style={[styles.accordionTitle, { color: '#888', fontSize: 11 }]}>{dep.Relation}</Text>
                </View>
                {/* <Text>{openIndexes.includes(idx) ? '▲' : '▼'}</Text> */}
              </TouchableOpacity>
              {openIndexes.includes(idx) && (
                <View style={styles.accordionContent}>
                  <View style={styles.odd}>
                    <Text style={styles.lbl}>Relation :</Text>
                    <Text style={styles.vlue}>{dep.Relation}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>Date of Birth :</Text>
                    <Text style={styles.vlue}>{dep.DateofBirthDependent}</Text>
                  </View>
                  <View style={styles.odd}>
                    <Text style={styles.lbl}>Gender :</Text>
                    <Text style={styles.vlue}>{dep.GenderDependent}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>Marital Status :</Text>
                    <Text style={styles.vlue}>{dep.MaritalStatusDependent}</Text>
                  </View>
                  <View style={styles.odd}>
                    <Text style={styles.lbl}>Nationality :</Text>
                    <Text style={styles.vlue}>{dep.DependentNationality}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>Visa No :</Text>
                    <Text style={styles.vlue}>{dep.DependentVisaNo}</Text>
                  </View>
                  <View style={styles.odd}>
                    <Text style={styles.lbl}>Visa Issue Date :</Text>
                    <Text style={styles.vlue}>{dep.DependentVisaIssueDate}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>Visa Expiry Date :</Text>
                    <Text style={styles.vlue}>{dep.DependentVisaExpiryDate}</Text>
                  </View>
                  <View style={styles.odd}>
                    <Text style={styles.lbl}>Passport No :</Text>
                    <Text style={styles.vlue}>{dep.DependentPassportNo}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>Passport Place of Issue :</Text>
                    <Text style={styles.vlue}>{dep.DependentPassportPlaceofIssue}</Text>
                  </View>
                  <View style={styles.odd}>
                    <Text style={styles.lbl}>UID No :</Text>
                    <Text style={styles.vlue}>{dep.DependentUIDNo}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>National ID :</Text>
                    <Text style={styles.vlue}>{dep.NationalIdDependent}</Text>
                  </View>
                  <View style={styles.odd}>
                    <Text style={styles.lbl}>National ID Expiry :</Text>
                    <Text style={styles.vlue}>{dep.NationalIDExpiryDependent}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>Insurance No :</Text>
                    <Text style={styles.vlue}>{dep.DependentInsuranceNo}</Text>
                  </View>
                  <View style={styles.odd}>
                    <Text style={styles.lbl}>Insurance Class :</Text>
                    <Text style={styles.vlue}>{dep.DependentInsuranceClass}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>Insurance Status :</Text>
                    <Text style={styles.vlue}>{dep.DependentInsuranceStatus}</Text>
                  </View>
                  <View style={styles.odd}>
                    <Text style={styles.lbl}>Insurance Effective Date :</Text>
                    <Text style={styles.vlue}>{dep.DependentInsuranceEffectiveDate}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>Insurance End Date :</Text>
                    <Text style={styles.vlue}>{dep.DependentInsuranceEndDate}</Text>
                  </View>
                </View>
              )}
            </View>
          ))
        )}
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
    marginLeft: 20,
  },
  backiconimg: {
    width: 25,
    height: 25,
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
  hdrltficnwrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
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
    marginLeft: 5,
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
    // fontWeight: '600',
    color: '#000000',
    paddingLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ff0000',
    textAlign: 'center',
  },
});