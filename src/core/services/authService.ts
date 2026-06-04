import { AuthToken, Profile } from '../types/auth';
import { firebaseAuthService } from './firebaseAuthService';

// For this app's auth flow, we now use Firebase Auth directly.
// This replaces REST calls: auth/register/, auth/login/, auth/me/
export class AuthService {
  async login(email: string, password: string): Promise<AuthToken> {
    return firebaseAuthService.login(email, password);
  }

  async register(email: string, password: string, fullName?: string): Promise<void> {
    await firebaseAuthService.register(email, password, fullName);
  }

  async logout(): Promise<void> {
    await firebaseAuthService.logout();
  }

  async getProfile(): Promise<Profile> {
    return firebaseAuthService.getProfile();
  }
}

export const authService = new AuthService();


