import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ActivityIndicator } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) setErrorMsg(error.message);
        else {
          setSuccessMsg('Account created successfully!');
          if (data.session?.user) setUser(data.session.user);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setErrorMsg(error.message);
        else {
          setSuccessMsg('Signed in successfully!');
          setUser(data.user);
          setTimeout(onClose, 1000);
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
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="sparkles" size={22} color="#e50914" />
            </View>
            <Text style={styles.title}>
              {user ? 'Account Settings' : isSignUp ? 'Create AuraFlex Account' : 'Welcome Back'}
            </Text>
            <Text style={styles.subtitle}>
              {user
                ? 'Manage cloud watchlists & cross-device sync'
                : 'Sync watch history and watchlist across all devices'}
            </Text>
          </View>

          {errorMsg ? <Text style={styles.errorAlert}>{errorMsg}</Text> : null}
          {successMsg ? <Text style={styles.successAlert}>{successMsg}</Text> : null}

          {user ? (
            <View style={styles.loggedInView}>
              <View style={styles.userInfoBox}>
                <Text style={styles.userLabel}>SIGNED IN AS</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
              <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
                {loading ? <ActivityIndicator color="#ef4444" /> : <Text style={styles.signOutText}>Sign Out</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  placeholderTextColor="#6b7280"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#6b7280"
                  secureTextEntry
                  style={styles.input}
                />
              </View>

              <TouchableOpacity onPress={handleAuth} disabled={loading} style={styles.submitBtn}>
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitText}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.toggleBtn}>
                <Text style={styles.toggleText}>
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </Text>
              </TouchableOpacity>

              <Text style={styles.noteText}>* Local device storage fallback active for offline mode.</Text>
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
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#18181f',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  errorAlert: {
    color: '#f87171',
    backgroundColor: 'rgba(239,68,68,0.1)',
    padding: 10,
    borderRadius: 8,
    fontSize: 11,
    marginBottom: 10,
    textAlign: 'center',
  },
  successAlert: {
    color: '#34d399',
    backgroundColor: 'rgba(52,211,153,0.1)',
    padding: 10,
    borderRadius: 8,
    fontSize: 11,
    marginBottom: 10,
    textAlign: 'center',
  },
  loggedInView: {
    gap: 12,
  },
  userInfoBox: {
    backgroundColor: '#0f0f12',
    padding: 12,
    borderRadius: 10,
  },
  userLabel: {
    color: '#9ca3af',
    fontSize: 9,
    fontWeight: '700',
  },
  userEmail: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  signOutBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.15)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  signOutText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 13,
  },
  form: {
    gap: 12,
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    color: '#d1d5db',
    fontSize: 11,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0f0f12',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    fontSize: 13,
  },
  submitBtn: {
    backgroundColor: '#e50914',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  submitText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  toggleBtn: {
    alignItems: 'center',
    marginTop: 4,
  },
  toggleText: {
    color: '#9ca3af',
    fontSize: 11,
  },
  noteText: {
    color: '#6b7280',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 6,
  },
});
