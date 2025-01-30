import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  // Replace with your Firebase config
  apiKey: 'AIzaSyAkMG3-OGCV9ppz9GAl1apxohWw7RRp9K0',
  authDomain: 'javascript-ed43e.firebaseapp.com',
  databaseURL: 'https://javascript-ed43e-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'javascript-ed43e',
  storageBucket: 'javascript-ed43e.firebasestorage.app',
  messagingSenderId: '648029554132',
  appId: '1:648029554132:web:df6eedeacf5611d24e0241'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

export { db }
