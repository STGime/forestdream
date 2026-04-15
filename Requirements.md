# Requirements Document

## 1. Application Overview

- **App Name:** ForestDream
- **Description:** A mobile sleep-aid application that generates relaxing forest soundscapes to help users fall and stay asleep. The app listens passively during the night, detects sleep disturbances such as snoring, and responds with soothing sounds. It tracks sleep duration and evaluates which sound patterns are most effective, offering a global leaderboard and social sharing. A premium tier unlocks additional sound themes, advanced statistics, full sleep history, and custom sound mixing.

---

## 2. Users & Use Cases

### 2.1 Target Users

- Adults experiencing difficulty sleeping or seeking improved sleep quality
- Users interested in tracking and optimising their sleep patterns
- Users who want to share sleep progress with others

### 2.2 Core Use Cases

- A user selects a forest theme, starts a sleep session, and the app plays ambient sounds while monitoring for disturbances
- A user reviews their sleep history and sees which sound patterns correlated with longer, better-quality sleep
- A user checks the global leaderboard to discover the most effective sound themes used by the community
- A user shares a sleep milestone to social media
- A premium user creates a custom sound mix and accesses detailed sleep statistics

---

## 3. Page Structure & Feature Description

### 3.1 Overall Structure

```
ForestDream
├── Onboarding
│   ├── Welcome & Permissions (microphone)
│   └── Alias Setup
├── Home
│   ├── Theme Selection
│   └── Start Sleep Session
├── Sleep Session (Active)
│   ├── Sound Playback
│   ├── Passive Listening / Disturbance Detection
│   └── Session End & Summary
├── Sleep Tracker
│   ├── Sleep History
│   └── Pattern Analysis
├── Leaderboard
│   └── Global Sound & Pattern Rankings
├── Social Sharing
├── Premium
│   ├── Upgrade Screen
│   └── Custom Sound Mixing
└── Profile & Settings
    ├── Alias Management
    ├── Subscription Status
    └── Privacy & Permissions
```

### 3.2 Onboarding

- **Welcome & Permissions**
  - On first launch, the app presents a brief introduction to its core features
  - Users are prompted to grant microphone permission with a clear, plain-language privacy notice stating that all audio is processed entirely on-device and never uploaded or stored externally
  - Microphone permission can be granted or declined; core playback functions remain available without microphone access, but disturbance detection will be unavailable
- **Alias Setup**
  - Users are assigned a randomly generated alias (e.g., SleepyOwl42) for use on the leaderboard and in sharing
  - Users may customise their alias within the app at any time
  - No real name or personally identifiable information is required or displayed publicly

### 3.3 Home

- Displays available forest themes as selectable cards:
  - Free tier: Rainforest, Mediterranean, Nordic (minimum set; additional themes in premium)
  - Premium tier: additional themes (e.g., Tropical Storm, Alpine Meadow, Coastal Fog, etc.)
- Each theme card shows a name, brief description, and a short preview of its soundscape
- A prominent Start Sleep Session button initiates the active session with the selected theme
- Current subscription status (Free / Premium) is visible

### 3.4 Sleep Session (Active)

- **Sound Playback**
  - Plays the selected theme's ambient soundscape (e.g., nocturnal birds, light rain, wind through trees)
  - Sounds are looped seamlessly for the duration of the session
  - Volume is adjustable within the session
  - The screen dims automatically after session start to conserve battery; the app continues running in the background
- **Passive Listening & Disturbance Detection**
  - With microphone permission granted, the app listens passively throughout the night using on-device audio analysis
  - When a disturbance is detected (e.g., snoring, restless movement sounds), the app responds by introducing or intensifying a soothing sound layer (e.g., gentle rain, soft wind) to encourage return to sleep
  - No audio is recorded, stored, or transmitted; all processing is local and ephemeral
  - If microphone permission was not granted, this feature is disabled and the app plays sounds continuously without adaptive response
- **Session End & Summary**
  - The session ends when the user manually stops it or at a user-set alarm time
  - A summary screen displays: total session duration, number of detected disturbances, sound theme used, and a simple sleep quality indicator
  - Data is saved to the sleep history

### 3.5 Sleep Tracker

- **Sleep History**
  - Displays a chronological log of past sleep sessions
  - Each entry shows: date, session duration, theme used, disturbance count, and sleep quality indicator
  - Free tier: access to the last 7 days of history
  - Premium tier: full unlimited history
- **Pattern Analysis**
  - Analyses historical in-app session data to identify which sound themes and patterns correlate with longer sleep duration and fewer disturbances
  - Presents findings as simple visual summaries (e.g., bar charts, trend lines) with plain-language insights (e.g., \"You sleep 28 minutes longer on average with Nordic sounds\")
  - Premium tier: access to advanced statistics including weekly/monthly trend breakdowns and cross-variable analysis

### 3.6 Leaderboard

- Global public leaderboard showing aggregated, anonymised community data
- Rankings include:
  - Most-used sound themes (by number of sessions)
  - Highest-rated sound patterns (by average sleep quality improvement)
  - Top sleep duration improvement streaks
- All entries display the user's alias only; no personally identifiable information is shown
- Users can see their own rank highlighted within the leaderboard

### 3.7 Social Sharing

- Users can share sleep milestones and progress via the native device share sheet (iOS / Android)
- Pre-formatted share messages are generated automatically, for example:
  - \"I slept 30 minutes longer last night with my Rainforest sounds! #ForestDream\"
  - \"7-night streak with Nordic sounds — my best sleep week yet! #ForestDream\"
- Users may edit the message before sharing
- Sharing uses the user's alias, not their real name
- Supported destinations: any app available via the native share sheet (e.g., WhatsApp, Instagram, X, Messages)

### 3.8 Premium

- **Upgrade Screen**
  - Displays a comparison of Free vs Premium features
  - Supports in-app purchase via App Store (iOS) and Google Play (Android)
  - Subscription options: monthly and annual
- **Custom Sound Mixing (Premium only)**
  - Tagline: Create your perfect soundscape by mixing individual elements with custom volumes
  - Users can create a custom soundscape by combining multiple individual sound elements (e.g., rain + owl calls + distant thunder)
  - Each element has an independent volume slider
  - Custom mixes can be saved, named, and selected as a theme for future sessions
  - Saved custom mixes appear alongside standard themes on the Home screen
  - Premium users may save up to 10 custom mixes

### 3.9 Profile & Settings

- **Alias Management:** view and edit the user's public alias
- **Subscription Status:** current plan, renewal date, and link to manage subscription
- **Privacy & Permissions:** view and modify microphone permission; reiterate the on-device processing privacy notice
- **Notification Settings:** optional bedtime reminder notifications

---

## 4. Business Rules & Logic

1. **Microphone permission gate:** Disturbance detection and adaptive sound response are only active when microphone permission has been explicitly granted. The app must not attempt to access the microphone without permission.
2. **On-device audio processing:** All microphone input is analysed in real time on the device. No audio data is buffered beyond the immediate detection window, recorded, or transmitted.
3. **Alias uniqueness:** Aliases must be unique within the system. If a user-chosen alias is already taken, the app prompts the user to choose another or generates an alternative suggestion.
4. **Free vs Premium access control:**
  - Free: 3 core themes, 7-day sleep history, basic pattern analysis, leaderboard view, social sharing
  - Premium: all themes including additional ones, unlimited history, advanced statistics, custom sound mixing (up to 10 saved mixes)
5. **Leaderboard data:** Leaderboard rankings are computed from aggregated session data across all users. Individual user data is never exposed; only the alias and aggregated metric are shown.
6. **Session data persistence:** Session summaries are stored in the backend database to support history, pattern analysis, and leaderboard computation.
7. **Custom mix limit:** Free users cannot access custom sound mixing. Premium users may save up to 10 custom mixes.
8. **In-app purchase validation:** Subscription status is validated against the App Store / Google Play receipt on each app launch and session start.

---

## 5. Exceptions & Edge Cases

| Scenario | Handling |
| --- | --- |
| Microphone permission denied at onboarding | Disturbance detection disabled; app plays sounds continuously; user can re-enable in Settings at any time |
| Session interrupted by phone call or system alert | Session is paused; user is prompted to resume or end the session on return to the app |
| Device runs out of storage for session data | Oldest session records beyond the retention limit are pruned; user is notified |
| User attempts to use a taken alias | Inline error shown with a suggestion for an alternative alias |
| Premium subscription lapses | User is downgraded to Free tier; custom mixes are preserved but not playable until premium is restored; history beyond 7 days is preserved but not visible until premium is restored |
| No disturbances detected during a session | Session summary shows zero disturbances; pattern analysis treats this as a positive signal |
| App is force-closed during an active session | Session is ended; partial data up to the point of closure is saved as a session record |

---

## 6. Acceptance Criteria

1. A user can select a forest theme and start a sleep session; ambient sounds play seamlessly in the background with the screen dimmed.
2. With microphone permission granted, the app detects a simulated snoring sound during a session and responds within 5 seconds by introducing or intensifying a soothing sound layer.
3. No audio data is stored, transmitted, or accessible outside the device at any point during or after a session.
4. Sleep session data is saved and visible in Sleep History immediately after a session ends.
5. Pattern analysis correctly identifies and displays the theme associated with the highest average sleep duration across a user's session history.
6. The global leaderboard displays only aliases and aggregated metrics; no real names or identifiable data are visible.
7. A user can share a pre-formatted sleep milestone message via the native share sheet.
8. A premium user can create a custom sound mix with at least two elements, adjust individual volumes, save the mix with a custom name, and select it for a sleep session.
9. Saved custom mixes appear alongside standard themes on the Home screen for premium users.
10. Downgrading from premium to free correctly restricts access to premium features while preserving underlying data.
11. All onboarding permission prompts include a plain-language privacy notice confirming on-device processing.

---

## 7. Out of Scope for This Release

- Advertisement or ad-supported tier (the app is ad-free across all tiers)
- Integration with Apple Health, Google Fit, Health Connect, or any device health platform
- Social graph features (following other users, friend comparisons)
- Web or desktop versions of the application
- Wearable integrations
- AI-generated or dynamically composed soundscapes (all sounds are pre-recorded assets; for the first release assets are created with AI but are not dynamic; dynamic AI sound generation is planned for a future version)
- In-app audio recording or playback of the user's own sleep sounds
- Multi-language localisation
- Offline mode for premium content (all premium themes require an active connection for initial download)