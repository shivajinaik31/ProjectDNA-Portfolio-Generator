import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Alert,
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
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SkillTag } from '@/components/ui/SkillTag';
import { supabase } from '@/lib/supabase';

type Project = {
  id: string;
  title: string;
  description: string | null;
  github_url: string | null;
};

type SkillCategory = 'language' | 'framework' | 'tool' | 'concept';

const getSkillCategory = (skill: string): SkillCategory => {
  const name = skill.toLowerCase().trim();

  const languages = [
    'javascript',
    'typescript',
    'python',
    'java',
    'c',
    'c++',
    'c#',
    'dart',
    'kotlin',
    'swift',
    'go',
    'rust',
    'php',
    'ruby',
    'sql',
  ];

  const frameworks = [
    'react',
    'react native',
    'next.js',
    'nextjs',
    'angular',
    'vue',
    'nuxt',
    'flutter',
    'express',
    'express.js',
    'node.js',
    'nodejs',
    'spring',
    'spring boot',
    'django',
    'laravel',
    'nestjs',
    'tailwind',
  ];

  const tools = [
    'firebase',
    'supabase',
    'mysql',
    'postgresql',
    'postgres',
    'mongodb',
    'redis',
    'git',
    'github',
    'docker',
    'aws',
    'vercel',
    'nginx',
    'xampp',
    'figma',
    'postman',
  ];

  if (languages.includes(name)) return 'language';
  if (frameworks.includes(name)) return 'framework';
  if (tools.includes(name)) return 'tool';

  return 'concept';
};

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [techInput, setTechInput] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;

      try {
        // Load project and its skills together
        const [projectResult, skillsResult] = await Promise.all([
          supabase
            .from('projects')
            .select('id, title, description, github_url')
            .eq('id', id)
            .single(),

          supabase
            .from('project_skills')
            .select('skill_id, skills(name)')
            .eq('project_id', id),
        ]);

        if (projectResult.error) {
          throw projectResult.error;
        }

        if (skillsResult.error) {
          throw skillsResult.error;
        }

        const data = projectResult.data;

        setProject(data);
        setTitle(data.title || '');
        setDescription(data.description || '');
        setGithubUrl(data.github_url || '');

        const skills = (skillsResult.data || [])
          .map((item: any) => {
            const skill = Array.isArray(item.skills)
              ? item.skills[0]
              : item.skills;

            return skill?.name;
          })
          .filter(Boolean);

        setTechStack(skills);
      } catch (error) {
        console.error('Error fetching project:', error);
        Alert.alert('Error', 'Could not load project.');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  const addTech = () => {
    const tech = techInput.trim();

    if (!tech) return;

    const exists = techStack.some(
      (item) => item.toLowerCase() === tech.toLowerCase()
    );

    if (!exists) {
      setTechStack((current) => [...current, tech]);
    }

    setTechInput('');
  };

  const removeTech = (tech: string) => {
    setTechStack((current) =>
      current.filter((item) => item !== tech)
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Project title is required.');
      return;
    }

    if (!project) return;

    setSaving(true);

    try {
      // 1. Update project details
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          title: title.trim(),
          description: description.trim(),
          github_url: githubUrl.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id);

      if (projectError) {
        throw projectError;
      }

      // 2. Normalize selected skills
      const skillNames = [
        ...new Map(
          techStack
            .map((skill) => skill.trim())
            .filter(Boolean)
            .map((skill) => [skill.toLowerCase(), skill])
        ).values(),
      ];

      // 3. Get existing skills
      let existingSkills: { id: string; name: string }[] = [];

      if (skillNames.length > 0) {
        const { data, error } = await supabase
          .from('skills')
          .select('id, name')
          .in('name', skillNames);

        if (error) {
          throw error;
        }

        existingSkills = data || [];
      }

      const skillMap = new Map(
        existingSkills.map((skill) => [
          skill.name.toLowerCase(),
          skill.id,
        ])
      );

      // 4. Create skills that don't exist
      const missingSkills = skillNames.filter(
        (name) => !skillMap.has(name.toLowerCase())
      );

      if (missingSkills.length > 0) {
        const { data: newSkills, error } = await supabase
          .from('skills')
          .insert(
            missingSkills.map((name) => ({
              name,
              category: getSkillCategory(name),
            }))
          )
          .select('id, name');

        if (error) {
          throw error;
        }

        (newSkills || []).forEach((skill) => {
          skillMap.set(
            skill.name.toLowerCase(),
            skill.id
          );
        });
      }

      // 5. Remove old project-skill relationships
      const { error: deleteError } = await supabase
        .from('project_skills')
        .delete()
        .eq('project_id', project.id);

      if (deleteError) {
        throw deleteError;
      }

      // 6. Add the current project-skill relationships
      if (skillNames.length > 0) {
        const projectSkills = skillNames
          .map((name) => {
            const skillId = skillMap.get(name.toLowerCase());

            if (!skillId) return null;

            return {
              project_id: project.id,
              skill_id: skillId,
              confidence_score: 1.0,
            };
          })
          .filter(
            (
              item
            ): item is {
              project_id: string;
              skill_id: string;
              confidence_score: number;
            } => item !== null
          );

        if (projectSkills.length > 0) {
          const { error } = await supabase
            .from('project_skills')
            .insert(projectSkills);

          if (error) {
            throw error;
          }
        }
      }

      // Database trigger handles user_skills aggregation
      router.back();
    } catch (error: any) {
      console.error('Error updating project:', error);

      Alert.alert(
        'Error',
        error?.message || 'Could not update project.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.notFoundText}>
          Loading project...
        </Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={DN.bg}
        />

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
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={DN.bg}
      />

      {/* Back Button */}
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
      <Text style={styles.headerTitle}>
        Edit Project
      </Text>

      <Text style={styles.subtitle}>
        Update project details
      </Text>

      {/* Form */}
      <View style={styles.formCard}>
        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>
            PROJECT TITLE
          </Text>

          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Project title"
            placeholderTextColor={DN.textPlaceholder}
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>
            DESCRIPTION
          </Text>

          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Project description..."
            placeholderTextColor={DN.textPlaceholder}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* GitHub URL */}
        <View style={styles.field}>
          <Text style={styles.label}>
            GITHUB REPOSITORY
          </Text>

          <View style={styles.inputRow}>
            <Feather
              name="github"
              size={18}
              color={DN.textMuted}
              style={{ marginRight: Space.sm }}
            />

            <TextInput
              style={[
                styles.input,
                {
                  flex: 1,
                  marginBottom: 0,
                },
              ]}
              value={githubUrl}
              onChangeText={setGithubUrl}
              placeholder="https://github.com/user/repo"
              placeholderTextColor={DN.textPlaceholder}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Tech Stack */}
        <View style={styles.field}>
          <Text style={styles.label}>
            TECH STACK
          </Text>

          <View style={styles.techInputRow}>
            <TextInput
              style={[
                styles.input,
                styles.techInput,
              ]}
              value={techInput}
              onChangeText={setTechInput}
              placeholder="Add technology..."
              placeholderTextColor={DN.textPlaceholder}
              onSubmitEditing={addTech}
              returnKeyType="done"
            />

            <TouchableOpacity
              style={styles.addTechBtn}
              onPress={addTech}
              activeOpacity={0.7}
            >
              <Feather
                name="plus"
                size={18}
                color={DN.cyan}
              />
            </TouchableOpacity>
          </View>

          {techStack.length > 0 && (
            <View style={styles.techTags}>
              {techStack.map((tech) => (
                <TouchableOpacity
                  key={tech}
                  onPress={() => removeTech(tech)}
                  activeOpacity={0.7}
                >
                  <View style={styles.removableTag}>
                    <SkillTag
                      label={tech}
                      size="md"
                    />

                    <View style={styles.removeIcon}>
                      <Feather
                        name="x"
                        size={10}
                        color={DN.textMuted}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Save */}
      <PrimaryButton
        title="Save Changes"
        icon="check"
        onPress={handleSave}
        loading={saving}
      />

      {/* Cancel */}
      <PrimaryButton
        title="Cancel"
        variant="ghost"
        onPress={() => router.back()}
        style={{ marginTop: Space.sm }}
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

  headerTitle: {
    fontSize: FontSize['2xl'],
    fontFamily: FontFamily.bold,
    color: DN.textPrimary,
  },

  subtitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: DN.textMuted,
    marginTop: Space.xs,
    marginBottom: Space.xl,
  },

  formCard: {
    backgroundColor: DN.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: DN.border,
    padding: Space.lg,
    marginBottom: Space.xl,
  },

  field: {
    marginBottom: Space.lg,
  },

  label: {
    fontSize: FontSize.xs + 1,
    fontFamily: FontFamily.mono,
    fontWeight: '700',
    color: DN.textLabel,
    letterSpacing: 1,
    marginBottom: Space.sm,
  },

  input: {
    backgroundColor: DN.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: DN.borderLight,
    color: DN.textPrimary,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    paddingHorizontal: Space.md,
    height: 48,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DN.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: DN.borderLight,
    paddingHorizontal: Space.md,
    height: 48,
  },

  textArea: {
    height: 120,
    paddingTop: Space.md,
    textAlignVertical: 'top',
  },

  techInputRow: {
    flexDirection: 'row',
    gap: Space.sm,
  },

  techInput: {
    flex: 1,
    marginBottom: 0,
  },

  addTechBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: DN.cyanMuted,
    borderWidth: 1,
    borderColor: DN.borderFocus,
    alignItems: 'center',
    justifyContent: 'center',
  },

  techTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Space.sm,
    marginTop: Space.md,
  },

  removableTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  removeIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: DN.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -4,
  },
});