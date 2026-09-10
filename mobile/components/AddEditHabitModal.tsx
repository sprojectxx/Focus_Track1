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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Habit, PriorityLevel } from '../types';
import { colors, spacing, typography } from '../theme';
import { TextInputField } from './TextInputField';
import { Button } from './Button';
import { PREDEFINED_DOMAINS } from '../data/habitDomains';
import {
  MONOCHROME_ICONS,
  MONOCHROME_ICON_CATEGORIES,
  getIoniconsName,
} from '../data/monochromeIcons';

interface AddEditHabitModalProps {
  visible: boolean;
  onClose: () => void;
  editingHabit?: Habit | null;
  onSubmit: (habitData: any) => Promise<void>;
}

const WEEKDAYS = [
  { label: 'M', index: 0 },
  { label: 'T', index: 1 },
  { label: 'W', index: 2 },
  { label: 'T', index: 3 },
  { label: 'F', index: 4 },
  { label: 'S', index: 5 },
  { label: 'S', index: 6 },
];

const TARGET_TIME_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Night', 'Anytime'];

const FOCUS_PRESETS = [15, 30, 45, 60, 90, 120];

export const AddEditHabitModal: React.FC<AddEditHabitModalProps> = ({
  visible,
  onClose,
  editingHabit,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Workout');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('high');
  const [targetTime, setTargetTime] = useState('Morning');

  // Visual state
  const [visualMode, setVisualMode] = useState<'icon' | 'upload'>('icon');
  const [icon, setIcon] = useState('terminal');
  const [customImage, setCustomImage] = useState<string | undefined>(undefined);
  const [iconCategory, setIconCategory] = useState<string>('All');
  const [iconSearch, setIconSearch] = useState('');

  // Schedule state
  const [scheduleDays, setScheduleDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  // Focus duration state
  const [focusMinutes, setFocusMinutes] = useState(45);
  const [isCustomFocus, setIsCustomFocus] = useState(false);
  const [customFocusText, setCustomFocusText] = useState('45');

  // Timepicker temp state (Hours & Minutes)
  const [pickerHour, setPickerHour] = useState(8);
  const [pickerMinute, setPickerMinute] = useState(0);

  const [nameError, setNameError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingHabit) {
      setName(editingHabit.name || '');
      const existingCat = editingHabit.category || 'Workout';
      if ((PREDEFINED_DOMAINS as readonly string[]).includes(existingCat)) {
        setCategory(existingCat);
        setIsCustomCategory(false);
      } else {
        setCategory('Other');
        setCustomCategory(existingCat);
        setIsCustomCategory(true);
      }
      setDescription(editingHabit.description || '');
      setPriority(editingHabit.priority || 'high');
      setTargetTime(editingHabit.targetTime || 'Morning');
      setIcon(editingHabit.icon || 'terminal');
      setCustomImage(editingHabit.customImage);
      setVisualMode(editingHabit.customImage ? 'upload' : 'icon');
      setScheduleDays(editingHabit.scheduleDays || [0, 1, 2, 3, 4, 5, 6]);
      setReminderEnabled(editingHabit.reminderEnabled ?? true);

      const rTime = editingHabit.reminderTime || '08:00';
      setReminderTime(rTime);
      const [hStr, mStr] = rTime.split(':');
      setPickerHour(parseInt(hStr, 10) || 8);
      setPickerMinute(parseInt(mStr, 10) || 0);

      const mins = editingHabit.focusMinutesPerSession || 45;
      setFocusMinutes(mins);
      if (FOCUS_PRESETS.includes(mins)) {
        setIsCustomFocus(false);
        setCustomFocusText(mins.toString());
      } else {
        setIsCustomFocus(true);
        setCustomFocusText(mins.toString());
      }
    } else {
      // Creation Defaults (Matching Web 1:1)
      setName('');
      setCategory('Workout');
      setCustomCategory('');
      setIsCustomCategory(false);
      setDescription('');
      setPriority('high');
      setTargetTime('Morning');
      setIcon('terminal');
      setCustomImage(undefined);
      setVisualMode('icon');
      setScheduleDays([0, 1, 2, 3, 4, 5, 6]);
      setReminderEnabled(true);
      setReminderTime('08:00');
      setPickerHour(8);
      setPickerMinute(0);
      setFocusMinutes(45);
      setIsCustomFocus(false);
      setCustomFocusText('45');
    }
    setNameError(null);
    setScheduleError(null);
    setSubmitError(null);
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
        return [...prev, dayIndex].sort((a, b) => a - b);
      }
    });
  };

  const applyPreset = (preset: 'everyday' | 'weekdays' | 'weekends') => {
    setScheduleError(null);
    if (preset === 'everyday') setScheduleDays([0, 1, 2, 3, 4, 5, 6]);
    else if (preset === 'weekdays') setScheduleDays([0, 1, 2, 3, 4]);
    else if (preset === 'weekends') setScheduleDays([5, 6]);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          setCustomImage(`data:image/jpeg;base64,${asset.base64}`);
        } else if (asset.uri) {
          setCustomImage(asset.uri);
        }
        setVisualMode('upload');
      }
    } catch (err) {
      console.warn('[ImagePicker Error]:', err);
    }
  };

  const confirmReminderTime = (hour: number, minute: number) => {
    const hStr = hour.toString().padStart(2, '0');
    const mStr = minute.toString().padStart(2, '0');
    setReminderTime(`${hStr}:${mStr}`);
    setIsTimePickerOpen(false);
  };

  const filteredIcons = MONOCHROME_ICONS.filter((item) => {
    const matchesCategory = iconCategory === 'All' || item.category === iconCategory;
    const query = iconSearch.toLowerCase().trim();
    const matchesSearch =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query) ||
      item.keywords.some((k) => k.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  const handleSave = async () => {
    let isValid = true;
    setNameError(null);
    setScheduleError(null);
    setSubmitError(null);

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
    const finalFocusMinutes = isCustomFocus
      ? Math.max(1, Math.min(1440, parseInt(customFocusText, 10) || 45))
      : focusMinutes;

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        category: finalCategory,
        categoryLabel: finalCategory,
        description: description.trim(),
        priority,
        icon,
        customImage: visualMode === 'upload' ? customImage : undefined,
        visualType: visualMode === 'upload' && customImage ? 'image' : 'icon',
        scheduleDays,
        scheduleType:
          scheduleDays.length === 7
            ? 'daily'
            : scheduleDays.length === 5 && !scheduleDays.includes(5) && !scheduleDays.includes(6)
            ? 'weekdays'
            : scheduleDays.length === 2 && scheduleDays.includes(5) && scheduleDays.includes(6)
            ? 'weekends'
            : 'custom',
        reminderEnabled,
        reminderTime,
        targetTime,
        focusMinutesPerSession: finalFocusMinutes,
      });
      onClose();
    } catch (err: any) {
      console.error('[AddEditHabitModal] Save error:', err);
      setSubmitError(err?.message || 'Failed to save habit protocol. Please check your network connection.');
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
              style={styles.chipScrollView}
              contentContainerStyle={styles.chipContainer}
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

            {/* Target Time Window */}
            <Text style={[typography.caption, styles.sectionLabel]}>Target Time Window</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScrollView}
              contentContainerStyle={styles.chipContainer}
            >
              {TARGET_TIME_OPTIONS.map((tt) => {
                const isSelected = targetTime === tt;
                return (
                  <TouchableOpacity
                    key={tt}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setTargetTime(tt)}
                    activeOpacity={0.8}
                    hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {tt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Visual Mode: Icon vs Custom Image */}
            <Text style={[typography.caption, styles.sectionLabel]}>Visual Representation</Text>
            <View style={styles.modeToggleRow}>
              <TouchableOpacity
                style={[styles.modeToggleBtn, visualMode === 'icon' && styles.modeToggleBtnActive]}
                onPress={() => setVisualMode('icon')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="shapes-outline"
                  size={16}
                  color={visualMode === 'icon' ? colors.background : colors.textPrimary}
                />
                <Text
                  style={[
                    styles.modeToggleText,
                    visualMode === 'icon' && styles.modeToggleTextActive,
                  ]}
                >
                  MONOCHROME SYMBOL
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeToggleBtn, visualMode === 'upload' && styles.modeToggleBtnActive]}
                onPress={() => {
                  setVisualMode('upload');
                  if (!customImage) pickImage();
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="image-outline"
                  size={16}
                  color={visualMode === 'upload' ? colors.background : colors.textPrimary}
                />
                <Text
                  style={[
                    styles.modeToggleText,
                    visualMode === 'upload' && styles.modeToggleTextActive,
                  ]}
                >
                  CUSTOM IMAGE
                </Text>
              </TouchableOpacity>
            </View>

            {/* Custom Image Upload Section */}
            {visualMode === 'upload' ? (
              <View style={styles.uploadSection}>
                {customImage ? (
                  <View style={styles.previewBox}>
                    <Image source={{ uri: customImage }} style={styles.previewImage} />
                    <TouchableOpacity style={styles.changeImageBtn} onPress={pickImage} activeOpacity={0.8}>
                      <Text style={styles.changeImageText}>CHANGE IMAGE</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.uploadDropzone} onPress={pickImage} activeOpacity={0.8}>
                    <Ionicons name="cloud-upload-outline" size={28} color={colors.textSecondary} />
                    <Text style={styles.uploadText}>SELECT IMAGE FROM GALLERY</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              /* Full Monochrome Icon Library Picker */
              <View style={styles.iconPickerSection}>
                {/* Search & Category Filter */}
                <TextInputField
                  label="Search Icons"
                  value={iconSearch}
                  onChangeText={setIconSearch}
                  placeholder="Filter icons by name or tag..."
                />

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.chipScrollView}
                  contentContainerStyle={styles.chipContainer}
                >
                  {MONOCHROME_ICON_CATEGORIES.map((cat) => {
                    const isSelected = iconCategory === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => setIconCategory(cat)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Icon Grid */}
                <View style={styles.iconGrid}>
                  {filteredIcons.map((item) => {
                    const isSelected = icon === item.id;
                    const ionIconName = getIoniconsName(item.id);

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.iconChip, isSelected && styles.iconChipSelected]}
                        onPress={() => setIcon(item.id)}
                        activeOpacity={0.8}
                        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                      >
                        <Ionicons
                          name={ionIconName as any}
                          size={22}
                          color={isSelected ? colors.background : colors.textPrimary}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Schedule Days & Presets */}
            <Text style={[typography.caption, styles.sectionLabel]}>Weekly Schedule</Text>
            <View style={styles.presetRow}>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => applyPreset('everyday')}
                activeOpacity={0.8}
              >
                <Text style={styles.presetText}>EVERY DAY</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => applyPreset('weekdays')}
                activeOpacity={0.8}
              >
                <Text style={styles.presetText}>WEEKDAYS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => applyPreset('weekends')}
                activeOpacity={0.8}
              >
                <Text style={styles.presetText}>WEEKENDS</Text>
              </TouchableOpacity>
            </View>

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

            {/* Reminder Settings */}
            <View style={styles.sectionTitleRow}>
              <Text style={[typography.caption, styles.sectionLabel]}>Notification Reminder</Text>
            </View>

            <View style={styles.reminderCard}>
              <View style={styles.reminderToggleRow}>
                <View>
                  <Text style={typography.h3}>Daily Reminder</Text>
                  <Text style={typography.caption}>10-minute advance alert</Text>
                </View>
                <TouchableOpacity
                  style={[styles.switchTrack, reminderEnabled && styles.switchTrackActive]}
                  onPress={() => setReminderEnabled(!reminderEnabled)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.switchThumb, reminderEnabled && styles.switchThumbActive]} />
                </TouchableOpacity>
              </View>

              {reminderEnabled ? (
                <View style={styles.reminderTimeRow}>
                  <Text style={typography.caption}>REMINDER TIME</Text>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setIsTimePickerOpen(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="time-outline" size={16} color={colors.textPrimary} />
                    <Text style={styles.timeButtonText}>{reminderTime}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {/* Focus Session Duration */}
            <Text style={[typography.caption, styles.sectionLabel]}>
              Focus Duration (Minutes)
            </Text>
            <View style={styles.rowContainer}>
              {FOCUS_PRESETS.map((mins) => {
                const isSelected = !isCustomFocus && focusMinutes === mins;
                return (
                  <TouchableOpacity
                    key={mins}
                    style={[styles.priorityChip, isSelected && styles.priorityChipSelected]}
                    onPress={() => {
                      setIsCustomFocus(false);
                      setFocusMinutes(mins);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.priorityChipText,
                        isSelected && styles.priorityChipTextSelected,
                      ]}
                    >
                      {mins}m
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[styles.priorityChip, isCustomFocus && styles.priorityChipSelected]}
                onPress={() => setIsCustomFocus(true)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.priorityChipText,
                    isCustomFocus && styles.priorityChipTextSelected,
                  ]}
                >
                  Custom
                </Text>
              </TouchableOpacity>
            </View>

            {isCustomFocus ? (
              <TextInputField
                label="Custom Focus Minutes"
                value={customFocusText}
                onChangeText={(val) => {
                  setCustomFocusText(val);
                  const parsed = parseInt(val, 10);
                  if (!isNaN(parsed)) setFocusMinutes(parsed);
                }}
                keyboardType="numeric"
                placeholder="Enter minutes (e.g. 120)"
              />
            ) : null}

            {/* Description */}
            <TextInputField
              label="Description / Notes (Optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. 45 minutes of focused execution"
              style={styles.descriptionInput}
            />

            {/* Error feedback */}
            {submitError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.dangerText} />
                <Text style={styles.errorBannerText}>{submitError}</Text>
              </View>
            ) : null}

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

      {/* Native Time Picker Modal */}
      <Modal
        visible={isTimePickerOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsTimePickerOpen(false)}
      >
        <View style={styles.timePickerOverlay}>
          <View style={styles.timePickerCard}>
            <Text style={[typography.h3, styles.timePickerTitle]}>SET REMINDER TIME</Text>
            
            <View style={styles.pickerRow}>
              {/* Hours */}
              <View style={styles.pickerCol}>
                <Text style={typography.caption}>HOUR</Text>
                <ScrollView style={styles.wheelScrollView} nestedScrollEnabled>
                  {Array.from({ length: 24 }).map((_, h) => (
                    <TouchableOpacity
                      key={h}
                      style={[styles.wheelItem, pickerHour === h && styles.wheelItemActive]}
                      onPress={() => setPickerHour(h)}
                    >
                      <Text style={[styles.wheelItemText, pickerHour === h && styles.wheelItemTextActive]}>
                        {h.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.colonText}>:</Text>

              {/* Minutes */}
              <View style={styles.pickerCol}>
                <Text style={typography.caption}>MINUTE</Text>
                <ScrollView style={styles.wheelScrollView} nestedScrollEnabled>
                  {Array.from({ length: 12 }).map((_, idx) => {
                    const m = idx * 5;
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[styles.wheelItem, pickerMinute === m && styles.wheelItemActive]}
                        onPress={() => setPickerMinute(m)}
                      >
                        <Text style={[styles.wheelItemText, pickerMinute === m && styles.wheelItemTextActive]}>
                          {m.toString().padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <View style={styles.timePickerActionRow}>
              <Button
                title="CANCEL"
                variant="secondary"
                onPress={() => setIsTimePickerOpen(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="SET TIME"
                variant="primary"
                onPress={() => confirmReminderTime(pickerHour, pickerMinute)}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  sectionTitleRow: {
    marginTop: spacing.sm,
  },
  chipScrollView: {
    marginBottom: spacing.md,
  },
  chipContainer: {
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    height: 36,
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
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  priorityChip: {
    flex: 1,
    minWidth: 50,
    height: 38,
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
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  priorityChipTextSelected: {
    color: colors.background,
  },
  modeToggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusMd,
  },
  modeToggleBtnActive: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  modeToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modeToggleTextActive: {
    color: colors.background,
  },
  uploadSection: {
    marginBottom: spacing.md,
  },
  uploadDropzone: {
    height: 90,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  uploadText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  previewBox: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  previewImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: colors.border,
  },
  changeImageBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.radiusSm,
  },
  changeImageText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  iconPickerSection: {
    marginBottom: spacing.sm,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md,
  },
  iconChip: {
    width: 44,
    height: 44,
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
  presetRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  presetChip: {
    flex: 1,
    height: 32,
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  daySelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  dayChip: {
    width: 38,
    height: 38,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.radiusSm,
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
  reminderCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusMd,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  reminderToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTrack: {
    width: 46,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackActive: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.textSecondary,
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
    backgroundColor: colors.background,
  },
  reminderTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.radiusSm,
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  errorText: {
    color: colors.dangerText,
    marginBottom: spacing.md,
  },
  descriptionInput: {
    marginTop: spacing.xs,
  },
  saveButton: {
    marginTop: spacing.lg,
  },
  loader: {
    marginTop: spacing.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderColor: colors.dangerText,
    borderWidth: 1,
    padding: spacing.md,
    borderRadius: spacing.radiusMd,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  errorBannerText: {
    color: colors.textPrimary,
    fontSize: 12,
    flex: 1,
  },
  timePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  timePickerCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusLg,
    padding: spacing.lg,
  },
  timePickerTitle: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
    marginBottom: spacing.lg,
  },
  pickerCol: {
    flex: 1,
    alignItems: 'center',
  },
  colonText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginHorizontal: spacing.xs,
  },
  wheelScrollView: {
    width: '100%',
    maxHeight: 120,
    marginTop: spacing.xs,
  },
  wheelItem: {
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderRadius: spacing.radiusSm,
  },
  wheelItemActive: {
    backgroundColor: colors.textPrimary,
  },
  wheelItemText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textMuted,
  },
  wheelItemTextActive: {
    color: colors.background,
  },
  timePickerActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
