import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { fonts } from '../constants/theme';

interface ProfileData {
  age: number;
  gender: 'male' | 'female';
  heightCm: number;
  weightKg: number;
  goalWeightKg: number;
  weeklyPaceKg: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';
  primaryGoal: 'lose' | 'maintain' | 'gain';
  targetCalories?: number;
  targetProteinG?: number;
  targetCarbsG?: number;
  targetFatG?: number;
  targetDate?: string;
  weeksToGoal?: number;
}

export default function Profile() {
  const { colors } = useTheme();

  const [form, setForm] = useState<ProfileData>({
    age: 25,
    gender: 'female',
    heightCm: 165,
    weightKg: 60,
    goalWeightKg: 55,
    weeklyPaceKg: 0.5,
    activityLevel: 'light',
    primaryGoal: 'lose',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await api.getUserProfile();
        if (data) {
          setForm({
            age: data.age || 25,
            gender: data.gender || 'female',
            heightCm: Number(data.height_cm) || 165,
            weightKg: Number(data.current_weight_kg) || 60,
            goalWeightKg: Number(data.goal_weight_kg) || 55,
            weeklyPaceKg: Number(data.weekly_pace_kg) || 0.5,
            activityLevel: data.activity_level || 'light',
            primaryGoal: data.primary_goal || 'lose',
            targetCalories: data.target_calories,
            targetProteinG: data.target_protein_g,
            targetCarbsG: data.target_carbs_g,
            targetFatG: data.target_fat_g,
            targetDate: data.target_date,
            weeksToGoal: data.weeksToGoal,
          });
        }
      } catch (err) {
        console.info('No existing profile found, using defaults.');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleChange = (key: keyof ProfileData, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setSavedSuccess(false);

    try {
      const updated = await api.updateUserProfile({
        age: Number(form.age),
        gender: form.gender,
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
        goalWeightKg: Number(form.goalWeightKg),
        weeklyPaceKg: Number(form.weeklyPaceKg),
        activityLevel: form.activityLevel,
        primaryGoal: form.primaryGoal,
      } as any);

      if (updated) {
        setForm((prev) => ({
          ...prev,
          targetCalories: updated.target_calories,
          targetProteinG: updated.target_protein_g,
          targetCarbsG: updated.target_carbs_g,
          targetFatG: updated.target_fat_g,
          targetDate: updated.target_date,
          weeksToGoal: updated.weeksToGoal,
        }));
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save profile', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.muted }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.medium }]}>
          Profile & Nutrition Goals
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Manage your body metrics and targets to calculate an automated goal weight completion plan.
        </Text>
      </View>

      <View style={styles.grid}>
        {/* Input Form Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
            <Ionicons name="person-outline" size={18} color={colors.teal} />
            <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.medium }]}>
              Personal Metrics & Goal Weight
            </Text>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.muted }]}>Age</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                value={String(form.age)}
                onChangeText={(val) => handleChange('age', val)}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.muted }]}>Height (cm)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                value={String(form.heightCm)}
                onChangeText={(val) => handleChange('heightCm', val)}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.muted }]}>Current Weight (kg)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                value={String(form.weightKg)}
                onChangeText={(val) => handleChange('weightKg', val)}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.muted }]}>Goal Weight (kg)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                value={String(form.goalWeightKg)}
                onChangeText={(val) => handleChange('goalWeightKg', val)}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>Weekly Target Pace</Text>
            <View style={styles.paceOptions}>
              {[0.25, 0.5, 0.75, 1.0].map((pace) => {
                const isSelected = Number(form.weeklyPaceKg) === pace;
                return (
                  <Pressable
                    key={pace}
                    onPress={() => handleChange('weeklyPaceKg', pace)}
                    style={[
                      styles.paceChip,
                      {
                        borderColor: isSelected ? colors.teal : colors.border,
                        backgroundColor: isSelected ? 'rgba(22,186,197,0.14)' : colors.bg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.paceChipText,
                        { color: isSelected ? colors.teal : colors.text, fontFamily: fonts.medium },
                      ]}
                    >
                      {pace} kg/wk
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable
            style={[styles.saveBtn, { backgroundColor: colors.teal }]}
            onPress={handleSubmit}
            disabled={saving}
          >
            <Ionicons name="save-outline" size={16} color="#ffffff" />
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save & Calculate Plan'}</Text>
          </Pressable>

          {savedSuccess && <Text style={styles.successText}>Plan updated successfully!</Text>}
        </View>

        {/* Calculated Results & Plan Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.medium, marginBottom: 12 }]}>
            Daily Targets & Plan Timeline
          </Text>

          {form.targetCalories ? (
            <View style={styles.resultsContainer}>
              <View style={[styles.calorieBadge, { backgroundColor: 'rgba(22,186,197,0.12)' }]}>
                <Text style={[styles.badgeLabel, { color: colors.teal }]}>Target Daily Calories</Text>
                <Text style={[styles.badgeValue, { color: colors.teal }]}>{form.targetCalories} kcal</Text>
              </View>

              {/* Target Plan Timeline Banner */}
              {form.targetDate && (
                <View style={[styles.planBox, { backgroundColor: 'rgba(22,186,197,0.06)', borderColor: colors.teal }]}>
                  <Ionicons name="calendar-outline" size={20} color={colors.teal} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ color: colors.teal, fontWeight: '600', fontSize: 13 }}>
                      Estimated Target Plan
                    </Text>
                    <Text style={{ color: colors.text, fontSize: 12 }}>
                      At {form.weeklyPaceKg} kg/week, you'll reach {form.goalWeightKg} kg in ~{form.weeksToGoal || 0} weeks ({form.targetDate}).
                    </Text>
                  </View>
                </View>
              )}

              <View style={[styles.macroRow, { borderColor: colors.border }]}>
                <Text style={{ color: colors.muted }}>Protein</Text>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{form.targetProteinG} g</Text>
              </View>

              <View style={[styles.macroRow, { borderColor: colors.border }]}>
                <Text style={{ color: colors.muted }}>Carbs</Text>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{form.targetCarbsG} g</Text>
              </View>

              <View style={[styles.macroRow, { borderColor: colors.border }]}>
                <Text style={{ color: colors.muted }}>Fats</Text>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{form.targetFatG} g</Text>
              </View>
            </View>
          ) : (
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              Save your body metrics and goal weight to calculate your personalized plan.
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 20,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 22,
  },
  subtitle: {
    fontSize: 13,
  },
  grid: {
    gap: 16,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  paceOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  paceChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  paceChipText: {
    fontSize: 12,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  successText: {
    color: '#10b981',
    fontSize: 12,
    textAlign: 'center',
  },
  resultsContainer: {
    gap: 12,
  },
  calorieBadge: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  badgeValue: {
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 4,
  },
  planBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
});