import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import {
  DN,
  FontFamily,
  FontSize,
  Radius,
  Space,
} from '@/constants/design-tokens';

export default function ResumeBuilderScreen() {
  const router = useRouter();

  const [resumeType, setResumeType] = useState('Software Engineer');
  const [experienceLevel, setExperienceLevel] =
    useState('Student / Fresher');

  const [includeProjects, setIncludeProjects] = useState(true);
  const [includeSkills, setIncludeSkills] = useState(true);
  const [includeEducation, setIncludeEducation] = useState(true);
  const [includeExperience, setIncludeExperience] = useState(true);
  const [includeLinks, setIncludeLinks] = useState(true);

  const toggle = (
    value: boolean,
    setValue: (value: boolean) => void
  ) => {
    setValue(!value);
  };

  const generateResume = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert(
          'Error',
          'You must be logged in to generate a resume.'
        );
        return;
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          bio,
          github_url,
          linkedin_url,
          role
        `)
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.log('PROFILE ERROR:', profileError);
        Alert.alert(
          'Error',
          'Could not load your profile.'
        );
        return;
      }

      const {
        data: projects,
        error: projectsError,
      } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          description,
          github_url,
          live_demo_url,
          status,
          ai_score,
          project_analyses (
            ai_summary,
            ai_technologies,
            ai_skills
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.log('PROJECT ERROR:', projectsError);
        Alert.alert(
          'Error',
          'Could not load your projects.'
        );
        return;
      }

      const {
        data: userSkills,
        error: skillsError,
      } = await supabase
        .from('user_skills')
        .select(`
          proficiency_score,
          project_count,
          skills (
            name,
            category
          )
        `)
        .eq('user_id', user.id);

      if (skillsError) {
        console.log('SKILLS ERROR:', skillsError);
        Alert.alert(
          'Error',
          'Could not load your skills.'
        );
        return;
      }

      let education: unknown[] = [];
      let experience: unknown[] = [];

      if (includeEducation) {
        const { data, error } = await supabase
          .from('education')
          .select(`
            institution,
            degree,
            field_of_study,
            start_year,
            end_year,
            grade,
            description
          `)
          .eq('user_id', user.id)
          .order('start_year', { ascending: false });

        if (error) {
          console.log('EDUCATION ERROR:', error);
        } else {
          education = data || [];
        }
      }

      if (includeExperience) {
        const { data, error } = await supabase
          .from('experience')
          .select(`
            company,
            job_title,
            employment_type,
            start_date,
            end_date,
            currently_working,
            description
          `)
          .eq('user_id', user.id)
          .order('start_date', { ascending: false });

        if (error) {
          console.log('EXPERIENCE ERROR:', error);
        } else {
          experience = data || [];
        }
      }

      const resumeData = {
        profile,
        projects: includeProjects
          ? projects || []
          : [],
        skills: includeSkills
          ? userSkills || []
          : [],
        education,
        experience,
        includeEducation,
        includeExperience,
        includeLinks,
        resumeType,
        experienceLevel,
      };

      console.log('RESUME DATA:');
      console.log(JSON.stringify(resumeData, null, 2));

      const { data, error } = await supabase.functions.invoke(
        'generate-resume',
        {
          body: resumeData,
        }
      );

      if (error) {
        console.error('RESUME ERROR:', error);

        Alert.alert(
          'Resume Error',
          error.message || 'Could not generate resume.'
        );

        return;
      }

      if (!data?.resume) {
        Alert.alert(
          'Error',
          'Gemini did not return a resume.'
        );

        return;
      }

      console.log('GENERATED RESUME:');
      console.log(JSON.stringify(data.resume, null, 2));

      router.push({
        pathname: '/resume-preview',
        params: {
          resume: JSON.stringify(data.resume),
        },
      });

    } catch (error) {
      console.log('RESUME ERROR:', error);

      Alert.alert(
        'Error',
        'Something went wrong while generating your resume.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Feather
              name="arrow-left"
              size={20}
              color={DN.textPrimary}
            />
          </TouchableOpacity>

          <View>
            <Text style={styles.headerTitle}>
              AI RESUME BUILDER
            </Text>

            <Text style={styles.headerSubtitle}>
              Create your resume with ProjectDNA
            </Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.aiIcon}>
            <Feather
              name="zap"
              size={24}
              color={DN.cyan}
            />
          </View>

          <Text style={styles.heroTitle}>
            Build your resume
          </Text>

          <Text style={styles.heroText}>
            Gemini will turn your ProjectDNA profile,
            projects and skills into a professional
            resume.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            RESUME TYPE
          </Text>

          <View style={styles.optionRow}>
            <TouchableOpacity
              style={[
                styles.option,
                resumeType === 'Software Engineer' &&
                  styles.optionActive,
              ]}
              onPress={() =>
                setResumeType('Software Engineer')
              }
            >
              <Feather
                name="code"
                size={19}
                color={
                  resumeType === 'Software Engineer'
                    ? DN.cyan
                    : DN.textMuted
                }
              />

              <Text
                style={[
                  styles.optionText,
                  resumeType === 'Software Engineer' &&
                    styles.optionTextActive,
                ]}
              >
                Software Engineer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.option,
                resumeType === 'General Resume' &&
                  styles.optionActive,
              ]}
              onPress={() =>
                setResumeType('General Resume')
              }
            >
              <Feather
                name="file-text"
                size={19}
                color={
                  resumeType === 'General Resume'
                    ? DN.cyan
                    : DN.textMuted
                }
              />

              <Text
                style={[
                  styles.optionText,
                  resumeType === 'General Resume' &&
                    styles.optionTextActive,
                ]}
              >
                General Resume
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            EXPERIENCE LEVEL
          </Text>

          <View style={styles.levelRow}>
            {[
              'Student / Fresher',
              'Experienced',
            ].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.levelButton,
                  experienceLevel === level &&
                    styles.levelActive,
                ]}
                onPress={() =>
                  setExperienceLevel(level)
                }
              >
                <Text
                  style={[
                    styles.levelText,
                    experienceLevel === level &&
                      styles.levelTextActive,
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            INCLUDE IN RESUME
          </Text>

          <ResumeOption
            icon="briefcase"
            title="Projects"
            description="Your ProjectDNA projects"
            value={includeProjects}
            onPress={() =>
              toggle(
                includeProjects,
                setIncludeProjects
              )
            }
          />

          <ResumeOption
            icon="code"
            title="Skills"
            description="Technical and professional skills"
            value={includeSkills}
            onPress={() =>
              toggle(
                includeSkills,
                setIncludeSkills
              )
            }
          />

          <ResumeOption
            icon="book-open"
            title="Education"
            description="Your academic information"
            value={includeEducation}
            onPress={() =>
              toggle(
                includeEducation,
                setIncludeEducation
              )
            }
          />

          <ResumeOption
            icon="users"
            title="Experience"
            description="Work and internship experience"
            value={includeExperience}
            onPress={() =>
              toggle(
                includeExperience,
                setIncludeExperience
              )
            }
          />

          <ResumeOption
            icon="link"
            title="Links"
            description="GitHub, LinkedIn and portfolio"
            value={includeLinks}
            onPress={() =>
              toggle(
                includeLinks,
                setIncludeLinks
              )
            }
          />
        </View>

        <TouchableOpacity
          style={styles.generateButton}
          onPress={generateResume}
        >
          <Feather
            name="zap"
            size={19}
            color="#06111f"
          />

          <Text style={styles.generateText}>
            GENERATE RESUME
          </Text>

          <Feather
            name="arrow-right"
            size={19}
            color="#06111f"
          />
        </TouchableOpacity>

        <Text style={styles.note}>
          Your information will be used to generate a
          structured, ATS-friendly resume.
        </Text>
      </ScrollView>
    </View>
  );
}

function ResumeOption({
  icon,
  title,
  description,
  value,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  value: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.resumeOption}
      onPress={onPress}
    >
      <View style={styles.optionIcon}>
        <Feather
          name={icon}
          size={18}
          color={DN.cyan}
        />
      </View>

      <View style={styles.optionInfo}>
        <Text style={styles.resumeOptionTitle}>
          {title}
        </Text>

        <Text style={styles.resumeOptionDescription}>
          {description}
        </Text>
      </View>

      <View
        style={[
          styles.checkbox,
          value && styles.checkboxActive,
        ]}
      >
        {value && (
          <Feather
            name="check"
            size={14}
            color="#06111f"
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DN.bg,
  },

  content: {
    padding: Space.xl,
    paddingBottom: Space['4xl'],
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    marginBottom: Space.xl,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: DN.bgCard,
    borderWidth: 1,
    borderColor: DN.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    color: DN.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    letterSpacing: 0.5,
  },

  headerSubtitle: {
    color: DN.textMuted,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    marginTop: 3,
  },

  hero: {
    alignItems: 'center',
    paddingVertical: Space.xl,
    marginBottom: Space.lg,
  },

  aiIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: DN.cyanMuted,
    borderWidth: 1,
    borderColor: DN.borderFocus,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.md,
  },

  heroTitle: {
    color: DN.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
  },

  heroText: {
    maxWidth: 500,
    textAlign: 'center',
    color: DN.textSecondary,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    lineHeight: 21,
    marginTop: Space.sm,
  },

  card: {
    backgroundColor: DN.bgCard,
    borderWidth: 1,
    borderColor: DN.border,
    borderRadius: Radius.lg,
    padding: Space.lg,
    marginBottom: Space.md,
  },

  cardTitle: {
    color: DN.textMuted,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    letterSpacing: 1,
    marginBottom: Space.md,
  },

  optionRow: {
    gap: Space.sm,
  },

  option: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    borderWidth: 1,
    borderColor: DN.border,
    borderRadius: Radius.md,
    paddingHorizontal: Space.md,
    backgroundColor: DN.bg,
  },

  optionActive: {
    borderColor: DN.cyan,
    backgroundColor: DN.cyanMuted,
  },

  optionText: {
    color: DN.textSecondary,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
  },

  optionTextActive: {
    color: DN.cyan,
  },

  levelRow: {
    flexDirection: 'row',
    gap: Space.sm,
  },

  levelButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: DN.border,
    borderRadius: Radius.md,
    backgroundColor: DN.bg,
  },

  levelActive: {
    borderColor: DN.cyan,
    backgroundColor: DN.cyanMuted,
  },

  levelText: {
    color: DN.textMuted,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
  },

  levelTextActive: {
    color: DN.cyan,
  },

  resumeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Space.md,
    borderBottomWidth: 1,
    borderBottomColor: DN.border,
  },

  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: DN.cyanMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  optionInfo: {
    flex: 1,
    marginLeft: Space.md,
  },

  resumeOptionTitle: {
    color: DN.textPrimary,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
  },

  resumeOptionDescription: {
    color: DN.textMuted,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    marginTop: 3,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: DN.borderFocus,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxActive: {
    backgroundColor: DN.cyan,
    borderColor: DN.cyan,
  },

  generateButton: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.sm,
    backgroundColor: DN.cyan,
    borderRadius: Radius.md,
    marginTop: Space.md,
  },

  generateText: {
    color: '#06111f',
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    letterSpacing: 0.5,
  },

  note: {
    color: DN.textMuted,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: Space.md,
    lineHeight: 18,
  },
});