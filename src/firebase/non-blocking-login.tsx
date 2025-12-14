
'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch((error) => {
    console.error("Anonymous sign-in error:", error);
    toast({
      variant: "destructive",
      title: "Authentication Error",
      description: "Could not sign in anonymously. Please try again later.",
    });
  });
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string, onSuccess?: () => void, onError?: (error: any) => void): void {
  createUserWithEmailAndPassword(authInstance, email, password)
    .then((userCredential) => {
        // Sign-up successful, user is automatically signed in.
        if (onSuccess) {
            onSuccess();
        }
    })
    .catch((error) => {
        console.error("Sign-up error:", error);
        if (onError) {
          onError(error);
        }
        let description = "An unknown error occurred during sign-up.";
        if (error.code === 'auth/email-already-in-use') {
            description = "This email is already in use. Please sign in or use a different email.";
        } else if (error.code === 'auth/weak-password') {
            description = "The password is too weak. Please choose a stronger password."
        }
        toast({
            variant: "destructive",
            title: "Sign-Up Failed",
            description: description,
        });
    });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string, onError?: (error: any) => void): void {
  signInWithEmailAndPassword(authInstance, email, password)
    .catch((error) => {
        console.error("Sign-in error:", error);
        if (onError) {
            onError(error);
        } else {
            let description = "An unknown error occurred during sign-in.";
            // Check for common auth errors to provide a more specific message
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
                description = "Invalid credentials. Please check your email and password.";
            }
            toast({
                variant: "destructive",
                title: "Sign-In Failed",
                description: description,
            });
        }
    });
}


/** Sends a password reset email to the given address. */
export function sendPasswordReset(authInstance: Auth, email: string): void {
    sendPasswordResetEmail(authInstance, email)
        .then(() => {
            toast({
                title: "Password Reset Email Sent",
                description: "If an account exists for that email, a reset link has been sent.",
            });
        })
        .catch((error) => {
            console.error("Password reset error:", error);
            // We typically don't want to tell the user if the email was invalid for security reasons
            // (to prevent user enumeration), so we show a generic message on error too.
            toast({
                title: "Password Reset Email Sent",
                description: "If an account exists for that email, a reset link has been sent.",
            });
        });
}
