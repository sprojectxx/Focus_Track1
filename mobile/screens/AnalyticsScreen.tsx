import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';
import { EmptyState } from '../components/EmptyState';

export const AnalyticsScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={typography.h1}>ANALYTICS</Text>
          <Text style={typography.caption}>PERFORMANCE METRICS</Text>
        </View>

        <EmptyState
          title="Performance Engine"
          description="Real-time discipline scoring, completion ratios, and performance trends will be connected in future phases."
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
});
