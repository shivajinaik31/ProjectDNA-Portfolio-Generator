import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DN, FontFamily, FontSize, Space, Radius } from '@/constants/design-tokens';
import { AvatarDisplay } from '@/components/ui/AvatarDisplay';
import { StatWidget } from '@/components/ui/StatWidget';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SkillTag } from '@/components/ui/SkillTag';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const { session, profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

const [stats, setStats] = useState({
  projectCount: 0,
  skillCount: 0,
  avgScore: 0,
});
const [projects, setProjects] = useState<any[]>([]);
const [activities, setActivities] = useState<any[]>([]);
const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!session?.user?.id) return;
      const userId = session.user.id;

      async function fetchData() {
        // Fetch Stats
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setAvatarUrl(
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            null
          );
        }
        const { data: statsData } = await supabase
          .from('user_dashboard_stats')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (statsData) {
          setStats({
            projectCount: statsData.total_projects || 0,
            skillCount: statsData.total_skills || 0,
            avgScore: statsData.avg_ai_score || 0,
          });
        }

        // Fetch Recent Projects
        const { data: projectsData } = await supabase
          .from('projects')
          .select('*, project_analyses(ai_technologies)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(3);

        if (projectsData) {
          setProjects(projectsData.map(p => ({
            ...p,
            tech_stack: p.project_analyses?.[0]?.ai_technologies || [],
          })));
        }

        // Fetch Activities
        const { data: activitiesData } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (activitiesData && activitiesData.length > 0) {
          setActivities(activitiesData);
        } else if (projectsData && projectsData.length > 0) {
          setActivities(
            projectsData.map((project) => ({
              id: `project-${project.id}`,
              message: `Project added: ${project.title}`,
              created_at: project.created_at,
            }))
          );
        } else {
          setActivities([]);
        }
      }

      fetchData();
    }, [session?.user?.id])
  );

  const handleDelete = (project: any) => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${project.title}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const {
                data: { user },
              } = await supabase.auth.getUser();

              if (!user) {
                throw new Error('You must be signed in to delete a project.');
              }

              const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', project.id)
                .eq('user_id', user.id);

              if (error) throw error;

              setProjects((current) =>
                current.filter((item) => item.id !== project.id)
              );
            } catch (error: any) {
              Alert.alert(
                'Error',
                error?.message || 'Failed to delete project.'
              );
            }
          },
        },
      ]
    );
  };

  const displayName =
    profile?.full_name ||
    session?.user?.user_metadata?.full_name ||
    session?.user?.email?.split('@')[0] ||
    'User';

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

      {/* ─── Header ──────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{displayName}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
          <AvatarDisplay uri={avatarUrl} name={displayName} size="md" />
        </TouchableOpacity>
      </View>

      {/* ─── Stats Row ───────────────────────────────── */}
      <View style={styles.statsRow}>
        <StatWidget label="Projects" value={stats.projectCount} icon="layers" />
        <StatWidget label="Skills" value={stats.skillCount} icon="cpu" iconColor="#6366f1" />
        <StatWidget label="Avg Score" value={stats.avgScore} icon="trending-up" iconColor="#52c41a" />
      </View>

      {/* ─── Quick Actions ───────────────────────────── */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          activeOpacity={0.8}
          onPress={() => router.push('/project/add')}
        >
          <View style={[styles.quickIconBox, { backgroundColor: DN.cyan + '1a' }]}>
            <Feather name="plus-circle" size={20} color={DN.cyan} />
          </View>
          <Text style={styles.quickLabel}>Add Project</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/portfolio')}
        >
          <View style={[styles.quickIconBox, { backgroundColor: '#6366f1' + '1a' }]}>
            <Feather name="briefcase" size={20} color="#6366f1" />
          </View>
          <Text style={styles.quickLabel}>Portfolio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/skills')}
        >
          <View style={[styles.quickIconBox, { backgroundColor: '#52c41a' + '1a' }]}>
            <Feather name="activity" size={20} color="#52c41a" />
          </View>
          <Text style={styles.quickLabel}>Skill DNA</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          activeOpacity={0.8}
          onPress={() => router.push('/resume-builder')}
        >
          <View style={[styles.quickIconBox, { backgroundColor: '#00c3e4' + '1a' }]}>
            <Feather name="file-text" size={20} color={DN.cyan} />
          </View>
          <Text style={styles.quickLabel}>AI Resume</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Recent Projects ─────────────────────────── */}
      <SectionHeader
        title="Recent Projects"
        icon="layers"
        actionLabel="View All"
        onAction={() => router.push('/(tabs)/portfolio')}
      />
      {projects.map((project) => (
        <TouchableOpacity
          key={project.id}
          style={styles.projectCard}
          activeOpacity={0.8}
          onPress={() => router.push(`/project/${project.id}`)}
        >
          {project.thumbnail_url ? (
            <Image
              source={{ uri: project.thumbnail_url }}
              style={styles.projectThumbnail}
              resizeMode="cover"
            />
          ) : null}

          <View style={styles.projectCardHeader}>
            <Text style={styles.projectTitle} numberOfLines={1}>
              {project.title}
            </Text>
            <View style={styles.headerActions}>
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

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(project)}
                activeOpacity={0.7}
              >
                <Feather name="trash-2" size={16} color="#ff4d4f" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.projectDesc} numberOfLines={2}>
            {project.description}
          </Text>
          <View style={styles.techRow}>
            {project.tech_stack.slice(0, 3).map((tech: string) => (
              <SkillTag key={tech} label={tech} size="sm" />
            ))}
            {project.tech_stack.length > 3 && (
              <Text style={styles.moreTech}>+{project.tech_stack.length - 3}</Text>
            )}
          </View>
          {project.ai_score !== undefined && project.ai_score !== null && (
            <View style={styles.scoreRow}>
              <Feather name="zap" size={12} color={DN.cyan} />
              <Text style={styles.scoreLabel}>AI Score</Text>
              <Text style={styles.scoreValue}>{project.ai_score}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      <SectionHeader title="Recent Activity" icon="clock" />
      <View style={styles.activityCard}>
        {activities.length === 0 ? (
          <Text style={{ ...styles.activityMessage, padding: Space.md, textAlign: 'center' }}>No recent activity.</Text>
        ) : (
          activities.map((activity, idx) => (
            <View
              key={activity.id}
              style={[
                styles.activityItem,
                idx < activities.length - 1 && styles.activityItemBorder,
              ]}
            >
              <View style={styles.activityDot} />
              <View style={styles.activityContent}>
                <Text style={styles.activityMessage}>{activity.message}</Text>
                <Text style={styles.activityTime}>
                  {new Date(activity.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          ))
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Space.xl,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: DN.textSecondary,
  },
  name: {
    fontSize: FontSize['2xl'],
    fontFamily: FontFamily.bold,
    color: DN.textPrimary,
    marginTop: 2,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: Space.sm,
    marginBottom: Space.xl,
  },

  // Quick Actions
quickActions: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: Space.sm,
  marginBottom: Space.xl,
},

quickAction: {
  width: '48%',
  backgroundColor: DN.bgCard,
  borderRadius: Radius.lg,
  borderWidth: 1,
  borderColor: DN.border,
  padding: Space.md,
  alignItems: 'center',
},
  quickIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.sm,
  },
  quickLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: DN.textSecondary,
  },
  projectThumbnail: {
    width: '100%',
    height: 140,
    borderRadius: Radius.md,
    marginBottom: Space.md,
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
  projectCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Space.sm,
  },
  projectTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semiBold,
    color: DN.textPrimary,
    flex: 1,
    marginRight: Space.sm,
  },
  statusBadge: {
    paddingHorizontal: Space.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    backgroundColor: DN.bgElevated,
  },
  headerActions: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: Space.sm,
},

deleteButton: {
  width: 32,
  height: 32,
  borderRadius: Radius.md,
  alignItems: 'center',
  justifyContent: 'center',
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
    color: DN.textSecondary,
    textTransform: 'capitalize',
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
    marginBottom: Space.sm,
  },
  moreTech: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.mono,
    color: DN.textMuted,
    alignSelf: 'center',
    marginLeft: Space.xs,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Space.xs,
    gap: Space.xs,
  },
  scoreLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.mono,
    color: DN.textMuted,
  },
  scoreValue: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.monoBold,
    color: DN.cyan,
  },

  // Activity
  activityCard: {
    backgroundColor: DN.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: DN.border,
    padding: Space.base,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Space.md,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: DN.border,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DN.cyan,
    marginTop: 6,
    marginRight: Space.md,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: DN.textSecondary,
    lineHeight: 20,
  },
  activityTime: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.mono,
    color: DN.textMuted,
    marginTop: 2,
  },
});
