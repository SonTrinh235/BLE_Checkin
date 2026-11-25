import { useEffect, useMemo, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../auth/AuthContext';
import { MainTabParamList, RootStackParamList } from './types';
import WelcomeScreen from '../screens/WelcomeScreen';
import ManualCheckInScreen from '../screens/ManualCheckInScreen';
import SessionsScreen from '../screens/SessionsScreen';
import SessionDetailScreen from '../screens/SessionDetailScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CreateJoinClubScreen from '../screens/CreateJoinClubScreen';
import ClubDetailScreen from '../screens/ClubDetailScreen';
import OpenSessionScreen from '../screens/OpenSessionScreen';
import CheckInScreen from '../screens/CheckInScreen';
import BleLabTestScreen from '../screens/BleLabTestScreen';
import type { IconName } from '../components/Icon';
import { Loading } from '../components/ui';
import BubbleTabBar from '../components/BubbleTabBar';
import { useTheme } from '../theme/useTheme';
import OnboardingScreen from '../screens/OnboardingScreen';
import { isOnboardingDone, markOnboardingDone } from '../data/onboarding';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const tabs: { name: keyof MainTabParamList; title: string; icon: IconName; component: React.ComponentType<any> }[] = [
  { name: 'Home', title: 'Trang chủ', icon: 'bluetooth', component: HomeScreen },
  { name: 'History', title: 'Lịch sử', icon: 'clock', component: HistoryScreen },
  { name: 'Profile', title: 'Cá nhân', icon: 'user', component: ProfileScreen },
];

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BubbleTabBar {...props} tabs={tabs} />}
      screenOptions={{ headerShown: false, animation: 'fade' }}
    >
      {tabs.map((t) => (
        <Tab.Screen key={t.name} name={t.name} component={t.component} options={{ title: t.title }} />
      ))}
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, initializing } = useAuth();
  const { colors, isDark } = useTheme();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    isOnboardingDone().then(setOnboarded);
  }, []);

  const navTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.link,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [colors, isDark]);

  if (initializing || onboarded === null) return <Loading />;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="CreateJoinClub"
              component={CreateJoinClubScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen name="ClubDetail" component={ClubDetailScreen} />
            <Stack.Screen name="OpenSession" component={OpenSessionScreen} />
            <Stack.Screen name="CheckIn" component={CheckInScreen} />
            <Stack.Screen name="ManualCheckIn" component={ManualCheckInScreen} />
            <Stack.Screen name="Sessions" component={SessionsScreen} />
            <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
            <Stack.Screen
              name="BleLabTest"
              component={BleLabTestScreen}
              options={{ headerShown: true, title: 'BLE lab test' }}
            />
          </>
        ) : (
          <>
            {!onboarded ? (
              <Stack.Screen name="Onboarding">
                {() => (
                  <OnboardingScreen
                    onDone={() => {
                      void markOnboardingDone();
                      setOnboarded(true);
                    }}
                  />
                )}
              </Stack.Screen>
            ) : null}
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
