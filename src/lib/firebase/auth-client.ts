"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import { mapFirebaseAuthError } from "@/lib/firebase/auth-errors";

export type AuthUser = {
  uid: string;
  email: string;
  displayName: string | null;
};

function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName,
  };
}

export function isRealAuthenticatedUser(user: User | null): user is User {
  return Boolean(user && !user.isAnonymous && user.email);
}

export function subscribeAuthState(
  onChange: (user: AuthUser | null) => void,
): () => void {
  const auth = getClientAuth();
  if (!auth) {
    onChange(null);
    return () => {};
  }

  return onAuthStateChanged(auth, (firebaseUser) => {
    onChange(isRealAuthenticatedUser(firebaseUser) ? toAuthUser(firebaseUser) : null);
  });
}

export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  const auth = getClientAuth();
  if (!auth) throw new Error("Firebase não configurado.");

  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    if (!isRealAuthenticatedUser(credential.user)) {
      throw new Error("Credenciais inválidas.");
    }
    return toAuthUser(credential.user);
  } catch (error) {
    throw new Error(mapFirebaseAuthError(error));
  }
}

export async function signUpWithEmail(
  nome: string,
  email: string,
  password: string,
): Promise<AuthUser> {
  const auth = getClientAuth();
  if (!auth) throw new Error("Firebase não configurado.");

  try {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const trimmedName = nome.trim();
    if (trimmedName) {
      await updateProfile(credential.user, { displayName: trimmedName });
    }
    return toAuthUser(credential.user);
  } catch (error) {
    throw new Error(mapFirebaseAuthError(error));
  }
}

export async function signOutUser(): Promise<void> {
  const auth = getClientAuth();
  if (!auth) return;
  await signOut(auth);
}

export function waitForAuthenticatedUser(timeoutMs = 15000): Promise<User> {
  const auth = getClientAuth();
  if (!auth) {
    return Promise.reject(new Error("Firebase não configurado."));
  }

  if (isRealAuthenticatedUser(auth.currentUser)) {
    return Promise.resolve(auth.currentUser);
  }

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      unsubscribe();
      reject(new Error("Sessão expirada. Faça login novamente."));
    }, timeoutMs);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (isRealAuthenticatedUser(user)) {
        window.clearTimeout(timer);
        unsubscribe();
        resolve(user);
      }
    });
  });
}
