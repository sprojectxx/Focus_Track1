# Focus Track Android APK Download Directory

Place your compiled `FocusTrack-Android.apk` in this folder:
`public/downloads/FocusTrack-Android.apk`

When building with Vite (`npm run build`), all contents in `public/` are automatically copied to `dist/downloads/`. 

When deployed to Vercel, users will be able to download the Android APK directly from:
`https://your-vercel-domain.vercel.app/downloads/FocusTrack-Android.apk`

## How to build the APK using Capacitor:
1. Ensure Android Studio and Android SDK are installed.
2. Run build & sync:
   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   ```
3. In Android Studio:
   - Select **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**
   - Copy the generated `app-debug.apk` or `app-release.apk` to `public/downloads/FocusTrack-Android.apk`.
4. Deploy to Vercel:
   ```bash
   vercel --prod
   ```
