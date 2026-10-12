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

import { colors, fonts } from '../constants/theme';
import { fetchCategories, fetchMerchants, createMerchant, Category, Merchant, Expense as ApiExpense } from '../services/api';
import { Chip } from './Chip';

const getPHTDate = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
};

type Props = {
  visible: boolean;
  expense?: ApiExpense;
  onClose: () => void;
  onSave: (values: {
    merchantId: string;
    categoryId: string;
    orderReference?: string;
    date: string;
    items: { name: string; quantity: number; unitPrice: number }[];
  }) => void;
};

export function ExpenseModal({ visible, expense, onClose, onSave }: Props) {
  const editing = !!expense;

  const [categories, setCategories] = useState<Category[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);

  const [date, setDate] = useState(getPHTDate());
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('');
  const [merchantQuery, setMerchantQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<string>('');
  const [orderReference, setOrderReference] = useState('');

  useEffect(() => {
    if (!visible) return;
    
    async function loadOptions() {
      const [cats, mers] = await Promise.all([fetchCategories(), fetchMerchants()]);
      setCategories(cats);
      setMerchants(mers);

      if (expense) {
        setDate(expense.date ? expense.date.substring(0, 10) : getPHTDate());
        setName(expense.items?.[0]?.name || '');
        setAmount(String(expense.totalAmount || ''));
        setSelectedMerchantId(expense.merchantId);
        setMerchantQuery(expense.merchantName || '');
        setCategoryId(expense.categoryId);
        setOrderReference(expense.orderReference || '');
      } else {
        setDate(getPHTDate());
        setName('');
        setAmount('');
        setOrderReference('');
        if (cats.length > 0) setCategoryId(cats[0].id);
        if (mers.length > 0) {
          setSelectedMerchantId(mers[0].id);
          setMerchantQuery(mers[0].name);
        }
      }
    }

    loadOptions();
    setIsDropdownOpen(false);
  }, [visible, expense]);

  const filteredMerchants = merchants.filter((m) =>
    m.name.toLowerCase().includes(merchantQuery.toLowerCase())
  );

  const exactMatchExists = merchants.some(
    (m) => m.name.toLowerCase() === merchantQuery.trim().toLowerCase()
  );

  const handleSelectMerchant = (merchant: Merchant) => {
    setSelectedMerchantId(merchant.id);
    setMerchantQuery(merchant.name);
    setIsDropdownOpen(false);
  };

  const handleCreateAndSelectMerchant = async () => {
    const trimmed = merchantQuery.trim();
    if (!trimmed) return;
    const newMerchant = await createMerchant(trimmed);
    if (newMerchant) {
      setMerchants((prev) => [...prev, newMerchant]);
      setSelectedMerchantId(newMerchant.id);
      setMerchantQuery(newMerchant.name);
      setIsDropdownOpen(false);
    }
  };

  const parsedAmount = parseFloat(amount.replace(/,/g, '')) || 0;
  const canSave = name.trim().length > 0 && parsedAmount > 0 && selectedMerchantId && categoryId && date.trim().length > 0;

  const handleSavePress = () => {
    if (!canSave) return;
    onSave({
      merchantId: selectedMerchantId,
      categoryId,
      orderReference: orderReference.trim() || undefined,
      date,
      items: [{ name: name.trim(), quantity: 1, unitPrice: parsedAmount }],
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => { onClose(); setIsDropdownOpen(false); }} />

        <View style={s.dialog}>
          <View style={s.header}>
            <Text style={s.title}>{editing ? 'Edit expense' : 'New database expense'}</Text>
            <Pressable hitSlop={10} onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>

          <Text style={s.label}>Purchase Date (YYYY-MM-DD)</Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.muted}
            style={s.input}
          />

          <Text style={s.label}>Item / Description</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Weekly groceries"
            placeholderTextColor={colors.muted}
            style={s.input}
          />

          <Text style={s.label}>Total Amount (₱)</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            style={s.input}
          />

          <Text style={s.label}>Merchant</Text>
          <View style={{ position: 'relative', zIndex: 10 }}>
            <TextInput
              value={merchantQuery}
              onChangeText={(text) => {
                setMerchantQuery(text);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="Search or type new merchant"
              placeholderTextColor={colors.muted}
              style={s.input}
            />

            {isDropdownOpen && (
              <View style={s.dropdown}>
                <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 140 }}>
                  {filteredMerchants.map((m) => (
                    <Pressable
                      key={m.id}
                      style={s.dropdownItem}
                      onPress={() => handleSelectMerchant(m)}
                    >
                      <Text style={s.dropdownText}>{m.name}</Text>
                    </Pressable>
                  ))}

                  {!exactMatchExists && merchantQuery.trim().length > 0 && (
                    <Pressable style={s.dropdownCreate} onPress={handleCreateAndSelectMerchant}>
                      <Ionicons name="add-circle-outline" size={16} color={colors.teal} />
                      <Text style={s.dropdownCreateText}>Create "{merchantQuery.trim()}"</Text>
                    </Pressable>
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          <Text style={s.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
            {categories.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                active={categoryId === c.id}
                onPress={() => setCategoryId(c.id)}
              />
            ))}
          </ScrollView>

          <Text style={s.label}>Order reference (optional)</Text>
          <TextInput
            value={orderReference}
            onChangeText={setOrderReference}
            placeholder="e.g. Shopee / Ref #1234"
            placeholderTextColor={colors.muted}
            style={s.input}
          />

          <View style={s.actions}>
            <Pressable style={s.cancel} onPress={onClose}>
              <Text style={s.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[s.save, !canSave && { opacity: 0.4 }]}
              disabled={!canSave}
              onPress={handleSavePress}
            >
              <Text style={s.saveText}>{editing ? 'Save changes' : 'Save expense'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialog: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.sidebar,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { color: colors.text, fontFamily: fonts.medium, fontSize: 18 },
  label: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, marginTop: 4 },
  input: {
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 15,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: colors.card,
  },
  dropdown: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    zIndex: 100,
  },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  dropdownText: { color: colors.text, fontSize: 14 },
  dropdownCreate: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 12, backgroundColor: 'rgba(22,186,197,0.1)' },
  dropdownCreateText: { color: colors.teal, fontSize: 14, fontFamily: fonts.medium },
  chips: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancel: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 99, borderColor: colors.border, borderWidth: 1 },
  cancelText: { color: colors.text, fontFamily: fonts.medium, fontSize: 14 },
  save: { flex: 1.5, alignItems: 'center', paddingVertical: 12, borderRadius: 99, backgroundColor: colors.teal },
  saveText: { color: colors.bg, fontFamily: fonts.medium, fontSize: 14 },
});