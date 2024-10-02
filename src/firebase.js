// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA-G_cdmqghtr9DJJMC0tP94LdoW0Q6AVc",
  authDomain: "roapp-de944.firebaseapp.com",
  projectId: "roapp-de944",
  storageBucket: "roapp-de944.appspot.com",
  messagingSenderId: "931445057009",
  appId: "1:931445057009:web:d2970cf195e0104cb21050"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
