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
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { API_CONFIG, getApiUrl } from '../../config/apiConfig';
import UserStorage from '../../utils/userStorage';

// ─── Types ───────────────────────────────────────────────────────────────────

type DropdownOption = { label: string; value: string };

type FormState = {
  RelationId: string;
  RegisterDate: string;
  LeadTypeId: string;
  FkAccountId: string;
  CompanyName: string;
  ContactPerson: string;
  MobileNumber: string;
  Email: string;
  cr0030List: string[];   // Products  — multi-select
  cr0040List: string[];   // Lead Source — multi-select
  ExpectedBudget: string;
  Requirements: string;
};

type StringFormKey = Exclude<keyof FormState, 'cr0030List' | 'cr0040List'>;

type FormErrors = Partial<Record<keyof FormState, string>>;

type SingleDropdownKey = 'LeadTypeId' | 'FkAccountId';
type MultiDropdownKey  = 'cr0030List' | 'cr0040List';
type DropdownKey = SingleDropdownKey | MultiDropdownKey;

// ─── Static lookup data ───────────────────────────────────────────────────────

const INITIAL_FORM: FormState = {
  RelationId: '',
  RegisterDate: new Date().toISOString().split('T')[0],
  LeadTypeId: '',
  FkAccountId: '',
  CompanyName: '',
  ContactPerson: '',
  MobileNumber: '',
  Email: '',
  cr0030List: [],
  cr0040List: [],
  ExpectedBudget: '',
  Requirements: '',
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

const LeadOrDealCrudScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const statusId = Number(route?.params?.StatusId ?? 1);
  const searchid = route?.params?.searchid ? Number(route.params.searchid) : null;

  const screenTitle = statusId === 2 ? 'Deal' : 'Lead';

  const [form, setForm] = useState<FormState>({
    ...INITIAL_FORM,
    RelationId: searchid ? String(searchid) : '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  // single-select modal
  const [activeDropdown, setActiveDropdown] = useState<SingleDropdownKey | null>(null);

  // multi-select modal
  const [activeMultiDropdown, setActiveMultiDropdown] = useState<MultiDropdownKey | null>(null);
  const [pendingSelection, setPendingSelection] = useState<string[]>([]);

  // save split-button menu
  const [showSaveMenu, setShowSaveMenu] = useState(false);

  // API submission state
  const [isSaving, setIsSaving] = useState(false);

  const [leadTypeOptions, setLeadTypeOptions] = useState<DropdownOption[]>([]);
  const [accountOptions, setAccountOptions] = useState<DropdownOption[]>([]);
  const [productOptions, setProductOptions] = useState<DropdownOption[]>([]);
  const [leadSourceOptions, setLeadSourceOptions] = useState<DropdownOption[]>([]);

  // ── Load LO_Mode lookup data ──────────────────────────────────────────────

  useEffect(() => {
    const loadLookupData = async () => {
      try {
        const data = await UserStorage.getCrmLoModeData();
        if (!data) { return; }

        // Item1 → Lead Type  { FieldId, FieldValue }
        if (Array.isArray(data.Item1)) {
          setLeadTypeOptions(
            (data.Item1 as any[]).map((i) => ({
              label: String(i.FieldValue ?? ''),
              value: String(i.FieldId ?? ''),
            })),
          );
        }

        // Item3 → Products  { ProductId, ProductName }
        if (Array.isArray(data.Item3)) {
          setProductOptions(
            (data.Item3 as any[]).map((i) => ({
              label: i.ProductName ?? String(i.ProductId ?? ''),
              value: String(i.ProductId ?? ''),
            })),
          );
        }

        // Item4 → Lead Source  { LeadSourceId, LeadSourceName }
        if (Array.isArray(data.Item4)) {
          setLeadSourceOptions(
            (data.Item4 as any[]).map((i) => ({
              label: i.LeadSourceName ?? String(i.LeadSourceId ?? ''),
              value: String(i.LeadSourceId ?? ''),
            })),
          );
        }

        // Item5 → Accounts  { AccountId, AccountName }
        if (Array.isArray(data.Item5)) {
          setAccountOptions(
            (data.Item5 as any[]).map((i) => ({
              label: i.AccountName ?? String(i.AccountId ?? ''),
              value: String(i.AccountId ?? ''),
            })),
          );
        }
      } catch (e) {
        console.error('LeadOrDealCrudScreen: failed to load lookup data', e);
      }
    };

    loadLookupData();
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const setField = <K extends StringFormKey>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const optionsForKey = (key: DropdownKey): DropdownOption[] => {
    switch (key) {
      case 'LeadTypeId':  return leadTypeOptions;
      case 'FkAccountId': return accountOptions;
      case 'cr0030List':  return productOptions;
      case 'cr0040List':  return leadSourceOptions;
    }
  };

  // single-select label
  const labelForKey = (key: SingleDropdownKey): string => {
    const opts = optionsForKey(key);
    return opts.find((o) => o.value === form[key])?.label ?? '';
  };

  const placeholderForKey = (key: DropdownKey): string => {
    switch (key) {
      case 'LeadTypeId':  return 'Select lead type';
      case 'FkAccountId': return 'Select account';
      case 'cr0030List':  return 'Select products';
      case 'cr0040List':  return 'Select lead sources';
    }
  };

  const titleForKey = (key: DropdownKey): string => {
    switch (key) {
      case 'LeadTypeId':  return 'Lead Type';
      case 'FkAccountId': return 'Account';
      case 'cr0030List':  return 'Products';
      case 'cr0040List':  return 'Lead Source';
    }
  };

  // open multi-select modal — pre-fill pending with current saved selection
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

    if (!form.CompanyName.trim()) {
      next.CompanyName = 'Company Name is required.';
    }
    if (!form.ContactPerson.trim()) {
      next.ContactPerson = 'Contact Person is required.';
    }
    if (!form.MobileNumber.trim()) {
      next.MobileNumber = 'Mobile Number is required.';
    } else if (!/^\d{7,15}$/.test(form.MobileNumber.trim())) {
      next.MobileNumber = 'Enter a valid mobile number (7–15 digits).';
    }
    if (form.Email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.Email.trim())) {
      next.Email = 'Enter a valid email address.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── Action handlers ───────────────────────────────────────────────────────

  const submitForm = async (andContinue: boolean) => {
    if (!validate()) { return; }
    if (isSaving) { return; }

    try {
      setIsSaving(true);

      const token    = await UserStorage.getToken();
      const userData = await UserStorage.getUserData();

      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please login again.');
        return;
      }

      const compid = String(userData?.CompId  ?? '0');
      const userId = String(userData?.UserId  ?? '0');

      const requestBody = {
        Mode:           'I',
        Compid:         compid,
        LanguageId:     '1',
        UserId:         userId,
        RelationId:     form.RelationId      || '0',
        RegisterDate:   form.RegisterDate,
        LeadTypeId:     form.LeadTypeId      || '0',
        FkAccountId:    form.FkAccountId     || '0',
        CompanyName:    form.CompanyName,
        ContactPerson:  form.ContactPerson,
        MobileNumber:   form.MobileNumber,
        Email:          form.Email,
        Requirements:   form.Requirements,
        ExpectedBudget: form.ExpectedBudget  || '0',
        Status:         '1',
        AccountName:    form.CompanyName,
        IsAccount:      form.FkAccountId ? '1' : '0',
        LeadStatus:     '0',
        DealStatus:     '0',
        cr0030List:     form.cr0030List.join(','),
        cr0040List:     form.cr0040List.join(','),
      };

      const apiUrl = getApiUrl('/api/cr5010/I_U_D_Mode');
      const response = await axios.post<{ IsSuccess: string; RelationId: number }[]>(
        apiUrl,
        requestBody,
        {
          headers: {
            ...API_CONFIG.DEFAULT_HEADERS,
            Authorization: `Bearer ${token}`,
          },
          timeout: API_CONFIG.TIMEOUT,
        },
      );

      const result = Array.isArray(response.data) ? response.data[0] : null;

      if (result?.IsSuccess === 'True') {
        if (andContinue) {
          Alert.alert('Saved', `Record saved successfully. (ID: ${result.RelationId})`);
          setForm(INITIAL_FORM);
          setErrors({});
        } else {
          navigation.goBack();
        }
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

  const handleSave            = () => submitForm(false);
  const handleSaveAndContinue = () => submitForm(true);

  const handleClear = () => {
    setForm(INITIAL_FORM);
    setErrors({});
  };

  const handleDelete = () => {
    Alert.alert(
      `Delete ${screenTitle}`,
      `Are you sure you want to delete this ${screenTitle.toLowerCase()}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log('Delete deal confirmed — RelationId:', form.RelationId);
            navigation.goBack();
          },
        },
      ],
    );
  };

  const handleDateChange = (event: any, selected?: Date) => {
    setShowDatePicker(false);
    if (event?.type === 'set' && selected) {
      setField('RegisterDate', selected.toISOString().split('T')[0]);
    }
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

            {/* Done button */}
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
          <Text style={styles.pageTitle}>{screenTitle.toUpperCase()}</Text>
        </View>
        <View style={styles.topBarRight} />
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

            {/* Relation Track No */}
            <InputField label="Relation Track No" error={errors.RelationId}>
              <TextInput
                style={styles.textInput}
                value={form.RelationId}
                onChangeText={(v) => setField('RelationId', v)}
                placeholder="Enter relation track no"
                placeholderTextColor="#b0bec5"
              />
            </InputField>

            {/* Register Date */}
            <InputField label="Register Date" error={errors.RegisterDate}>
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={form.RegisterDate ? styles.dateValue : styles.datePlaceholder}>
                  {form.RegisterDate || 'Select date'}
                </Text>
                <Text style={styles.calendarIcon}>📅</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={form.RegisterDate ? new Date(form.RegisterDate) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                />
              )}
            </InputField>

            {/* Lead Type */}
            <InputField label="Lead Type" error={errors.LeadTypeId}>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setActiveDropdown('LeadTypeId')}
                activeOpacity={0.7}
              >
                <Text style={form.LeadTypeId ? styles.dropdownValue : styles.dropdownPlaceholder}>
                  {labelForKey('LeadTypeId') || placeholderForKey('LeadTypeId')}
                </Text>
                <Text style={styles.dropdownChevron}>▼</Text>
              </TouchableOpacity>
            </InputField>

            {/* Accounts */}
            <InputField label="Accounts" error={errors.FkAccountId}>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setActiveDropdown('FkAccountId')}
                activeOpacity={0.7}
              >
                <Text style={form.FkAccountId ? styles.dropdownValue : styles.dropdownPlaceholder}>
                  {labelForKey('FkAccountId') || placeholderForKey('FkAccountId')}
                </Text>
                <Text style={styles.dropdownChevron}>▼</Text>
              </TouchableOpacity>
            </InputField>

            {/* Company Name */}
            <InputField label="Company Name" required error={errors.CompanyName}>
              <TextInput
                style={[styles.textInput, errors.CompanyName ? styles.inputErrorBorder : null]}
                value={form.CompanyName}
                onChangeText={(v) => setField('CompanyName', v)}
                placeholder="Enter company name"
                placeholderTextColor="#b0bec5"
              />
            </InputField>

            {/* Contact Person */}
            <InputField label="Contact Person" required error={errors.ContactPerson}>
              <TextInput
                style={[styles.textInput, errors.ContactPerson ? styles.inputErrorBorder : null]}
                value={form.ContactPerson}
                onChangeText={(v) => setField('ContactPerson', v)}
                placeholder="Enter contact person"
                placeholderTextColor="#b0bec5"
              />
            </InputField>

            {/* Mobile Number */}
            <InputField label="Mobile Number" required error={errors.MobileNumber}>
              <TextInput
                style={[styles.textInput, errors.MobileNumber ? styles.inputErrorBorder : null]}
                value={form.MobileNumber}
                onChangeText={(v) => setField('MobileNumber', v)}
                placeholder="Enter mobile number"
                placeholderTextColor="#b0bec5"
                keyboardType="phone-pad"
                maxLength={15}
              />
            </InputField>

            {/* Email */}
            <InputField label="Email" error={errors.Email}>
              <TextInput
                style={[styles.textInput, errors.Email ? styles.inputErrorBorder : null]}
                value={form.Email}
                onChangeText={(v) => setField('Email', v)}
                placeholder="Enter email address"
                placeholderTextColor="#b0bec5"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </InputField>

            {/* Products — multi-select */}
            <InputField label="Products" error={errors.cr0030List}>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => openMultiDropdown('cr0030List')}
                activeOpacity={0.7}
              >
                {form.cr0030List.length === 0 ? (
                  <Text style={[styles.dropdownPlaceholder, styles.flex1]}>
                    {placeholderForKey('cr0030List')}
                  </Text>
                ) : (
                  <View style={styles.tagRow}>
                    {form.cr0030List.map((v) => {
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

            {/* Lead Source — multi-select */}
            <InputField label="Lead Source" error={errors.cr0040List}>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => openMultiDropdown('cr0040List')}
                activeOpacity={0.7}
              >
                {form.cr0040List.length === 0 ? (
                  <Text style={[styles.dropdownPlaceholder, styles.flex1]}>
                    {placeholderForKey('cr0040List')}
                  </Text>
                ) : (
                  <View style={styles.tagRow}>
                    {form.cr0040List.map((v) => {
                      const lbl = leadSourceOptions.find((o) => o.value === v)?.label ?? v;
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

            {/* Expected Budget */}
            <InputField label="Expected Budget" error={errors.ExpectedBudget}>
              <TextInput
                style={styles.textInput}
                value={form.ExpectedBudget}
                onChangeText={(v) => setField('ExpectedBudget', v)}
                placeholder="Enter expected budget"
                placeholderTextColor="#b0bec5"
                keyboardType="numeric"
              />
            </InputField>

            {/* Requirements */}
            <InputField label="Requirements" error={errors.Requirements}>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={form.Requirements}
                onChangeText={(v) => setField('Requirements', v)}
                placeholder="Enter requirements"
                placeholderTextColor="#b0bec5"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </InputField>

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
              style={[styles.footerBtn, styles.btnDelete, isSaving && styles.btnDisabled]}
              onPress={handleDelete}
              activeOpacity={0.8}
              disabled={isSaving}
            >
              <Text style={styles.footerBtnText}>Delete</Text>
            </TouchableOpacity>
            {/* Save — split button */}
            <View style={[styles.footerBtn, styles.btnSave, styles.splitWrapper, isSaving && styles.btnDisabled]}>
              <TouchableOpacity
                style={styles.splitMain}
                onPress={handleSave}
                activeOpacity={0.8}
                disabled={isSaving}
              >
                {isSaving
                  ? <ActivityIndicator size="small" color="#ffffff" />
                  : <Text style={styles.footerBtnText}>Save</Text>
                }
              </TouchableOpacity>
              <View style={styles.splitDivider} />
              <TouchableOpacity
                style={styles.splitArrow}
                onPress={() => setShowSaveMenu(true)}
                activeOpacity={0.7}
                disabled={isSaving}
              >
                <Text style={styles.splitArrowText}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Single-select modal ── */}
      {renderDropdownModal()}

      {/* ── Multi-select modal ── */}
      {renderMultiDropdownModal()}

      {/* ── Save split-button menu ── */}
      <Modal
        transparent
        animationType="fade"
        visible={showSaveMenu}
        onRequestClose={() => setShowSaveMenu(false)}
      >
        <TouchableOpacity
          style={styles.saveMenuOverlay}
          activeOpacity={1}
          onPress={() => setShowSaveMenu(false)}
        >
          <View style={styles.saveMenuPopover}>
            <Text style={styles.saveMenuHeader}>Save Options</Text>
            <TouchableOpacity
              style={styles.saveMenuItem}
              activeOpacity={0.7}
              onPress={() => {
                setShowSaveMenu(false);
                handleSaveAndContinue();
              }}
            >
              <Text style={styles.saveMenuItemIcon}>↩</Text>
              <Text style={styles.saveMenuItemText}>Save and Continue</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  flex: {
    flex: 1,
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
  topBarRight: {
    width: 50,
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
  textArea: {
    height: 110,
    textAlignVertical: 'top',
  },

  /* Date picker button */
  datePickerBtn: {
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
  dateValue: {
    fontSize: 14,
    color: '#111827',
  },
  datePlaceholder: {
    fontSize: 14,
    color: '#b0bec5',
  },
  calendarIcon: {
    fontSize: 16,
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
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
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
  btnDelete: {
    backgroundColor: '#e53935',
  },
  btnSave: {
    backgroundColor: '#2e7d32',
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
    color: '#1a1a1a',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* Save split button */
  splitWrapper: {
    flexDirection: 'row',
    paddingVertical: 0,
    paddingHorizontal: 0,
    overflow: 'hidden',
  },
  splitMain: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginVertical: 8,
  },
  splitArrow: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitArrowText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Save menu popover */
  saveMenuOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingBottom: 90,
    paddingHorizontal: 16,
  },
  saveMenuPopover: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 10,
  },
  saveMenuHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9e9e9e',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  saveMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 10,
  },
  saveMenuItemIcon: {
    fontSize: 16,
    color: '#2e7d32',
  },
  saveMenuItemText: {
    fontSize: 15,
    color: '#2e7d32',
    fontWeight: '600',
  },
});

export default LeadOrDealCrudScreen;
