import React, { useEffect, useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { router } from 'expo-router';

import { fonts } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../constants/config';

WebBrowser.maybeCompleteAuthSession();

export default function LoginWeb() {
  const { colors } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri: AuthSession.makeRedirectUri({ path: 'login' }),
    selectAccount: true,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === 'error') {
      setError('Google sign-in failed. Try again.');
      return;
    }
    if (response.type !== 'success') return;

    (async () => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: response.params.id_token }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          await AsyncStorage.setItem('user', JSON.stringify({ ...data.user, token: data.token }));
          router.replace('/');
        } else {
          setError('Server rejected the login.');
        }
      } catch (e) {
        setError('Cannot reach the server. Is Tailscale on and the backend running?');
      } finally {
        setBusy(false);
      }
    })();
  }, [response]);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg }]}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.medium }]}>
          Welcome to Bleue Nook
        </Text>
        <Text style={{ color: colors.muted, marginBottom: 20 }}>Sign in to continue</Text>
        <Pressable
          disabled={!request || busy}
          onPress={() => promptAsync()}
          style={[styles.btn, { backgroundColor: colors.teal, opacity: request && !busy ? 1 : 0.5 }]}
        >
          <Text style={styles.btnText}>{busy ? 'Signing in...' : 'Continue with Google'}</Text>
        </Pressable>
        {error && <Text style={{ color: '#e53935', marginTop: 12, textAlign: 'center' }}>{error}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { width: 360, padding: 28, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  title: { fontSize: 22, marginBottom: 6 },
  btn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, width: '100%', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
});