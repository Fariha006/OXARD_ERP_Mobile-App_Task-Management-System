import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, Button, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList,
  SafeAreaView, StatusBar, ActivityIndicator, Dimensions
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getNotifications, getFileUrl } from '../api/api';
import UserStorage from '../utils/userStorage';
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
}

interface EventItem {
  id: string;
  caption: string;
  listTitle: string;
  content: string;
  photoUrl: string;
}

interface AnnouncementItem {
  id: string;
  caption: string;
  listTitle: string;
  content: string;
  photoUrl: string;
}

interface BannerItem {
  id: string;
  caption: string;
  listTitle: string;
  content: string;
  photoUrl: string;
}

interface MemoItem {
  id: string;
  caption: string;
  listTitle: string;
  content: string;
  photoUrl: string;
}

interface MessageItem {
  id: string;
  caption: string;
  listTitle: string;
  content: string;
  photoUrl: string;
  employeeName: string;
  designation: string;
}

interface NotificationListItem {
  id: string;
  name: string;
  role: string;
  image: any;
  tags: string;
}

interface HolidayListItem {
  id: string;
  name: string;
  role: string;
  image: any;
  tags: string;
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

      const json = await getNotifications(token);
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
          if (item && typeof item === 'object' && item.CategoryId === 2) {
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
            item.CategoryId === 10) {
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
      });
      autoIncrementId++;
    });

    return holidayListItems;
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, []);

  const tiles = [
    { id: 1, title: 'My Desk', image: require('../../assets/images/home/mydesk.png'), route: 'Main', screen: 'MyDesk' },
    { id: 2, title: 'My Requests', image: require('../../assets/images/home/request.png'), route: 'Main', screen: 'RequestDashboard' },
    { id: 3, title: 'Payslips', image: require('../../assets/images/home/payslip.png'), route: 'Main', screen: 'Payslip' },
    { id: 4, title: 'Approval', image: require('../../assets/images/home/aproval.png'), route: 'Main', screen: 'Approvals' },
    { id: 5, title: 'Directory', image: require('../../assets/images/home/directory.png'), route: 'Main', screen: 'EmployeeDirectory' },
    { id: 6, title: 'Messages', image: require('../../assets/images/home/msgs.png'), route: 'Main', screen: 'Messege' },
    { id: 7, title: 'Leave Outstandings ', image: require('../../assets/images/home/leave.png'), route: 'Main', screen: 'LeaveOutstanding' },
    { id: 8, title: 'Approval', image: require('../../assets/images/home/aprovb.png'), route: 'Main', screen: 'Approval' },
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
                  <Image source={tile.image} style={styles.image} />
                  <Text style={styles.title}>{tile.title}</Text>
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
              contentContainerStyle={{ paddingHorizontal: 10 }} // Optional: spacing
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
                contentContainerStyle={{ paddingHorizontal: 10 }}
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
                contentContainerStyle={{ paddingHorizontal: 10 }}
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
                contentContainerStyle={{ paddingHorizontal: 10 }}
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
                contentContainerStyle={{ paddingHorizontal: 10 }}
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
                contentContainerStyle={{ paddingHorizontal: 10 }}
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
                contentContainerStyle={{ paddingHorizontal: 10 }}
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
                contentContainerStyle={{ paddingHorizontal: 10 }}
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
                contentContainerStyle={{ paddingHorizontal: 10 }}
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
    paddingRight: 15, paddingLeft: 6,
    marginRight: 10,
  },
  image: {
    marginBottom: 1,
  },
  tile: {
    width: '11%',
    aspectRatio: 1,
    backgroundColor: '#E5EEFD',
    borderRadius: 10,
    marginBottom: 5,
    marginLeft: 0,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    color: '#101010',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 11,
    textAlign: 'center',
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
    width: width -10, // fixed width for horizontal cards
    marginRight: 8,
    padding: 10,
    paddingLeft: 20,
    backgroundColor: '#e5eefd',
    borderRadius: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    marginBottom: 8,
    paddingLeft: 8,
    paddingRight: 8,
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
    width: 40,
    height: 40,
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
    width: width -10,
    marginRight: 8,
    padding: 10,
    paddingLeft: 20,    
    borderRadius: 10,

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
    // backgroundColor: '#2200ffff',
    width: width -10,
    marginRight: 2,
    padding: 10,
    paddingLeft: 10,
    borderRadius: 10,
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
  },
  eventImage: {
    width: 50,
    height: 50,
  },
  announcementContainer: {
    backgroundColor: '#ffdcf1ff',
    width: width -10,
    marginRight: 8,
    padding: 10,
    borderRadius: 10,
    paddingLeft: 20,
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
    width: width -10,
    marginRight: 8,
    padding: 10,
    borderRadius: 10,
    paddingLeft: 20,
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
    width: width -10,
    marginRight: 8,
    padding: 10,
    borderRadius: 10,
    paddingLeft: 20,
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
    width: width -10,
    marginRight: 8,
    padding: 10,
    paddingLeft: 20,
    borderRadius: 10,
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
    marginVertical: 10,
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
    marginVertical: 10,
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
    marginVertical: 10,
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
    marginVertical: 10,
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
    marginVertical: 10,
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
    marginVertical: 10,
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
    marginVertical: 10,
  },
  notificationListItemContainer: {
    width: 300,
    marginRight: 8,
    backgroundColor: '#fedfeaff',
    // backgroundColor: 'teal',
    borderRadius: 10,
    padding: 10,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 3.84,
    // elevation: 5,
    paddingLeft: 20,

    
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
    marginVertical: 10,
  },
  holidayListItemContainer: {
    width: 300,
    marginRight: 15,
    backgroundColor: '#d1ecffff',
    // backgroundColor: 'red',
    borderRadius: 10,
    padding: 15,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 3.84,
    // elevation: 5,
    marginBottom: 18,
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
});
