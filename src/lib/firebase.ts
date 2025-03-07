import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCEW_dY7IrxyksJRCGYYEbliKJDC2otSyY",
  authDomain: "lol-team-auto-tool.firebaseapp.com",
  projectId: "lol-team-auto-tool",
  storageBucket: "lol-team-auto-tool.firebasestorage.app",
  messagingSenderId: "258041026991",
  appId: "1:258041026991:web:b33ffef7539552bec3b75a",
  measurementId: "G-C1XBQM6JMQ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// クライアントサイドでのみAnalyticsを初期化
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}
export { analytics }; 