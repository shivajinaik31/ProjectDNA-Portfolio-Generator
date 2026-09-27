import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { performOAuthSignIn, supabase, isSupabaseConfigured } from '@/lib/supabase';

export function AuthScreen() {
  // Mode: 'signin' | 'register' | 'forgot'
  const [mode, setMode] = useState<'signin' | 'register' | 'forgot'>('signin');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'github' | null>(null);

  // Status feedback banners
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearFeedback = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleModeSwitch = (newMode: 'signin' | 'register' | 'forgot') => {
    setMode(newMode);
    clearFeedback();
  };

  // Handle Password Reset Request via Supabase Auth
  const handleResetPassword = async () => {
    clearFeedback();

    if (!isSupabaseConfigured()) {
      const msg = 'Supabase credentials missing! Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file and restart your server.';
      setErrorMessage(msg);
      Alert.alert('Configuration Required', msg);
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address to reset your password.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = Linking.createURL('/auth/callback');
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        throw error;
      }

      const msg = `Password reset instructions sent to ${trimmedEmail}. Please check your inbox.`;
      setSuccessMessage(msg);
      Alert.alert('Reset Link Sent', msg);
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to send password reset email. Please try again.';
      setErrorMessage(errorMsg);
      Alert.alert('Reset Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Email / Password Form Submit
  const handleSubmit = async () => {
    clearFeedback();

    if (!isSupabaseConfigured()) {
      const msg = 'Supabase credentials missing! Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file and restart your server.';
      setErrorMessage(msg);
      Alert.alert('Configuration Required', msg);
      return;
    }

    if (!email || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    if (mode === 'register') {
      if (!fullName) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please re-enter.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error(
              'Invalid email or password. (Note: If you signed up via Google or GitHub, please use the "Continue with Google" or "Continue with GitHub" button below!)'
            );
          }
          throw error;
        }
        
        const welcomeMsg = `Welcome back, ${data.user?.email}!`;
        setSuccessMessage(welcomeMsg);
        Alert.alert('Sign In Successful', welcomeMsg);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          const succMsg = `Account created successfully! Welcome, ${data.user?.email}!`;
          setSuccessMessage(succMsg);
          Alert.alert('Registration Successful', succMsg);
        } else if (data.user && !data.session) {
          const infoMsg = 'Account created! If email confirmation is enabled in your Supabase project, please check your email inbox to verify your account.';
          setSuccessMessage(infoMsg);
          Alert.alert('Check Your Email', infoMsg);
        }
      }
    } catch (error: any) {
      console.error('Auth Error:', error);
      const errText = error.message || 'An error occurred during authentication.';
      setErrorMessage(errText);
      Alert.alert('Authentication Notice', errText);
    } finally {
      setLoading(false);
    }
  };

  // Handle Social OAuth Login
  const handleOAuth = async (provider: 'google' | 'github') => {
    clearFeedback();

    if (!isSupabaseConfigured()) {
      const msg = 'Supabase credentials missing! Please update your .env file and restart your server.';
      setErrorMessage(msg);
      Alert.alert('Configuration Required', msg);
      return;
    }

    setSocialLoading(provider);
    try {
      const { user, error } = await performOAuthSignIn(provider);
      if (error) throw error;
      if (user) {
        const msg = `Successfully authenticated with ${provider}!`;
        setSuccessMessage(msg);
        Alert.alert('OAuth Success', msg);
      }
    } catch (error: any) {
      console.error(`${provider} OAuth Error:`, error);
      const errText = error.message || `Failed to sign in with ${provider}`;
      setErrorMessage(errText);
      Alert.alert(`${provider} Sign In Error`, errText);
    } finally {
      setSocialLoading(null);
    }
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
        <Text style={styles.subtitle}>Build your professional profile.</Text>
      </View>

      {/* Segmented Mode Switcher (Sign In vs Register) */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.segmentBtn, mode === 'signin' && styles.segmentBtnActive]}
          onPress={() => handleModeSwitch('signin')}
        >
          <Feather
            name="log-in"
            size={16}
            color={mode === 'signin' ? '#070d19' : '#8ba1be'}
            style={styles.segmentIcon}
          />
          <Text style={[styles.segmentText, mode === 'signin' && styles.segmentTextActive]}>
            Sign In
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.segmentBtn, mode === 'register' && styles.segmentBtnActive]}
          onPress={() => handleModeSwitch('register')}
        >
          <Feather
            name="user-plus"
            size={16}
            color={mode === 'register' ? '#070d19' : '#8ba1be'}
            style={styles.segmentIcon}
          />
          <Text style={[styles.segmentText, mode === 'register' && styles.segmentTextActive]}>
            Register
          </Text>
        </TouchableOpacity>
      </View>

      {/* Inline Feedback Banners */}
      {errorMessage && (
        <View style={styles.errorBox}>
          <Feather name="alert-circle" size={16} color="#ff4d4f" style={{ marginRight: 8 }} />
          <Text style={styles.errorBoxText}>{errorMessage}</Text>
        </View>
      )}

      {successMessage && (
        <View style={styles.successBox}>
          <Feather name="check-circle" size={16} color="#52c41a" style={{ marginRight: 8 }} />
          <Text style={styles.successBoxText}>{successMessage}</Text>
        </View>
      )}

      {/* Main Auth Form Card */}
      <View style={styles.formCard}>
        {/* Register Only: Full Name */}
        {mode === 'register' && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>FULL NAME</Text>
            <View style={styles.inputWrapper}>
              <Feather name="user" size={18} color="#657b9c" style={styles.fieldIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Shivaji Bhosale"
                placeholderTextColor="#475873"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>
          </View>
        )}

        {mode === 'forgot' && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>
              Reset Password
            </Text>
            <Text style={{ color: '#8ba1be', fontSize: 13, lineHeight: 18 }}>
              Enter your account email to receive a password reset link.
            </Text>
          </View>
        )}

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>GMAIL / EMAIL ADDRESS</Text>
          <View style={styles.inputWrapper}>
            <Feather name="mail" size={18} color="#657b9c" style={styles.fieldIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="user@gmail.com"
              placeholderTextColor="#475873"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Password Input */}
        {mode !== 'forgot' && (
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>PASSKEY / PASSWORD</Text>
              {mode === 'signin' && (
                <TouchableOpacity onPress={() => handleModeSwitch('forgot')}>
                  <Text style={styles.forgotLink}>Forgot password?</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={18} color="#657b9c" style={styles.fieldIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="••••••••••••"
                placeholderTextColor="#475873"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onSubmitEditing={handleSubmit}
                returnKeyType="done"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Feather name={showPassword ? 'eye' : 'eye-off'} size={18} color="#657b9c" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Register Only: Confirm Password */}
        {mode === 'register' && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <Feather name="check-circle" size={18} color="#657b9c" style={styles.fieldIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="••••••••••••"
                placeholderTextColor="#475873"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                onSubmitEditing={handleSubmit}
                returnKeyType="done"
              />
            </View>
          </View>
        )}

        {/* Primary Submit Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.submitBtn}
          onPress={mode === 'forgot' ? handleResetPassword : handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#070d19" />
          ) : (
            <View style={styles.btnContentRow}>
              <Text style={styles.submitBtnText}>
                {mode === 'signin'
                  ? 'Sign In'
                  : mode === 'register'
                  ? 'Create Account'
                  : 'Send Reset Link'}
              </Text>
              <Feather
                name={mode === 'forgot' ? 'send' : 'arrow-right'}
                size={18}
                color="#070d19"
                style={{ marginLeft: 6 }}
              />
            </View>
          )}
        </TouchableOpacity>

        {/* Toggle Mode Footer */}
        <View style={styles.toggleFooter}>
          {mode === 'forgot' ? (
            <>
              <Text style={styles.toggleText}>Remember your password? </Text>
              <TouchableOpacity onPress={() => handleModeSwitch('signin')}>
                <Text style={styles.toggleLink}>Back to Sign In</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.toggleText}>
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              </Text>
              <TouchableOpacity onPress={() => handleModeSwitch(mode === 'signin' ? 'register' : 'signin')}>
                <Text style={styles.toggleLink}>
                  {mode === 'signin' ? 'Create an account' : 'Sign in'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Social OAuth Provider Buttons */}
      {mode !== 'forgot' && (
        <View style={styles.providersSection}>
          {/* Google Provider Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.providerCyanBtn}
            onPress={() => handleOAuth('google')}
            disabled={socialLoading !== null}
          >
            {socialLoading === 'google' ? (
              <ActivityIndicator color="#070d19" />
            ) : (
              <View style={styles.providerBtnContent}>
                <FontAwesome name="google" size={18} color="#070d19" style={styles.providerIcon} />
                <Text style={styles.providerCyanBtnText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* GitHub Provider Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.providerCyanBtn}
            onPress={() => handleOAuth('github')}
            disabled={socialLoading !== null}
          >
            {socialLoading === 'github' ? (
              <ActivityIndicator color="#070d19" />
            ) : (
              <View style={styles.providerBtnContent}>
                <FontAwesome name="github" size={20} color="#070d19" style={styles.providerIcon} />
                <Text style={styles.providerCyanBtnText}>Continue with GitHub</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Vault Footer */}
      <View style={styles.footerSection}>
        <View style={styles.vaultRow}>
          <Feather name="lock" size={14} color="#00c3e4" style={{ marginRight: 6 }} />
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
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#0b162b',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#172742',
    width: '100%',
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#00c3e4',
  },
  segmentIcon: {
    marginRight: 6,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8ba1be',
  },
  segmentTextActive: {
    color: '#070d19',
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a1215',
    borderWidth: 1,
    borderColor: '#5c1d24',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    marginBottom: 16,
  },
  errorBoxText: {
    color: '#ff7875',
    fontSize: 13,
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#122619',
    borderWidth: 1,
    borderColor: '#1d4d29',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    marginBottom: 16,
  },
  successBoxText: {
    color: '#73d13d',
    fontSize: 13,
    flex: 1,
  },
  formCard: {
    width: '100%',
    backgroundColor: '#0b1426',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#172640',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7e94b4',
    letterSpacing: 1,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  forgotLink: {
    fontSize: 12,
    color: '#00c3e4',
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f1d36',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1d2f4d',
    paddingHorizontal: 12,
    height: 48,
  },
  fieldIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  eyeBtn: {
    padding: 4,
  },
  submitBtn: {
    backgroundColor: '#00c3e4',
    borderRadius: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#070d19',
    fontSize: 16,
    fontWeight: '700',
  },
  toggleFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    color: '#8ba1be',
    fontSize: 13,
  },
  toggleLink: {
    color: '#00c3e4',
    fontSize: 13,
    fontWeight: '600',
  },
  providersSection: {
    width: '100%',
    gap: 12,
    marginBottom: 28,
  },
  providerCyanBtn: {
    width: '100%',
    backgroundColor: '#00c3e4',
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00c3e4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  providerBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerIcon: {
    marginRight: 10,
  },
  providerCyanBtnText: {
    color: '#070d19',
    fontSize: 15,
    fontWeight: '700',
  },
  footerSection: {
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
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
