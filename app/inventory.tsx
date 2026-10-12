import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Chip } from '../components/Chip';
import { ItemModal, type ItemValues } from '../components/ItemModal';
import { colors, fonts } from '../constants/theme';
import { fetchInventory, InventoryItem as ApiInventoryItem } from '../services/api';
import { API_BASE_URL } from '../constants/config';
import { fromISO } from '../lib/date';

const INVENTORY_CATEGORIES = ['Food', 'Toiletries', 'Cleaning supplies', 'Electronics', 'Others'] as const;
type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number];

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type Filter = 'All' | 'To sort' | InventoryCategory;

const FILTERS: Filter[] = ['All', 'To sort', ...INVENTORY_CATEGORIES];

const catStyle: Record<InventoryCategory, { color: string; bg: string; icon: IconName }> = {
  Food: { color: colors.teal, bg: 'rgba(22,186,197,0.16)', icon: 'nutrition-outline' },
  Toiletries: { color: colors.maya, bg: 'rgba(95,191,249,0.16)', icon: 'water-outline' },
  'Cleaning supplies': { color: colors.sapphireText, bg: 'rgba(88,99,248,0.2)', icon: 'sparkles-outline' },
  Electronics: { color: colors.text, bg: 'rgba(239,233,244,0.12)', icon: 'battery-charging-outline' },
  Others: { color: colors.muted, bg: 'rgba(154,168,166,0.14)', icon: 'cube-outline' },
};

const shortDate = (iso: string) => {
  if (!iso) return '';
  const dateStr = iso.split('T')[0];
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
  onPress,
  onStep,
}: {
  item: ApiInventoryItem;
  first: boolean;
  onPress: () => void;
  onStep: (delta: number) => void;
}) {
  const c = item.category && item.category in catStyle ? catStyle[item.category as InventoryCategory] : null;
  const status = item.status === 'out' ? 'Out' : item.status === 'low' ? 'Low' : null;

  return (
    <Pressable onPress={onPress} style={[s.row, !first && s.rowDivider]}>
      <View style={[s.icon, c ? { backgroundColor: c.bg } : s.iconDashed]}>
        <Ionicons name={c ? c.icon : 'help-circle-outline'} size={18} color={c ? c.color : colors.muted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.body}>{item.name}</Text>
        <Text style={s.small}>
          Updated {shortDate(item.updatedAt)}
          {item.category === null ? ' · tap to sort' : ''}
        </Text>
      </View>
      {status && (
        <View style={s.status}>
          <Text style={s.statusText}>{status}</Text>
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
  const [inventory, setInventory] = useState<ApiInventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<Filter>('All');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<{ open: boolean; item?: ApiInventoryItem }>({ open: false });

  const loadInventory = async () => {
    setLoading(true);
    const data = await fetchInventory();
    setInventory(data);
    setLoading(false);
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const toSort = inventory.filter((i) => i.category === null).length;
  const low = inventory.filter((i) => i.status === 'low' || i.status === 'out').length;

  // Filter, then group: "to sort" first, then each category
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = inventory.filter((i) => {
      const inFilter = filter === 'All' || (filter === 'To sort' ? i.category === null : i.category === filter);
      return inFilter && (!q || i.name.toLowerCase().includes(q));
    });
    const order: (InventoryCategory | null)[] = [null, ...INVENTORY_CATEGORIES];
    return order
      .map((key) => ({
        key,
        items: visible.filter((i) => i.category === key).sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter((g) => g.items.length > 0);
  }, [inventory, filter, query]);

  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  const handleUpdateQuantity = async (id: string, newQty: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (res.ok) {
        loadInventory(); // Refresh live items
      }
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  };

  const handleSaveModal = async (values: ItemValues) => {
    if (modal.item) {
      try {
        const res = await fetch(`${API_BASE_URL}/inventory/${modal.item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        if (res.ok) {
          loadInventory();
        }
      } catch (err) {
        console.error('Failed to update item metadata:', err);
      }
    }
    closeModal();
  };

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Inventory (Live DB)</Text>

        <View style={[s.card, s.summary]}>
          <Stat label="Items" value={inventory.length} />
          <View style={s.vr} />
          <Stat label="Running low" value={low} color={low > 0 ? colors.sapphireText : undefined} />
          <View style={s.vr} />
          <Stat
            label="To sort"
            value={toSort}
            color={toSort > 0 ? colors.teal : undefined}
            onPress={() => setFilter('To sort')}
          />
        </View>

        <View style={s.search}>
          <Ionicons name="search-outline" size={16} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search inventory"
            placeholderTextColor={colors.muted}
            style={s.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {FILTERS.map((f) => (
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
            <Text style={s.body}>{inventory.length === 0 ? 'Nothing in your inventory yet' : 'No items here'}</Text>
            <Text style={s.small}>
              {inventory.length === 0 ? 'Groceries logged under Expenses show up here.' : 'Try a different filter.'}
            </Text>
          </View>
        ) : (
          groups.map(({ key, items }) => (
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
                    onPress={() => setModal({ open: true, item })}
                    onStep={(delta) => handleUpdateQuantity(item.id, Math.max(0, item.quantity + delta))}
                  />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <ItemModal visible={modal.open} item={modal.item} onClose={closeModal} onSave={handleSaveModal} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, gap: 12, width: '100%', maxWidth: 760, alignSelf: 'center' },
  title: { color: colors.text, fontFamily: fonts.medium, fontSize: 22 },
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
  },
  searchInput: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 14 },
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