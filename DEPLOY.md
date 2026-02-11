# Publishing the client (Expo app)

Two ways to get your app in front of users: **web** (share a link) or **mobile** (installable app).

---

## Option 1: Web (easiest – share a link)

Build the app for web and deploy to **Vercel**. Anyone can open the URL in a browser.

### One-time setup

1. **Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in with GitHub.
   - **Add New** → **Project** → import your **client** repo.

2. **Project settings**
   - **Root Directory:** `client` (if the repo is the whole Live-Auction repo) or leave empty if the repo is client-only.
   - **Framework Preset:** Other (or Expo if listed).
   - **Build Command:** `npx expo export -p web`
   - **Output Directory:** `dist`
   - **Install Command:** `npm ci`

3. **Environment variables** (Vercel → Project → Settings → Environment Variables)

   | Name                     | Value                                      |
   | ------------------------ | ------------------------------------------ |
   | `EXPO_PUBLIC_API_URL`    | `https://live-auction-server.onrender.com` |
   | `EXPO_PUBLIC_SOCKET_URL` | `https://live-auction-server.onrender.com` |

4. **Deploy**
   - Push to the connected branch, or **Deploy** from the Vercel dashboard.
   - Your app will be at `https://your-project.vercel.app` (or your custom domain).

### CORS on the server

On Render, set **CORS_ORIGIN** to your Vercel URL (e.g. `https://your-project.vercel.app`). No trailing slash.

---

## Option 2: Mobile (installable app)

Use **EAS Build** to produce an Android APK or iOS build, then share the build link so testers can install.

### One-time setup

1. **EAS CLI**

   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Backend URL in EAS**
   - In `client/eas.json`, `preview` and `production` already point to `https://live-auction-server.onrender.com`.
   - Or in [expo.dev](https://expo.dev) → your project → **Builds** → **Secrets**, add:
     - `EXPO_PUBLIC_API_URL` = `https://live-auction-server.onrender.com`
     - `EXPO_PUBLIC_SOCKET_URL` = `https://live-auction-server.onrender.com`

### Build and share

**Android (APK – easy to share):**

```bash
cd client
eas build -p android --profile preview
```

When the build finishes, EAS shows a link. Share that link; testers download and install the APK.

**iOS (TestFlight or internal):**

```bash
eas build -p ios --profile preview
```

Upload to TestFlight from the EAS dashboard, then invite testers.

**Production profile** (when you’re ready for store builds):

```bash
eas build -p android --profile production
eas build -p ios --profile production
```

---

## Summary

| Goal                         | What to do                                                                        |
| ---------------------------- | --------------------------------------------------------------------------------- |
| **Share a link for browser** | Deploy to Vercel (Option 1).                                                      |
| **Share an Android app**     | Run `eas build -p android --profile preview` and share the build link (Option 2). |
| **Share an iOS app**         | Run `eas build -p ios --profile preview`, then use TestFlight (Option 2).         |

Ensure **CORS_ORIGIN** on Render includes your client’s URL (Vercel domain and/or your app’s domain).
