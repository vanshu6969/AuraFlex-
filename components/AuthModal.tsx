import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { storageService } from '../lib/storage';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [forgotStep, setForgotStep] = useState<'email' | 'otp'>('email');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP Reset password states
  const [otpToken, setOtpToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const resetFormState = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setOtpToken('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotStep('email');
  };

  const handleSwitchMode = (newMode: 'signin' | 'signup' | 'forgot') => {
    setMode(newMode);
    resetFormState();
  };

  const handleAuth = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (mode === 'signup') {
      if (!email || !password) {
        setErrorMsg('Please fill in all fields.');
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('Account created! Please check your email to verify.');
          if (data.session?.user) {
            setUser(data.session.user);
            await storageService.syncLocalToSupabase();
            setTimeout(onClose, 1200);
          }
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Registration failed.');
      } finally {
        setLoading(false);
      }
    } else if (mode === 'signin') {
      if (!email || !password) {
        setErrorMsg('Please fill in all fields.');
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('Welcome back! Signed in successfully.');
          setUser(data.user);
          await storageService.syncLocalToSupabase();
          setTimeout(onClose, 1000);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Sign in failed.');
      } finally {
        setLoading(false);
      }
    } else if (mode === 'forgot') {
      // 2-Step OTP Password Reset Flow
      if (forgotStep === 'email') {
        if (!email.trim()) {
          setErrorMsg('Please enter your email address.');
          return;
        }
        setLoading(true);
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
          if (error) {
            setErrorMsg(error.message);
          } else {
            setSuccessMsg('6-digit OTP code sent to your email!');
            setForgotStep('otp');
          }
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to send OTP code.');
        } finally {
          setLoading(false);
        }
      } else if (forgotStep === 'otp') {
        if (!otpToken.trim()) {
          setErrorMsg('Please enter the 6-digit OTP code.');
          return;
        }
        if (!newPassword || !confirmPassword) {
          setErrorMsg('Please enter both new password fields.');
          return;
        }
        if (newPassword.length < 6) {
          setErrorMsg('New password must be at least 6 characters.');
          return;
        }
        if (newPassword !== confirmPassword) {
          setErrorMsg('Passwords do not match.');
          return;
        }

        setLoading(true);
        try {
          // 1. Verify 6-digit OTP Token with Supabase Auth Recovery
          const { data: verifyData, error: verifyErr } = await supabase.auth.verifyOtp({
            email: email.trim(),
            token: otpToken.trim(),
            type: 'recovery',
          });

          if (verifyErr) {
            setErrorMsg(verifyErr.message || 'Invalid or expired OTP code.');
            setLoading(false);
            return;
          }

          // 2. Immediately update password once recovery session is established
          const { error: updateErr } = await supabase.auth.updateUser({
            password: newPassword,
          });

          if (updateErr) {
            setErrorMsg(updateErr.message);
          } else {
            setSuccessMsg('Password updated successfully! Welcome back.');
            if (verifyData?.user) {
              setUser(verifyData.user);
            }
            await storageService.syncLocalToSupabase();
            setTimeout(() => {
              onClose();
              resetFormState();
              setMode('signin');
            }, 1500);
          }
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to verify OTP code.');
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
    setSuccessMsg('Signed out successfully.');
    setTimeout(onClose, 1000);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons
                name={mode === 'forgot' ? 'key-outline' : 'sparkles'}
                size={24}
                color="#e50914"
              />
            </View>
            <Text style={styles.title}>
              {user
                ? 'Account Settings'
                : mode === 'signup'
                ? 'Create AuraFlex Account'
                : mode === 'forgot'
                ? forgotStep === 'otp'
                  ? 'Enter 6-Digit OTP'
                  : 'Reset Password'
                : 'Welcome Back'}
            </Text>
            <Text style={styles.subtitle}>
              {user
                ? 'Cloud watchlist & watch progress active'
                : mode === 'forgot'
                ? forgotStep === 'otp'
                  ? `Enter the 6-digit code sent to ${email}`
                  : 'Receive a 6-digit OTP code directly in your email'
                : 'Sync watch history and watchlist seamlessly across all devices'}
            </Text>
          </View>

          {errorMsg ? <Text style={styles.errorAlert}>{errorMsg}</Text> : null}
          {successMsg ? <Text style={styles.successAlert}>{successMsg}</Text> : null}

          {user ? (
            <View style={styles.loggedInView}>
              <View style={styles.userInfoBox}>
                <Text style={styles.userLabel}>SIGNED IN AS</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={styles.badgeRow}>
                  <Ionicons name="cloud-done" size={16} color="#10b981" />
                  <Text style={styles.badgeText}>Cloud Sync Active</Text>
                </View>
              </View>

              <TouchableOpacity onPress={handleSignOut} disabled={loading} style={styles.signOutBtn}>
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="log-out-outline" size={18} color="#ffffff" />
                    <Text style={styles.btnText}>Sign Out</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formView}>
              {/* Step 1 Email Input (or locked Email preview in Step 2) */}
              {mode === 'forgot' && forgotStep === 'otp' ? (
                <View style={styles.lockedEmailRow}>
                  <Text style={styles.lockedEmailLabel}>EMAIL:</Text>
                  <Text style={styles.lockedEmailText}>{email}</Text>
                  <TouchableOpacity onPress={() => setForgotStep('email')} style={styles.changeEmailBtn}>
                    <Text style={styles.changeEmailText}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.inputBox}>
                  <Ionicons name="mail-outline" size={18} color="#9ca3af" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Email Address"
                    placeholderTextColor="#6b7280"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              )}

              {/* Password Input (SignIn / SignUp mode) */}
              {mode !== 'forgot' && (
                <View style={styles.inputBox}>
                  <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Password"
                    placeholderTextColor="#6b7280"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
              )}

              {/* OTP Inputs (Forgot Password Step 2) */}
              {mode === 'forgot' && forgotStep === 'otp' && (
                <>
                  {/* 6-Digit OTP Code */}
                  <View style={styles.inputBox}>
                    <Ionicons name="keypad-outline" size={18} color="#e50914" />
                    <TextInput
                      style={[styles.textInput, styles.otpInput]}
                      placeholder="6-Digit OTP Code"
                      placeholderTextColor="#6b7280"
                      value={otpToken}
                      onChangeText={(val) => setOtpToken(val.replace(/\D/g, ''))}
                      keyboardType="numeric"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      {...(Platform.OS === 'web' ? ({ pattern: '[0-9]*' } as any) : {})}
                    />
                  </View>

                  {/* New Password */}
                  <View style={styles.inputBox}>
                    <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="New Password"
                      placeholderTextColor="#6b7280"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showPassword}
                      autoComplete="new-password"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>

                  {/* Confirm New Password */}
                  <View style={styles.inputBox}>
                    <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Confirm New Password"
                      placeholderTextColor="#6b7280"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPassword}
                      autoComplete="new-password"
                    />
                  </View>

                </>
              )}

              {/* Forgot Password trigger in signin mode */}
              {mode === 'signin' && (
                <TouchableOpacity onPress={() => handleSwitchMode('forgot')} style={styles.forgotBtn}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              )}

              {/* Primary Action Button */}
              <TouchableOpacity onPress={handleAuth} disabled={loading} style={styles.actionBtn}>
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.btnText}>
                    {mode === 'signup'
                      ? 'Create Account'
                      : mode === 'forgot'
                      ? forgotStep === 'otp'
                        ? 'Verify & Update Password'
                        : 'Send 6-Digit OTP Code'
                      : 'Sign In'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Toggle Mode Footer */}
              <View style={styles.toggleRow}>
                {mode === 'signin' ? (
                  <Text style={styles.toggleSub}>
                    Don't have an account?{' '}
                    <Text style={styles.toggleLink} onPress={() => handleSwitchMode('signup')}>
                      Sign Up
                    </Text>
                  </Text>
                ) : (
                  <Text style={styles.toggleSub}>
                    Already have an account?{' '}
                    <Text style={styles.toggleLink} onPress={() => handleSwitchMode('signin')}>
                      Sign In
                    </Text>
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#18181f',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#0f0f12',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 18,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 8,
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1,
    color: '#f87171',
    padding: 10,
    borderRadius: 10,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 14,
  },
  successAlert: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderWidth: 1,
    color: '#34d399',
    padding: 10,
    borderRadius: 10,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 14,
  },
  formView: {
    gap: 12,
  },
  lockedEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  lockedEmailLabel: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '800',
  },
  lockedEmailText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  changeEmailBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  changeEmailText: {
    color: '#e50914',
    fontSize: 11,
    fontWeight: '700',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f12',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 10,
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  otpInput: {
    letterSpacing: 4,
    fontWeight: '800',
    fontSize: 15,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    color: '#e50914',
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtn: {
    backgroundColor: '#e50914',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  toggleRow: {
    alignItems: 'center',
    marginTop: 8,
  },
  toggleSub: {
    color: '#9ca3af',
    fontSize: 12,
  },
  toggleLink: {
    color: '#e50914',
    fontWeight: '700',
  },
  loggedInView: {
    gap: 16,
    alignItems: 'center',
  },
  userInfoBox: {
    width: '100%',
    backgroundColor: '#0f0f12',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  userLabel: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  userEmail: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  badgeText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  signOutBtn: {
    width: '100%',
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
