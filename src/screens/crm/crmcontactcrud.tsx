import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
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
import { API_CONFIG, getApiUrl } from '../../config/apiConfig';
import UserStorage from '../../utils/userStorage';

// ─── Types ───────────────────────────────────────────────────────────────────

type DropdownOption = { label: string; value: string };

type RawProduct = { ProductId: number; ProductCode: string; ProductName: string };

type FormState = {
  ContactId: string;
  AccountName: string;
  FkAccIdContact: string;
  ContactNameContact: string;
  EmailContact: string;
  SecEmailContact: string;
  PhoneContact: string;
  AlternatePhoneContact: string;
  MobileNumberContact: string;
  FaxContact: string;
  DeparmentContact: string;
  ProductListContact: string[];
  FkCountryContact: string;
  StateContact: string;
  StreetContact: string;
  CityContact: string;
  ZipContact: string;
  OtherInformationContact: string;
  Active: string;
};

type StringFormKey = Exclude<keyof FormState, 'ProductListContact'>;
type FormErrors = Partial<Record<keyof FormState, string>>;
type SingleDropdownKey = 'FkAccIdContact' | 'FkCountryContact';
type MultiDropdownKey = 'ProductListContact';
type DropdownKey = SingleDropdownKey | MultiDropdownKey;

const INITIAL_FORM: FormState = {
  ContactId: '0',
  AccountName: '',
  FkAccIdContact: '',
  ContactNameContact: '',
  EmailContact: '',
  SecEmailContact: '',
  PhoneContact: '',
  AlternatePhoneContact: '',
  MobileNumberContact: '',
  FaxContact: '',
  DeparmentContact: '',
  ProductListContact: [],
  FkCountryContact: '',
  StateContact: '',
  StreetContact: '',
  CityContact: '',
  ZipContact: '',
  OtherInformationContact: '',
  Active: '0',
};

// ─── Reusable InputField component ───────────────────────────────────────────

type InputFieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
};

const InputField = ({ label, required, error, children }: InputFieldProps) => (
  <View style={fieldStyles.wrapper}>
    <Text style={fieldStyles.label}>
      {label}
      {required ? <Text style={fieldStyles.asterisk}> *</Text> : null}
    </Text>
    {children}
    {error ? <Text style={fieldStyles.errorText}>{error}</Text> : null}
  </View>
);

const fieldStyles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: 14, color: '#374151', marginBottom: 6, fontWeight: '500' },
  asterisk: { color: '#e53935', fontWeight: '700' },
  errorText: { fontSize: 12, color: '#e53935', marginTop: 4, marginLeft: 2 },
});

// ─── Main Component ───────────────────────────────────────────────────────────

const CrmContactCrudScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const relationId = route?.params?.RelationId ? Number(route.params.RelationId) : 0;
  const accountId = route?.params?.AccountId ? Number(route.params.AccountId) : 0;
  const contactId = route?.params?.ContactId ? Number(route.params.ContactId) : 0;
  const companyName = route?.params?.CompanyName ? String(route.params.CompanyName) : '';
  const [isEditMode, setIsEditMode] = useState(contactId > 0);

  const [form, setForm] = useState<FormState>({
    ...INITIAL_FORM,
    ContactId: String(contactId),
    FkAccIdContact: accountId ? String(accountId) : '',
    AccountName: companyName,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingRecord, setIsLoadingRecord] = useState(false);

  // single-select modal
  const [activeDropdown, setActiveDropdown] = useState<SingleDropdownKey | null>(null);

  // multi-select modal
  const [activeMultiDropdown, setActiveMultiDropdown] = useState<MultiDropdownKey | null>(null);
  const [pendingSelection, setPendingSelection] = useState<string[]>([]);

  // lookup data
  const [accountOptions, setAccountOptions] = useState<DropdownOption[]>([]);
  const [productOptions, setProductOptions] = useState<DropdownOption[]>([]);
  const [rawProductData, setRawProductData] = useState<RawProduct[]>([]);
  const [countryOptions, setCountryOptions] = useState<DropdownOption[]>([]);

  // ── Load LO_Mode lookup data ──────────────────────────────────────────────

  useEffect(() => {
    const loadLookupData = async () => {
      try {
        const data = await UserStorage.getCrmLoModeData();
        if (!data) { return; }

        // Item5 → Accounts  { AccountId, AccountName }
        if (Array.isArray(data.Item5)) {
          setAccountOptions(
            (data.Item5 as any[]).map((i) => ({
              label: i.AccountName ?? String(i.AccountId ?? ''),
              value: String(i.AccountId ?? ''),
            })),
          );
        }

        // Item3 → Products  { ProductId, ProductCode, ProductName }
        if (Array.isArray(data.Item3)) {
          const items = data.Item3 as any[];
          setRawProductData(
            items.map((i) => ({
              ProductId: Number(i.ProductId ?? 0),
              ProductCode: String(i.ProductCode ?? ''),
              ProductName: String(i.ProductName ?? ''),
            })),
          );
          setProductOptions(
            items.map((i) => ({
              label: i.ProductName ?? String(i.ProductId ?? ''),
              value: String(i.ProductId ?? ''),
            })),
          );
        }

        // Item6 → Country
        if (Array.isArray(data.Item6)) {
          setCountryOptions(
            (data.Item6 as any[]).map((i) => ({
              label: String(i.CntryNam ?? i.CntryName ?? i.CountryName ?? i.FieldValue ?? i.text ?? ''),
              value: String(i.CntryId ?? i.CountryId ?? i.FieldId ?? i.id ?? ''),
            })),
          );
        }
      } catch (e) {
        console.error('CrmContactCrudScreen: failed to load lookup data', e);
      }
    };

    loadLookupData();
  }, []);

  // ── Load existing record when ContactId > 0 ──────────────────────────────

  useEffect(() => {
    if (!contactId || contactId <= 0) { return; }

    const loadRecord = async () => {
      try {
        setIsLoadingRecord(true);
        const token = await UserStorage.getToken();
        const userData = await UserStorage.getUserData();

        if (!token) { return; }

        const apiUrl = getApiUrl('/api/cr5011/SE_Mode');
        const response = await axios.post<any>(apiUrl, {
          ContactId: String(contactId),
          Compid: String(userData?.CompId ?? '0'),
          UserId: String(userData?.UserId ?? '0'),
          LanguageId: 1,
        }, {
          headers: {
            ...API_CONFIG.DEFAULT_HEADERS,
            Authorization: `Bearer ${token}`,
          },
          timeout: API_CONFIG.TIMEOUT,
        });

        const res = response.data;
        const rec = Array.isArray(res?.Item1) && res.Item1.length > 0 ? res.Item1[0] : null;
        if (rec) {
          setForm((prev) => ({
            ...prev,
            ContactId: String(rec.ContactId ?? prev.ContactId),
            AccountName: String(rec.AccountName ?? ''),
            FkAccIdContact: rec.FkAccountId != null ? String(rec.FkAccountId) : prev.FkAccIdContact,
            ContactNameContact: String(rec.ContactName ?? ''),
            EmailContact: String(rec.Email ?? ''),
            SecEmailContact: String(rec.SecondaryMail ?? ''),
            PhoneContact: String(rec.Phone ?? ''),
            AlternatePhoneContact: String(rec.AlternatePhone ?? ''),
            MobileNumberContact: String(rec.Mobile ?? ''),
            FaxContact: String(rec.Fax ?? ''),
            DeparmentContact: String(rec.Department ?? ''),
            FkCountryContact: rec.FkCntryId != null ? String(rec.FkCntryId) : '',
            StateContact: String(rec.State ?? ''),
            StreetContact: String(rec.Street ?? ''),
            CityContact: String(rec.City ?? ''),
            ZipContact: String(rec.Zip ?? ''),
            OtherInformationContact: String(rec.Otherinfo ?? ''),
            Active: rec.Active != null ? String(rec.Active) : '0',
          }));
        }

        // Products
        if (Array.isArray(res?.Item2)) {
          setForm((prev) => ({
            ...prev,
            ProductListContact: (res.Item2 as any[]).map((p: any) => String(p.ProductId ?? '')),
          }));
        }
      } catch (e) {
        console.error('CrmContactCrudScreen: failed to load record', e);
      } finally {
        setIsLoadingRecord(false);
      }
    };

    loadRecord();
  }, [contactId]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const setField = <K extends StringFormKey>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const optionsForKey = (key: DropdownKey): DropdownOption[] => {
    switch (key) {
      case 'FkAccIdContact': return accountOptions;
      case 'ProductListContact': return productOptions;
      case 'FkCountryContact': return countryOptions;
    }
  };

  const labelForKey = (key: SingleDropdownKey): string =>
    optionsForKey(key).find((o) => o.value === form[key])?.label ?? '';

  const placeholderForKey = (key: DropdownKey): string => {
    switch (key) {
      case 'FkAccIdContact': return 'Select account';
      case 'ProductListContact': return 'Select products';
      case 'FkCountryContact': return 'Select country';
    }
  };

  const titleForKey = (key: DropdownKey): string => {
    switch (key) {
      case 'FkAccIdContact': return 'Account';
      case 'ProductListContact': return 'Products';
      case 'FkCountryContact': return 'Country';
    }
  };

  const openMultiDropdown = (key: MultiDropdownKey) => {
    setPendingSelection([...form[key]]);
    setActiveMultiDropdown(key);
  };

  const togglePending = (value: string) => {
    setPendingSelection((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const confirmMultiSelection = () => {
    if (activeMultiDropdown) {
      setForm((prev) => ({ ...prev, [activeMultiDropdown]: pendingSelection }));
    }
    setActiveMultiDropdown(null);
  };

  // ── Validation ───────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!isEditMode) {
      if (!form.ContactNameContact.trim()) {
        next.ContactNameContact = 'Contact Name is required.';
      }
      if (!form.MobileNumberContact.trim()) {
        next.MobileNumberContact = 'Mobile is required.';
      }
      if (!form.FkCountryContact.trim()) {
        next.FkCountryContact = 'Country is required.';
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!validate()) { return; }
    if (isSaving) { return; }

    try {
      setIsSaving(true);
      const token = await UserStorage.getToken();
      const userData = await UserStorage.getUserData();

      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please login again.');
        return;
      }

      const compid = String(userData?.CompId ?? '0');
      const userId = String(userData?.UserId ?? '0');

      const requestBody = {
        Mode: Number(form.ContactId || '0') > 0 ? 'U' : 'I',
        Compid: compid,
        UserId: userId,
        LanguageId: 1,
        ContactId: form.ContactId || '0',
        AccountName: form.AccountName,
        FkAccIdContact: form.FkAccIdContact || '0',
        ContactNameContact: form.ContactNameContact,
        EmailContact: form.EmailContact,
        SecEmailContact: form.SecEmailContact,
        PhoneContact: form.PhoneContact,
        AlternatePhoneContact: form.AlternatePhoneContact,
        MobileNumberContact: form.MobileNumberContact,
        FaxContact: form.FaxContact,
        DeparmentContact: form.DeparmentContact,
        ProductListContact: form.ProductListContact.map((id) => {
          const p = rawProductData.find((r) => String(r.ProductId) === id);
          return {
            ProductId: p?.ProductId ?? Number(id),
            ProductCode: p?.ProductCode ?? '',
            ProductName: p?.ProductName ?? '',
          };
        }),
        FkCountryContact: form.FkCountryContact || '0',
        StateContact: form.StateContact,
        StreetContact: form.StreetContact,
        CityContact: form.CityContact,
        ZipContact: form.ZipContact,
        OtherInformationContact: form.OtherInformationContact,
        Active: form.Active,
      };

      const apiUrl = getApiUrl('/api/cr5011/I_U_D_Mode');
      const response = await axios.post<{ IsSuccess: string }[]>(apiUrl, requestBody, {
        headers: {
          ...API_CONFIG.DEFAULT_HEADERS,
          Authorization: `Bearer ${token}`,
        },
        timeout: API_CONFIG.TIMEOUT,
      });

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

  const handleClear = () => {
    setForm({ ...INITIAL_FORM, ContactId: '0' });
    setErrors({});
    setIsEditMode(false);
  };

  // ── Single-select dropdown modal ──────────────────────────────────────────

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

  // ── Multi-select dropdown modal ────────────────────────────────────────────

  const renderMultiDropdownModal = () => {
    if (!activeMultiDropdown) { return null; }
    const options = optionsForKey(activeMultiDropdown);
    return (
      <Modal
        transparent
        animationType="fade"
        visible
        onRequestClose={() => setActiveMultiDropdown(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveMultiDropdown(null)}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {titleForKey(activeMultiDropdown)}</Text>
              <TouchableOpacity onPress={() => setActiveMultiDropdown(null)}>
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
                  const checked = pendingSelection.includes(item.value);
                  return (
                    <TouchableOpacity
                      style={[styles.pickerItem, checked && styles.pickerItemActive]}
                      activeOpacity={0.7}
                      onPress={() => togglePending(item.value)}
                    >
                      <View style={styles.multiRow}>
                        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                          {checked && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <Text style={[styles.pickerItemText, checked && styles.pickerItemTextActive]}>
                          {item.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            <View style={styles.multiFooter}>
              <TouchableOpacity
                style={styles.multiDoneBtn}
                activeOpacity={0.8}
                onPress={confirmMultiSelection}
              >
                <Text style={styles.multiDoneBtnText}>
                  Done{pendingSelection.length > 0 ? ` (${pendingSelection.length})` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoadingRecord) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#811458" />
          <Text style={styles.loadingText}>Loading record…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Top bar ── */}
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
          <Text style={styles.pageTitle}>CONTACT</Text>
        </View>
        <View style={styles.topBarPlaceholder} />
      </View>

      {/* ── Body ── */}
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

            {/* Company Name */}
            {companyName.trim() !== '' && (
              <InputField label="Company Name" error={errors.AccountName}>
                <TextInput
                  style={[styles.textInput, isEditMode && styles.inputDisabled]}
                  value={form.AccountName}
                  onChangeText={(v) => setField('AccountName', v)}
                  placeholder="Enter company name"
                  placeholderTextColor="#b0bec5"
                  editable={!isEditMode}
                />
              </InputField>
            )}

            {/* Accounts */}
            <InputField label="Accounts" error={errors.FkAccIdContact}>
              <TouchableOpacity
                style={[styles.dropdownBtn, isEditMode && styles.inputDisabled]}
                onPress={() => !isEditMode && setActiveDropdown('FkAccIdContact')}
                activeOpacity={isEditMode ? 1 : 0.7}
                disabled={isEditMode}
              >
                <Text style={form.FkAccIdContact ? styles.dropdownValue : styles.dropdownPlaceholder}>
                  {labelForKey('FkAccIdContact') || placeholderForKey('FkAccIdContact')}
                </Text>
                <Text style={styles.dropdownChevron}>▼</Text>
              </TouchableOpacity>
            </InputField>

            {/* Contact Name */}
            <InputField label="Contact Name" required error={errors.ContactNameContact}>
              <TextInput
                style={[styles.textInput, errors.ContactNameContact ? styles.inputErrorBorder : null, isEditMode && styles.inputDisabled]}
                value={form.ContactNameContact}
                onChangeText={(v) => setField('ContactNameContact', v)}
                placeholder="Enter contact name"
                placeholderTextColor="#b0bec5"
                editable={!isEditMode}
              />
            </InputField>

            {/* Email */}
            <InputField label="Email" error={errors.EmailContact}>
              <TextInput
                style={[styles.textInput, isEditMode && styles.inputDisabled]}
                value={form.EmailContact}
                onChangeText={(v) => setField('EmailContact', v)}
                placeholder="Enter email"
                placeholderTextColor="#b0bec5"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isEditMode}
              />
            </InputField>

            {/* Secondary Email */}
            <InputField label="Secondary Email" error={errors.SecEmailContact}>
              <TextInput
                style={[styles.textInput, isEditMode && styles.inputDisabled]}
                value={form.SecEmailContact}
                onChangeText={(v) => setField('SecEmailContact', v)}
                placeholder="Enter secondary email"
                placeholderTextColor="#b0bec5"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isEditMode}
              />
            </InputField>

            {/* Phone */}
            <InputField label="Phone" error={errors.PhoneContact}>
              <TextInput
                style={[styles.textInput, isEditMode && styles.inputDisabled]}
                value={form.PhoneContact}
                onChangeText={(v) => setField('PhoneContact', v)}
                placeholder="Enter phone"
                placeholderTextColor="#b0bec5"
                keyboardType="phone-pad"
                editable={!isEditMode}
              />
            </InputField>

            {/* Alternate Phone */}
            <InputField label="Alternate Phone" error={errors.AlternatePhoneContact}>
              <TextInput
                style={[styles.textInput, isEditMode && styles.inputDisabled]}
                value={form.AlternatePhoneContact}
                onChangeText={(v) => setField('AlternatePhoneContact', v)}
                placeholder="Enter alternate phone"
                placeholderTextColor="#b0bec5"
                keyboardType="phone-pad"
                editable={!isEditMode}
              />
            </InputField>

            {/* Mobile */}
            <InputField label="Mobile" required error={errors.MobileNumberContact}>
              <TextInput
                style={[styles.textInput, errors.MobileNumberContact ? styles.inputErrorBorder : null, isEditMode && styles.inputDisabled]}
                value={form.MobileNumberContact}
                onChangeText={(v) => setField('MobileNumberContact', v)}
                placeholder="Enter mobile number"
                placeholderTextColor="#b0bec5"
                keyboardType="phone-pad"
                editable={!isEditMode}
              />
            </InputField>

            {/* Fax */}
            <InputField label="Fax" error={errors.FaxContact}>
              <TextInput
                style={[styles.textInput, isEditMode && styles.inputDisabled]}
                value={form.FaxContact}
                onChangeText={(v) => setField('FaxContact', v)}
                placeholder="Enter fax"
                placeholderTextColor="#b0bec5"
                editable={!isEditMode}
              />
            </InputField>

            {/* Department */}
            <InputField label="Department" error={errors.DeparmentContact}>
              <TextInput
                style={[styles.textInput, isEditMode && styles.inputDisabled]}
                value={form.DeparmentContact}
                onChangeText={(v) => setField('DeparmentContact', v)}
                placeholder="Enter department"
                placeholderTextColor="#b0bec5"
                editable={!isEditMode}
              />
            </InputField>

            {/* Products — multi-select */}
            <InputField label="Products" error={errors.ProductListContact}>
              <TouchableOpacity
                style={[styles.dropdownBtn, isEditMode && styles.inputDisabled]}
                onPress={() => !isEditMode && openMultiDropdown('ProductListContact')}
                activeOpacity={isEditMode ? 1 : 0.7}
                disabled={isEditMode}
              >
                {form.ProductListContact.length === 0 ? (
                  <Text style={[styles.dropdownPlaceholder, styles.flex1]}>
                    {placeholderForKey('ProductListContact')}
                  </Text>
                ) : (
                  <View style={styles.tagRow}>
                    {form.ProductListContact.map((v) => {
                      const lbl = productOptions.find((o) => o.value === v)?.label ?? v;
                      return (
                        <View key={v} style={styles.tag}>
                          <Text style={styles.tagText}>{lbl}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
                <Text style={styles.dropdownChevron}>▼</Text>
              </TouchableOpacity>
            </InputField>

            {/* Country */}
            <InputField label="Country" required error={errors.FkCountryContact}>
              <TouchableOpacity
                style={[styles.dropdownBtn, isEditMode && styles.inputDisabled]}
                onPress={() => !isEditMode && setActiveDropdown('FkCountryContact')}
                activeOpacity={isEditMode ? 1 : 0.7}
                disabled={isEditMode}
              >
                <Text style={form.FkCountryContact ? styles.dropdownValue : styles.dropdownPlaceholder}>
                  {labelForKey('FkCountryContact') || placeholderForKey('FkCountryContact')}
                </Text>
                <Text style={styles.dropdownChevron}>▼</Text>
              </TouchableOpacity>
            </InputField>

            {/* State */}
            <InputField label="State" error={errors.StateContact}>
              <TextInput
                style={[styles.textInput, isEditMode && styles.inputDisabled]}
                value={form.StateContact}
                onChangeText={(v) => setField('StateContact', v)}
                placeholder="Enter state"
                placeholderTextColor="#b0bec5"
                editable={!isEditMode}
              />
            </InputField>

            {/* Street */}
            <InputField label="Street" error={errors.StreetContact}>
              <TextInput
                style={[styles.textInput, isEditMode && styles.inputDisabled]}
                value={form.StreetContact}
                onChangeText={(v) => setField('StreetContact', v)}
                placeholder="Enter street"
                placeholderTextColor="#b0bec5"
                editable={!isEditMode}
              />
            </InputField>

            {/* City */}
            <InputField label="City" error={errors.CityContact}>
              <TextInput
                style={[styles.textInput, isEditMode && styles.inputDisabled]}
                value={form.CityContact}
                onChangeText={(v) => setField('CityContact', v)}
                placeholder="Enter city"
                placeholderTextColor="#b0bec5"
                editable={!isEditMode}
              />
            </InputField>

            {/* Zip */}
            <InputField label="Zip" error={errors.ZipContact}>
              <TextInput
                style={[styles.textInput, isEditMode && styles.inputDisabled]}
                value={form.ZipContact}
                onChangeText={(v) => setField('ZipContact', v)}
                placeholder="Enter zip"
                placeholderTextColor="#b0bec5"
                editable={!isEditMode}
              />
            </InputField>

            {/* Other Information */}
            <InputField label="Other Information" error={errors.OtherInformationContact}>
              <TextInput
                style={[styles.textInput, styles.textArea, isEditMode && styles.inputDisabled]}
                value={form.OtherInformationContact}
                onChangeText={(v) => setField('OtherInformationContact', v)}
                placeholder="Enter other information"
                placeholderTextColor="#b0bec5"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!isEditMode}
              />
            </InputField>

            {/* Active */}
            <View style={fieldStyles.wrapper}>
              <TouchableOpacity
                style={styles.checkboxRow}
                activeOpacity={0.7}
                onPress={() => setField('Active', form.Active === '1' ? '0' : '1')}
              >
                <View style={[styles.checkboxBox, form.Active === '1' && styles.checkboxBoxChecked]}>
                  {form.Active === '1' && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Active</Text>
              </TouchableOpacity>
            </View>

          </View>

          {/* ── Action buttons ── */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.footerBtn, styles.btnClear, isSaving && styles.btnDisabled]}
              onPress={handleClear}
              activeOpacity={0.8}
              disabled={isSaving}
            >
              <Text style={styles.footerBtnTextDark}>Clear</Text>
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

      {/* ── Single-select modal ── */}
      {renderDropdownModal()}

      {/* ── Multi-select modal ── */}
      {renderMultiDropdownModal()}

    </SafeAreaView>
  );
};

export default CrmContactCrudScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  flex: {
    flex: 1,
  },

  /* Loading overlay */
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#811458',
    fontWeight: '600',
  },

  /* Top bar */
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingRight: 10,
  },
  backIconWrap: {
    marginLeft: 20,
  },
  backIconImg: {
    width: 25,
    height: 25,
  },
  pageTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#811458',
  },
  topBarPlaceholder: {
    width: 40,
  },

  /* Scroll */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 28,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },

  /* Text input */
  textInput: {
    borderWidth: 1,
    borderColor: '#DEECFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#ffffff',
    width: '100%',
  },
  inputErrorBorder: {
    borderColor: '#e53935',
  },
  inputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#9e9e9e',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },

  /* Dropdown button */
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DEECFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: '#ffffff',
  },
  dropdownValue: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: '#b0bec5',
    flex: 1,
  },
  dropdownChevron: {
    fontSize: 12,
    color: '#133F7C',
    marginLeft: 6,
  },

  /* Dropdown modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '88%',
    maxHeight: '60%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#811458',
  },
  modalCloseBtn: {
    fontSize: 18,
    color: '#930606',
    paddingLeft: 10,
  },
  pickerList: {
    flexGrow: 0,
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pickerItemActive: {
    backgroundColor: '#fdf0f7',
  },
  pickerItemText: {
    fontSize: 14,
    color: '#111827',
  },
  pickerItemTextActive: {
    color: '#811458',
    fontWeight: '600',
  },
  noOptionsText: {
    fontSize: 13,
    color: '#9e9e9e',
    textAlign: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },

  /* Multi-select */
  flex1: {
    flex: 1,
  },
  multiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#811458',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#811458',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  multiFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    padding: 12,
  },
  multiDoneBtn: {
    backgroundColor: '#811458',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  multiDoneBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  tagRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: 2,
  },
  tag: {
    backgroundColor: '#f3e5f5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#811458',
    fontWeight: '600',
  },

  /* Footer */
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  footerBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnClear: {
    backgroundColor: '#f9a825',
  },
  btnSave: {
    backgroundColor: '#811458',
  },
  btnDisabled: {
    opacity: 0.55,
  },
  footerBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footerBtnTextDark: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* Active checkbox */
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxBoxChecked: {
    backgroundColor: '#811458',
    borderColor: '#811458',
  },
  checkboxTick: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
});
