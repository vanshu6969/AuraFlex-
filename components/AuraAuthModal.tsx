import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { storageService } from '../lib/storage';
import { showToast } from '../lib/toast';

export type AuraAuthView =
  | 'SIGN_IN'
  | 'SIGN_UP'
  | 'RESET_EMAIL'
  | 'RESET_OTP'
  | 'RESET_NEW_PASS'
  | 'ACCOUNT';

interface AuraAuthModalProps {
  visible: boolean;
  onClose: () => void;
  initialView?: AuraAuthView;
}

export const AuraAuthModal: React.FC<AuraAuthModalProps> = ({
  visible,
  onClose,
  initialView,
}) => {
  const [view, setView] = useState<AuraAuthView>('SIGN_IN');
  const [user, setUser] = useState<any>(null);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 6-digit OTP fields
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // New Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Synchronize Auth Session on Mount & Auth State Changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const activeUser = data.session?.user || null;
      setUser(activeUser);
      if (initialView) {
        setView(initialView);
      } else if (activeUser) {
        setView('ACCOUNT');
      } else {
        setView('SIGN_IN');
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const activeUser = session?.user || null;
      setUser(activeUser);

      // Do NOT automatically switch view to ACCOUNT during active password recovery steps
      if (event === 'SIGNED_OUT') {
        setView('SIGN_IN');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [visible, initialView]);

  const resetFormState = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setPassword('');
    setOtpDigits(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  };

  const handleSwitchView = (nextView: AuraAuthView) => {
    resetFormState();
    setView(nextView);
  };

  // OTP Digit Change Handler
  const handleOtpChange = (text: string, index: number) => {
    const clean = text.replace(/\D/g, '');
    const newDigits = [...otpDigits];

    if (clean.length > 1) {
      // Pasted full 6-digit code
      const pasted = clean.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      if (pasted.length === 6) {
        inputRefs.current[5]?.focus();
      }
      return;
    }

    newDigits[index] = clean;
    setOtpDigits(newDigits);

    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // 1. Sign In
  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Welcome back! Signed in successfully.');
        setUser(data.user);
        await storageService.syncLocalToSupabase();
        showToast('Signed In Successfully!', 'success');
        setTimeout(() => {
          onClose();
          setView('ACCOUNT');
        }, 1000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Sign Up
  const handleSignUp = async () => {
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Account created! Please check your email to verify.');
        showToast('Account Created!', 'success');
        if (data.session?.user) {
          setUser(data.session.user);
          await storageService.syncLocalToSupabase();
          setTimeout(() => {
            onClose();
            setView('ACCOUNT');
          }, 1200);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Request OTP Code
  const handleRequestOTP = async () => {
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('6-Digit OTP Code sent to your email!');
        showToast('OTP Code Sent to Email', 'success');
        setView('RESET_OTP');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Verify 6-digit OTP Code
  const handleVerifyOTP = async () => {
    const token = otpDigits.join('');
    if (token.length !== 6) {
      setErrorMsg('Please enter the full 6-digit OTP code.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token,
        type: 'recovery',
      });
      if (error) {
        setErrorMsg(error.message || 'Invalid or expired OTP code.');
      } else {
        setSuccessMsg('OTP Verified! Enter your new password below.');
        showToast('OTP Code Verified!', 'success');
        setView('RESET_NEW_PASS');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to verify OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Update Password
  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setErrorMsg('Please enter both password fields.');
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
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Password updated successfully! Welcome back.');
        showToast('Password Updated Successfully!', 'success');
        if (data?.user) {
          setUser(data.user);
        }
        await storageService.syncLocalToSupabase();
        setTimeout(() => {
          onClose();
          setView('ACCOUNT');
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Sign Out
  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
    showToast('Signed Out Successfully', 'info');
    setView('SIGN_IN');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#9ca3af" />
          </TouchableOpacity>

          {/* Dynamic Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons
                name={
                  view === 'ACCOUNT'
                    ? 'cloud-done-outline'
                    : view.startsWith('RESET')
                    ? 'key-outline'
                    : 'sparkles'
                }
                size={24}
                color="#e50914"
              />
            </View>
            <Text style={styles.title}>
              {view === 'ACCOUNT'
                ? 'Account Settings'
                : view === 'SIGN_UP'
                ? 'Create Account'
                : view === 'RESET_EMAIL'
                ? 'Reset Password'
                : view === 'RESET_OTP'
                ? 'Enter 6-Digit OTP'
                : view === 'RESET_NEW_PASS'
                ? 'Set New Password'
                : 'Welcome Back'}
            </Text>
            <Text style={styles.subtitle}>
              {view === 'ACCOUNT'
                ? 'Cloud watchlist & watch progress active'
                : view === 'SIGN_UP'
                ? 'Join AuraFlex to sync watch history across all devices'
                : view === 'RESET_EMAIL'
                ? 'Enter your email to receive a 6-digit verification code'
                : view === 'RESET_OTP'
                ? `Verification code sent to ${email}`
                : view === 'RESET_NEW_PASS'
                ? 'Set a secure new password for your account'
                : 'Sync watch history and watchlist seamlessly across all devices'}
            </Text>
          </View>

          {/* Error & Success Alerts */}
          {errorMsg ? <Text style={styles.errorAlert}>{errorMsg}</Text> : null}
          {successMsg ? <Text style={styles.successAlert}>{successMsg}</Text> : null}

          {/* --- VIEW 1: SIGN IN --- */}
          {view === 'SIGN_IN' && (
            <View style={styles.formView}>
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

              <TouchableOpacity onPress={() => handleSwitchView('RESET_EMAIL')} style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSignIn} disabled={loading} style={styles.actionBtn}>
                {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.btnText}>Sign In</Text>}
              </TouchableOpacity>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleSub}>
                  Don't have an account?{' '}
                  <Text style={styles.toggleLink} onPress={() => handleSwitchView('SIGN_UP')}>
                    Sign Up
                  </Text>
                </Text>
              </View>
            </View>
          )}

          {/* --- VIEW 2: SIGN UP --- */}
          {view === 'SIGN_UP' && (
            <View style={styles.formView}>
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

              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Password (min 6 chars)"
                  placeholderTextColor="#6b7280"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={handleSignUp} disabled={loading} style={styles.actionBtn}>
                {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.btnText}>Create Account</Text>}
              </TouchableOpacity>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleSub}>
                  Already have an account?{' '}
                  <Text style={styles.toggleLink} onPress={() => handleSwitchView('SIGN_IN')}>
                    Sign In
                  </Text>
                </Text>
              </View>
            </View>
          )}

          {/* --- VIEW 3: RESET EMAIL --- */}
          {view === 'RESET_EMAIL' && (
            <View style={styles.formView}>
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

              <TouchableOpacity onPress={handleRequestOTP} disabled={loading} style={styles.actionBtn}>
                {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.btnText}>Send 6-Digit OTP Code</Text>}
              </TouchableOpacity>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleSub}>
                  Remember your password?{' '}
                  <Text style={styles.toggleLink} onPress={() => handleSwitchView('SIGN_IN')}>
                    Back to Sign In
                  </Text>
                </Text>
              </View>
            </View>
          )}

          {/* --- VIEW 4: RESET OTP (6 Auto-Focusing Numeric Input Boxes) --- */}
          {view === 'RESET_OTP' && (
            <View style={styles.formView}>
              <View style={styles.lockedEmailRow}>
                <Text style={styles.lockedEmailLabel}>TARGET EMAIL:</Text>
                <Text style={styles.lockedEmailText} numberOfLines={1}>{email}</Text>
                <TouchableOpacity onPress={() => handleSwitchView('RESET_EMAIL')} style={styles.changeEmailBtn}>
                  <Text style={styles.changeEmailText}>Change</Text>
                </TouchableOpacity>
              </View>

              {/* 6 Individual Auto-Focusing Digit Input Boxes */}
              <View style={styles.otpGridRow}>
                {otpDigits.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, index)}
                    onKeyPress={(e) => handleOtpKeyPress(e, index)}
                    style={[styles.otpBoxInput, digit ? styles.otpBoxInputActive : null]}
                    keyboardType="numeric"
                    inputMode="numeric"
                    maxLength={index === 0 ? 6 : 1}
                    autoComplete="one-time-code"
                    selectTextOnFocus
                  />
                ))}
              </View>

              <TouchableOpacity onPress={handleVerifyOTP} disabled={loading} style={styles.actionBtn}>
                {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.btnText}>Verify OTP Code</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleRequestOTP} style={styles.resendBtn}>
                <Text style={styles.resendText}>Didn't receive code? Resend OTP</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* --- VIEW 5: RESET NEW PASS --- */}
          {view === 'RESET_NEW_PASS' && (
            <View style={styles.formView}>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" />
                <TextInput
                  style={styles.textInput}
                  placeholder="New Password (min 6 chars)"
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

              <TouchableOpacity onPress={handleUpdatePassword} disabled={loading} style={styles.actionBtn}>
                {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.btnText}>Update Password</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* --- VIEW 6: ACCOUNT --- */}
          {view === 'ACCOUNT' && user && (
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
    backgroundColor: '#12141a',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
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
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
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
  otpGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginVertical: 4,
  },
  otpBoxInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#0f0f12',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  otpBoxInputActive: {
    borderColor: '#e50914',
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
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
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  resendBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  resendText: {
    color: '#9ca3af',
    fontSize: 12,
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
