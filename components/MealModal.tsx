import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { fonts } from '../constants/theme';

interface MealModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (mealType: string, mealData: {
    foodName: string;
    servings: number;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  }) => Promise<void>;
  defaultMealType?: string;
  editingItem?: any | null;
}

export default function MealModal({ visible, onClose, onSave, defaultMealType = 'breakfast', editingItem }: MealModalProps) {
  const { colors } = useTheme();

  const [mealType, setMealType] = useState(defaultMealType);
  const [foodName, setFoodName] = useState('');
  const [servings, setServings] = useState('1');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setMealType(editingItem.meal_type || 'breakfast');
      setFoodName(editingItem.food_name || '');
      setServings(String(editingItem.servings || 1));
      setCalories(String(editingItem.calories || ''));
      setProtein(String(editingItem.protein_g || ''));
      setCarbs(String(editingItem.carbs_g || ''));
      setFat(String(editingItem.fat_g || ''));
    } else {
      setMealType(defaultMealType);
      setFoodName('');
      setServings('1');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
    }
  }, [editingItem, visible, defaultMealType]);

  const handleSave = async () => {
    if (!foodName.trim()) return;
    setSaving(true);
    try {
      await onSave(mealType, {
        foodName: foodName.trim(),
        servings: Number(servings) || 1,
        calories: Number(calories) || 0,
        proteinG: Number(protein) || 0,
        carbsG: Number(carbs) || 0,
        fatG: Number(fat) || 0,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save meal item', err);
    } finally {
      setSaving(false);
    }
  };

  const mealCategories = [
    { label: 'Breakfast', value: 'breakfast' },
    { label: 'Lunch', value: 'lunch' },
    { label: 'Dinner', value: 'dinner' },
    { label: 'Snacks', value: 'snack' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: fonts.medium }]}>
              {editingItem ? 'Edit Meal Item' : 'Add Food Item'}
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.muted} />
            </Pressable>
          </View>

          <View style={{ gap: 12 }}>
            {/* Meal Category Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>Meal Category</Text>
              <View style={styles.categoryRow}>
                {mealCategories.map((cat) => {
                  const isSelected = mealType === cat.value;
                  return (
                    <Pressable
                      key={cat.value}
                      style={[
                        styles.categoryChip,
                        { borderColor: colors.border, backgroundColor: colors.bg },
                        isSelected && { backgroundColor: colors.teal, borderColor: colors.teal },
                      ]}
                      onPress={() => setMealType(cat.value)}
                    >
                      <Text style={[styles.categoryChipText, { color: isSelected ? '#ffffff' : colors.text }]}>
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>Food Name / Description</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                placeholder="e.g. Grilled Chicken Salad"
                placeholderTextColor={colors.muted}
                value={foodName}
                onChangeText={setFoodName}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.muted }]}>Servings</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                  keyboardType="numeric"
                  value={servings}
                  onChangeText={setServings}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.muted }]}>Calories (kcal)</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                  keyboardType="numeric"
                  value={calories}
                  onChangeText={setCalories}
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.muted }]}>Protein (g)</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                  keyboardType="numeric"
                  value={protein}
                  onChangeText={setProtein}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.muted }]}>Carbs (g)</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                  keyboardType="numeric"
                  value={carbs}
                  onChangeText={setCarbs}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.muted }]}>Fat (g)</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                  keyboardType="numeric"
                  value={fat}
                  onChangeText={setFat}
                />
              </View>
            </View>

            <Pressable
              style={[styles.saveBtn, { backgroundColor: colors.teal }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>{editingItem ? 'Save Changes' : 'Add to Log'}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 420, padding: 20, borderRadius: 12, borderWidth: 1, gap: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 16 },
  inputGroup: { gap: 4 },
  inputLabel: { fontSize: 12 },
  categoryRow: { flexDirection: 'row', gap: 6 },
  categoryChip: { flex: 1, paddingVertical: 8, borderWidth: 1, borderRadius: 8, alignItems: 'center' },
  categoryChipText: { fontSize: 12, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  formRow: { flexDirection: 'row', gap: 10 },
  saveBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
});