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

    return dateFromKey(key).toLocaleDateString("id-ID", {
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

function emptyState() {
    return {
        version: 1,
        profile: {
            name: "Quest Player"
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
        clean.profile.name =
            typeof raw.profile.name === "string"
                ? raw.profile.name.slice(0, 40)
                : clean.profile.name;
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

function applyTheme(theme, persist = true) {
    state.theme = theme === "light" ? "light" : "dark";

    document.documentElement.dataset.theme = state.theme;

    $("#themeIcon").textContent =
        state.theme === "dark" ? "☼" : "☾";

    $("#themeLabel").textContent =
        state.theme === "dark" ? "Light mode" : "Dark mode";

    if (persist) {
        try {
            localStorage.setItem(THEME_KEY, state.theme);
        } catch {
            // Tema masih berlaku untuk halaman saat ini.
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

function showToast(message, type = "success") {
    const toast = document.createElement("div");

    toast.className = `toast ${type}`;
    toast.textContent = message;

    $("#toastContainer").appendChild(toast);

    window.setTimeout(() => {
        toast.remove();
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
            .toLocaleDateString("id-ID", {
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
        getTotalXP().toLocaleString("id-ID");

    $("#statsRate").textContent = `${rate}%`;

    $("#statsBestStreak").innerHTML =
        `${streak.best} <small>days</small>`;

    $("#statsTotal").textContent = total;

    renderChart($("#statisticsChart"));

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
        new Date().toLocaleDateString("id-ID", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric"
        });

    $("#totalXP").innerHTML =
        `${xp.toLocaleString("id-ID")} <small>XP</small>`;

    $("#totalCompleted").textContent =
        getTotalCompleted().toLocaleString("id-ID");

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

    $("#sidebarAvatar").textContent =
        (state.profile.name.trim()[0] || "Q").toUpperCase();

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

    $("#pageTitle").textContent = labels[name][0];

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

        showToast("Quest berhasil diperbarui.");
    } else {
        state.quests.push({
            id: makeId(),
            ...values,
            completedDates: [],
            createdAt: Date.now()
        });

        showToast(
            "Quest baru berhasil dibuat. Let's go!"
        );
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
            "Penyelesaian hari ini dibatalkan. XP telah disesuaikan."
        );
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
            `Quest selesai! +${quest.reward} XP ✦`
        );
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
            }!`
        );
    }

    const newLevel = getLevelData().level;

    if (
        !alreadyCompleted &&
        newLevel > oldLevel
    ) {
        showToast(
            `Level up! Sekarang Level ${newLevel} 🎉`
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

function openProfileModal() {
    $("#profileName").value =
        state.profile.name;

    openModal("profileModal");
}

function saveProfile(event) {
    event.preventDefault();

    const name = $("#profileName")
        .value
        .trim();

    if (!name) {
        showToast(
            "Nama tidak boleh kosong.",
            "error"
        );

        return;
    }

    state.profile.name = name.slice(0, 40);

    saveState();

    closeAllModals();

    renderAll();

    showToast("Profil berhasil diperbarui.");
}


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

    $("#settingsThemeToggle").addEventListener(
    "click",
    () => {
        applyTheme(
            state.theme === "dark" ? "light" : "dark"
        );
        saveState();
        showToast("Tema berhasil diubah.");
    }
);

    $("#exportDataBtn").addEventListener(
        "click",
        () => {
            const backup = {
                ...state,
                exportedAt: new Date().toISOString()
            };

            const blob = new Blob(
                [JSON.stringify(backup, null, 2)],
                { type: "application/json" }
            );

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = `dailyquest-backup-${localDateKey()}.json`;
            link.click();

            URL.revokeObjectURL(url);
            showToast("Cadangan data berhasil diekspor.");
        }
    );

    $("#resetDataBtn").addEventListener(
        "click",
        () => {
            const confirmed = window.confirm(
                "Hapus SELURUH data DailyQuest di browser ini? Data yang dihapus tidak bisa dipulihkan kecuali kamu memiliki cadangan."
            );

            if (!confirmed) return;

            state = emptyState();

            try {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(THEME_KEY);
            } catch (error) {
                console.error(error);
            }

            deleteTargetId = null;
            detailTargetId = null;

            applyTheme("dark");
            saveState();
            renderAll();
            closeAllModals();

            lastUnlocked = new Set(
                getUnlockedAchievements().map(
                    achievement => achievement.id
                )
            );

            showToast("Data DailyQuest telah direset.");
        }
    );


    $("#settingsBtn").addEventListener(
        "click",
        () => openModal("settingsModal")
    );

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
   MULAI APLIKASI
   ========================================= */

function initializeApp() {
    applyTheme(state.theme, false);

    bindEvents();

    $("#profileTimezone").value = "local";

    $("#questDate").value = localDateKey();

    lastUnlocked = new Set(
        getUnlockedAchievements().map(
            achievement => achievement.id
        )
    );

    renderAll();

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