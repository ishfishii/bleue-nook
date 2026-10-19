import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useSegments, useRootNavigationState } from 'expo-router';
import { fonts } from '../constants/theme';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

// Custom Drawer Content with Brand Header, Theme Toggle, & Clean Navigation Links
function CustomDrawerContent(props: any) {
  const { colors, mode, toggleTheme } = useTheme();
  const currentRouteName = props.state.routeNames[props.state.index];
  
  // REQUIRED: State and effect to load the logged-in user from storage
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to load user session', e);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      router.replace('/login');
    } catch (e) {
      console.error('Failed to log out', e);
    }
  };

  const menuItems = [
    { name: 'index', title: 'Home', icon: 'home-outline' },
    { name: 'expenses', title: 'Expenses', icon: 'wallet-outline' },
    { name: 'inventory', title: 'Inventory', icon: 'cube-outline' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.sidebar, justifyContent: 'space-between' }}>
      <View>
        {/* Top Brand Header & Theme Toggle */}
        <View style={[styles.headerContainer, { borderBottomColor: colors.border }]}>
          <Text style={[styles.brandTitle, { color: colors.text }]}>Bleue Nook</Text>
          <Pressable
            onPress={toggleTheme}
            style={[styles.themeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            hitSlop={8}
          >
            <Ionicons
              name={mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
              size={18}
              color={colors.teal}
            />
          </Pressable>
        </View>

        {/* Navigation Links */}
        <ScrollView contentContainerStyle={{ paddingHorizontal: 12, gap: 4 }}>
          {menuItems.map((item) => {
            const isActive = currentRouteName === item.name;
            return (
              <Pressable
                key={item.name}
                onPress={() => props.navigation.navigate(item.name)}
                style={[
                  styles.drawerItem,
                  isActive && { backgroundColor: 'rgba(22,186,197,0.14)' },
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={isActive ? colors.teal : colors.muted}
                />
                <Text
                  style={[
                    styles.drawerLabel,
                    { color: isActive ? colors.teal : colors.muted, fontFamily: fonts.medium },
                  ]}
                >
                  {item.title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Bottom User Info & Logout Footer */}
      <View style={[styles.userFooter, { borderTopColor: colors.border }]}>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text, fontFamily: fonts.medium }]} numberOfLines={1}>
            {user?.name || 'User Account'}
          </Text>
          <Text style={[styles.userEmail, { color: colors.muted }]} numberOfLines={1}>
            {user?.email || 'Connected'}
          </Text>
        </View>

        <Pressable 
          style={[styles.logoutButton, { backgroundColor: mode === 'dark' ? 'rgba(229,57,53,0.15)' : '#fdf2f2' }]} 
          onPress={handleLogout}
          hitSlop={8}
        >
          <Ionicons name="log-out-outline" size={16} color="#e53935" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}

function useAuthGate() {
  const segments = useSegments();
  const navState = useRootNavigationState();
  const [checked, setChecked] = useState(false);
  const onLogin = segments[0] === 'login';

  useEffect(() => {
    if (!navState?.key) return; // navigator not mounted yet
    (async () => {
      let authed = false;
      try {
        const stored = await AsyncStorage.getItem('user');
        authed = !!stored && !!JSON.parse(stored).token;
      } catch {
        authed = false; // corrupt or unreadable session counts as logged out
      }
      if (!authed && !onLogin) router.replace('/login');
      else if (authed && onLogin) router.replace('/');
      setChecked(true);
    })();
  }, [onLogin, navState?.key]);

  return { checked, onLogin };
}

function DrawerNavigator() {
  const { width } = useWindowDimensions();
  const { colors, mode } = useTheme();
  const { checked, onLogin } = useAuthGate();
  const isWide = width >= 768 && !onLogin; // tablet and web: sidebar stays open, except on login

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          drawerType: isWide ? 'permanent' : 'front',
          swipeEnabled: !onLogin,
          headerShown: !isWide && !onLogin, // phones get a header with the menu button
          headerStyle: { backgroundColor: colors.sidebar },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fonts.medium },
          sceneStyle: { backgroundColor: colors.bg },
          drawerStyle: {
            width: 240,
            backgroundColor: colors.sidebar,
            borderRightWidth: 1,
            borderRightColor: colors.border,
          },
        }}
      >
        <Drawer.Screen name="index" options={{ title: 'Home' }} />
        <Drawer.Screen name="expenses" options={{ title: 'Expenses' }} />
        <Drawer.Screen name="inventory" options={{ title: 'Inventory' }} />
        <Drawer.Screen name="login" options={{ drawerItemStyle: { display: 'none' }, headerShown: false }} />
        <Drawer.Screen name="expense-settings" options={{ drawerItemStyle: { display: 'none' }, title: 'Expense Categories' }} />
        <Drawer.Screen name="inventory-categories" options={{ drawerItemStyle: { display: 'none' }, title: 'Inventory Categories' }} />
      </Drawer>
      {!checked && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} />
      )}
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    GoogleSans: require('../assets/fonts/GoogleSans-Regular.ttf'),
    GoogleSansMedium: require('../assets/fonts/GoogleSans-Medium.ttf'),
  });

  if (!loaded) return null;

  return (
    <ThemeProvider>
      <DrawerNavigator />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  brandTitle: {
    fontFamily: fonts.medium,
    fontSize: 18,
    letterSpacing: 0.3,
  },
  themeBtn: {
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  drawerLabel: {
    fontSize: 14,
  },
  userFooter: {
    padding: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  userInfo: {
    gap: 2,
  },
  userName: {
    fontSize: 13,
  },
  userEmail: {
    fontSize: 11,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e53935',
  },
});