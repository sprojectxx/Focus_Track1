import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Habit, PriorityLevel } from '../types';
import { colors, spacing, typography } from '../theme';
import { TextInputField } from './TextInputField';
import { Button } from './Button';
import { PREDEFINED_DOMAINS } from '../data/habitDomains';

interface AddEditHabitModalProps {
  visible: boolean;
  onClose: () => void;
  editingHabit?: Habit | null;
  onSubmit: (habitData: any) => Promise<void>;
}

const AVAILABLE_ICONS = [
  'target-outline',
  'barbell-outline',
  'book-outline',
  'code-slash-outline',
  'flame-outline',
  'time-outline',
  'leaf-outline',
  'heart-outline',
  'fitness-outline',
  'briefcase-outline',
];

const WEEKDAYS = [
  { label: 'M', index: 0 },
  { label: 'T', index: 1 },
  { label: 'W', index: 2 },
  { label: 'T', index: 3 },
  { label: 'F', index: 4 },
  { label: 'S', index: 5 },
  { label: 'S', index: 6 },
];

export const AddEditHabitModal: React.FC<AddEditHabitModalProps> = ({
  visible,
  onClose,
  editingHabit,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Health');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [icon, setIcon] = useState('target-outline');
  const [scheduleDays, setScheduleDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [focusMinutes, setFocusMinutes] = useState(30);

  const [nameError, setNameError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingHabit) {
      setName(editingHabit.name || '');
      const isPreset = PREDEFINED_DOMAINS.includes(editingHabit.category as any);
      if (isPreset) {
        setCategory(editingHabit.category);
        setIsCustomCategory(false);
      } else {
        setCategory('Other');
        setCustomCategory(editingHabit.category || '');
        setIsCustomCategory(true);
      }
      setDescription(editingHabit.description || '');
      setPriority(editingHabit.priority || 'medium');
      setIcon(editingHabit.icon || 'target-outline');
      setScheduleDays(editingHabit.scheduleDays || [0, 1, 2, 3, 4, 5, 6]);
      setReminderEnabled(editingHabit.reminderEnabled ?? false);
      setReminderTime(editingHabit.reminderTime || '08:00');
      setFocusMinutes(editingHabit.focusMinutesPerSession || 30);
    } else {
      setName('');
      setCategory('Health');
      setCustomCategory('');
      setIsCustomCategory(false);
      setDescription('');
      setPriority('medium');
      setIcon('target-outline');
      setScheduleDays([0, 1, 2, 3, 4, 5, 6]);
      setReminderEnabled(false);
      setReminderTime('08:00');
      setFocusMinutes(30);
    }
    setNameError(null);
    setScheduleError(null);
  }, [editingHabit, visible]);

  const toggleDay = (dayIndex: number) => {
    setScheduleDays((prev) => {
      if (prev.includes(dayIndex)) {
        if (prev.length === 1) {
          setScheduleError('Select at least 1 day for the schedule.');
          return prev;
        }
        setScheduleError(null);
        return prev.filter((d) => d !== dayIndex);
      } else {
        setScheduleError(null);
        return [...prev, dayIndex].sort();
      }
    });
  };

  const handleSave = async () => {
    let isValid = true;
    setNameError(null);
    setScheduleError(null);

    if (!name.trim()) {
      setNameError('Habit name is required.');
      isValid = false;
    }

    if (scheduleDays.length === 0) {
      setScheduleError('Select at least 1 day for the schedule.');
      isValid = false;
    }

    if (!isValid) return;

    const finalCategory = isCustomCategory ? customCategory.trim() || 'Custom' : category;

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        category: finalCategory,
        categoryLabel: finalCategory,
        description: description.trim(),
        priority,
        icon,
        visualType: 'icon',
        scheduleDays,
        scheduleType: scheduleDays.length === 7 ? 'daily' : 'custom',
        reminderEnabled,
        reminderTime,
        targetTime: 'Morning',
        focusMinutesPerSession: focusMinutes,
      });
      onClose();
    } catch (err) {
      console.error('[AddEditHabitModal] Save error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header Bar */}
          <View style={styles.header}>
            <Text style={typography.h2}>
              {editingHabit ? 'EDIT PROTOCOL' : 'CREATE NEW PROTOCOL'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* Habit Name */}
            <TextInputField
              label="Protocol Name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (nameError) setNameError(null);
              }}
              placeholder="e.g. Morning Focus Session"
              error={nameError}
            />

            {/* Domain Selection */}
            <Text style={[typography.caption, styles.sectionLabel]}>Domain Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.domainChipScrollView}
              contentContainerStyle={styles.domainChipContainer}
            >
              {PREDEFINED_DOMAINS.map((domain) => {
                const isSelected = !isCustomCategory && category === domain;
                return (
                  <TouchableOpacity
                    key={domain}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => {
                      if (domain === 'Other') {
                        setIsCustomCategory(true);
                      } else {
                        setIsCustomCategory(false);
                        setCategory(domain);
                      }
                    }}
                    activeOpacity={0.8}
                    hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {domain}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {isCustomCategory ? (
              <TextInputField
                label="Custom Domain Label"
                value={customCategory}
                onChangeText={setCustomCategory}
                placeholder="Enter custom domain name"
              />
            ) : null}

            {/* Priority Selection */}
            <Text style={[typography.caption, styles.sectionLabel]}>Priority Level</Text>
            <View style={styles.rowContainer}>
              {(['low', 'medium', 'high'] as PriorityLevel[]).map((p) => {
                const isSelected = priority === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[styles.priorityChip, isSelected && styles.priorityChipSelected]}
                    onPress={() => setPriority(p)}
                    activeOpacity={0.8}
                    hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
                  >
                    <Text
                      style={[
                        styles.priorityChipText,
                        isSelected && styles.priorityChipTextSelected,
                      ]}
                    >
                      {p.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Schedule Days */}
            <Text style={[typography.caption, styles.sectionLabel]}>Weekly Schedule</Text>
            <View style={styles.daySelectorRow}>
              {WEEKDAYS.map((w) => {
                const isSelected = scheduleDays.includes(w.index);
                return (
                  <TouchableOpacity
                    key={w.index}
                    style={[styles.dayChip, isSelected && styles.dayChipSelected]}
                    onPress={() => toggleDay(w.index)}
                    activeOpacity={0.8}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <Text style={[styles.dayChipText, isSelected && styles.dayChipTextSelected]}>
                      {w.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {scheduleError ? (
              <Text style={[typography.caption, styles.errorText]}>{scheduleError}</Text>
            ) : null}

            {/* Icon Visual */}
            <Text style={[typography.caption, styles.sectionLabel]}>Monochrome Symbol</Text>
            <View style={styles.iconGrid}>
              {AVAILABLE_ICONS.map((iconName) => {
                const isSelected = icon === iconName;
                return (
                  <TouchableOpacity
                    key={iconName}
                    style={[styles.iconChip, isSelected && styles.iconChipSelected]}
                    onPress={() => setIcon(iconName)}
                    activeOpacity={0.8}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <Ionicons
                      name={iconName as any}
                      size={20}
                      color={isSelected ? colors.background : colors.textPrimary}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Focus Session Duration */}
            <Text style={[typography.caption, styles.sectionLabel]}>
              Target Session Duration (Minutes)
            </Text>
            <View style={styles.rowContainer}>
              {[15, 30, 45, 60].map((mins) => {
                const isSelected = focusMinutes === mins;
                return (
                  <TouchableOpacity
                    key={mins}
                    style={[styles.priorityChip, isSelected && styles.priorityChipSelected]}
                    onPress={() => setFocusMinutes(mins)}
                    activeOpacity={0.8}
                    hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
                  >
                    <Text
                      style={[
                        styles.priorityChipText,
                        isSelected && styles.priorityChipTextSelected,
                      ]}
                    >
                      {mins} MIN
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Description */}
            <TextInputField
              label="Description / Notes (Optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. 30 minutes of focused deep work"
              style={styles.descriptionInput}
            />

            {/* Action Buttons */}
            <Button
              title={loading ? 'SAVING PROTOCOL...' : 'SAVE PROTOCOL'}
              onPress={handleSave}
              variant="primary"
              disabled={loading}
              style={styles.saveButton}
            />
            {loading ? <ActivityIndicator style={styles.loader} size="small" color={colors.textPrimary} /> : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: spacing.minTouchTarget,
    height: spacing.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 32,
  },
  sectionLabel: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  domainChipScrollView: {
    marginBottom: spacing.md,
  },
  domainChipContainer: {
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    height: spacing.minTouchTarget - 8,
    borderRadius: spacing.radiusFull,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.background,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  priorityChip: {
    flex: 1,
    height: spacing.minTouchTarget,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityChipSelected: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  priorityChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  priorityChipTextSelected: {
    color: colors.background,
  },
  daySelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  dayChip: {
    width: 40,
    height: spacing.minTouchTarget,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipSelected: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dayChipTextSelected: {
    color: colors.background,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  iconChip: {
    width: 48,
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChipSelected: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  errorText: {
    color: colors.dangerText,
    marginBottom: spacing.md,
  },
  descriptionInput: {
    marginTop: spacing.sm,
  },
  saveButton: {
    marginTop: spacing.lg,
  },
  loader: {
    marginTop: spacing.md,
  },
});
