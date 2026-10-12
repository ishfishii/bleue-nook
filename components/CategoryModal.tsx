import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View, Switch } from 'react-native';
import { colors, fonts } from '../constants/theme';
import { Category } from '../services/api';

interface CategoryModalProps {
  visible: boolean;
  category?: Category;
  onClose: () => void;
  onSave: (values: { name: string; autoInventory: boolean; icon: string }) => void;
}

const AVAILABLE_ICONS: React.ComponentProps<typeof Ionicons>['name'][] = [
  'cart-outline',
  'flash-outline',
  'cafe-outline',
  'pricetag-outline',
  'wallet-outline',
  'car-outline',
  'home-outline',
  'fitness-outline',
  'gift-outline',
  'medkit-outline',
  'fast-food-outline',
  'airplane-outline',
  'shirt-outline',
  'book-outline',
  'construct-outline',
  'laptop-outline',
];

export function CategoryModal({ visible, category, onClose, onSave }: CategoryModalProps) {
  const [name, setName] = useState('');
  const [autoInventory, setAutoInventory] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<string>('pricetag-outline');

  useEffect(() => {
    if (category) {
      setName(category.name);
      setAutoInventory(category.autoInventory);
      setSelectedIcon((category as any).icon || 'pricetag-outline');
    } else {
      setName('');
      setAutoInventory(false);
      setSelectedIcon('pricetag-outline');
    }
  }, [category, visible]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), autoInventory, icon: selectedIcon });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.modal}>
          <Text style={s.title}>{category ? 'Edit Category' : 'Add Category'}</Text>

          <View style={s.field}>
            <Text style={s.label}>Category Name</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Utilities"
              placeholderTextColor={colors.muted}
            />
          </View>

          <View style={s.switchRow}>
            <Text style={s.label}>Auto Inventory</Text>
            <Switch
              value={autoInventory}
              onValueChange={setAutoInventory}
              trackColor={{ false: colors.border, true: colors.teal }}
              thumbColor={colors.bg}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Choose Icon</Text>
            <View style={s.iconGrid}>
              {AVAILABLE_ICONS.map((iconName) => {
                const isSelected = selectedIcon === iconName;
                return (
                  <Pressable
                    key={iconName}
                    style={[s.iconOption, isSelected && s.iconSelected]}
                    onPress={() => setSelectedIcon(iconName)}
                  >
                    <Ionicons
                      name={iconName}
                      size={20}
                      color={isSelected ? colors.teal : colors.text}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={s.actions}>
            <Pressable style={[s.btn, s.cancelBtn]} onPress={onClose}>
              <Text style={s.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[s.btn, s.saveBtn]} onPress={handleSave}>
              <Text style={s.saveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 20, width: '100%', maxWidth: 420, gap: 14 },
  title: { color: colors.text, fontFamily: fonts.medium, fontSize: 18 },
  field: { gap: 6 },
  label: { color: colors.text, fontFamily: fonts.regular, fontSize: 13 },
  input: { backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, height: 40, color: colors.text, fontFamily: fonts.regular, fontSize: 14 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 4 },
  iconOption: { width: 40, height: 40, borderRadius: 8, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  iconSelected: { borderColor: colors.teal, backgroundColor: 'rgba(22,186,197,0.14)' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  btn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  cancelBtn: { backgroundColor: 'transparent' },
  cancelText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 14 },
  saveBtn: { backgroundColor: colors.teal },
  saveText: { color: colors.bg, fontFamily: fonts.medium, fontSize: 14 },
});