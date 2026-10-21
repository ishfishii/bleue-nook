import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
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
  bmr?: number;
  tdee?: number;
  targetCalories?: number;
  targetProteinG?: number;
  targetCarbsG?: number;
  targetFatG?: number;
  macroRatioString?: string;
  targetDate?: string;
  weeksToGoal?: number;
}

export default function Profile() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768; // Switch to side-by-side on tablet/desktop

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
            bmr: data.bmr,
            tdee: data.tdee,
            targetCalories: data.target_calories,
            targetProteinG: data.target_protein_g,
            targetCarbsG: data.target_carbs_g,
            targetFatG: data.target_fat_g,
            macroRatioString: data.macro_ratio_string || '50:25:25',
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
          bmr: updated.bmr,
          tdee: updated.tdee,
          targetCalories: updated.target_calories,
          targetProteinG: updated.target_protein_g,
          targetCarbsG: updated.target_carbs_g,
          targetFatG: updated.target_fat_g,
          macroRatioString: updated.macro_ratio_string,
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
          Profile & Goal Plan
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Configure your body metrics to generate an automated timeline curve and macro targets.
        </Text>
      </View>

      <View style={[styles.grid, { flexDirection: isDesktop ? 'row' : 'column' }]}>
        {/* Input Form Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, flex: 1 }]}>
          <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
            <Ionicons name="person-outline" size={18} color={colors.teal} />
            <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.medium }]}>
              Body Metrics & Weight Goal
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

        {/* Plan Timeline & Macro Breakdown Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, flex: 1 }]}>
          <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.medium, marginBottom: 8 }]}>
            Your Goal Plan & Timeline
          </Text>

          {form.targetCalories ? (
            <View style={styles.resultsContainer}>
              {/* Timeline Header Banner */}
              <View style={[styles.timelineHeaderBox, { backgroundColor: 'rgba(22,186,197,0.08)', borderColor: colors.teal }]}>
                <View>
                  <Text style={[styles.timelineWeeks, { color: colors.teal }]}>
                    ~{form.weeksToGoal || 0} weeks
                  </Text>
                  <Text style={[styles.timelineSub, { color: colors.muted }]}>to reach your goal weight</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.targetDateText, { color: colors.text }]}>
                    {form.targetDate ? new Date(form.targetDate).toLocaleDateString() : ''}
                  </Text>
                  <Text style={[styles.timelineSub, { color: colors.muted }]}>Target Date</Text>
                </View>
              </View>

              {/* BMR & TDEE mini stats */}
              <View style={styles.statsRow}>
                <View style={[styles.statBox, { borderColor: colors.border, backgroundColor: colors.bg }]}>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>🔥 BMR</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{form.bmr} kcal</Text>
                </View>
                <View style={[styles.statBox, { borderColor: colors.border, backgroundColor: colors.bg }]}>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>👟 TDEE</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{form.tdee} kcal</Text>
                </View>
              </View>

              {/* Calorie Goal Big Badge */}
              <View style={[styles.calorieBadge, { backgroundColor: 'rgba(22,186,197,0.12)' }]}>
                <Text style={[styles.badgeLabel, { color: colors.teal }]}>Calorie Goal</Text>
                <Text style={[styles.badgeValue, { color: colors.teal }]}>{form.targetCalories} kcal</Text>
              </View>

              {/* Macro Goal Split Header & Ratio */}
              <View style={styles.macroSplitHeader}>
                <Text style={[styles.cardTitle, { color: colors.text, fontSize: 14 }]}>Recommended Macros</Text>
                <Text style={[styles.ratioBadge, { color: colors.teal, backgroundColor: 'rgba(22,186,197,0.1)' }]}>
                  C:P:F {form.macroRatioString}
                </Text>
              </View>

              <View style={[styles.macroRow, { borderColor: colors.border }]}>
                <Text style={{ color: colors.muted }}>Carbs</Text>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{form.targetCarbsG} g ({Math.round(form.targetCarbsG! * 4)} kcal)</Text>
              </View>

              <View style={[styles.macroRow, { borderColor: colors.border }]}>
                <Text style={{ color: colors.muted }}>Protein</Text>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{form.targetProteinG} g ({Math.round(form.targetProteinG! * 4)} kcal)</Text>
              </View>

              <View style={[styles.macroRow, { borderColor: colors.border }]}>
                <Text style={{ color: colors.muted }}>Fat</Text>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{form.targetFatG} g ({Math.round(form.targetFatG! * 9)} kcal)</Text>
              </View>
            </View>
          ) : (
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              Save your body metrics to generate your timeline curve and macro ratios.
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 20 },
  header: { gap: 4 },
  title: { fontSize: 22 },
  subtitle: { fontSize: 13 },
  grid: { gap: 16, alignItems: 'flex-start' },
  card: { padding: 20, borderRadius: 12, borderWidth: 1, gap: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottomWidth: 1 },
  cardTitle: { fontSize: 16 },
  formRow: { flexDirection: 'row', gap: 12 },
  formGroup: { gap: 6 },
  label: { fontSize: 12 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  paceOptions: { flexDirection: 'row', gap: 8 },
  paceChip: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, borderWidth: 1 },
  paceChipText: { fontSize: 12 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 8, marginTop: 8 },
  saveBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  successText: { color: '#10b981', fontSize: 12, textAlign: 'center' },
  resultsContainer: { gap: 12 },
  timelineHeaderBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 8, borderWidth: 1 },
  timelineWeeks: { fontSize: 20, fontWeight: 'bold' },
  timelineSub: { fontSize: 11 },
  targetDateText: { fontSize: 15, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center', gap: 2 },
  statLabel: { fontSize: 11 },
  statValue: { fontSize: 14, fontWeight: '600' },
  calorieBadge: { padding: 14, borderRadius: 8, alignItems: 'center' },
  badgeLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  badgeValue: { fontSize: 24, fontWeight: 'bold', marginTop: 2 },
  macroSplitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  ratioBadge: { fontSize: 12, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1 },
});