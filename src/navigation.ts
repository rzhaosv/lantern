import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  Paywall: { fromOnboarding?: boolean } | undefined;
  Settings: undefined;
  /** `day` defaults to the current day; `step` is a demo/deep-link starting step. */
  Daily: { day?: number; step?: number; reveal?: boolean } | undefined;
  Journey: undefined;
  LetGo: undefined;
  About: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
