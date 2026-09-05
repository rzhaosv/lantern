import { Platform } from 'react-native';

/** Best-effort haptics; no-op on web and when the module is unavailable. */
export async function tap(kind: 'light' | 'medium' | 'success' = 'light') {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
  try {
    const H = await import('expo-haptics');
    if (kind === 'success') await H.notificationAsync(H.NotificationFeedbackType.Success);
    else await H.impactAsync(kind === 'light' ? H.ImpactFeedbackStyle.Light : H.ImpactFeedbackStyle.Medium);
  } catch {
    /* ignore */
  }
}
