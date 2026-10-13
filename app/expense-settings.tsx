import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
  Switch,
} from 'react-native';

import { Chip } from '../components/Chip';
import RecurringModal from '../components/RecurringModal';
import { fonts } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../constants/config';

type ExpenseCategory = {
  id: string;
  name: string;
  icon: string;
  autoInventory: boolean;
};

type RecurringItem = {
  id: string;
  type: 'expense' | 'income';
  name: string;
  amount: number;
  frequency: string;
  expectedDay: number;
  paymentMethod: string;
  merchantId?: string;
  merchantName?: string;
};

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORY_ICONS: IconName[] = [
  'cart-outline', 'flash-outline', 'cafe-outline', 'pricetag-outline',
  'wallet-outline', 'car-outline', 'home-outline', 'heart-outline',
  'gift-outline', 'medical-outline', 'fast-food-outline', 'airplane-outline',
  'shirt-outline', 'book-outline', 'construct-outline', 'laptop-outline',
  'grid-outline', 'layers-outline', 'ellipsis-horizontal-outline', 'cube-outline',
];

const peso = (n: number) => `₱${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

export default function ExpenseSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  
  // Active Main Tab
  const [activeMainTab, setActiveMainTab] = useState<'categories' | 'recurring'>('categories');

  // Categories States
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [catLoading, setCatLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('pricetag-outline');
  const [autoInventory, setAutoInventory] = useState(false);

  // Recurring States
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>([]);
  const [recLoading, setRecLoading] = useState(true);
  const [recurringSubTab, setRecurringSubTab] = useState<'expense' | 'income'>('expense');
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringItem | null>(null);

  // Data Fetchers
  const loadCategories = async () => {
    setCatLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      if (res.ok) setCategories(await res.json());
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
    setCatLoading(false);
  };

  const loadRecurring = async () => {
    setRecLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/recurring`);
      if (res.ok) setRecurringItems(await res.json());
    } catch (err) {
      console.error('Failed to load recurring items:', err);
    }
    setRecLoading(false);
  };

  useEffect(() => {
    loadCategories();
    loadRecurring();
  }, []);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, searchQuery]);

  const filteredRecurring = recurringItems.filter((i) => i.type === recurringSubTab);

  // Category Actions
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setSelectedIcon('pricetag-outline');
    setAutoInventory(false);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: ExpenseCategory) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setSelectedIcon(cat.icon || 'pricetag-outline');
    setAutoInventory(cat.autoInventory ?? false);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) return;
    try {
      const url = editingCategory
        ? `${API_BASE_URL}/categories/${editingCategory.id}`
        : `${API_BASE_URL}/categories`;
      const res = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName.trim(), icon: selectedIcon, autoInventory }),
      });
      if (res.ok) {
        setIsCategoryModalOpen(false);
        loadCategories();
      }
    } catch (err) {
      console.error('Failed to save category:', err);
    }
  };

  const handleDeleteCategory = async () => {
    if (!editingCategory) return;
    Alert.alert('Delete Category', `Are you sure you want to delete "${editingCategory.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_BASE_URL}/categories/${editingCategory.id}`, {
              method: 'DELETE',
            });
            if (res.ok) {
              setIsCategoryModalOpen(false);
              loadCategories();
            }
          } catch (err) {
            console.error('Failed to delete category:', err);
          }
        },
      },
    ]);
  };

  // Recurring Template Actions
  const handleOpenAddRecurring = () => {
    setEditingRecurring(null);
    setIsRecurringModalOpen(true);
  };

  const handleOpenEditRecurring = (item: RecurringItem) => {
    setEditingRecurring(item);
    setIsRecurringModalOpen(true);
  };

  const handleSaveRecurring = async (values: {
    id?: string;
    type: 'expense' | 'income';
    name: string;
    amount: number;
    expectedDay: number;
    merchantId?: string;
  }) => {
    try {
      const url = values.id
        ? `${API_BASE_URL}/recurring/${values.id}`
        : `${API_BASE_URL}/recurring`;
      const method = values.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          frequency: 'monthly',
          paymentMethod: 'Cash',
          merchantId: values.merchantId || null,
        }),
      });
      if (res.ok) {
        setIsRecurringModalOpen(false);
        loadRecurring();
      }
    } catch (err) {
      console.error('Failed to save recurring template:', err);
    }
  };

  const handleDeleteRecurring = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/recurring/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setIsRecurringModalOpen(false);
        loadRecurring();
      }
    } catch (err) {
      console.error('Failed to delete recurring template:', err);
    }
  };

  return (
    <View style={[s.screen, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={s.content}>
        
        {/* Breadcrumbs */}
        <View style={s.breadcrumbs}>
          <Pressable onPress={() => router.push('/expenses')}>
            <Text style={[s.breadcrumbLink, { color: colors.teal }]}>Expenses</Text>
          </Pressable>
          <Ionicons name="chevron-forward" size={14} color={colors.muted} />
          <Text style={[s.breadcrumbCurrent, { color: colors.muted }]}>Settings</Text>
        </View>

        {/* Header & Dynamic CTA */}
        <View style={s.headerRow}>
          <Text style={[s.title, { color: colors.text }]}>Expense Settings</Text>
          {activeMainTab === 'categories' ? (
            <Pressable style={[s.addBtn, { backgroundColor: colors.teal }]} onPress={handleOpenAddCategory}>
              <Ionicons name="add" size={16} color={colors.bg} />
              <Text style={[s.addBtnText, { color: colors.bg }]}>Add Category</Text>
            </Pressable>
          ) : (
            <Pressable style={[s.addBtn, { backgroundColor: colors.teal }]} onPress={handleOpenAddRecurring}>
              <Ionicons name="add" size={16} color={colors.bg} />
              <Text style={[s.addBtnText, { color: colors.bg }]}>Add {recurringSubTab === 'expense' ? 'Expense' : 'Income'}</Text>
            </Pressable>
          )}
        </View>

        {/* Main Tab Navigation */}
        <View style={[s.tabsContainer, { borderBottomColor: colors.border }]}>
          <Pressable
            style={[s.tabButton, activeMainTab === 'categories' && { borderBottomColor: colors.teal }]}
            onPress={() => setActiveMainTab('categories')}
          >
            <Ionicons
              name="folder-open-outline"
              size={16}
              color={activeMainTab === 'categories' ? colors.teal : colors.muted}
            />
            <Text style={[s.tabText, { color: colors.muted }, activeMainTab === 'categories' && { color: colors.text }]}>
              Categories
            </Text>
          </Pressable>

          <Pressable
            style={[s.tabButton, activeMainTab === 'recurring' && { borderBottomColor: colors.teal }]}
            onPress={() => setActiveMainTab('recurring')}
          >
            <Ionicons
              name="time-outline"
              size={16}
              color={activeMainTab === 'recurring' ? colors.teal : colors.muted}
            />
            <Text style={[s.tabText, { color: colors.muted }, activeMainTab === 'recurring' && { color: colors.text }]}>
              Recurring Templates
            </Text>
          </Pressable>
        </View>

        {/* CATEGORIES TAB */}
        {activeMainTab === 'categories' && (
          <View style={{ gap: 12 }}>
            <View style={[s.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.infoText, { color: colors.muted }]}>
                Manage your active spending categories. Changes sync directly with your database and update instantly in dropdowns.
              </Text>
            </View>

            <View style={[s.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={16} color={colors.muted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search categories by name"
                placeholderTextColor={colors.muted}
                style={[s.searchInput, { color: colors.text }]}
              />
            </View>

            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 0 }]}>
              {catLoading ? (
                <View style={s.centerPadding}><Text style={[s.body, { color: colors.text }]}>Loading categories...</Text></View>
              ) : filteredCategories.length === 0 ? (
                <View style={s.centerPadding}><Text style={[s.body, { color: colors.text }]}>No categories found</Text></View>
              ) : (
                filteredCategories.map((cat, idx) => (
                  <Pressable
                    key={cat.id}
                    style={[s.row, idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
                    onPress={() => handleOpenEditCategory(cat)}
                  >
                    <View style={s.iconCircle}>
                      <Ionicons name={(cat.icon as IconName) || 'pricetag-outline'} size={18} color={colors.teal} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.categoryName, { color: colors.text }]}>{cat.name}</Text>
                      <Text style={[s.small, { color: colors.muted }]}>Auto Inventory: {cat.autoInventory ? 'Enabled' : 'Disabled'}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                  </Pressable>
                ))
              )}
            </View>
          </View>
        )}

        {/* RECURRING TEMPLATES TAB */}
        {activeMainTab === 'recurring' && (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip label="Bills & Expenses" active={recurringSubTab === 'expense'} onPress={() => setRecurringSubTab('expense')} />
              <Chip label="Income Streams" active={recurringSubTab === 'income'} onPress={() => setRecurringSubTab('income')} />
            </View>

            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 0 }]}>
              {recLoading ? (
                <View style={s.centerPadding}><Text style={[s.body, { color: colors.text }]}>Loading templates...</Text></View>
              ) : filteredRecurring.length === 0 ? (
                <View style={s.centerPadding}>
                  <Text style={[s.body, { color: colors.text }]}>No recurring {recurringSubTab}s configured</Text>
                </View>
              ) : (
                filteredRecurring.map((item, idx) => (
                  <Pressable
                    key={item.id}
                    style={[s.row, idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
                    onPress={() => handleOpenEditRecurring(item)}
                  >
                    <View style={s.iconCircle}>
                      <Ionicons
                        name={recurringSubTab === 'expense' ? 'receipt-outline' : 'wallet-outline'}
                        size={18}
                        color={colors.teal}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.body, { color: colors.text }]}>{item.name}</Text>
                      <Text style={[s.small, { color: colors.muted }]}>
                        Expected monthly on day {item.expectedDay}
                        {item.merchantName ? ` · ${item.merchantName}` : ''}
                      </Text>
                    </View>
                    <Text style={[s.amount, { color: colors.text }, recurringSubTab === 'income' && { color: colors.teal }]}>
                      {recurringSubTab === 'income' ? '+' : ''}{peso(item.amount)}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                  </Pressable>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Category Modal with Delete Option */}
      <Modal visible={isCategoryModalOpen} transparent animationType="fade" onRequestClose={() => setIsCategoryModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsCategoryModalOpen(false)} />
          <View style={[s.dialog, { backgroundColor: colors.sidebar, borderColor: colors.border }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>{editingCategory ? 'Edit Category' : 'Add Category'}</Text>
            <Text style={[s.label, { color: colors.muted }]}>Category Name</Text>
            <TextInput
              value={categoryName}
              onChangeText={setCategoryName}
              placeholder="e.g. Clothing, Dining Out"
              placeholderTextColor={colors.muted}
              style={[s.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
            />
            <View style={s.toggleRow}>
              <Text style={[s.body, { color: colors.text }]}>Auto Inventory</Text>
              <Switch
                value={autoInventory}
                onValueChange={setAutoInventory}
                trackColor={{ false: colors.border, true: colors.teal }}
                thumbColor={colors.bg}
              />
            </View>
            <Text style={[s.label, { color: colors.muted }]}>Choose Icon</Text>
            <View style={s.iconGrid}>
              {CATEGORY_ICONS.map((icon) => {
                const isSelected = selectedIcon === icon;
                return (
                  <Pressable
                    key={icon}
                    style={[
                      s.iconBox,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      isSelected && { borderColor: colors.teal, borderWidth: 2, backgroundColor: 'rgba(22,186,197,0.12)' },
                    ]}
                    onPress={() => setSelectedIcon(icon)}
                  >
                    <Ionicons name={icon} size={20} color={isSelected ? colors.teal : colors.text} />
                  </Pressable>
                );
              })}
            </View>
            <View style={s.modalActions}>
              {editingCategory && (
                <Pressable style={s.deleteBtn} onPress={handleDeleteCategory}>
                  <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                  <Text style={s.deleteText}>Delete</Text>
                </Pressable>
              )}
              <View style={{ flex: 1 }} />
              <Pressable style={s.cancelBtn} onPress={() => setIsCategoryModalOpen(false)}>
                <Text style={[s.cancelText, { color: colors.muted }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[s.saveBtn, { backgroundColor: colors.teal }, !categoryName.trim() && { opacity: 0.4 }]}
                disabled={!categoryName.trim()}
                onPress={handleSaveCategory}
              >
                <Text style={[s.saveText, { color: colors.bg }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Recurring Modal */}
      <RecurringModal
        visible={isRecurringModalOpen}
        type={recurringSubTab}
        initialData={editingRecurring}
        onClose={() => setIsRecurringModalOpen(false)}
        onSave={handleSaveRecurring}
        onDelete={handleDeleteRecurring}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 22, gap: 14, width: '100%', maxWidth: 760, alignSelf: 'center' },
  breadcrumbs: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: -4 },
  breadcrumbLink: { fontFamily: fonts.medium, fontSize: 13 },
  breadcrumbCurrent: { fontFamily: fonts.regular, fontSize: 13 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fonts.medium, fontSize: 22 },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    gap: 24,
    marginTop: 4,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabText: { fontFamily: fonts.medium, fontSize: 14 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 99,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  addBtnText: { fontFamily: fonts.medium, fontSize: 13 },
  infoCard: { borderWidth: 1, borderRadius: 12, padding: 14 },
  infoText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 14,
    height: 40,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 14 },
  card: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  centerPadding: { padding: 24, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(22,186,197,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: { fontFamily: fonts.medium, fontSize: 15 },
  body: { fontFamily: fonts.medium, fontSize: 15 },
  small: { fontFamily: fonts.regular, fontSize: 12 },
  amount: { fontFamily: fonts.medium, fontSize: 14 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialog: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  modalTitle: { fontFamily: fonts.medium, fontSize: 18, marginBottom: 2 },
  label: { fontFamily: fonts.regular, fontSize: 12 },
  input: {
    fontFamily: fonts.regular,
    fontSize: 15,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
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