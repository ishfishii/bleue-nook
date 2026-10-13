import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
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
import { fetchMerchants, createMerchant, fetchCategories, Merchant, Category } from '../services/api';

type RecurringItem = {
  id?: string;
  type: 'expense' | 'income';
  name: string;
  amount: number;
  expectedDay: number;
  merchantId?: string;
  merchantName?: string;
  categoryId?: string;
};

type Props = {
  visible: boolean;
  type: 'expense' | 'income';
  initialData?: RecurringItem | null;
  onClose: () => void;
  onSave: (values: RecurringItem) => void;
  onDelete?: (id: string) => void;
};

export default function RecurringModal({
  visible,
  type,
  initialData,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const { colors } = useTheme();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [expectedDay, setExpectedDay] = useState('1');

  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [merchantQuery, setMerchantQuery] = useState('');
  const [isMerchantDropdownOpen, setIsMerchantDropdownOpen] = useState(false);

  useEffect(() => {
    if (!visible) return;

    async function loadData() {
      const [mers, cats] = await Promise.all([fetchMerchants(), fetchCategories()]);
      setMerchants(mers);
      setCategories(cats);

      if (initialData) {
        setName(initialData.name || '');
        setAmount(initialData.amount ? String(initialData.amount) : '');
        setExpectedDay(initialData.expectedDay ? String(initialData.expectedDay) : '1');
        setSelectedMerchantId(initialData.merchantId || '');
        setMerchantQuery(initialData.merchantName || '');
        setSelectedCategoryId(initialData.categoryId || '');
      } else {
        setName('');
        setAmount('');
        setExpectedDay('1');
        setSelectedMerchantId(mers[0]?.id || '');
        setMerchantQuery(mers[0]?.name || '');

        // Automatically assign the "Income" category if type is income
        if (type === 'income') {
          const incomeCat = cats.find((c) => c.name.toLowerCase() === 'income');
          setSelectedCategoryId(incomeCat ? incomeCat.id : '');
        } else {
          setSelectedCategoryId('');
        }
      }
    }

    loadData();
    setIsMerchantDropdownOpen(false);
  }, [visible, type, initialData]);

  const filteredMerchants = merchants.filter((m) =>
    m.name.toLowerCase().includes(merchantQuery.toLowerCase())
  );

  const exactMatchExists = merchants.some(
    (m) => m.name.toLowerCase() === merchantQuery.trim().toLowerCase()
  );

  const handleSelectMerchant = (merchant: Merchant) => {
    setSelectedMerchantId(merchant.id);
    setMerchantQuery(merchant.name);
    setIsMerchantDropdownOpen(false);
  };

  const handleCreateAndSelectMerchant = async () => {
    const trimmed = merchantQuery.trim();
    if (!trimmed) return;
    const newMerchant = await createMerchant(trimmed);
    if (newMerchant) {
      setMerchants((prev) => [...prev, newMerchant]);
      setSelectedMerchantId(newMerchant.id);
      setMerchantQuery(newMerchant.name);
      setIsMerchantDropdownOpen(false);
    }
  };

  const handleSave = () => {
    const parsedAmount = parseFloat(amount);
    const parsedDay = parseInt(expectedDay, 10);

    if (!name.trim() || isNaN(parsedAmount) || isNaN(parsedDay)) return;

    // Find if current query matches an existing merchant name if ID isn't selected
    let merchantIdToSave = selectedMerchantId;
    if (!merchantIdToSave && merchantQuery.trim()) {
      const matched = merchants.find(
        (m) => m.name.toLowerCase() === merchantQuery.trim().toLowerCase()
      );
      if (matched) {
        merchantIdToSave = matched.id;
      }
    }

    // Ensure category ID defaults to the "Income" category if it's an income stream
    let categoryIdToSave = selectedCategoryId;
    if (!categoryIdToSave && type === 'income') {
      const incomeCat = categories.find((c) => c.name.toLowerCase() === 'income');
      if (incomeCat) categoryIdToSave = incomeCat.id;
    }

    onSave({
      id: initialData?.id,
      type,
      name: name.trim(),
      amount: parsedAmount,
      expectedDay: parsedDay,
      merchantId: merchantIdToSave || undefined,
      merchantName: merchantQuery.trim() || undefined,
      categoryId: categoryIdToSave || undefined,
    });
  };

  const handleDelete = () => {
    if (!initialData?.id || !onDelete) return;

    Alert.alert('Delete Template', `Are you sure you want to delete "${initialData.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete(initialData.id!),
      },
    ]);
  };

  const titlePrefix = initialData ? 'Edit' : 'Add';
  const labelType = type === 'expense' ? 'Expense' : 'Income';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            onClose();
            setIsMerchantDropdownOpen(false);
          }}
        />

        <View style={[s.dialog, { backgroundColor: colors.sidebar, borderColor: colors.border }]}>
          <Text style={[s.modalTitle, { color: colors.text }]}>{`${titlePrefix} ${labelType} Template`}</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Text style={[s.label, { color: colors.muted }]}>Template Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={type === 'expense' ? 'e.g. Netflix Subscription' : 'e.g. Salary'}
              placeholderTextColor={colors.muted}
              style={[s.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
            />

            <Text style={[s.label, { color: colors.muted }]}>Amount (₱)</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              style={[s.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
            />

            <Text style={[s.label, { color: colors.muted }]}>Expected Day of Month (1–31)</Text>
            <TextInput
              value={expectedDay}
              onChangeText={setExpectedDay}
              placeholder="5"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              style={[s.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
            />

            <Text style={[s.label, { color: colors.muted }]}>Merchant / Source</Text>
            <View style={{ position: 'relative', zIndex: 20 }}>
              <TextInput
                value={merchantQuery}
                onChangeText={(text) => {
                  setMerchantQuery(text);
                  setIsMerchantDropdownOpen(true);
                }}
                onFocus={() => setIsMerchantDropdownOpen(true)}
                placeholder="Search or type new merchant"
                placeholderTextColor={colors.muted}
                style={[s.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
              />

              {isMerchantDropdownOpen && (
                <View style={[s.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 140 }}>
                    {filteredMerchants.map((m) => (
                      <Pressable
                        key={m.id}
                        style={[s.dropdownItem, { borderBottomColor: colors.border }]}
                        onPress={() => handleSelectMerchant(m)}
                      >
                        <Text style={[s.dropdownText, { color: colors.text }]}>{m.name}</Text>
                      </Pressable>
                    ))}

                    {!exactMatchExists && merchantQuery.trim().length > 0 && (
                      <Pressable style={s.dropdownCreate} onPress={handleCreateAndSelectMerchant}>
                        <Ionicons name="add-circle-outline" size={16} color={colors.teal} />
                        <Text style={[s.dropdownCreateText, { color: colors.teal }]}>Create "{merchantQuery.trim()}"</Text>
                      </Pressable>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={s.modalActions}>
              {initialData && onDelete && (
                <Pressable style={s.deleteBtn} onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                  <Text style={s.deleteText}>Delete</Text>
                </Pressable>
              )}
              <View style={{ flex: 1 }} />
              <Pressable style={s.cancelBtn} onPress={onClose}>
                <Text style={[s.cancelText, { color: colors.muted }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[s.saveBtn, { backgroundColor: colors.teal }, (!name.trim() || !amount) && { opacity: 0.4 }]}
                disabled={!name.trim() || !amount}
                onPress={handleSave}
              >
                <Text style={[s.saveText, { color: colors.bg }]}>Save</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialog: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontFamily: fonts.medium, fontSize: 18, marginBottom: 2 },
  label: { fontFamily: fonts.regular, fontSize: 12, marginTop: 4 },
  input: {
    fontFamily: fonts.regular,
    fontSize: 15,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  dropdown: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    zIndex: 100,
  },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1 },
  dropdownText: { fontSize: 14, fontFamily: fonts.regular },
  dropdownCreate: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 12, backgroundColor: 'rgba(22,186,197,0.1)' },
  dropdownCreateText: { fontSize: 14, fontFamily: fonts.medium },
  modalActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 10, paddingRight: 12 },
  deleteText: { color: '#FF6B6B', fontFamily: fonts.medium, fontSize: 14 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, justifyContent: 'center' },
  cancelText: { fontFamily: fonts.medium, fontSize: 14 },
  saveBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { fontFamily: fonts.medium, fontSize: 14 },
});