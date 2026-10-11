
import { auth, db } from "./firebase.js";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// Penghubung akun dan database.
// Belum mengubah atau menimpa data DailyQuest.

const provider = new GoogleAuthProvider();

window.dailyQuestFirebase = {
    auth,
    db,

    signIn(email, password) {
        return signInWithEmailAndPassword(
            auth,
            email,
            password
        );
    },

    register(email, password) {
        return createUserWithEmailAndPassword(
            auth,
            email,
            password
        );
    },

    signInGoogle() {
        return signInWithPopup(auth, provider);
    },

    logout() {
        return signOut(auth);
    },

    onAuthChanged(callback) {
        return onAuthStateChanged(auth, callback);
    },

    async loadData(uid) {
        const reference = doc(db, "users", uid);
        const snapshot = await getDoc(reference);

        return snapshot.exists() ? snapshot.data() : null;
    },

    async saveData(uid, data) {
        const reference = doc(db, "users", uid);

        await setDoc(reference, {
            ...data,
            updatedAt: new Date().toISOString()
        });
    }
};

console.info("DailyQuest: Firebase siap.");
