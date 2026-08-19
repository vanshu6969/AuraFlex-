import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { showToast } from '../../../lib/toast';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyingSession, setVerifyingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    let isMounted = true;

    const initializeRecoverySession = async () => {
      try {
        // 1. Check for PKCE ?code= parameter in URL query string (web environment)
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get('code');
          if (code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error && data?.session) {
              if (isMounted) {
                setHasValidSession(true);
                setVerifyingSession(false);
                setErrorMsg('');
              }
              return;
            }
          }
        }

        // 2. Check for active session in memory / local storage
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          if (isMounted) {
            setHasValidSession(true);
            setVerifyingSession(false);
            setErrorMsg('');
          }
          return;
        }

        // 3. Fallback timeout to allow background PKCE or hash token exchange to settle
        setTimeout(async () => {
          if (!isMounted) return;
          const { data: retrySession } = await supabase.auth.getSession();
          if (retrySession?.session) {
            setHasValidSession(true);
            setErrorMsg('');
          } else {
            setHasValidSession(false);
            setErrorMsg('Auth session missing! Please click the password reset link from your email again or request a new one.');
          }
          setVerifyingSession(false);
        }, 1500);
      } catch (err: any) {
        if (isMounted) {
          setHasValidSession(false);
          setErrorMsg(err?.message || 'Failed to verify reset session.');
          setVerifyingSession(false);
        }
      }
    };

    // Listen for PASSWORD_RECOVERY or SIGNED_IN auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || session) && isMounted) {
        setHasValidSession(true);
        setVerifyingSession(false);
        setErrorMsg('');
      }
    });

    initializeRecoverySession();

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Handle password update via Supabase auth.updateUser
  const handleUpdatePassword = async () => {
    if (!hasValidSession) {
      setErrorMsg('Auth session missing! Please request a new password reset link.');
      return;
    }

    if (!password || !confirmPassword) {
      setErrorMsg('Please enter both password fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Your password has been updated successfully! Redirecting to home...');
        showToast('Password Updated Successfully!', 'success');
        setTimeout(() => {
          router.replace('/');
        }, 2000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  if (verifyingSession) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.card}>
            <ActivityIndicator size="large" color="#e50914" style={{ marginBottom: 16 }} />
            <Text style={styles.title}>Verifying Session...</Text>
            <Text style={styles.subtitle}>Connecting to authentication service</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.card}>
          <TouchableOpacity onPress={() => router.replace('/')} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <View style={styles.iconPod}>
            <Ionicons name="key" size={26} color="#e50914" />
          </View>

          <Text style={styles.title}>Update Password</Text>
          <Text style={styles.subtitle}>
            Enter your new password to secure your AuraFlex account.
          </Text>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {successMsg ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          ) : null}

          {/* New Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter new password"
                placeholderTextColor="#6b7280"
                secureTextEntry={!showPassword}
                style={styles.textInput}
                editable={hasValidSession && !loading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                placeholderTextColor="#6b7280"
                secureTextEntry={!showPassword}
                style={styles.textInput}
                editable={hasValidSession && !loading}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleUpdatePassword}
            disabled={loading || !hasValidSession}
            style={[styles.submitBtn, (!hasValidSession || loading) && styles.disabledBtn]}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b0c0f',
  },
  container: {
    flex: 1,
    backgroundColor: '#0b0c0f',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#12141a',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
    zIndex: 10,
  },
  iconPod: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
  },
  errorBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    flex: 1,
    fontWeight: '600',
  },
  successBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 14,
    gap: 8,
  },
  successText: {
    color: '#10b981',
    fontSize: 12,
    flex: 1,
    fontWeight: '600',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 14,
  },
  inputLabel: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    paddingVertical: 12,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  eyeBtn: {
    padding: 6,
  },
  submitBtn: {
    width: '100%',
    backgroundColor: '#e50914',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  disabledBtn: {
    opacity: 0.5,
    backgroundColor: '#4b5563',
    shadowOpacity: 0,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
