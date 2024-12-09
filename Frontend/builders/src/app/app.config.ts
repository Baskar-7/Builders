import { ApplicationConfig,importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { authInterceptorInterceptor } from './interceptors/auth-interceptor.interceptor';
import { provideAuth,getAuth } from '@angular/fire/auth';
import { OAuthModule } from 'angular-oauth2-oidc'; 
const firebaseConfig = {
  apiKey: "AIzaSyBqcXaHWrO3VIt1tEFdFF_3iDneHVXtFjU",
  authDomain: "sgs-constructions.firebaseapp.com",
  projectId: "sgs-constructions",
  storageBucket: "sgs-constructions.appspot.com",
  messagingSenderId: "49569732555",
  appId: "1:49569732555:web:e3463e050079996d71484e",
  measurementId: "G-06X9RGP1G2"
}


export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(OAuthModule.forRoot()),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptorInterceptor])),
    provideFirebaseApp(() => initializeApp(firebaseConfig)), 
    provideAuth(() => getAuth())
  ]
};

