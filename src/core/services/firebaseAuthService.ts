import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { Alert } from 'react-native';

import { clearToken, saveToken } from '../storage/tokenStorage';
import { AuthToken, Profile } from '../types/auth';

/**
 * Firebase Auth implementation.
 *
 * This replaces REST calls like:
 *  - POST auth/register/
 *  - POST auth/login/
 *  - GET  auth/me/
 */
export class FirebaseAuthService {
  async register(
    email: string,
    password: string,
    fullName?: string
  ): Promise<void> {
    // fullName is not used in Firebase Auth directly.
    await auth().createUserWithEmailAndPassword(email, password);

    // Keep behavior aligned with current UI:
    // After register, user should log in.
    // So we intentionally do NOT set app state to signed_in here.
    // (The app navigates to SignIn.)
    // You can store fullName in Firestore/RTDB if you have that.
    void fullName;
  }

  async login(email: string, password: string): Promise<AuthToken> {
    const cred = await auth().signInWithEmailAndPassword(email, password);

    const token = await cred.user.getIdToken();
    await saveToken(token);

    return { token };
  }

  async logout(): Promise<void> {
    await auth().signOut();
    await clearToken();
  }

  async getProfile(): Promise<Profile> {
    const user = auth().currentUser;
    if (!user) {
      throw new Error('Not authenticated');
    }

    // If you have additional profile fields (full_name, avatar_url, id),
    // fetch them from Firestore/RTDB here.
    // For now, we map Firebase user to the existing Profile type.
    const email = user.email || '';

    return {
      id: 0,
      email,
    };
  }
}

export const firebaseAuthService = new FirebaseAuthService();

