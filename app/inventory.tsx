import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Chip } from '../components/Chip';
import { ItemModal, type ItemValues } from '../components/ItemModal';
import { colors, fonts } from '../constants/theme';
import { fetchInventory, InventoryItem as ApiInventoryItem } from '../services/api';
import { API_BASE_URL } from '../constants/config';
import { fromISO } from '../lib/date';

type InventoryCategory = {
  id: string;
  name: string;
  icon: string;
};

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type StatusFilter = 'Active' | 'For Disposal' | 'Disposed';

// Helper for GMT+8 date formatting
const shortDate = (iso: string) => {
  if (!iso) return '';
  const date = new Date(iso);
  const gmt8Date = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const dateStr = gmt8Date.toISOString().split('T')[0];
  return fromISO(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

function Stat({ label, value, color, onPress }: { label: string; value: number; color?: string; onPress?: () => void }) {
  return (
    <Pressable style={s.stat} onPress={onPress} disabled={!onPress}>
      <Text style={s.small}>{label}</Text>
      <Text style={[s.big, color ? { color } : null]}>{value}</Text>
    </Pressable>
  );
}

function ItemRow({
  item,
  first,
  categoryObj,
  onPress,
  onStep,
}: {
  item: ApiInventoryItem;
  first: boolean;
  categoryObj?: InventoryCategory;
  onPress: () => void;
  onStep: (delta: number) => void;
}) {
  const iconName = (categoryObj?.icon as IconName) || 'pricetag-outline';
  const status = item.status === 'out' ? 'Out' : item.status === 'low' ? 'Low' : item.status === 'For Disposal' ? 'Disposal' : null;

  return (
    <Pressable onPress={onPress} style={[s.row, !first && s.rowDivider]}>
      <View style={[s.icon, categoryObj ? { backgroundColor: 'rgba(22,186,197,0.16)' } : s.iconDashed]}>
        <Ionicons name={categoryObj ? iconName : 'help-circle-outline'} size={18} color={categoryObj ? colors.teal : colors.muted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.body}>{item.name}</Text>
        <Text style={s.small}>
          {item.expirationDate ? `Exp: ${shortDate(item.expirationDate)}` : `Updated ${shortDate(item.updatedAt)}`}
          {item.category === null ? ' · tap to sort' : ''}
        </Text>
      </View>
      {status && (
        <View style={[s.status, item.status === 'For Disposal' && { borderColor: colors.teal }]}>
          <Text style={[s.statusText, item.status === 'For Disposal' && { color: colors.teal }]}>{status}</Text>
        </View>
      )}
      <View style={s.stepper}>
        <Pressable style={s.stepBtn} hitSlop={6} onPress={() => onStep(-1)}>
          <Ionicons name="remove" size={16} color={colors.text} />
        </Pressable>
        <Text style={s.qty}>{item.quantity}</Text>
        <Pressable style={s.stepBtn} hitSlop={6} onPress={() => onStep(1)}>
          <Ionicons name="add" size={16} color={colors.text} />
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function Inventory() {
  const router = useRouter();
  const [inventory, setInventory] = useState<ApiInventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Active');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<{ open: boolean; item?: ApiInventoryItem }>({ open: false });

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, catRes] = await Promise.all([
        fetchInventory(),
        fetch(`${API_BASE_URL}/inventory-categories`),
      ]);
      const catData = await catRes.json();
      setInventory(invData);
      setCategories(catData);
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const toSort = inventory.filter((i) => i.category === null && i.status !== 'Disposed').length;
  const low = inventory.filter((i) => (i.status === 'low' || i.status === 'out') && i.status !== 'Disposed').length;

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.name, c]));
  }, [categories]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = inventory.filter((i) => {
      if (statusFilter === 'Active' && (i.status === 'Disposed' || i.status === 'For Disposal')) return false;
      if (statusFilter === 'For Disposal' && i.status !== 'For Disposal') return false;
      if (statusFilter === 'Disposed' && i.status !== 'Disposed') return false;

      const inFilter = filter === 'All' || (filter === 'To sort' ? i.category === null : i.category === filter);
      return inFilter && (!q || i.name.toLowerCase().includes(q));
    });

    const categoryNames = categories.map((c) => c.name);
    const order: (string | null)[] = [null, ...categoryNames];
    return order
      .map((key) => ({
        key,
        items: visible.filter((i) => i.category === key).sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter((g) => g.items.length > 0);
  }, [inventory, categories, filter, statusFilter, query]);

  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  const handleUpdateQuantity = async (id: string, newQty: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  };

  const handleSaveModal = async (values: ItemValues) => {
    try {
      const url = modal.item?.id 
        ? `${API_BASE_URL}/inventory/${modal.item.id}` 
        : `${API_BASE_URL}/inventory`;
      
      const method = modal.item?.id ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Failed to save item:', err);
    }
    closeModal();
  };

  const filterOptions = ['All', 'To sort', ...categories.map((c) => c.name)];

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.headerRow}>
          <View style={s.titleGroup}>
            <Text style={s.title}>Inventory</Text>
            <Pressable 
              style={s.gearBtn} 
              hitSlop={8} 
              onPress={() => router.push('/inventory-categories')}
            >
              <Ionicons name="settings-outline" size={18} color={colors.muted} />
            </Pressable>
          </View>

          <Pressable style={s.addBtn} onPress={() => setModal({ open: true, item: undefined })}>
            <Ionicons name="add" size={16} color={colors.bg} />
            <Text style={s.addBtnText}>Add item</Text>
          </Pressable>
        </View>

        <View style={[s.card, s.summary]}>
          <Stat label="Items" value={inventory.filter(i => i.status !== 'Disposed').length} />
          <View style={s.vr} />
          <Stat label="Running low" value={low} color={low > 0 ? colors.sapphireText : undefined} />
          <View style={s.vr} />
          <Stat
            label="To sort"
            value={toSort}
            color={toSort > 0 ? colors.teal : undefined}
            onPress={() => { setFilter('To sort'); setStatusFilter('Active'); }}
          />
        </View>

        <View style={{ position: 'relative', zIndex: 100, elevation: 10 }}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <View style={[s.search, { flex: 1 }]}>
              <Ionicons name="search-outline" size={16} color={colors.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search inventory"
                placeholderTextColor={colors.muted}
                style={s.searchInput}
              />
            </View>

            <View style={{ position: 'relative' }}>
              <Pressable 
                style={s.statusDropdownBtn} 
                onPress={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              >
                <Ionicons name="filter-outline" size={14} color={colors.teal} />
                <Text style={s.statusDropdownBtnText}>{statusFilter}</Text>
                <Ionicons name="chevron-down" size={12} color={colors.muted} />
              </Pressable>

              {isStatusDropdownOpen && (
                <View style={s.dropdown}>
                  {(['Active', 'For Disposal', 'Disposed'] as StatusFilter[]).map((st) => (
                    <Pressable
                      key={st}
                      style={[s.dropdownItem, statusFilter === st && { backgroundColor: 'rgba(22,186,197,0.1)' }]}
                      onPress={() => {
                        setStatusFilter(st);
                        setIsStatusDropdownOpen(false);
                      }}
                    >
                      <Text style={[s.dropdownText, statusFilter === st && { color: colors.teal }]}>{st}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {filterOptions.map((f) => (
            <Chip
              key={f}
              label={f === 'To sort' && toSort > 0 ? `To sort (${toSort})` : f}
              active={filter === f}
              onPress={() => setFilter(f)}
            />
          ))}
        </ScrollView>

        {loading ? (
          <View style={[s.card, { alignItems: 'center', paddingVertical: 28 }]}>
            <Text style={s.body}>Loading inventory from database...</Text>
          </View>
        ) : groups.length === 0 ? (
          <View style={[s.card, { alignItems: 'center', paddingVertical: 28 }]}>
            <Text style={s.body}>No items found</Text>
            <Text style={s.small}>Try changing your category or status filter.</Text>
          </View>
        ) : (
          groups.map(({ key, items }) => {
            const catObj = key ? categoryMap.get(key) : undefined;
            return (
              <View key={key ?? 'to-sort'}>
                <View style={s.groupHeader}>
                  <Text style={[s.small, key === null && { color: colors.teal }]}>{key ?? 'To sort'}</Text>
                  <Text style={s.small}>{items.length}</Text>
                </View>
                <View style={[s.card, { padding: 0 }]}>
                  {items.map((item, i) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      first={i === 0}
                      categoryObj={catObj}
                      onPress={() => setModal({ open: true, item })}
                      onStep={(delta) => handleUpdateQuantity(item.id, Math.max(0, item.quantity + delta))}
                    />
                  ))}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <ItemModal visible={modal.open} item={modal.item} onClose={closeModal} onSave={handleSaveModal} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, gap: 12, width: '100%', maxWidth: 760, alignSelf: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: colors.text, fontFamily: fonts.medium, fontSize: 22 },
  gearBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 14 },
  summary: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  vr: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border },
  big: { color: colors.text, fontFamily: fonts.medium, fontSize: 24, marginTop: 2 },
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
    backgroundColor: colors.card,
  },
  searchInput: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 14 },
  statusDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  statusDropdownBtnText: { color: colors.text, fontFamily: fonts.medium, fontSize: 13 },
  dropdown: {
    position: 'absolute',
    top: 46,
    right: 0,
    width: 140,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    zIndex: 999,
    elevation: 10,
  },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  dropdownText: { color: colors.text, fontSize: 13, fontFamily: fonts.regular },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, marginBottom: 6, paddingHorizontal: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  icon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  iconDashed: { borderColor: colors.muted, borderWidth: 1, borderStyle: 'dashed' },
  status: { borderColor: colors.sapphire, borderWidth: 1, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 2 },
  statusText: { color: colors.sapphireText, fontFamily: fonts.regular, fontSize: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { color: colors.text, fontFamily: fonts.medium, fontSize: 14, minWidth: 24, textAlign: 'center' },
});