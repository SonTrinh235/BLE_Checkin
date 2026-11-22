import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import Icon, { IconName } from '../components/Icon';
import { Loading } from '../components/ui';
import { colors, typography } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

const tabs: { name: keyof MainTabParamList; title: string; icon: IconName; component: React.ComponentType<any> }[] = [
  { name: 'Home', title: 'Trang chủ', icon: 'bluetooth', component: HomeScreen },
  { name: 'History', title: 'Lịch sử', icon: 'clock', component: HistoryScreen },
  { name: 'Profile', title: 'Cá nhân', icon: 'user', component: ProfileScreen },
];

function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { ...typography.caption, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 6,
        },
      }}
    >
      {tabs.map((t) => (
        <Tab.Screen
          key={t.name}
          name={t.name}
          component={t.component}
          options={{
            title: t.title,
            tabBarIcon: ({ color, size }) => <Icon name={t.icon} size={size} color={color} />,
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, initializing } = useAuth();

  if (initializing) return <Loading />;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="CreateJoinClub" component={CreateJoinClubScreen} />
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
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
