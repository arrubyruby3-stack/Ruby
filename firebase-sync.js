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

const provider = new GoogleAuthProvider();

let currentUid = null;
let ready = false;
let applyingCloud = false;
let saveTimer = null;

window.dailyQuestFirebase = {
    signIn(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    },

    register(email, password) {
        return createUserWithEmailAndPassword(auth, email, password);
    },

    signInGoogle() {
        return signInWithPopup(auth, provider);
    },

    logout() {
        return signOut(auth);
    }
};

async function saveCloud(data) {
    if (!currentUid || !ready || applyingCloud) return;

    try {
        await setDoc(doc(db, "users", currentUid), {
            state: data,
            updatedAt: new Date().toISOString()
        });

        const status = document.querySelector("#storageStatus");
        if (status) status.textContent = "● Tersinkron ke cloud";
    } catch (error) {
        console.error("Gagal sinkronisasi:", error);
        const status = document.querySelector("#storageStatus");
        if (status) status.textContent = "● Sinkronisasi gagal";
    }
}

window.addEventListener("dailyquest:statechange", event => {
    if (!currentUid || !ready || applyingCloud) return;

    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        saveCloud(event.detail.state);
    }, 700);
});

onAuthStateChanged(auth, async user => {
    currentUid = null;
    ready = false;
    clearTimeout(saveTimer);

    const status = document.querySelector("#storageStatus");

    if (!user) {
        if (status) status.textContent = "● Mode lokal";
        console.info("DailyQuest: belum login.");
        return;
    }

    try {
        const reference = doc(db, "users", user.uid);
        const snapshot = await getDoc(reference);

        currentUid = user.uid;
        applyingCloud = true;

        if (snapshot.exists()) {
            const cloudData = snapshot.data();
            const stateData = cloudData.state || cloudData;

            if (window.dailyQuestApp?.setState) {
                window.dailyQuestApp.setState(stateData);
            }
        } else if (window.dailyQuestApp?.getState) {
            await setDoc(reference, {
                state: window.dailyQuestApp.getState(),
                updatedAt: new Date().toISOString()
            });
        }

        applyingCloud = false;
        ready = true;

        if (status) {
            status.textContent = "● " + (user.email || "Login berhasil");
        }

        console.info("DailyQuest: data akun siap disinkronkan.");
    } catch (error) {
        applyingCloud = false;
        currentUid = null;
        ready = false;

        console.error("Gagal memuat data Firebase:", error);

        if (status) status.textContent = "● Gagal memuat cloud";
        alert("Gagal memuat data Firebase. Periksa koneksi dan Firestore Rules.");
    }
});

console.info("DailyQuest: Firebase siap.");

// ===== LOGIN PAGE DAN PENGUNCI APLIKASI =====

const loginScreen = document.querySelector("#loginScreen");
const appShell = document.querySelector("#appShell");
const authForm = document.querySelector("#authForm");
const authEmail = document.querySelector("#authEmail");
const authPassword = document.querySelector("#authPassword");
const authTitle = document.querySelector("#authTitle");
const authSubmitBtn = document.querySelector("#authSubmitBtn");
const authModeToggle = document.querySelector("#authModeToggle");
const authGoogleBtn = document.querySelector("#authGoogleBtn");
const authError = document.querySelector("#authError");

let isRegisterMode = false;
let authSubmitting = false;

function showAuthError(message = "") {
    if (authError) authError.textContent = message;
}

function showLoginPage() {
    loginScreen?.classList.remove("hidden");
    appShell?.classList.add("hidden");
}

function showAppPage() {
    loginScreen?.classList.add("hidden");
    appShell?.classList.remove("hidden");
}

function updateAuthMode() {
    if (authTitle) {
        authTitle.textContent = isRegisterMode
            ? "Daftar DailyQuest"
            : "Login DailyQuest";
    }

    if (authSubmitBtn) {
        authSubmitBtn.textContent = isRegisterMode ? "Daftar" : "Login";
    }

    if (authModeToggle) {
        authModeToggle.textContent = isRegisterMode
            ? "Sudah punya akun? Login"
            : "Belum punya akun? Daftar";
    }

    if (authPassword) {
        authPassword.autocomplete = isRegisterMode
            ? "new-password"
            : "current-password";
    }
}

authModeToggle?.addEventListener("click", () => {
    isRegisterMode = !isRegisterMode;
    showAuthError("");
    updateAuthMode();
});

authForm?.addEventListener("submit", async event => {
    event.preventDefault();

    if (authSubmitting) return;

    showAuthError("");

    const email = authEmail.value.trim();
    const password = authPassword.value;

    authSubmitting = true;
    authSubmitBtn.disabled = true;

    try {
        if (isRegisterMode) {
            await window.dailyQuestFirebase.register(email, password);
        } else {
            await window.dailyQuestFirebase.signIn(email, password);
        }

        authForm.reset();
    } catch (error) {
        console.error("Autentikasi gagal:", error);

        const messages = {
            "auth/invalid-email": "Format email tidak valid.",
            "auth/missing-password": "Masukkan password.",
            "auth/weak-password": "Password minimal 6 karakter.",
            "auth/email-already-in-use": "Email sudah terdaftar. Silakan login.",
            "auth/invalid-credential": "Email atau password salah.",
            "auth/user-not-found": "Akun tidak ditemukan. Silakan daftar.",
            "auth/wrong-password": "Password salah.",
            "auth/network-request-failed": "Koneksi internet bermasalah.",
            "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi nanti."
        };

        showAuthError(messages[error.code] || "Gagal login: " + error.message);
    } finally {
        authSubmitting = false;
        authSubmitBtn.disabled = false;
    }
});

authGoogleBtn?.addEventListener("click", async () => {
    showAuthError("");

    try {
        await window.dailyQuestFirebase.signInGoogle();
    } catch (error) {
        console.error("Login Google gagal:", error);

        showAuthError(
            error.code === "auth/popup-closed-by-user"
                ? "Jendela Google ditutup sebelum login selesai."
                : error.code === "auth/popup-blocked"
                    ? "Popup diblokir browser. Izinkan popup lalu coba lagi."
                    : "Login Google gagal: " + error.message
        );
    }
});

// Periksa status login sebelum membuka dashboard.
showLoginPage();

onAuthStateChanged(auth, user => {
    if (user) {
        showAppPage();
        console.info("DailyQuest: login berhasil.");
    } else {
        showLoginPage();
        console.info("DailyQuest: menunggu login.");
    }
});

updateAuthMode();
console.info("DailyQuest: pengunci login siap.");
console.info("DailyQuest: tombol akun siap.");

// ===== MENU AKUN =====
const accountMenu = document.querySelector("#accountMenu");
const accountMenuBtn = document.querySelector("#footerProfileBtn");
const aboutBtn = document.querySelector("#aboutBtn");
const aboutModal = document.querySelector("#aboutModal");
const aboutCloseBtn = document.querySelector("#aboutCloseBtn");
const logoutBtn = document.querySelector("#logoutBtn");

accountMenuBtn?.addEventListener("click", event => {
    event.stopPropagation();

    const isOpening = accountMenu.classList.contains("hidden");
    accountMenu.classList.toggle("hidden");
    accountMenuBtn.setAttribute("aria-expanded", String(isOpening));
});

document.addEventListener("click", event => {
    if (
        accountMenu &&
        !accountMenu.contains(event.target) &&
        !accountMenuBtn?.contains(event.target)
    ) {
        accountMenu.classList.add("hidden");
        accountMenuBtn?.setAttribute("aria-expanded", "false");
    }
});

aboutBtn?.addEventListener("click", () => {
    accountMenu?.classList.add("hidden");
    accountMenuBtn?.setAttribute("aria-expanded", "false");
    aboutModal?.classList.remove("hidden");
});

aboutCloseBtn?.addEventListener("click", () => {
    aboutModal?.classList.add("hidden");
});

aboutModal?.addEventListener("click", event => {
    if (event.target === aboutModal) {
        aboutModal.classList.add("hidden");
    }
});

logoutBtn?.addEventListener("click", async () => {
    accountMenu?.classList.add("hidden");

    if (!confirm("Yakin ingin logout dari DailyQuest?")) return;

    try {
        await window.dailyQuestFirebase.logout();
    } catch (error) {
        console.error("Logout gagal:", error);
        alert("Logout gagal. Periksa koneksi internet.");
    }
});


