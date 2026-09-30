import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  DN,
  FontFamily,
  FontSize,
  Space,
  Radius,
} from '@/constants/design-tokens';
import { SkillTag } from '@/components/ui/SkillTag';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { supabase } from '@/lib/supabase';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const goBackOrToPortfolio = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/portfolio');
  };

  const fetchProject = async () => {
    if (!id) return;

    setLoading(true);
    setNotFound(false);

    const [{ data, error }, { data: skillData, error: skillError }] =
      await Promise.all([
        supabase
          .from('projects')
          .select(
            '*, project_analyses(ai_summary, ai_technologies, generated_at)'
          )
          .eq('id', id)
          .single(),

        supabase
          .from('project_skills')
          .select('skills(id, name, category)')
          .eq('project_id', id),
      ]);

    if (error || !data) {
      console.error('Project fetch error:', error);
      setNotFound(true);
      setLoading(false);
      return;
    }

    if (skillError) {
      console.error('Skills fetch error:', skillError);
    }

    const techStack = (skillData ?? [])
      .map((item: any) => item.skills?.name)
      .filter(Boolean);

    const analysis = data.project_analyses?.[0];

    setProject({
      ...data,
      tech_stack: techStack,
      ai_summary: analysis?.ai_summary || null,
    });

    setLoading(false);
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const requestAIReview = async () => {
    if (!project?.id || analyzing) return;

    try {
      setAnalyzing(true);

      const { data, error } = await supabase.functions.invoke(
        'analyze-project',
        {
          body: {
            projectId: project.id,
          },
        }
      );

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'AI review failed');
      }

      await fetchProject();

      router.push(`/project/${project.id}/review`);
    } catch (error) {
      console.error('AI review error:', error);

      Alert.alert(
        'AI Review Failed',
        error instanceof Error
          ? error.message
          : 'Unable to generate the AI review. Please try again.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = () => {
    if (!project) return;

    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${project.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const {
                data: { user },
                error: userError,
              } = await supabase.auth.getUser();

              if (userError || !user) {
                throw new Error('You must be signed in to delete a project.');
              }

              // Related records are removed by the database's ON DELETE CASCADE
              // constraints. Do not request RETURNING data here; that couples
              // deletion to a separate SELECT policy.
              const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', project.id)
                .eq('user_id', user.id);
                
              if (error) throw error;

              const { data: remainingProject, error: verifyError } =
                await supabase
                  .from('projects')
                  .select('id')
                  .eq('id', project.id)
                  .eq('user_id', user.id)
                  .maybeSingle();

              if (verifyError) throw verifyError;

              if (remainingProject) {
                throw new Error('The project was not deleted. Please refresh and try again.');
              }
              
              router.replace({
                pathname: '/(tabs)/portfolio',
                params: { deleted: project.title },
              });
            } catch (err: any) {
              console.error('Error deleting project:', err);
              Alert.alert('Error', err?.message || 'Failed to delete project.');
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  const updateStatus = async (newStatus: string) => {
    if (!project || project.status === newStatus) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', project.id);

      if (error) throw error;
      
      await fetchProject();
    } catch (err: any) {
      console.error('Error updating status:', err);
      Alert.alert('Error', err?.message || 'Failed to update status.');
      setLoading(false); // Only disable loading on error, fetchProject does it on success
    }
  };


  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar barStyle="light-content" backgroundColor={DN.bg} />
        <ActivityIndicator color={DN.cyan} size="large" />
      </View>
    );
  }

  if (notFound || !project) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar barStyle="light-content" backgroundColor={DN.bg} />

        <Feather
          name="alert-circle"
          size={48}
          color={DN.textMuted}
        />

        <Text style={styles.notFoundText}>
          Project not found
        </Text>

        <PrimaryButton
          title="Go Back"
          variant="ghost"
          onPress={goBackOrToPortfolio}
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
        onPress={goBackOrToPortfolio}
        activeOpacity={0.7}
      >
        <Feather
          name="arrow-left"
          size={20}
          color={DN.textSecondary}
        />
        <Text style={styles.backLabel}>Back</Text>
      </TouchableOpacity>


      {/* Project Image */}
      {project.thumbnail_url ? (
        <Image
          source={{ uri: project.thumbnail_url }}
          style={{
            width: '100%',
            height: 200,
            borderRadius: Radius.xl,
            marginBottom: Space.xl,
          }}
          resizeMode="cover"
        />
      ) : null}

      {/* Project Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.titleRow}>
            <View style={styles.projectIcon}>
              <Feather
                name="folder"
                size={20}
                color={DN.cyan}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.projectTitle}>
                {project.title}
              </Text>

              <Text style={styles.projectDate}>
                Updated{' '}
                {new Date(project.updated_at).toLocaleDateString(
                  'en-US',
                  {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }
                )}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              project.status === 'completed' &&
              styles.statusCompleted,
              project.status === 'active' &&
              styles.statusActive,
              project.status === 'archived' &&
              styles.statusArchived,
            ]}
          >
            <Text style={styles.statusText}>
              {project.status}
            </Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          {project.status === 'active' && (
            <>
              <TouchableOpacity onPress={() => updateStatus('completed')} style={styles.quickActionBtn}>
                <Feather name="check-circle" size={14} color={DN.success} />
                <Text style={[styles.quickActionText, { color: DN.success }]}>Mark Completed</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => updateStatus('archived')} style={styles.quickActionBtn}>
                <Feather name="archive" size={14} color={DN.textSecondary} />
                <Text style={[styles.quickActionText, { color: DN.textSecondary }]}>Archive</Text>
              </TouchableOpacity>
            </>
          )}
          
          {project.status === 'completed' && (
            <>
              <TouchableOpacity onPress={() => updateStatus('active')} style={styles.quickActionBtn}>
                <Feather name="play" size={14} color={DN.cyan} />
                <Text style={[styles.quickActionText, { color: DN.cyan }]}>Reactivate</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => updateStatus('archived')} style={styles.quickActionBtn}>
                <Feather name="archive" size={14} color={DN.textSecondary} />
                <Text style={[styles.quickActionText, { color: DN.textSecondary }]}>Archive</Text>
              </TouchableOpacity>
            </>
          )}

          {project.status === 'archived' && (
            <TouchableOpacity onPress={() => updateStatus('active')} style={styles.quickActionBtn}>
              <Feather name="play" size={14} color={DN.cyan} />
              <Text style={[styles.quickActionText, { color: DN.cyan }]}>Reactivate</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Description */}
      <SectionHeader title="Description" icon="file-text" />

      <View style={styles.card}>
        <Text style={styles.description}>
          {project.description}
        </Text>
      </View>

      {/* Tech Stack */}
      {project.tech_stack.length > 0 && (
        <>
          <SectionHeader title="Tech Stack" icon="code" />

          <View style={styles.card}>
            <View style={styles.techGrid}>
              {project.tech_stack.map((tech: string) => (
                <SkillTag
                  key={tech}
                  label={tech}
                  size="md"
                />
              ))}
            </View>
          </View>
        </>
      )}

      {/* AI Summary */}
      {project.ai_summary && (
        <>
          <SectionHeader title="AI Summary" icon="zap" />

          <View style={styles.card}>
            <Text style={styles.description}>
              {project.ai_summary}
            </Text>
          </View>
        </>
      )}

      {/* AI Score */}
      {project.ai_score !== null &&
        project.ai_score !== undefined && (
          <>
            <SectionHeader
              title="AI Review Score"
              icon="zap"
            />

            <View style={styles.card}>
              <View style={styles.scoreDisplay}>
                <Text style={styles.scoreNumber}>
                  {Math.round(project.ai_score)}
                </Text>

                <Text style={styles.scoreMax}>
                  /100
                </Text>
              </View>

              <View style={styles.scoreBar}>
                <View
                  style={[
                    styles.scoreBarFill,
                    {
                      width: `${Math.min(
                        Math.max(project.ai_score, 0),
                        100
                      )}%`,
                    },
                  ]}
                />
              </View>

              <TouchableOpacity
                style={styles.viewReviewBtn}
                onPress={() =>
                  router.push(
                    `/project/${project.id}/review`
                  )
                }
                activeOpacity={0.7}
              >
                <Feather
                  name="eye"
                  size={14}
                  color={DN.cyan}
                />

                <Text style={styles.viewReviewText}>
                  View Full Review
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

      {/* Project Links */}
      {(project.github_url || project.live_demo_url) && (
        <View style={styles.linkButtonsRow}>
          {project.github_url && (
            <TouchableOpacity
              style={[
                styles.linkButton,
                styles.githubButton,
                styles.linkButtonCompact,
              ]}
              activeOpacity={0.8}
              onPress={() => Linking.openURL(project.github_url)}
            >
              <Feather
                name="github"
                size={18}
                color="#ffffff"
              />

              <Text style={styles.linkButtonText}>
                GitHub
              </Text>

              <Feather
                name="external-link"
                size={15}
                color="#ffffff"
              />
            </TouchableOpacity>
          )}

          {project.live_demo_url && (
            <TouchableOpacity
              style={[
                styles.linkButton,
                styles.linkButtonCompact,
              ]}
              activeOpacity={0.8}
              onPress={() => Linking.openURL(project.live_demo_url)}
            >
              <Feather
                name="globe"
                size={18}
                color={DN.cyan}
              />

              <Text style={styles.linkButtonText}>
                Live Demo
              </Text>

              <Feather
                name="external-link"
                size={15}
                color={DN.cyan}
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Project Information */}
      <SectionHeader
        title="Project Information"
        icon="info"
      />

      <View style={styles.card}>
        <MetaRow
          label="Created"
          value={new Date(project.created_at).toLocaleDateString()}
        />

        <MetaRow
          label="Last Updated"
          value={new Date(project.updated_at).toLocaleDateString()}
        />
      </View>


      {/* Action Buttons */}
      <View style={styles.actions}>
        <PrimaryButton
          title="Edit Project"
          icon="edit-2"
          variant="secondary"
          onPress={() =>
            router.push(
              `/project/${project.id}/edit`
            )
          }
          disabled={analyzing || deleting}
        />

        {!project.ai_score && (
          <PrimaryButton
            title={
              analyzing
                ? 'Generating AI Review...'
                : 'Request AI Review'
            }
            icon={analyzing ? undefined : 'zap'}
            onPress={requestAIReview}
            disabled={analyzing || deleting}
            style={{ marginTop: Space.sm }}
          />
        )}

        <View style={styles.dangerZone}>
          <PrimaryButton
            title="Delete Project"
            icon="trash-2"
            variant="danger"
            onPress={handleDelete}
            loading={deleting}
            disabled={analyzing || deleting}
          />
        </View>
      </View>

      <View style={{ height: Space['3xl'] }} />
    </ScrollView>
  );
}

function MetaRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>
        {label}
      </Text>

      <Text style={styles.metaValue}>
        {value}
      </Text>
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
    padding: Space.lg,
    marginBottom: Space.xl,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Space.md,
  },

  projectIcon: {
    width: 42,
    height: 42,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Space.md,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Space.md,
    marginTop: Space.lg,
    paddingTop: Space.md,
    borderTopWidth: 1,
    borderTopColor: DN.border,
  },

  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
  },

  quickActionText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
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

  linkButton: {
    backgroundColor: DN.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: DN.border,
    paddingHorizontal: Space.base,
    paddingVertical: Space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Space.xl,
  },

  githubButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },

  linkButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    flex: 1,
  },

  linkButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: DN.textPrimary,
  },
  linkButtonsRow: {
    flexDirection: 'row',
    gap: Space.sm,
    marginBottom: Space.xl,
  },

  linkButtonCompact: {
    flex: 1,
    marginBottom: 0,
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

  dangerZone: {
    marginTop: Space.xl,
    paddingTop: Space.lg,
    borderTopWidth: 1,
    borderTopColor: DN.border,
  },
});
