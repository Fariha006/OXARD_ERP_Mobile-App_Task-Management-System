import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { WebView } from 'react-native-webview';
import Geolocation from '@react-native-community/geolocation';
import { API_CONFIG, getApiUrl } from '../../config/apiConfig';
import UserStorage from '../../utils/userStorage';

// ─── Types ───────────────────────────────────────────────────────────────────
type DropdownOption = { label: string; value: string };
type FormState = {
  AccountName: string;
  FkIndustryId: string;
  FkCurrId: string;
  ExchRate: string;
  FkCountryId: string;
  State: string;
  City: string;
  Street: string;
  ZipCode: string;
  Fax: string;
  WebSite: string;
  AddDescription: string;
  NoofEmployees: string;
  AnnualTurnOver: string;
};
type FormErrors = Partial<Record<keyof FormState, string>>;
type DropdownKey = 'FkIndustryId' | 'FkCurrId' | 'FkCountryId';

const INITIAL_FORM: FormState = {
  AccountName: '',
  FkIndustryId: '',
  FkCurrId: '',
  ExchRate: '1',
  FkCountryId: '',
  State: '',
  City: '',
  Street: '',
  ZipCode: '',
  Fax: '',
  WebSite: '',
  AddDescription: '',
  NoofEmployees: '',
  AnnualTurnOver: '',
};

// ─── Map HTML (Leaflet + OpenStreetMap) ───────────────────────────────────────
const MAP_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; width: 100%; }
    #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var selectedLat = null, selectedLng = null, marker = null;
    var map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    map.on('click', function(e) { setMarker(e.latlng.lat, e.latlng.lng); });
    function setMarker(lat, lng) {
      selectedLat = lat; selectedLng = lng;
      var latlng = L.latLng(lat, lng);
      if (marker) { marker.setLatLng(latlng); } else { marker = L.marker(latlng).addTo(map); }
      map.panTo(latlng);
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerPlaced', latitude: lat, longitude: lng }));
    }
  </script>
</body>
</html>
`;

const InputField: React.FC<{ label: string; error?: string; children: React.ReactNode }> = ({ label, error, children }) => (
  <View style={ifStyles.wrapper}>
    <Text style={ifStyles.label}>{label}</Text>
    {children}
    {error ? <Text style={ifStyles.errorText}>{error}</Text> : null}
  </View>
);
const ifStyles = StyleSheet.create({
  wrapper:   { marginBottom: 14 },
  label:     { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  errorText: { fontSize: 12, color: '#e53935', marginTop: 4, marginLeft: 2 },
});

const CrmAccountCrud = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const routeAccountId = route?.params?.AccountId ? String(route.params.AccountId) : '';

  const [form, setForm]           = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors]       = useState<FormErrors>({});
  const [isSaving, setIsSaving]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accountId, setAccountId] = useState<string>('');
  const [industryOptions, setIndustryOptions] = useState<DropdownOption[]>([]);
  const [currencyOptions, setCurrencyOptions]  = useState<DropdownOption[]>([]);
  const [countryOptions, setCountryOptions]    = useState<DropdownOption[]>([]);
  const [activeDropdown, setActiveDropdown]    = useState<DropdownKey | null>(null);

  const [showMapModal, setShowMapModal]           = useState(false);
  const [tempLat, setTempLat]                     = useState<number | null>(null);
  const [tempLng, setTempLng]                     = useState<number | null>(null);
  const [latitude, setLatitude]                   = useState<string>('');
  const [longitude, setLongitude]                 = useState<string>('');
  const [locationName, setLocationName]           = useState<string>('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationSearch, setLocationSearch]       = useState('');
  const [locationSearchResults, setLocationSearchResults] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation]     = useState(false);
  const webViewRef        = useRef<any>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const data = await UserStorage.getCrmLoModeData();
        if (!data) { return; }
        const restItem2 = (data.Rest as any)?.Item2;
        if (Array.isArray(restItem2)) {
          setIndustryOptions(
            (restItem2 as any[]).map((i) => ({
              label: String(i.IndustryName ?? i.FieldValue ?? i.text  ?? ''),
              value: String(i.IndustryId   ?? i.FieldId   ?? i.id    ?? ''),
            })),
          );
        }
        if (Array.isArray(data.Item2)) {
          setCurrencyOptions(
            (data.Item2 as any[]).map((i) => ({
              label: String(i.CurrNam   ?? i.FieldValue ?? i.text ?? ''),
              value: String(i.CurrId    ?? i.FieldId   ?? i.id   ?? ''),
            })),
          );
        }
        if (Array.isArray(data.Item6)) {
          setCountryOptions(
            (data.Item6 as any[]).map((i) => ({
              label: String(i.CntryNam   ?? i.CntryName  ?? i.CountryName ?? i.FieldValue ?? i.text ?? ''),
              value: String(i.CntryId    ?? i.CountryId  ?? i.FieldId    ?? i.id          ?? ''),
            })),
          );
        }
      } catch (e) {
        console.error('CrmAccountCrud: failed to load lookup data', e);
      }
    };
    loadLookups();
  }, []);

  useEffect(() => {
    if (!routeAccountId || routeAccountId === '0') { return; }
    const loadData = async () => {
      try {
        setIsLoading(true);
        const token    = await UserStorage.getToken();
        const userData = await UserStorage.getUserData();
        const compid   = String(userData?.CompId ?? '0');
        const userId   = String(userData?.UserId ?? '0');
        const apiUrl   = getApiUrl('/api/cr5010/LoadCompany');
        const response = await axios.post<any[]>(
          apiUrl,
          { FkAccountId: routeAccountId, Compid: compid, UserId: userId, LanguageId: 1 },
          {
            headers: { ...API_CONFIG.DEFAULT_HEADERS, Authorization: `Bearer ${token}` },
            timeout: API_CONFIG.TIMEOUT,
          },
        );
        const acc = Array.isArray(response.data) && response.data.length > 0
          ? response.data[0]
          : null;
        if (acc) {
          setAccountId(String(acc.AccountId));
          setForm({
            AccountName:    String(acc.AccountName    ?? ''),
            FkIndustryId:   acc.FkIndustryId  != null ? String(acc.FkIndustryId)  : '',
            FkCurrId:       acc.FkCurrId       != null ? String(acc.FkCurrId)      : '',
            ExchRate:       acc.ExchRate       != null ? String(acc.ExchRate)      : '1',
            FkCountryId:    acc.FkCntryId      != null ? String(acc.FkCntryId)    : '',
            Street:         String(acc.Street         ?? ''),
            City:           String(acc.City           ?? ''),
            State:          String(acc.State          ?? ''),
            ZipCode:        String(acc.ZipCode        ?? ''),
            Fax:            String(acc.Fax            ?? ''),
            WebSite:        String(acc.WebSite        ?? ''),
            AddDescription: String(acc.AddDescription ?? ''),
            NoofEmployees:  acc.NoofEmployees  != null ? String(acc.NoofEmployees)  : '',
            AnnualTurnOver: acc.AnnualTurnOver != null ? String(acc.AnnualTurnOver) : '',
          });
          if (acc.Latitude  != null && String(acc.Latitude).trim()  !== '') { setLatitude(String(acc.Latitude)); }
          if (acc.Longitude != null && String(acc.Longitude).trim() !== '') { setLongitude(String(acc.Longitude)); }
          if (acc.Location  != null && String(acc.Location).trim()  !== '') { setLocationName(String(acc.Location)); }
        }
      } catch (error: any) {
        const message = error?.response?.data?.message ?? error?.message ?? 'Failed to load account data.';
        Alert.alert('Error', message);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [routeAccountId]);

  const setField = <K extends keyof FormState>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const optionsForKey = (key: DropdownKey): DropdownOption[] => {
    switch (key) {
      case 'FkIndustryId': return industryOptions;
      case 'FkCurrId':     return currencyOptions;
      case 'FkCountryId':  return countryOptions;
    }
  };
  const labelForKey = (key: DropdownKey): string =>
    optionsForKey(key).find((o) => o.value === form[key])?.label ?? '';
  const placeholderForKey = (key: DropdownKey): string => {
    switch (key) {
      case 'FkIndustryId': return 'Select industry';
      case 'FkCurrId':     return 'Select currency';
      case 'FkCountryId':  return 'Select country';
    }
  };
  const titleForKey = (key: DropdownKey): string => {
    switch (key) {
      case 'FkIndustryId': return 'Industry';
      case 'FkCurrId':     return 'Currency';
      case 'FkCountryId':  return 'Country';
    }
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.AccountName.trim())  { next.AccountName  = 'Account Name is required.'; }
    if (!form.FkIndustryId)        { next.FkIndustryId = 'Industry is required.'; }
    if (!form.FkCurrId)            { next.FkCurrId     = 'Currency is required.'; }
    if (!form.ExchRate.trim())     { next.ExchRate     = 'Exch. Rate is required.'; }
    if (!form.FkCountryId)         { next.FkCountryId  = 'Country is required.'; }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) { return; }
    try {
      setIsSaving(true);
      const token    = await UserStorage.getToken();
      const userData = await UserStorage.getUserData();
      const compid   = String(userData?.CompId ?? '0');
      const userId   = String(userData?.UserId ?? '0');
      const apiUrl   = getApiUrl('/api/cr0060/I_U_D_Mode');
      const response = await axios.post<{ IsSuccess: string }[]>(
        apiUrl,
        {
          Mode:           accountId ? 'U' : 'I',
          AccountId:      accountId || '0',
          IsAccount:      1,
          Compid:         compid,
          LanguageId:     '1',
          UserId:         userId,
          AccountName:    form.AccountName,
          FkIndustryId:   form.FkIndustryId   || '0',
          FkCurrId:       form.FkCurrId        || '0',
          ExchRate:       form.ExchRate        || '1',
          FkCountryId:    form.FkCountryId     || '0',
          State:          form.State,
          City:           form.City,
          Street:         form.Street,
          ZipCode:        form.ZipCode,
          Fax:            form.Fax,
          WebSite:        form.WebSite,
          AddDescription: form.AddDescription,
          NoofEmployees:  form.NoofEmployees   || null,
          AnnualTurnOver: form.AnnualTurnOver  || null,
          Latitude:       latitude             || null,
          Longitude:      longitude            || null,
          Location:       locationName         || '',
        },
        {
          headers: { ...API_CONFIG.DEFAULT_HEADERS, Authorization: `Bearer ${token}` },
          timeout: API_CONFIG.TIMEOUT,
        },
      );
      const result = Array.isArray(response.data) ? response.data[0] : null;
      if (result?.IsSuccess === 'True') {
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Save failed. Please try again.');
      }
    } catch (error: any) {
      const message = error?.response?.data?.message
        ?? error?.message
        ?? 'An unexpected error occurred.';
      Alert.alert('Error', message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Location handlers ──────────────────────────────────────────────────────

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerPlaced') {
        setTempLat(data.latitude);
        setTempLng(data.longitude);
      }
    } catch {}
  };

  const handleUseMyLocation = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }
    }
    setIsGettingLocation(true);
    Geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setTempLat(lat);
        setTempLng(lng);
        webViewRef.current?.injectJavaScript(
          `setMarker(${lat}, ${lng}); map.setView([${lat}, ${lng}], 15); true;`,
        );
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        Alert.alert('Location Error', error.message ?? 'Could not get current location.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const handleLocationSearch = async (query: string) => {
    if (!query.trim()) { return; }
    try {
      setIsSearchingLocation(true);
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'OxardERP/1.0' }, timeout: 8000 },
      );
      setLocationSearchResults(res.data ?? []);
    } catch {
      setLocationSearchResults([]);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleSelectSearchResult = (item: any) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setTempLat(lat);
    setTempLng(lng);
    webViewRef.current?.injectJavaScript(
      `setMarker(${lat}, ${lng}); map.setView([${lat}, ${lng}], 14); true;`,
    );
    setLocationSearchResults([]);
    setLocationSearch('');
  };

  const handleConfirmLocation = async () => {
    if (tempLat === null || tempLng === null) {
      Alert.alert('No Location Selected', 'Tap on the map or use "My Location" first.');
      return;
    }
    try {
      setIsGettingLocation(true);
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?lat=${tempLat}&lon=${tempLng}&format=json`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'OxardERP/1.0' }, timeout: 8000 },
      );
      setLocationName(res.data?.display_name ?? `${tempLat.toFixed(6)}, ${tempLng.toFixed(6)}`);
    } catch {
      setLocationName(`${tempLat.toFixed(6)}, ${tempLng.toFixed(6)}`);
    } finally {
      setLatitude(String(tempLat));
      setLongitude(String(tempLng));
      setIsGettingLocation(false);
      setShowMapModal(false);
    }
  };

  // ── Map modal ──────────────────────────────────────────────────────────────

  const renderMapModal = () => (
    <Modal
      visible={showMapModal}
      animationType="slide"
      onRequestClose={() => setShowMapModal(false)}
    >
      <SafeAreaView style={styles.mapModalContainer}>
        <View style={styles.mapModalHeader}>
          <Text style={styles.mapModalTitle}>Pick Location</Text>
          <TouchableOpacity onPress={() => setShowMapModal(false)}>
            <Text style={styles.modalCloseBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mapSearchRow}>
          <TextInput
            style={styles.mapSearchInput}
            value={locationSearch}
            onChangeText={(text) => {
              setLocationSearch(text);
              if (searchDebounceRef.current) { clearTimeout(searchDebounceRef.current); }
              if (!text.trim()) { setLocationSearchResults([]); return; }
              searchDebounceRef.current = setTimeout(() => { handleLocationSearch(text); }, 500);
            }}
            placeholder="Search location…"
            placeholderTextColor="#b0bec5"
            returnKeyType="search"
            onSubmitEditing={() => handleLocationSearch(locationSearch)}
          />
          <TouchableOpacity
            style={styles.mapSearchBtn}
            onPress={() => handleLocationSearch(locationSearch)}
            disabled={isSearchingLocation}
          >
            {isSearchingLocation
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.mapSearchBtnText}>🔍</Text>
            }
          </TouchableOpacity>
        </View>

        {locationSearchResults.length > 0 && (
          <View style={styles.mapSearchResults}>
            <FlatList
              data={locationSearchResults}
              keyExtractor={(_, i) => String(i)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.mapSearchResultItem}
                  onPress={() => handleSelectSearchResult(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.mapSearchResultText} numberOfLines={2}>
                    {item.display_name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        <WebView
          ref={webViewRef}
          style={styles.mapWebView}
          source={{ html: MAP_HTML }}
          onMessage={handleWebViewMessage}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
        />

        {tempLat !== null && (
          <View style={styles.mapCoordsRow}>
            <Text style={styles.mapCoordsText}>
              {tempLat.toFixed(6)}, {tempLng?.toFixed(6)}
            </Text>
          </View>
        )}

        <View style={styles.mapModalFooter}>
          <TouchableOpacity
            style={[styles.mapBtn, styles.mapBtnSecondary]}
            onPress={handleUseMyLocation}
            disabled={isGettingLocation}
          >
            {isGettingLocation
              ? <ActivityIndicator size="small" color="#811458" />
              : <Text style={styles.mapBtnTextDark}>📍 My Location</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mapBtn, styles.mapBtnPrimary]}
            onPress={handleConfirmLocation}
            disabled={isGettingLocation || tempLat === null}
          >
            <Text style={styles.mapBtnText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  // ── Dropdown modal ─────────────────────────────────────────────────────────

  const renderDropdownModal = () => {
    if (!activeDropdown) { return null; }
    const options = optionsForKey(activeDropdown);
    return (
      <Modal
        transparent
        animationType="fade"
        visible
        onRequestClose={() => setActiveDropdown(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveDropdown(null)}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {titleForKey(activeDropdown)}</Text>
              <TouchableOpacity onPress={() => setActiveDropdown(null)}>
                <Text style={styles.modalCloseBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            {options.length === 0 ? (
              <Text style={styles.noOptionsText}>No options available.</Text>
            ) : (
              <FlatList
                data={options}
                keyExtractor={(item) => item.value}
                style={styles.pickerList}
                renderItem={({ item }) => {
                  const isSelected = form[activeDropdown] === item.value;
                  return (
                    <TouchableOpacity
                      style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setField(activeDropdown, item.value);
                        setActiveDropdown(null);
                      }}
                    >
                      <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#811458" />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <View style={styles.backIconWrap}>
            <Image
              source={require('../../../assets/images/backarow.png')}
              style={styles.backIconImg}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>
        <View style={styles.pageTitleWrap}>
          <Text style={styles.pageTitle}>ACCOUNT</Text>
        </View>
        <View style={styles.topBarPlaceholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formCard}>
            {/* Account Name + location icon */}
            <InputField label="Account Name *" error={errors.AccountName}>
              <View style={styles.accountNameRow}>
                <TextInput
                  style={[styles.textInput, styles.accountNameInput]}
                  value={form.AccountName}
                  onChangeText={(v) => setField('AccountName', v)}
                  placeholder="Enter account name"
                  placeholderTextColor="#b0bec5"
                />
                <TouchableOpacity
                  style={styles.locationIconBtn}
                  onPress={() => {
                    setTempLat(latitude ? Number(latitude) : null);
                    setTempLng(longitude ? Number(longitude) : null);
                    setShowMapModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Image
                    source={require('../../../assets/images/innerpage/location1.png')}
                    style={[styles.locationIconImg, latitude && longitude ? styles.locationIconGreen : styles.locationIconRed]}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </InputField>

            {/* Industry */}
            <InputField label="Industry *" error={errors.FkIndustryId}>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setActiveDropdown('FkIndustryId')}
                activeOpacity={0.7}
              >
                <Text style={form.FkIndustryId ? styles.dropdownValue : styles.dropdownPlaceholder}>
                  {labelForKey('FkIndustryId') || placeholderForKey('FkIndustryId')}
                </Text>
                <Text style={styles.dropdownChevron}>▼</Text>
              </TouchableOpacity>
            </InputField>

            {/* Currency */}
            <InputField label="Currency *" error={errors.FkCurrId}>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setActiveDropdown('FkCurrId')}
                activeOpacity={0.7}
              >
                <Text style={form.FkCurrId ? styles.dropdownValue : styles.dropdownPlaceholder}>
                  {labelForKey('FkCurrId') || placeholderForKey('FkCurrId')}
                </Text>
                <Text style={styles.dropdownChevron}>▼</Text>
              </TouchableOpacity>
            </InputField>

            {/* Exch. Rate */}
            <InputField label="Exch. Rate *" error={errors.ExchRate}>
              <TextInput
                style={styles.textInput}
                value={form.ExchRate}
                onChangeText={(v) => setField('ExchRate', v)}
                placeholder="1"
                placeholderTextColor="#b0bec5"
                keyboardType="numeric"
              />
            </InputField>

            {/* Country */}
            <InputField label="Country *" error={errors.FkCountryId}>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setActiveDropdown('FkCountryId')}
                activeOpacity={0.7}
              >
                <Text style={form.FkCountryId ? styles.dropdownValue : styles.dropdownPlaceholder}>
                  {labelForKey('FkCountryId') || placeholderForKey('FkCountryId')}
                </Text>
                <Text style={styles.dropdownChevron}>▼</Text>
              </TouchableOpacity>
            </InputField>

            {/* State */}
            <InputField label="State">
              <TextInput
                style={styles.textInput}
                value={form.State}
                onChangeText={(v) => setField('State', v)}
                placeholder="Enter state"
                placeholderTextColor="#b0bec5"
              />
            </InputField>

            {/* City */}
            <InputField label="City">
              <TextInput
                style={styles.textInput}
                value={form.City}
                onChangeText={(v) => setField('City', v)}
                placeholder="Enter city"
                placeholderTextColor="#b0bec5"
              />
            </InputField>

            {/* Street */}
            <InputField label="Street">
              <TextInput
                style={styles.textInput}
                value={form.Street}
                onChangeText={(v) => setField('Street', v)}
                placeholder="Enter street"
                placeholderTextColor="#b0bec5"
              />
            </InputField>

            {/* Zip Code + Fax */}
            <View style={styles.rowTwo}>
              <View style={styles.rowTwoItem}>
                <InputField label="Zip Code">
                  <TextInput
                    style={styles.textInput}
                    value={form.ZipCode}
                    onChangeText={(v) => setField('ZipCode', v)}
                    placeholder="Enter zip code"
                    placeholderTextColor="#b0bec5"
                    keyboardType="numeric"
                  />
                </InputField>
              </View>
              <View style={styles.rowTwoItem}>
                <InputField label="Fax">
                  <TextInput
                    style={styles.textInput}
                    value={form.Fax}
                    onChangeText={(v) => setField('Fax', v)}
                    placeholder="Enter fax"
                    placeholderTextColor="#b0bec5"
                  />
                </InputField>
              </View>
            </View>

            {/* WebSite */}
            <InputField label="WebSite">
              <TextInput
                style={styles.textInput}
                value={form.WebSite}
                onChangeText={(v) => setField('WebSite', v)}
                placeholder="Enter website URL"
                placeholderTextColor="#b0bec5"
                autoCapitalize="none"
                keyboardType="url"
              />
            </InputField>

            {/* Add Description */}
            <InputField label="Add Description">
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={form.AddDescription}
                onChangeText={(v) => setField('AddDescription', v)}
                placeholder="Enter description"
                placeholderTextColor="#b0bec5"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </InputField>

            {/* No. of Employees + Annual Turnover */}
            <View style={styles.rowTwo}>
              <View style={styles.rowTwoItem}>
                <InputField label="No. of Employees">
                  <TextInput
                    style={styles.textInput}
                    value={form.NoofEmployees}
                    onChangeText={(v) => setField('NoofEmployees', v)}
                    placeholder="Enter no. of employees"
                    placeholderTextColor="#b0bec5"
                    keyboardType="numeric"
                  />
                </InputField>
              </View>
              <View style={styles.rowTwoItem}>
                <InputField label="Annual Turnover">
                  <TextInput
                    style={styles.textInput}
                    value={form.AnnualTurnOver}
                    onChangeText={(v) => setField('AnnualTurnOver', v)}
                    placeholder="Enter annual turnover"
                    placeholderTextColor="#b0bec5"
                    keyboardType="numeric"
                  />
                </InputField>
              </View>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.footerBtn, styles.btnClear, isSaving && styles.btnDisabled]}
              onPress={() => {
                setForm(INITIAL_FORM);
                setErrors({});
                setAccountId('');
                setLatitude('');
                setLongitude('');
                setLocationName('');
                setTempLat(null);
                setTempLng(null);
              }}
              activeOpacity={0.8}
              disabled={isSaving}
            >
              <Text style={styles.footerBtnText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerBtn, styles.btnSave, isSaving && styles.btnDisabled]}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={isSaving}
            >
              {isSaving
                ? <ActivityIndicator size="small" color="#ffffff" />
                : <Text style={styles.footerBtnText}>Save</Text>
              }
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {renderDropdownModal()}
      {renderMapModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  flex: { flex: 1 },
  loadingOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#811458', fontWeight: '600' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingRight: 10,
  },
  backIconWrap: { marginLeft: 20 },
  backIconImg: { width: 25, height: 25 },
  pageTitleWrap: { flex: 1, alignItems: 'center' },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#811458' },
  topBarPlaceholder: { width: 25 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  formCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2 },
  textInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DEECFF',
    padding: 10,
    fontSize: 15,
    marginBottom: 2,
    color: '#111827',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DEECFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 2,
    backgroundColor: '#f9f9f9',
  },
  dropdownValue: { fontSize: 15, color: '#222', flex: 1 },
  dropdownPlaceholder: { fontSize: 15, color: '#b0bec5', flex: 1 },
  dropdownChevron: { fontSize: 16, color: '#888', marginLeft: 8 },
  pickerList: { maxHeight: 320 },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerItemActive: { backgroundColor: '#fdf0f7' },
  pickerItemText: { fontSize: 14, color: '#111827' },
  pickerItemTextActive: { color: '#811458', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  modalCloseBtn: { fontSize: 16, color: '#811458', fontWeight: '700', paddingHorizontal: 4 },
  noOptionsText: { fontSize: 13, color: '#9e9e9e', textAlign: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  rowTwo: { flexDirection: 'row', gap: 12 },
  rowTwoItem: { flex: 1 },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  footer: { flexDirection: 'row', gap: 12, marginTop: 16, marginBottom: 8 },
  footerBtn: { flex: 1, borderRadius: 8, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  btnClear: { backgroundColor: '#f9a825' },
  btnSave: { backgroundColor: '#811458' },
  btnDisabled: { opacity: 0.55 },
  footerBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },

  /* Account name + location icon row */
  accountNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  accountNameInput: { flex: 1, marginBottom: 0 },
  locationIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DEECFF',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationIconImg: { width: 26, height: 26 },
  locationIconRed:   { tintColor: '#e53935' },
  locationIconGreen: { tintColor: '#2e7d32' },

  /* Map modal */
  mapModalContainer: { flex: 1, backgroundColor: '#fff' },
  mapModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mapModalTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  mapWebView: { flex: 1 },
  mapCoordsRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  mapCoordsText: { fontSize: 12, color: '#6b7280', textAlign: 'center' },
  mapModalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  mapBtn: { flex: 1, borderRadius: 8, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  mapBtnPrimary:   { backgroundColor: '#811458' },
  mapBtnSecondary: { backgroundColor: '#f3e8f0', borderWidth: 1, borderColor: '#811458' },
  mapBtnText:     { color: '#fff', fontSize: 15, fontWeight: '700' },
  mapBtnTextDark: { color: '#811458', fontSize: 14, fontWeight: '600' },

  /* Map search */
  mapSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 8,
  },
  mapSearchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DEECFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  mapSearchBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#811458',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapSearchBtnText: { fontSize: 16 },
  mapSearchResults: {
    position: 'absolute',
    top: 114,
    left: 12,
    right: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 200,
    zIndex: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  mapSearchResultItem: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  mapSearchResultText: { fontSize: 13, color: '#374151' },
});

export default CrmAccountCrud;
