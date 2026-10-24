/* =========================================
   DailyQuest — Bahasa (Indonesia / English / 日本語)

   Cara kerja:
   - Teks asli di HTML/JS tidak perlu diubah.
   - Setiap teks yang tampil dicocokkan dengan kamus di bawah,
     lalu diganti sesuai bahasa yang dipilih di Pengaturan.
   - Teks baru yang dibuat JavaScript (daftar quest, toast, dll.)
     otomatis diterjemahkan lewat MutationObserver.
   - Cukup tambah baris baru di KAMUS untuk teks tambahan.

   Format baris: [teks asli, Indonesia, English, 日本語]
   Angka 0 berarti "sama dengan teks asli".
   ========================================= */

(function () {
    "use strict";

    const SUPPORTED = ["id", "en", "ja"];
    const LOCALES = { id: "id-ID", en: "en-US", ja: "ja-JP" };
    const SETTINGS_KEY = "dailyquest_preferences_v1";

    /* ---------- KAMUS ---------- */
    const ROWS = [
        /* Login */
        ["DailyQuest — Level Up Your Life", 0, 0, "DailyQuest — 人生をレベルアップ"],
        ["LEVEL UP YOUR LIFE", "NAIKKAN LEVEL HIDUPMU", 0, "人生をレベルアップ"],
        ["Welcome to", "Selamat datang di", 0, "ようこそ"],
        ["Login untuk melanjutkan perjalananmu.", 0, "Log in to continue your journey.", "ログインして冒険を続けましょう。"],
        ["Email", 0, 0, "メールアドレス"],
        ["Password", "Kata sandi", 0, "パスワード"],
        ["nama@email.com", 0, "name@email.com", "name@example.com"],
        ["Minimal 6 karakter", 0, "At least 6 characters", "6文字以上"],
        ["Login", 0, 0, "ログイン"],
        ["Belum punya akun? Daftar", 0, "Don't have an account? Sign up", "アカウントをお持ちでないですか？ 登録"],
        ["Sudah punya akun? Login", 0, "Already have an account? Log in", "すでにアカウントをお持ちですか？ ログイン"],
        ["Daftar", 0, "Sign up", "登録"],
        ["atau", 0, "or", "または"],
        ["Lanjutkan dengan Google", 0, "Continue with Google", "Googleで続行"],
        ["Data quest kamu akan disinkronkan melalui Firebase.", 0, "Your quest data will be synced through Firebase.", "クエストデータはFirebaseで同期されます。"],

        /* Sidebar & header */
        ["MENU UTAMA", 0, "MAIN MENU", "メインメニュー"],
        ["Dashboard", 0, 0, "ダッシュボード"],
        ["My Quests", "Quest Saya", 0, "マイクエスト"],
        ["Achievements", "Pencapaian", 0, "実績"],
        ["Statistics", "Statistik", 0, "統計"],
        ["PREFERENSI", 0, "PREFERENCES", "設定"],
        ["Light mode", "Mode terang", 0, "ライトモード"],
        ["Dark mode", "Mode gelap", 0, "ダークモード"],
        ["Edit Profile", "Edit Profil", 0, "プロフィール編集"],
        ["Pengaturan", 0, "Settings", "設定"],
        ["ⓘ Tentang Kami", 0, "ⓘ About Us", "ⓘ 私たちについて"],
        ["↪ Logout", "↪ Keluar", 0, "↪ ログアウト"],
        ["● Saved locally", "● Tersimpan di perangkat", 0, "● ローカルに保存済み"],
        ["● Save failed", "● Gagal menyimpan", 0, "● 保存に失敗"],
        ["Menu akun", 0, "Account menu", "アカウントメニュー"],
        ["Buka menu", 0, "Open menu", "メニューを開く"],
        ["Workspace", "Ruang kerja", 0, "ワークスペース"],
        ["OVERVIEW", "RINGKASAN", 0, "概要"],
        ["QUEST MANAGEMENT", "MANAJEMEN QUEST", 0, "クエスト管理"],
        ["REWARDS", "HADIAH", 0, "報酬"],
        ["ANALYTICS", "ANALITIK", 0, "分析"],
        ["Hari ini", 0, "Today", "今日"],
        ["Today", "Hari ini", 0, "今日"],
        ["New Quest", "Quest Baru", 0, "新規クエスト"],

        /* Dashboard */
        ["YOUR PERSONAL QUEST JOURNAL", "JURNAL QUEST PERSONALMU", 0, "あなただけのクエスト日誌"],
        ["Make today", "Jadikan hari ini", 0, "今日を"],
        ["count.", "berarti.", 0, "意味ある一日に。"],
        ["Set your goals, complete your quests, and become a better version of yourself.", "Tetapkan tujuanmu, selesaikan quest, dan jadilah versi terbaik dirimu.", 0, "目標を決めて、クエストをクリアし、より良い自分になりましょう。"],
        ["View all quests", "Lihat semua quest", 0, "すべてのクエストを見る"],
        ["TOTAL EXPERIENCE", "TOTAL PENGALAMAN", 0, "累計経験値"],
        ["Keep earning XP", "Terus kumpulkan XP", 0, "XPを集め続けよう"],
        ["QUEST COMPLETED", "QUEST SELESAI", 0, "完了したクエスト"],
        ["Total completion", "Total penyelesaian", 0, "累計完了数"],
        ["total completion", "total penyelesaian", 0, "累計完了"],
        ["DAILY PROGRESS", "PROGRES HARIAN", 0, "今日の進捗"],
        ["CURRENT STREAK", "STREAK SAAT INI", 0, "現在のストリーク"],
        ["days", "hari", 0, "日"],
        ["Best streak record", "Rekor streak terbaik", 0, "最高ストリーク記録"],
        ["YOUR JOURNEY", "PERJALANANMU", 0, "あなたの旅"],
        ["Level progression", "Perkembangan level", 0, "レベルの進行"],
        ["PLAYER STATUS", "STATUS PEMAIN", 0, "プレイヤーステータス"],
        ["LEVEL", 0, 0, "レベル"],
        ["Every quest makes you stronger.", "Setiap quest membuatmu lebih kuat.", 0, "クエストをこなすたびに強くなる。"],
        ["STAY ON TRACK", "TETAP KONSISTEN", 0, "その調子で"],
        ["Today's quests", "Quest hari ini", 0, "今日のクエスト"],
        ["View all", "Lihat semua", 0, "すべて見る"],
        ["Lihat semua", 0, "View all", "すべて見る"],
        ["Your daily missions", "Misi harianmu", 0, "今日のミッション"],
        ["Ready for a fresh start?", "Siap memulai yang baru?", 0, "新しいスタートの準備はいい？"],
        ["Tambahkan quest pertamamu dan mulai perjalananmu.", 0, "Add your first quest and begin your journey.", "最初のクエストを追加して、冒険を始めましょう。"],
        ["＋ Create your first quest", "＋ Buat quest pertamamu", 0, "＋ 最初のクエストを作成"],
        ["YOUR CONSISTENCY", "KONSISTENSIMU", 0, "継続の記録"],
        ["Activity overview", "Ringkasan aktivitas", 0, "アクティビティ概要"],
        ["LAST 7 DAYS", "7 HARI TERAKHIR", 0, "過去7日間"],
        ["Quests completed", "Quest selesai", 0, "完了したクエスト"],
        ["Grafik aktivitas tujuh hari", 0, "Seven-day activity chart", "7日間のアクティビティグラフ"],
        ["MILESTONES", "PENCAPAIAN PENTING", 0, "マイルストーン"],
        ["Lihat semua achievement", 0, "View all achievements", "すべての実績を見る"],
        ["Explore achievements", "Jelajahi pencapaian", 0, "実績を見てみよう"],
        ["YOUR NEXT CHAPTER", "BAB BERIKUTNYA", 0, "次の章"],
        ["Small steps.", "Langkah kecil.", 0, "小さな一歩。"],
        ["Big changes.", "Perubahan besar.", 0, "大きな変化。"],
        ["Konsistensi kecil hari ini adalah pencapaian besar di masa depan.", 0, "Small consistency today is a big achievement in the future.", "今日の小さな継続が、未来の大きな成果になります。"],
        ["Start a new quest", "Mulai quest baru", 0, "新しいクエストを始める"],

        /* Halaman quest */
        ["YOUR PERSONAL MISSIONS", "MISI PERSONALMU", 0, "あなたのミッション"],
        ["My", "Quest", 0, "マイ"],
        ["quests.", "saya.", 0, "クエスト。"],
        ["Atur targetmu, selesaikan misi, dan kumpulkan XP.", 0, "Set your targets, complete missions, and collect XP.", "目標を決めて、ミッションをこなし、XPを集めましょう。"],
        ["＋ Create quest", "＋ Buat quest", 0, "＋ クエスト作成"],
        ["Cari quest...", 0, "Search quests...", "クエストを検索..."],
        ["Cari quest", 0, "Search quests", "クエストを検索"],
        ["Filter kategori", 0, "Filter by category", "カテゴリで絞り込み"],
        ["Semua kategori", 0, "All categories", "すべてのカテゴリ"],
        ["Belajar", 0, "Study", "学習"],
        ["Kesehatan", 0, "Health", "健康"],
        ["Produktivitas", 0, "Productivity", "生産性"],
        ["Kebiasaan", 0, "Habits", "習慣"],
        ["Personal", 0, 0, "個人"],
        ["✎ Belajar", 0, "✎ Study", "✎ 学習"],
        ["♡ Kesehatan", 0, "♡ Health", "♡ 健康"],
        ["⚡ Produktivitas", 0, "⚡ Productivity", "⚡ 生産性"],
        ["↻ Kebiasaan", 0, "↻ Habits", "↻ 習慣"],
        ["✧ Personal", 0, 0, "✧ 個人"],
        ["Filter status", 0, "Filter by status", "ステータスで絞り込み"],
        ["Semua status", 0, "All statuses", "すべてのステータス"],
        ["Belum selesai", 0, "Not completed", "未完了"],
        ["Pernah selesai", 0, "Completed before", "完了したことあり"],
        ["Belum ada quest di sini", 0, "No quests here yet", "ここにはまだクエストがありません"],
        ["Buat quest baru atau ubah filter pencarianmu.", 0, "Create a new quest or change your search filter.", "新しいクエストを作成するか、検索フィルターを変更してください。"],
        ["total quest", 0, "total quests", "クエスト総数"],
        ["belum pernah selesai", 0, "never completed", "未完了のまま"],

        /* Halaman achievement */
        ["REWARD YOUR PROGRESS", "HARGAI PROGRESMU", 0, "成長にごほうびを"],
        ["Your", "", 0, "あなたの"],
        ["achievements.", "Pencapaianmu.", 0, "実績。"],
        ["Setiap langkah berarti. Buka pencapaian baru seiring kamu berkembang.", 0, "Every step counts. Unlock new achievements as you grow.", "一歩一歩が大切。成長に合わせて新しい実績を解除しよう。"],
        ["unlocked", "terbuka", 0, "解除済み"],
        ["YOUR COLLECTION", "KOLEKSIMU", 0, "コレクション"],
        ["✓ Unlocked", "✓ Terbuka", 0, "✓ 解除済み"],
        ["🔒 Locked", "🔒 Terkunci", 0, "🔒 ロック中"],
        ["Completed", "Selesai", 0, "達成"],
        ["Progress", "Progres", 0, "進捗"],
        ["Selesaikan quest untuk membuka lencana pertamamu.", 0, "Complete quests to unlock your first badge.", "クエストを完了して最初のバッジを獲得しよう。"],

        /* Halaman statistik */
        ["MEASURE YOUR GROWTH", "UKUR PERKEMBANGANMU", 0, "成長を測ろう"],
        ["statistics.", "Statistikmu.", 0, "統計。"],
        ["Lihat progresmu dan kenali kebiasaan yang sudah kamu bangun.", 0, "See your progress and recognize the habits you've built.", "進捗を確認し、築いてきた習慣を見つめ直しましょう。"],
        ["TOTAL XP EARNED", "TOTAL XP DIPEROLEH", 0, "獲得XP合計"],
        ["Lifetime experience", "Total pengalaman", 0, "生涯の経験値"],
        ["COMPLETION RATE", "TINGKAT PENYELESAIAN", 0, "達成率"],
        ["Berdasarkan quest tersimpan", 0, "Based on saved quests", "保存済みクエストに基づく"],
        ["BEST STREAK", "STREAK TERBAIK", 0, "最高ストリーク"],
        ["Hari berturut-turut", 0, "Consecutive days", "連続日数"],
        ["TOTAL QUESTS", "TOTAL QUEST", 0, "クエスト総数"],
        ["Quest dalam koleksimu", 0, "Quests in your collection", "コレクション内のクエスト"],
        ["CONSISTENCY REPORT", "LAPORAN KONSISTENSI", 0, "継続レポート"],
        ["Weekly activity", "Aktivitas mingguan", 0, "週間アクティビティ"],
        ["7 DAYS", "7 HARI", 0, "7日間"],
        ["Grafik statistik mingguan", 0, "Weekly statistics chart", "週間統計グラフ"],
        ["YOUR FOCUS", "FOKUSMU", 0, "フォーカス"],
        ["Quest categories", "Kategori quest", 0, "クエストカテゴリ"],
        ["YOUR JOURNEY LOG", "CATATAN PERJALANANMU", 0, "旅の記録"],
        ["Recent activity", "Aktivitas terbaru", 0, "最近のアクティビティ"],
        ["Belum ada aktivitas", 0, "No activity yet", "アクティビティはまだありません"],
        ["Selesaikan quest untuk melihat statistikmu.", 0, "Complete quests to see your statistics.", "クエストを完了すると統計が表示されます。"],
        ["Quest yang dihapus", 0, "Deleted quest", "削除済みクエスト"],
        ["Built for your next level.", "Dibuat untuk level berikutnya.", 0, "次のレベルのために。"],
        ["Local-first · No account required", "Lokal dulu · Tanpa akun", 0, "ローカル優先 · アカウント不要"],

        /* Form quest */
        ["BUILD YOUR NEXT MISSION", "BANGUN MISI BERIKUTNYA", 0, "次のミッションを作ろう"],
        ["Create a Quest", "Buat Quest", 0, "クエストを作成"],
        ["Edit Quest", 0, 0, "クエストを編集"],
        ["Tutup", 0, "Close", "閉じる"],
        ["Close", "Tutup", 0, "閉じる"],
        ["Quest title", "Judul quest", 0, "クエスト名"],
        ["Contoh: Belajar bahasa Jepang 30 menit", 0, "Example: Study Japanese for 30 minutes", "例：日本語を30分勉強する"],
        ["Description", "Deskripsi", 0, "説明"],
        ["Apa yang ingin kamu capai?", 0, "What do you want to achieve?", "何を達成したいですか？"],
        ["Category", "Kategori", 0, "カテゴリ"],
        ["Priority", "Prioritas", 0, "優先度"],
        ["Low", "Rendah", 0, "低"],
        ["Medium", "Sedang", 0, "中"],
        ["High", "Tinggi", 0, "高"],
        ["High priority", "Prioritas tinggi", 0, "優先度：高"],
        ["Target date", "Tanggal target", 0, "目標日"],
        ["XP reward", "Hadiah XP", 0, "XP報酬"],
        ["10 XP · Easy", "10 XP · Mudah", 0, "10 XP · 易しい"],
        ["20 XP · Normal", 0, 0, "20 XP · 普通"],
        ["30 XP · Medium", "30 XP · Sedang", 0, "30 XP · やや難しい"],
        ["50 XP · Hard", "50 XP · Sulit", 0, "50 XP · 難しい"],
        ["100 XP · Epic", "100 XP · Epik", 0, "100 XP · エピック"],
        ["Repeat schedule", "Jadwal pengulangan", 0, "繰り返し"],
        ["One-time quest", "Quest sekali", 0, "1回限りのクエスト"],
        ["Every day", "Setiap hari", 0, "毎日"],
        ["Weekdays only", "Hari kerja saja", 0, "平日のみ"],
        ["Every week", "Setiap minggu", 0, "毎週"],
        ["Quest berulang bisa diselesaikan lagi pada hari berikutnya tanpa membuat quest baru.", 0, "Recurring quests can be completed again the next day without creating a new quest.", "繰り返しクエストは、新しく作らなくても翌日に再度完了できます。"],
        ["Cancel", "Batal", 0, "キャンセル"],
        ["Create Quest", "Buat Quest", 0, "クエストを作成"],
        ["Save Changes", "Simpan Perubahan", 0, "変更を保存"],
        ["Delete this quest?", "Hapus quest ini?", 0, "このクエストを削除しますか？"],
        ["Quest yang dihapus tidak bisa dikembalikan.", 0, "Deleted quests cannot be restored.", "削除したクエストは元に戻せません。"],
        ["Delete quest", "Hapus quest", 0, "クエストを削除"],
        ["QUEST DETAILS", "DETAIL QUEST", 0, "クエスト詳細"],
        ["Quest detail", "Detail quest", 0, "クエストの詳細"],
        ["✎ Edit quest", 0, 0, "✎ クエストを編集"],
        ["Edit quest", 0, 0, "クエストを編集"],
        ["Hapus quest", 0, "Delete quest", "クエストを削除"],
        ["YOUR IDENTITY", "IDENTITASMU", 0, "あなたのアイデンティティ"],
        ["Edit profile", "Edit profil", 0, "プロフィール編集"],
        ["Display name", "Nama tampilan", 0, "表示名"],
        ["Nama kamu", 0, "Your name", "あなたの名前"],
        ["Save profile", "Simpan profil", 0, "プロフィールを保存"],

        /* Item quest & detail */
        ["One-time", "Sekali", 0, "1回限り"],
        ["Daily", "Harian", 0, "毎日"],
        ["Weekdays", "Hari kerja", 0, "平日"],
        ["Weekly", "Mingguan", 0, "毎週"],
        ["Batalkan penyelesaian", 0, "Undo completion", "完了を取り消す"],
        ["Selesaikan quest", 0, "Complete quest", "クエストを完了"],
        ["Quest belum jatuh tempo", 0, "Quest is not due yet", "このクエストはまだ期限前です"],
        ["Tidak ada deskripsi.", 0, "No description.", "説明はありません。"],
        ["Kategori", 0, "Category", "カテゴリ"],
        ["Prioritas", 0, "Priority", "優先度"],
        ["Pengulangan", 0, "Repeat", "繰り返し"],
        ["Reward", "Hadiah", 0, "報酬"],
        ["Selesai hari ini", 0, "Completed today", "今日完了"],
        ["Total penyelesaian", 0, "Total completions", "累計完了数"],
        ["Ya", 0, "Yes", "はい"],
        ["Belum", 0, "Not yet", "まだ"],
        ["high", "tinggi", 0, "高"],
        ["medium", "sedang", 0, "中"],
        ["low", "rendah", 0, "低"],

        /* Pengaturan */
        ["Atur preferensi DailyQuest.", 0, "Adjust your DailyQuest preferences.", "DailyQuestの設定を調整します。"],
        ["🎨 Tampilan", 0, "🎨 Appearance", "🎨 表示"],
        ["Warna aksen", 0, "Accent color", "アクセントカラー"],
        ["Ungu", 0, "Purple", "パープル"],
        ["Biru", 0, "Blue", "ブルー"],
        ["Hijau", 0, "Green", "グリーン"],
        ["Oranye", 0, "Orange", "オレンジ"],
        ["Merah muda", 0, "Pink", "ピンク"],
        ["Ukuran teks", 0, "Text size", "文字サイズ"],
        ["Kecil", 0, "Small", "小"],
        ["Normal", 0, 0, "標準"],
        ["Besar", 0, "Large", "大"],
        ["🎯 Target harian", 0, "🎯 Daily targets", "🎯 毎日の目標"],
        ["Target XP per hari", 0, "XP target per day", "1日のXP目標"],
        ["Target quest selesai per hari", 0, "Quests completed per day", "1日の完了クエスト目標"],
        ["Target streak (hari)", 0, "Streak target (days)", "ストリーク目標（日）"],
        ["🔔 Pengingat", 0, "🔔 Reminders", "🔔 リマインダー"],
        ["Aktifkan pengingat saat aplikasi dibuka", 0, "Enable reminders while the app is open", "アプリ起動中のリマインダーを有効にする"],
        ["Waktu pengingat", 0, "Reminder time", "リマインダー時刻"],
        ["Izinkan notifikasi browser", 0, "Allow browser notifications", "ブラウザ通知を許可"],
        ["Pengingat otomatis hanya berjalan ketika aplikasi aktif. Browser mungkin membatasi notifikasi di latar belakang.", 0, "Automatic reminders only run while the app is active. Browsers may restrict background notifications.", "自動リマインダーはアプリが動作中のみ実行されます。ブラウザによりバックグラウンド通知が制限される場合があります。"],
        ["🔊 Efek", 0, "🔊 Effects", "🔊 効果"],
        ["Aktifkan suara", 0, "Enable sound", "サウンドを有効にする"],
        ["Aktifkan animasi ikon", 0, "Enable animations", "アニメーションを有効にする"],
        ["🌐 Bahasa", 0, "🌐 Language", "🌐 言語"],
        ["Bahasa aplikasi", 0, "App language", "アプリの言語"],
        ["Bahasa langsung diterapkan ke seluruh tampilan aplikasi.", 0, "The language is applied instantly across the whole app.", "言語はアプリ全体にすぐ反映されます。"],
        ["💾 Data & privasi", 0, "💾 Data & privacy", "💾 データとプライバシー"],
        ["Pulihkan backup JSON", 0, "Restore JSON backup", "JSONバックアップを復元"],
        ["Ekspor backup JSON", 0, "Export JSON backup", "JSONバックアップを書き出し"],
        ["Lihat aktivitas", 0, "View activity", "アクティビティを見る"],
        ["Belum ada aktivitas yang dicatat.", 0, "No activity recorded yet.", "記録されたアクティビティはまだありません。"],
        ["Backup berisi data aplikasi, bukan kata sandi atau token login.", 0, "Backups contain app data, not passwords or login tokens.", "バックアップにはアプリのデータが含まれ、パスワードやログイントークンは含まれません。"],
        ["Reset data aplikasi", 0, "Reset app data", "アプリデータをリセット"],
        ["Data", 0, 0, "データ"],
        ["Ekspor data", 0, "Export data", "データを書き出し"],
        ["Unduh cadangan quest dan progresmu.", 0, "Download a backup of your quests and progress.", "クエストと進捗のバックアップをダウンロードします。"],
        ["Ekspor JSON", 0, "Export JSON", "JSONを書き出し"],
        ["Hapus seluruh data", 0, "Delete all data", "すべてのデータを削除"],
        ["Hapus semua quest, XP, dan progres lokal.", 0, "Delete all quests, XP, and local progress.", "すべてのクエスト、XP、ローカル進捗を削除します。"],
        ["Reset data", 0, 0, "データをリセット"],
        ["Selesai", 0, "Done", "完了"],
        ["Tentang DailyQuest", 0, "About DailyQuest", "DailyQuestについて"],
        ["Level Up Your Life.", "Naikkan Level Hidupmu.", 0, "人生をレベルアップ。"],
        ["DailyQuest membantu kamu membangun kebiasaan, mengelola quest harian, mengumpulkan XP, dan memantau perkembangan diri.", 0, "DailyQuest helps you build habits, manage daily quests, collect XP, and track your personal growth.", "DailyQuestは、習慣づくり、毎日のクエスト管理、XP集め、そして自己成長の記録をサポートします。"],
        ["Versi 1.0 · Made for your next level.", 0, "Version 1.0 · Made for your next level.", "バージョン 1.0 · 次のレベルのために。"],

        /* Toast */
        ["Data tidak bisa disimpan. Periksa ruang penyimpanan browser.", 0, "Data could not be saved. Check your browser storage space.", "データを保存できません。ブラウザの保存容量を確認してください。"],
        ["Pengaturan gagal disimpan. Periksa penyimpanan browser.", 0, "Settings could not be saved. Check your browser storage.", "設定を保存できませんでした。ブラウザの保存領域を確認してください。"],
        ["Judul quest wajib diisi.", 0, "Quest title is required.", "クエスト名は必須です。"],
        ["Pilih tanggal target yang valid.", 0, "Choose a valid target date.", "有効な目標日を選択してください。"],
        ["Quest tidak ditemukan.", 0, "Quest not found.", "クエストが見つかりません。"],
        ["Quest berhasil diperbarui.", 0, "Quest updated successfully.", "クエストを更新しました。"],
        ["Quest baru berhasil dibuat. Let's go!", 0, "New quest created. Let's go!", "新しいクエストを作成しました。さあ行こう！"],
        ["Quest ini belum jatuh tempo.", 0, "This quest is not due yet.", "このクエストはまだ期限前です。"],
        ["Penyelesaian hari ini dibatalkan. XP telah disesuaikan.", 0, "Today's completion was undone. XP has been adjusted.", "今日の完了を取り消しました。XPを調整しました。"],
        ["Quest berhasil dihapus.", 0, "Quest deleted successfully.", "クエストを削除しました。"],
        ["Nama tidak boleh kosong.", 0, "Name cannot be empty.", "名前を入力してください。"],
        ["Profil berhasil diperbarui.", 0, "Profile updated successfully.", "プロフィールを更新しました。"],
        ["Warna aksen berhasil diubah.", 0, "Accent color changed.", "アクセントカラーを変更しました。"],
        ["Bahasa berhasil diubah.", 0, "Language changed.", "言語を変更しました。"],
        ["Suara diaktifkan.", 0, "Sound enabled.", "サウンドをオンにしました。"],
        ["Suara dimatikan.", 0, "Sound turned off.", "サウンドをオフにしました。"],
        ["Browser ini tidak mendukung notifikasi.", 0, "This browser does not support notifications.", "このブラウザは通知に対応していません。"],
        ["Notifikasi browser diizinkan.", 0, "Browser notifications allowed.", "ブラウザ通知を許可しました。"],
        ["Notifikasi browser tidak diizinkan. Ubah izin di pengaturan browser.", 0, "Browser notifications were not allowed. Change the permission in your browser settings.", "ブラウザ通知が許可されませんでした。ブラウザの設定で権限を変更してください。"],
        ["Data diperbarui dari tab browser lain.", 0, "Data updated from another browser tab.", "別のタブからデータが更新されました。"],
        ["Untitled Quest", "Quest Tanpa Judul", 0, "無題のクエスト"],

        /* Pencapaian */
        ["First Steps", "Langkah Pertama", 0, "はじめの一歩"],
        ["Selesaikan quest pertamamu.", 0, "Complete your first quest.", "最初のクエストを完了しよう。"],
        ["Getting Started", "Memulai", 0, "スタート"],
        ["Selesaikan 5 quest.", 0, "Complete 5 quests.", "クエストを5つ完了しよう。"],
        ["Quest Hunter", "Pemburu Quest", 0, "クエストハンター"],
        ["Selesaikan 10 quest.", 0, "Complete 10 quests.", "クエストを10個完了しよう。"],
        ["Rising Star", "Bintang Baru", 0, "ライジングスター"],
        ["Selesaikan 25 quest.", 0, "Complete 25 quests.", "クエストを25個完了しよう。"],
        ["Legendary", "Legendaris", 0, "レジェンド"],
        ["Selesaikan 50 quest.", 0, "Complete 50 quests.", "クエストを50個完了しよう。"],
        ["XP Collector", "Kolektor XP", 0, "XPコレクター"],
        ["Kumpulkan 100 XP.", 0, "Collect 100 XP.", "100 XPを集めよう。"],
        ["Power Player", "Pemain Tangguh", 0, "パワープレイヤー"],
        ["Kumpulkan 500 XP.", 0, "Collect 500 XP.", "500 XPを集めよう。"],
        ["On Fire", "Membara", 0, "絶好調"],
        ["Bangun streak 3 hari.", 0, "Build a 3-day streak.", "3日連続ストリークを達成しよう。"],
        ["Unstoppable", "Tak Terhentikan", 0, "止まらない"],
        ["Bangun streak 7 hari.", 0, "Build a 7-day streak.", "7日連続ストリークを達成しよう。"],
        ["Level Up", "Naik Level", 0, "レベルアップ"],
        ["Capai level 5.", 0, "Reach level 5.", "レベル5に到達しよう。"],
        ["Well Rounded", "Serba Bisa", 0, "万能選手"],
        ["Selesaikan quest dari 5 kategori.", 0, "Complete quests from 5 categories.", "5つのカテゴリのクエストを完了しよう。"],
        ["Consistency", "Konsisten", 0, "継続は力"],
        ["Selesaikan quest pada 10 hari berbeda.", 0, "Complete quests on 10 different days.", "10日間、別々の日にクエストを完了しよう。"],

        /* Gelar level */
        ["Novice Explorer", "Penjelajah Pemula", 0, "駆け出しの探検家"],
        ["Curious Adventurer", "Petualang Penasaran", 0, "好奇心旺盛な冒険者"],
        ["Quest Apprentice", "Murid Quest", 0, "クエスト見習い"],
        ["Rising Achiever", "Pencapai Naik Daun", 0, "新進の達成者"],
        ["Elite Challenger", "Penantang Elit", 0, "エリート挑戦者"],
        ["Master Strategist", "Ahli Strategi", 0, "マスター戦略家"],
        ["Legendary Hero", "Pahlawan Legendaris", 0, "伝説の英雄"],
        ["Mythic Champion", "Juara Mitik", 0, "神話のチャンピオン"],
        ["Quest Legend", "Legenda Quest", 0, "クエストの伝説"]
    ];

    /* ---------- Pola dengan angka / teks dinamis ---------- */
    const plural = (n, one, many) => (Number(n) === 1 ? one : many);
    const PATTERNS = [
        { re: /^(\d+) days?$/,
          id: m => `${m[1]} hari`,
          en: m => `${m[1]} ${plural(m[1], "day", "days")}`,
          ja: m => `${m[1]}日` },
        { re: /^(\d+) XP left$/,
          id: m => `Sisa ${m[1]} XP`, en: 0, ja: m => `あと ${m[1]} XP` },
        { re: /^(\d+) XP to next level$/,
          id: m => `${m[1]} XP ke level berikutnya`, en: 0,
          ja: m => `次のレベルまで ${m[1]} XP` },
        { re: /^Level (\d+)$/, id: 0, en: 0, ja: m => `レベル ${m[1]}` },
        { re: /^(\d+) dari (\d+) misi hari ini$/, id: 0,
          en: m => `${m[1]} of ${m[2]} quests today`,
          ja: m => `今日のクエスト ${m[2]} 件中 ${m[1]} 件` },
        { re: /^Dari (\d+) pencapaian$/, id: 0,
          en: m => `Out of ${m[1]} achievements`,
          ja: m => `全 ${m[1]} 件の実績` },
        { re: /^(\d+) quest$/, id: 0,
          en: m => `${m[1]} ${plural(m[1], "quest", "quests")}`,
          ja: m => `${m[1]} 件` },
        { re: /^(\d+) quest selesai pada (.+)$/, id: 0,
          en: m => `${m[1]} ${plural(m[1], "quest", "quests")} completed on ${m[2]}`,
          ja: m => `${m[2]}：${m[1]} 件完了` },
        { re: /^(\d+) kali$/, id: 0,
          en: m => `${m[1]} ${plural(m[1], "time", "times")}`,
          ja: m => `${m[1]} 回` },
        { re: /^Quest selesai! \+(\d+) XP (.*)$/, id: 0,
          en: m => `Quest completed! +${m[1]} XP ${m[2]}`,
          ja: m => `クエスト完了！+${m[1]} XP ${m[2]}` },
        { re: /^Achievement terbuka: (.+)!$/, id: 0,
          en: m => `Achievement unlocked: ${listNames(m[1], "en")}!`,
          ja: m => `実績を解除：${listNames(m[1], "ja")}！` },
        { re: /^Level up! Sekarang Level (\d+) (.*)$/, id: 0,
          en: m => `Level up! You are now Level ${m[1]} ${m[2]}`,
          ja: m => `レベルアップ！ レベル ${m[1]} になりました ${m[2]}` },
        { re: /^"([\s\S]*)" akan dihapus\. Riwayat XP yang sudah didapat tetap dipertahankan\.$/, id: 0,
          en: m => `"${m[1]}" will be deleted. XP you have already earned is kept.`,
          ja: m => `「${m[1]}」を削除します。獲得済みのXP履歴は保持されます。` },
        { re: /^Ukuran teks diubah menjadi (\d+)px\.$/, id: 0,
          en: m => `Text size changed to ${m[1]}px.`,
          ja: m => `文字サイズを ${m[1]}px に変更しました。` },
        { re: /^Pengingat: kamu masih punya (\d+) quest hari ini\.$/, id: 0,
          en: m => `Reminder: you still have ${m[1]} ${plural(m[1], "quest", "quests")} today.`,
          ja: m => `リマインダー：今日はまだ ${m[1]} 件のクエストが残っています。` },
        { re: /^◷ (.+)$/,
          id: m => `◷ ${tr(m[1], "id")}`,
          en: m => `◷ ${tr(m[1], "en")}`,
          ja: m => `◷ ${tr(m[1], "ja")}` }
    ];

    /* ---------- Mesin terjemah ---------- */
    const DICT = new Map();
    ROWS.forEach(row => {
        const src = row[0];
        const pick = value => (value === 0 || value === undefined ? src : value);
        DICT.set(src, { id: pick(row[1]), en: pick(row[2]), ja: pick(row[3]) });
    });

    let lang = "id";

    const norm = text => text.replace(/\s+/g, " ").trim();

    function tr(source, target = lang) {
        const key = norm(String(source));
        if (!key) return key;

        const hit = DICT.get(key);
        if (hit) return hit[target];

        for (const pattern of PATTERNS) {
            const match = key.match(pattern.re);
            if (!match) continue;

            const rule = pattern[target];
            if (rule === 0) return key;
            if (typeof rule === "function") return rule(match);
        }

        return key;
    }

    function listNames(joined, target) {
        return joined.split(", ").map(name => tr(name, target)).join(", ");
    }

    /* ---------- Penerapan ke DOM ---------- */
    const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "NOSCRIPT"]);
    // Konten buatan pengguna tidak boleh ikut diterjemahkan.
    const SKIP_SELECTOR =
        "[data-no-i18n], .brand-text strong, .quest-title, .quest-description, #detailTitle";
    const ATTRS = ["placeholder", "title", "aria-label", "alt"];

    const textStore = new WeakMap();
    const attrStore = new WeakMap();

    function isSkipped(element) {
        return (
            !element ||
            SKIP_TAGS.has(element.tagName) ||
            (element.closest && element.closest(SKIP_SELECTOR) !== null)
        );
    }

    function applyToText(node) {
        if (isSkipped(node.parentElement)) return;

        const record = textStore.get(node);
        const source =
            record && node.nodeValue === record.out
                ? record.source
                : node.nodeValue;

        if (!source.trim()) return;

        const translated = tr(source);
        let value = source;

        if (translated !== norm(source)) {
            const lead = source.match(/^\s*/)[0];
            const trail = source.match(/\s*$/)[0];
            value = lead + translated + trail;
        }

        if (node.nodeValue !== value) node.nodeValue = value;
        textStore.set(node, { source, out: value });
    }

    function applyToAttributes(element) {
        if (isSkipped(element)) return;

        let records = attrStore.get(element);
        if (!records) {
            records = {};
            attrStore.set(element, records);
        }

        ATTRS.forEach(name => {
            if (!element.hasAttribute(name)) return;

            const current = element.getAttribute(name);
            const record = records[name];
            const source =
                record && current === record.out ? record.source : current;

            const translated = tr(source);
            const value = translated !== norm(source) ? translated : source;

            if (current !== value) element.setAttribute(name, value);
            records[name] = { source, out: value };
        });
    }

    function walk(root) {
        if (!root) return;

        if (root.nodeType === Node.TEXT_NODE) {
            applyToText(root);
            return;
        }

        if (root.nodeType !== Node.ELEMENT_NODE) return;
        if (isSkipped(root)) return;

        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            null
        );

        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(applyToText);

        applyToAttributes(root);
        root
            .querySelectorAll("[placeholder],[title],[aria-label],[alt]")
            .forEach(applyToAttributes);
    }

    const observer = new MutationObserver(mutations => {
        observer.disconnect();

        try {
            mutations.forEach(mutation => {
                if (mutation.type === "childList") {
                    mutation.addedNodes.forEach(walk);
                } else if (mutation.type === "characterData") {
                    applyToText(mutation.target);
                } else if (mutation.type === "attributes") {
                    applyToAttributes(mutation.target);
                }
            });
        } finally {
            observe();
        }
    });

    function observe() {
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ATTRS
        });
    }

    function setLanguage(next) {
        lang = SUPPORTED.includes(next) ? next : "id";
        document.documentElement.lang = lang;

        observer.disconnect();
        try {
            walk(document.documentElement);
        } finally {
            observe();
        }

        return lang;
    }

    function storedLanguage() {
        try {
            const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
            return SUPPORTED.includes(saved.language) ? saved.language : "id";
        } catch {
            return "id";
        }
    }

    window.DQI18n = {
        supported: SUPPORTED,
        setLanguage,
        getLanguage: () => lang,
        locale: () => LOCALES[lang] || "id-ID",
        t: text => tr(text)
    };

    setLanguage(storedLanguage());
})();
