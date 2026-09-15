import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { DN, FontFamily, FontSize, Space, Radius } from '@/constants/design-tokens';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SkillTag } from '@/components/ui/SkillTag';
import { MOCK_SKILLS } from '@/lib/mock-data';
import type { MockSkill } from '@/lib/mock-data';

const CATEGORIES = [
  { key: 'language', label: 'Languages', icon: 'code' as const, color: '#3178c6' },
  { key: 'framework', label: 'Frameworks', icon: 'box' as const, color: '#61dafb' },
  { key: 'tool', label: 'Tools', icon: 'tool' as const, color: '#47a248' },
  { key: 'concept', label: 'Concepts', icon: 'book-open' as const, color: '#00c3e4' },
];

function SkillProgressBar({ skill }: { skill: MockSkill }) {
  return (
    <View style={styles.skillRow}>
      <View style={styles.skillInfo}>
        <Text style={styles.skillName}>{skill.name}</Text>
        <Text style={styles.skillMeta}>
          {skill.project_count} project{skill.project_count !== 1 ? 's' : ''}
        </Text>
      </View>
      <View style={styles.barContainer}>
        <View
          style={[
            styles.barFill,
            {
              width: `${skill.proficiency}%`,
              backgroundColor: skill.color,
            },
          ]}
        />
      </View>
      <Text style={[styles.proficiency, { color: skill.color }]}>
        {skill.proficiency}%
      </Text>
    </View>
  );
}

export default function SkillDNAScreen() {
  const insets = useSafeAreaInsets();

  const topSkills = [...MOCK_SKILLS].sort((a, b) => b.proficiency - a.proficiency).slice(0, 5);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Space.base },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="light-content" backgroundColor={DN.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Skill DNA</Text>
        <Text style={styles.subtitle}>
          Your technical profile extracted from projects
        </Text>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{MOCK_SKILLS.length}</Text>
          <Text style={styles.summaryLabel}>Total Skills</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {Math.round(MOCK_SKILLS.reduce((s, sk) => s + sk.proficiency, 0) / MOCK_SKILLS.length)}%
          </Text>
          <Text style={styles.summaryLabel}>Avg Proficiency</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {CATEGORIES.filter((c) => MOCK_SKILLS.some((s) => s.category === c.key)).length}
          </Text>
          <Text style={styles.summaryLabel}>Categories</Text>
        </View>
      </View>

      {/* Top Skills */}
      <SectionHeader title="Top Skills" icon="award" />
      <View style={styles.card}>
        {topSkills.map((skill) => (
          <SkillProgressBar key={skill.id} skill={skill} />
        ))}
      </View>

      {/* Category Breakdown */}
      {CATEGORIES.map((cat) => {
        const skills = MOCK_SKILLS.filter((s) => s.category === cat.key);
        if (skills.length === 0) return null;

        return (
          <View key={cat.key}>
            <SectionHeader title={cat.label} icon={cat.icon} />
            <View style={styles.card}>
              <View style={styles.tagGrid}>
                {skills.map((skill) => (
                  <View key={skill.id} style={styles.tagItem}>
                    <SkillTag label={skill.name} color={skill.color} size="md" />
                    <Text style={styles.tagProficiency}>{skill.proficiency}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        );
      })}

      {/* Data Source Note */}
      <View style={styles.noteCard}>
        <Feather name="info" size={14} color={DN.cyan} style={{ marginRight: Space.sm }} />
        <Text style={styles.noteText}>
          Skills are extracted automatically from your project repositories by the AI analysis engine.
        </Text>
      </View>

      <View style={{ height: Space['2xl'] }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DN.bg,
  },
  content: {
    paddingHorizontal: Space.lg,
    paddingBottom: Space['4xl'],
  },

  // Header
  header: {
    marginBottom: Space.xl,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontFamily: FontFamily.bold,
    color: DN.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: DN.textMuted,
    marginTop: Space.xs,
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    gap: Space.sm,
    marginBottom: Space.xl,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: DN.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: DN.border,
    padding: Space.md,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.monoBold,
    color: DN.textPrimary,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.mono,
    color: DN.textMuted,
    marginTop: 2,
  },

  // Card
  card: {
    backgroundColor: DN.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: DN.border,
    padding: Space.base,
    marginBottom: Space.xl,
  },

  // Skill Progress
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Space.sm,
  },
  skillInfo: {
    width: 100,
  },
  skillName: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: DN.textPrimary,
  },
  skillMeta: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.mono,
    color: DN.textMuted,
  },
  barContainer: {
    flex: 1,
    height: 6,
    backgroundColor: DN.bgElevated,
    borderRadius: 3,
    marginHorizontal: Space.md,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  proficiency: {
    width: 40,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.monoBold,
    textAlign: 'right',
  },

  // Tag Grid
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Space.sm,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
  },
  tagProficiency: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.mono,
    color: DN.textMuted,
  },

  // Note
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: DN.cyanDark,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: DN.borderFocus,
    padding: Space.md,
  },
  noteText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: DN.textSecondary,
    lineHeight: 18,
  },
});
