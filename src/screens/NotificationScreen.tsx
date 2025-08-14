
import React, { useState, useEffect } from 'react'; 
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getNotifications } from '../api/api';
import UserStorage from '../utils/userStorage';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

interface NotificationItem {
  NotificationId: number;
  CategoryId: number;
  NotificationContent: string;
  DocType: string;
  Title: string;
  EmployeeName: string;
  Designation: string;
}

interface AccordionSection {
  key: string;
  caption: string;
  items: NotificationItem[];
}

function flattenRest(obj: any, parentKey: string = ''): any {
  let result = { ...obj };
  Object.keys(obj).forEach((key) => {
    if (key === 'Rest' && typeof obj[key] === 'object') {
      const restFlat = flattenRest(obj[key], parentKey ? parentKey + '_Rest' : 'Rest');
      Object.keys(restFlat).forEach((restKey) => {
        let newKey = parentKey ? `${parentKey}_${restKey}` : `Rest_${restKey}`;
        let counter = 1;
        while (result[newKey]) {
          newKey = `${newKey}_${counter++}`;
        }
        result[newKey] = restFlat[restKey];
      });
      delete result[key];
    } else if (
      typeof obj[key] === 'object' &&
      obj[key] !== null &&
      !Array.isArray(obj[key])
    ) {
      result[key] = flattenRest(obj[key], key);
    }
  });
  return result;
}

function reformatApiResult(obj: any) {
  const flatObj = flattenRest(obj);
  const Hdr: any[] = [];
  const Items: any[] = [];

  Object.values(flatObj).forEach((arr: any) => {
    if (Array.isArray(arr)) {
      arr.forEach((item) => {
        if (item && typeof item === 'object') {
          if ('NotificationCaption' in item) {
            Hdr.push(item);
          } else if ('NotificationContent' in item) {
            Items.push(item);
          }
        }
      });
    }
  });

  return { Hdr, Items };
}

function parseNotificationData(obj: any): AccordionSection[] {
  const { Hdr, Items } = obj;
  const result: AccordionSection[] = [];

  Hdr.forEach((header: any) => {
    const items = Items.filter(
      (item: any) => item.CategoryId === header.CategoryId && item.NotificationContent
    );
    result.push({
      key: `${header.CategoryId}`,
      caption: `${header.Category} (${header.RecordCount})`,
      items,
    });
  });

  return result;
}

export default function NotificationScreen({ navigation }: Props) {
  const [data, setData] = useState<AccordionSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setError(null);
    try {
      const token = await UserStorage.getToken();
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }

      const json = await getNotifications(token);
      const transformedData = reformatApiResult(json);
      setData(parseNotificationData(transformedData));
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, []);

  const handleAccordionPress = (key: string) => {
    setOpenAccordion(openAccordion === key ? null : key);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.back, styles.toptitle]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <View style={styles.backicon}>
            <Image
              source={require('../../assets/images/backarow.png')}
              style={styles.backiconimg}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>
        <View style={styles.pagewrap}>
          <Text style={styles.pagetitle}>Notifications</Text>
        </View>
        <TouchableOpacity style={styles.rightclick}></TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            fetchData();
          }} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#133F7C" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : data.length === 0 ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No notifications available</Text>
          </View>
        ) : (
          data.map((section) => (
            <View style={styles.accordion} key={section.key}>
              <TouchableOpacity
                style={[
                  styles.accordionHeader,
                  openAccordion === section.key
                    ? styles.accordionHeaderOpen
                    : styles.accordionHeaderClosed,
                ]}
                onPress={() => handleAccordionPress(section.key)}
              >
                <View style={styles.hdrltficn}>
                  <Image
                    source={require('../../assets/images/innerpage/Notificationnew.png')}
                    style={[styles.ltficn, styles.star]}
                    resizeMode="contain"
                  />
                  <Text style={styles.accordionTitle}>{section.caption}</Text>
                </View>
                {/* <Text>{openAccordion === section.key ? '▲' : '▼'}</Text> */}
              </TouchableOpacity>

              {openAccordion === section.key && (
                <View style={styles.accordionContent}>
                  {section.items.map((item,index) => (
                    <View
                      key={item.NotificationId?.toString() || Math.random().toString()}
                      style={index % 2 === 0 ? styles.even : styles.odd}
                    >
                      <Text style={styles.lbl}>{item.Title}</Text>
                      <Text style={styles.vlue}>{item.NotificationContent}</Text>
                      {item.CategoryId ==9 && (
                        <Text style={styles.messegesby}>{item.EmployeeName} | {item.Designation}</Text>
                      )}
                    </View>
                  ))}
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
    alignItems: 'center',
  },
  ltficn: {
    width: 15,
    height: 22,
  },
  star: {
    width: 20,
    height: 22,
    marginRight: 10,
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
  },
  accordionContent: {
    marginTop: 10,
    paddingHorizontal: 6,
  },
  odd: {
    backgroundColor: '#ffffff',
    marginBottom: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
  
  },
  even: {
    backgroundColor: '#E2EDFC',
    marginBottom: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    paddingBottom: 10,
    paddingTop: 10,

    
  },
  lbl: {
    fontSize: 11,
    color: '#000000',
    paddingLeft: 12,
    fontWeight: '600',
    marginBottom:5,
  },
  vlue: {
    fontSize: 11,
    // fontWeight: '600',
    color: '#000000',
    paddingLeft: 12,
  },
   messegesby: {
    fontSize: 11,
    // fontWeight: '600',
    color: 'gray',
    paddingLeft: 12,
    marginTop: 5,
    fontWeight: '600',
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
