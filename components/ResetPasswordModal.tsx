import React, { useState } from 'react';
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
import { showToast } from '../lib/toast';

export type ResetStep = 'EMAIL' | 'OTP' | 'PASSWORD';

interface ResetPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  initialEmail?: string;
  onSuccess?: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  visible,
  onClose,
  initialEmail = '',
  onSuccess,
}) => {
  const [step, setStep] = useState<ResetStep>('EMAIL');
  const [email, setEmail] = useState(initialEmail);
  const [otpToken, setOtpToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const resetState = () => {
    setStep('EMAIL');
    setEmail(initialEmail);
    setOtpToken('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    setSuccessMsg('');
    setShowPassword(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Step 1: Send OTP Code to Email
  const handleSendOTP = async () => {
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
        setStep('OTP');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 6-Digit OTP Code
  const handleVerifyOTP = async () => {
    if (!otpToken.trim() || otpToken.trim().length !== 6) {
      setErrorMsg('Please enter a valid 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpToken.trim(),
        type: 'recovery',
      });

      if (error) {
        setErrorMsg(error.message || 'Invalid or expired OTP code.');
      } else {
        setSuccessMsg('OTP Code verified! Enter your new password below.');
        showToast('OTP Verified!', 'success');
        setStep('PASSWORD');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to verify OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Update Password
  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setErrorMsg('Please fill in both password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Password updated successfully! Welcome back.');
        showToast('Password Updated Successfully!', 'success');
        setTimeout(() => {
          handleClose();
          onSuccess?.();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#9ca3af" />
          </TouchableOpacity>

          {/* Header Step Indicator */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons
                name={step === 'EMAIL' ? 'mail-unread-outline' : step === 'OTP' ? 'keypad-outline' : 'key-outline'}
                size={24}
                color="#e50914"
              />
            </View>
            <Text style={styles.title}>
              {step === 'EMAIL' ? 'Reset Password' : step === 'OTP' ? 'Enter 6-Digit OTP' : 'Set New Password'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'EMAIL'
                ? 'Enter your email to receive a 6-digit verification code'
                : step === 'OTP'
                ? `Verification code sent to ${email}`
                : 'Set a secure new password for your account'}
            </Text>

            {/* Step Progress Dots */}
            <View style={styles.stepDotsRow}>
              <View style={[styles.dot, (step === 'EMAIL' || step === 'OTP' || step === 'PASSWORD') && styles.dotActive]} />
              <View style={styles.dotLine} />
              <View style={[styles.dot, (step === 'OTP' || step === 'PASSWORD') && styles.dotActive]} />
              <View style={styles.dotLine} />
              <View style={[styles.dot, step === 'PASSWORD' && styles.dotActive]} />
            </View>
          </View>

          {/* Error & Success Messages */}
          {errorMsg ? <Text style={styles.errorAlert}>{errorMsg}</Text> : null}
          {successMsg ? <Text style={styles.successAlert}>{successMsg}</Text> : null}

          {/* --- RENDER BLOCK 1: STEP EMAIL --- */}
          {step === 'EMAIL' && (
            <View style={styles.formView}>
              <View style={styles.inputBox}>
                <Ionicons name="mail-outline" size={18} color="#9ca3af" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your Email Address"
                  placeholderTextColor="#6b7280"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <TouchableOpacity onPress={handleSendOTP} disabled={loading} style={styles.actionBtn}>
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.btnText}>Send 6-Digit OTP Code</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* --- RENDER BLOCK 2: STEP OTP (Strictly OTP code input ONLY, NO password inputs here) --- */}
          {step === 'OTP' && (
            <View style={styles.formView}>
              <View style={styles.lockedEmailRow}>
                <Text style={styles.lockedEmailLabel}>TARGET EMAIL:</Text>
                <Text style={styles.lockedEmailText} numberOfLines={1}>{email}</Text>
                <TouchableOpacity onPress={() => setStep('EMAIL')} style={styles.changeEmailBtn}>
                  <Text style={styles.changeEmailText}>Change</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputBox}>
                <Ionicons name="keypad-outline" size={18} color="#e50914" />
                <TextInput
                  style={[styles.textInput, styles.otpInput]}
                  placeholder="6-Digit Code"
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

              <TouchableOpacity onPress={handleVerifyOTP} disabled={loading} style={styles.actionBtn}>
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.btnText}>Verify OTP Code</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSendOTP} style={styles.resendBtn}>
                <Text style={styles.resendText}>Didn't receive code? Resend OTP</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* --- RENDER BLOCK 3: STEP PASSWORD (Strictly New Password inputs ONLY, revealed only after OTP verification) --- */}
          {step === 'PASSWORD' && (
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
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.btnText}>Update Password</Text>
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
    backgroundColor: '#18181f',
    borderRadius: 22,
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
    marginBottom: 16,
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
  stepDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dotActive: {
    backgroundColor: '#e50914',
  },
  dotLine: {
    width: 24,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    paddingHorizontal: 6,
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
    fontSize: 16,
    textAlign: 'center',
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
  resendBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  resendText: {
    color: '#9ca3af',
    fontSize: 12,
  },
});
