import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import { Switch } from 'react-native';

import { colors, fonts } from '../constants/theme';
import { API_BASE_URL } from '../constants/config';

type ExpenseCategory = {
  id: string;
  name: string;
  icon: string;
  autoInventory: boolean;
};

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORY_ICONS: IconName[] = [
  'cart-outline',
  'flash-outline',
  'cafe-outline',
  'pricetag-outline',
  'wallet-outline',
  'car-outline',
  'home-outline',
  'heart-outline',
  'gift-outline',
  'medical-outline',
  'fast-food-outline',
  'airplane-outline',
  'shirt-outline',
  'book-outline',
  'construct-outline',
  'laptop-outline',
  'grid-outline',
  'layers-outline',
  'ellipsis-horizontal-outline',
  'cube-outline',
  'archive-outline',
  'options-outline',
];

export default function ExpenseCategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('pricetag-outline');
  const [autoInventory, setAutoInventory] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to fetch expense categories:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setCategoryName('');
    setSelectedIcon('pricetag-outline');
    setAutoInventory(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: ExpenseCategory) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setSelectedIcon(cat.icon || 'pricetag-outline');
    setAutoInventory(cat.autoInventory ?? false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) return;

    try {
      const url = editingCategory
        ? `${API_BASE_URL}/categories/${editingCategory.id}`
        : `${API_BASE_URL}/categories`;

      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: categoryName.trim(),
          icon: selectedIcon,
          autoInventory,
        }),
      });

      if (res.ok) {
        handleCloseModal();
        loadCategories();
      }
    } catch (err) {
      console.error('Failed to save category:', err);
    }
  };

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        {/* Breadcrumbs Navigation */}
        <View style={s.breadcrumbs}>
          <Pressable onPress={() => router.push('/expenses')}>
            <Text style={s.breadcrumbLink}>Expenses</Text>
          </Pressable>
          <Ionicons name="chevron-forward" size={14} color={colors.muted} />
          <Text style={s.breadcrumbCurrent}>Categories</Text>
        </View>

        {/* Header */}
        <View style={s.headerRow}>
          <Text style={s.title}>Categories</Text>
          <Pressable style={s.addBtn} onPress={handleOpenAddModal}>
            <Ionicons name="add" size={16} color={colors.bg} />
            <Text style={s.addBtnText}>Add Category</Text>
          </Pressable>
        </View>

        {/* Info Banner */}
        <View style={s.infoCard}>
          <Text style={s.infoText}>
            Manage your active spending categories here. Changes sync directly with your PostgreSQL database and will appear
            immediately in your expense dropdowns.
          </Text>
        </View>

        {/* Search Field */}
        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={16} color={colors.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search categories by name"
            placeholderTextColor={colors.muted}
            style={s.searchInput}
          />
        </View>

        {/* Categories List Card */}
        <View style={[s.card, { padding: 0 }]}>
          {loading ? (
            <View style={s.centerPadding}>
              <Text style={s.body}>Loading categories...</Text>
            </View>
          ) : filteredCategories.length === 0 ? (
            <View style={s.centerPadding}>
              <Text style={s.body}>No categories found</Text>
            </View>
          ) : (
            filteredCategories.map((cat, idx) => (
              <Pressable
                key={cat.id}
                style={[s.categoryRow, idx > 0 && s.divider]}
                onPress={() => handleOpenEditModal(cat)}
              >
                <View style={s.iconCircle}>
                  <Ionicons name={(cat.icon as IconName) || 'pricetag-outline'} size={18} color={colors.teal} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.categoryName}>{cat.name}</Text>
                  <Text style={s.small}>Auto Inventory: {cat.autoInventory ? 'Enabled' : 'Disabled'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      {/* Edit / Add Category Modal */}
      <Modal visible={isModalOpen} transparent animationType="fade" onRequestClose={handleCloseModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseModal} />

          <View style={s.dialog}>
            <Text style={s.modalTitle}>{editingCategory ? 'Edit Category' : 'Add Category'}</Text>

            <Text style={s.label}>Category Name</Text>
            <TextInput
              value={categoryName}
              onChangeText={setCategoryName}
              placeholder="e.g. Clothing, Dining Out"
              placeholderTextColor={colors.muted}
              style={s.input}
            />

            <View style={s.toggleRow}>
              <Text style={s.body}>Auto Inventory</Text>
              <Switch
                value={autoInventory}
                onValueChange={setAutoInventory}
                trackColor={{ false: colors.border, true: colors.teal }}
                thumbColor={colors.bg}
              />
            </View>

            <Text style={s.label}>Choose Icon</Text>
            <View style={s.iconGrid}>
              {CATEGORY_ICONS.map((icon) => {
                const isSelected = selectedIcon === icon;
                return (
                  <Pressable
                    key={icon}
                    style={[s.iconBox, isSelected && s.iconBoxSelected]}
                    onPress={() => setSelectedIcon(icon)}
                  >
                    <Ionicons name={icon} size={20} color={isSelected ? colors.teal : colors.text} />
                  </Pressable>
                );
              })}
            </View>

            <View style={s.modalActions}>
              <Pressable style={s.cancelBtn} onPress={handleCloseModal}>
                <Text style={s.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[s.saveBtn, !categoryName.trim() && { opacity: 0.4 }]}
                disabled={!categoryName.trim()}
                onPress={handleSaveCategory}
              >
                <Text style={s.saveText}>Save</Text>
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
  breadcrumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: -4,
  },
  breadcrumbLink: {
    color: colors.teal,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  breadcrumbCurrent: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.text, fontFamily: fonts.medium, fontSize: 22 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.teal,
    borderRadius: 99,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  addBtnText: { color: colors.bg, fontFamily: fonts.medium, fontSize: 13 },
  infoCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  infoText: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 14,
    height: 40,
    backgroundColor: colors.card,
  },
  searchInput: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 14 },
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  centerPadding: { padding: 24, alignItems: 'center' },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(22,186,197,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: { color: colors.text, fontFamily: fonts.medium, fontSize: 15 },
  body: { color: colors.text, fontFamily: fonts.regular, fontSize: 14 },
  small: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12 },

  // Modal Styles
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialog: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.sidebar,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  modalTitle: { color: colors.text, fontFamily: fonts.medium, fontSize: 18, marginBottom: 2 },
  label: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12 },
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
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSelected: {
    borderColor: colors.teal,
    borderWidth: 2,
    backgroundColor: 'rgba(22,186,197,0.12)',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, justifyContent: 'center' },
  cancelText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 14 },
  saveBtn: {
    backgroundColor: colors.teal,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: colors.bg, fontFamily: fonts.medium, fontSize: 14 },
});