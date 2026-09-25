import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { DN, FontFamily, FontSize, Radius, Space } from '@/constants/design-tokens';
import { supabase } from '@/lib/supabase';
import { AvatarDisplay } from '@/components/ui/AvatarDisplay';
import { SkillTag } from '@/components/ui/SkillTag';

type PublicProject = {
  id: string;
  title: string;
  description: string | null;
  github_url: string | null;
  live_demo_url: string | null;
  status: string;
  technologies: string[];
};

type PublicPortfolio = {
  slug: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  updated_at: string;
  projects: PublicProject[];
};

const isSafeUrl = (value: string | null) => {
  if (!value) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

export default function PublicPortfolioScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [portfolio, setPortfolio] = useState<PublicPortfolio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPortfolio = async () => {
      if (!slug) return;

      setLoading(true);
      const { data, error } = await supabase.rpc('get_public_portfolio', {
        requested_slug: slug,
      });

      if (!error && data) {
        setPortfolio(data as PublicPortfolio);
      } else {
        setPortfolio(null);
      }
      setLoading(false);
    };

    loadPortfolio();
  }, [slug]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={DN.cyan} /></View>;
  }

  if (!portfolio) {
    return (
      <View style={styles.center}>
        <Feather name="eye-off" size={34} color={DN.textMuted} />
        <Text style={styles.emptyTitle}>Portfolio unavailable</Text>
        <Text style={styles.emptyText}>This portfolio is private or the link is incorrect.</Text>
      </View>
    );
  }

  const displayName = portfolio.full_name || portfolio.slug;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <AvatarDisplay uri={portfolio.avatar_url} name={displayName} size="xl" />
        <Text style={styles.name}>{displayName}</Text>
        {portfolio.bio ? <Text style={styles.bio}>{portfolio.bio}</Text> : null}
        <View style={styles.links}>
          {isSafeUrl(portfolio.github_url) && (
            <LinkButton icon="github" label="GitHub" url={portfolio.github_url!} />
          )}
          {isSafeUrl(portfolio.linkedin_url) && (
            <LinkButton icon="linkedin" label="LinkedIn" url={portfolio.linkedin_url!} />
          )}
          {Platform.OS === 'web' && typeof window !== 'undefined' && (
            <TouchableOpacity style={styles.linkButton} onPress={() => window.print()}>
              <Feather name="download" size={15} color={DN.cyan} />
              <Text style={styles.linkText}>Print / Save PDF</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Selected Projects</Text>
        <Text style={styles.projectCount}>{portfolio.projects.length}</Text>
      </View>

      {portfolio.projects.length === 0 ? (
        <Text style={styles.emptyText}>No projects have been published yet.</Text>
      ) : portfolio.projects.map((project) => (
        <View key={project.id} style={styles.projectCard}>
          <View style={styles.projectHeading}>
            <Text style={styles.projectTitle}>{project.title}</Text>
            <Text style={styles.status}>{project.status}</Text>
          </View>
          {project.description ? <Text style={styles.description}>{project.description}</Text> : null}
          {project.technologies.length > 0 && (
            <View style={styles.tags}>
              {project.technologies.map((technology) => <SkillTag key={technology} label={technology} size="sm" />)}
            </View>
          )}
          <View style={styles.projectLinks}>
            {isSafeUrl(project.github_url) && <LinkButton icon="github" label="Repository" url={project.github_url!} />}
            {isSafeUrl(project.live_demo_url) && <LinkButton icon="external-link" label="Live demo" url={project.live_demo_url!} />}
          </View>
        </View>
      ))}

      <Text style={styles.updated}>Updated {new Date(portfolio.updated_at).toLocaleDateString()}</Text>
    </ScrollView>
  );
}

function LinkButton({ icon, label, url }: { icon: keyof typeof Feather.glyphMap; label: string; url: string }) {
  return (
    <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openURL(url)}>
      <Feather name={icon} size={15} color={DN.cyan} />
      <Text style={styles.linkText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DN.bg },
  content: { width: '100%', maxWidth: 900, alignSelf: 'center', padding: Space.xl, paddingBottom: Space['4xl'] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Space.xl, backgroundColor: DN.bg },
  hero: { alignItems: 'center', paddingVertical: Space['2xl'], borderBottomWidth: 1, borderColor: DN.border },
  name: { marginTop: Space.md, color: DN.textPrimary, fontFamily: FontFamily.bold, fontSize: FontSize['2xl'] },
  bio: { marginTop: Space.sm, maxWidth: 650, textAlign: 'center', color: DN.textSecondary, fontFamily: FontFamily.regular, fontSize: FontSize.md, lineHeight: 22 },
  links: { marginTop: Space.lg, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Space.sm },
  linkButton: { flexDirection: 'row', alignItems: 'center', gap: Space.xs, borderWidth: 1, borderColor: DN.borderFocus, backgroundColor: DN.cyanMuted, borderRadius: Radius.md, paddingHorizontal: Space.md, paddingVertical: Space.sm },
  linkText: { color: DN.cyan, fontFamily: FontFamily.medium, fontSize: FontSize.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Space['2xl'], marginBottom: Space.lg },
  sectionTitle: { color: DN.textPrimary, fontFamily: FontFamily.bold, fontSize: FontSize.xl },
  projectCount: { color: DN.textMuted, fontFamily: FontFamily.mono, fontSize: FontSize.sm },
  projectCard: { backgroundColor: DN.bgCard, borderColor: DN.border, borderWidth: 1, borderRadius: Radius.lg, padding: Space.lg, marginBottom: Space.md },
  projectHeading: { flexDirection: 'row', gap: Space.md, justifyContent: 'space-between', alignItems: 'center' },
  projectTitle: { flex: 1, color: DN.textPrimary, fontFamily: FontFamily.semiBold, fontSize: FontSize.lg },
  status: { color: DN.cyan, fontFamily: FontFamily.mono, fontSize: FontSize.xs, textTransform: 'uppercase' },
  description: { marginTop: Space.sm, color: DN.textSecondary, fontFamily: FontFamily.regular, fontSize: FontSize.md, lineHeight: 21 },
  tags: { marginTop: Space.md, flexDirection: 'row', flexWrap: 'wrap', gap: Space.xs },
  projectLinks: { marginTop: Space.md, flexDirection: 'row', gap: Space.sm },
  emptyTitle: { marginTop: Space.md, color: DN.textPrimary, fontFamily: FontFamily.bold, fontSize: FontSize.xl },
  emptyText: { marginTop: Space.sm, color: DN.textMuted, fontFamily: FontFamily.regular, fontSize: FontSize.md, textAlign: 'center' },
  updated: { marginTop: Space.xl, color: DN.textMuted, fontFamily: FontFamily.mono, fontSize: FontSize.xs, textAlign: 'center' },
});
