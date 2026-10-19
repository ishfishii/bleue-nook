import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Chip } from '../components/Chip';
import { ItemModal, type ItemValues } from '../components/ItemModal';
import { fonts } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { fetchInventory, getAuthHeaders, InventoryItem as ApiInventoryItem } from '../services/api';
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
  const { colors } = useTheme();
  return (
    <Pressable style={s.stat} onPress={onPress} disabled={!onPress}>
      <Text style={[s.small, { color: colors.muted }]}>{label}</Text>
      <Text style={[s.big, { color: colors.text }, color ? { color } : null]}>{value}</Text>
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
  const { colors } = useTheme();
  const iconName = (categoryObj?.icon as IconName) || 'pricetag-outline';
  const itemStatusLower = (item.status || '').toLowerCase();
  const status = itemStatusLower === 'out' ? 'Out' : itemStatusLower === 'low' ? 'Low' : itemStatusLower === 'for disposal' ? 'Disposal' : null;

  return (
    <Pressable onPress={onPress} style={[s.row, !first && { borderTopWidth: 1, borderTopColor: colors.border }]}>
      <View style={[s.icon, { backgroundColor: categoryObj ? 'rgba(22,186,197,0.16)' : 'transparent', borderColor: categoryObj ? undefined : colors.muted, borderWidth: categoryObj ? 0 : 1, borderStyle: categoryObj ? 'solid' : 'dashed' }]}>
        <Ionicons name={categoryObj ? iconName : 'help-circle-outline'} size={18} color={categoryObj ? colors.teal : colors.muted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.body, { color: colors.text }]}>{item.name}</Text>
        <Text style={[s.small, { color: colors.muted }]}>
          {item.expirationDate ? `Exp: ${shortDate(item.expirationDate)}` : `Updated ${shortDate(item.updatedAt)}`}
          {item.category === null ? ' · tap to sort' : ''}
        </Text>
      </View>
      {status && (
        <View style={[s.status, { borderColor: colors.sapphire }, itemStatusLower === 'for disposal' && { borderColor: colors.teal }]}>
          <Text style={[s.statusText, { color: colors.sapphireText }, itemStatusLower === 'for disposal' && { color: colors.teal }]}>{status}</Text>
        </View>
      )}
      <View style={s.stepper}>
        <Pressable style={[s.stepBtn, { borderColor: colors.border }]} hitSlop={6} onPress={() => onStep(-1)}>
          <Ionicons name="remove" size={16} color={colors.text} />
        </Pressable>
        <Text style={[s.qty, { color: colors.text }]}>{item.quantity}</Text>
        <Pressable style={[s.stepBtn, { borderColor: colors.border }]} hitSlop={6} onPress={() => onStep(1)}>
          <Ionicons name="add" size={16} color={colors.text} />
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function Inventory() {
  const router = useRouter();
  const { colors } = useTheme();
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
      const headers = await getAuthHeaders();
      const [invData, catRes] = await Promise.all([
        fetchInventory(),
        fetch(`${API_BASE_URL}/inventory-categories`, { headers }),
      ]);
      const catData = await catRes.json();
      setInventory(Array.isArray(invData) ? invData : []);
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (err) {
      console.error('Failed to load inventory data:', err);
      setInventory([]);
      setCategories([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeInventory = Array.isArray(inventory) ? inventory : [];

  const toSort = safeInventory.filter((i) => i.category === null && (i.status || 'Active').toLowerCase() !== 'disposed').length;
  const low = safeInventory.filter((i) => {
    const st = (i.status || '').toLowerCase();
    return (st === 'low' || st === 'out') && st !== 'disposed';
  }).length;

  const categoryMap = useMemo(() => {
    return new Map(safeCategories.map((c) => [c.name, c]));
  }, [safeCategories]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = safeInventory.filter((i) => {
      const itemStatus = (i.status || 'Active').toLowerCase();
      if (statusFilter === 'Active' && (itemStatus === 'disposed' || itemStatus === 'for disposal')) return false;
      if (statusFilter === 'For Disposal' && itemStatus !== 'for disposal') return false;
      if (statusFilter === 'Disposed' && itemStatus !== 'disposed') return false;

      const inFilter = filter === 'All' || (filter === 'To sort' ? i.category === null : i.category === filter);
      return inFilter && (!q || i.name.toLowerCase().includes(q));
    });

    const categoryNames = safeCategories.map((c) => c.name);
    const order: (string | null)[] = [null, ...categoryNames];
    return order
      .map((key) => ({
        key,
        items: visible.filter((i) => i.category === key).sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter((g) => g.items.length > 0);
  }, [safeInventory, safeCategories, filter, statusFilter, query]);

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

  const filterOptions = ['All', 'To sort', ...safeCategories.map((c) => c.name)];

  return (
    <View style={[s.screen, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.headerRow}>
          <View style={s.titleGroup}>
            <Text style={[s.title, { color: colors.text }]}>Inventory</Text>
            <Pressable 
              style={[s.gearBtn, { backgroundColor: colors.card, borderColor: colors.border }]} 
              hitSlop={8} 
              onPress={() => router.push('/inventory-categories')}
            >
              <Ionicons name="settings-outline" size={18} color={colors.muted} />
            </Pressable>
          </View>

          <Pressable style={[s.addBtn, { backgroundColor: colors.teal }]} onPress={() => setModal({ open: true, item: undefined })}>
            <Ionicons name="add" size={16} color={colors.bg} />
            <Text style={[s.addBtnText, { color: colors.bg }]}>Add item</Text>
          </Pressable>
        </View>

        <View style={[s.card, s.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Stat label="Items" value={safeInventory.filter(i => (i.status || 'Active').toLowerCase() !== 'disposed').length} />
          <View style={[s.vr, { backgroundColor: colors.border }]} />
          <Stat label="Running low" value={low} color={low > 0 ? colors.sapphireText : undefined} />
          <View style={[s.vr, { backgroundColor: colors.border }]} />
          <Stat
            label="To sort"
            value={toSort}
            color={toSort > 0 ? colors.teal : undefined}
            onPress={() => { setFilter('To sort'); setStatusFilter('Active'); }}
          />
        </View>

        <View style={{ position: 'relative', zIndex: 100, elevation: 10 }}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <View style={[s.search, { flex: 1, backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={16} color={colors.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search inventory"
                placeholderTextColor={colors.muted}
                style={[s.searchInput, { color: colors.text }]}
              />
            </View>

            <View style={{ position: 'relative' }}>
              <Pressable 
                style={[s.statusDropdownBtn, { backgroundColor: colors.card, borderColor: colors.border }]} 
                onPress={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              >
                <Ionicons name="filter-outline" size={14} color={colors.teal} />
                <Text style={[s.statusDropdownBtnText, { color: colors.text }]}>{statusFilter}</Text>
                <Ionicons name="chevron-down" size={12} color={colors.muted} />
              </Pressable>

              {isStatusDropdownOpen && (
                <View style={[s.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {(['Active', 'For Disposal', 'Disposed'] as StatusFilter[]).map((st) => (
                    <Pressable
                      key={st}
                      style={[s.dropdownItem, { borderBottomColor: colors.border }, statusFilter === st && { backgroundColor: 'rgba(22,186,197,0.1)' }]}
                      onPress={() => {
                        setStatusFilter(st);
                        setIsStatusDropdownOpen(false);
                      }}
                    >
                      <Text style={[s.dropdownText, { color: colors.text }, statusFilter === st && { color: colors.teal }]}>{st}</Text>
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
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: 'center', paddingVertical: 28 }]}>
            <Text style={[s.body, { color: colors.text }]}>Loading inventory from database...</Text>
          </View>
        ) : groups.length === 0 ? (
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: 'center', paddingVertical: 28 }]}>
            <Text style={[s.body, { color: colors.text }]}>No items found</Text>
            <Text style={[s.small, { color: colors.muted }]}>Try changing your category or status filter.</Text>
          </View>
        ) : (
          groups.map(({ key, items }) => {
            const catObj = key ? categoryMap.get(key) : undefined;
            return (
              <View key={key ?? 'to-sort'}>
                <View style={s.groupHeader}>
                  <Text style={[s.small, { color: colors.muted }, key === null && { color: colors.teal }]}>{key ?? 'To sort'}</Text>
                  <Text style={[s.small, { color: colors.muted }]}>{items.length}</Text>
                </View>
                <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 0 }]}>
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
  screen: { flex: 1 },
  content: { padding: 22, gap: 12, width: '100%', maxWidth: 760, alignSelf: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontFamily: fonts.medium, fontSize: 22 },
  gearBtn: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 99,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  addBtnText: { fontFamily: fonts.medium, fontSize: 13 },
  card: { borderWidth: 1, borderRadius: 12, padding: 14 },
  summary: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  vr: { width: 1, alignSelf: 'stretch' },
  big: { fontFamily: fonts.medium, fontSize: 24, marginTop: 2 },
  small: { fontFamily: fonts.regular, fontSize: 12 },
  body: { fontFamily: fonts.regular, fontSize: 14 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 14,
    height: 40,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 14 },
  statusDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 99,
    borderWidth: 1,
  },
  statusDropdownBtnText: { fontFamily: fonts.medium, fontSize: 13 },
  dropdown: {
    position: 'absolute',
    top: 46,
    right: 0,
    width: 140,
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    zIndex: 999,
    elevation: 10,
  },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1 },
  dropdownText: { fontSize: 13, fontFamily: fonts.regular },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, marginBottom: 6, paddingHorizontal: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  icon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  status: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 2 },
  statusText: { fontFamily: fonts.regular, fontSize: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { fontFamily: fonts.medium, fontSize: 14, minWidth: 24, textAlign: 'center' },
});