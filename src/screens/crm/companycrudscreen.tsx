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

// ─── InputField helper ────────────────────────────────────────────────────────

const InputField: React.FC<{ label: string; error?: string; children: React.ReactNode }> = ({
  label, error, children,
}) => (
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

// ─── Main Component ───────────────────────────────────────────────────────────

const CompanyCrudScreen = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();

  const relationId = route?.params?.RelationId ? String(route.params.RelationId) : '';
  const pagetype   = route?.params?.pagetype   ? Number(route.params.pagetype)   : 1;

  const [form, setForm]           = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors]       = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving]   = useState(false);
  const [accountId, setAccountId] = useState<string>('');

  const [industryOptions, setIndustryOptions] = useState<DropdownOption[]>([]);
  const [currencyOptions, setCurrencyOptions]  = useState<DropdownOption[]>([]);
  const [countryOptions, setCountryOptions]    = useState<DropdownOption[]>([]);
  const [activeDropdown, setActiveDropdown]    = useState<DropdownKey | null>(null);
  const [relationData, setRelationData]          = useState<any>(null);

  // ── Load lookup data from local storage ────────────────────────────────────

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const data = await UserStorage.getCrmLoModeData();
        if (!data) { return; }

        // Industry → secondlevel Item2 = data.Rest.Item2
        const restItem2 = (data.Rest as any)?.Item2;
        if (Array.isArray(restItem2)) {
          setIndustryOptions(
            (restItem2 as any[]).map((i) => ({
              label: String(i.IndustryName ?? i.FieldValue ?? i.text  ?? ''),
              value: String(i.IndustryId   ?? i.FieldId   ?? i.id    ?? ''),
            })),
          );
        }

        // Currency → top-level Item2
        if (Array.isArray(data.Item2)) {
          setCurrencyOptions(
            (data.Item2 as any[]).map((i) => ({
              label: String(i.CurrNam   ?? i.FieldValue ?? i.text ?? ''),
              value: String(i.CurrId    ?? i.FieldId   ?? i.id   ?? ''),
            })),
          );
        }

        // Country → top-level Item6
        if (Array.isArray(data.Item6)) {
          setCountryOptions(
            (data.Item6 as any[]).map((i) => ({
              label: String(i.CntryNam   ?? i.CntryName  ?? i.CountryName ?? i.FieldValue ?? i.text ?? ''),
              value: String(i.CntryId    ?? i.CountryId  ?? i.FieldId    ?? i.id          ?? ''),
            })),
          );
        }
      } catch (e) {
        console.error('CompanyCrudScreen: failed to load lookup data', e);
      }
    };
    loadLookups();
  }, []);

  // ── Load SE_Mode data ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!relationId) { return; }
    const loadData = async () => {
      try {
        setIsLoading(true);
        const token    = await UserStorage.getToken();
        const userData = await UserStorage.getUserData();
        const compid   = String(userData?.CompId  ?? '0');
        const userId   = String(userData?.UserId  ?? '0');

        const apiUrl   = getApiUrl('/api/cr5010/SE_Mode');
        const response = await axios.post<any>(
          apiUrl,
          {
            RelationId: relationId,
            Compid:     compid,
            UserId:     userId,
            LanguageId: 1,
            Status:     pagetype,
          },
          {
            headers: {
              ...API_CONFIG.DEFAULT_HEADERS,
              Authorization: `Bearer ${token}`,
            },
            timeout: API_CONFIG.TIMEOUT,
          },
        );

        const resData = response.data;

        // Item1[0] → relation/lead details
        if (Array.isArray(resData.Item1) && resData.Item1.length > 0) {
          setRelationData(resData.Item1[0]);
        }

        // Item6[0] → account/company details
        if (Array.isArray(resData.Item6) && resData.Item6.length > 0) {
          const acc = resData.Item6[0] as any;
          setAccountId(String(acc.AccountId ?? ''));
          setForm({
            AccountName:    String(acc.AccountName    ?? ''),
            FkIndustryId:   acc.FkIndustryId  != null ? String(acc.FkIndustryId)  : '',
            FkCurrId:       acc.FkCurrId       != null ? String(acc.FkCurrId)       : '',
            ExchRate:       acc.ExchRate       != null ? String(acc.ExchRate)       : '1',
            FkCountryId:      acc.FkCntryId      != null ? String(acc.FkCntryId)      : '',
            State:          String(acc.State           ?? ''),
            City:           String(acc.City            ?? ''),
            Street:         String(acc.Street          ?? ''),
            ZipCode:        String(acc.ZipCode         ?? ''),
            Fax:            String(acc.Fax             ?? ''),
            WebSite:        String(acc.WebSite         ?? ''),
            AddDescription: String(acc.AddDescription  ?? ''),
            NoofEmployees:  acc.NoofEmployees  != null ? String(acc.NoofEmployees)  : '',
            AnnualTurnOver: acc.AnnualTurnOver != null ? String(acc.AnnualTurnOver) : '',
          });
        }
      } catch (error: any) {
        const message = error?.response?.data?.message
          ?? error?.message
          ?? 'Failed to load company data.';
        Alert.alert('Error', message);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [relationId]);

  // ── Helpers ───────────────────────────────────────────────────────────────

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
      case 'FkCountryId':    return countryOptions;
    }
  };

  const labelForKey = (key: DropdownKey): string =>
    optionsForKey(key).find((o) => o.value === form[key])?.label ?? '';

  const placeholderForKey = (key: DropdownKey): string => {
    switch (key) {
      case 'FkIndustryId': return 'Select industry';
      case 'FkCurrId':     return 'Select currency';
      case 'FkCountryId':    return 'Select country';
    }
  };

  const titleForKey = (key: DropdownKey): string => {
    switch (key) {
      case 'FkIndustryId': return 'Industry';
      case 'FkCurrId':     return 'Currency';
      case 'FkCountryId':    return 'Country';
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.AccountName.trim())  { next.AccountName  = 'Company Name is required.'; }
    if (!form.FkIndustryId)        { next.FkIndustryId = 'Industry is required.'; }
    if (!form.FkCurrId)            { next.FkCurrId     = 'Currency is required.'; }
    if (!form.ExchRate.trim())     { next.ExchRate     = 'Exch. Rate is required.'; }
    if (!form.FkCountryId)           { next.FkCountryId   = 'Country is required.'; }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── Save ──────────────────────────────────────────────────────────────────

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
          RelationId:     relationData?.RelationId     ?? relationId,
          RelationTrackNo: relationData?.RelationTrackNo ?? '',
          RegisterDate:   relationData?.RegisterDate   ?? null,
          LeadTypeId:     relationData?.LeadTypeId     ?? null,
          FkAccountId:    relationData?.FkAccountId    ?? null,
          LeadTypeName:   relationData?.LeadTypeName   ?? '',
          CompanyName:    relationData?.CompanyName     ?? '',
          ContactPerson:  relationData?.ContactPerson   ?? '',
          MobileNumber:   relationData?.MobileNumber    ?? '',
          Email:          relationData?.Email           ?? '',
          LeadSource:     relationData?.LeadSource      ?? null,
          Requirements:   relationData?.Requirements    ?? '',
          ExpectedBudget: relationData?.ExpectedBudget  ?? 0,
          Status:         relationData?.Status          ?? null,
          FkCompId:       relationData?.FkCompId        ?? compid,
          CrtdBy:         relationData?.CrtdBy          ?? userId,
          CrtdOn:         relationData?.CrtdOn          ?? null,
          MdfdBy:         relationData?.MdfdBy          ?? userId,
          MdfdOn:         relationData?.MdfdOn          ?? null,
          RecStatus:      relationData?.RecStatus       ?? 0,
          Compid:         compid,
          LanguageId:     '1',
          UserId:         userId,
          AccountName:    form.AccountName,
          FkIndustryId:   form.FkIndustryId   || '0',
          FkCurrId:       form.FkCurrId        || '0',
          ExchRate:       form.ExchRate        || '1',
          FkCountryId:    form.FkCountryId       || '0',
          State:          form.State,
          City:           form.City,
          Street:         form.Street,
          ZipCode:        form.ZipCode,
          Fax:            form.Fax,
          WebSite:        form.WebSite,
          AddDescription: form.AddDescription,
          NoofEmployees:  form.NoofEmployees   || null,
          AnnualTurnOver: form.AnnualTurnOver  || null,
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
      if (result?.IsSuccess === 'True') {
       // Alert.alert('Success', 'Company saved successfully.', [
        //   { text: 'OK', onPress: () => navigation.goBack() },
        // ]);
        navigation
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

  // ── Dropdown modal ────────────────────────────────────────────────────────

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

  // ── Loading state ─────────────────────────────────────────────────────────

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
          <Text style={styles.pageTitle}>COMPANY</Text>
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
            <InputField label="Company Name *" error={errors.AccountName}>
              <TextInput
                style={styles.textInput}
                value={form.AccountName}
                onChangeText={(v) => setField('AccountName', v)}
                placeholder="Enter company name"
                placeholderTextColor="#b0bec5"
              />
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
                numberOfLines={4}
                textAlignVertical="top"
              />
            </InputField>

            {/* No of Employees + Annual TurnOver */}
            <View style={styles.rowTwo}>
              <View style={styles.rowTwoItem}>
                <InputField label="No of Employees">
                  <TextInput
                    style={styles.textInput}
                    value={form.NoofEmployees}
                    onChangeText={(v) => setField('NoofEmployees', v)}
                    placeholder="0"
                    placeholderTextColor="#b0bec5"
                    keyboardType="numeric"
                  />
                </InputField>
              </View>
              <View style={styles.rowTwoItem}>
                <InputField label="Annual TurnOver">
                  <TextInput
                    style={styles.textInput}
                    value={form.AnnualTurnOver}
                    onChangeText={(v) => setField('AnnualTurnOver', v)}
                    placeholder="0"
                    placeholderTextColor="#b0bec5"
                    keyboardType="numeric"
                  />
                </InputField>
              </View>
            </View>

          </View>

          {/* ── Action buttons ── */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.footerBtn, styles.btnClear, isSaving && styles.btnDisabled]}
              onPress={() => { setForm(INITIAL_FORM); setErrors({}); }}
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

      {renderDropdownModal()}

    </SafeAreaView>
  );
};

export default CompanyCrudScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  flex: {
    flex: 1,
  },

  /* Loading */
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

  /* Two-column row */
  rowTwo: {
    flexDirection: 'row',
    gap: 10,
  },
  rowTwoItem: {
    flex: 1,
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
    fontSize: 10,
    color: '#811458',
    marginLeft: 6,
  },

  /* Footer buttons */
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

  /* Dropdown modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
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
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseBtn: {
    fontSize: 16,
    color: '#811458',
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  pickerList: {
    maxHeight: 320,
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    flexDirection: 'row',
    alignItems: 'center',
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
});
