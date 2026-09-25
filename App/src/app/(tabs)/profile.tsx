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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { DN, FontFamily, FontSize, Space, Radius } from '@/constants/design-tokens';
import { AvatarDisplay } from '@/components/ui/AvatarDisplay';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const { session, profile, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [githubUrl, setGithubUrl] = useState(profile?.github_url || '');
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedin_url || '');
  const [portfolioSlug, setPortfolioSlug] = useState(profile?.portfolio_slug || '');
  const [portfolioIsPublic, setPortfolioIsPublic] = useState(profile?.portfolio_is_public || false);

  useEffect(() => {
    setPortfolioSlug(profile?.portfolio_slug || '');
    setPortfolioIsPublic(profile?.portfolio_is_public || false);
  }, [profile?.portfolio_slug, profile?.portfolio_is_public]);

  const displayName =
    profile?.full_name ||
    session?.user?.user_metadata?.full_name ||
    session?.user?.email?.split('@')[0] ||
    'User';
  const avatarUrl =
    profile?.avatar_url ||
    session?.user?.user_metadata?.avatar_url ||
    session?.user?.user_metadata?.picture ||
    null;
  const provider = session?.user?.app_metadata?.provider || 'email';

  const handleSave = async () => {
    if (!session?.user) return;
    const normalizedSlug = portfolioSlug.trim().toLowerCase();
    if (normalizedSlug && !/^[a-z0-9-]{3,40}$/.test(normalizedSlug)) {
      Alert.alert('Invalid portfolio URL', 'Use 3–40 lowercase letters, numbers, or hyphens.');
      return;
    }
    if (portfolioIsPublic && !normalizedSlug) {
      Alert.alert('Portfolio URL required', 'Choose a portfolio URL before publishing.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName.trim(),
          bio: bio.trim(),
          github_url: githubUrl.trim() || null,
          linkedin_url: linkedinUrl.trim() || null,
          portfolio_slug: normalizedSlug || null,
          portfolio_is_public: portfolioIsPublic,
          portfolio_updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (error) throw error;
      await refreshProfile();
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const startEditing = () => {
    setFullName(profile?.full_name || '');
    setBio(profile?.bio || '');
    setGithubUrl(profile?.github_url || '');
    setLinkedinUrl(profile?.linkedin_url || '');
    setPortfolioSlug(profile?.portfolio_slug || '');
    setPortfolioIsPublic(profile?.portfolio_is_public || false);
    setEditing(true);
  };

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

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        {!editing && (
          <TouchableOpacity onPress={startEditing} style={styles.editBtn}>
            <Feather name="edit-2" size={16} color={DN.cyan} />
            <Text style={styles.editLabel}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <SectionHeader title="Public Portfolio" icon="globe" />
      <View style={styles.card}>
        {editing ? (
          <>
            <Text style={styles.portfolioHint}>Your shareable address</Text>
            <View style={styles.slugRow}>
              <Text style={styles.slugPrefix}>/portfolio/</Text>
              <TextInput
                style={styles.slugInput}
                value={portfolioSlug}
                onChangeText={(value) => setPortfolioSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="your-name"
                placeholderTextColor={DN.textPlaceholder}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <TouchableOpacity
              style={styles.visibilityRow}
              onPress={() => setPortfolioIsPublic((current) => !current)}
            >
              <View style={[styles.visibilityToggle, portfolioIsPublic && styles.visibilityToggleActive]}>
                <View style={[styles.visibilityKnob, portfolioIsPublic && styles.visibilityKnobActive]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.visibilityTitle}>Publish portfolio</Text>
                <Text style={styles.portfolioHint}>Only projects you explicitly mark public will appear.</Text>
              </View>
            </TouchableOpacity>
          </>
        ) : profile?.portfolio_is_public && profile.portfolio_slug ? (
          <>
            <Text style={styles.publicUrl}>/portfolio/{profile.portfolio_slug}</Text>
            <Text style={[styles.portfolioHint, { marginTop: Space.sm }]}>Open this page in a browser, then choose “Print / Save PDF” to download your portfolio as a PDF.</Text>
            <PrimaryButton
              title="Open portfolio & PDF export"
              icon="download"
              variant="secondary"
              onPress={() => router.push({ pathname: '/portfolio/[slug]', params: { slug: profile.portfolio_slug ?? '' } })}
              style={{ marginTop: Space.md }}
            />
          </>
        ) : (
          <>
            <Text style={styles.bioText}>Portfolio & PDF export are not set up yet. Choose a URL, publish your portfolio, and mark at least one project public.</Text>
            <PrimaryButton
              title="Set up portfolio & PDF export"
              icon="settings"
              variant="secondary"
              onPress={startEditing}
              style={{ marginTop: Space.md }}
            />
          </>
        )}
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <AvatarDisplay uri={avatarUrl} name={displayName} size="xl" />
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{session?.user?.email}</Text>

        <View style={styles.providerBadge}>
          <Feather name="shield" size={12} color={DN.cyan} />
          <Text style={styles.providerText}>
            {provider === 'google'
              ? 'Google'
              : provider === 'github'
              ? 'GitHub'
              : 'Email'}{' '}
            Authenticated
          </Text>
        </View>

        <Text style={styles.roleBadge}>
          {profile?.role?.toUpperCase() || 'STUDENT'}
        </Text>
      </View>

      {/* Bio Section */}
      <SectionHeader title="Bio" icon="file-text" />
      <View style={styles.card}>
        {editing ? (
          <TextInput
            style={styles.bioInput}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            placeholderTextColor={DN.textPlaceholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        ) : (
          <Text style={styles.bioText}>
            {profile?.bio || 'No bio added yet. Tap Edit to add one.'}
          </Text>
        )}
      </View>

      {/* Details Section */}
      <SectionHeader title="Details" icon="info" />
      <View style={styles.card}>
        {editing ? (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>FULL NAME</Text>
              <TextInput
                style={styles.detailInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your full name"
                placeholderTextColor={DN.textPlaceholder}
              />
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>GITHUB</Text>
              <TextInput
                style={styles.detailInput}
                value={githubUrl}
                onChangeText={setGithubUrl}
                placeholder="https://github.com/username"
                placeholderTextColor={DN.textPlaceholder}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>LINKEDIN</Text>
              <TextInput
                style={styles.detailInput}
                value={linkedinUrl}
                onChangeText={setLinkedinUrl}
                placeholder="https://linkedin.com/in/username"
                placeholderTextColor={DN.textPlaceholder}
                autoCapitalize="none"
              />
            </View>
          </>
        ) : (
          <>
            <DetailRow icon="user" label="Name" value={profile?.full_name || '—'} />
            <DetailRow icon="mail" label="Email" value={session?.user?.email || '—'} />
            <DetailRow icon="github" label="GitHub" value={profile?.github_url || '—'} />
            <DetailRow icon="linkedin" label="LinkedIn" value={profile?.linkedin_url || '—'} />
            <DetailRow
              icon="calendar"
              label="Joined"
              value={
                profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })
                  : '—'
              }
            />
          </>
        )}
      </View>

      {/* Action Buttons */}
      {editing ? (
        <View style={styles.editActions}>
          <PrimaryButton
            title="Save Changes"
            icon="check"
            onPress={handleSave}
            loading={saving}
          />
          <PrimaryButton
            title="Cancel"
            variant="ghost"
            onPress={() => setEditing(false)}
            style={{ marginTop: Space.sm }}
          />
        </View>
      ) : (
        <PrimaryButton
          title="Sign Out"
          variant="danger"
          icon="log-out"
          onPress={signOut}
          style={{ marginTop: Space.base }}
        />
      )}

      <View style={{ height: Space['2xl'] }} />
    </ScrollView>
  );
}

// ─── Sub-components ─────────────────────────────────────────

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Feather name={icon} size={14} color={DN.textMuted} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue} numberOfLines={1}>
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
  title: {
    fontSize: FontSize['2xl'],
    fontFamily: FontFamily.bold,
    color: DN.textPrimary,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
    borderRadius: Radius.md,
    backgroundColor: DN.cyanMuted,
    borderWidth: 1,
    borderColor: DN.borderFocus,
  },
  editLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: DN.cyan,
  },

  // Profile Card
  profileCard: {
    backgroundColor: DN.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: DN.border,
    padding: Space.xl,
    alignItems: 'center',
    marginBottom: Space.xl,
  },
  name: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: DN.textPrimary,
    marginTop: Space.md,
  },
  email: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: DN.cyan,
    marginTop: Space.xs,
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
    backgroundColor: DN.cyanMuted,
    paddingHorizontal: Space.md,
    paddingVertical: Space.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: DN.borderFocus,
    marginTop: Space.md,
  },
  providerText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: DN.textSecondary,
  },
  roleBadge: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.mono,
    fontWeight: '700',
    color: DN.indigo,
    backgroundColor: DN.indigoMuted,
    paddingHorizontal: Space.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    marginTop: Space.sm,
    letterSpacing: 1,
    overflow: 'hidden',
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

  // Bio
  bioText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: DN.textSecondary,
    lineHeight: 22,
  },
  bioInput: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: DN.textPrimary,
    lineHeight: 22,
    minHeight: 80,
    padding: 0,
  },
  portfolioHint: {
    color: DN.textMuted,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  slugRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Space.sm,
    backgroundColor: DN.bgInput,
    borderRadius: Radius.sm,
    paddingHorizontal: Space.sm,
  },
  slugPrefix: { color: DN.textMuted, fontFamily: FontFamily.mono, fontSize: FontSize.sm },
  slugInput: { flex: 1, color: DN.textPrimary, fontFamily: FontFamily.mono, fontSize: FontSize.sm, paddingVertical: Space.sm },
  visibilityRow: { flexDirection: 'row', alignItems: 'center', gap: Space.md, marginTop: Space.md },
  visibilityToggle: { width: 42, height: 24, borderRadius: 12, backgroundColor: DN.bgElevated, padding: 3, borderWidth: 1, borderColor: DN.border },
  visibilityToggleActive: { backgroundColor: DN.cyan, borderColor: DN.cyan },
  visibilityKnob: { width: 16, height: 16, borderRadius: 8, backgroundColor: DN.textMuted },
  visibilityKnobActive: { backgroundColor: DN.bg, alignSelf: 'flex-end' },
  visibilityTitle: { color: DN.textPrimary, fontFamily: FontFamily.medium, fontSize: FontSize.md },
  publicUrl: { color: DN.cyan, fontFamily: FontFamily.mono, fontSize: FontSize.sm },

  // Detail Rows
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Space.md,
    borderBottomWidth: 1,
    borderBottomColor: DN.border,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
  },
  detailLabel: {
    fontSize: FontSize.xs + 1,
    fontFamily: FontFamily.mono,
    fontWeight: '600',
    color: DN.textLabel,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: DN.textPrimary,
    flex: 1,
    textAlign: 'right',
    marginLeft: Space.md,
  },
  detailInput: {
    flex: 1,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: DN.textPrimary,
    textAlign: 'right',
    marginLeft: Space.md,
    backgroundColor: DN.bgInput,
    borderRadius: Radius.sm,
    paddingHorizontal: Space.sm,
    paddingVertical: Space.xs,
  },

  // Edit Actions
  editActions: {
    marginTop: Space.base,
  },
});
