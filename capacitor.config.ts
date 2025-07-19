
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.obramaestra.app', // Puedes cambiar esto
  appName: 'ObraMaestra',      // Puedes cambiar esto
  webDir: 'dist',             // Asegúrate que coincida con tu carpeta de build (ej. 'build' o 'dist')
  server: {
    androidScheme: 'http', // Común para desarrollo local y WebViews
    // hostname: 'localhost:3000', // Descomenta y ajusta si usas un servidor de desarrollo en vivo durante 'npx cap run android -l --external'
    // cleartext: true, // Necesario si tu servidor de desarrollo en vivo es http
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#000000", // Coincide con tu fondo negro
      androidSplashResourceName: "splash", // Necesitarás crear recursos de splash screen en el proyecto Android
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#7FFFD4", // Tu color aguamarina
    }
  }
};

export default config;
