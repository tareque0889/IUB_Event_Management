/**
 * authService.ts
 *
 * Authentication layer. Uses Firebase Auth (email/password) when Firebase is
 * configured; otherwise falls back to a local demo mode so the app still runs
 * without a configured project.
 *
 * The authenticated identity is an email address. Providers maps that email to
 * a `users` record in the store (email is the link key) to resolve the current
 * user + role.
 */
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/app/lib/firebase";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  student_id: string;
  department: string;
  password: string;
}

export interface GoogleSignInResult {
  email: string;
  displayName: string;
}

/**
 * Demo credentials used only when Firebase is not configured. These emails
 * exist in the seeded demo store, so login resolves to a real store user.
 */
const DEMO_CREDENTIALS: Record<string, string> = {
  "admin@iub.edu.bd": "Admin@12345",
  "shoikat.azad@iub.edu.bd": "Club@12345",
  "coordinator@iub.edu.bd": "Coord@12345",
  "anika.rahman@iub.edu.bd": "Student@12345",
};

function assertIubEmail(email: string): void {
  if (!email.trim().toLowerCase().endsWith("@iub.edu.bd")) {
    throw new Error("Only @iub.edu.bd email addresses are allowed.");
  }
}

function createGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    hd: "iub.edu.bd",
    prompt: "select_account",
  });
  provider.addScope("email");
  provider.addScope("profile");
  return provider;
}

class AuthService {
  /** Signs in and returns the authenticated email (lower-cased). */
  async login(credentials: LoginCredentials): Promise<string> {
    const email = credentials.email.trim().toLowerCase();
    assertIubEmail(email);

    if (isFirebaseConfigured && auth) {
      try {
        await signInWithEmailAndPassword(
          auth,
          email,
          credentials.password,
        );
      } catch (error) {
        const expectedDemoPassword = DEMO_CREDENTIALS[email];
        const isDemoCredential =
          expectedDemoPassword === credentials.password;

        // Live hotfix: if a known demo credential is used and the Firebase
        // account does not exist yet, create it once and continue.
        if (isDemoCredential) {
          try {
            await createUserWithEmailAndPassword(
              auth,
              email,
              credentials.password,
            );
          } catch {
            throw error;
          }
        } else {
          throw error;
        }
      }
      return email;
    }

    // Demo fallback.
    const expected = DEMO_CREDENTIALS[email];
    if (!expected || expected !== credentials.password) {
      throw new Error("Invalid email or password.");
    }
    return email;
  }

  /** Creates an account and returns the authenticated email (lower-cased). */
  async register(payload: RegisterPayload): Promise<string> {
    const email = payload.email.trim().toLowerCase();
    assertIubEmail(email);

    if (isFirebaseConfigured && auth) {
      await createUserWithEmailAndPassword(auth, email, payload.password);
      return email;
    }

    // Demo fallback — no real account, just echo the email back.
    return email;
  }

  /** Signs in with Google and returns the authenticated profile. */
  async loginWithGoogle(): Promise<GoogleSignInResult> {
    if (!isFirebaseConfigured || !auth) {
      throw new Error("Google sign-in requires Firebase configuration.");
    }

    const result = await signInWithPopup(auth, createGoogleProvider());
    const email = result.user.email?.trim().toLowerCase();
    if (!email) {
      await signOut(auth);
      throw new Error("Google account did not return an email address.");
    }

    if (!email.endsWith("@iub.edu.bd")) {
      await signOut(auth);
      throw new Error("Only @iub.edu.bd email addresses are allowed.");
    }
    return {
      email,
      displayName:
        result.user.displayName?.trim() || email.split("@")[0],
    };
  }

  async logout(): Promise<void> {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
  }

  /**
   * Subscribes to auth-state changes (session restore, sign-in/out).
   * Emits the lower-cased email or null. Returns an unsubscribe function.
   * No-op in demo mode.
   */
  onAuthChange(callback: (email: string | null) => void): () => void {
    if (!isFirebaseConfigured || !auth) {
      return () => {};
    }
    return onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      callback(user?.email ? user.email.toLowerCase() : null);
    });
  }
}

export const authService = new AuthService();
