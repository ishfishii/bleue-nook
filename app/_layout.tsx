import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import { useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { colors, fonts } from '../constants/theme';
import { StoreProvider } from '../context/store';

export default function RootLayout() {
  const { width } = useWindowDimensions();
  const isWide = width >= 768; // tablet and web: sidebar stays open

  const [loaded] = useFonts({
    // Put your Google Sans files in assets/fonts/
    GoogleSans: require('../assets/fonts/GoogleSans-Regular.ttf'),
    GoogleSansMedium: require('../assets/fonts/GoogleSans-Medium.ttf'),
  });

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StoreProvider>
        <StatusBar style="light" />
        <Drawer
          screenOptions={{
            drawerType: isWide ? 'permanent' : 'front',
            headerShown: !isWide, // phones get a header with the menu button
            headerStyle: { backgroundColor: colors.sidebar },
            headerTintColor: colors.text,
            headerTitleStyle: { fontFamily: fonts.medium },
            sceneStyle: { backgroundColor: colors.bg },
            drawerStyle: {
              width: 220,
              backgroundColor: colors.sidebar,
              borderRightWidth: 1,
              borderRightColor: colors.border,
            },
            drawerActiveTintColor: colors.teal,
            drawerInactiveTintColor: colors.muted,
            drawerActiveBackgroundColor: 'rgba(22,186,197,0.14)',
            drawerLabelStyle: { fontFamily: fonts.medium, fontSize: 14 },
            drawerItemStyle: { borderRadius: 8, marginHorizontal: 12 },
          }}
        >
          <Drawer.Screen
            name="index"
            options={{
              title: 'Home',
              drawerIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
            }}
          />
          <Drawer.Screen
            name="expenses"
            options={{
              title: 'Expenses',
              drawerIcon: ({ color, size }) => <Ionicons name="wallet-outline" color={color} size={size} />,
            }}
          />
          <Drawer.Screen
            name="inventory"
            options={{
              title: 'Inventory',
              drawerIcon: ({ color, size }) => <Ionicons name="cube-outline" color={color} size={size} />,
            }}
          />
          <Drawer.Screen
  name="categories"
  options={{
    drawerItemStyle: { display: 'none' }, // Hides it from the drawer menu
    title: 'Categories',                 // Header title if navigated to
  }}
/>
        </Drawer>
      </StoreProvider>
    </GestureHandlerRootView>
  );
}
