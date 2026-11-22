import type { NavigatorScreenParams } from '@react-navigation/native';
import { MemberRole } from '../types/models';

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  CreateJoinClub: undefined;
  ClubDetail: { clubId: string; clubName: string; role: MemberRole };
  OpenSession: { clubId: string; clubName: string };
  CheckIn: { clubId: string; clubName: string };
  ManualCheckIn: { clubId: string; clubName: string; sessionId: string; sessionTitle: string };
  Sessions: { clubId: string; clubName: string };
  SessionDetail: { clubId: string; clubName: string; sessionId: string };
  BleLabTest: undefined;
};
