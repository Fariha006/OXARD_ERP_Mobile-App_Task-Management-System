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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_CONFIG, getApiUrl } from '../../config/apiConfig';
import UserStorage from '../../utils/userStorage';

// ─── Types ───────────────────────────────────────────────────────────────────

type DropdownOption = { label: string; value: string; color?: string };

type RawProduct    = { ProductId: number; ProductCode: string; ProductName: string };
type RawLeadSource = { LeadSourceId: number; LeadSourceCode: string; LeadSourceName: string };

type FormState = {
  RelationId: string;
  RelationTrackNo: string;
  RegisterDate: string;
  LeadTypeId: string;
  FkAccountId: string;
  CompanyName: string;
  ContactPerson: string;
  MobileNumber: string;
  Email: string;
  cr0030List: string[];   // Products  — multi-select
  cr0040List: string[];   // Lead Source — multi-select
  FkEmpIdSalesPerson: string;
  WinningPer: string;
  ExpectedBudget: string;
  Requirements: string;
  StatusId: string;
};

type StringFormKey = Exclude<keyof FormState, 'cr0030List' | 'cr0040List'>;

type FormErrors = Partial<Record<keyof FormState, string>>;

type SingleDropdownKey = 'LeadTypeId' | 'FkAccountId' | 'StatusId' | 'FkEmpIdSalesPerson';
type MultiDropdownKey  = 'cr0030List' | 'cr0040List';
type DropdownKey = SingleDropdownKey | MultiDropdownKey;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const formatDateDMY = (d: Date): string => {
  const dd  = String(d.getDate()).padStart(2, '0');
  const mmm = MONTH_ABBR[d.getMonth()];
  const yyyy = d.getFullYear();
  return `${dd}-${mmm}-${yyyy}`;
};

const parseDateDMY = (s: string): Date => {
  const [dd, mmm, yyyy] = s.split('-');
  const monthIdx = MONTH_ABBR.findIndex(m => m.toLowerCase() === mmm.toLowerCase());
  return new Date(Number(yyyy), monthIdx, Number(dd));
};

// ─── Static lookup data ───────────────────────────────────────────────────────

const INITIAL_FORM: FormState = {
  RelationId: '',
  RelationTrackNo: '',
  RegisterDate: formatDateDMY(new Date()),
  LeadTypeId: '',
  FkAccountId: '',
  CompanyName: '',
  ContactPerson: '',
  MobileNumber: '',
  Email: '',
  cr0030List: [],
  cr0040List: [],
  FkEmpIdSalesPerson: '',
  WinningPer: '',
  ExpectedBudget: '',
  Requirements: '',
  StatusId: '',
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
  const searchid = route?.params?.RelationId ? Number(route.params.RelationId) : null;

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

  // top-bar kebab side panel
  const [showKebabPanel, setShowKebabPanel] = useState(false);


  // bottom tab strip
  const [activeTab, setActiveTab] = useState<string>('company');
  const tabItems = [
    { key: 'company',  icon: 'home-variant',              label: 'Company',  color: '#133F7C' },
    { key: 'contact',  icon: 'account',                   label: 'Contact',  color: '#811458' },
    { key: 'activity', icon: 'note-text-outline',         label: 'Notes',    color: '#f59e0b' },
    { key: 'email',    icon: 'file-document-outline',     label: 'Documents',color: '#10b981' },
    { key: 'docs',     icon: 'checkbox-marked-outline',   label: 'Tasks',    color: '#3b82f6' },
    { key: 'wishlist', icon: 'calendar-check',            label: 'Meetings', color: '#ef4444' },
    { key: 'rating',   icon: 'phone-outline',             label: 'Calls',    color: '#8b5cf6' },
    { key: 'settings', icon: 'timeline-clock-outline',    label: 'Timeline', color: '#6b7280' },
  ];

  // API submission state
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingRecord, setIsLoadingRecord] = useState(false);

  // tracks the persisted RelationId; tabs are enabled only when > 0
  const [savedRelationId, setSavedRelationId] = useState<number>(searchid ?? 0);

  const [leadTypeOptions, setLeadTypeOptions] = useState<DropdownOption[]>([]);
  const [accountOptions, setAccountOptions] = useState<DropdownOption[]>([]);
  const [productOptions, setProductOptions] = useState<DropdownOption[]>([]);
  const [rawProductData, setRawProductData] = useState<RawProduct[]>([]);
  const [leadSourceOptions, setLeadSourceOptions] = useState<DropdownOption[]>([]);
  const [rawLeadSourceData, setRawLeadSourceData] = useState<RawLeadSource[]>([]);
  const [defaultLeadStatusId, setDefaultLeadStatusId] = useState<string>('0');
  const [defaultDealStatusId, setDefaultDealStatusId] = useState<string>('0');
  const [leadStatusOptions, setLeadStatusOptions] = useState<DropdownOption[]>([]);
  const [dealStatusOptions, setDealStatusOptions] = useState<DropdownOption[]>([]);
  const [salesPersonOptions, setSalesPersonOptions] = useState<DropdownOption[]>([]);

  // ── Load LO_Mode lookup data ──────────────────────────────────────────────

  useEffect(() => {
    const loadLookupData = async () => {
      try {
        const data = await UserStorage.getCrmLoModeData();
        if (!data) { return; }

        // Item1 → Lead Type  { FieldId, FieldValue }
        if (Array.isArray(data.Item1)) {
          const opts = (data.Item1 as any[]).map((i) => ({
            label: String(i.FieldValue ?? ''),
            value: String(i.FieldId ?? ''),
          }));
          setLeadTypeOptions(opts);
          if (!searchid && opts.length > 0) {
            setForm((prev) => ({ ...prev, LeadTypeId: opts[0].value }));
          }
        }

        // Item3 → Products  { ProductId, ProductCode, ProductName }
        if (Array.isArray(data.Item3)) {
          const items = data.Item3 as any[];
          setRawProductData(
            items.map((i) => ({
              ProductId:   Number(i.ProductId ?? 0),
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

        // Item4 → Lead Source  { LeadSourceId, LeadSourceCode, LeadSourceName }
        if (Array.isArray(data.Item4)) {
          const items = data.Item4 as any[];
          setRawLeadSourceData(
            items.map((i) => ({
              LeadSourceId:   Number(i.LeadSourceId ?? 0),
              LeadSourceCode: String(i.LeadSourceCode ?? ''),
              LeadSourceName: String(i.LeadSourceName ?? ''),
            })),
          );
          setLeadSourceOptions(
            items.map((i) => ({
              label: i.LeadSourceName ?? String(i.LeadSourceId ?? ''),
              value: String(i.LeadSourceId ?? ''),
            })),
          );
        }

        // Rest.Item4 → Sales Person (Assigned To) { EmpId, EmployeeName }
        const restItem4 = (data.Rest as any)?.Item4;
        if (Array.isArray(restItem4)) {
          const seen = new Set<string>();
          const unique: DropdownOption[] = [];
          for (const i of restItem4) {
            const empId = i.EmpId;
            if (empId == null || empId === '') { continue; }
            const value = String(empId);
            if (!seen.has(value)) {
              seen.add(value);
              unique.push({
                label: String(i.EmployeeName ?? ''),
                value,
              });
            }
          }
          setSalesPersonOptions(unique);

          // In create mode, default sales person to current user
          if (!searchid) {
            const userData = await UserStorage.getUserData();
            const empId = String(userData?.EmpId ?? '');
            if (empId && unique.some((o) => o.value === empId)) {
              setForm((prev) => ({ ...prev, FkEmpIdSalesPerson: empId }));
            }
          }
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

        // Rest.Item7 → Lead Status options  { id, text, color }
        const restItem7 = (data.Rest as any)?.Item7;
        if (Array.isArray(restItem7) && restItem7.length > 0) {
          const opts = restItem7.map((i: any) => ({
            label: String(i.text ?? ''),
            value: String(i.id ?? ''),
            color: i.color ? String(i.color) : undefined,
          }));
          setLeadStatusOptions(opts);
          const firstId = String((restItem7[0] as any).id ?? '0');
          setDefaultLeadStatusId(firstId);
          if (statusId !== 2) {
            setForm((prev) => ({ ...prev, StatusId: firstId }));
          }
        }

        // Rest.Rest.Item1 → Deal Status options  { id, text, color }
        const restRestItem1 = (data.Rest as any)?.Rest?.Item1;
        if (Array.isArray(restRestItem1) && restRestItem1.length > 0) {
          const opts = restRestItem1.map((i: any) => ({
            label: String(i.text ?? ''),
            value: String(i.id ?? ''),
            color: i.color ? String(i.color) : undefined,
          }));
          setDealStatusOptions(opts);
          const firstId = String((restRestItem1[0] as any).id ?? '0');
          setDefaultDealStatusId(firstId);
          if (statusId === 2) {
            setForm((prev) => ({ ...prev, StatusId: firstId }));
          }
        }
      } catch (e) {
        console.error('LeadOrDealCrudScreen: failed to load lookup data', e);
      }
    };

    loadLookupData();
  }, []);

  // ── Load existing record when RelationId > 0 ─────────────────────────────

  useEffect(() => {
    if (!searchid || searchid <= 0) { return; }

    const loadRecord = async () => {
      try {
        setIsLoadingRecord(true);

        const token    = await UserStorage.getToken();
        const userData = await UserStorage.getUserData();

        if (!token) { return; }

        const requestBody = {
          RelationId: String(searchid),
          Compid:     userData?.CompId  ?? 0,
          UserId:     userData?.UserId  ?? 0,
          LanguageId: 1,
          Status:     statusId,
        };

        const apiUrl   = getApiUrl('/api/cr5010/SE_Mode');
        const response = await axios.post<any>(apiUrl, requestBody, {
          headers: {
            ...API_CONFIG.DEFAULT_HEADERS,
            Authorization: `Bearer ${token}`,
          },
          timeout: API_CONFIG.TIMEOUT,
        });

        const res = response.data;

        // Item1[0] → header fields
        const rec = Array.isArray(res?.Item1) && res.Item1.length > 0 ? res.Item1[0] : null;
        if (rec) {
          setForm((prev) => ({
            ...prev,
            RelationId:      String(rec.RelationId      ?? prev.RelationId),
            RelationTrackNo: String(rec.RelationTrackNo ?? ''),
            RegisterDate:    rec.RegisterDate
              ? formatDateDMY(new Date(rec.RegisterDate))
              : prev.RegisterDate,
            LeadTypeId:      String(rec.LeadTypeId    ?? ''),
            FkAccountId:     String(rec.FkAccountId   ?? ''),
            CompanyName:     String(rec.CompanyName    ?? ''),
            ContactPerson:   String(rec.ContactPerson  ?? ''),
            MobileNumber:    String(rec.MobileNumber   ?? ''),
            Email:           String(rec.Email          ?? ''),
            FkEmpIdSalesPerson: rec.FkEmpIdSalesPerson != null ? String(rec.FkEmpIdSalesPerson) : '',
            WinningPer:      rec.WinningPer != null ? String(rec.WinningPer) : '',
            ExpectedBudget:  rec.ExpectedBudget != null ? String(rec.ExpectedBudget) : '',
            Requirements:    String(rec.Requirements   ?? ''),
          }));
          if (rec.RelationId > 0) {
            setSavedRelationId(Number(rec.RelationId));
          }
        }

        // Item2 → Products (cr0030List)
        if (Array.isArray(res?.Item2)) {
          setForm((prev) => ({
            ...prev,
            cr0030List: (res.Item2 as any[]).map((p) => String(p.ProductId ?? '')),
          }));
        }

        // Item3 → Lead Source (cr0040List)
        if (Array.isArray(res?.Item3)) {
          setForm((prev) => ({
            ...prev,
            cr0040List: (res.Item3 as any[]).map((s) => String(s.LeadSourceId ?? '')),
          }));
        }

        // Item7[0] → Status
        if (Array.isArray(res?.Item7) && res.Item7.length > 0) {
          setForm((prev) => ({
            ...prev,
            StatusId: String((res.Item7[0] as any).id ?? ''),
          }));
        }
      } catch (e) {
        console.error('LeadOrDealCrudScreen: failed to load record', e);
      } finally {
        setIsLoadingRecord(false);
      }
    };

    loadRecord();
  }, [searchid]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const setField = <K extends StringFormKey>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleStatusChange = (newValue: string, label: string) => {
    setActiveDropdown(null);
    Alert.alert(
      'Change Status',
      `Do you want to change status to "${label}"?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              const token    = await UserStorage.getToken();
              const userData = await UserStorage.getUserData();
              const compid   = String(userData?.CompId ?? '0');
              const userId   = String(userData?.UserId ?? '0');

              const apiUrl = getApiUrl('/api/cr5010/Status_Mode');
              const response = await axios.post<{ ReplyStatus: string }[]>(
                apiUrl,
                {
                  Compid:     compid,
                  LanguageId: '1',
                  UserId:     userId,
                  RelationId: form.RelationId,
                  Status:     newValue,
                },
                {
                  headers: {
                    ...API_CONFIG.DEFAULT_HEADERS,
                    Authorization: `Bearer ${token}`,
                  },
                  timeout: API_CONFIG.TIMEOUT,
                },
              );

              const result = Array.isArray(response.data) ? response.data[0] : null;
              if (result?.ReplyStatus === 'Success') {
                setField('StatusId', newValue);
              } else {
                Alert.alert('Error', 'Failed to update status. Please try again.');
              }
            } catch (error: any) {
              const message = error?.response?.data?.message
                ?? error?.message
                ?? 'Failed to update status.';
              Alert.alert('Error', message);
            }
          },
        },
      ],
    );
  };

  const optionsForKey = (key: DropdownKey): DropdownOption[] => {
    switch (key) {
      case 'LeadTypeId':  return leadTypeOptions;
      case 'FkAccountId': return accountOptions;
      case 'FkEmpIdSalesPerson': return salesPersonOptions;
      case 'cr0030List':  return productOptions;
      case 'cr0040List':  return leadSourceOptions;
      case 'StatusId':    return statusId === 2 ? dealStatusOptions : leadStatusOptions;
    }
  };

  // single-select label
  const labelForKey = (key: SingleDropdownKey): string => {
    const opts = optionsForKey(key);
    return opts.find((o) => o.value === form[key])?.label ?? '';
  };

  const colorForKey = (key: SingleDropdownKey): string | undefined =>
    optionsForKey(key).find((o) => o.value === form[key])?.color;

  const placeholderForKey = (key: DropdownKey): string => {
    switch (key) {
      case 'LeadTypeId':  return 'Select lead type';
      case 'FkAccountId': return 'Select account';
      case 'FkEmpIdSalesPerson': return 'Select sales person';
      case 'cr0030List':  return 'Select products';
      case 'cr0040List':  return 'Select lead sources';
      case 'StatusId':    return 'Select status';
    }
  };

  const titleForKey = (key: DropdownKey): string => {
    switch (key) {
      case 'LeadTypeId':  return 'Lead Type';
      case 'FkAccountId': return 'Account';
      case 'FkEmpIdSalesPerson': return 'Sales Person';
      case 'cr0030List':  return 'Products';
      case 'cr0040List':  return 'Lead Source';
      case 'StatusId':    return 'Status';
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
        FkAccountId:    (form.FkAccountId && form.FkAccountId !== '0') ? form.FkAccountId : null,
        CompanyName:    form.CompanyName,
        ContactPerson:  form.ContactPerson,
        MobileNumber:   form.MobileNumber,
        Email:          form.Email,
        Requirements:   form.Requirements,
        FkEmpIdSalesPerson: form.FkEmpIdSalesPerson ? Number(form.FkEmpIdSalesPerson) : null,
        WinningPer:     form.WinningPer      || '0',
        ExpectedBudget: form.ExpectedBudget  || '0',
        Status:         '1',
        AccountName:    form.CompanyName,
        IsAccount:      form.FkAccountId ? '1' : '0',
        LeadStatus:     statusId !== 2 ? (form.StatusId || defaultLeadStatusId) : defaultLeadStatusId,
        DealStatus:     statusId === 2 ? (form.StatusId || defaultDealStatusId) : defaultDealStatusId,
        cr0030List:     form.cr0030List.map((id) => {
          const p = rawProductData.find((r) => String(r.ProductId) === id);
          return {
            ProductId:   p?.ProductId   ?? Number(id),
            ProductCode: p?.ProductCode ?? '',
            ProductName: p?.ProductName ?? '',
          };
        }),
        cr0040List:     form.cr0040List.map((id) => {
          const s = rawLeadSourceData.find((r) => String(r.LeadSourceId) === id);
          return {
            LeadSourceId:   s?.LeadSourceId   ?? Number(id),
            LeadSourceCode: s?.LeadSourceCode ?? '',
            LeadSourceName: s?.LeadSourceName ?? '',
          };
        }),
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
        if (result.RelationId > 0) {
          setSavedRelationId(result.RelationId);
          setField('RelationId', String(result.RelationId));
        }
        if (andContinue) {
          Alert.alert('Saved', `Record saved successfully. (ID: ${result.RelationId})`);
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
      setField('RegisterDate', formatDateDMY(selected));
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
                        if (activeDropdown === 'StatusId') {
                          handleStatusChange(item.value, item.label);
                        } else {
                          setField(activeDropdown, item.value);
                          setActiveDropdown(null);
                        }
                      }}
                    >
                      {item.color && (
                        <View style={[styles.statusDot, { backgroundColor: item.color }]} />
                      )}
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
          <Text style={styles.pageTitle}>{screenTitle.toUpperCase()}</Text>
        </View>
        <TouchableOpacity
          style={styles.kebabBtn}
          onPress={() => setShowKebabPanel(true)}
          activeOpacity={0.7}
        >
          <Icon name="dots-vertical" size={26} color="#811458" />
        </TouchableOpacity>
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

            {/* Relation Track No + Status — shown only for existing records */}
            {Number(form.RelationId) > 0 && (
              <View style={styles.rowTwo}>
                <View style={styles.rowTwoItem}>
                  <InputField label="Relation Track No">
                    <View style={styles.readonlyField}>
                      <Text style={styles.readonlyValue}>
                        {form.RelationTrackNo || '-'}
                      </Text>
                    </View>
                  </InputField>
                </View>
                <View style={styles.rowTwoItem}>
                  <InputField label="Status" error={errors.StatusId}>
                    <TouchableOpacity
                      style={styles.dropdownBtn}
                      onPress={() => setActiveDropdown('StatusId')}
                      activeOpacity={0.7}
                    >
                      <View style={styles.statusBtnInner}>
                        {colorForKey('StatusId') && (
                          <View style={[styles.statusDot, { backgroundColor: colorForKey('StatusId') }]} />
                        )}
                        <Text style={form.StatusId ? styles.dropdownValue : styles.dropdownPlaceholder}>
                          {labelForKey('StatusId') || placeholderForKey('StatusId')}
                        </Text>
                      </View>
                      <Text style={styles.dropdownChevron}>▼</Text>
                    </TouchableOpacity>
                  </InputField>
                </View>
              </View>
            )}

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
                  value={form.RegisterDate ? parseDateDMY(form.RegisterDate) : new Date()}
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

            {/* Sales Person */}
            <InputField label="Sales Person" error={errors.FkEmpIdSalesPerson}>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setActiveDropdown('FkEmpIdSalesPerson')}
                activeOpacity={0.7}
              >
                <Text style={form.FkEmpIdSalesPerson ? styles.dropdownValue : styles.dropdownPlaceholder}>
                  {labelForKey('FkEmpIdSalesPerson') || 'Select sales person'}
                </Text>
                <Text style={styles.dropdownChevron}>▼</Text>
              </TouchableOpacity>
            </InputField>

            {/* Winning Percentage */}
            <InputField label="Winning %" error={errors.WinningPer}>
              <TextInput
                style={styles.textInput}
                value={form.WinningPer}
                onChangeText={(v) => setField('WinningPer', v)}
                placeholder="Enter winning percentage"
                placeholderTextColor="#b0bec5"
                keyboardType="numeric"
              />
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

      {/* ── Kebab side panel ── */}
      <Modal
        transparent
        animationType="fade"
        visible={showKebabPanel}
        onRequestClose={() => setShowKebabPanel(false)}
      >
        <TouchableOpacity
          style={styles.kebabOverlay}
          activeOpacity={1}
          onPress={() => setShowKebabPanel(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.kebabPanel}>
            {/* icon grid */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.kebabGrid}>
              {tabItems.map((tab) => {
                const active = activeTab === tab.key;
                const tabDisabled = savedRelationId <= 0;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={styles.kebabGridItem}
                    activeOpacity={tabDisabled ? 1 : 0.7}
                    disabled={tabDisabled}
                    onPress={() => {
                      setShowKebabPanel(false);
                      if (tab.key === 'company') {
                        navigation.navigate('companycrud', {
                          RelationId: savedRelationId,
                          pagetype:   statusId,
                        });
                      } else if (tab.key === 'contact') {
                        navigation.navigate('crncontactlist', {
                          RelationId: savedRelationId,
                          FullMode:   1,
                          FkAccIdContact: form.FkAccountId ?? 0,
                          CompanyName: form.CompanyName ?? '',
                        });
                      } else if (tab.key === 'activity') {
                        navigation.navigate('crmnotelist', {
                          Status: statusId,
                          RelationId: savedRelationId,
                        });
                      } else if (tab.key === 'email') {
                        navigation.navigate('crmdocumentlist', {
                          Status: statusId,
                          RelationId: savedRelationId,
                        });
                      } else if (tab.key === 'docs') {
                        navigation.navigate('crmtasklist', {
                          Status: statusId,
                          RelationId: savedRelationId,
                        });
                      } else if (tab.key === 'wishlist') {
                        navigation.navigate('crmmeetinglist', {
                          Status: statusId,
                          RelationId: savedRelationId,
                        });
                      } else if (tab.key === 'rating') {
                        navigation.navigate('crmcalllist', {
                          Status: statusId,
                          RelationId: savedRelationId,
                        });
                      } else {
                        setActiveTab(tab.key);
                      }
                    }}
                  >
                    <View style={[
                      styles.kebabPanelIcon,
                      { backgroundColor: tabDisabled ? '#555' : tab.color },
                      active && styles.kebabPanelIconActive,
                    ]}>
                      <Icon name={tab.icon} size={22} color="#ffffff" />
                      {active && (
                        <View style={styles.kebabActiveIndicator}>
                          <Icon name="check" size={8} color="#ffffff" />
                        </View>
                      )}
                    </View>
                    <Text style={[
                      styles.kebabPanelItemText,
                      tabDisabled && styles.kebabPanelItemTextDisabled,
                      active && styles.kebabPanelItemTextActive,
                    ]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
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

  /* Two-column row */
  rowTwo: {
    flexDirection: 'row',
    gap: 10,
  },
  rowTwoItem: {
    flex: 1,
  },

  /* Read-only display field */
  readonlyField: {
    borderWidth: 1,
    borderColor: '#DEECFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: '#f4f8ff',
  },
  readonlyValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
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
  kebabBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },

  /* Kebab side panel */
  kebabOverlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  kebabPanel: {
    width: '28%',
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  kebabPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  kebabPanelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#811458',
  },
  kebabGrid: {
    flexDirection: 'column',
    paddingHorizontal: 8,
    paddingBottom: 20,
    gap: 4,
  },
  kebabGridItem: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  kebabPanelIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  kebabPanelIconActive: {
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowOpacity: 0.5,
    elevation: 8,
  },
  kebabActiveIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kebabPanelItemText: {
    fontSize: 10,
    color: '#111827',
    fontWeight: '600',
    textAlign: 'center',
  },
  kebabPanelItemTextActive: {
    color: '#811458',
    fontWeight: '800',
  },
  kebabPanelItemTextDisabled: {
    color: '#c0c0c0',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
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

  /* Bottom tab strip */
  tabStrip: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 5,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 5,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#811458',
    backgroundColor: '#ffffff',
    flexDirection: 'column',
    gap: 2,
  },
  tabItemActive: {
    backgroundColor: '#811458',
    borderColor: '#811458',
  },
  tabLabel: {
    fontSize: 9,
    color: '#ffffff',
    fontWeight: '700',
    textAlign: 'center',
  },
  tabLabelInactive: {
    color: '#811458',
  },
  tabItemDisabled: {
    backgroundColor: '#f0f0f0',
    borderColor: '#d0d0d0',
    opacity: 0.55,
  },
  tabLabelDisabled: {
    color: '#c0c0c0',
  },
});

export default LeadOrDealCrudScreen;
