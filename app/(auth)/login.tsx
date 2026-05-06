import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    const { error } =
      mode === 'login'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);
    setLoading(false);
    if (error) {
      Alert.alert('Error', error);
    } else if (mode === 'signup') {
      Alert.alert('Welcome to Kyro! 🎉', 'Your account has been created.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Ambient glow background */}
      <View style={styles.glow1} />
      <View style={styles.glow2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <View style={styles.inner}>
          {/* Logo + Brand */}
          <View style={styles.brand}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>K</Text>
            </View>
            <Text style={styles.brandName}>Kyro</Text>
          </View>
          <Text style={styles.tagline}>Real-time answers. Premium intelligence.</Text>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, emailFocused && styles.inputFocused]}
                placeholder="you@domain.com"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.input, passFocused && styles.inputFocused]}
                placeholder="Min 6 characters"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
              />
            </View>

            <TouchableOpacity
              onPress={submit}
              disabled={loading}
              activeOpacity={0.85}
              style={styles.btnWrap}
            >
              <LinearGradient
                colors={['#ffffff', '#e0e0e0']}
                style={styles.btn}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.btnText}>
                    {mode === 'login' ? 'Sign in' : 'Create account'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
              style={styles.switchBtn}
            >
              <Text style={styles.switchText}>
                {mode === 'login'
                  ? "Don't have an account? "
                  : 'Already have an account? '}
                <Text style={styles.switchLink}>
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            By continuing, you agree to Kyro's Terms of Service
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  glow1: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(120,80,255,0.08)',
  },
  glow2: {
    position: 'absolute',
    bottom: -50,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0,180,255,0.06)',
  },
  kav: { flex: 1 },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -1,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 36,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  field: { marginBottom: 14 },
  label: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 6,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#fff',
    paddingHorizontal: 16,
    fontSize: 15,
  },
  inputFocused: {
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  btnWrap: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  btn: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.2,
  },
  switchBtn: {
    marginTop: 18,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
  },
  switchLink: {
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    marginTop: 28,
    textAlign: 'center',
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
  },
});
