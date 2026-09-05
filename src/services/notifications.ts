import { Platform } from 'react-native';
import { parseTime } from '../logic';

/**
 * One optional local notification a day: "Your 7 minutes are ready" at the user's chosen time.
 * expo-notifications is native-only; everything is guarded so the web bundle (used for smoke
 * tests) never touches it.
 */

function native() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

async function mod() {
  if (!native()) return null;
  try {
    const m = await import('expo-notifications');
    return m;
  } catch {
    return null;
  }
}

let handlerSet = false;
export async function setupNotificationHandler() {
  const N = await mod();
  if (!N || handlerSet) return;
  handlerSet = true;
  try {
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch {
    /* ignore */
  }
}

/** Ask for permission. Only call when the user explicitly enables reminders. */
export async function requestPermission(): Promise<boolean> {
  const N = await mod();
  if (!N) return false;
  try {
    const cur = await N.getPermissionsAsync();
    if (cur.granted) return true;
    const res = await N.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });
    return res.granted;
  } catch {
    return false;
  }
}

export async function cancelAll() {
  const N = await mod();
  if (!N) return;
  try {
    await N.cancelAllScheduledNotificationsAsync();
  } catch {
    /* ignore */
  }
}

/** (Re)schedule the single daily reminder. */
export async function scheduleDaily(hhmm: string) {
  const N = await mod();
  if (!N) return;
  await cancelAll();
  const { hour, minute } = parseTime(hhmm);
  try {
    await N.scheduleNotificationAsync({
      identifier: 'daily-light',
      content: {
        title: 'Your 7 minutes are ready',
        body: 'One breath, one story, one small thing. The lamp is waiting.',
        sound: false,
      },
      trigger: { type: N.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
  } catch {
    /* best-effort */
  }
}
