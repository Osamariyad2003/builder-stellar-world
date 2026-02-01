import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, Timestamp } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDUR89i6kvh3bp51GCgBX0fTwh3bFt1Ksg",
  authDomain: "medjust-d26eb.firebaseapp.com",
  projectId: "medjust-d26eb",
  storageBucket: "medjust-d26eb.appspot.com",
  messagingSenderId: "631362355665",
  appId: "1:631362355665:web:4d7f8eadba1bca0969e0f0",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Simple research data to add
const researchData = [
  {
    projectTitle: "Impact of Early Clinical Exposure on Medical Students",
    abstract: "A study investigating how early clinical exposure affects students' clinical reasoning and confidence in medical practice.",
    fieldOfResearch: ["Medical Education", "Clinical Skills"],
    contactPerson: ["Dr. Sarah Johnson"],
    authorshipPosition: ["Lead", "Co-author"],
    projectDuration: "6 months",
    requiredSkills: ["Clinical observation", "Data analysis"],
    supervisor: "Prof. Michael Chen",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    projectTitle: "AI-Assisted Diagnosis in Emergency Medicine",
    abstract: "Exploring the use of artificial intelligence to improve diagnostic accuracy and speed in emergency department settings.",
    fieldOfResearch: ["Emergency Medicine", "Artificial Intelligence", "Medical Technology"],
    contactPerson: ["Dr. Ahmed Al-Mansoori", "Dr. Fatima Hassan"],
    authorshipPosition: ["Lead", "Co-author"],
    projectDuration: "12 months",
    requiredSkills: ["Machine learning basics", "Medical imaging", "Statistics"],
    supervisor: "Prof. David Williams",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    projectTitle: "Telemedicine Effectiveness in Rural Healthcare",
    abstract: "Evaluating patient outcomes and satisfaction with telemedicine services in underserved rural communities.",
    fieldOfResearch: ["Public Health", "Telemedicine", "Healthcare Access"],
    contactPerson: ["Dr. Maria Rodriguez"],
    authorshipPosition: ["Lead"],
    projectDuration: "9 months",
    requiredSkills: ["Survey design", "Data collection", "Statistical analysis"],
    supervisor: "Prof. James Anderson",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    projectTitle: "Antibiotic Resistance Patterns in Local Hospitals",
    abstract: "Analyzing antibiotic resistance trends to inform better prescribing practices and infection control measures.",
    fieldOfResearch: ["Microbiology", "Infectious Diseases", "Public Health"],
    contactPerson: ["Dr. Khalid Al-Zahrani"],
    authorshipPosition: ["Lead", "Co-author"],
    projectDuration: "8 months",
    requiredSkills: ["Microbiology lab work", "Data analysis", "Medical writing"],
    supervisor: "Prof. Lisa Thompson",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    projectTitle: "Mental Health Support for Medical Students",
    abstract: "Developing and testing interventions to improve mental health and reduce burnout among medical students.",
    fieldOfResearch: ["Medical Education", "Mental Health", "Student Wellness"],
    contactPerson: ["Dr. Omar Al-Sheikh"],
    authorshipPosition: ["Lead"],
    projectDuration: "10 months",
    requiredSkills: ["Psychology basics", "Survey research", "Program evaluation"],
    supervisor: "Prof. Susan Martinez",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
];

async function seedResearch() {
  try {
    console.log("🌱 Starting to seed research data to Firebase...\n");

    for (const research of researchData) {
      const docRef = await addDoc(collection(db, "research"), research);
      console.log(`✅ Added research: "${research.projectTitle}" (ID: ${docRef.id})`);
    }

    console.log(`\n✨ Successfully added ${researchData.length} research entries to Firebase!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding research data:", error);
    process.exit(1);
  }
}

seedResearch();
