import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { fonts } from '../constants/theme';
import MealModal from '../components/MealModal';

interface MealItem {
  id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_name: string;
  brand?: string;
  servings: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

interface LogData {
  dailyLog: {
    id: string;
    log_date: string;
  };
  meals: MealItem[];
}

export default function NutritionDashboard() {
  const { colors } = useTheme();
  
  const [selectedDateObj, setSelectedDateObj] = useState<Date>(new Date());
  const selectedDate = selectedDateObj.toISOString().split('T')[0];

  const [profile, setProfile] = useState<any>(null);
  const [logData, setLogData] = useState<LogData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack'>('all');

  // AI Suggestion Modal State
  const [suggestModalVisible, setSuggestModalVisible] = useState(false);
  const [activeMealType, setActiveMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [suggesting, setSuggesting] = useState(false);

  // Manual Add / Edit Modal State
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MealItem | null>(null);

  const loadNutritionData = async () => {
    setLoading(true);
    try {
      const [userProfile, dailyLogRes] = await Promise.all([
        api.getUserProfile(),
        api.getDailyLog(selectedDate),
      ]);
      setProfile(userProfile);
      setLogData(dailyLogRes);
    } catch (err) {
      console.error('Failed to load nutrition data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNutritionData();
  }, [selectedDate]);

  const handlePrevDay = () => {
    const prev = new Date(selectedDateObj);
    prev.setDate(prev.getDate() - 1);
    setSelectedDateObj(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDateObj);
    next.setDate(next.getDate() + 1);
    setSelectedDateObj(next);
  };

  const formattedDateLabel = selectedDateObj.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Calculate totals
  const meals = logData?.meals || [];
  const consumedCals = meals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0);
  const consumedProtein = meals.reduce((sum, m) => sum + (Number(m.protein_g) || 0), 0);
  const consumedCarbs = meals.reduce((sum, m) => sum + (Number(m.carbs_g) || 0), 0);
  const consumedFat = meals.reduce((sum, m) => sum + (Number(m.fat_g) || 0), 0);

  const targetCals = profile?.target_calories || 2000;
  const targetProtein = profile?.target_protein_g || 120;
  const targetCarbs = profile?.target_carbs_g || 200;
  const targetFat = profile?.target_fat_g || 60;

  const remainingCals = targetCals - consumedCals;
  const remainingProtein = targetProtein - consumedProtein;
  const remainingCarbs = targetCarbs - consumedCarbs;
  const remainingFat = targetFat - consumedFat;

  // Filter meals based on search query and chip category
  const filteredMeals = meals.filter((item) => {
    const matchesSearch = item.food_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeFilter === 'all' || item.meal_type === activeFilter;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormModalVisible(true);
  };

  const handleOpenEditModal = (item: MealItem) => {
    setEditingItem(item);
    setFormModalVisible(true);
  };

  const handleSaveMealForm = async (targetMealType: string, mealData: any) => {
    const payload = {
      date: selectedDate,
      mealType: targetMealType,
      ...mealData,
    };

    if (editingItem) {
      await api.updateMealItem(editingItem.id, mealData);
    } else {
      await api.logMealItem(payload);
    }
    loadNutritionData();
  };

  const handleOpenAiSuggest = async () => {
    setSuggestModalVisible(true);
    setSuggesting(true);
    setAiSuggestion(null);

    try {
      const suggestion = await api.suggestMeal({
        mealType: activeMealType,
        remainingCalories: remainingCals,
        remainingProtein,
        remainingCarbs,
        remainingFat,
      });
      setAiSuggestion(suggestion);
    } catch (err) {
      console.error('Failed to fetch AI meal suggestion', err);
    } finally {
      setSuggesting(false);
    }
  };

  const handleLogAiSuggestion = async () => {
    if (!aiSuggestion) return;
    try {
      await api.logMealItem({
        date: selectedDate,
        mealType: activeMealType,
        foodName: aiSuggestion.food_name,
        servings: aiSuggestion.servings,
        calories: aiSuggestion.calories,
        proteinG: aiSuggestion.protein_g,
        carbsG: aiSuggestion.carbs_g,
        fatG: aiSuggestion.fat_g,
      });
      setSuggestModalVisible(false);
      loadNutritionData();
    } catch (err) {
      console.error('Failed to log suggested meal', err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await api.deleteMealItem(itemId);
      loadNutritionData();
    } catch (err) {
      console.error('Failed to delete meal item', err);
    }
  };

  const getMealIcon = (type: string) => {
    switch (type) {
      case 'breakfast': return 'cafe-outline';
      case 'lunch': return 'restaurant-outline';
      case 'dinner': return 'moon-outline';
      default: return 'nutrition-outline';
    }
  };

  const mealCategories = [
    { label: 'Breakfast', value: 'breakfast' },
    { label: 'Lunch', value: 'lunch' },
    { label: 'Dinner', value: 'dinner' },
    { label: 'Snacks', value: 'snack' },
  ];

  const filterChips = [
    { label: 'All', value: 'all' },
    { label: 'Breakfast', value: 'breakfast' },
    { label: 'Lunch', value: 'lunch' },
    { label: 'Dinner', value: 'dinner' },
    { label: 'Snacks', value: 'snack' },
  ];

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      {/* Top Header with Rounder Buttons */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text, fontFamily: fonts.medium }]}>Nutrition & Food Diary</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Track your daily meals & get AI meal recommendations</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={[styles.aiCoachBtn, { backgroundColor: 'rgba(22,186,197,0.1)', borderColor: colors.teal }]}
            onPress={handleOpenAiSuggest}
          >
            <Ionicons name="sparkles" size={14} color={colors.teal} />
            <Text style={[styles.aiCoachText, { color: colors.teal, fontFamily: fonts.medium }]}>Ask AI Coach</Text>
          </Pressable>
          <Pressable style={[styles.addManualBtn, { backgroundColor: colors.teal }]} onPress={handleOpenAddModal}>
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text style={styles.addManualText}>Add Food</Text>
          </Pressable>
        </View>
      </View>

      {/* Date Navigation Bar */}
      <View style={[styles.dateNavCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable onPress={handlePrevDay} style={[styles.dateArrow, { borderColor: colors.border }]}>
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </Pressable>
        <Text style={[styles.dateNavText, { color: colors.text, fontFamily: fonts.medium }]}>{formattedDateLabel}</Text>
        <Pressable onPress={handleNextDay} style={[styles.dateArrow, { borderColor: colors.border }]}>
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </Pressable>
      </View>

      {/* Daily Progress Summary Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.medium }]}>Calories & Macro Summary</Text>
        
        <View style={styles.calorieRow}>
          <View style={styles.calStat}>
            <Text style={[styles.calNum, { color: colors.text }]}>{consumedCals}</Text>
            <Text style={[styles.calLabel, { color: colors.muted }]}>Eaten</Text>
          </View>
          <View style={styles.calStat}>
            <Text style={[styles.calNumBig, { color: remainingCals < 0 ? '#ff6b6b' : colors.teal }]}>
              {remainingCals}
            </Text>
            <Text style={[styles.calLabel, { color: colors.muted }]}>Remaining</Text>
          </View>
          <View style={styles.calStat}>
            <Text style={[styles.calNum, { color: colors.text }]}>{targetCals}</Text>
            <Text style={[styles.calLabel, { color: colors.muted }]}>Target</Text>
          </View>
        </View>

        {/* Macro Progress Bars */}
        <View style={styles.macroContainer}>
          <View style={styles.macroGroup}>
            <View style={styles.macroHeader}>
              <Text style={[styles.macroLabel, { color: colors.text }]}>Protein</Text>
              <Text style={[styles.macroVal, { color: colors.muted }]}>{consumedProtein} / {targetProtein}g</Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
              <View style={[styles.progressBarFill, { backgroundColor: colors.teal, width: `${Math.min(100, (consumedProtein / targetProtein) * 100)}%` }]} />
            </View>
          </View>

          <View style={styles.macroGroup}>
            <View style={styles.macroHeader}>
              <Text style={[styles.macroLabel, { color: colors.text }]}>Carbs</Text>
              <Text style={[styles.macroVal, { color: colors.muted }]}>{consumedCarbs} / {targetCarbs}g</Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
              <View style={[styles.progressBarFill, { backgroundColor: '#4a90e2', width: `${Math.min(100, (consumedCarbs / targetCarbs) * 100)}%` }]} />
            </View>
          </View>

          <View style={styles.macroGroup}>
            <View style={styles.macroHeader}>
              <Text style={[styles.macroLabel, { color: colors.text }]}>Fats</Text>
              <Text style={[styles.macroVal, { color: colors.muted }]}>{consumedFat} / {targetFat}g</Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
              <View style={[styles.progressBarFill, { backgroundColor: '#f5a623', width: `${Math.min(100, (consumedFat / targetFat) * 100)}%` }]} />
            </View>
          </View>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search food logs..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Chips Bar (Expenses Style) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsContainer}>
        {filterChips.map((chip) => {
          const isSelected = activeFilter === chip.value;
          return (
            <Pressable
              key={chip.value}
              style={[
                styles.chip,
                { borderColor: colors.border, backgroundColor: colors.card },
                isSelected && { backgroundColor: colors.teal, borderColor: colors.teal },
              ]}
              onPress={() => setActiveFilter(chip.value as any)}
            >
              <Text style={[styles.chipText, { color: isSelected ? '#ffffff' : colors.text }]}>
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Single Unified Food Log Container Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.medium }]}>
          Food Log ({filteredMeals.length} items)
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.teal} style={{ marginVertical: 20 }} />
        ) : filteredMeals.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.muted }]}>No matching food items logged for this date.</Text>
        ) : (
          filteredMeals.map((item) => (
            <View key={item.id} style={[styles.mealItemRow, { borderTopColor: colors.border }]}>
              <View style={[styles.mealIconBox, { backgroundColor: 'rgba(22,186,197,0.1)' }]}>
                <Ionicons name={getMealIcon(item.meal_type) as any} size={16} color={colors.teal} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.foodName, { color: colors.text }]}>{item.food_name || 'Unnamed Meal'}</Text>
                <Text style={[styles.foodSub, { color: colors.muted }]}>
                  {item.meal_type.toUpperCase()} • {item.servings} serving(s) • P: {item.protein_g}g C: {item.carbs_g}g F: {item.fat_g}g
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={[styles.itemCals, { color: colors.text }]}>{item.calories} kcal</Text>
                <Pressable onPress={() => handleOpenEditModal(item)} style={styles.iconBtn}>
                  <Ionicons name="pencil-outline" size={15} color={colors.teal} />
                </Pressable>
                <Pressable onPress={() => handleDeleteItem(item.id)} style={styles.iconBtn}>
                  <Ionicons name="trash-outline" size={15} color="#ff6b6b" />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Reusable Meal Modal Component */}
      <MealModal
        visible={formModalVisible}
        onClose={() => setFormModalVisible(false)}
        onSave={handleSaveMealForm}
        editingItem={editingItem}
      />

      {/* AI Suggestion Modal */}
      <Modal visible={suggestModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="sparkles" size={20} color={colors.teal} />
                <Text style={[styles.modalTitle, { color: colors.text, fontFamily: fonts.medium }]}>
                  AI Meal Coach
                </Text>
              </View>
              <Pressable onPress={() => setSuggestModalVisible(false)}>
                <Ionicons name="close" size={20} color={colors.muted} />
              </Pressable>
            </View>

            {/* Meal Type Selector for AI Coach */}
            <View style={{ gap: 6 }}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>Target Meal</Text>
              <View style={styles.categoryRow}>
                {mealCategories.map((cat) => {
                  const isSelected = activeMealType === cat.value;
                  return (
                    <Pressable
                      key={cat.value}
                      style={[
                        styles.categoryChip,
                        { borderColor: colors.border, backgroundColor: colors.bg },
                        isSelected && { backgroundColor: colors.teal, borderColor: colors.teal },
                      ]}
                      onPress={() => setActiveMealType(cat.value as any)}
                    >
                      <Text style={[styles.categoryChipText, { color: isSelected ? '#ffffff' : colors.text }]}>
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {suggesting ? (
              <View style={{ padding: 30, alignItems: 'center', gap: 10 }}>
                <ActivityIndicator size="large" color={colors.teal} />
                <Text style={{ color: colors.muted, fontSize: 13 }}>Crafting a meal matching your macro budget...</Text>
              </View>
            ) : aiSuggestion ? (
              <View style={{ gap: 14 }}>
                <View style={[styles.suggestionBox, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                  <Text style={[styles.suggestedFoodName, { color: colors.text }]}>{aiSuggestion.food_name}</Text>
                  <Text style={[styles.suggestedMacros, { color: colors.teal }]}>
                    {aiSuggestion.calories} kcal • P: {aiSuggestion.protein_g}g | C: {aiSuggestion.carbs_g}g | F: {aiSuggestion.fat_g}g
                  </Text>
                </View>

                <Pressable style={[styles.saveBtn, { backgroundColor: colors.teal }]} onPress={handleLogAiSuggestion}>
                  <Text style={styles.saveBtnText}>Log this Meal</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={{ color: colors.muted }}>Could not load suggestion.</Text>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 22, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  title: { fontSize: 22 },
  subtitle: { fontSize: 13 },
  dateNavCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1 },
  dateArrow: { padding: 8, borderRadius: 12, borderWidth: 1 },
  dateNavText: { fontSize: 15, fontWeight: '600' },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, gap: 12 },
  cardTitle: { fontSize: 16 },
  calorieRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginVertical: 8 },
  calStat: { alignItems: 'center' },
  calNum: { fontSize: 18, fontWeight: '600' },
  calNumBig: { fontSize: 28, fontWeight: 'bold' },
  calLabel: { fontSize: 12, marginTop: 2 },
  macroContainer: { gap: 10, marginTop: 4 },
  macroGroup: { gap: 4 },
  macroHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  macroLabel: { fontSize: 12, fontWeight: '600' },
  macroVal: { fontSize: 12 },
  progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderWidth: 1, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  filterChipsContainer: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
  chipText: { fontSize: 13, fontWeight: '500' },
  emptyText: { fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginVertical: 12 },
  mealItemRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, paddingBottom: 4, borderTopWidth: 1 },
  mealIconBox: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  foodName: { fontSize: 14, fontWeight: '500' },
  foodSub: { fontSize: 11, marginTop: 2 },
  itemCals: { fontSize: 13, fontWeight: '600' },
  iconBtn: { padding: 6 },
  aiCoachBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  aiCoachText: { fontSize: 12 },
  addManualBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  addManualText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 420, padding: 20, borderRadius: 20, borderWidth: 1, gap: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 16 },
  inputLabel: { fontSize: 12 },
  categoryRow: { flexDirection: 'row', gap: 6 },
  categoryChip: { flex: 1, paddingVertical: 8, borderWidth: 1, borderRadius: 16, alignItems: 'center' },
  categoryChipText: { fontSize: 12, fontWeight: '600' },
  suggestionBox: { padding: 16, borderRadius: 12, borderWidth: 1, gap: 6 },
  suggestedFoodName: { fontSize: 16, fontWeight: '600' },
  suggestedMacros: { fontSize: 13, fontWeight: '500' },
  saveBtn: { paddingVertical: 12, borderRadius: 16, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
});