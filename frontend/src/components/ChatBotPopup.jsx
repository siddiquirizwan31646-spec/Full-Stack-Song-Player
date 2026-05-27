import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Sparkles, RotateCcw, Music2, Headphones, BookOpen } from "lucide-react";

// ─── Suggested prompts ────────────────────────────────────────────────────────
const SUGGESTIONS = [
  { icon: Music2,     label: "Recommend a Nasheed",    prompt: "Can you recommend a beautiful Nasheed for me?" },
  { icon: Headphones, label: "Islamic audio topics",   prompt: "What Islamic audio topics are available?" },
  { icon: BookOpen,   label: "Quran recitation tips",  prompt: "Give me tips on improving my Quran recitation listening." },
  { icon: Sparkles,   label: "Ramadan playlist ideas", prompt: "Suggest a Ramadan playlist idea for me." },
];

// ─── If/else reply logic ──────────────────────────────────────────────────────
const getReply = (message) => {
  const lower = message.toLowerCase().trim();

  // ── Greetings ──
  if (lower.includes("assalamu") || lower.includes("salam") || lower.includes("hello") || lower.includes("hi") || lower.includes("hey") || lower.includes("greetings") || lower.includes("marhaba"))
    return "Wa Alaikum Assalam wa Rahmatullahi wa Barakatuh! 🌙 Welcome to QalbAudio — your spiritual audio companion. How can I help you discover beautiful Islamic content today?";

  // ── Nasheeds — specific recommendations ──
  if (lower.includes("nasheed") && (lower.includes("recommend") || lower.includes("suggest") || lower.includes("best") || lower.includes("beautiful") || lower.includes("top") || lower.includes("popular")))
    return "Here are some top Nasheeds to start with 🌙:\n• Maher Zain — 'Rahmatun Lil'Alameen'\n• Sami Yusuf — 'Al-Mu'allim'\n• Mesut Kurtis — 'Burdah'\n• Harris J — 'Salam'\n• Ahmed Bukhatir — 'Forgive Me'\nAll available on QalbAudio!";

  // ── Nasheeds — general ──
  if (lower.includes("nasheed") || lower.includes("anasheed"))
    return "QalbAudio has a rich Nasheed library 🎵 featuring artists like Maher Zain, Sami Yusuf, Mesut Kurtis, Harris J, Ahmed Bukhatir, Humood AlKhudher, and many more. Browse by artist, mood, or language!";

  // ── Quran — tips ──
  if ((lower.includes("quran") || lower.includes("recitation") || lower.includes("recite") || lower.includes("tilawah")) && (lower.includes("tip") || lower.includes("improve") || lower.includes("better") || lower.includes("learn") || lower.includes("how")))
    return "Tips for a better Quran listening experience 📖:\n• Follow along with a Mushaf while listening\n• Listen in a quiet, clean space with wudu\n• Start with shorter surahs to build familiarity\n• Repeat verses you love for deeper reflection\n• Try reciters like Mishary Alafasy or Sudais for a moving experience";

  // ── Quran — specific surahs ──
  if (lower.includes("al-fatiha") || lower.includes("fatiha"))
    return "Surah Al-Fatiha — the Opening — is recited in every prayer and is the most repeated surah in the Quran. 📖 Beautiful recitations by Mishary Alafasy and Maher Al-Mueaqly are available on QalbAudio.";

  if (lower.includes("al-baqarah") || lower.includes("baqarah"))
    return "Surah Al-Baqarah is the longest surah in the Quran and a powerful protection. 📖 It's recommended to listen to it regularly. Find full recitations by Al-Sudais and Mishary Alafasy on QalbAudio.";

  if (lower.includes("al-kahf") || lower.includes("kahf"))
    return "Surah Al-Kahf is Sunnah to recite every Friday for protection from Dajjal. 📖 Listen to soul-stirring recitations by Abdul Rahman Al-Sudais and Mishary Alafasy on QalbAudio.";

  if (lower.includes("al-mulk") || lower.includes("mulk") || lower.includes("tabarak"))
    return "Surah Al-Mulk (Tabarak) is highly recommended before sleep — it intercedes for its reciter. 🌙 Find beautiful recitations on QalbAudio to listen to every night.";

  if (lower.includes("yasin") || lower.includes("ya-sin") || lower.includes("ya sin"))
    return "Surah Yasin is known as the 'Heart of the Quran'. 📖 It's often recited for the ill and the deceased. Listen to moving recitations by Mishary Alafasy on QalbAudio.";

  if (lower.includes("ar-rahman") || lower.includes("rahman"))
    return "Surah Ar-Rahman — 'Which of the favours of your Lord will you deny?' 🌿 Its beautiful rhythm makes it one of the most beloved surahs. Available in many recitation styles on QalbAudio.";

  if (lower.includes("ayatul kursi") || lower.includes("ayat al kursi") || lower.includes("ayat kursi"))
    return "Ayatul Kursi is one of the greatest ayahs in the Quran — recite it after every prayer and before sleep for protection. 🤲 Beautiful recitations are available on QalbAudio.";

  // ── Quran — general ──
  if (lower.includes("quran") || lower.includes("recitation") || lower.includes("surah") || lower.includes("ayah") || lower.includes("tilawah") || lower.includes("hafiz"))
    return "QalbAudio has a complete Quran library 📖 with recitations by world-class qaris including Mishary Alafasy, Abdul Rahman Al-Sudais, Maher Al-Mueaqly, Abdul Basit Abdus-Samad, and Saad Al-Ghamdi. Which surah are you looking for?";

  // ── Ramadan ──
  if (lower.includes("ramadan") && (lower.includes("playlist") || lower.includes("audio") || lower.includes("listen")))
    return "Perfect Ramadan audio journey 🌙:\n• Fajr: Quran recitation (Surah Al-Mulk / Al-Waqi'ah)\n• Morning: Adhkar & du'a recordings\n• Afternoon: Islamic lectures\n• Iftar: Nasheeds by Maher Zain\n• Tarawih: Full Quran recitation\n• Night: Surah Al-Baqarah for blessings";

  if (lower.includes("ramadan"))
    return "Ramadan Mubarak! 🌙✨ QalbAudio has a dedicated Ramadan collection including nightly Tarawih recitations, Ramadan Nasheeds, du'a for Iftar & Suhoor, and special lectures on the month of Quran. May Allah accept from us all!";

  // ── Du'a ──
  if (lower.includes("dua") || lower.includes("du'a") || lower.includes("supplication") || lower.includes("pray") && lower.includes("audio"))
    return "QalbAudio's Du'a collection 🤲 includes:\n• Morning & Evening Adhkar\n• Du'a after Salah\n• Du'a for forgiveness (Istighfar)\n• Du'a for anxiety & stress relief\n• Qunoot du'a\n• Du'a for rain, travel, and special occasions\nPerfect for daily spiritual routine!";

  // ── Adhkar ──
  if (lower.includes("adhkar") || lower.includes("dhikr") || lower.includes("zikr") || lower.includes("remembrance"))
    return "Dhikr is the nourishment of the heart! 💚 QalbAudio features morning & evening adhkar recordings, tasbeeh audio, istighfar collections, and salawat playlists. Regular dhikr is a Sunnah and brings immense tranquility.";

  // ── Lectures / scholars ──
  if (lower.includes("lecture") || lower.includes("scholar") || lower.includes("talk") || lower.includes("bayan") || lower.includes("khutbah") || lower.includes("sermon"))
    return "QalbAudio features Islamic lectures from renowned scholars 🎓:\n• Nouman Ali Khan — Quran reflections\n• Mufti Menk — Life advice & fiqh\n• Omar Suleiman — History & spirituality\n• Yasmin Mogahed — Heart & soul\n• Bilal Philips — Aqeedah & basics\n• Hamza Yusuf — Classical Islamic sciences\nFilter by scholar, topic, or duration!";

  // ── Specific scholars ──
  if (lower.includes("nouman ali khan") || lower.includes("nouman"))
    return "Nouman Ali Khan is famous for his deep yet accessible Quranic tafsir and Arabic grammar lessons. 📖 His lectures on Surah Al-Baqarah, Al-Kahf, and Yusuf are particularly beloved. Available on QalbAudio!";

  if (lower.includes("mufti menk") || lower.includes("menk"))
    return "Mufti Ismail Menk's warm, practical style has made him one of the most listened-to Islamic scholars globally. 🌙 His talks on relationships, mental health, and everyday Islam are on QalbAudio.";

  if (lower.includes("omar suleiman"))
    return "Sheikh Omar Suleiman's lectures on Islamic history, the Prophets, and social justice are deeply moving. ✨ His 'Stories of the Prophets' series is a must-listen — find it on QalbAudio!";

  if (lower.includes("hamza yusuf"))
    return "Sheikh Hamza Yusuf is a master of classical Islamic scholarship. His lectures on spirituality, Arabic poetry, and Islamic philosophy are available on QalbAudio. 📚";

  if (lower.includes("yasmin mogahed"))
    return "Yasmin Mogahed's talks on the heart, healing, and reconnecting with Allah are deeply powerful. 💚 Her lecture 'Reclaim Your Heart' is especially recommended. Available on QalbAudio!";

  // ── Playlist ──
  if (lower.includes("playlist") && (lower.includes("create") || lower.includes("make") || lower.includes("build")))
    return "Creating a playlist on QalbAudio is easy! 🎵\n1. Browse or search for audio\n2. Tap the '+' icon on any track\n3. Select 'Add to Playlist'\n4. Name your playlist and save\nTry themes like 'Morning Blessings', 'Ramadan Nights', or 'Friday Nasheeds'!";

  if (lower.includes("playlist"))
    return "QalbAudio playlists ideas 🎵:\n• 'Fajr Serenity' — Soft Quran recitations\n• 'Ramadan Nights' — Tarawih + Nasheeds\n• 'Road Trip Nasheeds' — Upbeat Islamic songs\n• 'Study Companion' — Quran on loop\n• 'Before Sleep' — Surah Al-Mulk + Adhkar\n• 'Friday Special' — Surah Al-Kahf + Salawat";

  // ── Fajr / Morning ──
  if (lower.includes("fajr") || (lower.includes("morning") && (lower.includes("audio") || lower.includes("listen") || lower.includes("recitation") || lower.includes("islamic"))))
    return "Start your Fajr with these 🌅:\n• Surah Al-Mulk (protection & blessings)\n• Surah Al-Waqi'ah (barakah in rizq)\n• Morning Adhkar audio (15 mins)\n• Maher Zain's 'SubhanAllah'\nA blessed morning routine sets the tone for the whole day. Find all on QalbAudio!";

  // ── Night / Sleep ──
  if (lower.includes("sleep") || lower.includes("bedtime") || (lower.includes("night") && (lower.includes("audio") || lower.includes("listen") || lower.includes("recite"))))
    return "Wind down your night with 🌙:\n• Ayatul Kursi — protection from Shaytan\n• Surah Al-Baqarah — fills the home with barakah\n• Last 2 ayahs of Al-Baqarah\n• Evening Adhkar recordings\n• Soft Nasheed: 'Allahu Allah' by Maher Zain\nAll available on QalbAudio for a peaceful night!";

  // ── Isha ──
  if (lower.includes("isha"))
    return "After Isha is a beautiful time for Quran recitation and dhikr. 🌙 Listen to Surah Al-Mulk (Sunnah before sleep), Tarawih recitations in Ramadan, or calming Nasheeds to close your day in remembrance of Allah.";

  // ── Jumu'ah / Friday ──
  if (lower.includes("jumu'ah") || lower.includes("jumah") || lower.includes("friday") || lower.includes("jumuah"))
    return "Blessed Friday Mubarak! 🕌 Recommended audio for Jumu'ah:\n• Surah Al-Kahf (Sunnah every Friday)\n• Salawat & Durood recordings\n• Friday Khutbah lectures\n• Nasheeds in praise of Prophet Muhammad ﷺ\nFind all on QalbAudio — may Allah accept your Jumu'ah!";

  // ── Travel ──
  if (lower.includes("travel") || lower.includes("journey") || lower.includes("road trip") || lower.includes("car") || lower.includes("flight") || lower.includes("plane"))
    return "Travel playlist for the road 🚗✨:\n• Short surahs by Mishary Alafasy\n• Upbeat Nasheeds: Maher Zain, Harris J\n• Du'a for travel (Safar du'a)\n• Islamic lectures on patience & gratitude\n• Humood AlKhudher's 'Kun Anta'\nMay Allah grant you safe travels!";

  // ── Study / Focus ──
  if (lower.includes("study") || lower.includes("focus") || lower.includes("concentrate") || lower.includes("work") && lower.includes("background"))
    return "Best audio for studying & focus 📚:\n• Quran recitation without translation (background)\n• Surah Al-Kahf on loop\n• Instrumental-style Nasheeds (acapella)\n• Short surahs repeated — Al-Ikhlas, Al-Falaq, An-Nas\nQuran as background audio has been shown to bring calm and barakah to your work!";

  // ── Stress / anxiety / mental health ──
  if (lower.includes("stress") || lower.includes("anxiety") || lower.includes("sad") || lower.includes("depressed") || lower.includes("mental health") || lower.includes("worried") || lower.includes("calm") || lower.includes("peace"))
    return "May Allah bring ease to your heart. 🤲 For peace & relief:\n• Surah Ar-Rahman — Allah's mercy & gifts\n• Surah Ad-Duha — 'Your Lord has not forsaken you'\n• Du'a for anxiety: 'Allahumma inni a'udhu bika'\n• Yasmin Mogahed's talks on healing\n• Gentle Nasheeds: 'Insha Allah' by Maher Zain\n\nRemember: 'Verily, with hardship comes ease.' (94:5) 💚";

  // ── Children / kids ──
  if (lower.includes("child") || lower.includes("kid") || lower.includes("children") || lower.includes("baby") || lower.includes("toddler") || lower.includes("young"))
    return "QalbAudio has wonderful content for children 🌟:\n• Short surah recitations (Al-Ikhlas, Al-Falaq, An-Nas)\n• Islamic children's Nasheeds\n• Storytelling of Prophets for kids\n• Alphabet & basic Islamic education audio\nA beautiful way to nurture young hearts with the love of Allah!";

  // ── Wedding / Nikah ──
  if (lower.includes("wedding") || lower.includes("nikah") || lower.includes("marriage") || lower.includes("walima"))
    return "Mabrook on your Nikah! 💍🌙 Perfect Islamic wedding audio:\n• Nasheeds: 'Insha Allah' & 'Ya Nabi' by Maher Zain\n• Sami Yusuf's 'You Came to Me'\n• Mesut Kurtis — 'Lean On Me'\n• Du'a for the couple\n• Surah Ar-Rum recitation (on marriage)\nMay Allah bless your union!";

  // ── Hajj / Umrah ──
  if (lower.includes("hajj") || lower.includes("umrah") || lower.includes("mecca") || lower.includes("makkah") || lower.includes("madinah") || lower.includes("medina"))
    return "SubhanAllah, may Allah accept your journey! 🕋\nPrepare spiritually with:\n• Talbiyah audio — 'Labbayk Allahumma Labbayk'\n• Duas for Hajj & Umrah\n• Lectures on the rituals by Bilal Philips\n• Quranic recitations from Masjid Al-Haram\n• Nasheeds about Makkah & Madinah\nAll available on QalbAudio. Hajj Mabroor!";

  // ── Audio topics / what's available ──
  if (lower.includes("topic") || lower.includes("available") || lower.includes("feature") || lower.includes("category") || (lower.includes("what") && lower.includes("audio")) || lower.includes("content") || lower.includes("collection"))
    return "QalbAudio's full content library 🎧:\n📖 Quran — Full recitations, surah-by-surah\n🎵 Nasheeds — Arabic, English, Urdu & more\n🎓 Lectures — Scholars from around the world\n🤲 Du'a — Daily supplications & adhkar\n📚 Islamic Stories — Prophets & Sahaba\n🌙 Ramadan Specials — Tarawih & Night prayers\n🕌 Khutbahs — Friday sermons\nWhat would you like to explore?";

  // ── Artists ──
  if (lower.includes("maher zain"))
    return "Maher Zain is one of the most beloved Islamic artists worldwide 🌙 His top tracks on QalbAudio:\n• 'Rahmatun Lil'Alameen'\n• 'Ya Nabi Salam Alayka'\n• 'Insha Allah'\n• 'SubhanAllah'\n• 'Allahu Allah'\n• 'Number One for Me'\nHis music is available in Arabic, English & French!";

  if (lower.includes("sami yusuf"))
    return "Sami Yusuf's soulful voice has touched millions of hearts 🎵 His must-listen tracks on QalbAudio:\n• 'Al-Mu'allim'\n• 'Supplication'\n• 'You Came to Me'\n• 'Free'\n• 'Hasbi Rabbi'\n• 'The Creator'\nA truly legendary Islamic music artist!";

  if (lower.includes("mishary") || lower.includes("alafasy"))
    return "Sheikh Mishary Rashid Alafasy is one of the most revered Quran reciters in the world 📖 Find on QalbAudio:\n• Full Quran recitation (Hafs)\n• Individual surah recitations\n• Beautiful Nasheeds\n• Du'a & Adhkar recordings\nHis voice brings the Quran alive in the hearts of listeners!";

  if (lower.includes("sudais") || lower.includes("al-sudais"))
    return "Sheikh Abdul Rahman Al-Sudais is the Imam of Masjid Al-Haram in Makkah 🕋 His powerful recitations on QalbAudio:\n• Full Quran recitation\n• Tarawih prayers\n• Friday Khutbahs\n• Special du'a recordings\nListening to his recitation is a truly immersive experience!";

  if (lower.includes("mesut kurtis"))
    return "Mesut Kurtis is a British-Macedonian nasheed artist with a deeply moving voice 🌙 His top tracks:\n• 'Burdah'\n• 'Lean On Me'\n• 'Salawat'\n• 'Wherever I Am'\nHis classical Arabic and Bosnian-influenced style is unique on QalbAudio!";

  if (lower.includes("harris j"))
    return "Harris J is a British-Malaysian nasheed artist known for his youthful, modern sound 🎵 Listen to:\n• 'Salam'\n• 'You Are My World'\n• 'Love Who You Are'\n• 'Beautiful Names'\nA great artist for younger listeners on QalbAudio!";

  if (lower.includes("humood") || lower.includes("alkhudher") || lower.includes("kun anta"))
    return "Humood AlKhudher's 'Kun Anta' became a global Islamic music sensation! 🌟 Find on QalbAudio:\n• 'Kun Anta' (Be Yourself)\n• 'Alhamdulillah'\n• 'Lughat Al-Aalam'\n• 'Tabassam'\nHis upbeat, positive style is perfect for any time of day!";

  if (lower.includes("ahmed bukhatir") || lower.includes("bukhatir"))
    return "Ahmed Bukhatir is a UAE nasheed legend known for his emotional, classical Arabic style 🌙 His iconic track 'Forgive Me' has brought many to tears. Find his full collection on QalbAudio!";

  if (lower.includes("bilal philips") || lower.includes("bilal"))
    return "Dr. Bilal Philips is a Canadian Islamic scholar known for making Islamic education accessible 📚 His lectures on Tawheed, Fiqh, and Islamic history are available on QalbAudio. A great starting point for converts and new Muslims!";

  // ── Languages ──
  if (lower.includes("urdu") || lower.includes("hindi") || lower.includes("pakistan") || lower.includes("india"))
    return "QalbAudio has a growing Urdu & Hindi Islamic audio collection 🇵🇰🇮🇳 including:\n• Urdu Nasheeds & Hamd\n• Quran recitation with Urdu translation\n• Urdu Islamic lectures\n• Naat recitations (Urdu)\nBrowse by language in the filter options!";

  if (lower.includes("arabic") || lower.includes("arab"))
    return "Arabic is the language of the Quran and Islamic heritage 📖 QalbAudio's Arabic collection includes:\n• Original Arabic Nasheeds\n• Quran in Arabic (multiple reciters)\n• Arabic Islamic lectures\n• Classical Arabic poetry recitations\nThe most extensive collection on QalbAudio!";

  if (lower.includes("english"))
    return "QalbAudio has a strong English Islamic audio library 🎵 including:\n• English Nasheeds (Maher Zain, Harris J, Sami Yusuf)\n• English Islamic lectures (Nouman Ali Khan, Mufti Menk)\n• Quran with English translation\n• English du'a & adhkar\nPerfect for English-speaking Muslims worldwide!";

  // ── New Muslim / Convert ──
  if (lower.includes("new muslim") || lower.includes("convert") || lower.includes("revert") || lower.includes("just became muslim") || lower.includes("shahada"))
    return "Welcome to Islam! Alhamdulillah! 🤲✨\nHere's the best starting audio on QalbAudio:\n• 'The Fundamentals of Tawheed' — Bilal Philips\n• Surah Al-Fatiha + short surahs (recitation)\n• 'New Muslim Guide' lectures — Mufti Menk\n• Morning & Evening Adhkar (beginner)\n• Maher Zain's 'Guide Me All The Way'\nMay Allah strengthen your faith and fill your heart with light!";

  // ── Salah / Prayer ──
  if (lower.includes("salah") || lower.includes("salat") || lower.includes("prayer") || lower.includes("namaz"))
    return "Salah is the pillar of our deen 🕌 On QalbAudio find:\n• Adhan recordings (beautiful calls to prayer)\n• Quran recitation for each prayer time\n• Du'a after salah audio\n• 'Khushu in Salah' lectures\n• Prayer time reminders audio\nMay Allah perfect our prayers!";

  // ── Adhan ──
  if (lower.includes("adhan") || lower.includes("azan") || lower.includes("call to prayer"))
    return "The Adhan is the beautiful call that echoes from minarets worldwide 🕌 QalbAudio features:\n• Adhan by Mishary Alafasy\n• Adhan from Masjid Al-Haram, Makkah\n• Adhan from Masjid An-Nabawi, Madinah\n• Various regional adhan styles\nA soul-stirring collection to set the mood for prayer!";

  // ── Seerah / Prophet ──
  if (lower.includes("seerah") || lower.includes("prophet") || lower.includes("muhammad") || lower.includes("pbuh") || lower.includes("rasulullah") || lower.includes("nabi"))
    return "The life of Prophet Muhammad ﷺ is the greatest story ever told 🌙 On QalbAudio:\n• 'The Seerah' series — Omar Suleiman\n• Nasheeds in praise of the Prophet ﷺ\n• 'Madad Ya Rasulallah' — Mesut Kurtis\n• 'Ya Nabi Salam Alayka' — Maher Zain\n• Seerah lectures — Yasir Qadhi\nSending Salawat on the Prophet ﷺ is the greatest act of love!";

  // ── Stories of Prophets / Sahaba ──
  if (lower.includes("stories") || lower.includes("prophets") || lower.includes("sahaba") || lower.includes("companions") || lower.includes("qasas"))
    return "Islamic stories are treasures for the soul 📚 QalbAudio has:\n• 'Stories of the Prophets' — Omar Suleiman\n• 'The Firsts' — Stories of the Sahaba\n• Animated Islamic story audio\n• Stories of Ibrahim, Musa, Isa, Yusuf ﷺ\n• Stories of great Sahabahs: Abu Bakr, Umar, Ali RA\nPerfect for adults and children alike!";

  // ── How to use / search ──
  if ((lower.includes("how") || lower.includes("where")) && (lower.includes("search") || lower.includes("find") || lower.includes("use") || lower.includes("navigate") || lower.includes("browse")))
    return "Navigating QalbAudio is simple 🔍:\n• Use the Search bar to find by artist, surah, or keyword\n• Browse Categories: Quran, Nasheeds, Lectures, Du'a\n• Filter by language, duration, or scholar\n• Tap ❤️ to save to Favourites\n• Tap '+' to add to a Playlist\n• Check your profile for listening history\nIs there something specific I can help you find?";

  // ── Favourites / Save ──
  if (lower.includes("favourite") || lower.includes("favorite") || lower.includes("save") || lower.includes("bookmark") || lower.includes("like") && lower.includes("audio"))
    return "Saving your favourite audio is easy ❤️:\n1. Find any audio track on QalbAudio\n2. Tap the heart icon ❤️\n3. It's saved to your Favourites\n4. Access anytime from your Profile → Favourites\nYou can also organise your saved content into custom Playlists!";

  // ── Upload ──
  if (lower.includes("upload") || lower.includes("share") && lower.includes("audio") || lower.includes("contribute"))
    return "Share beneficial Islamic content with the Ummah! 📤\nTo upload on QalbAudio:\n1. Go to Profile → Upload Audio\n2. Choose your audio file\n3. Add title, artist & category\n4. Submit for review\nMay Allah reward every listener who benefits from your upload. Sadaqah Jariyah in digital form!";

  // ── Account / Profile ──
  if (lower.includes("account") || lower.includes("profile") || lower.includes("register") || lower.includes("signup") || lower.includes("sign up") || lower.includes("login") || lower.includes("log in"))
    return "Your QalbAudio account gives you full access! 👤\n• Save Favourites & create Playlists\n• Upload Islamic audio content\n• Personalise your listening experience\n• Track your listening history\n• Access exclusive Ramadan collections\nRegister free at QalbAudio — your spiritual audio journey starts here!";

  // ── Settings / preferences ──
  if (lower.includes("setting") || lower.includes("preference") || lower.includes("customize") || lower.includes("theme") || lower.includes("dark mode") || lower.includes("notification"))
    return "Customise your QalbAudio experience in Settings ⚙️:\n• Dark / Light / System theme\n• Notification preferences\n• Audio quality settings\n• Language preference\n• Listening reminders (Fajr, Isha)\n• Accessibility options\nAccess via Profile → Settings!";

  // ── Offline / download ──
  if (lower.includes("offline") || lower.includes("download") || lower.includes("without internet") || lower.includes("no internet"))
    return "Download audio for offline listening on QalbAudio 📥 Premium users can:\n• Download Quran recitations for offline\n• Save Nasheeds for travel & no-signal areas\n• Access downloaded content from Profile → Downloads\nPerfect for planes, remote areas, or data-saving mode!";

  // ── Islamic calendar / events ──
  if (lower.includes("eid") || lower.includes("mawlid") || lower.includes("isra") || lower.includes("miraj") || lower.includes("muharram") || lower.includes("ashura"))
    return "Celebrate Islamic occasions with QalbAudio 🌙:\n• Eid Nasheeds — Maher Zain's 'Eid' & 'Ya Ilahi'\n• Mawlid: Nasheeds in praise of the Prophet ﷺ\n• Muharram: Lectures on the Islamic New Year\n• Isra & Mi'raj: Stories & reflections\n• Eid Takbeerat audio\nWe update special collections for every Islamic occasion!";

  // ── Feedback / report ──
  if (lower.includes("feedback") || lower.includes("report") || lower.includes("bug") || lower.includes("problem") || lower.includes("issue") || lower.includes("wrong"))
    return "We appreciate your feedback! 💬 To report an issue or share suggestions on QalbAudio:\n• Go to Settings → Send Feedback\n• Email us through the contact page\n• Use the 'Report' button on any audio\nYour input helps us improve QalbAudio for the entire Ummah. JazakAllahu Khayran!";

  // ── Thanks ──
  if (lower.includes("thank") || lower.includes("jazak") || lower.includes("shukran") || lower.includes("barakallah"))
    return "Wa iyyakum! 🤲 Jazak Allahu Khayran for using QalbAudio. May Allah bless your listening experience and fill your heart with His remembrance. Is there anything else I can help you with?";

  // ── Goodbye ──
  if (lower.includes("bye") || lower.includes("goodbye") || lower.includes("assalamualaikum wa rahmatullah") || lower.includes("fee amanillah") || lower.includes("take care"))
    return "Wa Alaikum Assalam wa Rahmatullahi wa Barakatuh! 🌙 May Allah bless you and keep you in His protection. Come back to QalbAudio anytime — we'll be here for your spiritual audio journey. Fee Amanillah! 🤲";

  // ── Default ──
  return "Assalamu Alaikum! 🤲 I'm your QalbAudio assistant — here to guide you through our Islamic audio collection. You can ask me about:\n• 🎵 Nasheeds & artists\n• 📖 Quran recitations & surahs\n• 🎓 Islamic lectures & scholars\n• 🤲 Du'a & Adhkar\n• 🌙 Ramadan, Fajr, or night audio\n• 🕌 Salah, Prophets, or Islamic occasions\nWhat would you like to explore today?";
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
        lineHeight: 1.55,
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

// ─── Initial greeting ─────────────────────────────────────────────────────────
const getInitialMessages = (user) => ([
  {
    role: "assistant",
    content: `Assalamu Alaikum${user?.username ? `, ${user.username}` : ""}! 🌙\nI'm your QalbAudio assistant. How can I help you discover Islamic audio today?`,
  }
]);

// ─── Main ChatBotPopup ────────────────────────────────────────────────────────
const ChatBotPopup = ({ onClose, user }) => {
  const [messages, setMessages] = useState(() => getInitialMessages(user));
  const [input, setInput] = useState("");
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" ? window.innerWidth < 600 : false
  );
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const sendMessage = (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed) return;
    setInput("");
    const reply = getReply(trimmed);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed },
      { role: "assistant", content: reply },
    ]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages(getInitialMessages(user));
    setInput("");
  };

  const showSuggestions = messages.length <= 1;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        .chatbot-popup-input::placeholder { color: var(--app-text-muted); opacity: 0.7; }
        .chatbot-popup-input:focus { outline: none; }
        .chatbot-send-btn:hover { transform: scale(1.06); box-shadow: 0 8px 20px rgba(var(--app-accent-rgb),0.36) !important; }
        .chatbot-send-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none !important; }
        .chatbot-suggestion-btn:hover { background: rgba(var(--app-accent-rgb),0.14) !important; border-color: rgba(var(--app-accent-rgb),0.45) !important; transform: translateY(-1px); }
        .chatbot-clear-btn:hover { background: rgba(var(--app-accent-rgb),0.1) !important; color: var(--app-text-main) !important; }
        .chatbot-messages-scroll::-webkit-scrollbar { width: 4px; }
        .chatbot-messages-scroll::-webkit-scrollbar-track { background: transparent; }
        .chatbot-messages-scroll::-webkit-scrollbar-thumb { background: rgba(var(--app-accent-rgb),0.22); border-radius: 4px; }
      `}</style>

      {isMobile && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, backdropFilter: "blur(4px)" }}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.96 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "fixed",
          top: isMobile ? "50%" : 80,
          right: isMobile ? "50%" : 28,
          transform: isMobile ? "translate(50%,-50%)" : "none",
          width: isMobile ? "min(94vw, 420px)" : 400,
          height: isMobile ? "min(88vh, 600px)" : 560,
          zIndex: 201,
          display: "flex", flexDirection: "column",
          borderRadius: 24,
          background: "var(--app-surface-solid)",
          border: "1px solid rgba(var(--app-accent-rgb),0.22)",
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
                Online · Islamic Audio Guide
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className="chatbot-clear-btn"
              onClick={clearChat}
              title="Clear chat"
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(var(--app-accent-rgb),0.06)",
                border: "1px solid rgba(var(--app-accent-rgb),0.16)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--app-text-muted)", transition: "all 0.2s ease",
              }}
            >
              <RotateCcw size={13} />
            </button>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(248,113,113,0.1)",
                border: "1px solid rgba(248,113,113,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#f87171", transition: "all 0.2s ease",
              }}
            >
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

        {/* ── SUGGESTIONS ── */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ padding: "0 14px 10px", display: "flex", flexWrap: "wrap", gap: 6, flexShrink: 0 }}
            >
              {SUGGESTIONS.map(({ icon: Icon, label, prompt }) => (
                <button
                  key={label}
                  className="chatbot-suggestion-btn"
                  onClick={() => sendMessage(prompt)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 11px", borderRadius: 999,
                    background: "rgba(var(--app-accent-rgb),0.07)",
                    border: "1px solid rgba(var(--app-accent-rgb),0.2)",
                    color: "var(--app-text-main)",
                    fontSize: 12, fontWeight: 600,
                    fontFamily: "'DM Sans',sans-serif",
                    cursor: "pointer", transition: "all 0.2s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Icon size={11} color="var(--app-accent)" />
                  {label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── INPUT BAR ── */}
        <div style={{
          padding: "12px 14px 14px",
          borderTop: "1px solid rgba(var(--app-accent-rgb),0.1)",
          background: "rgba(var(--app-accent-rgb),0.03)",
          flexShrink: 0,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(var(--app-accent-rgb),0.06)",
            border: "1px solid rgba(var(--app-accent-rgb),0.18)",
            borderRadius: 999, padding: "8px 8px 8px 16px",
          }}>
            <input
              ref={inputRef}
              className="chatbot-popup-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about Islamic audio..."
              style={{
                flex: 1, background: "transparent", border: "none",
                color: "var(--app-text-main)",
                fontFamily: "'DM Sans',sans-serif", fontSize: 13.5,
                fontWeight: 500, minWidth: 0,
              }}
            />
            <motion.button
              whileTap={{ scale: 0.92 }}
              className="chatbot-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim()}
              style={{
                width: 36, height: 36, borderRadius: "50%", border: "none", flexShrink: 0,
                background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 6px 16px rgba(var(--app-accent-rgb),0.28)",
                transition: "all 0.2s ease",
              }}
            >
              <Send size={15} color="#041307" strokeWidth={2.2} />
            </motion.button>
          </div>
          <div style={{
            textAlign: "center", marginTop: 8,
            fontFamily: "'DM Sans',sans-serif", fontSize: 10.5,
            color: "var(--app-text-muted)", opacity: 0.6,
          }}>
            Powered by QalbAudio AI · Bismillah 🤲
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default ChatBotPopup;