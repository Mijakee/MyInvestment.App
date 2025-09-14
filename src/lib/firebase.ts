import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getFunctions } from 'firebase/functions'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Check if Firebase is configured
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your_api_key_here'

let app: any = null
let db: any = null
let auth: any = null
let functions: any = null

if (isFirebaseConfigured) {
  // Initialize Firebase only if configured
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  auth = getAuth(app)
  functions = getFunctions(app)
}

// Export Firebase services (will be null if not configured)
export { db, auth, functions, isFirebaseConfigured }
export default app