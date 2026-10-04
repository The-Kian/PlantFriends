import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { GoogleSignin, isSuccessResponse } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";

let googleConfigured = false;

/**
 * Configures Google Sign-In once. The web client ID comes from the Firebase
 * console (Authentication → Sign-in method → Google → Web SDK configuration)
 * and is needed to get an ID token Firebase accepts.
 */
function ensureGoogleConfigured() {
  if (googleConfigured) return;
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });
  googleConfigured = true;
}

/**
 * Runs the native Google sign-in flow and returns a Firebase credential, or
 * null if the user cancelled.
 */
export async function getGoogleCredential(): Promise<FirebaseAuthTypes.AuthCredential | null> {
  ensureGoogleConfigured();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) {
    return null;
  }

  const { idToken } = response.data;
  if (!idToken) {
    throw new Error("Google sign-in did not return an ID token.");
  }
  return auth.GoogleAuthProvider.credential(idToken);
}

export async function signOutOfGoogle(): Promise<void> {
  try {
    ensureGoogleConfigured();
    await GoogleSignin.signOut();
  } catch {
    // Not signed in with Google; nothing to do.
  }
}

export type AppleSignInResult = {
  credential: FirebaseAuthTypes.AuthCredential;
  authorizationCode: string | null;
  displayName: string | null;
};

function isAppleCancel(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "ERR_REQUEST_CANCELED"
  );
}

/**
 * Runs the native Sign in with Apple flow and returns a Firebase credential,
 * or null if the user cancelled. Apple only returns the user's name the first
 * time they sign in, so callers should save it then.
 */
export async function getAppleCredential(): Promise<AppleSignInResult | null> {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );

  let appleCredential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (error) {
    if (isAppleCancel(error)) return null;
    throw error;
  }

  if (!appleCredential.identityToken) {
    throw new Error("Sign in with Apple did not return an identity token.");
  }

  const { givenName, familyName } = appleCredential.fullName ?? {};
  const displayName = [givenName, familyName].filter(Boolean).join(" ") || null;

  return {
    credential: auth.AppleAuthProvider.credential(
      appleCredential.identityToken,
      rawNonce,
    ),
    authorizationCode: appleCredential.authorizationCode,
    displayName,
  };
}

export function hasProvider(
  user: FirebaseAuthTypes.User,
  providerId: "password" | "google.com" | "apple.com",
): boolean {
  return user.providerData.some((provider) => provider.providerId === providerId);
}
