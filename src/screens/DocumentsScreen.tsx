import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, ActivityIndicator } from 'react-native';
import { getDocumentData } from '../api/api';
import UserStorage from '../utils/userStorage';

const ACCORDIONS = [
  { key: 'nationalid', label: 'National Id', item: 'Item1' },
  { key: 'insurance', label: 'Insurance Details', item: 'Item2' },
  { key: 'visa', label: 'Visa Details', item: 'Item3' },
  { key: 'labourcard', label: 'Labour Card Details', item: 'Item4' },
  { key: 'passport', label: 'Passport Details', item: 'Item5' },
  { key: 'otherdocs', label: 'Other Documents', item: 'Item6' },
];

export default function DocumentsScreen({ navigation }: { navigation?: any }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openIndexes, setOpenIndexes] = useState<string[]>([]);

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
        const result = await getDocumentData(token);
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
          <Text style={styles.loadingText}>Loading documents...</Text>
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
          <Text style={styles.pagetitle}>Documents</Text>
        </View>
        <TouchableOpacity style={styles.rightclick}></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {ACCORDIONS.map(({ key, label, item }) => (
          <View key={key} style={styles.accordion}>
            <TouchableOpacity style={[styles.accordionHeader, openIndexes.includes(key) ? styles.accordionHeaderOpen : styles.accordionHeaderClosed]} 
            onPress={() => toggleAccordion(key)}>
              <View style={styles.hdrltficn}>
                <Image source={require('../../assets/images/innerpage/documentd.png')} style={[styles.ltficn, styles.star]} resizeMode="contain" />
                <Text style={styles.accordionTitle}>{label}</Text>
              </View>
              {/* <Text>{openIndexes.includes(key) ? '▲' : '▼'}</Text> */}
            </TouchableOpacity>
            {openIndexes.includes(key) && (
              <View style={styles.accordionContent}>
                {Array.isArray(data?.[item]) && data[item].length === 0 && (
                  <Text style={styles.lbl}>No data found.</Text>
                )}
                {item === 'Item1' && Array.isArray(data?.Item1) && data.Item1.map((d: any) => (
                  [
                    <View key={'NationalId'} style={styles.odd}>
                      <Text style={styles.lbl}>National Id :</Text>
                      <Text style={styles.vlue}>{d['National Id']}</Text>
                    </View>,
                    <View key={'NationalCardNo'} style={styles.even}>
                      <Text style={styles.lbl}>National CardNo :</Text>
                      <Text style={styles.vlue}>{d['National CardNo']}</Text>
                    </View>
                  ]
                ))}
                {item === 'Item2' && Array.isArray(data?.Item2) && data.Item2.map((d: any) => (
                  [
                    <View key={'InsuranceNo'} style={styles.odd}>
                      <Text style={styles.lbl}>Insurance No :</Text>
                      <Text style={styles.vlue}>{d['Insurance No']}</Text>
                    </View>,
                    <View key={'InsuranceClass'} style={styles.even}>
                      <Text style={styles.lbl}>Insurance Class :</Text>
                      <Text style={styles.vlue}>{d['Insurance Class']}</Text>
                    </View>,
                    <View key={'InsuranceStatus'} style={styles.odd}>
                      <Text style={styles.lbl}>Insurance Status :</Text>
                      <Text style={styles.vlue}>{d['Insurance Status']}</Text>
                    </View>,
                    <View key={'InsuranceEffectiveDate'} style={styles.even}>
                      <Text style={styles.lbl}>Insurance Effective Date :</Text>
                      <Text style={styles.vlue}>{d['Insurance Effective Date']}</Text>
                    </View>,
                    <View key={'InsuranceEndDate'} style={styles.odd}>
                      <Text style={styles.lbl}>Insurance End Date :</Text>
                      <Text style={styles.vlue}>{d['Insurance End Date']}</Text>
                    </View>
                  ]
                ))}
                {item === 'Item3' && Array.isArray(data?.Item3) && data.Item3.map((d: any) => (
                  [
                    <View key={'UIDNo'} style={styles.odd}>
                      <Text style={styles.lbl}>UID No :</Text>
                      <Text style={styles.vlue}>{d['UID No']}</Text>
                    </View>,
                    <View key={'VisaNo'} style={styles.even}>
                      <Text style={styles.lbl}>Visa No :</Text>
                      <Text style={styles.vlue}>{d['Visa No']}</Text>
                    </View>,
                    <View key={'PlaceOfIssue'} style={styles.odd}>
                      <Text style={styles.lbl}>Place of Issue :</Text>
                      <Text style={styles.vlue}>{d['Place of Issue']}</Text>
                    </View>,
                    <View key={'VisaIssueDate'} style={styles.even}>
                      <Text style={styles.lbl}>Visa Issue Date :</Text>
                      <Text style={styles.vlue}>{d['Visa Issue Date']}</Text>
                    </View>,
                    <View key={'VisaExpiryDate'} style={styles.odd}>
                      <Text style={styles.lbl}>Visa Expiry Date :</Text>
                      <Text style={styles.vlue}>{d['Visa Expiry Date']}</Text>
                    </View>,
                    <View key={'Sponsor'} style={styles.even}>
                      <Text style={styles.lbl}>Sponsor :</Text>
                      <Text style={styles.vlue}>{d['Sponsor']}</Text>
                    </View>
                  ]
                ))}
                {item === 'Item4' && Array.isArray(data?.Item4) && data.Item4.map((d: any) => (
                  [
                    <View key={'LabourCardNo'} style={styles.odd}>
                      <Text style={styles.lbl}>LabourCard No :</Text>
                      <Text style={styles.vlue}>{d['LabourCard No']}</Text>
                    </View>,
                    <View key={'LabourCardCode'} style={styles.even}>
                      <Text style={styles.lbl}>LabourCard Code :</Text>
                      <Text style={styles.vlue}>{d['LabourCard Code']}</Text>
                    </View>,
                    <View key={'LabourCardExpiryDate'} style={styles.odd}>
                      <Text style={styles.lbl}>LabourCard ExpiryDate :</Text>
                      <Text style={styles.vlue}>{d['LabourCard ExpiryDate']}</Text>
                    </View>,
                    <View key={'LabourCardProfession'} style={styles.even}>
                      <Text style={styles.lbl}>LabourCard Profession :</Text>
                      <Text style={styles.vlue}>{d['LabourCard Profession']}</Text>
                    </View>,
                    <View key={'LabourCardEstablishment'} style={styles.odd}>
                      <Text style={styles.lbl}>LabourCardEstablishment :</Text>
                      <Text style={styles.vlue}>{d['LabourCardEstablishment']}</Text>
                    </View>
                  ]
                ))}
                {item === 'Item5' && Array.isArray(data?.Item5) && data.Item5.map((d: any) => (
                  [
                    <View key={'PassportName'} style={styles.odd}>
                      <Text style={styles.lbl}>Passport Name :</Text>
                      <Text style={styles.vlue}>{d['Passport Name']}</Text>
                    </View>,
                    <View key={'PassportNo'} style={styles.even}>
                      <Text style={styles.lbl}>PassportNo :</Text>
                      <Text style={styles.vlue}>{d['PassportNo']}</Text>
                    </View>,
                    <View key={'PassportPlaceOfIssue'} style={styles.odd}>
                      <Text style={styles.lbl}>PassportPlaceOfIssue :</Text>
                      <Text style={styles.vlue}>{d['PassportPlaceOfIssue']}</Text>
                    </View>,
                    <View key={'PassportIssueDate'} style={styles.even}>
                      <Text style={styles.lbl}>Passport IssueDate :</Text>
                      <Text style={styles.vlue}>{d['Passport IssueDate']}</Text>
                    </View>,
                    <View key={'PassportExpDate'} style={styles.odd}>
                      <Text style={styles.lbl}>Passport ExpDate :</Text>
                      <Text style={styles.vlue}>{d['Passport ExpDate']}</Text>
                    </View>
                  ]
                ))}
                {item === 'Item6' && Array.isArray(data?.Item6) && data.Item6.map((d: any) => (
                  [
                    <View key={'EmpNo'} style={styles.odd}>
                      <Text style={styles.lbl}>EmpNo :</Text>
                      <Text style={styles.vlue}>{d['EmpNo']}</Text>
                    </View>,
                    <View key={'EmployeeName'} style={styles.even}>
                      <Text style={styles.lbl}>EmployeeName :</Text>
                      <Text style={styles.vlue}>{d['EmployeeName']}</Text>
                    </View>,
                    <View key={'DocumentType'} style={styles.odd}>
                      <Text style={styles.lbl}>Document Type :</Text>
                      <Text style={styles.vlue}>{d['Document Type']}</Text>
                    </View>,
                    <View key={'DocumentNo'} style={styles.even}>
                      <Text style={styles.lbl}>Document No :</Text>
                      <Text style={styles.vlue}>{d['Document No']}</Text>
                    </View>,
                    <View key={'Description'} style={styles.odd}>
                      <Text style={styles.lbl}>Description :</Text>
                      <Text style={styles.vlue}>{d['Description']}</Text>
                    </View>,
                    <View key={'PlaceOfIssue'} style={styles.even}>
                      <Text style={styles.lbl}>Place of Issue :</Text>
                      <Text style={styles.vlue}>{d['Place of Issue']}</Text>
                    </View>,
                    <View key={'DateOfIssue'} style={styles.odd}>
                      <Text style={styles.lbl}>Date of Issue :</Text>
                      <Text style={styles.vlue}>{d['Date of Issue']}</Text>
                    </View>,
                    <View key={'ExpiryDate'} style={styles.even}>
                      <Text style={styles.lbl}>Expiry Date :</Text>
                      <Text style={styles.vlue}>{d['Expiry Date']}</Text>
                    </View>,
                    <View key={'Remarks'} style={styles.odd}>
                      <Text style={styles.lbl}>Remarks :</Text>
                      <Text style={styles.vlue}>{d['Remarks']}</Text>
                    </View>
                  ]
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
