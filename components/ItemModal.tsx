import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { fonts } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { Chip } from './Chip';

export type ItemValues = {
  name: string;
  category: string | null;
  quantity: number;
  status: string;
  dateOpened?: string | null;
  storageYears?: number | null;
  storageMonths?: number | null;
  storageDays?: number | null;
  expirationDate?: string | null;
  isEssential: boolean;
  location?: string | null;
};

type Props = {
  visible: boolean;
  item?: any;
  onClose: () => void;
  onSave: (values: ItemValues) => void;
};

const INVENTORY_CATEGORIES = ['Food', 'Beauty & Grooming', 'Cleaning supplies', 'Electronics', 'Others'];

// Helper to correctly parse dates in GMT+8 to prevent timezone shifting
function getGMT8DateString(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const gmt8Date = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return gmt8Date.toISOString().split('T')[0];
}

// Helper to calculate expiration date based on date opened + storage duration
function computeExpiry(opened: string, y?: number, m?: number, d?: number) {
  if (!opened) return '';
  const date = new Date(opened);
  if (isNaN(date.getTime())) return '';
  if (y) date.setFullYear(date.getFullYear() + Number(y));
  if (m) date.setMonth(date.getMonth() + Number(m));
  if (d) date.setDate(date.getDate() + Number(d));
  return date.toISOString().split('T')[0];
}

export function ItemModal({ visible, item, onClose, onSave }: Props) {
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<string>('Active');

  // New fields
  const [location, setLocation] = useState('');
  const [isEssential, setIsEssential] = useState(false);

  // Expiration fields
  const [hasExpiry, setHasExpiry] = useState(false);
  const [dateOpened, setDateOpened] = useState('');
  const [storageYears, setStorageYears] = useState('');
  const [storageMonths, setStorageMonths] = useState('');
  const [storageDays, setStorageDays] = useState('');
  const [expirationDate, setExpirationDate] = useState('');

  useEffect(() => {
    if (!visible || !item) return;
    setName(item.name || '');
    setCategory(item.category || null);
    setQuantity(item.quantity ?? 1);
    setStatus(item.status || 'Active');
    setLocation(item.storageLocation || item.location || '');
    setIsEssential(item.isEssential ?? false);

    const exp = item.expirationDate ? getGMT8DateString(item.expirationDate) : '';
    const opened = item.dateOpened ? getGMT8DateString(item.dateOpened) : '';
    const y = item.storageYears !== null && item.storageYears !== undefined ? String(item.storageYears) : '';
    const m = item.storageMonths !== null && item.storageMonths !== undefined ? String(item.storageMonths) : '';
    const d = item.storageDays !== null && item.storageDays !== undefined ? String(item.storageDays) : '';

    if (exp || opened || y || m || d) {
      setHasExpiry(true);
      setExpirationDate(exp);
      setDateOpened(opened);
      setStorageYears(y);
      setStorageMonths(m);
      setStorageDays(d);
    } else {
      setHasExpiry(false);
      setExpirationDate('');
      setDateOpened('');
      setStorageYears('');
      setStorageMonths('');
      setStorageDays('');
    }
  }, [visible, item]);

  // Auto-calculate expiration date when opened date or storage inputs change
  const handleStorageChange = (opened: string, y: string, m: string, d: string) => {
    setDateOpened(opened);
    setStorageYears(y);
    setStorageMonths(m);
    setStorageDays(d);
    const calculated = computeExpiry(opened, Number(y) || 0, Number(m) || 0, Number(d) || 0);
    if (calculated) {
      setExpirationDate(calculated);
    }
  };

  const canSave = name.trim().length > 0;

  const handleSavePress = () => {
    if (!canSave) return;
    onSave({
      name: name.trim(),
      category,
      quantity,
      status,
      dateOpened: hasExpiry && dateOpened ? dateOpened : null,
      storageYears: hasExpiry && storageYears ? parseInt(storageYears, 10) : null,
      storageMonths: hasExpiry && storageMonths ? parseInt(storageMonths, 10) : null,
      storageDays: hasExpiry && storageDays ? parseInt(storageDays, 10) : null,
      expirationDate: hasExpiry && expirationDate ? expirationDate : null,
      isEssential,
      location: location.trim() || null,
      storageLocation: location.trim() || null,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[s.dialog, { backgroundColor: colors.sidebar, borderColor: colors.border }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
            <View style={s.header}>
              <Text style={[s.title, { color: colors.text }]}>Edit item</Text>
              <Pressable hitSlop={10} onPress={onClose}>
                <Ionicons name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>

            <Text style={[s.label, { color: colors.muted }]}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholderTextColor={colors.muted}
              style={[s.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
            />

            <Text style={[s.label, { color: colors.muted }]}>Category</Text>
            <View style={s.chips}>
              {INVENTORY_CATEGORIES.map((c) => (
                <Chip key={c} label={c} active={category === c} onPress={() => setCategory(category === c ? null : c)} />
              ))}
            </View>
            {category === null && <Text style={[s.hint, { color: colors.muted }]}>Not sorted yet. Pick a category to file it.</Text>}

            <Text style={[s.label, { color: colors.muted }]}>Status</Text>
            <View style={s.chips}>
              {(['Active', 'For Disposal', 'Disposed'] as const).map((st) => (
                <Chip key={st} label={st} active={status === st} onPress={() => setStatus(st)} />
              ))}
            </View>

            <Text style={[s.label, { color: colors.muted }]}>Storage Location (e.g., Pantry, Bathroom Shelf)</Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="Enter location"
              placeholderTextColor={colors.muted}
              style={[s.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
            />

            <Text style={[s.label, { color: colors.muted }]}>How many do you have?</Text>
            <View style={s.stepper}>
              <Pressable style={[s.stepBtn, { borderColor: colors.border }]} hitSlop={6} onPress={() => setQuantity((q) => Math.max(0, q - 1))}>
                <Ionicons name="remove" size={20} color={colors.text} />
              </Pressable>
              <Text style={[s.qty, { color: colors.text }]}>{quantity}</Text>
              <Pressable style={[s.stepBtn, { borderColor: colors.border }]} hitSlop={6} onPress={() => setQuantity((q) => q + 1)}>
                <Ionicons name="add" size={20} color={colors.text} />
              </Pressable>
            </View>

            {/* Checkbox for Is Essential? */}
            <Pressable style={s.checkboxRow} onPress={() => setIsEssential(!isEssential)}>
              <View style={[s.checkbox, { backgroundColor: colors.card, borderColor: colors.border }, isEssential && { backgroundColor: colors.teal, borderColor: colors.teal }]}>
                {isEssential && <Ionicons name="checkmark" size={12} color={colors.bg} />}
              </View>
              <Text style={[s.body, { color: colors.text }]}>Is Essential?</Text>
            </Pressable>

            {/* Checkbox for Expires? */}
            <Pressable style={s.checkboxRow} onPress={() => setHasExpiry(!hasExpiry)}>
              <View style={[s.checkbox, { backgroundColor: colors.card, borderColor: colors.border }, hasExpiry && { backgroundColor: colors.teal, borderColor: colors.teal }]}>
                {hasExpiry && <Ionicons name="checkmark" size={12} color={colors.bg} />}
              </View>
              <Text style={[s.body, { color: colors.text }]}>Expires?</Text>
            </Pressable>

            {hasExpiry && (
              <View style={[s.expiryContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[s.label, { color: colors.muted }]}>Date Opened (YYYY-MM-DD)</Text>
                <TextInput
                  value={dateOpened}
                  onChangeText={(val) => handleStorageChange(val, storageYears, storageMonths, storageDays)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.muted}
                  style={[s.input, { color: colors.text, backgroundColor: colors.bg, borderColor: colors.border }]}
                />

                <Text style={[s.label, { color: colors.muted }]}>Storage Life (Years / Months / Days)</Text>
                <View style={s.storageRow}>
                  <TextInput
                    value={storageYears}
                    onChangeText={(val) => handleStorageChange(dateOpened, val, storageMonths, storageDays)}
                    placeholder="Years"
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                    style={[s.storageInput, { color: colors.text, backgroundColor: colors.bg, borderColor: colors.border }]}
                  />
                  <TextInput
                    value={storageMonths}
                    onChangeText={(val) => handleStorageChange(dateOpened, storageYears, val, storageDays)}
                    placeholder="Months"
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                    style={[s.storageInput, { color: colors.text, backgroundColor: colors.bg, borderColor: colors.border }]}
                  />
                  <TextInput
                    value={storageDays}
                    onChangeText={(val) => handleStorageChange(dateOpened, storageYears, storageMonths, val)}
                    placeholder="Days"
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                    style={[s.storageInput, { color: colors.text, backgroundColor: colors.bg, borderColor: colors.border }]}
                  />
                </View>

                <Text style={[s.label, { color: colors.muted }]}>Expiration Date (YYYY-MM-DD)</Text>
                <TextInput
                  value={expirationDate}
                  onChangeText={setExpirationDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.muted}
                  style={[s.input, { color: colors.text, backgroundColor: colors.bg, borderColor: colors.border }]}
                />
              </View>
            )}

            <View style={s.actions}>
              <Pressable style={[s.cancel, { borderColor: colors.border }]} onPress={onClose}>
                <Text style={[s.cancelText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[s.save, { backgroundColor: colors.teal }, !canSave && { opacity: 0.4 }]}
                disabled={!canSave}
                onPress={handleSavePress}
              >
                <Text style={[s.saveText, { color: colors.bg }]}>Save changes</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default ItemModal;

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialog: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontFamily: fonts.medium, fontSize: 18 },
  label: { fontFamily: fonts.regular, fontSize: 12, marginTop: 6 },
  hint: { fontFamily: fonts.regular, fontSize: 12 },
  body: { fontFamily: fonts.regular, fontSize: 14 },
  input: {
    fontFamily: fonts.regular,
    fontSize: 15,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  storageRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  storageInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.regular,
    fontSize: 14,
    textAlign: 'center',
    borderWidth: 1,
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 4,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { fontFamily: fonts.medium, fontSize: 18, minWidth: 44, textAlign: 'center' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expiryContainer: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    gap: 4,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancel: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 99, borderWidth: 1 },
  cancelText: { fontFamily: fonts.medium, fontSize: 14 },
  save: { flex: 1.5, alignItems: 'center', paddingVertical: 12, borderRadius: 99 },
  saveText: { fontFamily: fonts.medium, fontSize: 14 },
});