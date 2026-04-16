import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  NativeModules,
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { pick, types, keepLocalCopy } from '@react-native-documents/picker';
import RNFetchBlob from 'react-native-blob-util';
import { API_CONFIG, getApiUrl, getFileUrl } from '../../config/apiConfig';
import UserStorage from '../../utils/userStorage';
import { uploadDocument } from '../../api/api';
import NotificationService from '../../services/NotificationService';

const { MediaStoreModule } = NativeModules;

// ─── Types ───────────────────────────────────────────────────────────────────

type DropdownOption = { label: string; value: string };

type UploadedFile = {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  attachmentItem: {
    PageName: string;
    TableName: string;
    FileNameSelected: string;
    FileNameServer: string;
    FilePath: string;
    FileSize: number;
    FileType: string;
    AutoId: string;
    FileId: string;
    Folder: string;
  };
};

type FormState = {
  TaskId: string;
  FkRelationId: string;
  Title: string;
  TaskDate: string;
  Details: string;
  FkAssignedTo: string;
  DurationApplicable: boolean;
  CategoryId: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const INITIAL_FORM: FormState = {
  TaskId: '0',
  FkRelationId: '',
  Title: '',
  TaskDate: new Date().toISOString().split('T')[0],
  Details: '',
  FkAssignedTo: '',
  DurationApplicable: true,
  CategoryId: '1',
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

const CrmTaskCrudScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const taskId = route?.params?.TaskId ? Number(route.params.TaskId) : 0;
  const relationId = route?.params?.RelationId ? Number(route.params.RelationId) : 0;
  const status = route?.params?.Status ? Number(route.params.Status) : 0;

  const [form, setForm] = useState<FormState>({
    ...INITIAL_FORM,
    TaskId: String(taskId),
    FkRelationId: relationId ? String(relationId) : '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingRecord, setIsLoadingRecord] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Dropdowns
  const [activeDropdown, setActiveDropdown] = useState<'FkRelationId' | 'FkAssignedTo' | null>(null);
  const [relationOptions, setRelationOptions] = useState<DropdownOption[]>([]);
  const [assignedToOptions, setAssignedToOptions] = useState<DropdownOption[]>([]);

  // Attachments
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // ── Load relation options on mount ────────────────────────────────────────

  useEffect(() => {
    const loadRelationOptions = async () => {
      try {
        const token = await UserStorage.getToken();
        const userData = await UserStorage.getUserData();
        if (!token) { return; }

        const compid = String(userData?.CompId ?? '0');
        const userId = String(userData?.UserId ?? '0');

        const apiUrl = getApiUrl('/api/cr5014/LGT_Mode');
        const response = await axios.post(apiUrl, {
          Compid: compid,
          UserId: userId,
          LanguageId: 1,
          MobileViewFlag: 1,
          ShowFullData: 0,
          FilterParams: '[]',
          Status: status,
          FkRelationId: 0,
        }, {
          headers: {
            ...API_CONFIG.DEFAULT_HEADERS,
            Authorization: `Bearer ${token}`,
          },
          timeout: API_CONFIG.TIMEOUT,
        });

        const result = response.data;
        if (Array.isArray(result?.Item2)) {
          const seen = new Set<string>();
          const unique: DropdownOption[] = [];
          for (const r of result.Item2) {
            const value = String(r.RelationId ?? '');
            if (!value || seen.has(value)) { continue; }
            seen.add(value);
            unique.push({ label: String(r.RelationTrackNo ?? ''), value });
          }
          setRelationOptions(unique);
        }
      } catch (e) {
        console.error('CrmTaskCrudScreen: failed to load relation options', e);
      }
    };

    loadRelationOptions();
  }, [status]);

  // ── Load assigned-to options from CRM LO_Mode local storage (Rest.Item4) ──

  useEffect(() => {
    const loadAssignedToOptions = async () => {
      try {
        const data = await UserStorage.getCrmLoModeData();
        if (!data) { return; }

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
          setAssignedToOptions(unique);
        }
      } catch (e) {
        console.error('CrmTaskCrudScreen: failed to load assigned-to options', e);
      }
    };

    loadAssignedToOptions();
  }, []);

  // ── Load existing record when TaskId > 0 ──────────────────────────────────

  useEffect(() => {
    if (!taskId || taskId <= 0) { return; }

    const loadRecord = async () => {
      try {
        setIsLoadingRecord(true);
        const token = await UserStorage.getToken();
        const userData = await UserStorage.getUserData();
        if (!token) { return; }

        const apiUrl = getApiUrl('/api/cr5014/SE_Mode');
        const response = await axios.post(apiUrl, {
          TaskId: String(taskId),
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
            TaskId: String(rec.TaskId ?? prev.TaskId),
            Title: String(rec.Title ?? ''),
            Details: String(rec.Details ?? ''),
            TaskDate: rec.TaskDate
              ? String(rec.TaskDate).split('T')[0]
              : prev.TaskDate,
            FkRelationId: rec.FkRelationId != null ? String(rec.FkRelationId) : prev.FkRelationId,
            FkAssignedTo: rec.FkAssignedTo != null ? String(rec.FkAssignedTo) : '',
            DurationApplicable: rec.DurationApplicable ?? true,
            CategoryId: rec.CategoryId != null ? String(rec.CategoryId) : '1',
          }));
        }

        // Load existing attachments from Item7
        if (Array.isArray(res?.Item7)) {
          const mappedAttachments = res.Item7.map((attachment: any, index: number) => ({
            id: `existing-${index}`,
            fileName: attachment.FileNameSelected || attachment.FileNameServer || 'Unknown',
            fileSize: attachment.FileSize || 0,
            fileType: attachment.FileType || 'application/octet-stream',
            attachmentItem: {
              PageName: attachment.PageName || 'cr5014',
              TableName: attachment.TableName || 'cr5014.3',
              FileNameSelected: attachment.FileNameSelected || 'Unknown',
              FileNameServer: attachment.FileNameServer || '',
              FilePath: attachment.Folder || '',
              FileSize: attachment.FileSize || 0,
              FileType: attachment.FileType || 'application/octet-stream',
              AutoId: String(attachment.AutoId ?? '0'),
              FileId: String(attachment.FileId ?? '0'),
              Folder: attachment.Folder || '',
            },
          }));
          setUploadedFiles(mappedAttachments);
        }
      } catch (e) {
        console.error('CrmTaskCrudScreen: failed to load record', e);
      } finally {
        setIsLoadingRecord(false);
      }
    };

    loadRecord();
  }, [taskId]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const setField = (key: keyof FormState, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const relationLabel = (): string =>
    relationOptions.find((o) => o.value === form.FkRelationId)?.label ?? '';

  const assignedToLabel = (): string =>
    assignedToOptions.find((o) => o.value === form.FkAssignedTo)?.label ?? '';

  const formatDateDisplay = (dateStr: string): string => {
    if (!dateStr) { return ''; }
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) { return dateStr; }
    const day = String(d.getDate()).padStart(2, '0');
    const mon = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${mon}-${year}`;
  };

  const handleDateChange = (event: any, selected?: Date) => {
    setShowDatePicker(false);
    if (event?.type === 'set' && selected) {
      setField('TaskDate', selected.toISOString().split('T')[0]);
    }
  };

  // ── File Picker ──────────────────────────────────────────────────────────

  const handleDocumentPicker = async () => {
    try {
      const [file] = await pick({ type: [types.allFiles], allowMultiSelection: false });
      if (!file.uri) { return; }

      await keepLocalCopy({ files: [{ uri: file.uri, fileName: file.name ?? '' }], destination: 'documentDirectory' });

      setIsUploading(true);
      const token = await UserStorage.getToken();
      if (!token) {
        Alert.alert('Authentication Error', 'Please login again.');
        setIsUploading(false);
        return;
      }

      try {
        const uploadResult = await uploadDocument(token, file);
        if (uploadResult && uploadResult.Status === 'Success') {
          const attachmentItem = {
            PageName: 'cr5014',
            TableName: 'cr5014.3',
            FileNameSelected: uploadResult.FileName || file.name || 'Unknown',
            FileNameServer: uploadResult.TmpFileName,
            FilePath: uploadResult.UploadFilePath || '',
            FileSize: uploadResult.FileSize || file.size || 0,
            FileType: file.type || 'application/octet-stream',
            AutoId: '0',
            FileId: '0',
            Folder: uploadResult.UploadFilePath || '',
          };

          const newFile: UploadedFile = {
            id: Date.now().toString(),
            fileName: uploadResult.FileName || file.name || 'Unknown',
            fileSize: uploadResult.FileSize || file.size || 0,
            fileType: file.type || 'application/octet-stream',
            attachmentItem,
          };

          setUploadedFiles((prev) => [...prev, newFile]);
        } else {
          Alert.alert('Upload Failed', 'Failed to upload document. Please try again.');
        }
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        Alert.alert('Upload Error', 'An error occurred while uploading the document.');
      }
    } catch (error: any) {
      if (error.code !== 'DOCUMENT_PICKER_CANCELED') {
        console.error('Document picker error:', error);
        Alert.alert('Error', 'Failed to select document. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // ── File Download ────────────────────────────────────────────────────────

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

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 33) { return true; }
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
    }
    return true;
  };

  const handleFileDownload = async (file: UploadedFile) => {
    try {
      await NotificationService.init();

      const token = await UserStorage.getToken();
      if (!token) {
        Alert.alert('Error', 'No authentication token found. Please login again.');
        return;
      }

      let fileUrl = `${file.attachmentItem.FilePath}/${file.attachmentItem.FileNameServer}`;
      if (!fileUrl.startsWith('http')) {
        fileUrl = getFileUrl('/UploadFiles/DocManager/temp/' + file.attachmentItem.FileNameServer);
      }

      const fileName = file.attachmentItem.FileNameSelected || file.fileName;
      const mimeType = getMimeTypeFromFileName(fileName);

      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert('Error', 'Storage permission not granted.');
        return;
      }

      try {
        const { fs, android } = RNFetchBlob;
        const downloadDir = fs.dirs.DownloadDir;
        const finalPath = `${downloadDir}/${fileName}`;

        if (await fs.exists(finalPath)) {
          await fs.unlink(finalPath);
        }

        const response = await RNFetchBlob.config({ fileCache: true }).fetch('GET', fileUrl, {
          Authorization: `Bearer ${token}`,
        });

        const tempFilePath = response.path();
        const base64Data = await fs.readFile(tempFilePath, 'base64');

        if (!base64Data || base64Data.length === 0) {
          throw new Error('Downloaded file is empty');
        }

        await fs.writeFile(finalPath, base64Data, 'base64');
        await MediaStoreModule.saveFileToDownloads(finalPath, fileName, mimeType);

        if (await fs.exists(tempFilePath)) {
          await fs.unlink(tempFilePath);
        }

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

        await NotificationService.showDownloadComplete(fileName, finalPath);
      } catch (downloadError: any) {
        console.error('Error downloading file:', downloadError);
        Alert.alert('Error', `Failed to download file: ${downloadError?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download file');
    }
  };

  // ── Validation ───────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!form.Title.trim()) {
      next.Title = 'Title is required.';
    }
    if (!form.TaskDate.trim()) {
      next.TaskDate = 'Task Date is required.';
    }
    if (!form.Details.trim()) {
      next.Details = 'Details is required.';
    }
    if (!form.FkAssignedTo) {
      next.FkAssignedTo = 'Assigned To is required.';
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
        AttachmentList: uploadedFiles.map((f) => f.attachmentItem),
        Compid: compid,
        UserId: userId,
        LanguageId: 1,
        TaskId: taskId > 0 ? taskId : null,
        FkRelationId: Number(form.FkRelationId) || relationId,
        Title: form.Title,
        TaskDate: form.TaskDate,
        Details: form.Details,
        FkAssignedTo: Number(form.FkAssignedTo),
        DurationApplicable: form.DurationApplicable,
        CategoryId: Number(form.CategoryId) || 1,
        Status: status,
        Mode: taskId > 0 ? 'U' : 'I',
      };

      const apiUrl = getApiUrl('/api/cr5014/I_U_D_Mode');
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
    setForm({
      ...INITIAL_FORM,
      TaskId: '0',
      FkRelationId: '',
      TaskDate: new Date().toISOString().split('T')[0],
    });
    setUploadedFiles([]);
    setErrors({});
    setShowDatePicker(false);
    setActiveDropdown(null);
  };

  // ── Dropdown modal ────────────────────────────────────────────────────────

  const renderDropdownModal = () => {
    if (!activeDropdown) { return null; }

    const isRelation = activeDropdown === 'FkRelationId';
    const options = isRelation ? relationOptions : assignedToOptions;
    const title = isRelation ? 'Select Relation' : 'Select Assigned To';
    const fieldKey = isRelation ? 'FkRelationId' : 'FkAssignedTo';
    const selectedValue = isRelation ? form.FkRelationId : form.FkAssignedTo;

    return (
      <Modal
        transparent
        animationType="fade"
        visible
        onRequestClose={() => setActiveDropdown(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setActiveDropdown(null)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={() => setActiveDropdown(null)}>
                <Text style={styles.modalCloseBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            {options.length === 0 ? (
              <Text style={styles.noOptionsText}>No options available.</Text>
            ) : (
              <FlatList
                data={options}
                keyExtractor={(item, index) => `${item.value}_${index}`}
                style={styles.pickerList}
                renderItem={({ item }) => {
                  const isSelected = selectedValue === item.value;
                  return (
                    <TouchableOpacity
                      style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setField(fieldKey, item.value);
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
        </View>
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
          <Text style={styles.pageTitle}>TASK</Text>
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

            {/* Relation */}
            <InputField label="Relation" error={errors.FkRelationId}>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setActiveDropdown('FkRelationId')}
                activeOpacity={0.7}
              >
                <Text style={form.FkRelationId ? styles.dropdownValue : styles.dropdownPlaceholder}>
                  {relationLabel() || 'Select relation'}
                </Text>
                <Text style={styles.dropdownChevron}>▼</Text>
              </TouchableOpacity>
            </InputField>

            {/* Title */}
            <InputField label="Title" required error={errors.Title}>
              <TextInput
                style={[styles.textInput, errors.Title ? styles.inputErrorBorder : null]}
                value={form.Title}
                onChangeText={(v) => setField('Title', v)}
                placeholder="Enter title"
                placeholderTextColor="#b0bec5"
              />
            </InputField>

            {/* Task Date */}
            <InputField label="Task Date" required error={errors.TaskDate}>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownValue}>{form.TaskDate ? formatDateDisplay(form.TaskDate) : 'Select date'}</Text>
                <Text style={styles.dropdownChevron}>📅</Text>
              </TouchableOpacity>
            </InputField>

            {showDatePicker && (
              <DateTimePicker
                value={form.TaskDate ? new Date(form.TaskDate) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
              />
            )}

            {/* Details */}
            <InputField label="Details" required error={errors.Details}>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={form.Details}
                onChangeText={(v) => setField('Details', v)}
                placeholder="Enter task details"
                placeholderTextColor="#b0bec5"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </InputField>

            {/* Assigned To */}
            <InputField label="Assigned To" required error={errors.FkAssignedTo}>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setActiveDropdown('FkAssignedTo')}
                activeOpacity={0.7}
              >
                <Text style={form.FkAssignedTo ? styles.dropdownValue : styles.dropdownPlaceholder}>
                  {assignedToLabel() || 'Select assigned to'}
                </Text>
                <Text style={styles.dropdownChevron}>▼</Text>
              </TouchableOpacity>
            </InputField>

            {/* Duration Applicable */}
            <InputField label="Duration Applicable">
              <TouchableOpacity
                style={styles.checkboxRow}
                activeOpacity={0.7}
                onPress={() => setField('DurationApplicable', !form.DurationApplicable)}
              >
                <View style={[styles.checkbox, form.DurationApplicable && styles.checkboxChecked]}>
                  {form.DurationApplicable && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>
                  {form.DurationApplicable ? 'Yes' : 'No'}
                </Text>
              </TouchableOpacity>
            </InputField>

            {/* Select Attachment */}
            <InputField label="Select Attachment">
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={handleDocumentPicker}
                activeOpacity={0.7}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="#811458" />
                ) : (
                  <Text style={styles.uploadBtnText}>📎 Select Document</Text>
                )}
              </TouchableOpacity>
            </InputField>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <View style={styles.uploadedFilesContainer}>
                <Text style={styles.uploadedFilesTitle}>Uploaded Documents</Text>
                {uploadedFiles.map((file) => (
                  <View key={file.id} style={styles.uploadedFileItem}>
                    <TouchableOpacity style={styles.uploadedFileInfo} onPress={() => handleFileDownload(file)}>
                      <Text style={[styles.uploadedFileName, styles.downloadableFileName]} numberOfLines={1}>
                        {file.attachmentItem?.FileNameSelected || file.fileName}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeFileButton}
                      onPress={() => handleRemoveFile(file.id)}
                    >
                      <Text style={styles.removeFileButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

          </View>

          {/* ── Action buttons ── */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.footerBtn, styles.btnClear, isSaving && styles.btnDisabled]}
              onPress={handleClear}
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

      {/* ── Dropdown modal ── */}
      {renderDropdownModal()}

    </SafeAreaView>
  );
};

export default CrmTaskCrudScreen;

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

  /* Checkbox */
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: '#811458',
    backgroundColor: '#811458',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
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

  /* Upload / Attachments */
  uploadBtn: {
    borderWidth: 1,
    borderColor: '#811458',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtnText: {
    color: '#811458',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadedFilesContainer: {
    marginBottom: 16,
  },
  uploadedFilesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  uploadedFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3e5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  uploadedFileInfo: {
    flex: 1,
    marginRight: 10,
  },
  uploadedFileName: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  downloadableFileName: {
    color: '#133F7C',
    textDecorationLine: 'underline',
  },
  removeFileButton: {
    padding: 4,
  },
  removeFileButtonText: {
    fontSize: 16,
    color: '#930606',
    fontWeight: '700',
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
});
