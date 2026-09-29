import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
  personalSchema,
  educationSchema,
  experienceSchema,
  linksSchema,
} from '@/lib/validations/profileSchema';
import { supabase } from '@/lib/supabase';
import { FeedbackBanner } from '@/components/ui/FeedbackBanner';

type Props = {
  userId: string;
  initialName?: string;
};

export default function ProfileSetup({ userId, initialName = '' }: Props) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'error' | 'success';
    message: string;
  } | null>(null);

  const [personal, setPersonal] = useState({
    full_name: initialName,
    phone: '',
    location: '',
    professional_title: '',
    bio: '',
  });

  const [education, setEducation] = useState({
    institution: '',
    degree: '',
    field_of_study: '',
    start_year: '',
    end_year: '',
    grade: '',
    description: '',
  });

  const [experience, setExperience] = useState({
    company: '',
    job_title: '',
    employment_type: '',
    start_date: '',
    end_date: '',
    currently_working: false,
    description: '',
  });

  const [links, setLinks] = useState({
    github_url: '',
    linkedin_url: '',
    portfolio_url: '',
  });

  const showError = (message: string) => {
    setFeedback({ type: 'error', message });
  };

  const pickProfileImage = async () => {
    setFeedback(null);

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showError(
        'Photo access is required to choose a profile picture.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      setFeedback({
        type: 'success',
        message: 'Profile image selected. It will upload when you save.',
      });
    }
  };

  const uploadProfileImage = async () => {
    if (!profileImage) return null;

    const response = await fetch(profileImage);
    const arrayBuffer = await response.arrayBuffer();
    const filePath = `${userId}/profile-${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from('profile-images')
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      throw new Error(`Profile image upload failed: ${error.message}`);
    }

    const { data } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const nextStep = () => {
    if (step === 1) {
      const result = personalSchema.safeParse(personal);

      if (!result.success) {
        showError(result.error.issues[0].message);
        return;
      }
    }

    if (step === 2) {
      const result = educationSchema.safeParse(education);

      if (!result.success) {
        showError(result.error.issues[0].message);
        return;
      }
    }

    if (step === 3) {
      const result = experienceSchema.safeParse(experience);

      if (!result.success) {
        showError(result.error.issues[0].message);
        return;
      }
    }

    setStep(step + 1);
  };

  const saveProfile = async () => {
    const personalResult = personalSchema.safeParse(personal);
    const educationResult = educationSchema.safeParse(education);
    const experienceResult = experienceSchema.safeParse(experience);
    const linksResult = linksSchema.safeParse(links);

    if (!personalResult.success) {
      showError(personalResult.error.issues[0].message);
      return;
    }

    if (!educationResult.success) {
      showError(educationResult.error.issues[0].message);
      return;
    }

    if (!experienceResult.success) {
      showError(experienceResult.error.issues[0].message);
      return;
    }

    if (!linksResult.success) {
      showError(linksResult.error.issues[0].message);
      return;
    }

    try {
      setLoading(true);
      setFeedback(null);

      const avatarUrl = await uploadProfileImage();

      const { error: profileError } = await supabase
        .from('users')
        .update({
          full_name: personal.full_name,
          phone: personal.phone || null,
          location: personal.location || null,
          professional_title: personal.professional_title || null,
          bio: personal.bio || null,
          avatar_url: avatarUrl,
          github_url: links.github_url || null,
          linkedin_url: links.linkedin_url || null,
        })
        .eq('id', userId);

      if (profileError) {
        throw new Error(`Profile update failed: ${profileError.message}`);
      }

      if (
        education.institution ||
        education.degree ||
        education.field_of_study
      ) {
        const { error } = await supabase.from('education').insert({
          user_id: userId,
          institution: education.institution || 'Not specified',
          degree: education.degree || null,
          field_of_study: education.field_of_study || null,
          start_year: education.start_year
            ? Number(education.start_year)
            : null,
          end_year: education.end_year
            ? Number(education.end_year)
            : null,
          grade: education.grade || null,
          description: education.description || null,
        });

        if (error) {
          throw error;
        }
      }

      if (experience.company) {
        const { error } = await supabase.from('experience').insert({
          user_id: userId,
          company: experience.company,
          job_title: experience.job_title || null,
          employment_type: experience.employment_type || null,
          start_date: experience.start_date || null,
          end_date: experience.currently_working
            ? null
            : experience.end_date || null,
          currently_working: experience.currently_working,
          description: experience.description || null,
        });

        if (error) {
          throw error;
        }
      }

      setFeedback({
        type: 'success',
        message: 'Profile saved successfully. Upload complete.',
      });

      setTimeout(() => router.replace('/'), 900);
    } catch (error) {
      console.log('Profile save error:', error);
      showError(
        'Something went wrong while saving your profile or uploading the image.'
      );
    } finally {
      setLoading(false);
    }
  };

  const skipProfile = () => {
    router.replace('/');
  };

  const renderInput = (
    label: string,
    placeholder: string,
    value: string,
    onChangeText: (value: string) => void,
    icon: keyof typeof Feather.glyphMap,
    options: any = {}
  ) => {
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>

        <View style={styles.inputWrapper}>
          <Feather
            name={icon}
            size={17}
            color="#657b9c"
            style={styles.fieldIcon}
          />

          <TextInput
            style={[
              styles.textInput,
              options.multiline && styles.textAreaInput,
            ]}
            placeholder={placeholder}
            placeholderTextColor="#475873"
            value={value}
            onChangeText={onChangeText}
            {...options}
          />
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Brand Header */}
      <View style={styles.headerSection}>
        <View style={styles.logoBadge}>
          <Feather name="box" size={24} color="#00c3e4" />
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.brandTitle}>PROJECTDNA</Text>

          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v1.4</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Build your professional profile.
        </Text>
      </View>

      {/* Profile Card */}
      <View style={styles.formCard}>
        <Text style={styles.title}>Complete Your Profile</Text>

        <Text style={styles.description}>
          Add information that can later be used to generate your portfolio
          and resume.
        </Text>

        {feedback && (
          <FeedbackBanner
            type={feedback.type}
            message={feedback.message}
          />
        )}

        {/* Progress */}
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>PROFILE SETUP</Text>
          <Text style={styles.progressText}>STEP {step} OF 4</Text>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${step * 25}%` },
            ]}
          />
        </View>

        {/* STEP 1 */}
        {step === 1 && (
          <View>
            <View style={styles.imageSection}>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Feather
                    name="user"
                    size={30}
                    color="#00c3e4"
                  />
                </View>
              )}

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.uploadButton}
                onPress={pickProfileImage}
              >
                <Feather
                  name="camera"
                  size={16}
                  color="#070d19"
                />
                <Text style={styles.uploadButtonText}>
                  {profileImage ? 'Change photo' : 'Upload photo'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Personal Information</Text>

            {renderInput(
              'FULL NAME',
              'Shivaji Bhosale',
              personal.full_name,
              (value) =>
                setPersonal({ ...personal, full_name: value }),
              'user'
            )}

            {renderInput(
              'PHONE NUMBER',
              '+91 XXXXX XXXXX',
              personal.phone,
              (value) =>
                setPersonal({ ...personal, phone: value }),
              'phone',
              {
                keyboardType: 'phone-pad',
              }
            )}

            {renderInput(
              'LOCATION',
              'Goa, India',
              personal.location,
              (value) =>
                setPersonal({ ...personal, location: value }),
              'map-pin'
            )}

            {renderInput(
              'PROFESSIONAL TITLE',
              'Computer Engineer',
              personal.professional_title,
              (value) =>
                setPersonal({
                  ...personal,
                  professional_title: value,
                }),
              'briefcase'
            )}

            {renderInput(
              'ABOUT YOU',
              'Tell us about yourself...',
              personal.bio,
              (value) =>
                setPersonal({ ...personal, bio: value }),
              'edit-3',
              {
                multiline: true,
                textAlignVertical: 'top',
              }
            )}
          </View>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <View>
            <Text style={styles.sectionTitle}>Education</Text>

            {renderInput(
              'COLLEGE / UNIVERSITY',
              'Goa College of Engineering',
              education.institution,
              (value) =>
                setEducation({
                  ...education,
                  institution: value,
                }),
              'book-open'
            )}

            {renderInput(
              'DEGREE',
              'B.E. Computer Engineering',
              education.degree,
              (value) =>
                setEducation({
                  ...education,
                  degree: value,
                }),
              'award'
            )}

            {renderInput(
              'BRANCH / FIELD OF STUDY',
              'Computer Engineering',
              education.field_of_study,
              (value) =>
                setEducation({
                  ...education,
                  field_of_study: value,
                }),
              'layers'
            )}

            {renderInput(
              'START YEAR',
              '2023',
              education.start_year,
              (value) =>
                setEducation({
                  ...education,
                  start_year: value,
                }),
              'calendar',
              {
                keyboardType: 'numeric',
              }
            )}

            {renderInput(
              'GRADUATION YEAR',
              '2027',
              education.end_year,
              (value) =>
                setEducation({
                  ...education,
                  end_year: value,
                }),
              'calendar',
              {
                keyboardType: 'numeric',
              }
            )}

            {renderInput(
              'CGPA / PERCENTAGE',
              '8.5 CGPA',
              education.grade,
              (value) =>
                setEducation({
                  ...education,
                  grade: value,
                }),
              'bar-chart-2'
            )}

            {renderInput(
              'EDUCATION DESCRIPTION',
              'Describe your education...',
              education.description,
              (value) =>
                setEducation({
                  ...education,
                  description: value,
                }),
              'file-text',
              {
                multiline: true,
                textAlignVertical: 'top',
              }
            )}
          </View>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <View>
            <Text style={styles.sectionTitle}>Experience</Text>

            {renderInput(
              'COMPANY',
              'Company name',
              experience.company,
              (value) =>
                setExperience({
                  ...experience,
                  company: value,
                }),
              'briefcase'
            )}

            {renderInput(
              'JOB TITLE',
              'Software Developer Intern',
              experience.job_title,
              (value) =>
                setExperience({
                  ...experience,
                  job_title: value,
                }),
              'user'
            )}

            {renderInput(
              'EMPLOYMENT TYPE',
              'Internship / Full Time',
              experience.employment_type,
              (value) =>
                setExperience({
                  ...experience,
                  employment_type: value,
                }),
              'layers'
            )}

            {renderInput(
              'START DATE',
              'YYYY-MM-DD',
              experience.start_date,
              (value) =>
                setExperience({
                  ...experience,
                  start_date: value,
                }),
              'calendar'
            )}

            {renderInput(
              'END DATE',
              'YYYY-MM-DD',
              experience.end_date,
              (value) =>
                setExperience({
                  ...experience,
                  end_date: value,
                }),
              'calendar'
            )}

            {renderInput(
              'EXPERIENCE DESCRIPTION',
              'Describe your experience...',
              experience.description,
              (value) =>
                setExperience({
                  ...experience,
                  description: value,
                }),
              'file-text',
              {
                multiline: true,
                textAlignVertical: 'top',
              }
            )}
          </View>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <View>
            <Text style={styles.sectionTitle}>Professional Links</Text>

            {renderInput(
              'GITHUB URL',
              'https://github.com/username',
              links.github_url,
              (value) =>
                setLinks({
                  ...links,
                  github_url: value,
                }),
              'github',
              {
                autoCapitalize: 'none',
                keyboardType: 'url',
              }
            )}

            {renderInput(
              'LINKEDIN URL',
              'https://linkedin.com/in/username',
              links.linkedin_url,
              (value) =>
                setLinks({
                  ...links,
                  linkedin_url: value,
                }),
              'linkedin',
              {
                autoCapitalize: 'none',
                keyboardType: 'url',
              }
            )}

            {renderInput(
              'PORTFOLIO WEBSITE',
              'https://yourportfolio.com',
              links.portfolio_url,
              (value) =>
                setLinks({
                  ...links,
                  portfolio_url: value,
                }),
              'globe',
              {
                autoCapitalize: 'none',
                keyboardType: 'url',
              }
            )}
          </View>
        )}

        {/* Navigation Buttons */}
        <View style={styles.buttons}>
          {step > 1 && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.secondaryButton}
              onPress={() => setStep(step - 1)}
            >
              <Feather
                name="arrow-left"
                size={16}
                color="#8ba1be"
              />
              <Text style={styles.secondaryText}>Back</Text>
            </TouchableOpacity>
          )}

          {step < 4 ? (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.button}
              onPress={nextStep}
            >
              <Text style={styles.buttonText}>Continue</Text>
              <Feather
                name="arrow-right"
                size={17}
                color="#070d19"
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.button}
              onPress={saveProfile}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Saving...' : 'Complete Profile'}
              </Text>

              {!loading && (
                <Feather
                  name="check"
                  size={17}
                  color="#070d19"
                />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Skip */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={skipProfile}
      >
        <Text style={styles.skip}>Skip for now</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footerSection}>
        <View style={styles.vaultRow}>
          <Feather
            name="lock"
            size={14}
            color="#00c3e4"
            style={{ marginRight: 6 }}
          />

          <Text style={styles.vaultText}>
            End-to-end encrypted student repository & artifact vault
          </Text>
        </View>

        <Text style={styles.legalLinks}>
          Terms of Service   •   Privacy Policy   •   Audit Hash
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#070c18',
  },

  container: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    maxWidth: 440,
    alignSelf: 'center',
    width: '100%',
  },

  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },

  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0d1d33',
    borderWidth: 1.5,
    borderColor: '#00c3e4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1.5,
  },

  versionBadge: {
    backgroundColor: '#0f2742',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#19395e',
  },

  versionText: {
    color: '#00c3e4',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  subtitle: {
    color: '#8ba1be',
    fontSize: 14,
    marginTop: 6,
    fontWeight: '400',
  },

  formCard: {
    width: '100%',
    backgroundColor: '#0b1426',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#172640',
    marginBottom: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },

  description: {
    color: '#8ba1be',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  progressLabel: {
    color: '#7e94b4',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  progressText: {
    color: '#00c3e4',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  progressBar: {
    height: 5,
    backgroundColor: '#0f1d36',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 24,
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#00c3e4',
    borderRadius: 5,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },

  imageSection: {
    alignItems: 'center',
    marginBottom: 24,
  },

  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#00c3e4',
    marginBottom: 12,
  },

  profileImagePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#00c3e4',
    backgroundColor: '#0f2742',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  uploadButton: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#00c3e4',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },

  uploadButtonText: {
    color: '#070d19',
    fontSize: 13,
    fontWeight: '700',
  },

  inputGroup: {
    marginBottom: 15,
  },

  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7e94b4',
    letterSpacing: 1,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f1d36',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1d2f4d',
    paddingHorizontal: 12,
    minHeight: 48,
  },

  fieldIcon: {
    marginRight: 10,
  },

  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    paddingVertical: 12,
  },

  textAreaInput: {
    minHeight: 100,
    paddingTop: 12,
  },

  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },

  button: {
    flex: 1,
    backgroundColor: '#00c3e4',
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },

  buttonText: {
    color: '#070d19',
    fontSize: 15,
    fontWeight: '700',
  },

  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#1d2f4d',
    backgroundColor: '#0f1d36',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },

  secondaryText: {
    color: '#8ba1be',
    fontSize: 14,
    fontWeight: '600',
  },

  skip: {
    color: '#00c3e4',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 20,
  },

  footerSection: {
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },

  vaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  vaultText: {
    color: '#657b9c',
    fontSize: 12,
    textAlign: 'center',
  },

  legalLinks: {
    color: '#7e94b4',
    fontSize: 11,
    textAlign: 'center',
  },
});