import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { DN, FontFamily, FontSize, Space, Radius } from '@/constants/design-tokens';
import { SkillTag } from '@/components/ui/SkillTag';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { MOCK_PROJECTS } from '@/lib/mock-data';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const project = MOCK_PROJECTS.find((p) => p.id === id);

  if (!project) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar barStyle="light-content" backgroundColor={DN.bg} />
        <Feather name="alert-circle" size={48} color={DN.textMuted} />
        <Text style={styles.notFoundText}>Project not found</Text>
        <PrimaryButton
          title="Go Back"
          variant="ghost"
          onPress={() => router.back()}
          fullWidth={false}
          style={{ marginTop: Space.lg }}
        />
      </View>
    );
  }

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

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Feather name="arrow-left" size={20} color={DN.textSecondary} />
        <Text style={styles.backLabel}>Back</Text>
      </TouchableOpacity>

      {/* Project Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.projectIcon}>
            <Feather name="folder" size={24} color={DN.cyan} />
          </View>
          <View
            style={[
              styles.statusBadge,
              project.status === 'completed' && styles.statusCompleted,
              project.status === 'active' && styles.statusActive,
              project.status === 'archived' && styles.statusArchived,
            ]}
          >
            <Text style={styles.statusText}>{project.status}</Text>
          </View>
        </View>
        <Text style={styles.projectTitle}>{project.title}</Text>
        <Text style={styles.projectDate}>
          Updated{' '}
          {new Date(project.updated_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>

      {/* Description */}
      <SectionHeader title="Description" icon="file-text" />
      <View style={styles.card}>
        <Text style={styles.description}>{project.description}</Text>
      </View>

      {/* Tech Stack */}
      <SectionHeader title="Tech Stack" icon="code" />
      <View style={styles.card}>
        <View style={styles.techGrid}>
          {project.tech_stack.map((tech) => (
            <SkillTag key={tech} label={tech} size="md" />
          ))}
        </View>
      </View>

      {/* AI Score */}
      {project.ai_score !== null && (
        <>
          <SectionHeader title="AI Review Score" icon="zap" />
          <View style={styles.card}>
            <View style={styles.scoreDisplay}>
              <Text style={styles.scoreNumber}>{project.ai_score}</Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
            <View style={styles.scoreBar}>
              <View
                style={[styles.scoreBarFill, { width: `${project.ai_score}%` }]}
              />
            </View>
            <TouchableOpacity
              style={styles.viewReviewBtn}
              onPress={() => router.push(`/project/${project.id}/review`)}
              activeOpacity={0.7}
            >
              <Feather name="eye" size={14} color={DN.cyan} />
              <Text style={styles.viewReviewText}>View Full Review</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* GitHub Link */}
      <SectionHeader title="Repository" icon="github" />
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => Linking.openURL(project.github_url)}
      >
        <View style={styles.githubRow}>
          <Feather name="github" size={18} color={DN.textSecondary} />
          <Text style={styles.githubUrl} numberOfLines={1}>
            {project.github_url}
          </Text>
          <Feather name="external-link" size={14} color={DN.textMuted} />
        </View>
      </TouchableOpacity>

      {/* Metadata */}
      <SectionHeader title="Metadata" icon="info" />
      <View style={styles.card}>
        <MetaRow label="Created" value={new Date(project.created_at).toLocaleDateString()} />
        <MetaRow label="Updated" value={new Date(project.updated_at).toLocaleDateString()} />
        <MetaRow label="Status" value={project.status} />
        <MetaRow label="ID" value={project.id} />
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <PrimaryButton
          title="Edit Project"
          icon="edit-2"
          variant="secondary"
          onPress={() => router.push(`/project/${project.id}/edit`)}
        />
        {project.ai_score === null && (
          <PrimaryButton
            title="Request AI Review"
            icon="zap"
            onPress={() => router.push(`/project/${project.id}/review`)}
            style={{ marginTop: Space.sm }}
          />
        )}
      </View>

      <View style={{ height: Space['3xl'] }} />
    </ScrollView>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DN.bg,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Space.lg,
    paddingBottom: Space['4xl'],
  },
  notFoundText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: DN.textMuted,
    marginTop: Space.md,
  },

  // Back
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    marginBottom: Space.lg,
  },
  backLabel: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: DN.textSecondary,
  },

  // Header Card
  headerCard: {
    backgroundColor: DN.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: DN.border,
    padding: Space.xl,
    marginBottom: Space.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Space.md,
  },
  projectIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: DN.bgElevated,
    borderWidth: 1,
    borderColor: DN.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: Space.md,
    paddingVertical: Space.xs,
    borderRadius: Radius.full,
    backgroundColor: DN.bgElevated,
  },
  statusCompleted: {
    backgroundColor: DN.successBg,
  },
  statusActive: {
    backgroundColor: DN.cyan + '1a',
  },
  statusArchived: {
    backgroundColor: DN.bgElevated,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.mono,
    fontWeight: '600',
    color: DN.textSecondary,
    textTransform: 'capitalize',
  },
  projectTitle: {
    fontSize: FontSize['2xl'],
    fontFamily: FontFamily.bold,
    color: DN.textPrimary,
  },
  projectDate: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.mono,
    color: DN.textMuted,
    marginTop: Space.xs,
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

  // Description
  description: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: DN.textSecondary,
    lineHeight: 22,
  },

  // Tech
  techGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Space.sm,
  },

  // Score
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: Space.md,
  },
  scoreNumber: {
    fontSize: 48,
    fontFamily: FontFamily.monoBold,
    color: DN.cyan,
  },
  scoreMax: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.mono,
    color: DN.textMuted,
  },
  scoreBar: {
    height: 8,
    backgroundColor: DN.bgElevated,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Space.md,
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: DN.cyan,
    borderRadius: 4,
  },
  viewReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.xs,
    paddingVertical: Space.sm,
  },
  viewReviewText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: DN.cyan,
  },

  // GitHub
  githubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
  },
  githubUrl: {
    flex: 1,
    fontSize: FontSize.md,
    fontFamily: FontFamily.mono,
    color: DN.textSecondary,
  },

  // Meta
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Space.sm,
    borderBottomWidth: 1,
    borderBottomColor: DN.border,
  },
  metaLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.mono,
    color: DN.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: DN.textPrimary,
  },

  // Actions
  actions: {
    marginTop: Space.base,
  },
});
