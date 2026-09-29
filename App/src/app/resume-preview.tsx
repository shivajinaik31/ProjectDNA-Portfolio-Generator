import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import {
  useRouter,
  useLocalSearchParams,
} from 'expo-router';
import { Feather } from '@expo/vector-icons';

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Document, Packer, Paragraph, TextRun } from 'docx';

import { Colors, Spacing } from '@/constants/theme';

type ResumeEducation = {
  institution: string;
  degree: string;
  details: string;
};

type ResumeExperience = {
  company: string;
  role: string;
  bullets: string[];
};

type ResumeProject = {
  name: string;
  description: string;
  technologies: string[];
  bullets: string[];
};

type Resume = {
  name: string;
  title: string;
  email: string;
  summary: string;
  github: string;
  linkedin: string;
  skills: string[];
  education: ResumeEducation[];
  experience: ResumeExperience[];
  projects: ResumeProject[];
};

function downloadBrowserText(
  content: string,
  fileName: string,
  mimeType: string
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}

function downloadBrowserBase64(
  content: string,
  fileName: string,
  mimeType: string
) {
  const link = document.createElement('a');

  link.href = `data:${mimeType};base64,${content}`;
  link.download = fileName;
  link.click();
}

export default function ResumePreviewScreen() {
  const router = useRouter();

  const goBackOrToBuilder = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/resume-builder');
  };

  const { resume: resumeParam } = useLocalSearchParams<{
    resume?: string;
  }>();

  if (!resumeParam) {
    return (
      <View style={styles.container}>
        <Text style={styles.bodyText}>
          Resume data not found.
        </Text>
      </View>
    );
  }

  let resume: Resume;

  try {
    resume = JSON.parse(resumeParam);
  } catch (error) {
    console.log('RESUME PARSE ERROR:', error);

    return (
      <View style={styles.container}>
        <Text style={styles.bodyText}>
          Could not load resume.
        </Text>
      </View>
    );
  }

  const downloadTXT = async () => {
  try {
    const text = `
${resume.name}
${resume.title}

${resume.email}
${resume.github}
${resume.linkedin}

SUMMARY
${resume.summary}

SKILLS
${resume.skills.join(', ')}

EDUCATION
${resume.education
  .map(
    (education) =>
      `${education.degree}
${education.institution}
${education.details}`
  )
  .join('\n\n')}

EXPERIENCE
${resume.experience
  .map(
    (experience) =>
      `${experience.role}
${experience.company}

${experience.bullets
  .map((bullet) => `• ${bullet}`)
  .join('\n')}`
  )
  .join('\n\n')}

PROJECTS
${resume.projects
  .map(
    (project) =>
      `${project.name}

${project.description}

Technologies:
${project.technologies.join(', ')}

${project.bullets
  .map((bullet) => `• ${bullet}`)
  .join('\n')}`
  )
  .join('\n\n')}
`;

    if (Platform.OS === 'web') {
      downloadBrowserText(
        text,
        'Atharv_Govekar_Resume.txt',
        'text/plain;charset=utf-8'
      );
      return;
    }

    const fileUri =
      FileSystem.cacheDirectory + 'Atharv_Govekar_Resume.txt';

    await FileSystem.writeAsStringAsync(
      fileUri,
      text
    );

    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/plain',
      dialogTitle: 'Save Resume',
    });
  } catch (error) {
    console.log('TXT ERROR:', error);
    Alert.alert(
      'Error',
      'Could not download the TXT file.'
    );
  }
};

const downloadWord = async () => {
  try {
    const children: Paragraph[] = [];

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: resume.name,
            bold: true,
            size: 32,
          }),
        ],
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: resume.title,
            bold: true,
            size: 24,
          }),
        ],
      })
    );

    children.push(
      new Paragraph({
        text: resume.email,
      })
    );

    children.push(
      new Paragraph({
        text: `${resume.github} | ${resume.linkedin}`,
      })
    );

    children.push(
      new Paragraph({
        text: '',
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'SUMMARY',
            bold: true,
          }),
        ],
      })
    );

    children.push(
      new Paragraph({
        text: resume.summary,
      })
    );

    children.push(
      new Paragraph({
        text: '',
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'SKILLS',
            bold: true,
          }),
        ],
      })
    );

    children.push(
      new Paragraph({
        text: resume.skills.join(' • '),
      })
    );

    children.push(
      new Paragraph({
        text: '',
      })
    );

    if (resume.education.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'EDUCATION',
              bold: true,
            }),
          ],
        })
      );

      resume.education.forEach((education) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: education.degree,
                bold: true,
              }),
            ],
          })
        );

        children.push(
          new Paragraph({
            text: education.institution,
          })
        );

        children.push(
          new Paragraph({
            text: education.details,
          })
        );
      });
    }

    if (resume.experience.length > 0) {
      children.push(
        new Paragraph({
          text: '',
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'EXPERIENCE',
              bold: true,
            }),
          ],
        })
      );

      resume.experience.forEach((experience) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: experience.role,
                bold: true,
              }),
            ],
          })
        );

        children.push(
          new Paragraph({
            text: experience.company,
          })
        );

        experience.bullets.forEach((bullet) => {
          children.push(
            new Paragraph({
              text: `• ${bullet}`,
            })
          );
        });
      });
    }

    children.push(
      new Paragraph({
        text: '',
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'PROJECTS',
            bold: true,
          }),
        ],
      })
    );

    resume.projects.forEach((project) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: project.name,
              bold: true,
            }),
          ],
        })
      );

      children.push(
        new Paragraph({
          text: project.description,
        })
      );

      children.push(
        new Paragraph({
          text: `Technologies: ${project.technologies.join(
            ', '
          )}`,
        })
      );

      project.bullets.forEach((bullet) => {
        children.push(
          new Paragraph({
            text: `• ${bullet}`,
          })
        );
      });

      children.push(
        new Paragraph({
          text: '',
        })
      );
    });

    const document = new Document({
      sections: [
        {
          children,
        },
      ],
    });

    const base64 =
      await Packer.toBase64String(document);

    if (Platform.OS === 'web') {
      downloadBrowserBase64(
        base64,
        'Atharv_Govekar_Resume.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      return;
    }

    const fileUri =
      FileSystem.cacheDirectory +
      'Atharv_Govekar_Resume.docx';

    await FileSystem.writeAsStringAsync(
      fileUri,
      base64,
      {
        encoding: FileSystem.EncodingType.Base64,
      }
    );

    await Sharing.shareAsync(fileUri, {
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      dialogTitle: 'Save Resume',
    });
  } catch (error) {
    console.log('WORD ERROR:', error);
    Alert.alert(
      'Error',
      'Could not create the Word file.'
    );
  }
};


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goBackOrToBuilder}
          style={styles.backButton}
        >
          <Feather
            name="arrow-left"
            size={20}
            color={Colors.dark.text}
          />
        </TouchableOpacity>

        <View>
          <Text style={styles.headerTitle}>RESUME PREVIEW</Text>
          <Text style={styles.headerSubtitle}>
            AI GENERATED RESUME
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.resumeCard}>
          <Text style={styles.name}>{resume.name}</Text>

          <Text style={styles.title}>{resume.title}</Text>

          <View style={styles.contactRow}>
            <Text style={styles.contact}>{resume.email}</Text>
          </View>

          <View style={styles.linksRow}>
            {resume.github ? (
              <Text style={styles.link}>{resume.github}</Text>
            ) : null}

            {resume.linkedin ? (
              <Text style={styles.link}>{resume.linkedin}</Text>
            ) : null}
          </View>

          <View style={styles.divider} />

          <ResumeSection title="SUMMARY">
            <Text style={styles.bodyText}>
              {resume.summary}
            </Text>
          </ResumeSection>

          <ResumeSection title="SKILLS">
            <View style={styles.skillsContainer}>
              {(resume.skills || []).map((skill) => (
                <View key={skill} style={styles.skillBox}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </ResumeSection>

          {(resume.education || []).length > 0 && (
            <ResumeSection title="EDUCATION">
              {resume.education.map((education) => (
                <View
                  key={education.institution}
                  style={styles.item}
                >
                  <Text style={styles.itemTitle}>
                    {education.degree}
                  </Text>

                  <Text style={styles.itemSubtitle}>
                    {education.institution}
                  </Text>

                  <Text style={styles.bodyText}>
                    {education.details}
                  </Text>
                </View>
              ))}
            </ResumeSection>
          )}

          {(resume.experience || []).length > 0 && (
            <ResumeSection title="EXPERIENCE">
              {resume.experience.map((experience) => (
                <View
                  key={`${experience.company}-${experience.role}`}
                  style={styles.item}
                >
                  <Text style={styles.itemTitle}>
                    {experience.role}
                  </Text>

                  <Text style={styles.itemSubtitle}>
                    {experience.company}
                  </Text>

                  {experience.bullets.map((bullet) => (
                    <Text key={bullet} style={styles.bullet}>
                      • {bullet}
                    </Text>
                  ))}
                </View>
              ))}
            </ResumeSection>
          )}

          <ResumeSection title="PROJECTS">
            {(resume.projects || []).map((project) => (
              <View key={project.name} style={styles.item}>
                <Text style={styles.itemTitle}>
                  {project.name}
                </Text>

                <Text style={styles.bodyText}>
                  {project.description}
                </Text>

                <Text style={styles.techText}>
                  {project.technologies.join(' • ')}
                </Text>

                {project.bullets.map((bullet) => (
                  <Text key={bullet} style={styles.bullet}>
                    • {bullet}
                  </Text>
                ))}
              </View>
            ))}
          </ResumeSection>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={goBackOrToBuilder}
          >
            <Feather
              name="edit-2"
              size={18}
              color="#00c3e4"
            />
            <Text style={styles.editText}>EDIT</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.downloadButton}
            onPress={downloadTXT}
          >
            <Feather
              name="download"
              size={18}
              color="#ffffff"
            />
            <Text style={styles.downloadText}>
              DOWNLOAD TXT
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.downloadButton}
            onPress={downloadWord}
          >
            <Feather
              name="file-text"
              size={18}
              color="#ffffff"
            />
            <Text style={styles.downloadText}>
              DOWNLOAD WORD
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function ResumeSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={styles.sectionLine} />

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.dark.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.dark.backgroundSelected,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    color: Colors.dark.text,
    fontWeight: 'bold',
    fontSize: 18,
  },

  headerSubtitle: {
    color: Colors.dark.textSecondary,
    fontWeight: '500',
    fontSize: 12,
    marginTop: 2,
  },

  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.five,
  },

  resumeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: Spacing.four,
  },

  name: {
    color: '#111827',
    fontSize: 28,
    fontWeight: 'bold',
  },

  title: {
    color: '#00a8c6',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },

  contactRow: {
    marginTop: Spacing.two,
  },

  contact: {
    color: '#4b5563',
    fontSize: 14,
  },

  linksRow: {
    marginTop: 6,
    gap: 4,
  },

  link: {
    color: '#007c96',
    fontSize: 14,
    fontWeight: '500',
  },

  divider: {
    height: 1,
    backgroundColor: '#d1d5db',
    marginVertical: Spacing.three,
  },

  section: {
    marginBottom: Spacing.three,
  },

  sectionTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  sectionLine: {
    height: 2,
    backgroundColor: '#00a8c6',
    marginTop: 6,
    marginBottom: Spacing.two,
  },

  bodyText: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
  },

  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  skillBox: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  skillText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
  },

  item: {
    marginBottom: Spacing.two,
  },

  itemTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },

  itemSubtitle: {
    color: '#4b5563',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 4,
  },

  techText: {
    color: '#007c96',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },

  bullet: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },

  actions: {
    marginTop: Spacing.three,
    gap: Spacing.two,
  },

  editButton: {
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00c3e4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  editText: {
    color: '#00c3e4',
    fontWeight: 'bold',
    fontSize: 14,
  },

  downloadButton: {
    height: 52,
    borderRadius: 8,
    backgroundColor: '#00c3e4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  downloadText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});