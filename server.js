/**
 * Bartimaeus Resource Centre - Accessible Typing Application
 * Production Express Backend API & Cloud Server (Render-Ready)
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Data directory paths for persistent file-based JSON database
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ASSIGNMENTS_FILE = path.join(DATA_DIR, 'assignments.json');
const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Global Security & Performance Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// -----------------------------------------------------------------------------
// Data Access Helper Functions
// -----------------------------------------------------------------------------

function readJSONFile(filePath, fallbackData = []) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallbackData, null, 2), 'utf8');
      return fallbackData;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallbackData;
  }
}

function writeJSONFile(filePath, data) {
  try {
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempPath, filePath);
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// Initial Data Seeding
const INITIAL_USERS = [
  {
    id: 'superadmin-director',
    name: 'Bartimaeus Director',
    role: 'SuperAdmin',
    password: 'admin',
    email: 'director@bartimaeus.org',
    notes: 'Chief Director & Super Administrator (Full System Authority)',
    createdAt: '2026-08-19',
    isActive: true,
  },
  {
    id: 'teacher-admin',
    name: 'Staff Instructor',
    role: 'Teacher',
    password: 'trainer123',
    email: 'trainer@bartimaeus.org',
    notes: 'Staff Typing Instructor & Student Evaluator',
    createdAt: '2026-08-19',
    isActive: true,
  },
  {
    id: 'student-demo',
    name: 'Aarav Sharma',
    role: 'Student',
    password: 'student',
    email: 'aarav@bartimaeus.student',
    notes: 'Grade 9 - NVDA Screen Reader User',
    createdAt: '2026-08-19',
    isActive: true,
  },
];

function getUsers() {
  const current = readJSONFile(USERS_FILE, INITIAL_USERS);
  if (Array.isArray(current)) {
    const hasSuperAdmin = current.some((u) => u.role === 'SuperAdmin' || u.id === 'superadmin-director');
    if (!hasSuperAdmin) {
      const merged = [...INITIAL_USERS, ...current.filter((c) => !INITIAL_USERS.some((d) => d.id === c.id))];
      saveUsers(merged);
      return merged;
    }
  }
  return current;
}

function saveUsers(users) {
  return writeJSONFile(USERS_FILE, users);
}


const INITIAL_ASSIGNMENTS = [
  // =========================================================================
  // CATEGORY 1: TACTILE FOUNDATIONS & HOME ROW (Order 1 - 4)
  // Sources: TypeOnline UK & NIOS Chapter 3 (l3.pdf)
  // =========================================================================
  {
    id: 'assign-01-home-anchor',
    orderIndex: 1,
    categoryIndex: 1,
    category: 'Category 1: Tactile Foundations & Home Row',
    title: 'Lesson 01: Home Row Anchor Keys (A, S, D, F & J, K, L, ;)',
    description: 'Establish foundational tactile muscle memory using index finger bumps on F and J anchor keys.',
    targetReps: 10,
    timeLimitMinutes: 5,
    minAccuracy: 80,
    drills: [
      'asdf jkl; asdf jkl; fdsa ;lkj',
      'aaa sss ddd fff jjj kkk lll ;;;',
      'fjdk sl;a fjdk sl;a a;sldkfj',
      'fad lad ask fall alas salad flask',
      'dad had a salad as a lad',
      'ask all dads as salads fall',
      'flask falls as dads ask lads',
      'a lad asks all glad dads',
      'sad lads ask all glad dads',
      'asdf jkl; fdsa ;lkj dad lad salad',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },
  {
    id: 'assign-02-home-words',
    orderIndex: 2,
    categoryIndex: 1,
    category: 'Category 1: Tactile Foundations & Home Row',
    title: 'Lesson 02: Home Row Word Construction & Rhythm',
    description: 'Constructing complete English words and rhythmic patterns on the 8 home row keys.',
    targetReps: 10,
    timeLimitMinutes: 5,
    minAccuracy: 80,
    prerequisiteId: 'assign-01-home-anchor',
    drills: [
      'ask all fall salad flash flask',
      'glad half dash flash fall flag',
      'dad had a salad as a lad',
      'all glad lads ask for salads',
      'half a flask falls as lads dash',
      'flash a salad flask as lads ask',
      'a glad lad had a half salad',
      'dash all glad lads as salads fall',
      'ask dads as all lads fall glad',
      'salad flask dash flag half glad fall',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },
  {
    id: 'assign-03-home-cadence',
    orderIndex: 3,
    categoryIndex: 1,
    category: 'Category 1: Tactile Foundations & Home Row',
    title: 'Lesson 03: Home Row Cadence & Spacing Drills',
    description: 'Develop even typing cadence and thumb spacebar timing using TypeOnline home row drills.',
    targetReps: 10,
    timeLimitMinutes: 5,
    minAccuracy: 80,
    prerequisiteId: 'assign-02-home-words',
    drills: [
      'ah had lag slag ah had lag slag ah had ah had lag slag',
      'hash flash ask has hash flash ask has hash hash flash ask hash',
      'dash gash lash dash gash lash dash gash lash dash gash lash',
      'flag glad glass fall flag glad glass fall flag glad glass',
      'half hall fall salad half hall fall salad half hall fall',
      'shall fall flask dash shall fall flask dash shall fall flask',
      'a flash lad had asked all glad dads for salads',
      'half a glass flask had fallen as lads dashed',
      'all dads shall ask glad lads as salads fall',
      'glass flasks dash as glad lads flash half flags',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },
  {
    id: 'assign-04-home-sentences',
    orderIndex: 4,
    categoryIndex: 1,
    category: 'Category 1: Tactile Foundations & Home Row',
    title: 'Lesson 04: Home Row Fluid Sentence Flow',
    description: 'Full sentence flow and spacebar cadence using exclusive home row vocabulary.',
    targetReps: 10,
    timeLimitMinutes: 6,
    minAccuracy: 80,
    prerequisiteId: 'assign-03-home-cadence',
    drills: [
      'a dad had a salad and a flask',
      'all glad lads had a half salad',
      'ask a glad lad as a salad falls',
      'dads had asked all lads to dash',
      'a flask had fallen as a lad dashed',
      'glad dads ask lads as salads fall',
      'half a salad flask had fallen',
      'a lad had a flag and a flask',
      'all glad dads had asked for salads',
      'a glad lad dashes as salads fall',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },

  // =========================================================================
  // CATEGORY 2: UPPER & LOWER ROW REACH MASTERY (Order 5 - 8)
  // Sources: TypeOnline UK & NIOS Chapter 3 (l3.pdf) & SLBC Lesson 4
  // =========================================================================
  {
    id: 'assign-05-top-vowels',
    orderIndex: 5,
    categoryIndex: 2,
    category: 'Category 2: Upper & Lower Row Reach Mastery',
    title: 'Lesson 05: Top Row Vowel & Consonant Reaches (E, R, T, U, I, O, P, Q, W, Y)',
    description: 'Reaching upward from home row anchors to upper row keys without losing tactile orientation.',
    targetReps: 10,
    timeLimitMinutes: 5,
    minAccuracy: 80,
    prerequisiteId: 'assign-04-home-sentences',
    drills: [
      'qwert yuiop qwert yuiop poiuy trewq',
      'tree port rope write type quiet your write',
      'were you there when pure water was poured',
      'type true words with proper power',
      'great power requires pure thought',
      'water pour out your pure report',
      'quick youth write quiet letters',
      'their route require proper repair',
      'write your true thoughts with pride',
      'power route write tree port rope quiet',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },
  {
    id: 'assign-06-top-sentences',
    orderIndex: 6,
    categoryIndex: 2,
    category: 'Category 2: Upper & Lower Row Reach Mastery',
    title: 'Lesson 06: Upper Row Word & Sentence Flow',
    description: 'Building fluent phrases combining home row and top row reaches.',
    targetReps: 10,
    timeLimitMinutes: 5,
    minAccuracy: 80,
    prerequisiteId: 'assign-05-top-vowels',
    drills: [
      'write true reports with power and pride',
      'our youth require pure water and quiet rooms',
      'people write reports every year with great care',
      'we require your quick reply to our letter',
      'proper thought will guide your typing power',
      'their little sister were reading great stories',
      'you will write three polite letters today',
      'pure water pours quietly through their pipes',
      'trust your fingers to reach every upper key',
      'typewriters and computers require smooth rhythm',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },
  {
    id: 'assign-07-bottom-row',
    orderIndex: 7,
    categoryIndex: 2,
    category: 'Category 2: Upper & Lower Row Reach Mastery',
    title: 'Lesson 07: Bottom Row Downward Reaches (Z, X, C, V, B & N, M, ,, .)',
    description: 'Reaching downward accurately to bottom row consonant keys and punctuation.',
    targetReps: 10,
    timeLimitMinutes: 5,
    minAccuracy: 80,
    prerequisiteId: 'assign-06-top-sentences',
    drills: [
      'zxcvb nm,./ zxcvb nm,./ /.,mn bvcxz',
      'van man can box fix mix zero next examine',
      'move back down from home keys cleanly',
      'brave men venture over vast mountains',
      'maximum volume brings clear voice',
      'examine every box with much care',
      'citizens make vocal comments on common issues',
      'never vex brave men with heavy taxes',
      'calm minds overcome complex problems',
      'zero extra taxes vex five brave men',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },
  {
    id: 'assign-08-shift-capitalization',
    orderIndex: 8,
    categoryIndex: 2,
    category: 'Category 2: Upper & Lower Row Reach Mastery',
    title: 'Lesson 08: Left & Right Shift Key Capitalization Discipline',
    description: 'Master opposite-hand Shift key technique for flawless letter capitalization.',
    targetReps: 10,
    timeLimitMinutes: 5,
    minAccuracy: 80,
    prerequisiteId: 'assign-07-bottom-row',
    drills: [
      'Aarav Bangalore India Delhi Mumbai London Paris Tokyo',
      'Monday Tuesday Wednesday Thursday Friday Saturday Sunday',
      'January February March April May June July August September',
      'Bartimaeus Resource Centre empowers all students',
      'The National Institute of Open Schooling conducts exams',
      'Dr. Radhakrishnan taught great lessons of wisdom',
      'Karnataka State Council promotes digital education',
      'India is a land of rich cultural heritage and peace',
      'Knowledge and Discipline lead to great Achievement',
      'Success comes to those who Practice Diligently every Day',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },

  // =========================================================================
  // CATEGORY 3: INDIAN GOVT BASIC TYPING COURSE (GCC-TBC 30 WPM) (Order 9 - 13)
  // Sources: Official GCC-TBC Pune/Goa Syllabus (130232189--gcc-tbc-.pdf)
  // =========================================================================
  {
    id: 'assign-09-gcctbc-word-drills',
    orderIndex: 9,
    categoryIndex: 3,
    category: 'Category 3: Indian Govt Basic Course (GCC-TBC 30 WPM)',
    title: 'Lesson 09: GCC-TBC Official 4-Line Word Repetition Drills',
    description: 'Standard word repetition patterns prescribed for Indian Government Computer Typing Certification.',
    targetReps: 10,
    timeLimitMinutes: 5,
    minAccuracy: 85,
    prerequisiteId: 'assign-08-shift-capitalization',
    drills: [
      'all fall call tall ball hall mall wall small shall',
      'glad flag flat flash flame flap flaw flee float flood',
      'dark park mark lark bark shark spark remark market',
      'send lend bend mend tend spend trend friend blend',
      'take make cake fake lake rake sake bake wake flake',
      'book look took cook hook shook brook crook floor',
      'hand land sand band stand grand brand demand expand',
      'light night right sight tight fight flight bright slight',
      'office council government certificate basic course institute',
      'examination statement curriculum practical session confidence',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },
  {
    id: 'assign-10-gcctbc-sentences',
    orderIndex: 10,
    categoryIndex: 3,
    category: 'Category 3: Indian Govt Basic Course (GCC-TBC 30 WPM)',
    title: 'Lesson 10: GCC-TBC 30 WPM Standard Sentence Writing',
    description: 'Official government examination practice sentences designed for 30 Words Per Minute speed benchmark.',
    targetReps: 10,
    timeLimitMinutes: 5,
    minAccuracy: 85,
    prerequisiteId: 'assign-09-gcctbc-word-drills',
    drills: [
      'Hard work is the golden key to achieve success in every field of life.',
      'Regular practice makes a student perfect in touch typewriting and keyboarding.',
      'Computers play a vital role in modern government and private organizations.',
      'Accuracy and speed are equally important for all professional examinations.',
      'The Maharashtra State Council of Examinations conducts the typing course.',
      'Knowledge of modern computer software will help students work in any office.',
      'Students should maintain correct body posture while working on computers.',
      'Proper finger placement on the keyboard increases typing speed and accuracy.',
      'Digital literacy empowers visually impaired learners to achieve career goals.',
      'Dedication and sincere effort lead to excellent performance in examinations.',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },
  {
    id: 'assign-11-gcctbc-admin-terms',
    orderIndex: 11,
    categoryIndex: 3,
    category: 'Category 3: Indian Govt Basic Course (GCC-TBC 30 WPM)',
    title: 'Lesson 11: GCC-TBC Administrative & Official Office Terminology',
    description: 'Master official bureaucratic and clerical vocabulary used in government and banking sectors.',
    targetReps: 10,
    timeLimitMinutes: 5,
    minAccuracy: 85,
    prerequisiteId: 'assign-10-gcctbc-sentences',
    drills: [
      'Government Administration Secretariat Directorate Department Section',
      'Establishment Account Officer Superintendent Assistant Commissioner',
      'Memorandum Notification Resolution Circular Official Gazette',
      'Subject Reference Enclosure Acknowledgement Signature Designation',
      'Financial Budget Sanction Expenditure Revenue Audit Voucher',
      'Curriculum Vitae Qualification Experience Recommendation Verified',
      'Meeting Minutes Agenda Committee Chairperson Resolution Adopted',
      'Application Registration Allotment Confirmation Dispatched Order',
      'Public Service Commission Examination Roll Number Certificate Issued',
      'Respectfully Submitted for Favourable Consideration and Sanction',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },
  {
    id: 'assign-12-gcctbc-speed-passage-1',
    orderIndex: 12,
    categoryIndex: 3,
    category: 'Category 3: Indian Govt Basic Course (GCC-TBC 30 WPM)',
    title: 'Lesson 12: GCC-TBC Official Speed Passage (30 WPM Part I)',
    description: 'Official 30 WPM examination passage on industrial development and national progress.',
    targetReps: 10,
    timeLimitMinutes: 5,
    minAccuracy: 85,
    prerequisiteId: 'assign-11-gcctbc-admin-terms',
    drills: [
      'India is progressing rapidly in the field of science technology and industry.',
      'Our nation has established numerous educational institutions for modern youth.',
      'The development of computer skills has created vast employment opportunities.',
      'Every young student must cultivate technical skills to serve the nation effectively.',
      'Modern offices utilize computers for speedy and accurate communication systems.',
      'Continuous learning and hard work will always bring prosperity and happiness.',
      'The government has introduced several welfare schemes for social development.',
      'Vocational training empowers students to become financially independent and proud.',
      'Digital infrastructure connects rural and urban communities across all states.',
      'Let us strive together with dedication to build a strong and self-reliant country.',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },
  {
    id: 'assign-13-gcctbc-speed-passage-2',
    orderIndex: 13,
    categoryIndex: 3,
    category: 'Category 3: Indian Govt Basic Course (GCC-TBC 30 WPM)',
    title: 'Lesson 13: GCC-TBC Official Speed Passage (30 WPM Part II)',
    description: 'Official 30 WPM examination passage on trade, commerce, and environmental preservation.',
    targetReps: 10,
    timeLimitMinutes: 5,
    minAccuracy: 85,
    prerequisiteId: 'assign-12-gcctbc-speed-passage-1',
    drills: [
      'Trade and commerce are the lifeblood of economic growth and national wealth.',
      'Efficient transport and communication networks facilitate business transactions.',
      'Banks provide essential financial services to entrepreneurs and industries.',
      'Protecting our natural environment is the sacred duty of every responsible citizen.',
      'Forests prevent soil erosion and maintain ecological balance on the planet.',
      'Planting trees and conserving water resources will secure our future generations.',
      'Clean energy sources like solar and wind power reduce industrial pollution.',
      'Education creates awareness among people regarding health hygiene and sanitation.',
      'A healthy and educated population is the greatest asset of any progressive nation.',
      'Discipline cooperation and integrity are the true foundation of human civilization.',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },

  // =========================================================================
  // CATEGORY 4: NUMBERS, PUNCTUATION & TACTILE SYMBOLS (Order 14 - 17)
  // Sources: SLBC Typing Textbook & NIOS Chapter 3 (l3.pdf)
  // =========================================================================
  {
    id: 'assign-14-number-row',
    orderIndex: 14,
    categoryIndex: 4,
    category: 'Category 4: Numbers, Punctuation & Tactile Symbols',
    title: 'Lesson 14: Top Number Row Spatial Traversal (1, 2, 3, 4, 5, 6, 7, 8, 9, 0)',
    description: 'Master upward reaches to number row coordinates without losing home row contact.',
    targetReps: 10,
    timeLimitMinutes: 5,
    minAccuracy: 85,
    prerequisiteId: 'assign-13-gcctbc-speed-passage-2',
    drills: [
      '12345 67890 10203 40506 70809 09876 54321',
      'Room 101 has 24 chairs and 12 wooden desks',
      'The year 2026 marks 79 years of national growth',
      'Section 144 of the Act contains 35 clauses',
      'In 1947 our nation gained historic freedom and glory',
      'Train number 12627 leaves platform 4 at 18:30 hours',
      'The invoice totals 4580 rupees with 18 percent tax',
      'Speed increased from 25 words to 45 words per minute',
      'Telephone 080 23456789 extension 402 for assistance',
      'Pincode 560001 covers Bangalore Central General Post Office',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },
  {
    id: 'assign-15-punctuation-marks',
    orderIndex: 15,
    categoryIndex: 4,
    category: 'Category 4: Numbers, Punctuation & Tactile Symbols',
    title: 'Lesson 15: Essential Punctuation Mechanics (Period, Comma, Colon, Semicolon)',
    description: 'Master punctuation key locations and single-space typing rules.',
    targetReps: 10,
    timeLimitMinutes: 5,
    minAccuracy: 85,
    prerequisiteId: 'assign-14-number-row',
    drills: [
      'Reading, writing, and arithmetic: these are fundamental skills.',
      'Life is short; art is long; opportunity is fleeting.',
      'She bought apples, oranges, bananas, and grapes at the market.',
      'The schedule is fixed: Monday, Wednesday, and Friday mornings.',
      'To succeed, one must work hard; to excel, one must persevere.',
      'Bangalore, Karnataka; Chennai, Tamil Nadu; Hyderabad, Telangana.',
      'First, listen carefully; second, practice diligently; third, succeed.',
      'He arrived on time; however, the meeting was postponed.',
      'Please bring the following items: notebook, pencil, and keyboard.',
      'Patience, persistence, and perspiration make an unbeatable combination.',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },
  {
    id: 'assign-16-quotes-apostrophes',
    orderIndex: 16,
    categoryIndex: 4,
    category: 'Category 4: Numbers, Punctuation & Tactile Symbols',
    title: 'Lesson 16: Quotation Marks, Apostrophes & Parentheses',
    description: 'Handle dialogues, contractions, possessives, and enclosed parenthetical thoughts.',
    targetReps: 10,
    timeLimitMinutes: 5,
    minAccuracy: 85,
    prerequisiteId: 'assign-15-punctuation-marks',
    drills: [
      '"Practice makes perfect," said the wise instructor.',
      'It\'s important that students don\'t skip their daily drills.',
      'The teacher\'s notebook contained all students\' weekly scores.',
      '"Knowledge is power," wrote Francis Bacon in his essay.',
      'We shouldn\'t underestimate a learner\'s determination and focus.',
      'The institute (established in 2020) provides free accessible training.',
      '"Always believe in yourself," reminded the principal gently.',
      'They couldn\'t finish on time, but they didn\'t lose hope.',
      'The student\'s speed (measured in WPM) reached a new record.',
      '"Determination and courage will conquer all obstacles," he declared.',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },
  {
    id: 'assign-17-special-symbols',
    orderIndex: 17,
    categoryIndex: 4,
    category: 'Category 4: Numbers, Punctuation & Tactile Symbols',
    title: 'Lesson 17: Arithmetic, Financial & Code Symbols (@, #, $, %, &, *, +, =)',
    description: 'Navigate technical and operational symbols across upper row shift positions.',
    targetReps: 10,
    timeLimitMinutes: 5,
    minAccuracy: 85,
    prerequisiteId: 'assign-16-quotes-apostrophes',
    drills: [
      'Email: student@bartimaeus.org & trainer@bartimaeus.org',
      'Ticket #402: Invoice value $250 + 18% GST = $295 total',
      'Calculate: (10 + 20) * 5 / 2 = 75 in mathematical logic',
      'Connect via Wi-Fi: SSID #Bartimaeus_Guest_2026 & pass #TouchType',
      'Discount offer: 25% off on books & 15% off on stationery items',
      'Formula: Area = Length * Breadth & Volume = Area * Height',
      'Username: @student_aarav #Grade9 & score = 95% accuracy',
      'Equation: a + b = c; where x * y = z & ratio = 100%',
      'Support link: help@education.gov.in & phone #1800-11-2026',
      'Summary: 100% attendance + 95% accuracy = Outstanding Grade',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },

  // =========================================================================
  // CATEGORY 5: ACCURACY MASTERY & DOUBLE-LETTER DRILLS (Order 18 - 21)
  // Sources: Alberta Distance Learning Courseware (typewriting20les00albe.pdf)
  // =========================================================================
  {
    id: 'assign-18-alberta-vowels',
    orderIndex: 18,
    categoryIndex: 5,
    category: 'Category 5: Accuracy Mastery & Double-Letter Drills',
    title: 'Lesson 18: Alberta Double-Letter Vowel Mastery (AA, EE, OO)',
    description: 'Precision double-strike finger drills to eradicate hesitation and mistyped adjacent vowel keys.',
    targetReps: 10,
    timeLimitMinutes: 5,
    minAccuracy: 90,
    prerequisiteId: 'assign-17-special-symbols',
    drills: [
      'aaa aid aaa all aaa alas aaa apart aaa salad aaa appeal',
      'eee see eee meet eee speed eee feel eee weed eee need',
      'ooo look ooo good ooo book ooo moon ooo tool ooo cool',
      'keep seeing green trees deep between sweet green fields',
      'good books look good to school children on cool afternoons',
      'keen deer meet three geese near sweet green apple trees',
      'speedy feet feel smooth wood on school sports grounds',
      'cook good food for noon meals in clean school kitchens',
      'deep roots feed green trees as sweet blossoms appear',
      'see good books and meet keen students for free typing practice',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },
  {
    id: 'assign-19-alberta-consonants',
    orderIndex: 19,
    categoryIndex: 5,
    category: 'Category 5: Accuracy Mastery & Double-Letter Drills',
    title: 'Lesson 19: Alberta Double-Letter Consonant Mastery (LL, TT, SS, FF, PP)',
    description: 'Consonant double-tap discipline for fast fluid rhythm across high-frequency words.',
    targetReps: 10,
    timeLimitMinutes: 5,
    minAccuracy: 90,
    prerequisiteId: 'assign-18-alberta-vowels',
    drills: [
      'lll call fall tell hill skill will tall small scroll still',
      'ttt little better matter letter setting attempt button butter',
      'sss pass miss class glass grass bless address across lesson',
      'fff staff cliff stiff buffer coffee traffic effect official',
      'ppp happy apple apply supply support appear happen puppet',
      'little matters settle better after writing polite letters',
      'all skilled staff will pass across the small hill happily',
      'coffee cups fill small tables as happy colleagues chat',
      'official letters address common matters with great clarity',
      'successful students apply full effort across all typing lessons',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },
  {
    id: 'assign-20-alberta-complex-blends',
    orderIndex: 20,
    categoryIndex: 5,
    category: 'Category 5: Accuracy Mastery & Double-Letter Drills',
    title: 'Lesson 20: Alberta Complex Letter Blends (X, C, V, Z Combination Drills)',
    description: 'Intensive drills targeting difficult outer finger lateral reaches and rare digraphs.',
    targetReps: 10,
    timeLimitMinutes: 5,
    minAccuracy: 90,
    prerequisiteId: 'assign-19-alberta-consonants',
    drills: [
      'xxx six sxs box sxs next sxs taxes sxs index sxs extras xxx',
      'ccc pick csc coast csc candy csc circus csc action csc collect',
      'vvv voice vsv heavy vsv travel vsv clever vsv receive vsv',
      'zzz zero zsz breeze zsz prize zsz bronze zsz puzzle zsz',
      'six clever executives examine complex tax indexes with care',
      'citizens voice active support for public health clinics',
      'collect sixty prize boxes containing delicate bronze objects',
      'exact calculation avoids serious mistakes in financial budgets',
      'breezy weather invigorates travelers climbing rocky mountains',
      'maximize typing accuracy through continuous and disciplined focus',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },
  {
    id: 'assign-21-zero-error-sprint',
    orderIndex: 21,
    categoryIndex: 5,
    category: 'Category 5: Accuracy Mastery & Double-Letter Drills',
    title: 'Lesson 21: The 100% True Accuracy Perfection Sprint',
    description: 'A demanding precision drill where rhythm, confidence, and zero mistakes are enforced.',
    targetReps: 10,
    timeLimitMinutes: 5,
    minAccuracy: 95,
    prerequisiteId: 'assign-20-alberta-complex-blends',
    drills: [
      'Accuracy is the true foundation upon which all typing speed is built.',
      'Never sacrifice accuracy for speed in professional keyboarding work.',
      'Control your finger movements with calm rhythm and steady confidence.',
      'Each keystroke must be deliberate crisp and accurately placed.',
      'Smooth rhythm eliminates tension and prevents typing fatigue.',
      'Discipline in daily practice produces permanent touch typing excellence.',
      'A skilled typist keys text effortlessly without conscious hesitation.',
      'Mastery of keyboard coordinates transforms thinking into direct words.',
      'Focus your entire attention on the target word before striking the keys.',
      'Precision and consistency are the hallmarks of a true master typist.',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },

  // =========================================================================
  // CATEGORY 6: PROFESSIONAL SENTENCE FORMATTING (SLBC 10–45 WPM) (Order 22 - 25)
  // Sources: SLBC Basic Typing & Sentence Formatting (Typing Textbook.pdf)
  // =========================================================================
  {
    id: 'assign-22-slbc-proper-case',
    orderIndex: 22,
    categoryIndex: 6,
    category: 'Category 6: Professional Sentence Formatting (SLBC)',
    title: 'Lesson 22: SLBC Proper Case & Sentence Capitalization Rules',
    description: 'Master formal capitalization rules for proper nouns, book titles, and formal correspondence.',
    targetReps: 10,
    timeLimitMinutes: 5,
    minAccuracy: 90,
    prerequisiteId: 'assign-21-zero-error-sprint',
    drills: [
      'The President of India addressed the Parliament in New Delhi today.',
      'The Constitution of India guarantees fundamental rights to all citizens.',
      'Professor Amartya Sen received the Nobel Memorial Prize in Economics.',
      'Students read Shakespeare\'s Hamlet and Milton\'s Paradise Lost in class.',
      'The Indian Space Research Organisation launched the Chandrayaan mission.',
      'Prime Minister Jawaharlal Nehru delivered the famous Tryst with Destiny speech.',
      'The Supreme Court of India is located on Tilak Marg in New Delhi.',
      'The Ministry of Education promotes digital accessibility for all learners.',
      'Rabindranath Tagore composed our national anthem Jana Gana Mana with pride.',
      'Great leaders inspire future generations through noble actions and wisdom.',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },
  {
    id: 'assign-23-slbc-clause-flow',
    orderIndex: 23,
    categoryIndex: 6,
    category: 'Category 6: Professional Sentence Formatting (SLBC)',
    title: 'Lesson 23: SLBC Clause Construction & Sentence Mechanics',
    description: 'Constructing compound and complex sentences with proper subordinate clauses and conjunctions.',
    targetReps: 10,
    timeLimitMinutes: 5,
    minAccuracy: 90,
    prerequisiteId: 'assign-22-slbc-proper-case',
    drills: [
      'Although the weather was stormy, the brave sailors set out to sea.',
      'If you practice touch typing every day, you will achieve high speed.',
      'Since knowledge is boundless, a wise scholar continues learning forever.',
      'Because she worked with diligence, she passed the examination with distinction.',
      'While the instructor explained the concepts, the students took clear notes.',
      'Whenever an opportunity arises, one should seize it with enthusiasm.',
      'Unless we protect our natural resources, future generations will suffer.',
      'As soon as the bell rang, the enthusiastic children entered the classroom.',
      'Though the road was steep and winding, the travelers reached the mountain top.',
      'Where there is genuine unity and goodwill, there is always peace and prosperity.',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },
  {
    id: 'assign-24-slbc-dialogue-quotes',
    orderIndex: 24,
    categoryIndex: 6,
    category: 'Category 6: Professional Sentence Formatting (SLBC)',
    title: 'Lesson 24: SLBC Dialogue & Quotation Formatting Rules',
    description: 'Rules for spacing, comma placement inside quotation marks, and multi-speaker dialogue formatting.',
    targetReps: 10,
    timeLimitMinutes: 5,
    minAccuracy: 90,
    prerequisiteId: 'assign-23-slbc-clause-flow',
    drills: [
      '"Education is the most powerful weapon," remarked Nelson Mandela.',
      '"The only way to do great work," said Steve Jobs, "is to love what you do."',
      '"Have you completed your typing assignment?" inquired the teacher gently.',
      '"Yes," replied Aarav cheerfully, "I achieved ninety-five percent accuracy today!"',
      '"Be the change that you wish to see in the world," taught Mahatma Gandhi.',
      '"Do not stop until the goal is reached," declared Swami Vivekananda.',
      '"Where the mind is without fear," wrote Tagore, "and the head is held high."',
      '"Accessibility is not a feature," emphasized the trainer, "it is a fundamental right."',
      '"Success is no accident," asserted the champion, "it is hard work and perseverance."',
      '"Let us dedicate ourselves," proclaimed the leader, "to the service of humanity."',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },
  {
    id: 'assign-25-slbc-speed-35wpm',
    orderIndex: 25,
    categoryIndex: 6,
    category: 'Category 6: Professional Sentence Formatting (SLBC)',
    title: 'Lesson 25: SLBC Professional 35–40 WPM Benchmark Passages',
    description: 'High-density academic and professional paragraphs designed to push sustained speed beyond 35 WPM.',
    targetReps: 10,
    timeLimitMinutes: 5,
    minAccuracy: 90,
    prerequisiteId: 'assign-24-slbc-dialogue-quotes',
    drills: [
      'The modern digital economy relies heavily upon rapid and accurate data processing.',
      'Touch typing allows professionals to compose complex thoughts without mental distraction.',
      'Assistive technology has revolutionized communication for visually impaired individuals.',
      'Through screen readers and tactile keyboards, blind learners access universal knowledge.',
      'High-speed typing enables students to take comprehensive lecture notes in real time.',
      'Professional transcription and office management demand speed with absolute accuracy.',
      'Continuous practice strengthens finger agility and establishes subconscious muscle memory.',
      'Digital empowerment fosters self-reliance, vocational independence, and career growth.',
      'The pursuit of excellence requires consistent dedication, discipline, and optimism.',
      'Congratulations on mastering advanced professional sentence formatting and speed typing.',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },

  // =========================================================================
  // CATEGORY 7: SCREEN READER COMMANDS & SPEED ENDURANCE (Order 26 - 28)
  // Sources: Bartimaeus Assistive Tech Blueprint & Advanced Speed Drills
  // =========================================================================
  {
    id: 'assign-26-screen-reader-hotkeys',
    orderIndex: 26,
    categoryIndex: 7,
    category: 'Category 7: Screen Reader Commands & Speed Endurance',
    title: 'Lesson 26: Screen Reader Commands & Assistive Tech Vocabulary',
    description: 'Type key screen reader terminology, shortcut concepts, and audio feedback controls.',
    targetReps: 10,
    timeLimitMinutes: 5,
    minAccuracy: 90,
    prerequisiteId: 'assign-25-slbc-speed-35wpm',
    drills: [
      'NVDA modifier key Insert and CapsLock allow easy command execution.',
      'Press Insert plus Down Arrow to read continuous text from current position.',
      'JAWS virtual PC cursor navigates web pages using H for headings and K for links.',
      'VoiceOver on Apple devices utilizes Control plus Option as the master VO keys.',
      'Press Tab to advance focus to the next interactive control or button.',
      'Press Shift plus Tab to navigate backward through accessible landmark elements.',
      'Screen reader synthesizers convert written text into natural spoken speech.',
      'ARIA live regions inform non-visual users of real-time interface changes.',
      'Tactile landmark keys F and J allow instant home row finger repositioning.',
      'Non-visual typing mastery unlocks boundless opportunities in the modern world.',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },
  {
    id: 'assign-27-cloud-workspace',
    orderIndex: 27,
    categoryIndex: 7,
    category: 'Category 7: Screen Reader Commands & Speed Endurance',
    title: 'Lesson 27: Cloud Workspace & Digital Office Terminology',
    description: 'Master terminology for Google Workspace, Microsoft 365, and online collaboration.',
    targetReps: 10,
    timeLimitMinutes: 5,
    minAccuracy: 90,
    prerequisiteId: 'assign-26-screen-reader-hotkeys',
    drills: [
      'Google Docs allows real-time collaborative document creation and cloud editing.',
      'Press Control Alt H in Google Docs to navigate among document headings quickly.',
      'Google Sheets provides accessible spreadsheet calculations with formula support.',
      'Google Drive stores files securely in the cloud with instant sharing permissions.',
      'Google Meet enables virtual classroom learning with automated closed captioning.',
      'Microsoft Word provides comprehensive formatting tools for professional reports.',
      'Microsoft Excel organizes complex data into structured rows and columns cleanly.',
      'Cloud computing allows learners to access their assignments from any computer.',
      'Digital literacy empowers students to collaborate on global academic projects.',
      'Assistive technology ensures equal participation in modern workplace environments.',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },
  {
    id: 'assign-28-high-speed-stamina',
    orderIndex: 28,
    categoryIndex: 7,
    category: 'Category 7: Screen Reader Commands & Speed Endurance',
    title: 'Lesson 28: 45+ WPM High-Speed Stamina Sprint (Master Certification)',
    description: 'The ultimate graduation endurance challenge: 45+ WPM sustained touch-typing speed.',
    targetReps: 10,
    timeLimitMinutes: 5,
    minAccuracy: 90,
    prerequisiteId: 'assign-27-cloud-workspace',
    drills: [
      'Touch typing is a liberating skill that unlocks the full power of the human mind.',
      'With every keystroke, your fingers translate abstract thoughts into permanent reality.',
      'The journey of learning touch typing transforms hesitation into effortless rhythm.',
      'Dedication, patience, and daily practice have made you a true master of the keyboard.',
      'You can now key words swiftly, accurately, and with absolute non-visual confidence.',
      'Your speed and precision will empower you in education, career, and lifelong pursuits.',
      'Bartimaeus Resource Centre is immensely proud of your outstanding achievement today.',
      'Carry this confidence forward to conquer every digital horizon and personal dream.',
      'Never forget that disciplined practice and belief in yourself can overcome all limits.',
      'Congratulations on graduating as a certified Master Touch Typist with highest honors!',
    ],
    assignedTo: ['all'],
    createdAt: '2026-08-19',
    createdBy: 'Bartimaeus Instructor',
  },
];

function getAssignments() {
  const current = readJSONFile(ASSIGNMENTS_FILE, INITIAL_ASSIGNMENTS);
  if (!Array.isArray(current) || current.length < INITIAL_ASSIGNMENTS.length) {
    const defaultIds = new Set(INITIAL_ASSIGNMENTS.map((d) => d.id));
    const custom = (current || []).filter((c) => !defaultIds.has(c.id));
    const merged = [...INITIAL_ASSIGNMENTS, ...custom].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    saveAssignments(merged);
    return merged;
  }
  return current;
}


function saveAssignments(assignments) {
  return writeJSONFile(ASSIGNMENTS_FILE, assignments);
}

function getProgress() {
  return readJSONFile(PROGRESS_FILE, []);
}

function saveProgress(progress) {
  return writeJSONFile(PROGRESS_FILE, progress);
}

// -----------------------------------------------------------------------------
// REST API Endpoints
// -----------------------------------------------------------------------------

/**
 * Health check & platform metrics (used by Render health monitor)
 */
app.get('/api/health', (req, res) => {
  const users = getUsers();
  const assignments = getAssignments();
  res.json({
    status: 'healthy',
    institution: 'Bartimaeus Resource Centre',
    uptimeSeconds: Math.floor(process.uptime()),
    studentsCount: users.filter((u) => u.role === 'Student').length,
    assignmentsCount: assignments.length,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * Register New Student Account (First Launch Setup)
 */
app.post('/api/auth/register', (req, res) => {
  const { name, password, role = 'Student', notes, teacherPasscode } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!password || password.trim().length < 3) {
    return res.status(400).json({ error: 'Password must be at least 3 characters' });
  }

  // Role verification
  let assignedRole = 'Student';
  if (role === 'Teacher' || role === 'SuperAdmin') {
    const code = teacherPasscode?.trim().toLowerCase();
    if (code === 'director2026' || code === 'superadmin') {
      assignedRole = 'SuperAdmin';
    } else if (code === 'bartimaeus2026' || code === 'admin') {
      assignedRole = 'Teacher';
    } else {
      return res.status(403).json({ error: 'Invalid Staff/Director Access Passcode' });
    }
  }

  const users = getUsers();
  const normalizedName = name.trim().toLowerCase();

  const existing = users.find((u) => u.name.trim().toLowerCase() === normalizedName);
  if (existing) {
    return res.status(400).json({ error: 'An account with this name already exists. Please log in.' });
  }

  const newUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    role: assignedRole,
    password: password.trim(),
    notes: notes?.trim() || `${assignedRole} registered on ${new Date().toLocaleDateString()}`,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  // Return user without password
  const { password: _, ...safeUser } = newUser;
  res.status(201).json({
    success: true,
    message: 'Registration successful',
    user: safeUser,
  });
});

/**
 * Login Student or Teacher
 */
app.post('/api/auth/login', (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: 'Please enter both name and password' });
  }

  const users = getUsers();
  const normalizedName = name.trim().toLowerCase();

  const user = users.find(
    (u) => u.name.trim().toLowerCase() === normalizedName && u.password === password.trim()
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid name or password. Please check your credentials.' });
  }

  user.lastLogin = new Date().toISOString();
  saveUsers(users);

  const { password: _, ...safeUser } = user;
  res.json({
    success: true,
    message: `Welcome back, ${user.name}!`,
    user: safeUser,
  });
});

/**
 * Get Curriculum / Assignments (Ordered sequentially)
 */
app.get('/api/curriculum', (req, res) => {
  const assignments = getAssignments();
  // Sort by orderIndex ascending
  const sorted = assignments.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  res.json({ assignments: sorted });
});

/**
 * Sync / Seed Curriculum (Teacher or Initial setup)
 */
app.post('/api/curriculum/sync', (req, res) => {
  const { assignments } = req.body;
  if (!Array.isArray(assignments)) {
    return res.status(400).json({ error: 'Expected array of assignments' });
  }
  saveAssignments(assignments);
  res.json({ success: true, count: assignments.length });
});

/**
 * Get Student Progress & Unlocked Status
 */
app.get('/api/progress/:studentId', (req, res) => {
  const { studentId } = req.params;
  const allProgress = getProgress();
  const studentRecords = allProgress.filter((p) => p.studentId === studentId);
  res.json({ progress: studentRecords });
});

/**
 * Record Exercise Attempt (Calculates Sequential Progression)
 */
app.post('/api/progress', (req, res) => {
  const record = req.body;

  if (!record.studentId || !record.assignmentId) {
    return res.status(400).json({ error: 'studentId and assignmentId are required' });
  }

  const allProgress = getProgress();
  const newRecord = {
    id: `prog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    ...record,
    timestamp: record.timestamp || new Date().toISOString(),
  };

  allProgress.unshift(newRecord);
  saveProgress(allProgress);

  res.status(201).json({ success: true, record: newRecord });
});

/**
 * User Management APIs: Get All Users, Add/Update User, Reset Password, Delete User
 */
app.get('/api/users', (req, res) => {
  const users = getUsers();
  // Return all registered users
  res.json({ users });
});

app.post('/api/users', (req, res) => {
  const user = req.body;
  if (!user || !user.name) {
    return res.status(400).json({ error: 'User name is required' });
  }

  const users = getUsers();
  const index = users.findIndex((u) => u.id === user.id || u.name.trim().toLowerCase() === user.name.trim().toLowerCase());

  if (index >= 0) {
    users[index] = { ...users[index], ...user };
  } else {
    const newUser = {
      id: user.id || `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: user.name.trim(),
      role: user.role || 'Student',
      password: user.password ? user.password.trim() : user.role === 'Teacher' ? 'trainer123' : 'student',
      email: user.email?.trim() || '',
      notes: user.notes?.trim() || '',
      createdAt: user.createdAt || new Date().toISOString(),
      isActive: user.isActive !== false,
    };
    users.push(newUser);
  }

  saveUsers(users);
  res.json({ success: true, users });
});

app.post('/api/users/reset-password', (req, res) => {
  const { userId, newPassword } = req.body;
  if (!userId || !newPassword) {
    return res.status(400).json({ error: 'userId and newPassword are required' });
  }

  const users = getUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.password = newPassword.trim();
  saveUsers(users);

  res.json({ success: true, message: `Password reset successfully for ${user.name}`, users });
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  let users = getUsers();
  const target = users.find((u) => u.id === id);

  if (target && target.role === 'SuperAdmin') {
    return res.status(403).json({ error: 'Cannot delete SuperAdmin account' });
  }

  users = users.filter((u) => u.id !== id);
  saveUsers(users);
  res.json({ success: true, users });
});

/**
 * Instructor API: Get All Enrolled Students & Summary Analytics
 */
app.get('/api/teacher/students', (req, res) => {
  const users = getUsers();
  const progressList = getProgress();
  const assignments = getAssignments();

  const students = users
    .filter((u) => u.role === 'Student')
    .map((s) => {
      const studentProgress = progressList.filter((p) => p.studentId === s.id);
      const completedRecords = studentProgress.filter((p) => p.completed);
      const avgAccuracy =
        studentProgress.length > 0
          ? Math.round(studentProgress.reduce((acc, c) => acc + c.accuracy, 0) / studentProgress.length)
          : 0;
      const maxWpm = studentProgress.length > 0 ? Math.max(...studentProgress.map((p) => p.wpm)) : 0;
      const totalTimeSecs = studentProgress.reduce((acc, c) => acc + c.timeSpent, 0);

      const { password: _, ...safeStudent } = s;
      return {
        ...safeStudent,
        totalAttempts: studentProgress.length,
        completedLessonsCount: completedRecords.length,
        avgAccuracy,
        maxWpm,
        totalTimeMinutes: Math.round(totalTimeSecs / 60),
      };
    });

  res.json({ students, assignmentsCount: assignments.length, totalProgressRecords: progressList.length });
});

/**
 * Instructor API: Reset Student Password
 */
app.post('/api/teacher/students/reset-password', (req, res) => {
  const { studentId, newPassword } = req.body;
  if (!studentId || !newPassword) {
    return res.status(400).json({ error: 'studentId and newPassword are required' });
  }

  const users = getUsers();
  const student = users.find((u) => u.id === studentId);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  student.password = newPassword.trim();
  saveUsers(users);

  res.json({ success: true, message: `Password reset successfully for ${student.name}`, users });
});

/**
 * Assignments API (Curriculum Management)
 */
const saveOrUpdateAssignmentHandler = (req, res) => {
  const assignment = req.body;
  if (!assignment.title || !assignment.drills || !assignment.drills.length) {
    return res.status(400).json({ error: 'Assignment title and drills are required' });
  }

  const assignments = getAssignments();
  const index = assignments.findIndex((a) => a.id === assignment.id);

  if (index >= 0) {
    assignments[index] = { ...assignments[index], ...assignment };
  } else {
    const maxOrder = assignments.reduce((max, a) => Math.max(max, a.orderIndex || 0), 0);
    const newAssignment = {
      id: assignment.id || `drill-${Date.now()}`,
      orderIndex: assignment.orderIndex || maxOrder + 1,
      targetReps: assignment.targetReps || 10,
      timeLimitMinutes: assignment.timeLimitMinutes || 5,
      minAccuracy: assignment.minAccuracy || 80,
      category: assignment.category || 'Category 1: Tactile Foundations & Home Row',
      categoryIndex: assignment.categoryIndex || 1,
      ...assignment,
      createdAt: assignment.createdAt || new Date().toISOString().split('T')[0],
    };
    assignments.push(newAssignment);
  }

  saveAssignments(assignments);
  res.json({ success: true, assignments });
};

app.post('/api/teacher/assignments', saveOrUpdateAssignmentHandler);
app.post('/api/assignments', saveOrUpdateAssignmentHandler);

const deleteAssignmentHandler = (req, res) => {
  const { id } = req.params;
  let assignments = getAssignments();
  assignments = assignments.filter((a) => a.id !== id);
  saveAssignments(assignments);
  res.json({ success: true, assignments });
};

app.delete('/api/teacher/assignments/:id', deleteAssignmentHandler);
app.delete('/api/assignments/:id', deleteAssignmentHandler);

// -----------------------------------------------------------------------------
// Serve Production Frontend SPA
// -----------------------------------------------------------------------------
const DIST_DIR = path.join(__dirname, 'dist');

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=================================================================`);
    console.log(`  BARTIMAEUS ACCESSIBLE TYPING ENGINE SERVER`);
    console.log(`  Institution: Bartimaeus Resource Centre`);
    console.log(`  Port: ${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=================================================================`);
  });
}

export default app;
