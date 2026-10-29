/* =========================================
   DAILYQUEST
   Dashboard, Quest, XP, Level, Streak,
   Achievement, Statistik, dan LocalStorage
   ========================================= */

"use strict";

const STORAGE_KEY = "dailyquest_data_v1";
const THEME_KEY = "dailyquest_theme_v1";

const $ = (selector, root = document) =>
    root.querySelector(selector);

const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

const CATEGORY_ICONS = {
    Belajar: "✎",
    Kesehatan: "♡",
    Produktivitas: "⚡",
    Kebiasaan: "↻",
    Personal: "✧"
};

const CATEGORY_COLORS = {
    Belajar: "#a995ff",
    Kesehatan: "#65d7ae",
    Produktivitas: "#ffbd76",
    Kebiasaan: "#7eafff",
    Personal: "#ed9de5"
};

const ACHIEVEMENTS = [
    {
        id: "first",
        icon: "✦",
        name: "First Steps",
        description: "Selesaikan quest pertamamu.",
        goal: 1,
        type: "completed"
    },
    {
        id: "five",
        icon: "⚡",
        name: "Getting Started",
        description: "Selesaikan 5 quest.",
        goal: 5,
        type: "completed"
    },
    {
        id: "ten",
        icon: "♜",
        name: "Quest Hunter",
        description: "Selesaikan 10 quest.",
        goal: 10,
        type: "completed"
    },
    {
        id: "twentyfive",
        icon: "✧",
        name: "Rising Star",
        description: "Selesaikan 25 quest.",
        goal: 25,
        type: "completed"
    },
    {
        id: "fifty",
        icon: "🏆",
        name: "Legendary",
        description: "Selesaikan 50 quest.",
        goal: 50,
        type: "completed"
    },
    {
        id: "xp100",
        icon: "◈",
        name: "XP Collector",
        description: "Kumpulkan 100 XP.",
        goal: 100,
        type: "xp"
    },
    {
        id: "xp500",
        icon: "💎",
        name: "Power Player",
        description: "Kumpulkan 500 XP.",
        goal: 500,
        type: "xp"
    },
    {
        id: "streak3",
        icon: "♨",
        name: "On Fire",
        description: "Bangun streak 3 hari.",
        goal: 3,
        type: "streak"
    },
    {
        id: "streak7",
        icon: "🔥",
        name: "Unstoppable",
        description: "Bangun streak 7 hari.",
        goal: 7,
        type: "streak"
    },
    {
        id: "level5",
        icon: "⬆",
        name: "Level Up",
        description: "Capai level 5.",
        goal: 5,
        type: "level"
    },
    {
        id: "categories",
        icon: "🌈",
        name: "Well Rounded",
        description: "Selesaikan quest dari 5 kategori.",
        goal: 5,
        type: "categories"
    },
    {
        id: "earlybird",
        icon: "☀",
        name: "Consistency",
        description: "Selesaikan quest pada 10 hari berbeda.",
        goal: 10,
        type: "activeDays"
    }
];

const LEVEL_TITLES = [
    { min: 1, title: "Novice Explorer" },
    { min: 2, title: "Curious Adventurer" },
    { min: 3, title: "Quest Apprentice" },
    { min: 5, title: "Rising Achiever" },
    { min: 8, title: "Elite Challenger" },
    { min: 12, title: "Master Strategist" },
    { min: 20, title: "Legendary Hero" },
    { min: 35, title: "Mythic Champion" },
    { min: 50, title: "Quest Legend" }
];


/* =========================================
   TANGGAL DAN UTILITAS
   ========================================= */

function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function dateFromKey(key) {
    const [year, month, day] = key.split("-").map(Number);

    return new Date(year, month - 1, day, 12);
}

function shiftDate(key, amount) {
    const date = dateFromKey(key);

    date.setDate(date.getDate() + amount);

    return localDateKey(date);
}

function formatDate(key, options = {}) {
    if (!key) return "—";

    return dateFromKey(key).toLocaleDateString(dqLocale(), {
        day: "numeric",
        month: "short",
        year: "numeric",
        ...options
    });
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function makeId() {
    if (globalThis.crypto?.randomUUID) {
        return crypto.randomUUID();
    }

    return `q-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;
}


/* =========================================
   DATA DAN LOCALSTORAGE
   ========================================= */

const DQ_BANNERS = ["accent", "sunset", "ocean", "forest", "rose", "mono"];
const DQ_AVATAR_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

function emptyState() {
    return {
        version: 1,
        profile: {
            name: "Quest Player",
            avatar: "",
            title: "",
            bio: "",
            location: "",
            favoriteCategory: "",
            banner: "accent",
            joinedAt: new Date().toISOString()
        },
        quests: [],
        xpEvents: [],
        theme: "dark"
    };
}

function normalizeState(raw) {
    const clean = emptyState();

    if (!raw || typeof raw !== "object") {
        return clean;
    }

    if (raw.profile && typeof raw.profile === "object") {
        const p = raw.profile;
        const text = (value, max) =>
            typeof value === "string" ? value.trim().slice(0, max) : "";

        clean.profile.name =
            typeof p.name === "string"
                ? p.name.slice(0, 40)
                : clean.profile.name;

        clean.profile.title = text(p.title, 30);
        clean.profile.bio = text(p.bio, 160);
        clean.profile.location = text(p.location, 40);

        clean.profile.favoriteCategory =
            Object.hasOwn(CATEGORY_ICONS, p.favoriteCategory)
                ? p.favoriteCategory
                : "";

        clean.profile.banner = DQ_BANNERS.includes(p.banner)
            ? p.banner
            : "accent";

        clean.profile.avatar =
            typeof p.avatar === "string" &&
            p.avatar.length <= 160000 &&
            DQ_AVATAR_RE.test(p.avatar)
                ? p.avatar
                : "";

        if (
            typeof p.joinedAt === "string" &&
            !Number.isNaN(Date.parse(p.joinedAt))
        ) {
            clean.profile.joinedAt = p.joinedAt;
        }
    }

    if (Array.isArray(raw.quests)) {
        clean.quests = raw.quests
            .filter(q =>
                q &&
                typeof q === "object" &&
                typeof q.id === "string"
            )
            .map(q => ({
                id: q.id,

                title: String(
                    q.title || "Untitled Quest"
                ).slice(0, 100),

                description: String(
                    q.description || ""
                ).slice(0, 400),

                category: Object.hasOwn(
                    CATEGORY_ICONS,
                    q.category
                ) ? q.category : "Personal",

                priority: [
                    "low",
                    "medium",
                    "high"
                ].includes(q.priority)
                    ? q.priority
                    : "medium",

                date: /^\d{4}-\d{2}-\d{2}$/.test(q.date)
                    ? q.date
                    : localDateKey(),

                reward: [
                    10,
                    20,
                    30,
                    50,
                    100
                ].includes(Number(q.reward))
                    ? Number(q.reward)
                    : 20,

                repeat: [
                    "none",
                    "daily",
                    "weekdays",
                    "weekly"
                ].includes(q.repeat)
                    ? q.repeat
                    : "none",

                completedDates: Array.isArray(q.completedDates)
                    ? [...new Set(
                        q.completedDates.filter(date =>
                            /^\d{4}-\d{2}-\d{2}$/.test(date)
                        )
                    )]
                    : [],

                createdAt: Number(q.createdAt) || Date.now()
            }));
    }

    if (Array.isArray(raw.xpEvents)) {
        clean.xpEvents = raw.xpEvents
            .filter(event =>
                event &&
                typeof event.questId === "string" &&
                /^\d{4}-\d{2}-\d{2}$/.test(event.date)
            )
            .map(event => ({
                id: `${event.questId}|${event.date}`,
                questId: event.questId,
                date: event.date,
                amount: Math.max(
                    0,
                    Math.min(100, Number(event.amount) || 0)
                )
            }));

        clean.xpEvents = clean.xpEvents.filter(
            (event, index, array) =>
                array.findIndex(other =>
                    other.id === event.id
                ) === index
        );
    }

    clean.theme = raw.theme === "light" ? "light" : "dark";

    return clean;
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) return emptyState();

        return normalizeState(JSON.parse(raw));
    } catch (error) {
        console.error(
            "DailyQuest: gagal membaca data lokal.",
            error
        );

        return emptyState();
    }
}

let state = loadState();

let deleteTargetId = null;
let detailTargetId = null;
let lastFocusedElement = null;

let lastUnlocked = new Set();

try {
    const savedTheme = localStorage.getItem(THEME_KEY);

    if (savedTheme === "light" || savedTheme === "dark") {
        state.theme = savedTheme;
    }
} catch {
    // Tema tetap bisa digunakan jika penyimpanan tidak tersedia.
}

function saveState() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(state)
        );

        window.dispatchEvent(new CustomEvent("dailyquest:statechange", {
            detail: { state: JSON.parse(JSON.stringify(state)) }
        }));


        $("#storageStatus").textContent = "● Saved locally";

        return true;
    } catch (error) {
        console.error(
            "DailyQuest: gagal menyimpan data.",
            error
        );

        $("#storageStatus").textContent = "● Save failed";

        showToast(
            "Data tidak bisa disimpan. Periksa ruang penyimpanan browser.",
            "error"
        );

        return false;
    }
}

    // ===== Preferensi DailyQuest =====
const DQ_SETTINGS_KEY = "dailyquest_preferences_v1";
const DQ_ACTIVITY_KEY = "dailyquest_activity_v1";

function dqReadJSON(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

let dqSettings = {
    accent: "#8b5cf6",
    fontSize: 16,
    targetXP: 100,
    targetQuests: 3,
    targetStreak: 7,
    reminder: false,
    reminderTime: "20:00",
    sound: true,
    animations: true,
    language: "id",
    wallpaper: "default",
    wallDim: 20,
    wallBlur: 0,
    glassBlur: 18,
    glassAlpha: 8,
    lineRange: 14,
    lastReminderDate: "",
    ...dqReadJSON(DQ_SETTINGS_KEY, {})
};

let dqActivities = dqReadJSON(DQ_ACTIVITY_KEY, []);

function dqSaveSettings() {
    try {
        localStorage.setItem(
            DQ_SETTINGS_KEY,
            JSON.stringify(dqSettings)
        );

        return true;
    } catch (error) {
        console.error("Gagal menyimpan pengaturan:", error);

        if (typeof showToast === "function") {
            showToast(
                "Pengaturan gagal disimpan. Periksa penyimpanan browser.",
                "error"
            );
        }

        return false;
    }
}

// Locale tanggal & angka mengikuti bahasa yang dipilih (id / en / ja).
function dqLocale() {
    if (window.DQI18n) return window.DQI18n.locale();

    return { id: "id-ID", en: "en-US", ja: "ja-JP" }[dqSettings.language] || "id-ID";
}

function dqRecordActivity(message) {
    dqActivities.unshift({
        message,
        at: new Date().toISOString()
    });

    dqActivities = dqActivities.slice(0, 100);

    try {
        localStorage.setItem(
            DQ_ACTIVITY_KEY,
            JSON.stringify(dqActivities)
        );
    } catch (error) {
        console.error("Gagal menyimpan aktivitas", error);
    }
}

function dqRenderActivity() {
    const container = document.getElementById("activityList");
    if (!container) return;

    if (!dqActivities.length) {
        container.textContent = "Belum ada aktivitas yang dicatat.";
        return;
    }

    container.replaceChildren();

    dqActivities.forEach(item => {
        const row = document.createElement("div");
        row.className = "activity-item";

        const message = document.createElement("div");
        message.textContent = item.message;

        const date = document.createElement("small");
        date.textContent = new Date(item.at).toLocaleString(dqLocale());

        row.append(message, date);
        container.append(row);
    });
}


/* =========================================
   EFEK SUARA (Web Audio — tanpa file audio)
   ========================================= */

let dqAudioCtx = null;
let dqSoundCursor = 0;

const DQ_SOUNDS = {
    notify:      [{ f: 880, d: 0.14 }],
    complete:    [{ f: 523.25, d: 0.09 }, { f: 659.25, d: 0.09 }, { f: 783.99, d: 0.22 }],
    undo:        [{ f: 440, d: 0.09 }, { f: 330, d: 0.18 }],
    achievement: [{ f: 659.25, d: 0.1 }, { f: 783.99, d: 0.1 }, { f: 1046.5, d: 0.1 }, { f: 1318.5, d: 0.3 }],
    levelup:     [{ f: 523.25, d: 0.1 }, { f: 659.25, d: 0.1 }, { f: 783.99, d: 0.1 }, { f: 1046.5, d: 0.1 }, { f: 1318.5, d: 0.4 }],
    error:       [{ f: 220, d: 0.15, type: "sawtooth" }, { f: 165, d: 0.24, type: "sawtooth" }]
};

function dqGetAudio() {
    if (dqAudioCtx) return dqAudioCtx;

    const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return null;

    try {
        dqAudioCtx = new AudioContextClass();
    } catch (error) {
        console.warn("DailyQuest: audio tidak tersedia.", error);
        return null;
    }

    return dqAudioCtx;
}

function dqPlaySound(name = "notify") {
    try {
        if (dqSettings.sound === false) return;

        const notes = DQ_SOUNDS[name];
        if (!notes) return;

        const ctx = dqGetAudio();
        if (!ctx) return;

        if (ctx.state === "suspended") ctx.resume();

        // Nada diantrikan agar beberapa notifikasi beruntun tidak saling menimpa.
        if (dqSoundCursor > ctx.currentTime + 3) {
            dqSoundCursor = ctx.currentTime;
        }

        let time = Math.max(ctx.currentTime, dqSoundCursor) + 0.01;

        notes.forEach(note => {
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();

            oscillator.type = note.type || "sine";
            oscillator.frequency.value = note.f;

            gain.gain.setValueAtTime(0.0001, time);
            gain.gain.exponentialRampToValueAtTime(0.18, time + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + note.d);

            oscillator.connect(gain).connect(ctx.destination);
            oscillator.start(time);
            oscillator.stop(time + note.d + 0.03);

            time += note.d * 0.85;
        });

        dqSoundCursor = time + 0.08;
    } catch (error) {
        console.warn("DailyQuest: suara gagal diputar.", error);
    }
}


/* =========================================
   EFEK VISUAL: KONFETI & POP CHECKBOX
   ========================================= */

function dqConfetti(count = 28) {
    if (dqSettings.animations === false) return;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    const colors = [
        dqSettings.accent || "#8b5cf6",
        "#ffd166",
        "#06d6a0",
        "#ef476f",
        "#4cc9f0",
        "#ffffff"
    ];

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i += 1) {
        const piece = document.createElement("span");

        piece.className = "confetti-piece";
        piece.style.left = `${Math.random() * 100}vw`;
        piece.style.background = colors[i % colors.length];
        piece.style.animationDelay = `${Math.random() * 0.25}s`;
        piece.style.setProperty("--dx", `${Math.random() * 240 - 120}px`);
        piece.style.setProperty("--rot", `${Math.random() * 900 - 450}deg`);
        piece.style.setProperty("--dur", `${1.8 + Math.random() * 1.4}s`);

        piece.addEventListener("animationend", () => piece.remove());
        fragment.append(piece);
    }

    document.body.append(fragment);

    window.setTimeout(() => {
        $$(".confetti-piece").forEach(piece => piece.remove());
    }, 5000);
}

function dqPopQuest(id) {
    $$(`[data-quest-id="${CSS.escape(String(id))}"] .quest-check`).forEach(button => {
        button.classList.add("pop");

        window.setTimeout(() => {
            button.classList.remove("pop");
        }, 700);
    });
}


/* =========================================
   PENGINGAT HARIAN
   ========================================= */

function dqCheckReminder() {
    try {
        if (!dqSettings.reminder) return;

        const now = new Date();
        const [hour, minute] = String(dqSettings.reminderTime || "20:00")
            .split(":")
            .map(Number);

        const dueTime = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            hour || 0,
            minute || 0
        );

        const today = localDateKey();

        if (now < dueTime || dqSettings.lastReminderDate === today) return;

        dqSettings.lastReminderDate = today;
        dqSaveSettings();

        const pending = getTodayQuests().filter(
            quest => !isCompleted(quest)
        ).length;

        if (!pending) return;

        const message =
            `Pengingat: kamu masih punya ${pending} quest hari ini.`;

        showToast(message, "success", "notify");

        if ("Notification" in window && Notification.permission === "granted") {
            new Notification("DailyQuest", {
                body: window.DQI18n ? window.DQI18n.t(message) : message
            });
        }
    } catch (error) {
        console.warn("DailyQuest: pengingat gagal dijalankan.", error);
    }
}


function dqNum(value, min, max, fallback) {
    const number = Number(value);

    if (!Number.isFinite(number)) return fallback;

    return Math.min(max, Math.max(min, number));
}

// Variabel visual ringan (dipakai juga oleh slider secara langsung).
function dqApplyVisualVars() {
    const root = document.documentElement;

    const wallDim = dqNum(dqSettings.wallDim, 0, 70, 20);
    const wallBlur = dqNum(dqSettings.wallBlur, 0, 20, 0);
    const glassBlur = dqNum(dqSettings.glassBlur, 0, 40, 18);
    const glassAlpha = dqNum(dqSettings.glassAlpha, 3, 30, 8);

    root.style.setProperty("--wp-dim", String(wallDim / 100));
    root.style.setProperty("--wp-blur", `${wallBlur}px`);
    root.style.setProperty("--glass-blur", `${glassBlur}px`);
    root.style.setProperty("--glass-alpha", String(glassAlpha / 100));

    [
        ["settingWallDim", "outWallDim", wallDim, "%", 0, 70],
        ["settingWallBlur", "outWallBlur", wallBlur, "px", 0, 20],
        ["settingGlassBlur", "outGlassBlur", glassBlur, "px", 0, 40],
        ["settingGlassAlpha", "outGlassAlpha", glassAlpha, "%", 3, 30]
    ].forEach(([inputId, outputId, value, unit, min, max]) => {
        const input = document.getElementById(inputId);
        const output = document.getElementById(outputId);

        if (input) {
            input.value = String(value);
            input.style.setProperty(
                "--pct",
                `${(value - min) / (max - min) * 100}%`
            );
        }

        if (output) output.textContent = `${value}${unit}`;
    });
}

function dqUpdateFavicon(color) {
    const link = document.getElementById("dqFavicon");
    if (!link) return;

    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ` +
        `stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">` +
        `<rect x="5" y="3" width="14" height="18" rx="2.2"/>` +
        `<path d="M9 3v18M3 7.5h3M3 12h3M3 16.5h3M12.5 8h4M12.5 11.5h4M12.5 15h2.5"/></svg>`;

    link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function dqApplySettings() {
    const root = document.documentElement;

    const accent = /^#[0-9a-f]{6}$/i.test(dqSettings.accent || "")
        ? dqSettings.accent.toLowerCase()
        : "#8b5cf6";

    dqSettings.accent = accent;

    // Warna aksen — seluruh turunannya (gradien, bayangan, ikon) dihitung di CSS.
    root.style.setProperty("--accent-color", accent);
    dqUpdateFavicon(accent);

    // Ukuran teks
    const fontSize = [14, 16, 18].includes(Number(dqSettings.fontSize))
        ? Number(dqSettings.fontSize)
        : 16;

    dqSettings.fontSize = fontSize;
    root.style.setProperty("--font-size", `${fontSize}px`);

    // Animasi
    root.dataset.animations =
        dqSettings.animations === false ? "off" : "on";

    // Kaca & wallpaper
    dqApplyVisualVars();
    dqApplyWallpaper();

    // Bahasa (id / en / ja)
    const language = ["id", "en", "ja"].includes(dqSettings.language)
        ? dqSettings.language
        : "id";

    dqSettings.language = language;
    root.lang = language;

    if (window.DQI18n && window.DQI18n.getLanguage() !== language) {
        window.DQI18n.setLanguage(language);
    }

    // Sinkronkan kontrol di modal Pengaturan
    const setValue = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.value = String(value);
    };

    const setChecked = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.checked = Boolean(value);
    };

    setValue("settingAccentCustom", accent);
    setValue("settingTargetXP", dqSettings.targetXP);
    setValue("settingTargetQuests", dqSettings.targetQuests);
    setValue("settingTargetStreak", dqSettings.targetStreak);
    setValue("settingReminderTime", dqSettings.reminderTime || "20:00");

    setChecked("settingSound", dqSettings.sound !== false);
    setChecked("settingAnimations", dqSettings.animations !== false);
    setChecked("settingReminder", dqSettings.reminder);

    document.querySelectorAll("[data-accent]").forEach(button => {
        const on = button.dataset.accent.toLowerCase() === accent;

        button.classList.toggle("active", on);
        button.setAttribute("aria-checked", String(on));
    });

    document.querySelectorAll("[data-font]").forEach(button => {
        button.setAttribute(
            "aria-checked",
            String(Number(button.dataset.font) === fontSize)
        );
    });

    document.querySelectorAll("[data-lang]").forEach(button => {
        button.setAttribute(
            "aria-checked",
            String(button.dataset.lang === language)
        );
    });
}


    // Terapkan pengaturan awal tanpa menghentikan aplikasi.
/* Wallpaper: konstanta harus ada sebelum pengaturan awal diterapkan */
const DQ_WALLPAPER_KEY = "dailyquest_wallpaper_v1";
const DQ_DATA_IMAGE_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

const DQ_WALLPAPERS = [
    { id: "default", name: "Bawaan", css: "" },
    {
        id: "aurora",
        name: "Aurora",
        css: "radial-gradient(60% 55% at 20% 15%, #7c3aed 0%, transparent 60%), radial-gradient(55% 50% at 85% 25%, #06b6d4 0%, transparent 60%), radial-gradient(60% 60% at 60% 98%, rgba(34,197,94,.55) 0%, transparent 60%), linear-gradient(135deg, #0b1020, #111833)"
    },
    {
        id: "sunset",
        name: "Senja",
        css: "radial-gradient(60% 55% at 85% 12%, #f97316 0%, transparent 60%), radial-gradient(60% 55% at 15% 40%, #ec4899 0%, transparent 62%), radial-gradient(70% 60% at 60% 105%, #7c3aed 0%, transparent 60%), linear-gradient(160deg, #1a1030, #2a1237)"
    },
    {
        id: "ocean",
        name: "Samudra",
        css: "radial-gradient(60% 55% at 15% 10%, #0ea5e9 0%, transparent 60%), radial-gradient(60% 55% at 90% 40%, #2563eb 0%, transparent 62%), radial-gradient(60% 60% at 40% 105%, #14b8a6 0%, transparent 60%), linear-gradient(160deg, #06142b, #0a2540)"
    },
    {
        id: "forest",
        name: "Hutan",
        css: "radial-gradient(60% 55% at 85% 10%, #16a34a 0%, transparent 60%), radial-gradient(55% 50% at 10% 55%, #84cc16 0%, transparent 62%), radial-gradient(60% 60% at 60% 105%, #0d9488 0%, transparent 60%), linear-gradient(160deg, #07150f, #0d2a1d)"
    },
    {
        id: "midnight",
        name: "Tengah malam",
        css: "radial-gradient(50% 45% at 80% 15%, rgba(99,102,241,.45) 0%, transparent 60%), linear-gradient(160deg, #04040d, #14122b 55%, #1f1147)"
    }
];

let dqWallpaperKey = "";

dqApplySettings();

function applyTheme(theme, persist = true)  {
    state.theme = theme === "light" ? "light" : "dark";

    document.documentElement.dataset.theme = state.theme;

    const themeIcon = document.querySelector("#themeIcon");
    const themeLabel = document.querySelector("#themeLabel");

    if (themeIcon) {
        themeIcon.textContent = state.theme === "dark" ? "☼" : "☾";
    }

    if (themeLabel) {
        themeLabel.textContent =
            state.theme === "dark" ? "Light mode" : "Dark mode";
    }

    if (persist) {
        try {
            localStorage.setItem(THEME_KEY, state.theme);
        } catch (error) {
            console.error("Gagal menyimpan tema:", error);
        }
    }
}

/* =========================================
   XP, LEVEL, DAN STREAK
   ========================================= */

function isCompleted(quest, date = localDateKey()) {
    return quest.completedDates.includes(date);
}

function isDue(quest, date = localDateKey()) {
    if (quest.repeat === "none") {
        return quest.date === date;
    }

    if (date < quest.date) {
        return false;
    }

    if (quest.repeat === "daily") {
        return true;
    }

    if (quest.repeat === "weekdays") {
        const day = dateFromKey(date).getDay();

        return day >= 1 && day <= 5;
    }

    if (quest.repeat === "weekly") {
        return dateFromKey(date).getDay() ===
            dateFromKey(quest.date).getDay();
    }

    return false;
}

function getTodayQuests() {
    const today = localDateKey();

    return state.quests.filter(quest =>
        isDue(quest, today)
    );
}

function getTotalXP() {
    return state.xpEvents.reduce(
        (sum, event) => sum + event.amount,
        0
    );
}

function getTotalCompleted() {
    return state.xpEvents.length;
}

function getLevelData(xp = getTotalXP()) {
    const level = Math.floor(Math.max(0, xp) / 100) + 1;
    const xpIntoLevel = Math.max(0, xp) % 100;

    return {
        level,
        xpIntoLevel,
        remaining: 100 - xpIntoLevel,
        progress: xpIntoLevel,
        totalXP: xp
    };
}

function getLevelTitle(level) {
    return LEVEL_TITLES
        .filter(item => level >= item.min)
        .at(-1)?.title || "Novice Explorer";
}

function getActivityDates() {
    return [
        ...new Set(
            state.xpEvents.map(event => event.date)
        )
    ].sort();
}

function getStreakData() {
    const dates = new Set(getActivityDates());
    const today = localDateKey();

    let cursor = dates.has(today)
        ? today
        : shiftDate(today, -1);

    let current = 0;

    while (dates.has(cursor)) {
        current++;
        cursor = shiftDate(cursor, -1);
    }

    const sorted = [...dates].sort();

    let best = 0;
    let run = 0;
    let previous = null;

    for (const date of sorted) {
        run = previous && shiftDate(previous, 1) === date
            ? run + 1
            : 1;

        best = Math.max(best, run);
        previous = date;
    }

    return {
        current,
        best,
        activeDays: dates.size
    };
}

function getCategoryCount() {
    const completedIds = new Set(
        state.xpEvents.map(event => event.questId)
    );

    return new Set(
        state.quests
            .filter(quest => completedIds.has(quest.id))
            .map(quest => quest.category)
    ).size;
}


/* =========================================
   ACHIEVEMENTS
   ========================================= */

function getAchievementProgress(achievement) {
    const level = getLevelData();
    const streak = getStreakData();

    switch (achievement.type) {
        case "completed":
            return getTotalCompleted();

        case "xp":
            return getTotalXP();

        case "streak":
            return streak.best;

        case "level":
            return level.level;

        case "categories":
            return getCategoryCount();

        case "activeDays":
            return streak.activeDays;

        default:
            return 0;
    }
}

function isAchievementUnlocked(achievement) {
    return getAchievementProgress(achievement) >=
        achievement.goal;
}

function getUnlockedAchievements() {
    return ACHIEVEMENTS.filter(isAchievementUnlocked);
}


/* =========================================
   NOTIFIKASI
   ========================================= */

function showToast(message, type = "success", sound) {
    const toast = document.createElement("div");

    toast.className = `toast ${type}`;
    toast.textContent = message;

    $("#toastContainer").appendChild(toast);

    dqPlaySound(sound || (type === "error" ? "error" : "notify"));

    window.setTimeout(() => {
        toast.classList.add("leaving");

        window.setTimeout(() => {
            toast.remove();
        }, 260);
    }, 3500);
}


/* =========================================
   KOMPONEN QUEST
   ========================================= */

function categoryTag(category) {
    const icon = CATEGORY_ICONS[category] || "✧";

    return `
        <span class="tag">
            ${escapeHTML(icon)}
            ${escapeHTML(category)}
        </span>
    `;
}

function priorityTag(priority) {
    const labels = {
        high: "High priority",
        medium: "Medium",
        low: "Low"
    };

    return `
        <span class="tag priority-${priority}">
            ${labels[priority] || "Medium"}
        </span>
    `;
}

function repeatLabel(repeat) {
    return {
        none: "One-time",
        daily: "Daily",
        weekdays: "Weekdays",
        weekly: "Weekly"
    }[repeat] || "One-time";
}

function dueLabel(quest) {
    if (quest.repeat !== "none") {
        return repeatLabel(quest.repeat);
    }

    if (quest.date === localDateKey()) {
        return "Today";
    }

    return formatDate(quest.date, {
        year: undefined
    });
}

function questItemHTML(quest, options = {}) {
    const today = localDateKey();
    const completed = isCompleted(quest, today);
    const showActions = options.showActions !== false;
    const due = isDue(quest, today);
    const canToggle = due || completed;

    return `
        <article
            class="quest-item ${completed ? "completed" : ""}"
            data-quest-id="${escapeHTML(quest.id)}"
        >
            <button
                class="quest-check ${completed ? "done" : ""}"
                data-action="toggle"
                data-id="${escapeHTML(quest.id)}"
                aria-label="${
                    completed
                        ? "Batalkan penyelesaian"
                        : "Selesaikan quest"
                }"
                ${!canToggle
                    ? "disabled title='Quest belum jatuh tempo'"
                    : ""}
            >
                ${completed ? "✓" : ""}
            </button>

            <div class="quest-info">
                <button
                    class="quest-title plain-title"
                    data-action="detail"
                    data-id="${escapeHTML(quest.id)}"
                >
                    ${escapeHTML(quest.title)}
                </button>

                ${
                    options.showDescription && quest.description
                        ? `<div class="quest-description">
                            ${escapeHTML(quest.description)}
                           </div>`
                        : ""
                }

                <div class="quest-meta">
                    ${categoryTag(quest.category)}
                    ${priorityTag(quest.priority)}

                    <span class="tag">
                        ◷ ${escapeHTML(dueLabel(quest))}
                    </span>
                </div>
            </div>

            <span class="quest-reward">
                ✧ ${quest.reward} XP
            </span>

            ${
                showActions
                    ? `
                        <div class="quest-row-actions">
                            <button
                                class="icon-button"
                                data-action="edit"
                                data-id="${escapeHTML(quest.id)}"
                                title="Edit quest"
                                aria-label="Edit quest"
                            >✎</button>

                            <button
                                class="icon-button"
                                data-action="delete"
                                data-id="${escapeHTML(quest.id)}"
                                title="Hapus quest"
                                aria-label="Hapus quest"
                            >×</button>
                        </div>
                    `
                    : ""
            }
        </article>
    `;
}


/* =========================================
   RENDER DAFTAR QUEST
   ========================================= */

function renderQuestList() {
    const todayQuests = getTodayQuests();

    const todayDone = todayQuests.filter(
        quest => isCompleted(quest)
    ).length;

    const todayPercent = todayQuests.length
        ? Math.round(todayDone / todayQuests.length * 100)
        : 0;

    $("#todayProgressBar").style.width =
        `${todayPercent}%`;

    $("#todayProgressText").textContent =
        `${todayPercent}%`;

    $("#todayQuestList").innerHTML = todayQuests
        .slice(0, 5)
        .map(quest =>
            questItemHTML(quest, {
                showActions: false
            })
        )
        .join("");

    $("#todayEmpty").classList.toggle(
        "hidden",
        todayQuests.length > 0
    );

    const search = $("#questSearch")
        .value
        .trim()
        .toLocaleLowerCase("id");

    const category = $("#questCategoryFilter").value;
    const status = $("#questStatusFilter").value;

    const filtered = state.quests.filter(quest => {
        const text = `
            ${quest.title}
            ${quest.description}
            ${quest.category}
        `.toLocaleLowerCase("id");

        const matchesSearch = text.includes(search);

        const matchesCategory =
            category === "all" ||
            quest.category === category;

        const completedAny =
            quest.completedDates.length > 0;

        const matchesStatus =
            status === "all" ||
            (
                status === "completed" &&
                completedAny
            ) ||
            (
                status === "pending" &&
                !completedAny
            );

        return matchesSearch &&
            matchesCategory &&
            matchesStatus;
    }).sort((a, b) => {
        const aDone = isCompleted(a);
        const bDone = isCompleted(b);

        if (aDone !== bDone) {
            return Number(aDone) - Number(bDone);
        }

        const priorityOrder = {
            high: 0,
            medium: 1,
            low: 2
        };

        return priorityOrder[a.priority] -
            priorityOrder[b.priority] ||
            a.date.localeCompare(b.date);
    });

    $("#allQuestList").innerHTML = filtered
        .map(quest =>
            questItemHTML(quest, {
                showActions: true,
                showDescription: true
            })
        )
        .join("");

    $("#allQuestEmpty").classList.toggle(
        "hidden",
        filtered.length > 0
    );

    $("#questSummaryStrip").innerHTML = `
        <span>
            <strong>${state.quests.length}</strong>
            total quest
        </span>

        <span>
            <strong>${
                state.quests.filter(
                    quest => !quest.completedDates.length
                ).length
            }</strong>
            belum pernah selesai
        </span>

        <span>
            <strong>${getTotalCompleted()}</strong>
            total completion
        </span>
    `;

    $("#sidebarQuestCount").textContent = String(
        todayQuests.filter(
            quest => !isCompleted(quest)
        ).length
    );
}


/* =========================================
   RENDER ACHIEVEMENTS
   ========================================= */

function renderAchievements() {
    const unlocked = getUnlockedAchievements();

    $("#achievementPageCount").textContent =
        `${unlocked.length}/${ACHIEVEMENTS.length}`;

    $("#totalAchievements").textContent =
        unlocked.length;

    $("#achievementFoot").textContent =
        `Dari ${ACHIEVEMENTS.length} pencapaian`;

    $("#achievementGrid").innerHTML =
        ACHIEVEMENTS.map(achievement => {
            const progress = Math.min(
                getAchievementProgress(achievement),
                achievement.goal
            );

            const unlockedNow =
                progress >= achievement.goal;

            const percentage = Math.round(
                progress / achievement.goal * 100
            );

            return `
                <article class="achievement-card ${
                    unlockedNow ? "" : "locked"
                }">
                    <div class="achievement-card-top">
                        <div class="achievement-icon">
                            ${achievement.icon}
                        </div>

                        <span class="achievement-status">
                            ${
                                unlockedNow
                                    ? "✓ Unlocked"
                                    : "🔒 Locked"
                            }
                        </span>
                    </div>

                    <h3>
                        ${escapeHTML(achievement.name)}
                    </h3>

                    <p>
                        ${escapeHTML(achievement.description)}
                    </p>

                    <div class="progress-track">
                        <div
                            class="progress-fill"
                            style="width:${percentage}%"
                        ></div>
                    </div>

                    <div class="achievement-progress-label">
                        <span>
                            ${unlockedNow ? "Completed" : "Progress"}
                        </span>

                        <span>
                            ${progress}/${achievement.goal}
                        </span>
                    </div>
                </article>
            `;
        }).join("");

    const recent = unlocked.slice(-3).reverse();

    $("#recentAchievements").innerHTML = recent.length
        ? recent.map(achievement => `
            <div class="mini-achievement">
                <div class="mini-achievement-icon">
                    ${achievement.icon}
                </div>

                <div>
                    <strong>
                        ${escapeHTML(achievement.name)}
                    </strong>

                    <span>
                        ${escapeHTML(achievement.description)}
                    </span>
                </div>
            </div>
        `).join("")
        : `
            <div class="muted" style="font-size:10px;padding:8px 0">
                Selesaikan quest untuk membuka lencana pertamamu.
            </div>
        `;
}


/* =========================================
   GRAFIK AKTIVITAS
   ========================================= */

function renderChart(container, days = 7) {
    const keys = [];
    const today = localDateKey();

    for (let i = days - 1; i >= 0; i--) {
        keys.push(shiftDate(today, -i));
    }

    const counts = keys.map(key =>
        state.xpEvents.filter(
            event => event.date === key
        ).length
    );

    const max = Math.max(1, ...counts);

    container.innerHTML = keys.map((key, index) => {
        const height = counts[index] === 0
            ? 2
            : Math.max(7, counts[index] / max * 100);

        const label = dateFromKey(key)
            .toLocaleDateString(dqLocale(), {
                weekday: "short"
            });

        return `
            <div class="chart-column">
                <div class="chart-bar-area">
                    <div
                        class="chart-bar"
                        style="height:${height}%"
                        title="${
                            counts[index]
                        } quest selesai pada ${formatDate(key)}"
                    >
                        <span class="chart-bar-value">
                            ${counts[index]}
                        </span>
                    </div>
                </div>

                <span class="chart-label">
                    ${escapeHTML(label)}
                </span>
            </div>
        `;
    }).join("");
}


/* =========================================
   STATISTIK
   ========================================= */

function renderStatistics() {
    const total = state.quests.length;
    const completed = getTotalCompleted();

    const rate = total
        ? Math.min(100, Math.round(completed / total * 100))
        : 0;

    const streak = getStreakData();

    $("#statsXP").textContent =
        getTotalXP().toLocaleString(dqLocale());

    $("#statsRate").textContent = `${rate}%`;

    $("#statsBestStreak").innerHTML =
        `${streak.best} <small>days</small>`;

    $("#statsTotal").textContent = total;

    renderChart($("#statisticsChart"));
    renderLineChart();

    const categoryCounts = Object.keys(
        CATEGORY_ICONS
    ).map(category => ({
        category,

        count: state.xpEvents.filter(event => {
            const quest = state.quests.find(
                item => item.id === event.questId
            );

            return quest?.category === category;
        }).length
    }));

    const maxCount = Math.max(
        1,
        ...categoryCounts.map(item => item.count)
    );

    $("#categoryBreakdown").innerHTML =
        categoryCounts.map(item => `
            <div class="category-line">
                <div class="category-line-top">
                    <span>
                        ${CATEGORY_ICONS[item.category]}
                        ${escapeHTML(item.category)}
                    </span>

                    <span>${item.count} quest</span>
                </div>

                <div class="progress-track">
                    <div
                        class="progress-fill"
                        style="
                            width:${item.count / maxCount * 100}%;
                            background:${CATEGORY_COLORS[item.category]}
                        "
                    ></div>
                </div>
            </div>
        `).join("");

    const recent = [...state.xpEvents]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 8);

    $("#recentActivity").innerHTML = recent.length
        ? recent.map(event => {
            const quest = state.quests.find(
                item => item.id === event.questId
            );

            const name = quest?.title ||
                "Quest yang dihapus";

            return `
                <div class="activity-row">
                    <div class="activity-row-icon">✓</div>

                    <div>
                        <strong>${escapeHTML(name)}</strong>

                        <span>
                            ${formatDate(event.date)}
                            · +${event.amount} XP
                        </span>
                    </div>
                </div>
            `;
        }).join("")
        : `
            <div class="empty-state">
                <div class="empty-icon">▥</div>

                <strong>Belum ada aktivitas</strong>

                <p>
                    Selesaikan quest untuk melihat statistikmu.
                </p>
            </div>
        `;
}


/* =========================================
   DASHBOARD
   ========================================= */

function renderDashboard() {
    const xp = getTotalXP();
    const level = getLevelData(xp);
    const streak = getStreakData();
    const todayQuests = getTodayQuests();

    const doneToday = todayQuests.filter(
        quest => isCompleted(quest)
    ).length;

    const todayPercent = todayQuests.length
        ? Math.round(doneToday / todayQuests.length * 100)
        : 0;

    $("#currentDate").textContent =
        new Date().toLocaleDateString(dqLocale(), {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric"
        });

    $("#totalXP").innerHTML =
        `${xp.toLocaleString(dqLocale())} <small>XP</small>`;

    $("#totalCompleted").textContent =
        getTotalCompleted().toLocaleString(dqLocale());

    $("#completedFoot").textContent =
        "Total completion";

    $("#dailyPercent").innerHTML =
        `${todayPercent}<small>%</small>`;

    $("#dailyProgressFoot").textContent =
        `${doneToday} dari ${todayQuests.length} misi hari ini`;

    $("#headerStreak").textContent =
        `${streak.current} ${
            streak.current === 1 ? "day" : "days"
        }`;

    $("#sidebarLevel").textContent =
        `Level ${level.level}`;

    $("#sidebarXP").textContent =
        `${level.xpIntoLevel}/100 XP`;

    $("#sidebarNextXP").textContent =
        `${level.remaining} XP left`;

    $("#sidebarXPBar").style.width =
        `${level.progress}%`;

    $("#sidebarName").textContent =
        state.profile.name;

    dqRenderProfileUI();

    $("#mainLevel").textContent = level.level;

    $("#levelRing").style.background =
        `conic-gradient(
            var(--primary) ${level.progress * 3.6}deg,
            var(--surface-3) 0deg
        )`;

    $("#levelTitle").textContent =
        getLevelTitle(level.level);

    $("#levelRemaining").textContent =
        `${level.remaining} XP to next level`;

    $("#mainXPBar").style.width =
        `${level.progress}%`;

    $("#mainCurrentXP").textContent =
        `${level.xpIntoLevel} / 100 XP`;

    $("#mainNextXP").textContent =
        `Level ${level.level + 1}`;

    renderQuestList();
    renderAchievements();

    renderChart($("#dashboardChart"));
}

function renderAll() {
    renderDashboard();
    renderStatistics();
}


/* =========================================
   NAVIGASI HALAMAN
   ========================================= */

function showPage(name) {
    const validPages = [
        "dashboard",
        "quests",
        "achievements",
        "statistics"
    ];

    if (!validPages.includes(name)) {
        name = "dashboard";
    }

    $$(".page").forEach(page => {
        page.classList.toggle(
            "active",
            page.id === `page-${name}`
        );
    });

    $$(".nav-link[data-page]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === name
        );
    });

    const labels = {
        dashboard: ["Dashboard", "OVERVIEW"],
        quests: ["My Quests", "QUEST MANAGEMENT"],
        achievements: ["Achievements", "REWARDS"],
        statistics: ["Statistics", "ANALYTICS"]
    };

    const pageTitle = $("#pageTitle");

    if (pageTitle) pageTitle.textContent = labels[name][0];

    $("#breadcrumbCurrent").textContent =
        labels[name][1];

    closeSidebar();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================
   MODAL
   ========================================= */

function openModal(id) {
    lastFocusedElement = document.activeElement;

    $$(".modal-backdrop").forEach(modal => {
        modal.classList.add("hidden");
    });

    const modal = document.getElementById(id);

    if (!modal) return;

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    const focusable = $(
        "input:not([type=hidden]), textarea, select, button",
        modal
    );

    window.setTimeout(() => {
        focusable?.focus();
    }, 30);
}

function closeModal(modal) {
    if (!modal) return;

    modal.classList.add("hidden");

    const anyOpen = $$(".modal-backdrop").some(
        item => !item.classList.contains("hidden")
    );

    if (!anyOpen) {
        document.body.style.overflow = "";

        lastFocusedElement?.focus?.();
    }
}

function closeAllModals() {
    $$(".modal-backdrop").forEach(modal => {
        modal.classList.add("hidden");
    });

    document.body.style.overflow = "";

    lastFocusedElement?.focus?.();
}


/* =========================================
   TAMBAH DAN EDIT QUEST
   ========================================= */

function openQuestModal(quest = null) {
    $("#questForm").reset();

    $("#questId").value = quest?.id || "";

    $("#questTitle").value =
        quest?.title || "";

    $("#questDescription").value =
        quest?.description || "";

    $("#questCategory").value =
        quest?.category || "Belajar";

    $("#questPriority").value =
        quest?.priority || "medium";

    $("#questDate").value =
        quest?.date || localDateKey();

    $("#questReward").value =
        String(quest?.reward || 20);

    $("#questRepeat").value =
        quest?.repeat || "none";

    $("#questModalTitle").textContent =
        quest ? "Edit Quest" : "Create a Quest";

    $("#saveQuestBtn").innerHTML =
        quest
            ? "Save Changes <span>✓</span>"
            : "Create Quest <span>→</span>";

    openModal("questModal");
}

function createOrUpdateQuest(event) {
    event.preventDefault();

    const id = $("#questId").value;

    const title = $("#questTitle")
        .value
        .trim();

    const description = $("#questDescription")
        .value
        .trim();

    const date = $("#questDate").value;

    if (!title) {
        showToast(
            "Judul quest wajib diisi.",
            "error"
        );

        $("#questTitle").focus();

        return;
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        showToast(
            "Pilih tanggal target yang valid.",
            "error"
        );

        return;
    }

    const values = {
        title,
        description,
        category: $("#questCategory").value,
        priority: $("#questPriority").value,
        date,
        reward: Number($("#questReward").value),
        repeat: $("#questRepeat").value
    };

    if (id) {
        const index = state.quests.findIndex(
            quest => quest.id === id
        );

        if (index < 0) {
            showToast(
                "Quest tidak ditemukan.",
                "error"
            );

            closeAllModals();

            return;
        }

        const existing = state.quests[index];

        const rewardChanged =
            existing.reward !== values.reward;

        state.quests[index] = {
            ...existing,
            ...values
        };

        if (rewardChanged) {
            state.xpEvents = state.xpEvents.map(event =>
                event.questId === id
                    ? {
                        ...event,
                        amount: values.reward
                    }
                    : event
            );
        }

        dqRecordActivity("Quest diperbarui");
        showToast("Quest berhasil diperbarui.");
    } else {
        state.quests.push({
            id: makeId(),
            ...values,
            completedDates: [],
            createdAt: Date.now()
        });

        dqRecordActivity("Quest dibuat");
        showToast("Quest baru berhasil dibuat. Let's go!");
    }

    saveState();

    closeAllModals();

    renderAll();
}


/* =========================================
   MENYELESAIKAN QUEST
   ========================================= */

function toggleQuest(id) {
    const quest = state.quests.find(
        item => item.id === id
    );

    if (!quest) return;

    const oldLevel = getLevelData().level;

    const today = localDateKey();

    const eventId = `${id}|${today}`;

    const alreadyCompleted =
        isCompleted(quest, today);

    if (
        !alreadyCompleted &&
        !isDue(quest, today)
    ) {
        showToast(
            "Quest ini belum jatuh tempo.",
            "error"
        );

        return;
    }

    if (alreadyCompleted) {
        quest.completedDates =
            quest.completedDates.filter(
                date => date !== today
            );

        state.xpEvents =
            state.xpEvents.filter(
                event => event.id !== eventId
            );

        showToast(
            "Penyelesaian hari ini dibatalkan. XP telah disesuaikan.",
            "success",
            "undo"
        );

        dqRecordActivity("Penyelesaian dibatalkan");
    } else {
        quest.completedDates.push(today);

        // XP hanya diberikan satu kali untuk satu quest
        // pada tanggal lokal yang sama.

        if (
            !state.xpEvents.some(
                event => event.id === eventId
            )
        ) {
            state.xpEvents.push({
                id: eventId,
                questId: quest.id,
                date: today,
                amount: quest.reward
            });
        }

        showToast(
            `Quest selesai! +${quest.reward} XP ✦`,
            "success",
            "complete"
        );

        dqRecordActivity("Quest diselesaikan");
    }

    const unlockedBefore = new Set(lastUnlocked);

    saveState();

    renderAll();

    const newlyUnlocked =
        getUnlockedAchievements().filter(
            achievement =>
                !unlockedBefore.has(achievement.id)
        );

    if (newlyUnlocked.length) {
        showToast(
            `Achievement terbuka: ${
                newlyUnlocked.map(
                    achievement => achievement.name
                ).join(", ")
            }!`,
            "success",
            "achievement"
        );
    }

    const newLevel = getLevelData().level;

    if (
        !alreadyCompleted &&
        newLevel > oldLevel
    ) {
        showToast(
            `Level up! Sekarang Level ${newLevel} 🎉`,
            "success",
            "levelup"
        );
    }

    if (!alreadyCompleted) {
        dqPopQuest(id);

        dqConfetti(
            newLevel > oldLevel
                ? 80
                : newlyUnlocked.length
                    ? 50
                    : 22
        );
    }

    lastUnlocked = new Set(
        getUnlockedAchievements().map(
            achievement => achievement.id
        )
    );
}


/* =========================================
   HAPUS QUEST
   ========================================= */

function askDeleteQuest(id) {
    const quest = state.quests.find(
        item => item.id === id
    );

    if (!quest) return;

    deleteTargetId = id;

    $("#confirmTitle").textContent =
        "Delete this quest?";

    $("#confirmDescription").textContent =
        `"${quest.title}" akan dihapus. Riwayat XP yang sudah didapat tetap dipertahankan.`;

    openModal("confirmModal");
}

function deleteQuest() {
    if (!deleteTargetId) return;

    state.quests = state.quests.filter(
        quest => quest.id !== deleteTargetId
    );

    // Riwayat XP yang sudah didapat tetap dipertahankan.

    deleteTargetId = null;

    saveState();

    closeAllModals();

    renderAll();

    dqRecordActivity("Quest dihapus");
    showToast("Quest berhasil dihapus.");
}


/* =========================================
   DETAIL QUEST
   ========================================= */

function openQuestDetail(id) {
    const quest = state.quests.find(
        item => item.id === id
    );

    if (!quest) return;

    detailTargetId = id;

    $("#detailTitle").textContent =
        quest.title;

    $("#detailContent").innerHTML = `
        ${
            quest.description
                ? `<p class="detail-description">
                    ${escapeHTML(quest.description)}
                   </p>`
                : `<p class="detail-description">
                    Tidak ada deskripsi.
                   </p>`
        }

        <div class="detail-field">
            <span>Kategori</span>
            <strong>${escapeHTML(quest.category)}</strong>
        </div>

        <div class="detail-field">
            <span>Prioritas</span>
            <strong>${escapeHTML(quest.priority)}</strong>
        </div>

        <div class="detail-field">
            <span>Target date</span>
            <strong>${formatDate(quest.date)}</strong>
        </div>

        <div class="detail-field">
            <span>Pengulangan</span>
            <strong>${escapeHTML(repeatLabel(quest.repeat))}</strong>
        </div>

        <div class="detail-field">
            <span>Reward</span>
            <strong>${quest.reward} XP</strong>
        </div>

        <div class="detail-field">
            <span>Selesai hari ini</span>
            <strong>${isCompleted(quest) ? "Ya" : "Belum"}</strong>
        </div>

        <div class="detail-field">
            <span>Total penyelesaian</span>
            <strong>${quest.completedDates.length} kali</strong>
        </div>
    `;

    openModal("detailModal");
}


/* =========================================
   PROFIL
   ========================================= */

/* (fungsi profil dipindah ke blok FITUR TAMBAHAN di bawah) */


/* =========================================
   SIDEBAR
   ========================================= */

function toggleSidebar() {
    $("#sidebar").classList.toggle("open");

    $("#sidebarOverlay").classList.toggle("show");
}

function closeSidebar() {
    $("#sidebar").classList.remove("open");

    $("#sidebarOverlay").classList.remove("show");
}


/* =========================================
   EVENT QUEST
   ========================================= */

function handleQuestAction(event) {
    const button = event.target.closest(
        "[data-action]"
    );

    if (!button) return;

    const { action, id } = button.dataset;

    if (!id) return;

    switch (action) {
        case "toggle":
            toggleQuest(id);
            break;

        case "edit": {
            const quest = state.quests.find(
                item => item.id === id
            );

            if (quest) {
                openQuestModal(quest);
            }

            break;
        }

        case "delete":
            askDeleteQuest(id);
            break;

        case "detail":
            openQuestDetail(id);
            break;
    }
}


/* =========================================
   EVENT GLOBAL
   ========================================= */

function handleGlobalClick(event) {
    const pageButton = event.target.closest(
        "[data-page]"
    );

    if (pageButton) {
        event.preventDefault();

        showPage(pageButton.dataset.page);

        return;
    }

    const goPageButton = event.target.closest(
        "[data-go-page]"
    );

    if (goPageButton) {
        showPage(goPageButton.dataset.goPage);

        return;
    }

    if (event.target.closest("[data-open-quest]")) {
        openQuestModal();

        return;
    }

    if (event.target.closest("[data-close-modal]")) {
        closeAllModals();

        return;
    }

    const backdrop = event.target.classList.contains(
        "modal-backdrop"
    )
        ? event.target
        : null;

    if (backdrop) {
        closeModal(backdrop);
    }
}


/* =========================================
   EVENT LISTENERS
   ========================================= */

function bindEvents() {
    document.addEventListener(
        "click",
        handleGlobalClick
    );

    $("#themeToggle").addEventListener(
        "click",
        () => {
            applyTheme(
                state.theme === "dark"
                    ? "light"
                    : "dark"
            );

            saveState();
        }
    );

    $("#headerAddQuest").addEventListener(
        "click",
        () => openQuestModal()
    );

    $("#editProfileBtn").addEventListener(
        "click",
        openProfileModal
    );


    $("#settingsBtn").addEventListener(
        "click",
        () => openModal("settingsModal")
    );


    // Efek suara
    $("#settingSound")?.addEventListener("change", event => {
        dqSettings.sound = event.target.checked;
        dqSaveSettings();

        if (dqSettings.sound) {
            dqPlaySound("complete");
            showToast("Suara diaktifkan.", "success", "none");
        } else {
            showToast("Suara dimatikan.", "success", "none");
        }
    });

    // Animasi
    $("#settingAnimations")?.addEventListener("change", event => {
        dqSettings.animations = event.target.checked;
        dqSaveSettings();
        dqApplySettings();
    });

    // Target harian
    [
        ["#settingTargetXP", "targetXP", 10, 10000],
        ["#settingTargetQuests", "targetQuests", 1, 100],
        ["#settingTargetStreak", "targetStreak", 1, 365]
    ].forEach(([selector, key, min, max]) => {
        $(selector)?.addEventListener("change", event => {
            const value = Math.min(
                max,
                Math.max(min, Number(event.target.value) || min)
            );

            dqSettings[key] = value;
            event.target.value = value;
            dqSaveSettings();
        });
    });

    // Pengingat
    $("#settingReminder")?.addEventListener("change", event => {
        dqSettings.reminder = event.target.checked;
        dqSettings.lastReminderDate = "";
        dqSaveSettings();
        dqCheckReminder();
    });

    $("#settingReminderTime")?.addEventListener("change", event => {
        dqSettings.reminderTime = event.target.value || "20:00";
        dqSettings.lastReminderDate = "";
        dqSaveSettings();
        dqCheckReminder();
    });

    $("#enableNotificationsBtn")?.addEventListener("click", async () => {
        if (!("Notification" in window)) {
            showToast("Browser ini tidak mendukung notifikasi.", "error");
            return;
        }

        try {
            const result = await Notification.requestPermission();

            if (result === "granted") {
                showToast("Notifikasi browser diizinkan.");
            } else {
                showToast(
                    "Notifikasi browser tidak diizinkan. Ubah izin di pengaturan browser.",
                    "error"
                );
            }
        } catch (error) {
            console.warn("DailyQuest: izin notifikasi gagal.", error);
        }
    });


    $("#menuToggle").addEventListener(
        "click",
        toggleSidebar
    );

    $("#sidebarOverlay").addEventListener(
        "click",
        closeSidebar
    );

    $("#questForm").addEventListener(
        "submit",
        createOrUpdateQuest
    );

    $("#profileForm").addEventListener(
        "submit",
        saveProfile
    );

    $("#confirmDeleteBtn").addEventListener(
        "click",
        deleteQuest
    );

    $("#detailEditBtn").addEventListener(
        "click",
        () => {
            const quest = state.quests.find(
                item => item.id === detailTargetId
            );

            if (quest) {
                openQuestModal(quest);
            }
        }
    );

    $("#todayQuestList").addEventListener(
        "click",
        handleQuestAction
    );

    $("#allQuestList").addEventListener(
        "click",
        handleQuestAction
    );

    $("#questSearch").addEventListener(
        "input",
        renderQuestList
    );

    $("#questCategoryFilter").addEventListener(
        "change",
        renderQuestList
    );

    $("#questStatusFilter").addEventListener(
        "change",
        renderQuestList
    );

    document.addEventListener(
        "keydown",
        event => {
            if (event.key === "Escape") {
                closeAllModals();
                closeSidebar();
            }
        }
    );

    // Sinkronisasi perubahan antar-tab browser.
    window.addEventListener(
        "storage",
        event => {
            if (
                event.key !== STORAGE_KEY ||
                !event.newValue
            ) {
                return;
            }

            try {
                state = normalizeState(
                    JSON.parse(event.newValue)
                );

                applyTheme(state.theme, false);

                lastUnlocked = new Set(
                    getUnlockedAchievements().map(
                        achievement => achievement.id
                    )
                );

                renderAll();

                showToast(
                    "Data diperbarui dari tab browser lain."
                );
            } catch (error) {
                console.error(
                    "Gagal memuat perubahan dari tab lain.",
                    error
                );
            }
        }
    );

    // Perbarui tampilan ketika halaman aktif kembali.
    document.addEventListener(
        "visibilitychange",
        () => {
            if (!document.hidden) {
                renderAll();
            }
        }
    );
}


/* =========================================
   FITUR TAMBAHAN
   Profil + foto, menu akun, wallpaper, dialog konfirmasi,
   reset/backup data, dan grafik garis statistik.
   ========================================= */

/* ---------- Gambar: potong, kecilkan, ubah ke data URL ---------- */

function dqLoadImage(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve(image);
        };

        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Gambar tidak bisa dibaca"));
        };

        image.src = url;
    });
}

async function dqProcessImage(file, { max = 1920, quality = 0.82, square = false } = {}) {
    const image = await dqLoadImage(file);

    let sx = 0;
    let sy = 0;
    let sw = image.naturalWidth;
    let sh = image.naturalHeight;

    if (square) {
        const side = Math.min(sw, sh);

        sx = (sw - side) / 2;
        sy = (sh - side) / 2;
        sw = side;
        sh = side;
    }

    const scale = Math.min(1, max / Math.max(sw, sh));
    const width = Math.max(1, Math.round(sw * scale));
    const height = Math.max(1, Math.round(sh * scale));

    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", quality);
}


/* ---------- Profil ---------- */

let dqProfileDraft = { avatar: "", banner: "accent" };

function dqRenderAvatar(element, profile) {
    if (!element) return;

    const initial = (String(profile.name || "").trim()[0] || "Q").toUpperCase();

    if (profile.avatar && DQ_AVATAR_RE.test(profile.avatar)) {
        element.style.backgroundImage = `url("${profile.avatar}")`;
        element.classList.add("has-photo");
        element.textContent = "";
    } else {
        element.style.backgroundImage = "";
        element.classList.remove("has-photo");
        element.textContent = initial;
    }
}

function dqRenderProfileUI() {
    const profile = state.profile;
    const level = getLevelData();
    const streak = getStreakData();

    dqRenderAvatar($("#sidebarAvatar"), profile);
    dqRenderAvatar($("#apAvatar"), profile);

    const footerName = $("#sidebarNameFooter");
    if (footerName) footerName.textContent = profile.name;

    $("#apName").textContent = profile.name;
    $("#apTitle").textContent = profile.title || getLevelTitle(level.level);
    $("#apBanner").dataset.banner = profile.banner || "accent";

    $("#apLevel").textContent = level.level;
    $("#apXP").textContent = getTotalXP().toLocaleString(dqLocale());
    $("#apStreak").textContent = streak.current;
}

function dqRenderProfileDraft() {
    const name = $("#profileName").value.trim() || state.profile.name;

    dqRenderAvatar($("#profileAvatarPreview"), {
        name,
        avatar: dqProfileDraft.avatar
    });

    $("#profileBannerPreview").dataset.banner = dqProfileDraft.banner;

    $$("#profileBannerChoices .pf-banner-choice").forEach(button => {
        button.setAttribute(
            "aria-checked",
            String(button.dataset.banner === dqProfileDraft.banner)
        );
    });

    $("#profileAvatarRemove").classList.toggle(
        "hidden",
        !dqProfileDraft.avatar
    );
}

function openProfileModal() {
    const profile = state.profile;
    const level = getLevelData();

    $("#profileName").value = profile.name;
    $("#profileTitle").value = profile.title || "";
    $("#profileLocation").value = profile.location || "";
    $("#profileFavCategory").value = profile.favoriteCategory || "";
    $("#profileBio").value = profile.bio || "";
    $("#profileBioCount").textContent = $("#profileBio").value.length;

    dqProfileDraft = {
        avatar: profile.avatar || "",
        banner: DQ_BANNERS.includes(profile.banner) ? profile.banner : "accent"
    };

    $("#pfLevel").textContent = level.level;
    $("#pfXP").textContent = getTotalXP().toLocaleString(dqLocale());
    $("#pfBest").textContent = getStreakData().best;
    $("#pfDone").textContent = getTotalCompleted();

    $("#pfJoined").textContent = new Date(profile.joinedAt)
        .toLocaleDateString(dqLocale(), {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

    dqRenderProfileDraft();
    openModal("profileModal");
}

function saveProfile(event) {
    event.preventDefault();

    const name = $("#profileName").value.trim();

    if (!name) {
        showToast("Nama tidak boleh kosong.", "error");
        return;
    }

    const profile = state.profile;
    const favorite = $("#profileFavCategory").value;

    profile.name = name.slice(0, 40);
    profile.title = $("#profileTitle").value.trim().slice(0, 30);
    profile.location = $("#profileLocation").value.trim().slice(0, 40);
    profile.bio = $("#profileBio").value.trim().slice(0, 160);
    profile.favoriteCategory = Object.hasOwn(CATEGORY_ICONS, favorite)
        ? favorite
        : "";
    profile.banner = DQ_BANNERS.includes(dqProfileDraft.banner)
        ? dqProfileDraft.banner
        : "accent";
    profile.avatar = dqProfileDraft.avatar || "";

    if (!saveState()) return;

    dqRecordActivity("Profil diperbarui");

    closeAllModals();
    renderAll();

    showToast("Profil berhasil diperbarui.");
}


/* ---------- Menu akun (pojok kiri bawah) ---------- */

function dqToggleAccountMenu(force) {
    const popover = $("#dqAccountPopover");
    const trigger = $("#accountTrigger");

    if (!popover || !trigger) return;

    const open = typeof force === "boolean"
        ? force
        : popover.classList.contains("hidden");

    if (open) {
        const rect = trigger.getBoundingClientRect();

        popover.style.left = `${Math.max(12, rect.left)}px`;
        popover.style.bottom = `${window.innerHeight - rect.top + 10}px`;
    }

    popover.classList.toggle("hidden", !open);
    trigger.setAttribute("aria-expanded", String(open));
}

function dqAccountAction(action) {
    dqToggleAccountMenu(false);

    if (action === "profile") {
        closeSidebar();
        openProfileModal();
    } else if (action === "avatar") {
        closeSidebar();
        openProfileModal();
        $("#profileAvatarInput").click();
    } else if (action === "settings") {
        closeSidebar();
        openModal("settingsModal");
    } else if (action === "about") {
        closeSidebar();
        openModal("aboutModal");
    } else if (action === "logout") {
        // Tombol logout asli (ditangani firebase-sync.js) tetap ada di DOM.
        document.getElementById("logoutBtn")?.click();
    }
}


/* ---------- Wallpaper ---------- */


function dqCustomWallpaper() {
    try {
        const data = localStorage.getItem(DQ_WALLPAPER_KEY);

        return data && DQ_DATA_IMAGE_RE.test(data) ? data : "";
    } catch {
        return "";
    }
}

function dqRenderWallpaperPresets(activeId) {
    const box = $("#wallpaperPresets");
    if (!box) return;

    const items = [...DQ_WALLPAPERS];
    const custom = dqCustomWallpaper();

    if (custom) {
        items.push({ id: "custom", name: "Foto kamu", css: `url("${custom}")` });
    }

    box.replaceChildren();

    items.forEach(item => {
        const button = document.createElement("button");
        const label = document.createElement("span");

        button.type = "button";
        button.className = "wp-thumb";
        button.dataset.wallpaper = item.id;
        button.setAttribute("role", "radio");
        button.setAttribute("aria-checked", String(item.id === activeId));
        button.setAttribute("aria-label", item.name);
        button.style.backgroundImage = item.css || "var(--mesh)";

        label.textContent = item.name;
        button.append(label);
        box.append(button);
    });
}

function dqApplyWallpaper() {
    const layer = document.getElementById("dqWallpaper");
    const preview = document.getElementById("wallpaperPreview");

    let id = dqSettings.wallpaper || "default";
    let image = "";

    if (id === "custom") {
        const data = dqCustomWallpaper();

        if (data) {
            image = `url("${data}")`;
        } else {
            id = "default";
        }
    } else {
        const preset = DQ_WALLPAPERS.find(item => item.id === id);

        if (preset) {
            image = preset.css;
        } else {
            id = "default";
        }
    }

    dqSettings.wallpaper = id;

    const key = `${id}:${id === "custom" ? image.length : ""}`;

    if (key !== dqWallpaperKey) {
        dqWallpaperKey = key;

        [layer, preview].forEach(element => {
            if (!element) return;

            element.style.backgroundImage = image;
            element.classList.toggle("has-image", Boolean(image));
        });

        dqRenderWallpaperPresets(id);
    } else {
        $$("#wallpaperPresets .wp-thumb").forEach(button => {
            button.setAttribute(
                "aria-checked",
                String(button.dataset.wallpaper === id)
            );
        });
    }
}

async function dqHandleWallpaperFile(file) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        showToast("File harus berupa gambar.", "error");
        return;
    }

    try {
        let data = await dqProcessImage(file, { max: 1920, quality: 0.82 });

        if (data.length > 2800000) {
            data = await dqProcessImage(file, { max: 1440, quality: 0.7 });
        }

        localStorage.setItem(DQ_WALLPAPER_KEY, data);

        dqSettings.wallpaper = "custom";
        dqSaveSettings();
        dqApplySettings();

        showToast("Wallpaper berhasil diubah.");
    } catch (error) {
        console.warn("DailyQuest: wallpaper gagal disimpan.", error);

        showToast(
            error && error.name === "QuotaExceededError"
                ? "Gambar terlalu besar untuk disimpan. Coba gambar yang lebih kecil."
                : "Gambar tidak bisa diproses.",
            "error"
        );
    }
}

function dqRemoveWallpaper() {
    try {
        localStorage.removeItem(DQ_WALLPAPER_KEY);
    } catch {
        // abaikan
    }

    dqSettings.wallpaper = "default";
    dqSaveSettings();
    dqApplySettings();

    showToast("Wallpaper dihapus.");
}


/* ---------- Dialog konfirmasi ---------- */

let dqConfirmState = null;

function dqConfirm({ title, message, confirmText, danger = true, onConfirm }) {
    const settingsOpen = !$("#settingsModal").classList.contains("hidden");

    dqConfirmState = {
        onConfirm,
        returnTo: settingsOpen ? "settingsModal" : null
    };

    $("#dqConfirmTitle").textContent = title;
    $("#dqConfirmMessage").textContent = message;

    const ok = $("#dqConfirmOk");

    ok.textContent = confirmText;
    ok.classList.toggle("button-danger", danger);
    ok.classList.toggle("button-primary", !danger);

    openModal("dqConfirmModal");
}


/* ---------- Reset, ekspor, impor ---------- */

function dqResetData() {
    const keep = {
        profile: state.profile,
        theme: state.theme
    };

    state = emptyState();
    state.profile = keep.profile;
    state.theme = keep.theme;

    deleteTargetId = null;
    detailTargetId = null;
    lastUnlocked = new Set();

    dqActivities = [];

    try {
        localStorage.removeItem(DQ_ACTIVITY_KEY);
    } catch {
        // abaikan
    }

    saveState();
    renderAll();

    dqRecordActivity("Data aplikasi direset");
    dqRenderActivity();

    showToast("Data aplikasi berhasil direset.", "success", "undo");
}

function dqExportData() {
    try {
        const preferences = { ...dqSettings };

        if (preferences.wallpaper === "custom") {
            preferences.wallpaper = "default";
        }

        const payload = {
            app: "DailyQuest",
            version: 1,
            exportedAt: new Date().toISOString(),
            state: JSON.parse(JSON.stringify(state)),
            preferences
        };

        const blob = new Blob(
            [JSON.stringify(payload, null, 2)],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `dailyquest-backup-${localDateKey()}.json`;

        document.body.append(link);
        link.click();
        link.remove();

        window.setTimeout(() => URL.revokeObjectURL(url), 1000);

        dqRecordActivity("Backup diekspor");
        showToast("Backup berhasil diekspor.");
    } catch (error) {
        console.error("DailyQuest: ekspor gagal.", error);
        showToast("File backup tidak valid.", "error");
    }
}

async function dqHandleImportFile(file) {
    if (!file) return;

    let parsed;

    try {
        parsed = JSON.parse(await file.text());
    } catch {
        showToast("File backup tidak valid.", "error");
        return;
    }

    const raw = parsed && typeof parsed.state === "object" && parsed.state
        ? parsed.state
        : parsed;

    if (!raw || typeof raw !== "object" || !Array.isArray(raw.quests)) {
        showToast("File backup tidak valid.", "error");
        return;
    }

    dqConfirm({
        title: "Pulihkan backup?",
        message: "Data saat ini akan diganti dengan isi file backup. Lanjutkan?",
        confirmText: "Ya, pulihkan",
        danger: false,
        onConfirm: () => {
            raw.theme = raw.theme || state.theme;

            state = normalizeState(raw);
            saveState();

            applyTheme(state.theme);
            lastUnlocked = new Set(
                getUnlockedAchievements().map(item => item.id)
            );

            renderAll();

            dqRecordActivity("Backup dipulihkan");
            showToast("Backup berhasil dipulihkan.");
        }
    });
}


/* ---------- Grafik garis XP (statistik) ---------- */

function dqNiceStep(value) {
    const exponent = Math.pow(10, Math.floor(Math.log10(value)));
    const fraction = value / exponent;

    const nice =
        fraction <= 1 ? 1 :
        fraction <= 2 ? 2 :
        fraction <= 2.5 ? 2.5 :
        fraction <= 5 ? 5 : 10;

    return nice * exponent;
}

function dqSmoothPath(points, yMin, yMax) {
    const fmt = number => number.toFixed(1);
    const clamp = value => Math.min(yMax, Math.max(yMin, value));

    let path = `M${fmt(points[0][0])},${fmt(points[0][1])}`;

    for (let i = 0; i < points.length - 1; i += 1) {
        const p0 = points[i - 1] || points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2;
        const t = 0.18;

        const c1x = p1[0] + (p2[0] - p0[0]) * t;
        const c1y = clamp(p1[1] + (p2[1] - p0[1]) * t);
        const c2x = p2[0] - (p3[0] - p1[0]) * t;
        const c2y = clamp(p2[1] - (p3[1] - p1[1]) * t);

        path += ` C${fmt(c1x)},${fmt(c1y)} ${fmt(c2x)},${fmt(c2y)} ${fmt(p2[0])},${fmt(p2[1])}`;
    }

    return path;
}

function renderLineChart() {
    const container = document.getElementById("xpLineChart");
    const summary = document.getElementById("lineSummary");

    if (!container || !summary) return;

    const days = [7, 14, 30].includes(Number(dqSettings.lineRange))
        ? Number(dqSettings.lineRange)
        : 14;

    $$("[data-line-range]").forEach(button => {
        button.setAttribute(
            "aria-pressed",
            String(Number(button.dataset.lineRange) === days)
        );
    });

    const locale = dqLocale();
    const today = localDateKey();
    const keys = [];

    for (let i = days - 1; i >= 0; i -= 1) {
        keys.push(shiftDate(today, -i));
    }

    const events = keys.map(key =>
        state.xpEvents.filter(event => event.date === key)
    );

    const xp = events.map(list =>
        list.reduce((sum, event) => sum + (Number(event.amount) || 0), 0)
    );

    const counts = events.map(list => list.length);
    const total = xp.reduce((a, b) => a + b, 0);
    const average = total / days;
    const bestIndex = xp.indexOf(Math.max(...xp));

    summary.innerHTML = `
        <div>
            <small>Total in range</small>
            <strong>${total.toLocaleString(locale)} XP</strong>
        </div>
        <div>
            <small>Daily average</small>
            <strong>${average.toLocaleString(locale, { maximumFractionDigits: 1 })} XP</strong>
        </div>
        <div>
            <small>Best day</small>
            <strong>${total ? xp[bestIndex].toLocaleString(locale) : 0} XP</strong>
            <em>${total ? escapeHTML(formatDate(keys[bestIndex])) : "—"}</em>
        </div>
    `;

    const W = 720;
    const H = 270;
    const padL = 46;
    const padR = 18;
    const padT = 18;
    const padB = 34;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;

    const rawMax = Math.max(...xp, 10);
    const step = dqNiceStep(rawMax / 4);
    const maxY = Math.ceil(rawMax / step) * step;

    const xAt = index => padL + index * innerW / (days - 1);
    const yAt = value => padT + innerH * (1 - value / maxY);
    const baseline = padT + innerH;

    const points = xp.map((value, index) => [xAt(index), yAt(value)]);
    const line = dqSmoothPath(points, padT, baseline);

    const area =
        `${line} L${xAt(days - 1).toFixed(1)},${baseline} ` +
        `L${xAt(0).toFixed(1)},${baseline} Z`;

    let grid = "";

    for (let value = 0; value <= maxY + 0.001; value += step) {
        const y = yAt(value);

        grid += `
            <line class="lc-grid" x1="${padL}" x2="${W - padR}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"></line>
            <text class="lc-axis" x="${padL - 10}" y="${(y + 4).toFixed(1)}" text-anchor="end">${value}</text>
        `;
    }

    const labelStep = Math.ceil(days / 7);
    let labels = "";

    keys.forEach((key, index) => {
        if ((days - 1 - index) % labelStep !== 0) return;

        const text = dateFromKey(key).toLocaleDateString(locale, {
            day: "numeric",
            month: "short"
        });

        labels += `<text class="lc-axis" x="${xAt(index).toFixed(1)}" y="${H - 8}" text-anchor="middle">${escapeHTML(text)}</text>`;
    });

    const dots = points.map(([x, y]) =>
        `<circle class="lc-dot${days > 14 ? " lc-dot-hidden" : ""}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.6"></circle>`
    ).join("");

    container.classList.remove("is-hover");

    container.innerHTML = `
        <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Grafik garis XP">
            <defs>
                <linearGradient id="lcGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop class="lc-stop-a" offset="0"></stop>
                    <stop class="lc-stop-b" offset="1"></stop>
                </linearGradient>
            </defs>
            ${grid}
            ${labels}
            <path class="lc-area" d="${area}"></path>
            <path class="lc-line" pathLength="1" d="${line}"></path>
            <line class="lc-guide" x1="0" x2="0" y1="${padT}" y2="${baseline}"></line>
            ${dots}
        </svg>
        <div class="lc-tip"></div>
        ${total ? "" : '<div class="lc-empty">Belum ada XP pada periode ini.</div>'}
    `;

    const svg = container.querySelector("svg");
    const tip = container.querySelector(".lc-tip");
    const guide = svg.querySelector(".lc-guide");
    const circles = [...svg.querySelectorAll(".lc-dot")];

    const show = event => {
        const rect = svg.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width * W;

        let index = Math.round((x - padL) / innerW * (days - 1));
        index = Math.max(0, Math.min(days - 1, index));

        const gx = xAt(index);

        guide.setAttribute("x1", gx);
        guide.setAttribute("x2", gx);

        circles.forEach((circle, i) => {
            circle.classList.toggle("is-active", i === index);
        });

        tip.innerHTML = `
            <strong>${escapeHTML(formatDate(keys[index]))}</strong>
            <span>${xp[index].toLocaleString(locale)} XP</span><span> · </span><span>${counts[index]} quest</span>
        `;

        tip.style.left = `${gx / W * rect.width}px`;
        tip.style.top = `${yAt(xp[index]) / H * rect.height}px`;

        container.classList.add("is-hover");
    };

    svg.addEventListener("pointermove", show);
    svg.addEventListener("pointerdown", show);

    svg.addEventListener("pointerleave", () => {
        container.classList.remove("is-hover");
        circles.forEach(circle => circle.classList.remove("is-active"));
    });
}


/* ---------- Pasang semua event fitur baru ---------- */

function dqShowSettingsTab(name) {
    $$("[data-settings-tab]").forEach(button => {
        const on = button.dataset.settingsTab === name;

        button.classList.toggle("active", on);
        button.setAttribute("aria-selected", String(on));
    });

    $$("[data-settings-panel]").forEach(panel => {
        panel.classList.toggle("active", panel.dataset.settingsPanel === name);
    });

    $(".settings-panels")?.scrollTo({ top: 0 });
}

function dqBindNewFeatures() {
    /* Tab pengaturan */
    $(".settings-tabs")?.addEventListener("click", event => {
        const tab = event.target.closest("[data-settings-tab]");

        if (tab) dqShowSettingsTab(tab.dataset.settingsTab);
    });

    /* Warna aksen */
    $("#accentSwatches")?.addEventListener("click", event => {
        const swatch = event.target.closest("[data-accent]");
        if (!swatch) return;

        dqSettings.accent = swatch.dataset.accent;
        dqSaveSettings();
        dqApplySettings();

        showToast("Warna aksen berhasil diubah.");
    });

    $("#settingAccentCustom")?.addEventListener("input", event => {
        dqSettings.accent = event.target.value;
        dqApplySettings();
    });

    $("#settingAccentCustom")?.addEventListener("change", event => {
        dqSettings.accent = event.target.value;
        dqSaveSettings();
        dqApplySettings();
    });

    /* Ukuran teks */
    $("#fontSizeSegments")?.addEventListener("click", event => {
        const button = event.target.closest("[data-font]");
        if (!button) return;

        dqSettings.fontSize = Number(button.dataset.font);
        dqSaveSettings();
        dqApplySettings();

        showToast(`Ukuran teks diubah menjadi ${dqSettings.fontSize}px.`);
    });

    /* Bahasa */
    $("#languageCards")?.addEventListener("click", event => {
        const card = event.target.closest("[data-lang]");
        if (!card) return;

        dqSettings.language = card.dataset.lang;
        dqSaveSettings();
        dqApplySettings();

        // Render ulang agar tanggal, grafik, dan daftar ikut berganti bahasa.
        renderAll();
        dqRenderActivity();

        showToast("Bahasa berhasil diubah.");
    });

    /* Wallpaper & efek kaca */
    [
        ["settingWallDim", "wallDim"],
        ["settingWallBlur", "wallBlur"],
        ["settingGlassBlur", "glassBlur"],
        ["settingGlassAlpha", "glassAlpha"]
    ].forEach(([id, key]) => {
        const input = document.getElementById(id);

        input?.addEventListener("input", () => {
            dqSettings[key] = Number(input.value);
            dqApplyVisualVars();
        });

        input?.addEventListener("change", () => dqSaveSettings());
    });

    $("#wallpaperPresets")?.addEventListener("click", event => {
        const thumb = event.target.closest("[data-wallpaper]");
        if (!thumb) return;

        dqSettings.wallpaper = thumb.dataset.wallpaper;
        dqSaveSettings();
        dqApplySettings();
    });

    $("#wallpaperUploadBtn")?.addEventListener("click", () => {
        $("#settingWallpaperFile").click();
    });

    $("#settingWallpaperFile")?.addEventListener("change", event => {
        const file = event.target.files?.[0];

        event.target.value = "";
        dqHandleWallpaperFile(file);
    });

    $("#wallpaperRemoveBtn")?.addEventListener("click", dqRemoveWallpaper);

    /* Tes suara */
    $("#testSoundBtn")?.addEventListener("click", () => {
        if (dqSettings.sound === false) {
            showToast("Suara dimatikan.", "success", "none");
            return;
        }

        dqPlaySound("achievement");
    });

    /* Menu akun */
    const trigger = $("#accountTrigger");

    trigger?.addEventListener("click", () => dqToggleAccountMenu());

    trigger?.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            dqToggleAccountMenu();
        }
    });

    $("#dqAccountPopover")?.addEventListener("click", event => {
        const item = event.target.closest("[data-account-action]");

        if (item) dqAccountAction(item.dataset.accountAction);
    });

    document.addEventListener("click", event => {
        const popover = $("#dqAccountPopover");

        if (!popover || popover.classList.contains("hidden")) return;

        if (
            !event.target.closest("#dqAccountPopover") &&
            !event.target.closest("#accountTrigger")
        ) {
            dqToggleAccountMenu(false);
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") dqToggleAccountMenu(false);
    });

    window.addEventListener("resize", () => dqToggleAccountMenu(false));

    /* Edit profil */
    $("#profileAvatarBtn")?.addEventListener("click", () => {
        $("#profileAvatarInput").click();
    });

    $("#profileAvatarInput")?.addEventListener("change", async event => {
        const file = event.target.files?.[0];

        event.target.value = "";
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            showToast("File harus berupa gambar.", "error");
            return;
        }

        try {
            dqProfileDraft.avatar = await dqProcessImage(file, {
                max: 256,
                quality: 0.86,
                square: true
            });

            dqRenderProfileDraft();
        } catch {
            showToast("Gambar tidak bisa diproses.", "error");
        }
    });

    $("#profileAvatarRemove")?.addEventListener("click", () => {
        dqProfileDraft.avatar = "";
        dqRenderProfileDraft();
    });

    $("#profileBannerChoices")?.addEventListener("click", event => {
        const choice = event.target.closest("[data-banner]");
        if (!choice) return;

        dqProfileDraft.banner = choice.dataset.banner;
        dqRenderProfileDraft();
    });

    $("#profileName")?.addEventListener("input", dqRenderProfileDraft);

    $("#profileBio")?.addEventListener("input", event => {
        $("#profileBioCount").textContent = event.target.value.length;
    });

    /* Konfirmasi umum */
    $("#dqConfirmOk")?.addEventListener("click", () => {
        const current = dqConfirmState;

        dqConfirmState = null;
        closeAllModals();

        current?.onConfirm?.();
    });

    $("#dqConfirmCancel")?.addEventListener("click", () => {
        const current = dqConfirmState;

        dqConfirmState = null;
        closeAllModals();

        if (current?.returnTo) openModal(current.returnTo);
    });

    /* Data: reset, ekspor, impor, aktivitas */
    $("#resetDataBtn")?.addEventListener("click", () => {
        dqConfirm({
            title: "Reset data aplikasi?",
            message: "Apakah anda ingin menghapus data? Data yang telah dihapus tidak akan kembali lagi!",
            confirmText: "Ya, hapus data",
            danger: true,
            onConfirm: dqResetData
        });
    });

    $("#exportDataBtn")?.addEventListener("click", dqExportData);

    $("#importDataBtn")?.addEventListener("click", () => {
        $("#importDataFile").click();
    });

    $("#importDataFile")?.addEventListener("change", event => {
        const file = event.target.files?.[0];

        event.target.value = "";
        dqHandleImportFile(file);
    });

    $("#viewActivityBtn")?.addEventListener("click", () => {
        const list = $("#activityList");
        const show = list.classList.contains("hidden");

        list.classList.toggle("hidden", !show);

        if (show) dqRenderActivity();
    });

    /* Rentang grafik garis */
    $(".range-switch")?.addEventListener("click", event => {
        const button = event.target.closest("[data-line-range]");
        if (!button) return;

        dqSettings.lineRange = Number(button.dataset.lineRange);
        dqSaveSettings();
        renderLineChart();
    });
}


/* =========================================
   MULAI APLIKASI
   ========================================= */

function initializeApp() {
    applyTheme(state.theme, false);

    dqApplySettings();

    bindEvents();
    dqBindNewFeatures();

    $("#profileTimezone").value = "local";
    $("#questDate").value = localDateKey();

    lastUnlocked = new Set(
        getUnlockedAchievements().map(
            achievement => achievement.id
        )
    );

    renderAll();

    dqCheckReminder();
    window.setInterval(dqCheckReminder, 30000);

    console.info("DailyQuest siap digunakan.");
}


initializeApp();

window.dailyQuestApp = {
    getState() {
        return JSON.parse(JSON.stringify(state));
    },

    setState(data) {
        state = normalizeState(data);
        applyTheme(state.theme, false);

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            localStorage.setItem(THEME_KEY, state.theme);
        } catch (error) {
            console.error("Gagal menyimpan data akun:", error);
        }

        lastUnlocked = new Set(
            getUnlockedAchievements().map(item => item.id)
        );

        renderAll();
    }
};
