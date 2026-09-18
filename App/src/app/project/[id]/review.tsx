import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
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
import { SectionHeader } from '@/components/ui/SectionHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { supabase } from '@/lib/supabase';

type Project = {
  id: string;
  title: string;
};

type AIResult = {
  summary?: string;
  technologies?: string[];
  skills?: string[];
  strengths?: string[];
  suggestions?: string[];
  code_quality?: number;
  architecture?: number;
  innovation?: number;
  documentation?: number;
  overall_score?: number;
};

type ProjectAnalysis = {
  id: string;
  project_id: string;
  ai_summary: string | null;
  ai_technologies: string[] | null;
  ai_skills: string[] | null;
  raw_api_response: AIResult | null;
  generated_at: string;
};

export default function AIReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [project, setProject] = useState<Project | null>(null);
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadReview();
    }
  }, [id]);

  const loadReview = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!id) {
        throw new Error('Project ID is missing.');
      }

      const [projectResult, analysisResult] = await Promise.all([
        supabase
          .from('projects')
          .select('id, title')
          .eq('id', id)
          .single(),

        supabase
          .from('project_analyses')
          .select(
            'id, project_id, ai_summary, ai_technologies, ai_skills, raw_api_response, generated_at'
          )
          .eq('project_id', id)
          .maybeSingle(),
      ]);

      if (projectResult.error) {
        throw projectResult.error;
      }

      if (analysisResult.error) {
        throw analysisResult.error;
      }

      setProject(projectResult.data);
      setAnalysis(analysisResult.data);
    } catch (err) {
      console.error('Error loading AI review:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load the AI review.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={DN.bg} />
        <ActivityIndicator size="large" color={DN.cyan} />
        <Text style={styles.loadingText}>
          Loading AI review...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { paddingTop: insets.top + Space.base },
        ]}
      >
        <StatusBar barStyle="light-content" backgroundColor={DN.bg} />

        <Feather
          name="alert-circle"
          size={40}
          color={DN.cyan}
        />

        <Text style={styles.errorTitle}>
          Unable to load review
        </Text>

        <Text style={styles.errorText}>
          {error}
        </Text>

        <PrimaryButton
          title="Go Back"
          variant="secondary"
          icon="arrow-left"
          onPress={() => router.back()}
          style={{ marginTop: Space.lg }}
        />
      </View>
    );
  }

  if (!analysis) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Space.base },
        ]}
      >
        <StatusBar barStyle="light-content" backgroundColor={DN.bg} />

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather
            name="arrow-left"
            size={20}
            color={DN.textSecondary}
          />
          <Text style={styles.backLabel}>Back</Text>
        </TouchableOpacity>

        <View style={styles.emptyState}>
          <View style={styles.headerIcon}>
            <Feather
              name="zap"
              size={24}
              color={DN.cyan}
            />
          </View>

          <Text style={styles.title}>AI Review</Text>

          <Text style={styles.projectName}>
            {project?.title || 'Project'}
          </Text>

          <Text style={styles.emptyTitle}>
            No AI review available yet
          </Text>

          <Text style={styles.emptyText}>
            This project has not been analyzed by the AI engine yet.
            Generate an AI review from the project details page.
          </Text>
        </View>

        <PrimaryButton
          title="Back to Project"
          variant="secondary"
          icon="arrow-left"
          onPress={() => router.back()}
          style={{ marginTop: Space.xl }}
        />
      </ScrollView>
    );
  }

  const ai = analysis.raw_api_response ?? {};

  const technologies = analysis.ai_technologies ?? [];
  const skills = analysis.ai_skills ?? [];

  const strengths = ai.strengths ?? [];
  const suggestions = ai.suggestions ?? [];

  const scores = [
    {
      label: 'Code Quality',
      value: ai.code_quality ?? 0,
      icon: 'code',
    },
    {
      label: 'Architecture',
      value: ai.architecture ?? 0,
      icon: 'layers',
    },
    {
      label: 'Innovation',
      value: ai.innovation ?? 0,
      icon: 'zap',
    },
    {
      label: 'Documentation',
      value: ai.documentation ?? 0,
      icon: 'file-text',
    },
  ] as const;

  const overallScore = Math.round(ai.overall_score ?? 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Space.base },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={DN.bg}
      />

      {/* Back */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Feather
          name="arrow-left"
          size={20}
          color={DN.textSecondary}
        />
        <Text style={styles.backLabel}>Back</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Feather
            name="zap"
            size={24}
            color={DN.cyan}
          />
        </View>

        <Text style={styles.title}>AI Review</Text>

        <Text style={styles.subtitle}>
          {project?.title || 'Project'}
        </Text>

        <Text style={styles.generated}>
          Generated {getDate(analysis.generated_at)}
        </Text>
      </View>

      {/* Overall Score */}
      <SectionHeader
        title="Overall Score"
        icon="award"
      />

      <View style={styles.scoreCard}>
        <Text style={styles.overallScore}>
          {overallScore}
        </Text>

        <Text style={styles.scoreOutOf}>
          /100
        </Text>

        <View style={styles.scoreBar}>
          <View
            style={[
              styles.scoreBarFill,
              { width: `${overallScore}%` },
            ]}
          />
        </View>
      </View>

      {/* Individual Scores */}
      <SectionHeader
        title="Detailed Scores"
        icon="bar-chart-2"
      />

      <View style={styles.card}>
        {scores.map((score) => (
          <View
            key={score.label}
            style={styles.scoreRow}
          >
            <View style={styles.scoreLabelRow}>
              <View style={styles.scoreLabelLeft}>
                <Feather
                  name={score.icon}
                  size={16}
                  color={DN.cyan}
                />

                <Text style={styles.scoreLabel}>
                  {score.label}
                </Text>
              </View>

              <Text style={styles.scoreValue}>
                {Math.round(score.value)}/100
              </Text>
            </View>

            <View style={styles.smallScoreBar}>
              <View
                style={[
                  styles.smallScoreFill,
                  { width: `${score.value}%` },
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      {/* AI Summary */}
      {analysis.ai_summary && (
        <>
          <SectionHeader
            title="AI Summary"
            icon="file-text"
          />

          <View style={styles.card}>
            <Text style={styles.summaryText}>
              {analysis.ai_summary}
            </Text>
          </View>
        </>
      )}

      {/* Technologies */}
      {technologies.length > 0 && (
        <>
          <SectionHeader
            title="Technologies"
            icon="code"
          />

          <View style={styles.card}>
            <View style={styles.tagContainer}>
              {technologies.map((technology, index) => (
                <View
                  key={`${technology}-${index}`}
                  style={styles.tag}
                >
                  <Text style={styles.tagText}>
                    {technology}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}

      {/* Extracted Skills */}
      {skills.length > 0 && (
        <>
          <SectionHeader
            title="Extracted Skills"
            icon="award"
          />

          <View style={styles.card}>
            {skills.map((skill, index) => (
              <View
                key={`${skill}-${index}`}
                style={styles.skillItem}
              >
                <View style={styles.skillIcon}>
                  <Feather
                    name="check"
                    size={14}
                    color={DN.cyan}
                  />
                </View>

                <Text style={styles.skillText}>
                  {skill}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Strengths */}
      {strengths.length > 0 && (
        <>
          <SectionHeader
            title="Strengths"
            icon="check-circle"
          />

          <View style={styles.card}>
            {strengths.map((strength, index) => (
              <View
                key={`${strength}-${index}`}
                style={styles.listItem}
              >
                <Feather
                  name="check-circle"
                  size={17}
                  color={DN.cyan}
                />

                <Text style={styles.listText}>
                  {strength}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <>
          <SectionHeader
            title="Suggestions"
            icon="alert-circle"
          />

          <View style={styles.card}>
            {suggestions.map((suggestion, index) => (
              <View
                key={`${suggestion}-${index}`}
                style={styles.listItem}
              >
                <Feather
                  name="arrow-up-right"
                  size={17}
                  color={DN.cyan}
                />

                <Text style={styles.listText}>
                  {suggestion}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Information */}
      <View style={styles.noteCard}>
        <Feather
          name="info"
          size={14}
          color={DN.cyan}
          style={{ marginRight: Space.sm }}
        />

        <Text style={styles.noteText}>
          This review was generated by the AI analysis engine
          using the project's stored information and skills.
        </Text>
      </View>

      <PrimaryButton
        title="Back to Project"
        variant="secondary"
        icon="arrow-left"
        onPress={() => router.back()}
        style={{ marginTop: Space.base }}
      />

      <View style={{ height: Space['3xl'] }} />
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

  loadingContainer: {
    flex: 1,
    backgroundColor: DN.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Space.lg,
  },

  loadingText: {
    marginTop: Space.md,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: DN.textSecondary,
  },

  errorTitle: {
    marginTop: Space.lg,
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: DN.textPrimary,
  },

  errorText: {
    marginTop: Space.sm,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: DN.textMuted,
    textAlign: 'center',
  },

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

  header: {
    alignItems: 'center',
    marginBottom: Space.xl,
  },

  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DN.cyan + '1a',
    borderWidth: 1,
    borderColor: DN.cyan + '33',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.md,
  },

  title: {
    fontSize: FontSize['2xl'],
    fontFamily: FontFamily.bold,
    color: DN.textPrimary,
  },

  subtitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: DN.textSecondary,
    marginTop: Space.xs,
    textAlign: 'center',
  },

  generated: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: DN.textMuted,
    marginTop: Space.xs,
  },

  projectName: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: DN.textSecondary,
    marginTop: Space.sm,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: Space.xl,
  },

  emptyTitle: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: DN.textPrimary,
    marginTop: Space.xl,
    textAlign: 'center',
  },

  emptyText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: DN.textMuted,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: Space.sm,
    maxWidth: 500,
  },

  card: {
    backgroundColor: DN.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: DN.border,
    padding: Space.base,
    marginBottom: Space.xl,
  },

  // Overall score
  scoreCard: {
    backgroundColor: DN.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: DN.border,
    padding: Space.xl,
    marginBottom: Space.xl,
    alignItems: 'center',
  },

  overallScore: {
    fontSize: 64,
    fontFamily: FontFamily.monoBold,
    color: DN.cyan,
  },

  scoreOutOf: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.mono,
    color: DN.textMuted,
    marginTop: -Space.sm,
    marginBottom: Space.lg,
  },

  scoreBar: {
    width: '100%',
    height: 8,
    backgroundColor: DN.bgElevated,
    borderRadius: 4,
    overflow: 'hidden',
  },

  scoreBarFill: {
    height: '100%',
    backgroundColor: DN.cyan,
    borderRadius: 4,
  },

  // Detailed scores
  scoreRow: {
    marginBottom: Space.lg,
  },

  scoreLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Space.sm,
  },

  scoreLabelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
  },

  scoreLabel: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: DN.textSecondary,
  },

  scoreValue: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.monoBold,
    color: DN.cyan,
  },

  smallScoreBar: {
    height: 6,
    backgroundColor: DN.bgElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },

  smallScoreFill: {
    height: '100%',
    backgroundColor: DN.cyan,
    borderRadius: 3,
  },

  summaryText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: DN.textSecondary,
    lineHeight: 23,
  },

  // Technologies
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Space.sm,
  },

  tag: {
    backgroundColor: DN.bgElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: DN.borderFocus,
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
  },

  tagText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: DN.cyan,
  },

  // Skills
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Space.sm,
  },

  skillIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: DN.cyan + '1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Space.md,
  },

  skillText: {
    flex: 1,
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: DN.textSecondary,
  },

  // Strengths / suggestions
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Space.md,
    paddingVertical: Space.sm,
  },

  listText: {
    flex: 1,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: DN.textSecondary,
    lineHeight: 22,
  },

  // Information
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