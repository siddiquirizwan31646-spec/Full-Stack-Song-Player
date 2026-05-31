import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Sparkles, RotateCcw, Music2, Headphones, BookOpen, ChevronLeft, User, Grid3X3 } from "lucide-react";

// ─── Creator Info ─────────────────────────────────────────────────────────────
const CREATOR = {
  name: "Rizwan Siddiqui",
  role: "Founder & Developer of QalbAudio",
  bio: "Rizwan Siddiqui is the visionary creator and developer behind QalbAudio — a spiritual Islamic audio platform built to connect hearts with the remembrance of Allah. With a passion for technology and Islam, Rizwan built QalbAudio to make authentic Islamic content accessible to every Muslim worldwide.",
  contact: "Connect with Rizwan through QalbAudio's official channels.",
};

// ─── 50+ Chat Option Categories ──────────────────────────────────────────────
const CHAT_CATEGORIES = [
  {
    label: "About Creator",
    icon: "👨‍💻",
    color: "#a78bfa",
    options: [
      { label: "Who made QalbAudio?", prompt: "who_creator" },
      { label: "About Rizwan Siddiqui", prompt: "about_creator" },
      { label: "Creator's vision", prompt: "creator_vision" },
    ],
  },
  {
    label: "Nasheeds",
    icon: "🎵",
    color: "#34d399",
    options: [
      { label: "Top Nasheed picks", prompt: "nasheed_top" },
      { label: "Maher Zain songs", prompt: "maher_zain" },
      { label: "Sami Yusuf tracks", prompt: "sami_yusuf" },
      { label: "Mesut Kurtis", prompt: "mesut_kurtis" },
      { label: "Harris J songs", prompt: "harris_j" },
      { label: "Humood AlKhudher", prompt: "humood" },
      { label: "Arabic Nasheeds", prompt: "nasheed_arabic" },
      { label: "English Nasheeds", prompt: "nasheed_english" },
      { label: "Urdu Nasheeds", prompt: "nasheed_urdu" },
    ],
  },
  {
    label: "Quran",
    icon: "📖",
    color: "#60a5fa",
    options: [
      { label: "Surah Al-Fatiha", prompt: "surah_fatiha" },
      { label: "Surah Al-Baqarah", prompt: "surah_baqarah" },
      { label: "Surah Al-Kahf", prompt: "surah_kahf" },
      { label: "Surah Yasin", prompt: "surah_yasin" },
      { label: "Surah Ar-Rahman", prompt: "surah_rahman" },
      { label: "Surah Al-Mulk", prompt: "surah_mulk" },
      { label: "Ayatul Kursi", prompt: "ayatul_kursi" },
      { label: "Mishary Alafasy", prompt: "mishary" },
      { label: "Al-Sudais recitations", prompt: "sudais" },
      { label: "Quran listening tips", prompt: "quran_tips" },
    ],
  },
  {
    label: "Scholars & Lectures",
    icon: "🎓",
    color: "#fbbf24",
    options: [
      { label: "Nouman Ali Khan", prompt: "nouman" },
      { label: "Mufti Menk talks", prompt: "mufti_menk" },
      { label: "Omar Suleiman", prompt: "omar_suleiman" },
      { label: "Hamza Yusuf", prompt: "hamza_yusuf" },
      { label: "Yasmin Mogahed", prompt: "yasmin" },
      { label: "Bilal Philips", prompt: "bilal" },
      { label: "Friday Khutbah", prompt: "khutbah" },
      { label: "Seerah lectures", prompt: "seerah" },
    ],
  },
  {
    label: "Du'a & Adhkar",
    icon: "🤲",
    color: "#f87171",
    options: [
      { label: "Morning Adhkar", prompt: "morning_adhkar" },
      { label: "Evening Adhkar", prompt: "evening_adhkar" },
      { label: "Du'a for anxiety", prompt: "dua_anxiety" },
      { label: "Du'a before sleep", prompt: "dua_sleep" },
      { label: "Du'a for travel", prompt: "dua_travel" },
      { label: "Istighfar collection", prompt: "istighfar" },
    ],
  },
  {
    label: "Occasions",
    icon: "🌙",
    color: "#818cf8",
    options: [
      { label: "Ramadan playlist", prompt: "ramadan_playlist" },
      { label: "Eid audio ideas", prompt: "eid_audio" },
      { label: "Jumu'ah picks", prompt: "jumuah" },
      { label: "Hajj & Umrah prep", prompt: "hajj" },
      { label: "Wedding Nasheeds", prompt: "wedding" },
      { label: "Mawlid content", prompt: "mawlid" },
    ],
  },
  {
    label: "By Mood & Time",
    icon: "⏰",
    color: "#2dd4bf",
    options: [
      { label: "Fajr audio ideas", prompt: "fajr" },
      { label: "Isha night audio", prompt: "isha" },
      { label: "Before sleep picks", prompt: "sleep_audio" },
      { label: "Study & focus audio", prompt: "study" },
      { label: "Travel playlist", prompt: "travel" },
      { label: "Stress & calm audio", prompt: "stress" },
      { label: "Kids Islamic audio", prompt: "kids" },
    ],
  },
  {
    label: "App Help",
    icon: "⚙️",
    color: "#94a3b8",
    options: [
      { label: "How to search", prompt: "how_search" },
      { label: "Create a playlist", prompt: "create_playlist" },
      { label: "Save favourites", prompt: "favourites" },
      { label: "Offline downloads", prompt: "offline" },
      { label: "Upload audio", prompt: "upload" },
      { label: "Account & profile", prompt: "account" },
      { label: "Send feedback", prompt: "feedback" },
    ],
  },
];

// ─── Prompt → multiple response variants ─────────────────────────────────────
const RESPONSES = {
  who_creator: [
    `QalbAudio was created by Rizwan Siddiqui 👨‍💻✨\n\nRizwan is a passionate Muslim developer who combined his love for technology and Islam to build QalbAudio — a spiritual audio platform for the Ummah. His vision: make beautiful Islamic content just one tap away for every Muslim on Earth.\n\n_"This app is my sadaqah jariyah — may every heart that finds peace through it be counted as a blessing."_ — Rizwan Siddiqui`,
    `The mind behind QalbAudio is Rizwan Siddiqui 🌙\n\nA developer with a mission — Rizwan built QalbAudio to bring the Quran, Nasheeds, and Islamic knowledge to your fingertips. Every feature, every design choice, every line of code is his dedication to the Ummah.\n\nMay Allah reward him abundantly! 🤲`,
    `QalbAudio is the creation of Rizwan Siddiqui ✨\n\nFueled by faith and passion for Islamic content, Rizwan designed and developed this platform so Muslims everywhere could access spiritual audio with ease. His work is truly a gift to the community. Barakallahu feek, Rizwan! 💚`,
  ],
  about_creator: [
    `Rizwan Siddiqui — Founder & Developer of QalbAudio 👨‍💻\n\n• 💡 Visionary behind the QalbAudio platform\n• 🕌 Passionate about making Islamic content accessible\n• 💻 Built QalbAudio from the ground up with love for the Ummah\n• 🌍 Mission: Connect every Muslim heart to spiritual audio\n• 🤲 Sees QalbAudio as a form of sadaqah jariyah\n\nRizwan poured his heart and skills into creating something that serves the entire Muslim community. May Allah bless his efforts!`,
    `Meet Rizwan Siddiqui — the heart behind QalbAudio 🌟\n\nRizwan is a dedicated Muslim developer whose dream was to build a platform where the Ummah could access Quran, Nasheeds, du'a, and lectures all in one place. QalbAudio is that dream, now in your hands.\n\nYou can connect with Rizwan through QalbAudio's official channels. JazakAllahu Khayran for supporting his work! 🤲`,
  ],
  creator_vision: [
    `Rizwan Siddiqui's Vision for QalbAudio** 🌙\n\n_"Every Muslim deserves a beautiful, easy way to connect with Islamic audio — whether it's the Quran at Fajr, a Nasheed on the road, or a lecture before sleep."_\n\nRizwan built QalbAudio to be more than an app — it's a spiritual companion. His vision includes:\n• 🌍 Global Ummah connected through audio\n• 📖 Quran accessible in every language\n• 🎵 Islamic artists celebrated worldwide\n• 🤲 Every user finding peace through sound\n\nMay Allah make this vision a reality! Ameen.`,
    `Rizwan Siddiqui dreamed of a world where every Muslim — no matter where — could reach for their phone and find peace 🌿\n\nQalbAudio is that dream made real. Rizwan's vision is rooted in the belief that technology can be a bridge to the Divine — one Nasheed, one recitation, one du'a at a time.\n\n_"If one person finds Allah through QalbAudio, that is everything."_ — Rizwan Siddiqui 💚`,
  ],
  nasheed_top: [
    `Top Nasheeds on QalbAudio right now 🎵🌟\n\n1. Maher Zain — 'Rahmatun Lil'Alameen'\n2. Sami Yusuf — 'Al-Mu'allim'\n3. Mesut Kurtis — 'Burdah'\n4. Humood AlKhudher — 'Kun Anta'\n5. Harris J — 'Salam'\n6. Ahmed Bukhatir — 'Forgive Me'\n7. Maher Zain — 'Ya Nabi Salam Alayka'\n8. Sami Yusuf — 'Hasbi Rabbi'\n\nAll streamed millions of times — a true Nasheed hall of fame! 🎶`,
    `Can't go wrong with these Nasheed classics 🌙\n\n✨ Maher Zain — 'Insha Allah' (timeless!)\n✨ Sami Yusuf — 'You Came to Me'\n✨ Mesut Kurtis — 'Salawat'\n✨ Harris J — 'You Are My World'\n✨ Humood — 'Alhamdulillah'\n✨ Ahmed Bukhatir — 'All Praise is to Allah'\n\nPick any one and your heart will thank you! 💚`,
    `Today's top Nasheed picks from QalbAudio 🎵\n\n🥇 Maher Zain — 'SubhanAllah'\n🥈 Sami Yusuf — 'Free'\n🥉 Mesut Kurtis — 'Wherever I Am'\n4. Humood — 'Tabassam'\n5. Harris J — 'Love Who You Are'\n6. Ahmed Bukhatir — 'Forgive Me'\n\nEvery track is a reminder of Allah's mercy and beauty! 🤲`,
  ],
  maher_zain: [
    `Maher Zain's must-listen tracks on QalbAudio 🌟\n\n• 'Rahmatun Lil'Alameen' — his greatest anthem\n• 'Ya Nabi Salam Alayka' — pure love for the Prophet ﷺ\n• 'Insha Allah' — timeless and comforting\n• 'SubhanAllah' — uplifting and joyful\n• 'Allahu Allah' — perfect for night listening\n• 'Number One for Me' — a different, emotional side\n\nAvailable in Arabic, English & French on QalbAudio! 🎵`,
    `Maher Zain Essentials 🎶\n\nIf you haven't heard these yet, you're in for something beautiful:\n• 'Baraka Allahu Lakuma' — wedding favourite\n• 'Hold My Hand' — powerful message\n• 'Guide Me All The Way' — perfect for new Muslims\n• 'Palestine Will Be Free' — moving and powerful\n• 'Open Your Eyes' — thoughtful and deep\n\nMaher Zain continues to touch millions of hearts worldwide. 💚`,
  ],
  sami_yusuf: [
    `Sami Yusuf's soulful best on QalbAudio 🎵\n\n• 'Al-Mu'allim' — the song that started it all\n• 'Supplication' — deeply spiritual\n• 'You Came to Me' — emotional and beautiful\n• 'Free' — modern and meaningful\n• 'Hasbi Rabbi' — classic favourite\n• 'The Creator' — pure devotion\n\nHis voice carries a rare spiritual weight. A true legend! 🌟`,
    `Sami Yusuf — Artist Profile on QalbAudio 🌙\n\nBorn in London, raised in music and Islam, Sami Yusuf became the world's first global Islamic music star. His tracks blend Eastern and Western sounds into pure soul:\n\n🎵 'Al-Mu'allim' — over 500M listens globally\n🎵 'Asma Allah' — Arabic masterpiece\n🎵 'Try Not to Cry' — Palestinian solidarity\n🎵 'Healing' — hauntingly beautiful\n\nFind his full discography on QalbAudio! 💚`,
  ],
  mesut_kurtis: [
    `Mesut Kurtis — deeply moving, classically rooted 🌙\n\nTop tracks on QalbAudio:\n• 'Burdah' — a timeless classic reimagined\n• 'Lean On Me' — heartwarming\n• 'Salawat' — pure love for the Prophet ﷺ\n• 'Wherever I Am' — reflective and calming\n• 'Ya Allah' — intimate du'a set to music\n\nHis British-Macedonian-Arab fusion sound is truly one of a kind! 🎵`,
  ],
  harris_j: [
    `Harris J — the voice of a new Muslim generation 🎵\n\nHis best tracks on QalbAudio:\n• 'Salam' — his breakthrough hit\n• 'You Are My World' — emotional and sweet\n• 'Love Who You Are' — positive and uplifting\n• 'Beautiful Names' — inspired by Allah's 99 names\n• 'Tonight' — modern Islamic pop at its best\n\nPerfect for younger listeners and those new to Nasheeds! 🌟`,
  ],
  humood: [
    `Humood AlKhudher — positivity and joy in every track! 🌟\n\nQalbAudio's Humood collection:\n• 'Kun Anta' — be yourself, the global hit!\n• 'Alhamdulillah' — pure gratitude and joy\n• 'Lughat Al-Aalam' — celebrating unity\n• 'Tabassam' — 'smile', because it's Sunnah!\n• 'Khotwah' — inspiring and motivational\n\nHis upbeat, modern style will have you smiling and singing! 😊💚`,
    `'Kun Anta' alone is enough reason to love Humood 🌙\n\nBut his full QalbAudio catalogue is equally wonderful:\n• 'Afwan' (I'm Sorry) — soft and sincere\n• 'Jaddid' — refresh and renew\n• 'Akbar' — Allah is Greater\n\nFun fact: 'Kun Anta' was among the most-played Nasheeds on digital platforms worldwide! 🎵`,
  ],
  nasheed_arabic: [
    `Pure Arabic Nasheeds on QalbAudio 🎵\n\n• Ahmed Bukhatir — classical Arabic style\n• Mesut Kurtis — modern Arabic fusion\n• Mishary Alafasy — Nasheeds between recitations\n• Humood AlKhudher — contemporary Arabic pop\n• Sami Yusuf — 'Asma Allah' and more\n\nArabic Nasheeds carry the original beauty of Islamic poetry. A treasure for the soul! 📖`,
  ],
  nasheed_english: [
    `English Nasheeds for every heart 🎵\n\n• Maher Zain — 'Insha Allah', 'Open Your Eyes'\n• Harris J — 'Salam', 'You Are My World'\n• Sami Yusuf — 'Free', 'You Came to Me'\n• Dawud Wharnsby — storytelling through song\n• Zain Bhikha — 'Mountains of Makkah'\n\nEnglish Nasheeds make Islamic music accessible to millions worldwide. Beautiful and meaningful! 💚`,
  ],
  nasheed_urdu: [
    `Urdu Nasheeds & Hamd on QalbAudio 🌙🇵🇰\n\n• Junaid Jamshed — 'Dil Dil Pakistan' & Hamd\n• Sami Yusuf — Urdu releases\n• Atif Aslam — Islamic songs\n• Naat recitations in Urdu\n• Soulful Sufi-style qawwali audio\n\nUrdu Nasheeds carry centuries of Islamic poetic tradition. Filter by Urdu in the app! 💚`,
  ],
  surah_fatiha: [
    `Surah Al-Fatiha — The Opening 📖\n\nThe most recited surah in the Quran — recited 17 times daily in Salah. It contains the entire essence of the Quran in 7 verses.\n\nBeautiful recitations on QalbAudio:\n• Mishary Alafasy — haunting and clear\n• Maher Al-Mueaqly — powerful and resonant\n• Abdul Basit — the classic choice\n\n_"All praise is due to Allah, Lord of all the worlds."_ 🤲`,
  ],
  surah_baqarah: [
    `Surah Al-Baqarah — The Cow 📖\n\nThe longest surah in the Quran at 286 verses. The Prophet ﷺ said: _"Recite Al-Baqarah, for holding onto it is a blessing and leaving it is regret, and the sorcerers cannot deal with it."_\n\nOn QalbAudio:\n• Full recitation by Al-Sudais (3h30m)\n• Mishary Alafasy's beautiful version\n• Last 2 ayahs as a separate track\n\nFill your home with its barakah! 🌙`,
  ],
  surah_kahf: [
    `Surah Al-Kahf — The Cave 📖\n\nSunnah to recite every Friday for protection from Dajjal. Its 4 stories carry timeless wisdom on faith, wealth, knowledge, and power.\n\nQalbAudio picks:\n• Al-Sudais — majestic and powerful\n• Mishary Alafasy — smooth and meditative\n• Saad Al-Ghamdi — deeply moving\n\nSet a Friday reminder on QalbAudio to never miss it! 🌟`,
  ],
  surah_yasin: [
    `Surah Yasin — Heart of the Quran 📖\n\n_"Everything has a heart, and the heart of the Quran is Yasin."_ — Prophet Muhammad ﷺ\n\nOften recited for the ill, the dying, and the deceased. Its 83 verses are a complete spiritual journey.\n\nQalbAudio reciters:\n• Mishary Alafasy — most beloved version\n• Ahmad Al-Ajmi — clear and emotional\n• Maher Al-Mueaqly — uplifting\n\nListen every Friday morning for maximum barakah! 🤲`,
  ],
  surah_rahman: [
    `Surah Ar-Rahman — The Most Merciful 📖\n\n_"Which of the favours of your Lord will you deny?"_ — the refrain that echoes 31 times through this breathtaking surah.\n\nIts rhythmic beauty makes it the most recited surah after Al-Fatiha. On QalbAudio:\n• Mishary Alafasy — spine-tingling\n• Abdul Basit — the gold standard\n• Sudais — Haramain quality\n\nListen when you need to be reminded of Allah's infinite gifts 🌿`,
  ],
  surah_mulk: [
    `Surah Al-Mulk — The Sovereignty 📖\n\nThe Prophet ﷺ said it intercedes for its reciter until they are forgiven. Recite it every night before sleep.\n\n30 verses | ~8 minutes to listen\n\nQalbAudio picks for night listening:\n• Mishary Alafasy — calm and clear\n• Al-Sudais — deep and powerful\n• Ahmad Al-Ajmi — gentle and melodic\n\nMake it part of your nightly routine — your best sleep companion! 🌙`,
  ],
  ayatul_kursi: [
    `Ayatul Kursi — The Throne Verse 🤲\n\nThe greatest verse in the Quran (Quran 2:255). Recite it:\n• After every Fardh prayer\n• Before sleeping\n• Leaving the house\n\nThe Prophet ﷺ said whoever recites it after prayer, nothing stands between them and Jannah except death.\n\nFind beautiful slow recitations on QalbAudio — learn it by heart! 📖`,
  ],
  mishary: [
    `Sheikh Mishary Rashid Alafasy 📖\n\nThe Kuwaiti qari whose voice has recited Quran into millions of hearts. His recitation style (Hafs) is among the most downloaded worldwide.\n\nOn QalbAudio:\n• Complete Quran recitation\n• Individual surah audio\n• Nasheed collection\n• Du'a & Adhkar recordings\n\nFun fact: His 'Surah Al-Fatiha' alone has over a billion streams across platforms! SubhanAllah 🌟`,
  ],
  sudais: [
    `Sheikh Abdul Rahman Al-Sudais 🕋\n\nThe Imam of Masjid Al-Haram in Makkah — his voice is the voice of the Kaaba for millions. Powerful, emotional, and profoundly moving.\n\nQalbAudio features:\n• Full Quran — Hafs recitation\n• Tarawih prayer recordings\n• Friday Khutbahs from Makkah\n• Special Ramadan recitations\n• Du'a Al-Qunut (Isha Qunoot)\n\nListening to him transports you straight to Masjid Al-Haram. 🤲`,
  ],
  quran_tips: [
    `Tips for a deeper Quran listening experience 📖✨\n\n1. 🧘 Choose a quiet, clean space\n2. 📿 Start with wudu if possible\n3. 📖 Follow along with a Mushaf\n4. 🔁 Repeat verses that move you\n5. 🌅 Morning recitation unlocks barakah in your day\n6. 🌙 Night recitation brings peace to sleep\n7. 📚 Listen with translation to understand deeply\n\nStart with short surahs and build your relationship with the Quran day by day! 💚`,
  ],
  nouman: [
    `Nouman Ali Khan — Quran Teacher to Millions 🎓📖\n\nHis accessible, energetic style makes Arabic grammar and Quran tafsir exciting for everyone. Must-listen lectures on QalbAudio:\n\n• 'Surah Al-Baqarah Tafsir' — life-changing\n• 'Divine Speech' — why the Quran is miraculous\n• 'Surah Yusuf' — heartfelt and dramatic\n• Arabic for Beginners series\n• Ramadan Gems daily series\n\nIf you've never understood the Quran, start with Nouman. 💙`,
  ],
  mufti_menk: [
    `Mufti Ismail Menk — Warm Wisdom for Every Muslim 🎓\n\nThe Zimbabwean scholar whose approachable style has made him one of the most followed Islamic figures globally. On QalbAudio:\n\n• 'Motivational Moments' series\n• Lectures on marriage & family\n• Mental health from an Islamic perspective\n• Ramadan daily lectures\n• 'Don't Lose Hope' series\n\nHis talks feel like advice from a caring uncle. 💚`,
  ],
  omar_suleiman: [
    `Sheikh Omar Suleiman — History, Heart & Soul 🎓✨\n\nFounder of Yaqeen Institute and one of America's most influential Muslim voices. His QalbAudio collection:\n\n• 'Stories of the Prophets' — epic series\n• 'The Firsts' — Sahaba stories\n• 'Angels in Your Presence' — Ramadan gem\n• 'Qur'an 30 for 30' — Ramadan tafsir\n• Civil rights & Islamic ethics lectures\n\nWarning: You will cry. And that's okay. 🤲`,
  ],
  hamza_yusuf: [
    `Sheikh Hamza Yusuf — Classical Islamic Scholarship 🎓📚\n\nAmerican convert and master of traditional Islamic sciences. His talks combine Western philosophy, Arabic poetry, and deep Islamic wisdom.\n\nQalbAudio highlights:\n• 'Purification of the Heart' — classic\n• Rumi & Islamic Poetry lectures\n• 'Islam and the Problem of Evil'\n• Arabic language lectures\n• 'The Content of Character'\n\nIf you want depth, this is your scholar. 🌙`,
  ],
  yasmin: [
    `Yasmin Mogahed — Healing Hearts with Words 🎓💚\n\nAmerican author and speaker known for emotional, introspective talks on the soul, healing, and Allah. On QalbAudio:\n\n• 'Reclaim Your Heart' — must-listen\n• 'Trauma & Healing from an Islamic Lens'\n• 'Attachments & the Dunya'\n• 'Love, Marriage & the Path to Allah'\n• 'Finding God in the Darkness'\n\nIf your heart is heavy, her voice is medicine. 🤲`,
  ],
  bilal: [
    `Dr. Bilal Philips — Islamic Education Made Simple 🎓📚\n\nCanadian-Jamaican convert who made Islamic education accessible worldwide. Perfect for new Muslims and those rebuilding their faith. QalbAudio features:\n\n• 'Fundamentals of Tawheed'\n• 'Islamic Studies' series\n• 'New Muslim Guide'\n• Fiqh of everyday life\n• Critical thinking & Islam\n\nJazakAllahu Khayran Dr. Bilal for decades of service to the Ummah! 🌟`,
  ],
  khutbah: [
    `Friday Khutbah Collection on QalbAudio 🕌\n\nMake the most of Jumu'ah with powerful Khutbahs:\n\n• Al-Sudais from Masjid Al-Haram, Makkah\n• Al-Hudhaify from Madinah\n• Mufti Menk — contemporary topics\n• Omar Suleiman — social & spiritual\n• Nouman Ali Khan — Quran-based\n\nFilter by language, topic, or duration. May Allah accept your Jumu'ah! 🌙`,
  ],
  seerah: [
    `Seerah — The Life of Prophet Muhammad ﷺ 🌙\n\nKnowing the Prophet ﷺ is knowing Islam. Best Seerah series on QalbAudio:\n\n• Omar Suleiman — 'The Messenger' series\n• Yasir Qadhi — detailed 100+ lecture series\n• Mufti Menk — 'Pearls from the Seerah'\n• Anwar Al-Awlaki — 'Life of the Prophet'\n\nSending Salawat on the Prophet ﷺ is the greatest act of love. Listen and fall in love with him ﷺ! 🤲`,
  ],
  morning_adhkar: [
    `Morning Adhkar — Start with Allah's Name 🌅🤲\n\nThe Prophet ﷺ taught us to begin every morning with remembrance. QalbAudio's Morning Adhkar collection includes:\n\n• Ayatul Kursi recitation\n• 'Subhanallah wa bihamdihi' x33\n• Du'a after waking up\n• Morning protection adhkar\n• Full 15-minute guided morning routine\n\nListen with intention every Fajr and watch your days transform! 🌟`,
  ],
  evening_adhkar: [
    `Evening Adhkar — End the Day with Gratitude 🌙🤲\n\nProtect yourself before darkness falls:\n\n• Evening protection duas (Mu'awwidhatayn)\n• 'A'udhu bi kalimatillahi at-tammati' x3\n• Surah Al-Mulk\n• Salawat on the Prophet ﷺ x10\n• Full 15-minute evening routine\n\nA beautiful QalbAudio playlist: 'Evening Serenity' — the perfect way to close your day. 🌿`,
  ],
  dua_anxiety: [
    `Du'a for Anxiety & Stress 🤲💚\n\nMay Allah ease every heart.\n\n_"Allahumma inni a'udhu bika minal-hammi wal-hazan"_\n(O Allah, I seek refuge in You from worry and grief)\n\nQalbAudio's peace collection:\n• Surah Ad-Duha recitation\n• Surah Ash-Sharh\n• 'La ilaha illa anta subhanaka inni kuntu minaz-zalimin'\n• Yasmin Mogahed's 'Healing' lecture\n• Calm Nasheed: 'Insha Allah' by Maher Zain\n\nVerily, with every hardship comes ease. (94:5) 🌿`,
  ],
  dua_sleep: [
    `Du'a & Audio Before Sleep 🌙\n\nThe Prophet ﷺ had a beautiful pre-sleep routine. Follow it with QalbAudio:\n\n• Ayatul Kursi — protection all night\n• Last 2 ayahs of Al-Baqarah\n• Surah Al-Mulk — intercedes for its reciter\n• 'Bismika Allahumma amutu wa ahya'\n• 3x Surah Al-Ikhlas, Al-Falaq, An-Nas\n\nSet QalbAudio's sleep timer and drift off in the remembrance of Allah. 💚`,
  ],
  dua_travel: [
    `Du'a for Travel & Journey 🚗✈️🤲\n\n_"Subhanalladhi sakhkhara lana hadha wa ma kunna lahu muqrinin"_\n(Glory to Him who has subjected this to us...)\n\nQalbAudio's Travel Pack:\n• Du'a for entering a vehicle\n• Du'a for a new city/place\n• Surah Al-Quraysh\n• Travel protection adhkar\n• Upbeat Nasheeds for the road\n\nMay Allah grant every traveller safety and ease! 🌍`,
  ],
  istighfar: [
    `Istighfar — Seeking Forgiveness 🤲💙\n\n_"Astaghfirullah al-'Azim alladhi la ilaha illa huwa al-Hayy al-Qayyum wa atubu ilayk"_\n\nThe Prophet ﷺ said he sought forgiveness 70-100 times a day. How much more do we need it?\n\nQalbAudio's Istighfar collection:\n• Mishary Alafasy — 'Astaghfirullah'\n• Guided Istighfar audio (1000 in 10 mins)\n• Surah Nuh — full of istighfar\n• 'Forgive Me' — Ahmed Bukhatir\n\nAllah loves those who seek His forgiveness. Keep asking. 🌙`,
  ],
  ramadan_playlist: [
    `The Perfect Ramadan Audio Journey 🌙✨\n\n🌅 Fajr: Surah Al-Mulk + Morning Adhkar\n☀️ Morning: Quran tafsir by Nouman Ali Khan\n🕌 Dhuhr: Short Nasheeds by Maher Zain\n📖 Asr: Quran recitation — 1 juz\n🌙 Maghrib (Iftar): 'Allahu Allah' — soft Nasheed\n🕌 Isha/Tarawih: Al-Sudais full recitation\n🌃 Night: Yasmin Mogahed + Surah Al-Baqarah\n\nRamadan Mubarak! May Allah accept every moment. 🤲`,
    `Ramadan on QalbAudio — a full spiritual soundtrack 🌙\n\n• 'Ramadan' by Maher Zain — the ultimate Ramadan anthem\n• Tarawih from Masjid Al-Haram nightly\n• 'Thirty for Thirty' Quran series\n• Daily du'a for iftar & suhoor\n• Laylatul Qadr special collection\n\nMay this Ramadan be your best yet. Allahu Akbar! 🌟`,
  ],
  eid_audio: [
    `Eid Mubarak! 🎉🌙\n\nCelebrate with QalbAudio's Eid collection:\n• Eid Takbeerat — 'Allahu Akbar, Allahu Akbar...'\n• Maher Zain — 'Eid' & 'Ya Ilahi'\n• 'Eid Mubarak' by various artists\n• Eid Khutbah recordings\n• Nasheed: 'This is Eid' — Harris J\n\nTakbeer on the day of Eid is Sunnah — start it loud and proud! 🎊`,
  ],
  jumuah: [
    `Blessed Friday Mubarak! 🕌🌙\n\nYour Jumu'ah audio guide on QalbAudio:\n\n📖 Morning: Surah Al-Kahf (Sunnah!)\n🤲 Du'a: Abundant salawat on the Prophet ﷺ\n🎵 Pre-Khutbah: 'Ya Nabi Salam Alayka' — Maher Zain\n🕌 Khutbah: Al-Sudais or local scholar recording\n🌙 After Isha: Surah As-Sajdah + Al-Insan\n\nMay Allah accept your Jumu'ah and grant you the best hour of du'a! 🤲`,
  ],
  hajj: [
    `May Allah accept your Hajj or Umrah! 🕋🤲\n\nPrepare spiritually with QalbAudio:\n• Talbiyah audio — 'Labbayk Allahumma Labbayk'\n• Duas for each Hajj ritual (Tawaf, Sa'i, Arafat)\n• 'Stories of Hajj' — Omar Suleiman\n• Bilal Philips — 'Hajj: The Complete Guide'\n• Nasheeds about Makkah & Madinah\n• Live Haramain recitations\n\nAllahu Akbar! Hajj Mabroor wa Sa'yun Mashkoor! 🌟`,
  ],
  wedding: [
    `Mabrook on your Nikah! 💍🌙\n\nPerfect Islamic wedding audio from QalbAudio:\n\n🎵 Entrance: Maher Zain — 'Baraka Allahu Lakuma'\n🎵 Reception: Sami Yusuf — 'You Came to Me'\n🎵 Emotional: Mesut Kurtis — 'Lean On Me'\n🎵 Celebration: Humood — 'Kun Anta'\n🤲 Du'a for the couple audio\n📖 Surah Ar-Rum recitation\n\nMay Allah bless your union with love, mercy, and barakah! 🌿`,
  ],
  mawlid: [
    `Mawlid Celebration — Praising the Best of Creation ﷺ 🌙\n\nQalbAudio's Mawlid collection:\n• 'Ya Nabi Salam Alayka' — Maher Zain\n• 'Madad Ya Rasulallah' — Mesut Kurtis\n• 'Burdah' — the classical poem of love\n• Seerah lectures on the Prophet's birth\n• Salawat compilation playlists\n\nSending Salawat is the most beloved dhikr of Mawlid. 🤲 Allahumma salli ala Muhammad!`,
  ],
  fajr: [
    `Start Fajr right with QalbAudio 🌅🌙\n\nThe Prophet ﷺ said the 2 rak'ahs of Fajr are better than the world and everything in it.\n\nYour Fajr audio guide:\n• Surah Al-Waqi'ah — for barakah in rizq\n• Morning Adhkar (15 mins)\n• Maher Zain — 'SubhanAllah'\n• Surah Al-Mulk if you missed it at night\n• Short Quran juz to start your day\n\nA blessed Fajr sets the tone for the entire day! ✨`,
  ],
  isha: [
    `Isha & Night Audio on QalbAudio 🌙\n\nAfter the last prayer, the night belongs to Allah:\n\n• Surah As-Sajdah (Sunnah on Fridays)\n• Surah Al-Insan\n• Tarawih recordings (Ramadan)\n• Mufti Menk — 'Night Reflections'\n• Gentle Nasheed: 'Allahu Allah'\n• Prepare for Tahajjud with a 2am alarm reminder\n\nThe best of people are those who remember Allah in the night! 🤲`,
  ],
  sleep_audio: [
    `Drift to sleep in Allah's remembrance 🌙💚\n\nQalbAudio's Before Sleep playlist:\n\n• Ayatul Kursi (2:255) — protection\n• Surah Al-Mulk — intercession\n• Last 2 ayahs of Al-Baqarah\n• Evening adhkar audio (10 mins)\n• Soft Nasheed: 'Insha Allah' — Maher Zain\n• Set QalbAudio's built-in sleep timer ⏱️\n\nThe Prophet ﷺ slept on his right side after these. Try it tonight! 🌿`,
  ],
  study: [
    `Study & Focus with QalbAudio 📚✨\n\nBest background audio for studying:\n\n• Quran recitation (no translation) — brings barakah\n• Surah Al-Kahf on loop — concentration\n• Acapella Nasheeds — no distraction\n• Mishary Alafasy — soft continuous recitation\n• Short surah loop: Al-Ikhlas, Al-Falaq, An-Nas\n\nThe Quran was revealed as guidance — let it fill your study space! 📖`,
  ],
  travel: [
    `Islamic Road Trip Playlist 🚗✨\n\nMake every journey an act of worship:\n\n🎵 Humood — 'Kun Anta' (upbeat start!)\n🎵 Maher Zain — 'Number One for Me'\n📖 Short surahs by Mishary (Al-Kahf)\n🤲 Du'a for travel (plays automatically)\n🎓 Mufti Menk — commute-length lectures\n🎵 Harris J — 'You Are My World'\n\nMay Allah grant you safe travels wherever you go! 🌍🤲`,
  ],
  stress: [
    `May Allah ease your heart 🤲💚\n\nFor peace and calm, QalbAudio recommends:\n\n• Surah Ar-Rahman — 'Which favour will you deny?'\n• Surah Ad-Duha — for those who feel alone\n• Yasmin Mogahed — 'When You're Broken'\n• Du'a for anxiety: 'Allahumma inni a'udhu bika'\n• Maher Zain — 'Insha Allah'\n• Surah Al-Inshirah — ease is with hardship\n\n_"Verily with hardship comes ease. Verily with hardship comes ease."_ (94:5-6) 🌿`,
  ],
  kids: [
    `Islamic Audio for Little Hearts 🌟👶\n\nQalbAudio's Children's Collection:\n\n• Short surah recitations (Al-Ikhlas, Al-Falaq, An-Nas)\n• Islamic alphabet & numbers audio\n• 'Stories of the Prophets for Kids'\n• Children's Nasheeds — fun and educational\n• 'My First Quran' listening series\n• Animated story audio: Ibrahim, Musa, Yusuf ﷺ\n\nPlanting the seed of love for Islam early is the greatest gift! 💚`,
  ],
  how_search: [
    `Navigating QalbAudio is simple! 🔍\n\n1. 🔎 Use the Search bar — type surah name, artist, or topic\n2. 📂 Browse Categories — Quran, Nasheeds, Lectures, Du'a\n3. 🌍 Filter by language — Arabic, English, Urdu & more\n4. ⏱️ Filter by duration — short clips to full albums\n5. ❤️ Tap heart to save to Favourites\n6. ➕ Tap '+' to add to a Playlist\n\nIs there something specific I can help you find today? 🌙`,
  ],
  create_playlist: [
    `Create your own spiritual playlist on QalbAudio 🎵\n\nHere's how:\n1. Find any audio track\n2. Tap the '+' icon\n3. Select 'New Playlist'\n4. Give it a name (e.g., 'Friday Vibes')\n5. Keep adding tracks!\n\nPlaylist ideas to try:\n• 'Morning Blessings' 🌅\n• 'Ramadan Nights' 🌙\n• 'Road Trip Nasheeds' 🚗\n• 'Before Sleep' 💤\n\nYour playlists, your spiritual journey! 🤲`,
  ],
  favourites: [
    `Save your favourite Islamic audio ❤️\n\nIt's easy:\n1. Find any track on QalbAudio\n2. Tap the ❤️ heart icon\n3. Saved to Profile → Favourites\n4. Access anytime, even offline (Premium)\n\nBuild your personal collection of:\n• Your favourite surahs\n• Go-to Nasheeds\n• Scholars you love\n• Special du'a recordings\n\nYour QalbAudio favourites = your spiritual home! 🏡💚`,
  ],
  offline: [
    `Listen offline — anytime, anywhere 📥\n\nQalbAudio Premium lets you:\n• Download any Quran surah\n• Save Nasheeds for the road\n• Store lectures for flights\n• Access in no-signal areas\n\nHow to download:\n1. Find your audio\n2. Tap the ⬇️ download icon\n3. Access via Profile → Downloads\n\nPerfect for planes ✈️, underground 🚇, or data-saving mode! 🌍`,
  ],
  upload: [
    `Share Islamic audio with the Ummah 📤\n\nUpload to QalbAudio:\n1. Profile → Upload Audio\n2. Choose your file\n3. Add title, artist & category\n4. Submit for review\n5. Once approved — the Ummah can benefit!\n\nEvery listener who benefits = sadaqah jariyah for you. 🤲\n\nWhat will you share? A Nasheed? A lecture? A du'a? JazakAllahu Khayran in advance! 💚`,
  ],
  account: [
    `Your QalbAudio account unlocks everything 👤\n\nWith a free account:\n• ❤️ Save Favourites\n• 🎵 Create Playlists\n• 📤 Upload content\n• 📜 Listening history\n• 🔔 Reminder notifications\n\nWith Premium:\n• 📥 Offline downloads\n• 🚫 Ad-free listening\n• 🎧 High quality audio\n• 🌟 Exclusive collections\n\nRegister free at QalbAudio today — your spiritual journey awaits! 🌙`,
  ],
  feedback: [
    `We love hearing from you! 💬\n\nTo share feedback or report an issue:\n• ⚙️ Settings → Send Feedback\n• 🚩 'Report' button on any audio\n• 📧 Email via the Contact page\n\nYour feedback helps QalbAudio grow and serve the Ummah better. Every suggestion is read and considered. 🤲\n\nJazakAllahu Khayran for helping us improve — you're part of this community! 💚`,
  ],
};

// ─── Get varied reply ─────────────────────────────────────────────────────────
const getReply = (prompt) => {
  const variants = RESPONSES[prompt];
  if (!variants) return "SubhanAllah, I'm not sure about that one! 🤲 Please choose one of the options below to explore QalbAudio's collection.";
  return variants[Math.floor(Math.random() * variants.length)];
};

// ─── Message bubble ───────────────────────────────────────────────────────────
const MessageBubble = ({ msg }) => {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 10,
        gap: 8,
        alignItems: "flex-end",
      }}
    >
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 12px rgba(var(--app-accent-rgb),0.3)",
          marginBottom: 2,
        }}>
          <Bot size={14} color="#041307" />
        </div>
      )}
      <div style={{
        maxWidth: "78%",
        padding: "10px 14px",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        background: isUser
          ? "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))"
          : "rgba(var(--app-accent-rgb),0.08)",
        border: isUser ? "none" : "1px solid rgba(var(--app-accent-rgb),0.14)",
        color: isUser ? "#041307" : "var(--app-text-main)",
        fontSize: 13.5,
        lineHeight: 1.6,
        fontFamily: "'DM Sans',sans-serif",
        fontWeight: isUser ? 600 : 400,
        boxShadow: isUser ? "0 6px 20px rgba(var(--app-accent-rgb),0.22)" : "none",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}>
        {msg.content}
      </div>
    </motion.div>
  );
};

// ─── Initial messages ─────────────────────────────────────────────────────────
const getInitialMessages = (user) => ([
  {
    role: "assistant",
    content: `Assalamu Alaikum${user?.username ? `, ${user.username}` : ""}! 🌙\n\nWelcome to QalbAudio — your spiritual audio companion!\n\nThis app was lovingly built by Rizwan Siddiqui, founder of QalbAudio, with a mission to connect Muslim hearts worldwide to the beauty of Islamic audio. 🤲\n\nChoose a topic below to explore our collection — tap any option to get started!`,
  }
]);

// ─── Main ChatBotPopup ────────────────────────────────────────────────────────
const ChatBotPopup = ({ onClose, user }) => {
  const [messages, setMessages] = useState(() => getInitialMessages(user));
  const [view, setView] = useState("home"); // "home" | "category"
  const [activeCategory, setActiveCategory] = useState(null);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" ? window.innerWidth < 600 : false
  );
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleOption = (option, categoryLabel) => {
    const reply = getReply(option.prompt);
    setMessages(prev => [
      ...prev,
      { role: "user", content: option.label },
      { role: "assistant", content: reply },
    ]);
    setView("home");
    setActiveCategory(null);
  };

  const handleCategory = (cat) => {
    setActiveCategory(cat);
    setView("category");
  };

  const clearChat = () => {
    setMessages(getInitialMessages(user));
    setView("home");
    setActiveCategory(null);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        .chatbot-option-btn:hover { background: rgba(var(--app-accent-rgb),0.16) !important; border-color: rgba(var(--app-accent-rgb),0.45) !important; transform: translateY(-1px); }
        .chatbot-cat-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .chatbot-clear-btn:hover { background: rgba(var(--app-accent-rgb),0.1) !important; }
        .chatbot-messages-scroll::-webkit-scrollbar { width: 4px; }
        .chatbot-messages-scroll::-webkit-scrollbar-track { background: transparent; }
        .chatbot-messages-scroll::-webkit-scrollbar-thumb { background: rgba(var(--app-accent-rgb),0.22); border-radius: 4px; }
        .chatbot-back-btn:hover { background: rgba(var(--app-accent-rgb),0.12) !important; }
      `}</style>

      {isMobile && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, backdropFilter: "blur(4px)" }}
        />
      )}

      <motion.div
  initial={{ opacity: 0, y: isMobile ? 40 : -12, scale: isMobile ? 1 : 0.96 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: isMobile ? 40 : -12, scale: isMobile ? 1 : 0.96 }}
  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
  style={{
    position: "fixed",
    top: isMobile ? 0 : 80,
    right: isMobile ? 0 : 28,
    left: isMobile ? 0 : "auto",
    bottom: isMobile ? 0 : "auto",
    transform: "none",
    width: isMobile ? "100%" : 400,
    height: isMobile ? "100%" : 580,
    maxHeight: isMobile ? "100dvh" : 580,
    zIndex: 201,
    display: "flex", flexDirection: "column",
    borderRadius: isMobile ? 0 : 24,
    background: "var(--app-surface-solid)",
    border: isMobile ? "none" : "1px solid rgba(var(--app-accent-rgb),0.22)",
    boxShadow: "0 32px 80px rgba(0,0,0,0.36), 0 0 0 1px rgba(var(--app-accent-rgb),0.06)",
    overflow: "hidden",
  }}
>
        {/* ── HEADER ── */}
        <div style={{
          padding: "16px 18px",
          background: "linear-gradient(135deg,rgba(var(--app-accent-rgb),0.12) 0%,rgba(var(--app-accent-rgb),0.04) 100%)",
          borderBottom: "1px solid rgba(var(--app-accent-rgb),0.12)",
          display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
          position: "relative",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: "linear-gradient(90deg,transparent,rgba(var(--app-accent-rgb),0.6) 40%,var(--app-accent) 50%,rgba(var(--app-accent-rgb),0.6) 60%,transparent)",
          }} />
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 22px rgba(var(--app-accent-rgb),0.35)",
            }}
          >
            <Bot size={20} color="#041307" strokeWidth={2.2} />
          </motion.div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 800, fontSize: 15, color: "var(--app-text-main)" }}>
              QalbAudio Assistant
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", display: "inline-block" }} />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11.5, color: "var(--app-text-muted)", fontWeight: 500 }}>
                Online · by Rizwan Siddiqui
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="chatbot-clear-btn" onClick={clearChat} title="Clear chat" style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(var(--app-accent-rgb),0.06)",
              border: "1px solid rgba(var(--app-accent-rgb),0.16)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--app-text-muted)", transition: "all 0.2s ease",
            }}>
              <RotateCcw size={13} />
            </button>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.22)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#f87171", transition: "all 0.2s ease",
            }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── MESSAGES ── */}
        <div
          className="chatbot-messages-scroll"
          style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column" }}
        >
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
          <div ref={messagesEndRef} />
        </div>

        {/* ── BOTTOM PANEL: Category Grid or Options List ── */}
        <div style={{
          borderTop: "1px solid rgba(var(--app-accent-rgb),0.1)",
          background: "rgba(var(--app-accent-rgb),0.02)",
          flexShrink: 0,
          maxHeight: 240,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}>
          <AnimatePresence mode="wait">
            {view === "home" ? (
              <motion.div
                key="home"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22 }}
                style={{ padding: "12px 14px 14px", overflowY: "auto" }}
              >
                <div style={{
                  fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700,
                  color: "var(--app-text-muted)", letterSpacing: "0.08em",
                  textTransform: "uppercase", marginBottom: 10, display: "flex",
                  alignItems: "center", gap: 6,
                }}>
                  <Grid3X3 size={10} /> Choose a topic
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {CHAT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.label}
                      className="chatbot-cat-btn"
                      onClick={() => handleCategory(cat)}
                      style={{
                        display: "flex", alignItems: "center", gap: 7,
                        padding: "8px 10px", borderRadius: 12,
                        background: `rgba(${hexToRgb(cat.color)},0.1)`,
                        border: `1px solid rgba(${hexToRgb(cat.color)},0.25)`,
                        color: "var(--app-text-main)",
                        fontSize: 12, fontWeight: 600,
                        fontFamily: "'DM Sans',sans-serif",
                        cursor: "pointer", transition: "all 0.18s ease",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{cat.icon}</span>
                      <span style={{ lineHeight: 1.2 }}>{cat.label}</span>
                    </button>
                  ))}
                </div>
                <div style={{
                  textAlign: "center", marginTop: 10,
                  fontFamily: "'DM Sans',sans-serif", fontSize: 10.5,
                  color: "var(--app-text-muted)", opacity: 0.6,
                }}>
                  Built by Rizwan Siddiqui · Powered by QalbAudio 🤲
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="category"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22 }}
                style={{ padding: "10px 14px 14px", overflowY: "auto" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <button
                    className="chatbot-back-btn"
                    onClick={() => { setView("home"); setActiveCategory(null); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "4px 10px 4px 6px", borderRadius: 999,
                      background: "rgba(var(--app-accent-rgb),0.07)",
                      border: "1px solid rgba(var(--app-accent-rgb),0.18)",
                      color: "var(--app-text-muted)", fontSize: 11, fontWeight: 600,
                      fontFamily: "'DM Sans',sans-serif",
                      cursor: "pointer", transition: "all 0.18s ease",
                    }}
                  >
                    <ChevronLeft size={12} /> Back
                  </button>
                  <span style={{
                    fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700,
                    color: "var(--app-text-main)",
                  }}>
                    {activeCategory?.icon} {activeCategory?.label}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {activeCategory?.options.map((opt) => (
                    <button
                      key={opt.prompt}
                      className="chatbot-option-btn"
                      onClick={() => handleOption(opt, activeCategory.label)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "8px 12px", borderRadius: 10,
                        background: "rgba(var(--app-accent-rgb),0.06)",
                        border: "1px solid rgba(var(--app-accent-rgb),0.16)",
                        color: "var(--app-text-main)",
                        fontSize: 12.5, fontWeight: 500,
                        fontFamily: "'DM Sans',sans-serif",
                        cursor: "pointer", transition: "all 0.18s ease",
                        textAlign: "left",
                      }}
                    >
                      <span style={{
                        width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                        background: activeCategory?.color || "var(--app-accent)",
                      }} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
};

// ─── hex to rgb helper ────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

export default ChatBotPopup;