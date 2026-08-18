import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ActivityIndicator } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { storageService } from '../lib/storage';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const handleAuth = async () => {
    if (!email || (mode !== 'forgot' && !password)) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
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
      } else if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('Welcome back! Signed in successfully.');
          setUser(data.user);
          await storageService.syncLocalToSupabase();
          setTimeout(onClose, 1000);
        }
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('Password reset link sent to your email.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
    setSuccessMsg('Signed out.');
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
              <Ionicons name="sparkles" size={24} color="#e50914" />
            </View>
            <Text style={styles.title}>
              {user
                ? 'Account Settings'
                : mode === 'signup'
                ? 'Create AuraFlex Account'
                : mode === 'forgot'
                ? 'Reset Password'
                : 'Welcome Back'}
            </Text>
            <Text style={styles.subtitle}>
              {user
                ? 'Cloud watchlist & watch progress active'
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
              {/* Email Input */}
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

              {/* Password Input (Hidden for Forgot Password mode) */}
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

              {/* Forgot Password Link */}
              {mode === 'signin' && (
                <TouchableOpacity onPress={() => setMode('forgot')} style={styles.forgotBtn}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              )}

              {/* Primary Action Button */}
              <TouchableOpacity onPress={handleAuth} disabled={loading} style={styles.actionBtn}>
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.btnText}>
                    {mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Send Reset Link' : 'Sign In'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Toggle Mode Footer */}
              <View style={styles.toggleRow}>
                {mode === 'signin' ? (
                  <Text style={styles.toggleSub}>
                    Don't have an account?{' '}
                    <Text style={styles.toggleLink} onPress={() => setMode('signup')}>
                      Sign Up
                    </Text>
                  </Text>
                ) : (
                  <Text style={styles.toggleSub}>
                    Already have an account?{' '}
                    <Text style={styles.toggleLink} onPress={() => setMode('signin')}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
    marginBottom: 20,
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
