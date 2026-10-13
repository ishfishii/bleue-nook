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

import { fonts } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../constants/config';

type InventoryCategory = {
  id: string;
  name: string;
  icon: string;
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

export default function InventoryCategoriesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('pricetag-outline');

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/inventory-categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to fetch inventory categories:', err);
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
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: InventoryCategory) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setSelectedIcon(cat.icon || 'pricetag-outline');
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
        ? `${API_BASE_URL}/inventory-categories/${editingCategory.id}`
        : `${API_BASE_URL}/inventory-categories`;

      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: categoryName.trim(),
          icon: selectedIcon,
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
    <View style={[s.screen, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={s.content}>
        {/* Breadcrumbs Navigation */}
        <View style={s.breadcrumbs}>
          <Pressable onPress={() => router.push('/inventory')}>
            <Text style={[s.breadcrumbLink, { color: colors.teal }]}>Inventory</Text>
          </Pressable>
          <Ionicons name="chevron-forward" size={14} color={colors.muted} />
          <Text style={[s.breadcrumbCurrent, { color: colors.muted }]}>Categories</Text>
        </View>

        {/* Header */}
        <View style={s.headerRow}>
          <Text style={[s.title, { color: colors.text }]}>Categories</Text>
          <Pressable style={[s.addBtn, { backgroundColor: colors.teal }]} onPress={handleOpenAddModal}>
            <Ionicons name="add" size={16} color={colors.bg} />
            <Text style={[s.addBtnText, { color: colors.bg }]}>Add Category</Text>
          </Pressable>
        </View>

        {/* Info Banner */}
        <View style={[s.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.infoText, { color: colors.muted }]}>
            Manage your inventory categories here. Changes sync directly with your PostgreSQL database and will appear
            immediately across your household inventory items.
          </Text>
        </View>

        {/* Search Field */}
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

        {/* Categories List Card */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 0 }]}>
          {loading ? (
            <View style={s.centerPadding}>
              <Text style={[s.body, { color: colors.text }]}>Loading categories...</Text>
            </View>
          ) : filteredCategories.length === 0 ? (
            <View style={s.centerPadding}>
              <Text style={[s.body, { color: colors.text }]}>No categories found</Text>
            </View>
          ) : (
            filteredCategories.map((cat, idx) => (
              <Pressable
                key={cat.id}
                style={[s.categoryRow, idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
                onPress={() => handleOpenEditModal(cat)}
              >
                <View style={s.iconCircle}>
                  <Ionicons name={(cat.icon as IconName) || 'pricetag-outline'} size={18} color={colors.teal} />
                </View>
                <Text style={[s.categoryName, { color: colors.text }]}>{cat.name}</Text>
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

          <View style={[s.dialog, { backgroundColor: colors.sidebar, borderColor: colors.border }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>{editingCategory ? 'Edit Category' : 'Add Category'}</Text>

            <Text style={[s.label, { color: colors.muted }]}>Category Name</Text>
            <TextInput
              value={categoryName}
              onChangeText={setCategoryName}
              placeholder="e.g. Clothing, Pantry"
              placeholderTextColor={colors.muted}
              style={[s.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
            />

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
              <Pressable style={s.cancelBtn} onPress={handleCloseModal}>
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
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 22, gap: 12, width: '100%', maxWidth: 760, alignSelf: 'center' },
  breadcrumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: -4,
  },
  breadcrumbLink: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  breadcrumbCurrent: {
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fonts.medium, fontSize: 22 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 99,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  addBtnText: { fontFamily: fonts.medium, fontSize: 13 },
  infoCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
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
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(22,186,197,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: { flex: 1, fontFamily: fonts.medium, fontSize: 15 },
  body: { fontFamily: fonts.regular, fontSize: 14 },

  // Modal Styles
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
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
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