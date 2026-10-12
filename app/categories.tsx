import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CategoryModal } from '../components/CategoryModal';
import { colors, fonts } from '../constants/theme';
import { fetchCategories, createCategory, updateCategory, Category as ApiCategory } from '../services/api';

const defaultCatStyle = { color: colors.teal, bg: 'rgba(22,186,197,0.16)', icon: 'pricetag-outline' as React.ComponentProps<typeof Ionicons>['name'] };

function CategoryRow({ item, first, onPress }: { item: ApiCategory; first: boolean; onPress: () => void }) {
  // Use the icon from the DB, fallback to 'pricetag-outline' if not set
  const iconName = (item.icon as React.ComponentProps<typeof Ionicons>['name']) || 'pricetag-outline';

  return (
    <Pressable onPress={onPress} style={[s.row, !first && s.rowDivider]}>
      <View style={[s.icon, { backgroundColor: 'rgba(22,186,197,0.16)' }]}>
        <Ionicons name={iconName} size={18} color={colors.teal} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.body}>{item.name}</Text>
        <Text style={s.small}>
          Auto Inventory: {item.autoInventory ? 'Enabled' : 'Disabled'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </Pressable>
  );
}

export default function Categories() {
  const router = useRouter();
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const [modal, setModal] = useState<{ open: boolean; category?: ApiCategory }>({ open: false });

  const loadData = async () => {
    setLoading(true);
    const data = await fetchCategories();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, query]);

  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  const handleSave = async (values: any) => {
    if (modal.category) {
      const result = await updateCategory(modal.category.id, values);
      if (result) {
        loadData();
        setNotice(`Updated category successfully!`);
      }
    } else {
      const result = await createCategory(values);
      if (result) {
        loadData();
        setNotice(`Added category successfully!`);
      }
    }
    closeModal();
  };

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.header}>
          <Text style={s.title}>Categories</Text>
          <Pressable style={s.add} onPress={() => setModal({ open: true })}>
            <Ionicons name="add" size={18} color={colors.bg} />
            <Text style={s.addText}>Add Category</Text>
          </Pressable>
        </View>

        {notice && (
          <View style={s.notice}>
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.teal} />
            <Text style={[s.body, { flex: 1 }]}>{notice}</Text>
            <Pressable hitSlop={8} onPress={() => router.push('/expenses')}>
              <Text style={s.link}>View Expenses</Text>
            </Pressable>
          </View>
        )}

        <View style={s.card}>
          <Text style={s.body}>Manage your active spending categories here. Changes sync directly with your PostgreSQL database and will appear immediately in your expense dropdowns.</Text>
        </View>

        <View style={s.search}>
          <Ionicons name="search-outline" size={16} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search categories by name"
            placeholderTextColor={colors.muted}
            style={s.searchInput}
          />
        </View>

        {loading ? (
          <View style={[s.card, { alignItems: 'center', paddingVertical: 28 }]}>
            <Text style={s.body}>Loading categories...</Text>
          </View>
        ) : filteredCategories.length === 0 ? (
          <View style={[s.card, { alignItems: 'center', paddingVertical: 28 }]}>
            <Text style={s.body}>No categories found</Text>
            <Text style={s.small}>Tap Add Category to create a new one.</Text>
          </View>
        ) : (
          <View style={[s.card, { padding: 0 }]}>
            {filteredCategories.map((c, i) => (
              <CategoryRow
                key={c.id}
                item={c}
                first={i === 0}
                onPress={() => setModal({ open: true, category: c })}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* You can build a lightweight CategoryModal component mirroring ExpenseModal */}
      <CategoryModal visible={modal.open} category={modal.category} onClose={closeModal} onSave={handleSave} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, gap: 12, width: '100%', maxWidth: 760, alignSelf: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.text, fontFamily: fonts.medium, fontSize: 22 },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.teal,
    borderRadius: 99,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 16,
  },
  addText: { color: colors.bg, fontFamily: fonts.medium, fontSize: 14 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(22,186,197,0.14)',
    borderColor: colors.teal,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  link: { color: colors.teal, fontFamily: fonts.medium, fontSize: 13 },
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 14 },
  small: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12 },
  body: { color: colors.text, fontFamily: fonts.regular, fontSize: 14 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 14,
    height: 40,
  },
  searchInput: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  icon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});