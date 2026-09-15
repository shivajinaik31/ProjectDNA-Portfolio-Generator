import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { DN, FontFamily, FontSize, Space, Radius } from '@/constants/design-tokens';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SkillTag } from '@/components/ui/SkillTag';

export default function AddProjectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [techInput, setTechInput] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);

  const addTech = () => {
    const tech = techInput.trim();
    if (tech && !techStack.includes(tech)) {
      setTechStack([...techStack, tech]);
      setTechInput('');
    }
  };

  const removeTech = (tech: string) => {
    setTechStack(techStack.filter((t) => t !== tech));
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
    // TODO: Save to Supabase once projects table exists
    // For now, simulate a save
    setTimeout(() => {
      setSaving(false);
      Alert.alert('Success', 'Project added successfully! (Mock)', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }, 1000);
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

        {/* GitHub URL */}
        <View style={styles.field}>
          <Text style={styles.label}>GITHUB REPOSITORY</Text>
          <View style={styles.inputRow}>
            <Feather name="github" size={18} color={DN.textMuted} style={{ marginRight: Space.sm }} />
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
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
          <Text style={styles.label}>TECH STACK</Text>
          <View style={styles.techInputRow}>
            <TextInput
              style={[styles.input, styles.techInput]}
              value={techInput}
              onChangeText={setTechInput}
              placeholder="e.g. React, Node.js"
              placeholderTextColor={DN.textPlaceholder}
              onSubmitEditing={addTech}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={styles.addTechBtn}
              onPress={addTech}
              activeOpacity={0.7}
            >
              <Feather name="plus" size={18} color={DN.cyan} />
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
                    <SkillTag label={tech} size="md" />
                    <View style={styles.removeIcon}>
                      <Feather name="x" size={10} color={DN.textMuted} />
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
