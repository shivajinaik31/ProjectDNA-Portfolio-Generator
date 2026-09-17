import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DN, FontFamily, FontSize, Space, Radius } from '@/constants/design-tokens';
import { SkillTag } from '@/components/ui/SkillTag';
import { EmptyState } from '@/components/ui/EmptyState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { supabase } from '@/lib/supabase';

type FilterStatus = 'all' | 'active' | 'completed' | 'archived';

export default function PortfolioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function fetchProjects() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data } = await supabase
          .from('projects')
          .select('*, project_analyses(ai_technologies)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (data) {
          setProjects(data.map(p => ({
            ...p,
            tech_stack: p.project_analyses?.[0]?.ai_technologies || [],
            // ai_score is already a column on the projects table
          })));
        }
        setLoading(false);
      }
      fetchProjects();
    }, [])
  );

  const filteredProjects =
    filter === 'all'
      ? projects
      : projects.filter((p) => p.status === filter);

  const filters: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'archived', label: 'Archived' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={DN.bg} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Space.base },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Portfolio</Text>
            <Text style={styles.subtitle}>
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.8}
            onPress={() => router.push('/project/add')}
          >
            <Feather name="plus" size={20} color={DN.bg} />
          </TouchableOpacity>
        </View>

        {/* Filter Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterBar}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                filter === f.key && styles.filterChipActive,
              ]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterLabel,
                  filter === f.key && styles.filterLabelActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Project List */}
        {loading ? (
          <ActivityIndicator color={DN.cyan} style={{ marginTop: Space['2xl'] }} />
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            icon="folder"
            title="No projects found"
            message="Try changing the filter or add a new project."
            action={
              <PrimaryButton
                title="Add Project"
                icon="plus"
                onPress={() => router.push('/project/add')}
                fullWidth={false}
              />
            }
          />
        ) : (
          filteredProjects.map((project) => (
            <TouchableOpacity
              key={project.id}
              style={styles.projectCard}
              activeOpacity={0.8}
              onPress={() => router.push(`/project/${project.id}`)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.projectIcon}>
                    <Feather name="folder" size={18} color={DN.cyan} />
                  </View>
                  <View style={styles.cardTitleArea}>
                    <Text style={styles.projectTitle} numberOfLines={1}>
                      {project.title}
                    </Text>
                    <Text style={styles.projectDate}>
                      {new Date(project.updated_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusDot,
                    project.status === 'completed' && { backgroundColor: '#52c41a' },
                    project.status === 'active' && { backgroundColor: DN.cyan },
                    project.status === 'archived' && { backgroundColor: DN.textMuted },
                  ]}
                />
              </View>

              <Text style={styles.projectDesc} numberOfLines={2}>
                {project.description}
              </Text>

              <View style={styles.techRow}>
                {project.tech_stack.slice(0, 4).map((tech: string) => (
                  <SkillTag key={tech} label={tech} size="sm" />
                ))}
                {project.tech_stack.length > 4 && (
                  <Text style={styles.moreTech}>+{project.tech_stack.length - 4}</Text>
                )}
              </View>

              <View style={styles.cardFooter}>
                {project.ai_score !== null ? (
                  <View style={styles.scoreRow}>
                    <Feather name="zap" size={12} color={DN.cyan} />
                    <Text style={styles.scoreValue}>{project.ai_score}/100</Text>
                  </View>
                ) : (
                  <View style={styles.scoreRow}>
                    <Feather name="zap" size={12} color={DN.textMuted} />
                    <Text style={styles.noScore}>Not reviewed</Text>
                  </View>
                )}
                <Feather name="chevron-right" size={16} color={DN.textMuted} />
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: Space['2xl'] }} />
      </ScrollView>
    </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Space.lg,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontFamily: FontFamily.bold,
    color: DN.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.mono,
    color: DN.textMuted,
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: DN.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filter Bar
  filterBar: {
    marginBottom: Space.lg,
  },
  filterContent: {
    gap: Space.sm,
  },
  filterChip: {
    paddingHorizontal: Space.base,
    paddingVertical: Space.sm,
    borderRadius: Radius.full,
    backgroundColor: DN.bgCard,
    borderWidth: 1,
    borderColor: DN.border,
  },
  filterChipActive: {
    backgroundColor: DN.cyan + '1a',
    borderColor: DN.cyan,
  },
  filterLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: DN.textMuted,
  },
  filterLabelActive: {
    color: DN.cyan,
  },

  // Project Card
  projectCard: {
    backgroundColor: DN.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: DN.border,
    padding: Space.base,
    marginBottom: Space.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Space.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  projectIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: DN.bgElevated,
    borderWidth: 1,
    borderColor: DN.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Space.md,
  },
  cardTitleArea: {
    flex: 1,
  },
  projectTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semiBold,
    color: DN.textPrimary,
  },
  projectDate: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.mono,
    color: DN.textMuted,
    marginTop: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: Space.sm,
  },
  projectDesc: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: DN.textMuted,
    lineHeight: 20,
    marginBottom: Space.md,
  },
  techRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Space.xs,
    marginBottom: Space.md,
  },
  moreTech: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.mono,
    color: DN.textMuted,
    alignSelf: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: DN.border,
    paddingTop: Space.md,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
  },
  scoreValue: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.monoBold,
    color: DN.cyan,
  },
  noScore: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.mono,
    color: DN.textMuted,
  },
});
