import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(), provideFirebaseApp(() => initializeApp({ projectId: "proyecto-hosteleria-b6c98", appId: "1:417196647606:web:cdea1f5282ee5557287217", databaseURL: "https://proyecto-hosteleria-b6c98-default-rtdb.firebaseio.com", storageBucket: "proyecto-hosteleria-b6c98.firebasestorage.app", apiKey: "AIzaSyBLQZKJWtYpeeRo4c1xKhqz59bZlKLpei8", authDomain: "proyecto-hosteleria-b6c98.firebaseapp.com", messagingSenderId: "417196647606" })), provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ]
};
