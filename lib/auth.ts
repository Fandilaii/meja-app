'use client'

import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { auth } from './firebase'

export async function signIn(email: string, password: string): Promise<User> {
  if (!auth) throw new Error('Firebase Auth not initialised')
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

export async function signOut(): Promise<void> {
  if (!auth) throw new Error('Firebase Auth not initialised')
  await firebaseSignOut(auth)
}

export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  if (!auth) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}

export function getCurrentUser(): User | null {
  return auth?.currentUser ?? null
}
