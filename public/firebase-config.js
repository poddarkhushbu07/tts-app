// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBzaZc0Wlc53WnYlL1KFdW-uCwlbQz-X6I",
  authDomain: "app-tts-c9139.firebaseapp.com",
  projectId: "app-tts-c9139",
  storageBucket: "app-tts-c9139.firebasestorage.app",
  messagingSenderId: "543802804467",
  appId: "1:543802804467:web:ab44d838a8ccac2f398f86",
  measurementId: "G-TQQK90BHXF"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence()
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.log('The current browser does not suppor t persistence.');
    }
  }); 