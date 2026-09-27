import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
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
import { TechAutocomplete } from '@/components/ui/TechAutocomplete';
import { StatusSelector } from '@/components/ui/StatusSelector';
import { supabase } from '@/lib/supabase';
import { ProjectStatus } from '@/lib/types';

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

  if (languages.includes(name)) {
    return 'language';
  }

  if (frameworks.includes(name)) {
    return 'framework';
  }

  if (tools.includes(name)) {
    return 'tool';
  }

  return 'concept';
};

export default function AddProjectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [saving, setSaving] = useState(false);
  const [importingGitHub, setImportingGitHub] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [liveDemoUrl, setLiveDemoUrl] = useState('');
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [isPublic, setIsPublic] = useState(false);
  const [portfolioOrder, setPortfolioOrder] = useState('0');
  const [techStack, setTechStack] = useState<string[]>([]);

  const addTech = (tech: string) => {
    const cleanTech = tech.trim();
    if (!cleanTech) return;

    const alreadyExists = techStack.some(
      (item) => item.toLowerCase() === cleanTech.toLowerCase()
    );

    if (alreadyExists) return;

    setTechStack((current) => [...current, cleanTech]);
  };

  const removeTech = (tech: string) => {
    setTechStack((current) =>
      current.filter((item) => item !== tech)
    );
  };
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setThumbnailUri(result.assets[0].uri);
    }
  };

  const importGitHub = async () => {
    if (!githubUrl.trim()) {
      Alert.alert('GitHub URL', 'Please enter a GitHub repository URL first.');
      return;
    }

    try {
      setImportingGitHub(true);

      const match = githubUrl.trim().match(
        /github\.com\/([^/]+)\/([^/#?]+)/
      );

      if (!match) {
        Alert.alert('Invalid URL', 'Please enter a valid GitHub repository URL.');
        return;
      }

      const owner = match[1];
      const repo = match[2].replace('.git', '');

      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
        {
          headers: {
            Accept: 'application/vnd.github+json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Repository not found');
      }

      const data = await response.json();

      setTitle(data.name || '');
      setGithubUrl(data.html_url || githubUrl);

      // Get README
      let readmeText = '';

      const readmeResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/readme`,
        {
          headers: {
            Accept: 'application/vnd.github.raw+json',
          },
        }
      );

      if (readmeResponse.ok) {
        readmeText = await readmeResponse.text();
      }
      // Try to find the first image in the README
      const imageMatch = readmeText.match(/!\[.*?\]\((.*?)\)/);

      if (imageMatch && imageMatch[1]) {
        let imageUrl = imageMatch[1].trim();

        // Convert relative GitHub image paths to raw GitHub URLs
        if (imageUrl.startsWith('./')) {
          imageUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${data.default_branch}/${imageUrl.substring(2)}`;
        } else if (imageUrl.startsWith('/')) {
          imageUrl = `https://github.com${imageUrl}`;
        }

        setThumbnailUri(imageUrl);
      }

      setDescription(
        data.description ||
        readmeText
          .replace(/!\[.*?\]\(.*?\)/g, '')
          .replace(/[#*`]/g, '')
          .trim()
          .slice(0, 1000)
      );

      // Get languages used in the repository
      const languagesResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/languages`,
        {
          headers: {
            Accept: 'application/vnd.github+json',
          },
        }
      );

      if (languagesResponse.ok) {
        const languagesData = await languagesResponse.json();

        Object.keys(languagesData).forEach((language) => {
          addTech(language);
        });
      }

      Alert.alert('Success', 'GitHub repository details imported.');
    } catch (error) {
      Alert.alert(
        'Import Failed',
        'Could not fetch the GitHub repository.'
      );
    } finally {
      setImportingGitHub(false);
    }
  };


  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Project title is required.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Validation', 'Project description is required.');
      return;
    }

    setSaving(true);

    try {
      // Get logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('You must be logged in to add a project.');
      }

      // 1. Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim(),
          github_url: githubUrl.trim() || null,
          live_demo_url: liveDemoUrl.trim() || null,
          status,
          is_public: isPublic,
          portfolio_order: Number.parseInt(portfolioOrder, 10) || 0,
        })
        .select('id')
        .single();

      if (projectError) {
        throw projectError;
      }

      if (thumbnailUri) {
        const fileExt =
          thumbnailUri.split('.').pop()?.toLowerCase() || 'jpg';

        const fileName = `${user.id}/${project.id}.${fileExt}`;

        Alert.alert('Upload Debug', 'Starting image upload...');

        const response = await fetch(thumbnailUri);
        const arrayBuffer = await response.arrayBuffer();

        Alert.alert('Upload Debug', 'Image converted successfully.');

        const mimeType =
          fileExt === 'png'
            ? 'image/png'
            : fileExt === 'webp'
              ? 'image/webp'
              : 'image/jpeg';

        const { error: uploadError } = await supabase.storage
          .from('project-images')
          .upload(fileName, arrayBuffer, {
            contentType: mimeType,
            upsert: false,
          });

        if (uploadError) {
            Alert.alert('Upload Error', uploadError.message);
            throw uploadError;
          }

        const { data: publicUrlData } = supabase.storage
          .from('project-images')
          .getPublicUrl(fileName);

        const { error: imageUpdateError } = await supabase
          .from('projects')
          .update({
            thumbnail_url: publicUrlData.publicUrl,
          })
          .eq('id', project.id);

        if (imageUpdateError) {
          throw imageUpdateError;
        }
      }

      // No skills selected
      if (techStack.length === 0) {
        router.back();
        return;
      }

      // Normalize skill names
      const skillNames = [...new Set(
        techStack
          .map((skill) => skill.trim())
          .filter(Boolean)
      )];

      // 2. Find existing skills
      const { data: existingSkills, error: skillsFetchError } =
        await supabase
          .from('skills')
          .select('id, name')
          .in('name', skillNames);

      if (skillsFetchError) {
        throw skillsFetchError;
      }

      const existingSkillMap = new Map(
        (existingSkills || []).map((skill) => [
          skill.name.toLowerCase(),
          skill.id,
        ])
      );

      // 3. Create skills that don't already exist
      const missingSkills = skillNames.filter(
        (skill) => !existingSkillMap.has(skill.toLowerCase())
      );

      if (missingSkills.length > 0) {
        const skillsToInsert = missingSkills.map((skill) => ({
          name: skill,
          category: getSkillCategory(skill),
        }));

        const { data: newSkills, error: skillsInsertError } =
          await supabase
            .from('skills')
            .insert(skillsToInsert)
            .select('id, name');

        if (skillsInsertError) {
          throw skillsInsertError;
        }

        (newSkills || []).forEach((skill) => {
          existingSkillMap.set(
            skill.name.toLowerCase(),
            skill.id
          );
        });
      }

      // 4. Create project-skill relationships
      const projectSkills = skillNames
        .map((skill) => {
          const skillId = existingSkillMap.get(
            skill.toLowerCase()
          );

          if (!skillId) {
            return null;
          }

          return {
            project_id: project.id,
            skill_id: skillId,
            confidence_score: 1.0,
          };
        })
        .filter(
          (skill): skill is NonNullable<typeof skill> => skill !== null
        );

      if (projectSkills.length > 0) {
        const { error: projectSkillsError } = await supabase
          .from('project_skills')
          .insert(projectSkills);

        if (projectSkillsError) {
          throw projectSkillsError;
        }
      }

      // Database trigger updates user_skills automatically
      router.back();
    } catch (error: any) {
      console.error('Error saving project:', error);

      Alert.alert(
        'Error',
        error?.message || 'Failed to add project'
      );
    } finally {
      setSaving(false);
    }
  };

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
      <Text style={styles.title}>Add Project</Text>

      <Text style={styles.subtitle}>
        Add a new project to your portfolio
      </Text>

      {/* Form */}
      <View style={styles.formCard}>
        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>PROJECT TITLE</Text>

          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. E-Commerce Platform"
            placeholderTextColor={DN.textPlaceholder}
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>DESCRIPTION</Text>

          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what your project does, key features, and your role..."
            placeholderTextColor={DN.textPlaceholder}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>


        {/* Project Image */}
        <View style={styles.field}>
          <Text style={styles.label}>PROJECT IMAGE</Text>

          <TouchableOpacity
            style={styles.imageButton}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            <Feather
              name="image"
              size={20}
              color={DN.cyan}
            />

            <Text style={styles.imageButtonText}>
              {thumbnailUri ? 'Change Image' : 'Choose Image'}
            </Text>
          </TouchableOpacity>

          {thumbnailUri && (
            <Image
              source={{ uri: thumbnailUri }}
              style={styles.previewImage}
            />
          )}
        </View>


        {/* GitHub URL */}
        <View style={styles.field}>
          <Text style={styles.label}>GITHUB REPOSITORY</Text>

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
            <TouchableOpacity
            style={styles.importButton}
            onPress={importGitHub}
            disabled={importingGitHub}
          >
            <Text style={styles.importButtonText}>
              {importingGitHub ? 'IMPORTING...' : 'IMPORT FROM GITHUB'}
            </Text>
          </TouchableOpacity>
        </View>
      

        {/* Live Demo URL */}
        <View style={styles.field}>
          <Text style={styles.label}>LIVE DEMO URL</Text>

          <TextInput
            style={styles.input}
            placeholder="https://your-demo-link.com"
            value={liveDemoUrl}
            onChangeText={setLiveDemoUrl}
            autoCapitalize="none"
            keyboardType="url"
            returnKeyType="done"
          />
        </View>

        {/* Status */}
        <View style={styles.field}>
          <Text style={styles.label}>STATUS</Text>
          <StatusSelector value={status} onChange={setStatus} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>PORTFOLIO VISIBILITY</Text>
          <TouchableOpacity style={styles.visibilityRow} onPress={() => setIsPublic((current) => !current)}>
            <Feather name={isPublic ? 'eye' : 'eye-off'} size={18} color={isPublic ? DN.cyan : DN.textMuted} />
            <Text style={styles.visibilityText}>{isPublic ? 'Public — included in your published portfolio' : 'Private — visible only to you'}</Text>
          </TouchableOpacity>
          {isPublic && (
            <TextInput
              style={[styles.input, styles.orderInput]}
              value={portfolioOrder}
              onChangeText={setPortfolioOrder}
              placeholder="Portfolio order (0 first)"
              placeholderTextColor={DN.textPlaceholder}
              keyboardType="number-pad"
            />
          )}
        </View>

        {/* Tech Stack */}
        <View style={styles.field}>
          <Text style={styles.label}>TECH STACK</Text>

          <TechAutocomplete onAddSkill={addTech} />

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

      {/* Submit */}
      <PrimaryButton
        title="Add Project"
        icon="plus-circle"
        onPress={handleSubmit}
        loading={saving}
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

  // Header
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
    marginBottom: Space.xl,
  },

  // Form
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
  imageButton: {
    height: 48,
    borderWidth: 1,
    borderColor: DN.borderLight,
    borderRadius: Radius.md,
    backgroundColor: DN.bgInput,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.sm,
  },

  imageButtonText: {
    color: DN.cyan,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
  },
  importButton: {
  height: 48,
  borderWidth: 1,
  borderColor: DN.cyan,
  borderRadius: Radius.md,
  backgroundColor: DN.bgInput,
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: Space.sm,
},

importButtonText: {
  color: DN.cyan,
  fontFamily: FontFamily.medium,
  fontSize: FontSize.sm,
},

  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: Radius.md,
    marginTop: Space.md,
  },
  textArea: {
    height: 120,
    paddingTop: Space.md,
    textAlignVertical: 'top',
  },
  visibilityRow: { flexDirection: 'row', alignItems: 'center', gap: Space.sm, paddingVertical: Space.sm },
  visibilityText: { flex: 1, color: DN.textSecondary, fontFamily: FontFamily.regular, fontSize: FontSize.sm },
  orderInput: { marginTop: Space.sm },

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
