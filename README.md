# Lantern: Find What's Missing

Lantern is a fully local iOS app for people who feel that something is missing and cannot name it: brain fog, low
mood, numbness, restlessness, feeling stuck. It offers a **seven-minute daily ritual** over 21 days: a minute of
stillness, one story, one small practice, one reflection prompt, and a single line to carry through the day. A
code-drawn lantern on Home grows brighter with every day completed. There is no login and no network traffic except
RevenueCat.

## Content and ethics note

The 21 stories are retold from the Bible's parables, psalms and teachings (the lost sheep, the sower, the good
neighbour, Psalm 23, the son who came home, and so on), in plain modern language with no verse references and no
church vocabulary. **Lantern does not lead with this.** By design, no screen shown before Day 7 (onboarding, Home,
the daily flow, paywall, notifications) uses words such as God, Jesus, Bible, scripture, church, prayer, sin, faith,
Lord, verse, Christian or holy. Reflection prompts go no further than "address it to whoever you believe is
listening."

The source is disclosed:

- on **Day 7**, after the anchor, in a warm "Where the light comes from" card (with an optional toggle that turns on
  a muted source footnote under each story, still without verse numbers);
- always, in **Settings → About the stories**, which shows the same text plus the full list of 21 sources when
  footnotes are on;
- in the **App Store description**, which must state plainly that the stories are retold from the Bible.

Nobody is asked to believe anything to use the app, and the app never changes shape after the reveal.

## Screens

| screen | file | notes |
| --- | --- | --- |
| Onboarding | `src/screens/OnboardingScreen.tsx` | 5 steps: what feels off (multi), how long, what you have tried (multi), when you have 7 quiet minutes (slot + time), optional name + first lantern ("Day 1 is ready. It won't ask much of you."). Ends on the Paywall. |
| Paywall | `src/screens/PaywallScreen.tsx` | "Light one small lamp a day", 4 benefit rows, `$rc_annual` (7-day trial, best value) and `$rc_monthly` (7-day trial), "Start my 7-day free trial", Restore, Terms, Privacy, auto-renew disclosure. No Skip; a small "Just show me Day 1" link dismisses to Home. |
| Home | `src/screens/HomeScreen.tsx` | Lantern (flame stage from lamps lit), "Day N of 21 · title", status (Not started / In progress / Done), "Begin today's light" / "Revisit", "Day N is waiting" lock when not Pro, Fog check-in (5 faces, logs mood 1-5 with a one-line response), streak / lamps lit / stones tiles, Let go shortcut, Carry line card once today is done. Header links: Journey, Settings. |
| Daily Light | `src/screens/DailyScreen.tsx` | One screen, 5 steps with a progress bar: Stillness (60 s breathing circle, skippable after 20 s) → Story (serif, scrollable, optional source footnote after the reveal) → Practice ("I'll do this today") → Reflect (prompt + journal, saved) → Anchor ("Carry this" → warm glow, marks the day done, flame grows). Day 7 then shows the Reveal card. |
| Journey | `src/screens/JourneyScreen.tsx` | 21-day list with done / current / locked states, theme per day, completion dates; tap done days to reread. |
| Let go | `src/screens/LetGoScreen.tsx` | Three stones labelled from the day's `letGo` (hold to rename) over dark water; tap or drag down to drop with a ripple and a haptic. Ends with "Set down. Not solved — set down." and logs 3 stones. |
| Settings | `src/screens/SettingsScreen.tsx` | Name, reminder time + daily toggle ("Your 7 minutes are ready"), About the stories, Restore, Manage subscription, Privacy / Terms / Support, Reset. |
| About the stories | `src/screens/AboutScreen.tsx` | The reveal text, the source-footnote toggle, and the list of 21 sources. |

## Free vs Pro

Free: Day 1, the fog check-in and Let go. Pro (RevenueCat entitlement `pro`, packages `$rc_annual` and
`$rc_monthly` from `offerings.current`): Days 2-21. `EXPO_PUBLIC_DEV_UNLOCK=1` unlocks everything locally.

## Content

`src/content/days.ts` (split across `days1.ts`, `days2.ts`, `days3.ts`) holds the 21 typed days:
`{ day, title, theme, stillnessLine, story: { title, body, source }, practice: { title, body }, prompt, anchor, letGo }`.
Stories are 250-310 words. `source` is a hidden field only rendered as a footnote after the reveal. `FOG_CHECKINS`
holds 12 one-line check-in responses across the five moods.

| day | title | | day | title | | day | title |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The lamp under a bowl | | 8 | The two builders | | 15 | The pearl of great price |
| 2 | The lost sheep | | 9 | The talents | | 16 | The friend at midnight |
| 3 | The sower | | 10 | The persistent widow | | 17 | Known |
| 4 | The good neighbour | | 11 | Why so downcast | | 18 | The easy yoke |
| 5 | The quiet field | | 12 | The unforgiving servant | | 19 | The bridesmaids and the oil |
| 6 | The storm on the lake | | 13 | The birds and the lilies | | 20 | The vine and the branches |
| 7 | The son who came home (reveal) | | 14 | The mustard seed | | 21 | Do not be afraid |

## State model

Persisted as JSON in AsyncStorage under `lantern.state.v1` (`src/store/AppContext.tsx`, types in
`src/logic/types.ts`): `onboarded`, `startedAt`, `name`, `feelings[]`, `duration`, `tried[]`, `slot`,
`reminderTime` ("HH:MM"), `remindersEnabled`, `currentDay` (1-21), `completedDays {day: isoDate}`,
`journal {day: text}`, `practiceCommitted {day: bool}`, `moods[] {at, value}`, `stonesDropped`, `revealSeen`,
`showSources`, `longestStreak`.

Helpers in `src/logic/index.ts`: `flameStage(completed)` (0 unlit, 1 = 1-3, 2 = 4-7, 3 = 8-14, 4 = 15-21),
`streak(completedDays)`, `todayStatus(state)`, `nextDay(completedDays)`, `dayUnlocked`, `latestCompletedDay`.

## Notifications

`src/services/notifications.ts` asks permission only when the user turns the reminder on (Settings). It schedules
one daily local notification ("Your 7 minutes are ready") at the chosen time and reschedules when the time changes.
The module is imported lazily behind a `Platform` check so the web bundle never loads it.

## Demo hook (web only)

`src/dev/demo.ts` seeds localStorage before hydration when the web build is opened with `?demo=<name>`:
`home` (Day 9, flame stage 3, streak 8), `story` (Day 2 story step), `practice`, `anchor`, `journey` (days 1-8
done), `letgo`, `paywall`, `onboard` (`&step=4` for the last step), `reveal` (Day 7 reveal card). Add `&snap=1` to
freeze the flame flicker. On iOS/Android `demo` is always `null`.

## Environment variables

| var | purpose |
| --- | --- |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | RevenueCat public iOS SDK key. Without it billing is a no-op and only Day 1 is available. |
| `EXPO_PUBLIC_DEV_UNLOCK` | `1` / `true` unlocks all 21 days locally. |

## Development

```sh
npm install
npx tsc --noEmit
npx expo config --json
CI=1 npx expo start --web --port 8097   # smoke test; curl http://localhost:8097/
npx expo start                          # iOS simulator / device
python3 scripts/make_icons.py           # regenerate assets/*.png (needs Pillow)
eas init && eas build -p ios --profile production
```

Before the first EAS build: run `eas init` (adds `extra.eas.projectId`), set `EXPO_PUBLIC_REVENUECAT_IOS_KEY` and
`submit.production.ios.ascAppId` in `eas.json` (both are `TBD`). Bundle id `com.formaz.lantern`, Expo SDK 57, React
Native 0.86, React 19. Legal pages: `https://tryforma.app/lantern/terms.html` and
`https://tryforma.app/lantern/privacy.html`.
