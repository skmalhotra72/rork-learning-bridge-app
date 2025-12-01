/**
 * AI Tutor Names by Subject
 * Professional yet fun names with Indian context
 */

export interface TutorInfo {
  name: string;
  emoji: string;
  fullTitle: string;
  greeting: (studentName: string) => string;
}

export const TUTOR_NAMES: Record<string, TutorInfo> = {
  Mathematics: {
    name: "Prof. Ganit",
    emoji: "🧮",
    fullTitle: "Professor Ganit",
    greeting: (name: string) => 
      `Hi ${name}! 👋 I'm Prof. Ganit, your Mathematics tutor.`
  },
  
  Science: {
    name: "Dr. Vigyan",
    emoji: "🔬",
    fullTitle: "Dr. Vigyan",
    greeting: (name: string) => 
      `Hello ${name}! 👋 I'm Dr. Vigyan, your Science tutor.`
  },
  
  English: {
    name: "Ms. Kavya",
    emoji: "📚",
    fullTitle: "Ms. Kavya",
    greeting: (name: string) => 
      `Hi ${name}! 👋 I'm Ms. Kavya, your English tutor.`
  },
  
  Hindi: {
    name: "Pandit Sahab",
    emoji: "🇮🇳",
    fullTitle: "Pandit Sahab",
    greeting: (name: string) => 
      `नमस्ते ${name}! 🙏 मैं पंडित साहब, आपका Hindi tutor हूँ।`
  },
  
  "Social Studies": {
    name: "Prof. Itihaas",
    emoji: "🌍",
    fullTitle: "Professor Itihaas",
    greeting: (name: string) => 
      `Hi ${name}! 👋 I'm Prof. Itihaas, your Social Studies tutor.`
  },
  
  "Social Science": {
    name: "Dr. Samaj",
    emoji: "🌍",
    fullTitle: "Dr. Samaj",
    greeting: (name: string) => 
      `Hello ${name}! 👋 I'm Dr. Samaj, your Social Science tutor.`
  },
  
  Physics: {
    name: "Dr. Raman",
    emoji: "⚛️",
    fullTitle: "Dr. C.V. Raman",
    greeting: (name: string) => 
      `Hi ${name}! 👋 I'm Dr. Raman, your Physics tutor.`
  },
  
  Chemistry: {
    name: "Prof. Rasayan",
    emoji: "🧪",
    fullTitle: "Professor Rasayan",
    greeting: (name: string) => 
      `Hello ${name}! 👋 I'm Prof. Rasayan, your Chemistry tutor.`
  },
  
  Biology: {
    name: "Dr. Jeev",
    emoji: "🧬",
    fullTitle: "Dr. Jeev Vigyan",
    greeting: (name: string) => 
      `Hi ${name}! 👋 I'm Dr. Jeev, your Biology tutor.`
  },
  
  "Computer Science": {
    name: "Tech Guru",
    emoji: "💻",
    fullTitle: "Tech Guru",
    greeting: (name: string) => 
      `Hey ${name}! 👋 I'm Tech Guru, your Computer Science tutor.`
  },
  
  History: {
    name: "Prof. Itihaas",
    emoji: "📜",
    fullTitle: "Professor Itihaas",
    greeting: (name: string) => 
      `Hello ${name}! 👋 I'm Prof. Itihaas, your History tutor.`
  },
  
  Geography: {
    name: "Prof. Bhugol",
    emoji: "🗺️",
    fullTitle: "Professor Bhugol",
    greeting: (name: string) => 
      `Hi ${name}! 👋 I'm Prof. Bhugol, your Geography tutor.`
  },
  
  Economics: {
    name: "Prof. Artha",
    emoji: "💰",
    fullTitle: "Professor Artha",
    greeting: (name: string) => 
      `Hello ${name}! 👋 I'm Prof. Artha, your Economics tutor.`
  },
};

/**
 * Get tutor information for a subject
 */
export const getTutorInfo = (subjectName: string): TutorInfo => {
  // Try exact match first
  if (TUTOR_NAMES[subjectName]) {
    return TUTOR_NAMES[subjectName];
  }
  
  // Try partial match
  const normalizedSubject = subjectName.toLowerCase();
  for (const [key, tutor] of Object.entries(TUTOR_NAMES)) {
    if (key.toLowerCase().includes(normalizedSubject) || 
        normalizedSubject.includes(key.toLowerCase())) {
      return tutor;
    }
  }
  
  // Default fallback
  return {
    name: "Prof. Shikshak",
    emoji: "👨‍🏫",
    fullTitle: "Professor Shikshak",
    greeting: (name: string) => 
      `Hi ${name}! 👋 I'm Prof. Shikshak, your ${subjectName} tutor.`
  };
};

/**
 * Get tutor greeting message
 */
export const getTutorGreeting = (
  subjectName: string, 
  studentName: string,
  language: string = 'English'
): string => {
  const tutor = getTutorInfo(subjectName);
  const firstName = studentName.split(' ')[0]; // Get first name only
  
  const baseGreeting = tutor.greeting(firstName);
  
  if (language === 'Hindi' || language === 'Hinglish') {
    return `${baseGreeting}\n\nमैं यहाँ आपकी help करने के लिए हूँ। आप मुझसे:\n📖 Concepts explain करवा सकते हैं\n✏️ Practice problems माँग सकते हैं\n🤔 Questions पूछ सकते हैं\n💡 Complex topics समझ सकते हैं\n📷 Images upload कर सकते हैं\n\nआज आप क्या सीखना चाहेंगे?`;
  }
  
  return `${baseGreeting}\n\nI'm here to help you master ${subjectName}. I've analyzed your learning progress and I'm ready to help!\n\nYou can ask me to:\n📖 Explain concepts in simple terms\n✏️ Give you practice problems\n🤔 Answer your questions\n💡 Break down complex topics\n📷 Analyze uploaded images\n\nWhat would you like to learn about today?`;
};

/**
 * Get subject-specific fun facts
 */
export const getSubjectFunFact = (subjectName: string): string => {
  const funFacts: Record<string, string> = {
    Mathematics: "Did you know? Ancient Indian mathematician Aryabhata discovered zero! 🚀",
    Science: "Fun fact: C.V. Raman was the first Asian to win Nobel Prize in Science! 🏆",
    English: "Did you know? English has over 170,000 words in current use! 📚",
    Hindi: "मजेदार तथ्य: Hindi is spoken by over 600 million people worldwide! 🌏",
    Physics: "Fun fact: Light travels 299,792 km per second! ⚡",
    Chemistry: "Did you know? Water is the only substance that exists in all 3 states naturally! 💧",
    Biology: "Fun fact: Your body has more bacterial cells than human cells! 🦠",
    History: "Did you know? India has 38 UNESCO World Heritage Sites! 🏛️",
    Geography: "Fun fact: India has 7 major mountain ranges! 🏔️",
  };
  
  return funFacts[subjectName] || `Let's explore ${subjectName} together! 🎓`;
};
