import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, Button, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList,
  SafeAreaView, StatusBar, ActivityIndicator, Dimensions, Modal, Alert,Platform, PermissionsAndroid, NativeModules
} from 'react-native';
import RNFS from 'react-native-fs';
import RNFetchBlob from 'react-native-blob-util';
const { MediaStoreModule } = NativeModules;

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getNotifications, getFileUrl, managetoken, fetchMessageForEdit } from '../api/api';
import UserStorage from '../utils/userStorage';
import NotificationService from '../services/NotificationService';
import { useFocusEffect } from '@react-navigation/native';

// Add these declarations at the top for web compatibility
// @ts-ignore
// eslint-disable-next-line
declare var window: any;
// @ts-ignore
// eslint-disable-next-line
declare var document: any;

const { width } = Dimensions.get('window');
type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;
interface NotificationItem {
  NotificationId: number;
  CategoryId: number;
  NotificationContent: string;
  DocType: string;
}

interface AccordionSection {
  key: string;
  caption: string;
  items: NotificationItem[];
}

interface CircularItem {
  id: string;
  caption: string;
  listTitle: string;
  content: string;
  photoUrl: string;
  NotificationId: number;
}

interface EventItem {
  id: string;
  caption: string;
  listTitle: string;
  content: string;
  photoUrl: string;
  NotificationId: number;
}

interface AnnouncementItem {
  id: string;
  caption: string;
  listTitle: string;
  content: string;
  photoUrl: string;
  NotificationId: number;
}

interface BannerItem {
  id: string;
  caption: string;
  listTitle: string;
  content: string;
  photoUrl: string;
  NotificationId: number;
}

interface MemoItem {
  id: string;
  caption: string;
  listTitle: string;
  content: string;
  photoUrl: string;
  NotificationId: number;
}

interface MessageItem {
  id: string;
  caption: string;
  listTitle: string;
  content: string;
  photoUrl: string;
  employeeName: string;
  designation: string;
  NotificationId: number;
}

interface NotificationListItem {
  id: string;
  name: string;
  role: string;
  image: any;
  tags: string;
  NotificationId: number;
}

interface HolidayListItem {
  id: string;
  name: string;
  role: string;
  image: any;
  tags: string;
  NotificationId: number;
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
export default function HomeScreen({ navigation }: Props) {
  const [data, setData] = useState<AccordionSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [circularCurrentIndex, setCircularCurrentIndex] = useState(0);
  const [eventCurrentIndex, setEventCurrentIndex] = useState(0);
  const [announcementCurrentIndex, setAnnouncementCurrentIndex] = useState(0);
  const [bannerCurrentIndex, setBannerCurrentIndex] = useState(0);
  const [memoCurrentIndex, setMemoCurrentIndex] = useState(0);
  const [messageCurrentIndex, setMessageCurrentIndex] = useState(0);
  const [birthdayData, setBirthdayData] = useState<any[]>([]);
  const [circularData, setCircularData] = useState<CircularItem[]>([]);
  const [eventData, setEventData] = useState<EventItem[]>([]);
  const [announcementData, setAnnouncementData] = useState<AnnouncementItem[]>([]);
  const [bannerData, setBannerData] = useState<BannerItem[]>([]);
  const [memoData, setMemoData] = useState<MemoItem[]>([]);
  const [messageData, setMessageData] = useState<MessageItem[]>([]);
  const [notificationListData, setNotificationListData] = useState<NotificationListItem[]>([]);
  const [notificationListCurrentIndex, setNotificationListCurrentIndex] = useState(0);
  const [holidayListData, setHolidayListData] = useState<HolidayListItem[]>([]);
  const [holidayListCurrentIndex, setHolidayListCurrentIndex] = useState(0);
  const [approvalCount, setApprovalCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [fetchedData, setFetchedData] = useState<any>(null);
  const [loadingModal, setLoadingModal] = useState(false);
  const flatListRef = useRef<FlatList<any>>(null);
  const circularFlatListRef = useRef<FlatList<CircularItem>>(null);
  const eventFlatListRef = useRef<FlatList<EventItem>>(null);
  const announcementFlatListRef = useRef<FlatList<AnnouncementItem>>(null);
  const bannerFlatListRef = useRef<FlatList<BannerItem>>(null);
  const memoFlatListRef = useRef<FlatList<MemoItem>>(null);
  const messageFlatListRef = useRef<FlatList<MessageItem>>(null);
  const notificationListFlatListRef = useRef<FlatList<NotificationListItem>>(null);
  const holidayListFlatListRef = useRef<FlatList<HolidayListItem>>(null);

  const fetchData = async () => {
    setError(null);
    try {
      const token = await UserStorage.getToken();
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }

      const json = await getNotifications(token, "1", "0");
      const transformedData = reformatApiResult(json);
      setData(parseNotificationData(transformedData));

      // Process birthday data (CategoryId = 2)
      const flattenedData = flattenRest(json);
      const birthdayItems = processBirthdayData(flattenedData);
      setBirthdayData(birthdayItems);

      // Process notification list data (CategoryId = 3)
      const notificationListItems = processNotificationListData(flattenedData);
      setNotificationListData(notificationListItems);

      // Process holiday list data (CategoryId = 10)
      const holidayListItems = processHolidayListData(flattenedData);
      setHolidayListData(holidayListItems);

      // Process circular data (CategoryId = 4)
      const circularItems = processCircularData(flattenedData);
      setCircularData(circularItems);

      // Process event data (CategoryId = 5)
      const eventItems = processEventData(flattenedData);
      setEventData(eventItems);

      // Process announcement data (CategoryId = 6)
      const announcementItems = processAnnouncementData(flattenedData);
      setAnnouncementData(announcementItems);

      // Process banner data (CategoryId = 7)
      const bannerItems = processBannerData(flattenedData);
      setBannerData(bannerItems);

      // Process memo data (CategoryId = 8)
      const memoItems = processMemoData(flattenedData);
      setMemoData(memoItems);

      // Process message data (CategoryId = 9)
      const messageItems = processMessageData(flattenedData);
      setMessageData(messageItems);

    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Process birthday data from API response
  const processBirthdayData = (apiData: any): any[] => {
    const birthdayItems: any[] = [];
    let autoIncrementId = 1;

    // Extract all items from the flattened structure
    const allItems: any[] = [];

    Object.values(apiData).forEach((arr: any) => {
      if (Array.isArray(arr)) {
        arr.forEach((item) => {
          if (item && typeof item === 'object' && item.CategoryId === 2 && item.DocType !=null) {
            allItems.push(item);
          }
        });
      }
    });

    // Transform items to required format
    allItems.forEach((item) => {
      birthdayItems.push({
        id: autoIncrementId.toString(),
        name: item.EmployeeName || 'Unknown',
        role: item.Designation || 'Employee',
        image: item.EmployeePhotoUrl ? getFileUrl(`/${item.EmployeePhotoUrl}`) : require('../../assets/images/birthday.png'),
        tags: item.NotificationContent || 'Happy Birthday!',
        NotificationId: item.NotificationId || 0,
      });
      autoIncrementId++;
    });

    return birthdayItems;
  };

  // Process circular data from API response
  const processCircularData = (apiData: any): CircularItem[] => {
    const circularItems: CircularItem[] = [];
    let autoIncrementId = 1;

    // Extract all items from the flattened structure
    const allItems: any[] = [];

    Object.values(apiData).forEach((arr: any) => {
      if (Array.isArray(arr)) {
        arr.forEach((item) => {
          if (item && typeof item === 'object' &&
            item.CategoryId === 4 &&
            item.DocType === 'Circulars') {
            allItems.push(item);
          }
        });
      }
    });

    // Transform items to required format
    allItems.forEach((item) => {
      circularItems.push({
        id: autoIncrementId.toString(),
        caption: item.DocType || 'Circular',
        listTitle: item.Title || 'No Title',
        content: item.NotificationContent || 'No content available',
        photoUrl: item.EmployeePhotoUrl ? getFileUrl(`/${item.EmployeePhotoUrl}`) : require('../../assets/images/icon!.png'),
        NotificationId: item.NotificationId || 0,
      });
      autoIncrementId++;
    });

    return circularItems;
  };

  // Process event data from API response
  const processEventData = (apiData: any): EventItem[] => {
    const eventItems: EventItem[] = [];
    let autoIncrementId = 1;

    // Extract all items from the flattened structure
    const allItems: any[] = [];

    Object.values(apiData).forEach((arr: any) => {
      if (Array.isArray(arr)) {
        arr.forEach((item) => {
          if (item && typeof item === 'object' &&
            item.CategoryId === 5 &&
            item.DocType === 'Events') {
            allItems.push(item);
          }
        });
      }
    });

    // Transform items to required format
    allItems.forEach((item) => {
      eventItems.push({
        id: autoIncrementId.toString(),
        caption: item.DocType || 'Event',
        listTitle: item.Title || 'No Title',
        content: item.NotificationContent || 'No content available',
        photoUrl: item.EmployeePhotoUrl ? getFileUrl(`/${item.EmployeePhotoUrl}`) : require('../../assets/images/icon!.png'),
        NotificationId: item.NotificationId || 0,
      });
      autoIncrementId++;
    });

    return eventItems;
  };

  // Process announcement data from API response
  const processAnnouncementData = (apiData: any): AnnouncementItem[] => {
    const announcementItems: AnnouncementItem[] = [];
    let autoIncrementId = 1;

    // Extract all items from the flattened structure
    const allItems: any[] = [];

    Object.values(apiData).forEach((arr: any) => {
      if (Array.isArray(arr)) {
        arr.forEach((item) => {
          if (item && typeof item === 'object' &&
            item.CategoryId === 6 &&
            item.DocType === 'Announcements') {
            allItems.push(item);
          }
        });
      }
    });

    // Transform items to required format
    allItems.forEach((item) => {
      announcementItems.push({
        id: autoIncrementId.toString(),
        caption: item.DocType || 'Announcement',
        listTitle: item.Title || 'No Title',
        content: item.NotificationContent || 'No content available',
        photoUrl: item.EmployeePhotoUrl ? getFileUrl(`/${item.EmployeePhotoUrl}`) : require('../../assets/images/icon!.png'),
        NotificationId: item.NotificationId || 0,
      });
      autoIncrementId++;
    });

    return announcementItems;
  };

  // Process banner data from API response
  const processBannerData = (apiData: any): BannerItem[] => {
    const bannerItems: BannerItem[] = [];
    let autoIncrementId = 1;

    // Extract all items from the flattened structure
    const allItems: any[] = [];

    Object.values(apiData).forEach((arr: any) => {
      if (Array.isArray(arr)) {
        arr.forEach((item) => {
          if (item && typeof item === 'object' &&
            item.CategoryId === 7 &&
            item.DocType === 'Banners') {
            allItems.push(item);
          }
        });
      }
    });

    // Transform items to required format
    allItems.forEach((item) => {
      bannerItems.push({
        id: autoIncrementId.toString(),
        caption: item.DocType || 'Banner',
        listTitle: item.Title || 'No Title',
        content: item.NotificationContent || 'No content available',
        photoUrl: item.EmployeePhotoUrl ? getFileUrl(`/${item.EmployeePhotoUrl}`) : require('../../assets/images/icon!.png'),
        NotificationId: item.NotificationId || 0,
      });
      autoIncrementId++;
    });

    return bannerItems;
  };

  // Process memo data from API response
  const processMemoData = (apiData: any): MemoItem[] => {
    const memoItems: MemoItem[] = [];
    let autoIncrementId = 1;

    // Extract all items from the flattened structure
    const allItems: any[] = [];

    Object.values(apiData).forEach((arr: any) => {
      if (Array.isArray(arr)) {
        arr.forEach((item) => {
          if (item && typeof item === 'object' &&
            item.CategoryId === 8 &&
            item.DocType === 'Memos') {
            allItems.push(item);
          }
        });
      }
    });

    // Transform items to required format
    allItems.forEach((item) => {
      memoItems.push({
        id: autoIncrementId.toString(),
        caption: item.DocType || 'Memo',
        listTitle: item.Title || 'No Title',
        content: item.NotificationContent || 'No content available',
        photoUrl: item.EmployeePhotoUrl ? getFileUrl(`/${item.EmployeePhotoUrl}`) : require('../../assets/images/icon!.png'),
        NotificationId: item.NotificationId || 0,
      });
      autoIncrementId++;
    });

    return memoItems;
  };

  // Process message data from API response
  const processMessageData = (apiData: any): MessageItem[] => {
    const messageItems: MessageItem[] = [];
    let autoIncrementId = 1;

    // Extract all items from the flattened structure
    const allItems: any[] = [];

    Object.values(apiData).forEach((arr: any) => {
      if (Array.isArray(arr)) {
        arr.forEach((item) => {
          if (item && typeof item === 'object' &&
            item.CategoryId === 9 &&
            item.DocType === 'Messages') {
            allItems.push(item);
          }
        });
      }
    });

    // Transform items to required format
    allItems.forEach((item) => {
      messageItems.push({
        id: autoIncrementId.toString(),
        caption: item.DocType || 'Message',
        listTitle: item.Title || 'No Title',
        content: item.NotificationContent || 'No content available',
        photoUrl: item.EmployeePhotoUrl ? getFileUrl(`/${item.EmployeePhotoUrl}`) : require('../../assets/images/icon!.png'),
        employeeName: item.EmployeeName || 'Unknown',
        designation: item.Designation || 'Employee',
        NotificationId: item.NotificationId || 0,
      });
      autoIncrementId++;
    });

    return messageItems;
  };

  // Process notification list data (CategoryId = 3)
  const processNotificationListData = (apiData: any): NotificationListItem[] => {
    const notificationListItems: NotificationListItem[] = [];
    let autoIncrementId = 1;
    const allItems: any[] = [];

    Object.values(apiData).forEach((arr: any) => {
      if (Array.isArray(arr)) {
        arr.forEach((item) => {
          if (item && typeof item === 'object' &&
            item.CategoryId === 3 &&
            item.DocType === 'Notifications') {
            allItems.push(item);
          }
        });
      }
    });

    allItems.forEach((item) => {
      notificationListItems.push({
        id: autoIncrementId.toString(),
        name: item.DocType || 'Notifications',
        role: item.Title || '',
        image: item.EmployeePhotoUrl ? getFileUrl(`/${item.EmployeePhotoUrl}`) : require('../../assets/images/birthday.png'),
        tags: item.NotificationContent || '',
        NotificationId: item.NotificationId || 0,
      });
      autoIncrementId++;
    });

    return notificationListItems;
  };

  // Process holiday list data (CategoryId = 10)
  const processHolidayListData = (apiData: any): HolidayListItem[] => {
    const holidayListItems: HolidayListItem[] = [];
    let autoIncrementId = 1;
    const allItems: any[] = [];

    Object.values(apiData).forEach((arr: any) => {
      if (Array.isArray(arr)) {
        arr.forEach((item) => {
          if (item && typeof item === 'object' &&
            item.CategoryId === 10 && item.DocType !=null) {
            allItems.push(item);
          }
        });
      }
    });

    allItems.forEach((item) => {
      holidayListItems.push({
        id: autoIncrementId.toString(),
        name: item.DocType || 'Holiday List',
        role: item.Title || 'Holiday List',
        image: item.EmployeePhotoUrl ? getFileUrl(`/${item.EmployeePhotoUrl}`) : require('../../assets/images/birthday.png'),
        tags: item.NotificationContent || '',
        NotificationId: item.NotificationId || 0,
      });
      autoIncrementId++;
    });

    return holidayListItems;
  };

  // Load approval and message counts
  const loadCounts = async () => {
    try {
      const approval = await UserStorage.getApprovalCount();
      const message = await UserStorage.getMessageCount();
      setApprovalCount(approval);
      setMessageCount(message);
      console.log('HomeScreen: Loaded counts - Approval:', approval, 'Message:', message);
    } catch (error) {
      console.error('Error loading counts:', error);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
    loadCounts();
    
    // Save FCM token to backend when HomeScreen loads
    const saveFcmTokenToBackend = async () => {
      try {
        const fcmToken = await UserStorage.getFcmToken();
        const bearerToken = await UserStorage.getToken();
        
        if (fcmToken) {
          console.log('🔄 Saving FCM token to backend from HomeScreen...');
          const result = await managetoken(fcmToken, bearerToken || undefined);
          if (result.success) {
            console.log('✅ FCM token saved to backend successfully');
          } else {
            console.error('❌ Failed to save FCM token to backend:', result.message);
          }
        } else {
          console.log('⚠️ No FCM token found in storage');
        }
      } catch (error) {
        console.error('❌ Error saving FCM token to backend:', error);
      }
    };
    
    saveFcmTokenToBackend();
  }, []);

  // Refresh HomeScreen data whenever it comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      fetchData();
      loadCounts();
      // No need to save FCM token every time
    }, [])
  );

  const tiles = [
    { id: 1, title: 'My Desk', image: require('../../assets/images/home/mydesk.png'), route: 'Main', screen: 'MyDesk' },
    { id: 4, title: 'Approval', image: require('../../assets/images/home/aproval.png'), route: 'Main', screen: 'Approvals' },
    { id: 6, title: 'Messages', image: require('../../assets/images/home/msgs.png'), route: 'Main', screen: 'Messege' },
    { id: 2, title: 'My Requests', image: require('../../assets/images/home/request.png'), route: 'Main', screen: 'RequestDashboard' },
    { id: 3, title: 'Payslips', image: require('../../assets/images/home/payslip.png'), route: 'Main', screen: 'Payslip' },
    


    { id: 7, title: 'Leave Balance ', image: require('../../assets/images/home/leave.png'), route: 'Main', screen: 'LeaveOutstanding' },
    { id: 5, title: 'Directory', image: require('../../assets/images/home/directory.png'), route: 'Main', screen: 'EmployeeDirectory' },
    //{ id: 8, title: 'Approval', image: require('../../assets/images/home/aprovb.png'), route: 'Main', screen: 'Approval' },
    // { id: 9, title: 'Add ', image: require('../../assets/images/home/addbtn.png'), route: 'Main', screen: 'Add' },
  ];

  // Auto-scroll effect for birthday - moved after DATA declaration
  useEffect(() => {
    const interval = setInterval(() => {
      if (flatListRef.current && birthdayData.length > 0) {
        const nextIndex = (currentIndex + 1) % birthdayData.length;
        flatListRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
          viewPosition: 0.5
        });
        setCurrentIndex(nextIndex);
      }
    }, 5000); // Scroll every 5 seconds
    return () => clearInterval(interval);
  }, [currentIndex, birthdayData.length]);

  // Auto-scroll effect for circular
  useEffect(() => {
    const interval = setInterval(() => {
      if (circularFlatListRef.current && circularData.length > 0) {
        const nextIndex = (circularCurrentIndex + 1) % circularData.length;
        circularFlatListRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
          viewPosition: 0.5
        });
        setCircularCurrentIndex(nextIndex);
      }
    }, 4000); // Scroll every 4 seconds (slightly faster than birthday)
    return () => clearInterval(interval);
  }, [circularCurrentIndex, circularData.length]);

  // Auto-scroll effect for announcements
  useEffect(() => {
    const interval = setInterval(() => {
      if (announcementFlatListRef.current && announcementData.length > 0) {
        const nextIndex = (announcementCurrentIndex + 1) % announcementData.length;
        announcementFlatListRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
          viewPosition: 0.5
        });
        setAnnouncementCurrentIndex(nextIndex);
      }
    }, 3500); // Scroll every 3.5 seconds (faster than circular)
    return () => clearInterval(interval);
  }, [announcementCurrentIndex, announcementData.length]);

  // Auto-scroll effect for events
  useEffect(() => {
    const interval = setInterval(() => {
      if (eventFlatListRef.current && eventData.length > 0) {
        const nextIndex = (eventCurrentIndex + 1) % eventData.length;
        eventFlatListRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
          viewPosition: 0.5
        });
        setEventCurrentIndex(nextIndex);
      }
    }, 3200); // Scroll every 3.2 seconds (between announcements and banners)
    return () => clearInterval(interval);
  }, [eventCurrentIndex, eventData.length]);

  // Auto-scroll effect for banners
  useEffect(() => {
    const interval = setInterval(() => {
      if (bannerFlatListRef.current && bannerData.length > 0) {
        const nextIndex = (bannerCurrentIndex + 1) % bannerData.length;
        bannerFlatListRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
          viewPosition: 0.5
        });
        setBannerCurrentIndex(nextIndex);
      }
    }, 3000); // Scroll every 3 seconds (fastest of all)
    return () => clearInterval(interval);
  }, [bannerCurrentIndex, bannerData.length]);

  // Auto-scroll effect for memos
  useEffect(() => {
    const interval = setInterval(() => {
      if (memoFlatListRef.current && memoData.length > 0) {
        const nextIndex = (memoCurrentIndex + 1) % memoData.length;
        memoFlatListRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
          viewPosition: 0.5
        });
        setMemoCurrentIndex(nextIndex);
      }
    }, 2500); // Scroll every 2.5 seconds (fastest of all)
    return () => clearInterval(interval);
  }, [memoCurrentIndex, memoData.length]);

  // Auto-scroll effect for messages
  useEffect(() => {
    const interval = setInterval(() => {
      if (messageFlatListRef.current && messageData.length > 0) {
        const nextIndex = (messageCurrentIndex + 1) % messageData.length;
        messageFlatListRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
          viewPosition: 0.5
        });
        setMessageCurrentIndex(nextIndex);
      }
    }, 2000); // Scroll every 2 seconds (fastest of all)
    return () => clearInterval(interval);
  }, [messageCurrentIndex, messageData.length]);

  // Auto-scroll effect for notification list
  useEffect(() => {
    const interval = setInterval(() => {
      if (notificationListFlatListRef.current && notificationListData.length > 0) {
        const nextIndex = (notificationListCurrentIndex + 1) % notificationListData.length;
        notificationListFlatListRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
          viewPosition: 0.5
        });
        setNotificationListCurrentIndex(nextIndex);
      }
    }, 4500); // Scroll every 4.5 seconds
    return () => clearInterval(interval);
  }, [notificationListCurrentIndex, notificationListData.length]);

  // Auto-scroll effect for holiday list
  useEffect(() => {
    const interval = setInterval(() => {
      if (holidayListFlatListRef.current && holidayListData.length > 0) {
        const nextIndex = (holidayListCurrentIndex + 1) % holidayListData.length;
        holidayListFlatListRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
          viewPosition: 0.5
        });
        setHolidayListCurrentIndex(nextIndex);
      }
    }, 4000); // Scroll every 4 seconds
    return () => clearInterval(interval);
  }, [holidayListCurrentIndex, holidayListData.length]);

  // Handle manual scroll to pause auto-scroll temporarily
  const handleScroll = () => {
    // Optional: Add logic to pause auto-scroll when user manually scrolls
  };

  // Handle scroll errors for birthday
  const handleScrollToIndexFailed = (info: { index: number }) => {
    const wait = new Promise(resolve => setTimeout(resolve, 500));
    wait.then(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: info.index,
          animated: true,
          viewPosition: 0.5
        });
      }
    });
  };

  // Handle scroll errors for circular
  const handleCircularScrollToIndexFailed = (info: { index: number }) => {
    const wait = new Promise(resolve => setTimeout(resolve, 500));
    wait.then(() => {
      if (circularFlatListRef.current) {
        circularFlatListRef.current.scrollToIndex({
          index: info.index,
          animated: true,
          viewPosition: 0.5
        });
      }
    });
  };

  // Handle scroll errors for announcements
  const handleAnnouncementScrollToIndexFailed = (info: { index: number }) => {
    const wait = new Promise(resolve => setTimeout(resolve, 500));
    wait.then(() => {
      if (announcementFlatListRef.current) {
        announcementFlatListRef.current.scrollToIndex({
          index: info.index,
          animated: true,
          viewPosition: 0.5
        });
      }
    });
  };

  // Handle scroll errors for events
  const handleEventScrollToIndexFailed = (info: { index: number }) => {
    const wait = new Promise(resolve => setTimeout(resolve, 500));
    wait.then(() => {
      if (eventFlatListRef.current) {
        eventFlatListRef.current.scrollToIndex({
          index: info.index,
          animated: true,
          viewPosition: 0.5
        });
      }
    });
  };

  // Handle scroll errors for banners
  const handleBannerScrollToIndexFailed = (info: { index: number }) => {
    const wait = new Promise(resolve => setTimeout(resolve, 500));
    wait.then(() => {
      if (bannerFlatListRef.current) {
        bannerFlatListRef.current.scrollToIndex({
          index: info.index,
          animated: true,
          viewPosition: 0.5
        });
      }
    });
  };

  // Handle scroll errors for memos
  const handleMemoScrollToIndexFailed = (info: { index: number }) => {
    const wait = new Promise(resolve => setTimeout(resolve, 500));
    wait.then(() => {
      if (memoFlatListRef.current) {
        memoFlatListRef.current.scrollToIndex({
          index: info.index,
          animated: true,
          viewPosition: 0.5
        });
      }
    });
  };

  // Handle scroll errors for messages
  const handleMessageScrollToIndexFailed = (info: { index: number }) => {
    const wait = new Promise(resolve => setTimeout(resolve, 500));
    wait.then(() => {
      if (messageFlatListRef.current) {
        messageFlatListRef.current.scrollToIndex({
          index: info.index,
          animated: true,
          viewPosition: 0.5
        });
      }
    });
  };

  // Handle scroll errors for notification list
  const handleNotificationListScrollToIndexFailed = (info: { index: number }) => {
    const wait = new Promise(resolve => setTimeout(resolve, 500));
    wait.then(() => {
      if (notificationListFlatListRef.current) {
        notificationListFlatListRef.current.scrollToIndex({
          index: info.index,
          animated: true,
          viewPosition: 0.5
        });
      }
    });
  };

  // Handle scroll errors for holiday list
  const handleHolidayListScrollToIndexFailed = (info: { index: number }) => {
    const wait = new Promise(resolve => setTimeout(resolve, 500));
    wait.then(() => {
      if (holidayListFlatListRef.current) {
        holidayListFlatListRef.current.scrollToIndex({
          index: info.index,
          animated: true,
          viewPosition: 0.5
        });
      }
    });
  };

  // Modal functions - similar to MessegeScreen handleEditPress
  const openModal = async (item: any) => {
    try {
      setSelectedItem(item);
      setLoadingModal(true);
      setModalVisible(true);
      
      // Check if NotificationId exists and is valid
      const notificationId = item.data.NotificationId || 0;
      console.log('Item data:', item);
      console.log('NotificationId:', notificationId);
      
      if (!notificationId || notificationId === 0) {
        console.warn('No valid NotificationId found for item:', item);
        setLoadingModal(false);
        // Still show the modal with original item data
        return;
      }
      
      const token = await UserStorage.getToken();
      if (!token) {
        console.error('No authentication token found');
        setLoadingModal(false);
        return;
      }
      
      // Fetch detailed data using NotificationId - same as MessegeScreen
      console.log('Fetching data for NotificationId:', notificationId);
      const result = await fetchMessageForEdit(token, notificationId.toString());
      setFetchedData(result);
      console.log('Fetched detailed data:', result);
      
    } catch (error) {
      console.error('Error fetching detailed data:', error);
      Alert.alert('Error', 'Failed to fetch detailed information');
    } finally {
      setLoadingModal(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
    setFetchedData(null);
    setLoadingModal(false);
  };

  // Helper function to get MIME type from file extension
  const getMimeTypeFromFileName = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      'mp4': 'video/mp4',
      'mp3': 'audio/mpeg',
    };
    return mimeTypes[extension] || 'application/octet-stream';
  };

  async function requestStoragePermission() {
    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 33) {
          console.log('Scoped storage active, permission auto-granted.');
          return true;
        }
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to your storage to download files',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else {
      return true; // iOS doesn't require this
    }
  }

  // File download functionality similar to MessegeScreen
  const handleFileDownload = async (attachment: any) => {
    try {
      await NotificationService.init();

      const token = await UserStorage.getToken();
      if (!token) {
        Alert.alert('No authentication token found. Please login again.');
        return;
      }

      // Construct the file path using Folder + '/' + FileNameServer
      let filePath = `${attachment.Folder}/${attachment.FileNameServer}`;
      
      // If FilePath doesn't start with http, use getFileUrl as fallback
      if(!filePath.startsWith('http')){
        filePath = getFileUrl('/UploadFiles/DocManager/temp/' + attachment.FileNameServer);
      }
      
      console.log('File path:', filePath);
      
      // Get the original filename for saving
      const fileName = attachment.FileNameSelected || attachment.FileNameServer || 'Unknown';
      
      // Get MIME type from file extension
      const mimeType = getMimeTypeFromFileName(fileName);

      if (Platform.OS === 'web') {
        // On web, fetch blob directly
        const response = await fetch(filePath, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error('Failed to download file');
        const blob = await response.blob();
        // Type guard for window and document
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        }
      } else {
        // Mobile: download file using RNFetchBlob
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
          Alert.alert('Error', 'Storage permission not granted.');
          return;
        }

        try {
          const { fs, android } = RNFetchBlob;
          const downloadDir = fs.dirs.DownloadDir;
          const finalPath = `${downloadDir}/${fileName}`;

          // Check if file already exists and remove it
          if (await fs.exists(finalPath)) {
            await fs.unlink(finalPath);
          }

          // Download the file directly from URL using RNFetchBlob
          const response = await RNFetchBlob.config({
            fileCache: true,
          }).fetch('GET', filePath, {
            'Authorization': `Bearer ${token}`,
          });

          // Get the temporary file path where file was cached
          const tempFilePath = response.path();
          console.log('Temporary file path:', tempFilePath);
          
          // Wait a bit to ensure file is fully written
          await new Promise(resolve => setTimeout(resolve, 100));

          // Check if temp file exists
          if (!(await fs.exists(tempFilePath))) {
            throw new Error('Downloaded file not found at temporary path');
          }

          // Read the file as base64
          const base64Data = await fs.readFile(tempFilePath, 'base64');
          
          if (!base64Data || base64Data.length === 0) {
            throw new Error('Downloaded file is empty');
          }

          // Write file to Download directory
          await fs.writeFile(finalPath, base64Data, 'base64');
          const uri = await MediaStoreModule.saveFileToDownloads(finalPath, fileName, mimeType);
          console.log('File saved to:', finalPath);

          // Verify file was written
          if (!(await fs.exists(finalPath))) {
            throw new Error('Failed to save file to download directory');
          }

          // Remove temporary file
          if (await fs.exists(tempFilePath)) {
            await fs.unlink(tempFilePath);
          }

          // For Android, add complete download and open with appropriate MIME type
          if (Platform.OS === 'android') {
            await android.addCompleteDownload({
              title: fileName,
              description: 'File downloaded successfully',
              mime: mimeType,
              path: finalPath,
              showNotification: true,
            });

            await android.actionViewIntent(finalPath, mimeType);
          }

          // Show notification
          await NotificationService.showDownloadComplete(fileName, finalPath);
        } catch (downloadError: any) {
          console.error('Error downloading file:', downloadError);
          let errorMessage = 'Unknown error';
          if (downloadError instanceof Error) {
            errorMessage = downloadError.message;
          } else if (typeof downloadError === 'string') {
            errorMessage = downloadError;
          } else if (downloadError && downloadError.message) {
            errorMessage = downloadError.message;
          }
          console.error('Error type:', typeof downloadError);
          console.error('Error message:', errorMessage);
          if (downloadError && downloadError.stack) {
            console.error('Error stack:', downloadError.stack);
          }
          Alert.alert('Error', `Failed to download file to device: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download file');
    }
  };

  // const ANNOUNCEMENTS = [
  //   {
  //     id: '1',
  //     tags: 'As part of our World Environment Day celebrations,\nwe invite everyone to join us on Thursday, 5th June,\nby wearing green or a shade of green outfit.',
  //   },
  //   {
  //     id: '2',
  //     tags: 'As part of our World Environment Day celebrations,\nwe invite everyone to join us on Thursday, 5th June,\nby wearing green or a shade of green outfit.',
  //   },
  //   {
  //     id: '3',
  //     tags: 'As part of our World Environment Day celebrations,\nwe invite everyone to join us on Thursday, 5th June,\nby wearing green or a shade of green outfit.',
  //   },
  //   {
  //     id: '4',
  //     tags: 'As part of our World Environment Day celebrations,\nwe invite everyone to join us on Thursday, 5th June,\nby wearing green or a shade of green outfit.',
  //   },
  //   {
  //     id: '5',
  //     tags: 'As part of our World Environment Day celebrations,\nwe invite everyone to join us on Thursday, 5th June,\nby wearing green or a shade of green outfit.',
  //   },
  //   {
  //     id: '6',
  //     tags: 'As part of our World Environment Day celebrations,\nwe invite everyone to join us on Thursday, 5th June,\nby wearing green or a shade of green outfit.',
  //   },
  // ];


  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.lstcontainer}>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.slideimage}>
            <Image
              source={typeof item.image === 'string' ? { uri: item.image } : item.image}
              style={styles.lstimage} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.lsttitle}>{item.name}</Text>
            <Text style={styles.role}>{item.role}</Text>
          </View>
        </View>
      </View>
      <View>
        <Text style={styles.itemname}>Happy Birthday {item.name}</Text>
        <Text style={styles.itemtags}>{item.tags}</Text>
        <TouchableOpacity onPress={() => openModal({ type: 'birthday', data: item })}>
          <Text style={styles.moreLink}>more</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // const announcementRenderItem = ({ item }: { item: typeof ANNOUNCEMENTS[0] }) => (
  //   <View style={styles.anouncementitem}>
  //     <Text style={styles.anouncementtagText}>{item.tags}</Text>
  //   </View>
  // );

  const circularRenderItem = ({ item }: { item: CircularItem }) => (
    <View style={styles.circularContainer}>
      <View style={styles.circularCard}>
        <View style={styles.circularTopRow}>
          <View style={styles.circularTextContainer}>
            <Text style={styles.lsttitle}>{item.caption}</Text>
            <Text style={styles.role}>{item.listTitle}</Text>
          </View>
          <View style={styles.slideimage}>
            <Image source={typeof item.photoUrl === 'string' ? { uri: item.photoUrl } : item.photoUrl}
              style={styles.circularImage} />
          </View>
        </View>
      </View>
      <View>
        <Text style={styles.itemtags}>{item.content}</Text>
        <TouchableOpacity onPress={() => openModal({ type: 'circular', data: item })}>
          <Text style={styles.moreLink}>more</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const eventRenderItem = ({ item }: { item: EventItem }) => (
    <View style={styles.eventContainer}>
      <View style={styles.eventCard}>
        <View style={styles.eventTopRow}>
          <View style={styles.slideimage}>
            <Image
              source={typeof item.photoUrl === 'string' ? { uri: item.photoUrl } : item.photoUrl}
              style={styles.eventImage} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.lsttitle}>{item.caption}</Text>
            <Text style={styles.role}>{item.listTitle}</Text>
          </View>
        </View>
      </View>
      <View>
        <Text style={styles.itemtags}>{item.content}</Text>
        <TouchableOpacity onPress={() => openModal({ type: 'event', data: item })}>
          <Text style={styles.moreLink}>more</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const announcementDataRenderItem = ({ item }: { item: AnnouncementItem }) => (
    <View style={styles.announcementContainer}>
      <View style={styles.announcementCard}>
        <View style={styles.announcementTopRow}>
          <View style={styles.circularTextContainer}>
            <Text style={styles.lsttitle}>{item.caption}</Text>
            <Text style={styles.role}>{item.listTitle}</Text>
          </View>
          <View style={styles.slideimage}>
            <Image
              source={typeof item.photoUrl === 'string' ? { uri: item.photoUrl } : item.photoUrl}
              style={styles.announcementImage} />
          </View>
        </View>
      </View>
      <View>
        <Text style={styles.itemtags}>{item.content}</Text>
        <TouchableOpacity onPress={() => openModal({ type: 'announcement', data: item })}>
          <Text style={styles.moreLink}>more</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const bannerRenderItem = ({ item }: { item: BannerItem }) => (
    <View style={styles.bannerContainer}>
      <View style={styles.bannerCard}>
        <View style={styles.bannerTopRow}>
          <View style={styles.slideimage}>
            <Image
              source={typeof item.photoUrl === 'string' ? { uri: item.photoUrl } : item.photoUrl}
              style={styles.bannerImage} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.lsttitle}>{item.caption}</Text>
            <Text style={styles.role}>{item.listTitle}</Text>
          </View>
        </View>
      </View>
      <View>
        <Text style={styles.itemtags}>{item.content}</Text>
        <TouchableOpacity onPress={() => openModal({ type: 'banner', data: item })}>
          <Text style={styles.moreLink}>more</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const memoRenderItem = ({ item }: { item: MemoItem }) => (
    <View style={styles.memoContainer}>
      <View style={styles.memoCard}>
        <View style={styles.memoTopRow}>
          <View style={styles.circularTextContainer}>
            <Text style={styles.lsttitle}>{item.caption}</Text>
            <Text style={styles.role}>{item.listTitle}</Text>
          </View>
          <View style={styles.slideimage}>
          <Image
            source={typeof item.photoUrl === 'string' ? { uri: item.photoUrl } : item.photoUrl}
            style={styles.memoImage} />
          </View>
        </View>
      </View>
      <View>
        <Text style={styles.itemtags}>{item.content}</Text>
        <TouchableOpacity onPress={() => openModal({ type: 'memo', data: item })}>
          <Text style={styles.moreLink}>more</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const messageRenderItem = ({ item }: { item: MessageItem }) => (
    <View style={styles.messageContainer}>
      <View style={styles.messageCard}>
        <View style={styles.messageTopRow}>
          <View style={styles.slideimage}>
            <Image
              source={typeof item.photoUrl === 'string' ? { uri: item.photoUrl } : item.photoUrl}
              style={styles.messageImage} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.lsttitle}>{item.caption}</Text>
            <Text style={styles.role}>{item.listTitle}</Text>
          </View>
        </View>
      </View>
      <View>
        <Text style={styles.itemtags}>{item.content}</Text>
        <TouchableOpacity onPress={() => openModal({ type: 'message', data: item })}>
          <Text style={styles.moreLink}>more</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.messageAuthorContainer}>
        <Text style={styles.messageAuthorLabel}>Message by:</Text>
        <Text style={styles.messageAuthorName}>{item.employeeName}</Text>
        <Text style={styles.messageAuthorDesignation}>{item.designation}</Text>
      </View>
    </View>
  );

  const notificationListRenderItem = ({ item }: { item: NotificationListItem }) => (
    <View style={styles.notificationListItemContainer}>
      <View style={styles.notificationListItemCard}>
        <View style={styles.notificationListItemTopRow}>
          <View style={styles.slideimage}>
            <Image
              source={typeof item.image === 'string' ? { uri: item.image } : item.image}
              style={styles.notificationListItemImage} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.lsttitle}>{item.name}</Text>
            <Text style={styles.role}>{item.role}</Text>
          </View>
        </View>
      </View>
      <View>
        <Text style={styles.itemtags}>{item.tags}</Text>
        <TouchableOpacity onPress={() => openModal({ type: 'notificationList', data: item })}>
          <Text style={styles.moreLink}>more</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const holidayListRenderItem = ({ item }: { item: HolidayListItem }) => (
    <View style={styles.holidayListItemContainer}>
      <View style={styles.holidayListItemCard}>
        <View style={styles.holidayListItemTopRow}>
          <View style={styles.slideimage}>
            <Image
              source={typeof item.image === 'string' ? { uri: item.image } : item.image}
              style={styles.holidayListItemImage} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.lsttitle}>{item.name}</Text>
            <Text style={styles.role}>{item.role}</Text>
          </View>
        </View>
      </View>
      <View>
        <Text style={styles.itemtags}>{item.tags}</Text>
        <TouchableOpacity onPress={() => openModal({ type: 'holidayList', data: item })}>
          <Text style={styles.moreLink}>more</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <StatusBar
        backgroundColor="#133F7C"
        barStyle="light-content"
        translucent={false}
      />
      <View style={styles.container}>
        <View style={styles.btncontainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false} horizontal={true} showsHorizontalScrollIndicator={false}>
            <View style={styles.grid}>
                             {tiles.map((tile) => (
                 <TouchableOpacity onPress={() => navigation.navigate(tile.route as any, { screen: tile.screen })} key={tile.id} style={styles.tile}>
                   <View style={styles.tileContent}>
                     <Image source={tile.image} style={styles.image} />
                     <Text style={styles.title}>{tile.title}</Text>
                   </View>
                   {tile.title === 'Approval' && approvalCount > 0 && (
                     <View style={styles.badge}>
                       <Text style={styles.badgeText}>{approvalCount}</Text>
                     </View>
                   )}
                   {tile.title === 'Messages' && messageCount > 0 && (
                     <View style={styles.badge}>
                       <Text style={styles.badgeText}>{messageCount}</Text>
                     </View>
                   )}
                 </TouchableOpacity>
               ))}
            </View>
          </ScrollView>
        </View>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={true} // 👈 shows the vertical scrollbar
        >
          <View>
            <FlatList
              ref={flatListRef}
              data={birthdayData}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              horizontal={true}
              // contentContainerStyle={{ paddingBottom: 20 }}
              // scrollEnabled={false}
              showsHorizontalScrollIndicator={false} // Optional: hide scroll bar
              contentContainerStyle={{ paddingHorizontal: 0 }} // Zero margin from left
              onScroll={handleScroll}
              onScrollToIndexFailed={handleScrollToIndexFailed}
              ListEmptyComponent={() => (
                <View style={styles.emptyBirthdayContainer}>
                  <Text style={styles.emptyBirthdayText}>
                    {loading ? 'Loading birthday greetings...' : 'No birthday greetings today'}
                  </Text>
                </View>
              )}
            />
          </View>

          {/* Circular Section */}
          {circularData.length > 0 && (
            <View style={styles.circularSection}>
              {/* <View style={styles.circularHeader}>
               <Text style={styles.circularHeaderText}>Circulars</Text>
             </View> */}
              <FlatList
                ref={circularFlatListRef}
                data={circularData}
                renderItem={circularRenderItem}
                keyExtractor={item => item.id}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 0 }}
                onScrollToIndexFailed={handleCircularScrollToIndexFailed}
                ListEmptyComponent={() => (
                  <View style={styles.emptyCircularContainer}>
                    <Text style={styles.emptyCircularText}>
                      {loading ? 'Loading circulars...' : 'No circulars available'}
                    </Text>
                  </View>
                )}
              />
            </View>
          )}

          {/* Event Section */}
          {eventData.length > 0 && (
            <View style={styles.eventSection}>
              <FlatList
                ref={eventFlatListRef}
                data={eventData}
                renderItem={eventRenderItem}
                keyExtractor={item => item.id}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 0 }}
                onScrollToIndexFailed={handleEventScrollToIndexFailed}
                ListEmptyComponent={() => (
                  <View style={styles.emptyEventContainer}>
                    <Text style={styles.emptyEventText}>
                      {loading ? 'Loading events...' : 'No events available'}
                    </Text>
                  </View>
                )}
              />
            </View>
          )}

          {/* Announcement Section */}
          {announcementData.length > 0 && (
            <View style={styles.announcementSection}>
              <FlatList
                ref={announcementFlatListRef}
                data={announcementData}
                renderItem={announcementDataRenderItem}
                keyExtractor={item => item.id}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 0 }}
                onScrollToIndexFailed={handleAnnouncementScrollToIndexFailed}
                ListEmptyComponent={() => (
                  <View style={styles.emptyAnnouncementContainer}>
                    <Text style={styles.emptyAnnouncementText}>
                      {loading ? 'Loading announcements...' : 'No announcements available'}
                    </Text>
                  </View>
                )}
              />
            </View>
          )}

          {/* Banner Section */}
          {bannerData.length > 0 && (
            <View style={styles.bannerSection}>
              <FlatList
                ref={bannerFlatListRef}
                data={bannerData}
                renderItem={bannerRenderItem}
                keyExtractor={item => item.id}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 0 }}
                onScrollToIndexFailed={handleBannerScrollToIndexFailed}
                ListEmptyComponent={() => (
                  <View style={styles.emptyBannerContainer}>
                    <Text style={styles.emptyBannerText}>
                      {loading ? 'Loading banners...' : 'No banners available'}
                    </Text>
                  </View>
                )}
              />
            </View>
          )}

          {/* Memo Section */}
          {memoData.length > 0 && (
            <View style={styles.memoSection}>
              <FlatList
                ref={memoFlatListRef}
                data={memoData}
                renderItem={memoRenderItem}
                keyExtractor={item => item.id}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 0 }}
                onScrollToIndexFailed={handleMemoScrollToIndexFailed}
                ListEmptyComponent={() => (
                  <View style={styles.emptyMemoContainer}>
                    <Text style={styles.emptyMemoText}>
                      {loading ? 'Loading memos...' : 'No memos available'}
                    </Text>
                  </View>
                )}
              />
            </View>
          )}

          {/* Message Section */}
          {messageData.length > 0 && (
            <View style={styles.messageSection}>
              <FlatList
                ref={messageFlatListRef}
                data={messageData}
                renderItem={messageRenderItem}
                keyExtractor={item => item.id}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 0 }}
                onScrollToIndexFailed={handleMessageScrollToIndexFailed}
                ListEmptyComponent={() => (
                  <View style={styles.emptyMessageContainer}>
                    <Text style={styles.emptyMessageText}>
                      {loading ? 'Loading messages...' : 'No messages available'}
                    </Text>
                  </View>
                )}
              />
            </View>
          )}

          {/* Notification List Section */}
          {notificationListData.length > 0 && (
            <View style={styles.notificationListSection}>
              <FlatList
                ref={notificationListFlatListRef}
                data={notificationListData}
                renderItem={notificationListRenderItem}
                keyExtractor={item => item.id}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 0 }}
                onScrollToIndexFailed={handleNotificationListScrollToIndexFailed}
                ListEmptyComponent={() => (
                  <View style={styles.emptyNotificationListContainer}>
                    <Text style={styles.emptyNotificationListText}>
                      {loading ? 'Loading notification list...' : 'No notification list available'}
                    </Text>
                  </View>
                )}
              />
            </View>
          )}

          {/* Holiday List Section */}
          {holidayListData.length > 0 && (
            <View style={styles.holidayListSection}>
              <FlatList
                ref={holidayListFlatListRef}
                data={holidayListData}
                renderItem={holidayListRenderItem}
                keyExtractor={item => item.id}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 0 }}
                onScrollToIndexFailed={handleHolidayListScrollToIndexFailed}
                ListEmptyComponent={() => (
                  <View style={styles.emptyHolidayListContainer}>
                    <Text style={styles.emptyHolidayListText}>
                      {loading ? 'Loading holiday list...' : 'No holiday list available'}
                    </Text>
                  </View>
                )}
              />
            </View>
          )}

          {/* <View style={styles.anouncementcontainer}>
          <View style={styles.annstextimg}>
            <View style={styles.annIcon}><Image style={styles.annIconimg} source={require('../../assets/images/icon!.png')} /></View>
            <Text style={styles.anouncementheader}>Announcements</Text>
          </View>
          <FlatList
            data={ANNOUNCEMENTS}
            renderItem={announcementRenderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={{ marginBottom: 20 }}
            scrollEnabled={false} />
        </View> */}
        </ScrollView>

      </View>

      {/* Modal for displaying more items */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Text style={styles.modalTitle}>
                  {selectedItem?.type === 'birthday' && '🎂 Birthday Greetings'}
                  {selectedItem?.type === 'circular' && '📢 Circulars'}
                  {selectedItem?.type === 'event' && '🎉 Events'}
                  {selectedItem?.type === 'announcement' && '📢 Announcements'}
                  {selectedItem?.type === 'banner' && '🏷️ Banners'}
                  {selectedItem?.type === 'memo' && '📝 Memos'}
                  {selectedItem?.type === 'message' && '💬 Messages'}
                  {selectedItem?.type === 'notificationList' && '🔔 Notification List'}
                  {selectedItem?.type === 'holidayList' && '🎊 Holiday List'}
                </Text>
              </View>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {loadingModal ? (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="large" color="#133F7C" />
                  <Text style={styles.modalLoadingText}>Loading details...</Text>
                </View>
              ) : (
                <View style={styles.modalItem}>
                  {/* Display data from fetched result (Item1) - similar to MessegeScreen */}
                  {fetchedData?.Item1 && fetchedData.Item1.length > 0 ? (
                    <>
                      <Text style={styles.modalItemTitle}>
                        {fetchedData.Item1[0].Title || 'No Title'}
                      </Text>
                      <Text style={styles.modalItemContent}>
                        {fetchedData.Item1[0].NotificationContent || 'No content available'}
                      </Text>
                      {/* {fetchedData.Item1[0].NotificationId && (
                        <Text style={styles.modalItemId}>ID: {fetchedData.Item1[0].NotificationId}</Text>
                      )} */}
                      {fetchedData.Item1[0].NotificationDate && (
                        <Text style={styles.modalItemDate}>Date: {fetchedData.Item1[0].NotificationDate}</Text>
                      )}
                   
                    </>
                  ) : (
                    /* Fallback to original item data if fetched data not available */
                    <>
                      <Text style={styles.modalItemTitle}>
                        {selectedItem?.data?.name || selectedItem?.data?.caption || selectedItem?.data?.listTitle || 'Item'}
                      </Text>
                      <Text style={styles.modalItemContent}>
                        {selectedItem?.data?.tags || selectedItem?.data?.content || selectedItem?.data?.role || 'No content available'}
                      </Text>
                      {/* {selectedItem?.data?.NotificationId && (
                        <Text style={styles.modalItemId}>ID: {selectedItem.data.NotificationId}</Text>
                      )} */}
                      {selectedItem?.data?.employeeName && (
                        <Text style={styles.modalItemAuthor}>Author: {selectedItem.data.employeeName}</Text>
                      )}
                      {selectedItem?.data?.designation && (
                        <Text style={styles.modalItemDesignation}>Designation: {selectedItem.data.designation}</Text>
                      )}
                    </>
                  )}
                  
                  {/* Attachments Section from Item3 - same as MessegeScreen */}
                  {fetchedData?.Item3 && Array.isArray(fetchedData.Item3) && fetchedData.Item3.length > 0 && (
                    <View style={styles.attachmentContainer}>
                      <Text style={styles.attachmentLabel}>📎 Attachments ({fetchedData.Item3.length})</Text>
                      {fetchedData.Item3.map((attachment: any, index: number) => (
                        <TouchableOpacity 
                          key={index} 
                          style={styles.attachmentItem}
                          onPress={() => handleFileDownload(attachment)}>
                          <Text style={{ fontSize: 16, marginRight: 8 }}>📄</Text>
                          <Text style={styles.attachmentText}>{attachment.FileNameSelected || attachment.FileNameServer || 'Unknown File'}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  
               
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingRight: 0,
    backgroundColor: '#ffffff',

    paddingLeft: 0,
    paddingBottom: 80,
  },
  btncontainer: {
    paddingTop: 0,
    paddingBottom: 10,
    paddingRight: 0,
    paddingLeft: 0,
  
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  annstextimg: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#E5EEFD',
    paddingTop: 8,
    paddingBottom: 8,
    marginBottom: 10,
    borderRadius: 6,
    alignContent: 'center',
    alignItems: 'center',
  },
  annIcon: {
    width: 40,
    height: 36,
    marginRight: 4,
  },
  annIconimg: {
    width: 31,
    height: 31,
  },
  scrollContainer: {
    padding: 0,
    paddingRight: 12,
    paddingLeft: 12,
  
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 15, paddingLeft: 1,
    marginRight: 10,
  },
  image: {
    marginBottom: 1,
  },
  tile: {
    width: '13%',
    aspectRatio: 1,
    // backgroundColor: '#f2f2eb',
   // backgroundColor: '#ebebeb',
   backgroundColor: '#fafafa',
    borderRadius: 10,
    marginBottom: 5,
    marginLeft: 0,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    // color: '#101010',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    // borderColor: '#811458',
    // borderWidth: 1,
  },
  title: {
    fontSize: 11,
    textAlign: 'center',
    color: '#000000',
  },
  tileContent: {
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: -5,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // =============================================================================
  lstcontainer: {
    //   flexDirection: 'column',
    //   alignItems: 'flex-start',
    //  // width: '100%',
    // backgroundColor: 'yellow',
    //   marginBottom: 10,
    //   borderRadius: 8,
    //   padding: 6,
    //   shadowColor: '#000',
    //   shadowOffset: { width: 0, height: 2 },
    //   shadowOpacity: 0.1,
    //   shadowRadius: 4,
    //   elevation: 5,
    width: width -24, // fixed width for horizontal cards
    // marginRight: 8,
    marginRight:1,
    marginLeft: 0, // Zero left margin
    padding: 10,
    paddingLeft: 10,
    backgroundColor: '#fce3f3',
    borderRadius: 10,
    height: 210,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    marginBottom: 8,
    //paddingLeft: 2,
   // paddingRight: 8,
  },
  textContainer: {
    flex: 1,
    backgroundColor: '#ffffffff',
    marginLeft: 10,
    paddingLeft: 10,
    paddingTop: 6,
    height: 56,
    borderRadius: 6,
    marginTop: 5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  slideimage: {
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  lstimage: {
    width: 50,
    height: 50,
    marginRight: 4,
  },
  messageImage: {
    width: 50,
    height: 50,
  },
  lsttitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  role: {
    fontSize: 11,
    color: '#272727ff',
  },
  itemname: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#133F7C',
  },
  itemtags: {
    fontSize: 11,
  },
  circularContainer: {
    backgroundColor: '#fde8e5',
    width: width -24,
    marginRight: 1,
    marginLeft: 0, // Zero left margin
    padding: 10,
    paddingLeft: 10,    
    borderRadius: 10,
    height: 210,
  },
  circularCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    marginBottom: 8,
  },
  circularTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  circularTextContainer: {
    flex: 1,
    backgroundColor: '#ffffffff',
    marginRight: 10,
    paddingLeft: 6,
    paddingTop: 6,
    height: 56,
    borderRadius: 6,
    marginTop: 5,
  },
  circularImage: {
    width: 50,
    height: 50,
  },
  circularContentContainer: {
    backgroundColor: '#fde8e5',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  circularContent: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  eventContainer: {
    backgroundColor: '#e8e5fd',
    width: width -24,
    marginRight: 1,
    marginLeft: 0, // Zero left margin
    padding: 10,
    paddingLeft: 10,
    borderRadius: 10,
    height: 210,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    marginBottom: 8,
  },
  eventTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    paddingRight: 20,
  },
  eventImage: {
    width: 50,
    height: 50,
  },
  announcementContainer: {
    backgroundColor: '#ffdcf1ff',
    width: width -24,
    marginRight: 1,
    marginLeft: 0, // Zero left margin
    padding: 10,
    borderRadius: 10,
    paddingLeft: 10,
    height: 210,
  },
  announcementCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    marginBottom: 8,
  },
  announcementTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  announcementTextContainer: {
    flex: 1,
    backgroundColor: '#e8eaed',
    padding: 8,
    borderRadius: 6,
    marginTop: 5,
  },
  announcementCaption: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#133F7C',
    marginBottom: 4,
  },
  announcementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  announcementImage: {
    width: 50,
    height: 50,
  },
  bannerContainer: {
    backgroundColor: '#e9dcf1ff',
    width: width -24,
    marginRight: 1,
    marginLeft: 0, // Zero left margin
    padding: 10,
    borderRadius: 10,
    paddingLeft: 10,
    height:210
  },
  bannerTextContainer: {
    flex: 1,
    backgroundColor: '#ffffffff',
    padding: 8,
    borderRadius: 6,
    marginTop: 5,
  },
  bannerCaption: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#133F7C',
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bannerImage: {
    width: 50,
    height: 50,
  },
  memoContainer: {
    backgroundColor: '#d2f4f6ff',
    width: width -24,
    marginRight: 1,
    marginLeft: 0, // Zero left margin
    padding: 10,
    borderRadius: 10,
    paddingLeft: 10,
    height: 210,
  },
  memoImage: {
    width: 50,
    height: 50,
  },
  memoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',

  },
  messageContainer: {
    backgroundColor: '#f5f3d7ff',
    width: width -24,
    marginRight: 1,
    marginLeft: 0, // Zero left margin
    padding: 10,
    paddingLeft: 10,
    borderRadius: 10,
    height: 210,
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    marginBottom: 8,
  },
  messageTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  // ========================================================================777777777=====

  tagsContainer: {


    marginTop: 12,
    gap: 8,
  },
  tagBox: {
    backgroundColor: '#d0ebff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#333',
  },

  // Announcement styles
  anouncementcontainer: {
    margin: 5,
    flexDirection: 'column',
    paddingTop: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  anouncementheader: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
    color: '#333',
  },
  anouncementitem: {
    backgroundColor: '#CAD6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  anouncementtagText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  emptyBirthdayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyBirthdayText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },

  // Circular styles
  circularSection: {
    marginVertical: 5,
    marginTop: 7,
  },
  circularHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E5EEFD',
    borderRadius: 6,
    marginBottom: 10,
  },
  circularHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#133F7C',
    textAlign: 'center',
  },
  emptyCircularContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyCircularText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },

  // Event styles
  eventSection: {
    marginVertical: 2,
  },
  eventTextContainer: {
    flex: 1,
    backgroundColor: '#e8eaed',
    padding: 8,
    borderRadius: 6,
    marginTop: 5,
  },
  eventCaption: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#133F7C',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  eventContentContainer: {
    backgroundColor: '#f1f6ff',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  eventContent: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  emptyEventContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyEventText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },

  // Announcement styles
  announcementSection: {
    marginVertical: 5,
  },
  announcementContentContainer: {
    backgroundColor: '#f1f6ff',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  announcementContent: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  emptyAnnouncementContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyAnnouncementText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },

  // Banner styles
  bannerSection: {
    marginVertical: 2,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    marginBottom: 8,
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bannerContentContainer: {
    backgroundColor: '#f1f6ff',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  bannerContent: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  emptyBannerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyBannerText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },

  // Memo styles
  memoSection: {
    marginVertical: 5,
  },
  memoTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  memoTextContainer: {
    flex: 1,
    backgroundColor: '#e8eaed',
    padding: 8,
    borderRadius: 6,
    marginTop: 5,
  },
  memoCaption: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#133F7C',
    marginBottom: 4,
  },
  memoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  memoContentContainer: {
    backgroundColor: '#f1f6ff',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  memoContent: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  emptyMemoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyMemoText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },

  // Message styles
  messageSection: {
    marginVertical: 2,
  },
  messageTextContainer: {
    flex: 1,
    backgroundColor: '#e8eaed',
    padding: 8,
    borderRadius: 6,
    marginTop: 5,
  },
  messageCaption: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#133F7C',
    marginBottom: 4,
  },
  messageTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  messageContentContainer: {
    backgroundColor: '#f1f6ff',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  messageContent: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  messageAuthorContainer: {
    backgroundColor: '#ffffffff',
    padding: 8,
    paddingLeft: 4,
    borderRadius: 2,
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  messageAuthorLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#133F7C',
    marginRight: 4,
  },
  messageAuthorName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 4,
  },
  messageAuthorDesignation: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyMessageText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },

  // Notification List styles
  notificationListSection: {
    marginVertical: 5,
    marginBottom: 20
  },
  notificationListItemContainer: {
    width: width -24,
    marginRight: 1,
    marginLeft: 0, // Zero left margin
    padding: 10,
    paddingLeft: 10,    
    borderRadius: 10,
    backgroundColor: '#fedfeaff',
    height: 210,
  },
  notificationListItemCard: {
    marginBottom: 10,
  },
  notificationListItemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationListItemImage: {
    width: 40,
    height: 40,
    borderRadius: 25,
  },
  emptyNotificationListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyNotificationListText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },

  // Holiday List styles
  holidayListSection: {
    marginVertical: 5,
    marginBottom: 15,
  },
  holidayListItemContainer: {
    width: width -24,
    marginRight: 1,
    marginLeft: 0, // Zero left margin
    padding: 10,
    paddingLeft: 10,    
    borderRadius: 10,
    backgroundColor: '#d1ecffff',
    marginBottom: 18,
    height: 210,
  },
  holidayListItemCard: {
    marginBottom: 10,
  },
  holidayListItemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  holidayListItemImage: {
    width: 40,
    height: 40,
    borderRadius: 25,
  },
  emptyHolidayListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyHolidayListText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },

  // More link styles
  moreLink: {
    color: '#133F7C',
    fontSize: 12,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    marginTop: 5,
    alignSelf: 'flex-end',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 0,
    width: '95%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 10,
    backgroundColor: '#811458',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fafafa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fafafa',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#811458',
    fontWeight: 'bold',
    lineHeight: 18,
  },
  modalScrollView: {
    maxHeight: '75%',
    paddingHorizontal: 25,
    paddingVertical: 20,
  },
  modalItem: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 5,
    borderLeftColor: '#811458',
    shadowColor: '#811458',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8F2FF',
  },
  modalItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    lineHeight: 18,
  },
  modalItemContent: {
    fontSize: 12,
    color: '#4A4A4A',
    lineHeight: 14,
    marginBottom: 12,
  },
  modalItemId: {
    fontSize: 12,
    color: '#133F7C',
    fontWeight: '600',
    backgroundColor: '#E8F2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  modalItemAuthor: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '600',
    marginTop: 8,
    paddingVertical: 4,
  },
  modalItemDesignation: {
    fontSize: 12,
    color: '#7F8C8D',
    fontStyle: 'italic',
    marginTop: 2,
    paddingLeft: 8,
  },
  
  // Attachment styles (similar to MessegeScreen)
  attachmentContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F8FAFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3F2FD',
    shadowColor: '#133F7C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  attachmentLabel: {
    fontSize: 16,
    color: '#133F7C',
    fontWeight: '700',
    marginBottom: 12,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E3F2FD',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  attachmentText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
  
  // Loading styles for modal
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#FAFBFC',
    borderRadius: 12,
    marginHorizontal: 10,
  },
  modalLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#133F7C',
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Additional modal item styles
  modalItemDate: {
    fontSize: 13,
    color: '#7F8C8D',
    marginTop: 8,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    fontWeight: '500',
  },
  modalItemDocType: {
    fontSize: 13,
    color: '#7F8C8D',
    marginTop: 6,
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    fontWeight: '500',
  },
  
  // Employee section styles (similar to MessegeScreen)
  employeeContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  employeeLabel: {
    fontSize: 14,
    color: '#133F7C',
    fontWeight: '600',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#bbd2f5ff',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
});
