import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, Modal, KeyboardAvoidingView, Platform } from 'react-native';

import { Chip } from '../components/Chip';
import { colors, fonts } from '../constants/theme';
import { API_BASE_URL } from '../constants/config';

type RecurringItem = {
  id: string;
  type: 'expense' | 'income';
  name: string;
  amount: number;
  frequency: string;
  expectedDay: number;
  paymentMethod: string;
};

const peso = (n: number) => `₱${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

export default function RecurringScreen() {
  const router = useRouter();
  const [items, setItems] = useState<RecurringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [expectedDay, setExpectedDay] = useState('15');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const loadRecurring = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/recurring`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error('Failed to load recurring items:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRecurring();
  }, []);

  const handleSave = async () => {
    if (!name.trim() || !amount) return;
    try {
      const res = await fetch(`${API_BASE_URL}/recurring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          name: name.trim(),
          amount: parseFloat(amount),
          frequency: 'monthly',
          expectedDay: parseInt(expectedDay) || 1,
          paymentMethod,
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setName('');
        setAmount('');
        loadRecurring();
      }
    } catch (err) {
      console.error('Failed to save recurring item:', err);
    }
  };

  const filteredItems = items.filter((i) => i.type === activeTab);

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        {/* Breadcrumbs */}
        <View style={s.breadcrumbs}>
          <Pressable onPress={() => router.push('/expenses')}>
            <Text style={s.breadcrumbLink}>Expenses</Text>
          </Pressable>
          <Ionicons name="chevron-forward" size={14} color={colors.muted} />
          <Text style={s.breadcrumbCurrent}>Recurring Setup</Text>
        </View>

        {/* Header */}
        <View style={s.headerRow}>
          <Text style={s.title}>Recurring Templates</Text>
          <Pressable style={s.addBtn} onPress={() => setIsModalOpen(true)}>
            <Ionicons name="add" size={16} color={colors.bg} />
            <Text style={s.addBtnText}>Add {activeTab}</Text>
          </Pressable>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label="Bills & Expenses" active={activeTab === 'expense'} onPress={() => setActiveTab('expense')} />
          <Chip label="Income Streams" active={activeTab === 'income'} onPress={() => setActiveTab('income')} />
        </View>

        {/* List Card */}
        <View style={[s.card, { padding: 0 }]}>
          {loading ? (
            <View style={s.centerPadding}>
              <Text style={s.body}>Loading templates...</Text>
            </View>
          ) : filteredItems.length === 0 ? (
            <View style={s.centerPadding}>
              <Text style={s.body}>No recurring {activeTab}s configured</Text>
            </View>
          ) : (
            filteredItems.map((item, idx) => (
              <View key={item.id} style={[s.row, idx > 0 && s.divider]}>
                <View style={s.icon}>
                  <Ionicons name={activeTab === 'expense' ? 'receipt-outline' : 'wallet-outline'} size={18} color={colors.teal} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.body}>{item.name}</Text>
                  <Text style={s.small}>Expected every month on day {item.expectedDay} · {item.paymentMethod}</Text>
                </View>
                <Text style={[s.amount, activeTab === 'income' && { color: colors.teal }]}>
                  {activeTab === 'income' ? '+' : ''}{peso(item.amount)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={isModalOpen} transparent animationType="fade" onRequestClose={() => setIsModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsModalOpen(false)} />
          <View style={s.dialog}>
            <Text style={s.modalTitle}>New Recurring {activeTab === 'expense' ? 'Bill' : 'Income Stream'}</Text>

            <Text style={s.label}>Name</Text>
            <TextInput value={name} onChangeText={setName} placeholder="e.g. Electricity Bill, Salary" placeholderTextColor={colors.muted} style={s.input} />

            <Text style={s.label}>Amount (₱)</Text>
            <TextInput value={amount} onChangeText={setAmount} placeholder="0.00" keyboardDataType="decimal-pad" placeholderTextColor={colors.muted} style={s.input} />

            <Text style={s.label}>Expected Day of Month (1-31)</Text>
            <TextInput value={expectedDay} onChangeText={setExpectedDay} placeholder="15" keyboardType="number-pad" placeholderTextColor={colors.muted} style={s.input} />

            <View style={s.modalActions}>
              <Pressable style={s.cancelBtn} onPress={() => setIsModalOpen(false)}>
                <Text style={s.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={s.saveBtn} onPress={handleSave}>
                <Text style={s.saveText}>Save template</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, gap: 12, width: '100%', maxWidth: 760, alignSelf: 'center' },
  breadcrumbs: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: -4 },
  breadcrumbLink: { color: colors.teal, fontFamily: fonts.medium, fontSize: 13 },
  breadcrumbCurrent: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.text, fontFamily: fonts.medium, fontSize: 22 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.teal, borderRadius: 99, paddingVertical: 8, paddingHorizontal: 14 },
  addBtnText: { color: colors.bg, fontFamily: fonts.medium, fontSize: 13 },
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  centerPadding: { padding: 24, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(22,186,197,0.16)', alignItems: 'center', justifyContent: 'center' },
  body: { color: colors.text, fontFamily: fonts.medium, fontSize: 15 },
  small: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12 },
  amount: { color: colors.text, fontFamily: fonts.medium, fontSize: 14 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialog: { width: '100%', maxWidth: 420, backgroundColor: colors.sidebar, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 20, gap: 12 },
  modalTitle: { color: colors.text, fontFamily: fonts.medium, fontSize: 18 },
  label: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12 },
  input: { color: colors.text, fontFamily: fonts.regular, fontSize: 15, borderColor: colors.border, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, height: 44, backgroundColor: colors.card },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, justifyContent: 'center' },
  cancelText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 14 },
  saveBtn: { backgroundColor: colors.teal, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: colors.bg, fontFamily: fonts.medium, fontSize: 14 },
});