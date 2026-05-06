# Kyro App — React Native (Expo)

Native Android/iOS app converted from your Lovable web project.

---

## 📱 Features
- Full Kyro AI chat — all models preserved
- Native sidebar with spring animations
- Mobile-optimized message bubbles with markdown
- Quick action chips, focus mode toggle
- Image attachment support
- Supabase auth (login / signup)
- Model picker bottom sheet
- Haptic feedback throughout
- Dark theme matching your web app

---

## 🚀 Build APK (Free — No computer needed!)

### Step 1: Upload to GitHub
1. Create a new GitHub repo (public or private)
2. Upload all these files to the repo

### Step 2: Use EAS Build (Cloud APK)
1. Go to **https://expo.dev** → Create free account
2. Install EAS CLI on any computer or use GitHub Codespaces:
   ```bash
   npm install -g eas-cli
   eas login
   ```
3. In the project folder:
   ```bash
   npm install
   eas build --platform android --profile preview
   ```
4. EAS builds in the cloud → gives you a **download link for the APK** ✅

### Alternative: Snack (instant preview)
- Go to **https://snack.expo.dev**
- Upload files to see a live preview (no APK but instant test)

---

## 🔧 Local Setup (if you have a computer)
```bash
npm install
npx expo start
```
Scan QR code with **Expo Go** app on your phone.

---

## 📁 Project Structure
```
kyro-app/
├── app/
│   ├── _layout.tsx          # Root layout + auth guard
│   ├── index.tsx            # Redirect
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   └── login.tsx        # Login/Signup screen
│   └── (app)/
│       ├── _layout.tsx
│       └── chat.tsx         # Main chat screen
├── components/
│   ├── ChatBar.tsx          # Input bar with quick actions
│   └── MessageBubble.tsx    # Message rendering
├── contexts/
│   └── AuthContext.tsx      # Supabase auth
├── lib/
│   ├── supabase.ts          # Supabase client (uses AsyncStorage)
│   └── models.ts            # All Kyro models
├── app.json                 # Expo config
├── eas.json                 # Build profiles
└── .env                     # Your Supabase keys (already filled)
```

---

## ⚙️ Environment Variables
Already configured in `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://dlowzbqvorqcqmmihxyk.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## 🎨 UI Changes from Web → App
| Web | App |
|-----|-----|
| Slide-over sidebar | Native animated drawer with spring |
| Dropdown model picker | Bottom sheet modal |
| Browser localStorage | AsyncStorage (persistent) |
| framer-motion | React Native Animated |
| ReactMarkdown | react-native-markdown-display |
| HTML form | Native TextInput + TouchableOpacity |
| Mouse hover states | Haptic feedback on tap |

---

## 📦 APK Build Profile
`eas.json` has a `preview` profile that outputs a direct `.apk` file 
(not AAB) — ready to install on any Android device.
