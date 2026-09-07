# Focus Track Android APK Download Directory

Place your compiled `FocusTrack-Android.apk` in this folder:
`public/downloads/FocusTrack-Android.apk`

When building with Vite (`npm run build`), all contents in `public/` are automatically copied to `dist/downloads/`. 

When deployed to Vercel, users will be able to download the Android APK directly from:
`https://your-vercel-domain.vercel.app/downloads/FocusTrack-Android.apk`

## How to build the native Android APK using Expo / EAS:
1. Navigate to the `/mobile` directory:
   ```bash
   cd mobile
   ```
2. Build the Android release APK using EAS Build:
   ```bash
   npx eas-cli build -p android --profile production
   ```
3. Copy the generated APK to `public/downloads/FocusTrack-Android.apk`.
4. Deploy to Vercel:
   ```bash
   vercel --prod
   ```
