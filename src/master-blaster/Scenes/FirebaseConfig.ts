/**
 * FirebaseConfig.ts
 * Replace FIREBASE_PROJECT_ID with your actual project ID.
 * It's the string in your Firestore URL:
 *   https://firestore.googleapis.com/v1/projects/YOUR_ID/databases/...
 */
export const FIREBASE_PROJECT_ID = "ditto-run"

export const FIRESTORE_BASE =
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;
