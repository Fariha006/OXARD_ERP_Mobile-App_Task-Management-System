import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Alert, StyleSheet, Image } from 'react-native';
import { getPayments, PaymentInfo } from '../api/api';
import UserStorage from '../utils/userStorage';

export default function PaymentsScreen({ navigation }: { navigation: any }) {
  const [payments, setPayments] = useState<PaymentInfo[]>([]);
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      setError(null);
      const token = await UserStorage.getToken();
      if (!token) {
        setError('No token found');
        setLoading(false);
        return;
      }
      try {
        const data = await getPayments(token);
        setPayments(data);
      } catch (e) {
        setError('Failed to fetch payments');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const toggleAccordion = (idx: number) => {
    setOpenIndexes(openIndexes.includes(idx)
      ? openIndexes.filter(i => i !== idx)
      : [...openIndexes, idx]);
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
          <Text style={styles.pagetitle}>Payments</Text>
        </View>
        <TouchableOpacity style={styles.rightclick}></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading payments...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : payments.length === 0 ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No payments found</Text>
          </View>
        ) : (
          payments.map((pay, idx) => (
            <View key={idx} style={styles.accordion}>
              <TouchableOpacity style={[styles.accordionHeader,
              openIndexes.includes(idx) ? styles.accordionHeaderOpen : styles.accordionHeaderClosed]}
                onPress={() => toggleAccordion(idx)}>
                <View style={styles.hdrltficn}>
                  <Image
                    source={require('../../assets/images/innerpage/payment.png')}
                    style={[styles.ltficn, styles.star]} resizeMode="contain" />
                  <Text style={styles.accordionTitle}>{pay["Payment Mode"] || pay["Beneficiary Name"]}</Text>
                </View>
                <Text>{openIndexes.includes(idx) ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {openIndexes.includes(idx) && (
                <View style={styles.accordionContent}>
                  <View style={styles.odd}>
                    <Text style={styles.lbl}>Payment Mode :</Text>
                    <Text style={styles.vlue}>{pay["Payment Mode"]}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>Branch :</Text>
                    <Text style={styles.vlue}>{pay["Branch "]}</Text>
                  </View>
                  <View style={styles.odd}>
                    <Text style={styles.lbl}>Bank Branch :</Text>
                    <Text style={styles.vlue}>{pay["Bank Branch "]}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>Account No :</Text>
                    <Text style={styles.vlue}>{pay["Account No"]}</Text>
                  </View>
                  <View style={styles.odd}>
                    <Text style={styles.lbl}>IBAN No :</Text>
                    <Text style={styles.vlue}>{pay["IBAN No"]}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>Beneficiary Name :</Text>
                    <Text style={styles.vlue}>{pay["Beneficiary Name"]}</Text>
                  </View>
                  <View style={styles.odd}>
                    <Text style={styles.lbl}>Salary A/C (Yes/NO) :</Text>
                    <Text style={styles.vlue}>{pay["Salary A/C (Yes/NO)"]}</Text>
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
