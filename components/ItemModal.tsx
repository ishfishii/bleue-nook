import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { INVENTORY_CATEGORIES, type InventoryCategory, type InventoryItem } from '../constants/inventory';
import { colors, fonts } from '../constants/theme';
import { Chip } from './Chip';

export type ItemValues = { name: string; category: InventoryCategory | null; quantity: number };

type Props = {
  visible: boolean;
  item?: InventoryItem;
  onClose: () => void;
  onSave: (values: ItemValues) => void;
};

export function ItemModal({ visible, item, onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryCategory | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Fill the form every time the modal opens
  useEffect(() => {
    if (!visible || !item) return;
    setName(item.name);
    setCategory(item.category);
    setQuantity(item.quantity);
  }, [visible, item]);

  const canSave = name.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={s.dialog}>
          <View style={s.header}>
            <Text style={s.title}>Edit item</Text>
            <Pressable hitSlop={10} onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>

          <Text style={s.label}>Name</Text>
          <TextInput value={name} onChangeText={setName} placeholderTextColor={colors.muted} style={s.input} />

          <Text style={s.label}>Category</Text>
          <View style={s.chips}>
            {INVENTORY_CATEGORIES.map((c) => (
              // Tapping the selected category again puts the item back to "not sorted yet"
              <Chip key={c} label={c} active={category === c} onPress={() => setCategory(category === c ? null : c)} />
            ))}
          </View>
          {category === null && <Text style={s.hint}>Not sorted yet. Pick a category to file it.</Text>}

          <Text style={s.label}>How many do you have?</Text>
          <View style={s.stepper}>
            <Pressable style={s.stepBtn} hitSlop={6} onPress={() => setQuantity((q) => Math.max(0, q - 1))}>
              <Ionicons name="remove" size={20} color={colors.text} />
            </Pressable>
            <Text style={s.qty}>{quantity}</Text>
            <Pressable style={s.stepBtn} hitSlop={6} onPress={() => setQuantity((q) => q + 1)}>
              <Ionicons name="add" size={20} color={colors.text} />
            </Pressable>
          </View>

          <View style={s.actions}>
            <Pressable style={s.cancel} onPress={onClose}>
              <Text style={s.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[s.save, !canSave && { opacity: 0.4 }]}
              disabled={!canSave}
              onPress={() => onSave({ name: name.trim(), category, quantity })}
            >
              <Text style={s.saveText}>Save changes</Text>
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
  label: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, marginTop: 6 },
  hint: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12 },
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { color: colors.text, fontFamily: fonts.medium, fontSize: 18, minWidth: 44, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancel: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 99, borderColor: colors.border, borderWidth: 1 },
  cancelText: { color: colors.text, fontFamily: fonts.medium, fontSize: 14 },
  save: { flex: 1.5, alignItems: 'center', paddingVertical: 12, borderRadius: 99, backgroundColor: colors.teal },
  saveText: { color: colors.bg, fontFamily: fonts.medium, fontSize: 14 },
});
