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

import { Chip } from '../components/Chip';
import { fonts } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { fetchCategories, fetchMerchants, createMerchant, Category, Merchant, Expense as ApiExpense } from '../services/api';

const getPHTDate = (dateVal?: string | Date) => {
  const d = dateVal ? new Date(dateVal) : new Date();
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
};

const PAYMENT_METHODS = ['Cash', 'GCash', 'Maya', 'Debit', 'Credit Card'] as const;
const STATUSES = ['Paid', 'Pending'] as const;

type Props = {
  visible: boolean;
  expense?: ApiExpense;
  onClose: () => void;
  onSave: (values: {
    merchantId: string;
    categoryId: string;
    paymentMethod: string;
    status: string;
    orderReference?: string;
    date: string;
    items: { name: string; quantity: number; unitPrice: number }[];
  }) => void;
  onDelete?: (id: string) => void; // <-- Added onDelete prop
};

export function ExpenseModal({ visible, expense, onClose, onSave, onDelete }: Props) {
  const { colors } = useTheme();
  const editing = !!expense;

  const [categories, setCategories] = useState<Category[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);

  const [date, setDate] = useState(getPHTDate());
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [status, setStatus] = useState<string>('Paid');
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('');
  const [merchantQuery, setMerchantQuery] = useState('');
  const [isMerchantDropdownOpen, setIsMerchantDropdownOpen] = useState(false);
  
  const [categoryId, setCategoryId] = useState<string>('');
  const [categoryQuery, setCategoryQuery] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  
  const [orderReference, setOrderReference] = useState('');

  useEffect(() => {
    if (!visible) return;
    
    async function loadOptions() {
      const [cats, mers] = await Promise.all([fetchCategories(), fetchMerchants()]);
      setCategories(cats);
      setMerchants(mers);

      if (expense) {
        setDate(expense.date ? getPHTDate(expense.date) : getPHTDate());
        setName(expense.items?.[0]?.name || '');
        setAmount(String(expense.totalAmount || ''));
        setPaymentMethod(expense.paymentMethod || 'Cash');
        setStatus(expense.status || 'Paid');
        setSelectedMerchantId(expense.merchantId);
        setMerchantQuery(expense.merchantName || '');
        setCategoryId(expense.categoryId);
        setCategoryQuery(expense.categoryName || '');
        setOrderReference(expense.orderReference || '');
      } else {
        setDate(getPHTDate());
        setName('');
        setAmount('');
        setPaymentMethod('Cash');
        setStatus('Paid');
        setOrderReference('');
        if (cats.length > 0) {
          setCategoryId(cats[0].id);
          setCategoryQuery(cats[0].name);
        }
        if (mers.length > 0) {
          setSelectedMerchantId(mers[0].id);
          setMerchantQuery(mers[0].name);
        }
      }
    }

    loadOptions();
    setIsMerchantDropdownOpen(false);
    setIsCategoryDropdownOpen(false);
  }, [visible, expense]);

  const filteredMerchants = merchants.filter((m) =>
    m.name.toLowerCase().includes(merchantQuery.toLowerCase())
  );

  const exactMatchExists = merchants.some(
    (m) => m.name.toLowerCase() === merchantQuery.trim().toLowerCase()
  );

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(categoryQuery.toLowerCase())
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

  const handleSelectCategory = (category: Category) => {
    setCategoryId(category.id);
    setCategoryQuery(category.name);
    setIsCategoryDropdownOpen(false);
  };

  const cleanAmountStr = amount.replace(/,/g, '').trim();
  const parsedAmount = cleanAmountStr === '' || cleanAmountStr === '-' ? 0 : parseFloat(cleanAmountStr);
  const canSave = 
  name.trim().length > 0 && 
  !isNaN(parsedAmount) && 
  parsedAmount !== 0 && 
  date.trim().length > 0;

  const handleSavePress = () => {
    if (!canSave) return;
    onSave({
      merchantId: selectedMerchantId || undefined,
      categoryId: categoryId || undefined,
      paymentMethod,
      status,
      orderReference: orderReference.trim() || undefined,
      date,
      items: [{ name: name.trim(), quantity: 1, unitPrice: parsedAmount }],
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}>
        <Pressable 
          style={StyleSheet.absoluteFill} 
          onPress={() => { 
            onClose(); 
            setIsMerchantDropdownOpen(false);
            setIsCategoryDropdownOpen(false);
          }} 
        />

        <View style={[s.dialog, { backgroundColor: colors.sidebar, borderColor: colors.border }]}>
          <View style={s.header}>
            <Text style={[s.title, { color: colors.text }]}>{editing ? 'Edit expense' : 'New database expense'}</Text>
            
            {/* Delete & Close buttons */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {editing && onDelete && expense?.id && (
                <Pressable hitSlop={10} onPress={() => onDelete(expense.id)}>
                  <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
                </Pressable>
              )}
              <Pressable hitSlop={10} onPress={onClose}>
                <Ionicons name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Text style={[s.label, { color: colors.muted }]}>Purchase Date (YYYY-MM-DD)</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              style={[s.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
            />

            <Text style={[s.label, { color: colors.muted }]}>Item / Description</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Weekly groceries"
              placeholderTextColor={colors.muted}
              style={[s.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
            />

            <Text style={[s.label, { color: colors.muted }]}>Total Amount (₱)</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00 or -0.00"
              placeholderTextColor={colors.muted}
              keyboardType="default"
              style={[s.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
            />

            {/* Status Selection Chips */}
            <Text style={[s.label, { color: colors.muted }]}>Status</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginVertical: 4 }}>
              {STATUSES.map((st) => (
                <Chip
                  key={st}
                  label={st}
                  active={status === st}
                  onPress={() => setStatus(st)}
                />
              ))}
            </View>

            <Text style={[s.label, { color: colors.muted }]}>Payment Method</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginVertical: 4 }}>
              {PAYMENT_METHODS.map((pm) => (
                <Chip
                  key={pm}
                  label={pm}
                  active={paymentMethod === pm}
                  onPress={() => setPaymentMethod(pm)}
                />
              ))}
            </ScrollView>

            <Text style={[s.label, { color: colors.muted }]}>Merchant</Text>
            <View style={{ position: 'relative', zIndex: 20 }}>
              <TextInput
                value={merchantQuery}
                onChangeText={(text) => {
                  setMerchantQuery(text);
                  setIsMerchantDropdownOpen(true);
                }}
                onFocus={() => {
                  setIsMerchantDropdownOpen(true);
                  setIsCategoryDropdownOpen(false);
                }}
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

            <Text style={[s.label, { color: colors.muted }]}>Category</Text>
            <View style={{ position: 'relative', zIndex: 10 }}>
              <TextInput
                value={categoryQuery}
                onChangeText={(text) => {
                  setCategoryQuery(text);
                  setIsCategoryDropdownOpen(true);
                }}
                onFocus={() => {
                  setIsCategoryDropdownOpen(true);
                  setIsMerchantDropdownOpen(false);
                }}
                placeholder="Search category"
                placeholderTextColor={colors.muted}
                style={[s.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
              />

              {isCategoryDropdownOpen && (
                <View style={[s.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 140 }}>
                    {filteredCategories.map((c) => (
                      <Pressable
                        key={c.id}
                        style={[s.dropdownItem, { borderBottomColor: colors.border }]}
                        onPress={() => handleSelectCategory(c)}
                      >
                        <Text style={[s.dropdownText, { color: colors.text }]}>{c.name}</Text>
                      </Pressable>
                    ))}
                    {filteredCategories.length === 0 && (
                      <View style={s.dropdownItem}>
                        <Text style={[s.dropdownText, { color: colors.muted }]}>No categories found</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            <Text style={[s.label, { color: colors.muted }]}>Order reference (optional)</Text>
            <TextInput
              value={orderReference}
              onChangeText={setOrderReference}
              placeholder="e.g. Shopee / Ref #1234"
              placeholderTextColor={colors.muted}
              style={[s.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
            />

            <View style={s.actions}>
              <Pressable style={[s.cancel, { borderColor: colors.border }]} onPress={onClose}>
                <Text style={[s.cancelText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[s.save, { backgroundColor: colors.teal }, !canSave && { opacity: 0.4 }]}
                disabled={!canSave}
                onPress={handleSavePress}
              >
                <Text style={[s.saveText, { color: colors.bg }]}>{editing ? 'Save changes' : 'Save expense'}</Text>
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
    maxWidth: 440,
    maxHeight: '90%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontFamily: fonts.medium, fontSize: 18 },
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
  actions: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 4 },
  cancel: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 99, borderWidth: 1 },
  cancelText: { fontFamily: fonts.medium, fontSize: 14 },
  save: { flex: 1.5, alignItems: 'center', paddingVertical: 12, borderRadius: 99 },
  saveText: { fontFamily: fonts.medium, fontSize: 14 },
});