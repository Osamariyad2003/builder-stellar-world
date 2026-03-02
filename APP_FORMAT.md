# MedJust Admin Dashboard - App Format & Architecture

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Directory Structure](#directory-structure)
3. [Technology Stack](#technology-stack)
4. [Database Collections](#database-collections)
5. [Core Features](#core-features)
6. [Routing Structure](#routing-structure)
7. [Component Architecture](#component-architecture)
8. [Data Flow](#data-flow)
9. [Authentication](#authentication)
10. [Styling](#styling)

---

## 🎯 Project Overview

**MedJust** is a comprehensive admin dashboard for university student management built with:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express + Netlify Functions
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Hosting**: GitHub Pages / Netlify

**Purpose**: Manage university resources including:
- News & announcements
- Academic years and batches
- Books & research papers
- Video lectures and resources
- Quizzes and flashcards
- MCQ management
- Maps & locations
- Student data
- Orders & store management
- Professors directory

---

## 📁 Directory Structure

```
project-root/
├── client/                          # Frontend React App
│   ├── components/
│   │   ├── admin/
│   │   │   ├── Layout.tsx          # Admin layout wrapper
│   │   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   │   ├── NewsForm.tsx        # News creation form
│   │   │   ├── ResearchForm.tsx    # Research creation form
│   │   │   ├── MCQForm.tsx         # MCQ creation form
│   │   │   ├── QuizForm.tsx        # Quiz creation form
│   │   │   ├── ProfessorForm.tsx   # Professor form
│   │   │   ├── FileForm.tsx        # File upload form
│   │   │   ├── LectureForm.tsx     # Lecture form
│   │   │   ├── ProductForm.tsx     # Store product form
│   │   │   └── OrderCard.tsx       # Order display card
│   │   ├── student/
│   │   │   ├── ResearchContactMethods.tsx    # Research contact UI
│   │   │   ├── BookCard.tsx                  # Book display card
│   │   │   └── MapVideoCard.tsx              # Video thumbnail card
│   │   └── ui/                     # Shadcn UI Components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── dialog.tsx
│   │       ├── badge.tsx
│   │       ├── textarea.tsx
│   │       └── ... (40+ more)
│   ├── contexts/
│   │   └── AuthContext.tsx         # Global auth state
│   ├── hooks/
│   │   ├── useBooks.ts             # Books CRUD hook
│   │   ├── useNews.ts              # News CRUD hook
│   │   ├── useMCQ.ts               # MCQ CRUD hook
│   │   ├── useResearch.ts          # Research CRUD hook
│   │   ├── useLectures.ts          # Lectures CRUD hook
│   │   ├── useMaps.ts              # Maps CRUD hook
│   │   ├── useFCM.ts               # Firebase Cloud Messaging hook
│   │   └── ... (more hooks)
│   ├── lib/
│   │   ├── firebase.ts             # Firebase config
│   │   ├── fcmService.ts           # FCM client service
│   │   ├── firebaseMonitor.ts      # Connection monitoring
│   │   ├── cacheManager.ts         # LocalStorage caching
│   │   ├── cloudinary.ts           # Image upload service
│   │   ├── imagekit.ts             # Image upload fallback
│   │   └── utils.ts                # Utility functions
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── Dashboard.tsx       # Main dashboard
│   │   │   ├── News.tsx            # News management
│   │   │   ├── Years.tsx           # Academic years
│   │   │   ├── YearPage.tsx        # Year details
│   │   │   ├── Books.tsx           # Books management
│   │   │   ├── Research.tsx        # Research projects
│   │   │   ├── MCQ.tsx             # MCQ management
│   │   │   ├── Quizzes.tsx         # Quizzes management
│   │   │   ├── Professors.tsx      # Professors directory
│   │   │   ├── Users.tsx           # Student/user management
│   │   │   ├── Maps.tsx            # Maps & locations
│   │   │   ├── Store.tsx           # Store management
│   │   │   ├── Orders.tsx          # Orders management
│   │   │   ├── Settings.tsx        # Admin settings
│   │   │   └── ... (more pages)
│   │   ├── Login.tsx               # Login page
│   │   ├── Dashboard.tsx           # Dashboard
│   │   ├── Index.tsx               # Landing page
│   │   └── NotFound.tsx            # 404 page
│   ├── App.tsx                     # Main app with routing
│   ├── global.css                  # Global styles
│   └── vite-env.d.ts              # Vite type definitions
├── server/
│   ├── routes/
│   │   ├── fcmService.ts           # FCM backend service
│   │   ├── notifications.ts        # Notification handlers
│   │   ├── cloudinary.ts           # Cloudinary integration
│   │   ├── cloudinaryConfig.ts     # Config endpoint
│   │   ├── cloudinaryUpload.ts     # Upload handler
│   │   ├── imagekitUpload.ts       # ImageKit upload
│   │   ├── imagekitAuth.ts         # ImageKit auth
│   │   └── demo.ts                 # Demo endpoint
│   ├── index.ts                    # Express server setup
│   └── node-build.ts               # Node build script
├── shared/
│   ├── types.ts                    # TypeScript interfaces
│   └── api.ts                      # API utilities
├── public/
│   ├── firebase-messaging-sw.js   # Service worker
│   └── ... (assets)
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
├── tailwind.config.ts              # Tailwind CSS config
├── vite.config.ts                  # Vite config
├── vite.config.server.ts           # Server build config
└── ... (config files)
```

---

## 🛠 Technology Stack

### Frontend
```
React 18.3.1              - UI framework
TypeScript 5.5.3          - Type safety
Vite 6.2.2                - Build tool & dev server
React Router 6.26.2       - Client-side routing
React Hook Form 7.59.0    - Form management
Tailwind CSS 3.4.11       - Styling
Shadcn UI                 - Component library
Lucide React 0.462.0      - Icons
Recharts 2.12.7           - Charts
React Query 5.81.5        - Data fetching
```

### Backend
```
Express 4.18.2            - Web framework
Node.js                   - Runtime
Netlify Functions         - Serverless
```

### Database & Services
```
Firebase 11.10.0
  - Authentication
  - Firestore Database
  - Cloud Messaging (FCM)
  - Storage
```

### Image Services
```
Cloudinary                - Primary image upload
ImageKit                  - Fallback image upload
```

---

## 📊 Database Collections

### 1. **users**
```typescript
{
  id: string;
  displayName?: string;
  email: string;
  role: "admin" | "staff" | "student";
  photoURL?: string;
  createdAt: Date;
  yearId?: string;
  yearLabel?: string;
  fcmTokens?: string[];
  batchId?: string;
}
```

### 2. **news**
```typescript
{
  id: string;
  title: BilingualText; // { en: string, ar: string }
  content: BilingualText;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  authorName: string;
  authorId: string;
  tags: { en: string[], ar: string[] };
  isPinned: boolean;
  viewsCount: number;
  attachments?: string[];
  videoUrl?: string;
  yearId?: string;
  batchId?: string;
  sendNotification?: boolean;
}
```

### 3. **books**
```typescript
{
  id: string;
  title: string;
  author: string;
  description?: string;
  isbn?: string;
  publishedDate?: string;
  publisher?: string;
  category?: string;
  imageUrl?: string;
  pdfUrl?: string;
  googleDriveUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4. **research**
```typescript
{
  id: string;
  projectTitle: BilingualText;
  abstract?: BilingualText;
  fieldOfResearch?: { en: string[], ar: string[] };
  contactPerson?: string[];
  contactEmail?: string;
  contactPhone?: string;
  authorshipPosition?: { en: string[], ar: string[] };
  projectDuration?: BilingualText;
  requiredSkills?: { en: string[], ar: string[] };
  supervisor?: BilingualText;
  createdAt: Date;
  updatedAt?: Date;
}
```

### 5. **mcqs**
```typescript
{
  id: string;
  title: string;
  description?: string;
  category?: string;
  difficulty: "easy" | "medium" | "hard";
  timeLimit?: number; // minutes
  questions: MCQQuestion[];
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
}

// MCQQuestion
{
  id?: string;
  question: string;
  options: string[]; // A, B, C, D
  correctAnswer: number; // 0-3
  explanation?: string;
  imageUrl?: string;
}
```

### 6. **years**
```typescript
{
  id: string;
  name: string;
  label: string;
  order: number;
  createdAt: Date;
  batches?: Batch[];
  subjects?: Subject[];
}

// Batch
{
  id?: string;
  name: string;
  code?: string;
}

// Subject
{
  id?: string;
  name: string;
  code?: string;
}
```

### 7. **lectures**
```typescript
{
  id: string;
  title: string;
  description?: string;
  subject: string;
  order: number;
  createdAt: Date;
  createdBy: string;
  videos: Video[];
  files: FileResource[];
  quizzes: Quiz[];
}

// Video
{
  id?: string;
  title: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
  duration?: string;
  description?: string;
  uploadedAt: Date;
  uploadedBy: string;
  imageUrl?: string;
}

// FileResource
{
  id?: string;
  title: string;
  fileUrl: string;
  fileType: string;
  fileSize?: string;
  description?: string;
  uploadedAt: Date;
  uploadedBy: string;
}

// Quiz
{
  id?: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  type: "flashcard" | "multiple_choice";
  timeLimit?: number;
  passingScore?: number;
  createdAt: Date;
  createdBy: string;
}
```

### 8. **maps**
```typescript
{
  id: string;
  name: string;
  location?: string;
  description?: string;
  type?: string; // قاعة دراسية، لابات، etc.
  video_url?: string;
  thumbnailUrl?: string;
}
```

### 9. **professors**
```typescript
{
  id: string;
  name: string;
  title?: string;
  department: string;
  email: string;
  phone?: string;
  officeLocation: string;
  bio?: string;
  researchAreas?: string[];
  website?: string;
  linkedin?: string;
  imageUrl?: string;
}
```

### 10. **products** (Store)
```typescript
{
  id: string;
  productId?: string;
  name: string;
  description: string;
  price: number;
  types?: { name: string, price: number }[];
  images: string[];
  categoryId?: string;
  createdAt: Date;
}
```

### 11. **orders**
```typescript
{
  id: string;
  userId?: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  address?: string;
  items: OrderItem[];
  total: number;
  status: "pending" | "paid" | "shipped" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt?: Date;
}

// OrderItem
{
  productId: string;
  name: string;
  quantity: number;
  price: number;
}
```

---

## ✨ Core Features

### 📰 News Management
- Create bilingual news articles (English/Arabic)
- Pin important news
- Attach images and videos
- Push notifications to specific batches
- View count tracking
- RTL support for Arabic

### 📚 Books Collection
- Book catalog with metadata (ISBN, publisher, date)
- Google Drive integration
- Book cover images
- PDF links
- Responsive grid display (1 col mobile, 2-3 cols tablet)

### 🔬 Research Projects
- Bilingual research project management
- Contact information (email, phone)
- Project supervisor tracking
- Field of research categorization
- Required skills listing
- Contact method buttons for researchers

### 📝 MCQ Management
- Create multiple choice questions with 4 options
- Categorize by difficulty (Easy/Medium/Hard)
- Explanation for answers
- Time limits
- Optional question images
- Batch creation support

### 🎥 Video Lectures
- YouTube video integration
- Video thumbnails with 16:9 aspect ratio
- Playable with overlay icon
- File resources attachment
- Quiz creation per lecture

### 🏫 Academic Structure
- Academic years with batches
- Subject management
- Year-specific data organization

### 👨‍🏫 Professors Directory
- Professor profiles with contact info
- Research areas
- Social links (LinkedIn, website)
- Office location tracking

### 🏪 Store Management
- Product catalog
- Multiple pricing tiers
- Order management
- Order status tracking

### 🗺️ Maps & Locations
- Campus location videos
- Video gallery grid (1-3 columns)
- Location typing (classrooms, labs, etc.)
- Arabic translations

### 🔔 Push Notifications (FCM)
- Firebase Cloud Messaging integration
- Batch-based notifications
- Service worker for background messages
- Token management

### 🔐 Authentication
- Firebase email/password auth
- Role-based access control
- Auto FCM initialization on login

### 💾 Offline Mode
- LocalStorage caching
- Connection monitoring
- Graceful degradation
- Cache invalidation

---

## 🛣️ Routing Structure

```
/
  /login                    # Authentication
  /admin                    # Admin Dashboard
    /                       # Dashboard home
    /news                   # News management
    /years                  # Academic years
    /years/:id              # Year details (batches, subjects)
    /books                  # Books collection
    /research               # Research projects
    /mcq                    # MCQ management
    /quizzes                # Quiz management
    /professors             # Professors directory
    /users                  # User management
    /maps                   # Maps & locations
    /store                  # Store management
    /orders                 # Orders list
    /resources              # Learning resources
    /settings               # Admin settings
    /flashcards             # Flashcard mode
    /videos                 # Video management
    /files                  # File management
  /404                      # Not found page
```

---

## 🏗️ Component Architecture

### Admin Layout
```
AdminLayout (top-level wrapper)
├── Header (navigation, user info, logout)
├── Sidebar (navigation menu)
└── Main Content Area
    └── Page Component (e.g., News, Books, MCQ)
```

### Typical CRUD Page Pattern
```
Page Component
├── Search/Filter Bar
├── Action Buttons (Create, Seed Data, Refresh)
├── Status Indicators (Loading, Error, Offline)
└── Content Display
    ├── Card Grid/List
    ├── Edit/Delete Controls
    └── Form Modal (Create/Edit)
```

### Form Pattern
```
Form Component
├── Basic Info Section (title, description)
├── Metadata Section (category, difficulty, etc.)
├── Content Section (questions, items, etc.)
└── Action Buttons (Save, Cancel)
```

---

## 🔄 Data Flow

### Create Operation
```
User fills form
    ↓
Form validation
    ↓
Hook function (createX)
    ↓
Firebase addDoc() call
    ↓
Cache update
    ↓
State update (React)
    ↓
UI re-render with new item
```

### Read Operation
```
Component mount
    ↓
useEffect hook
    ↓
Check cache validity
    ↓
Fetch from Firebase
    ↓
Deduplicate data
    ↓
Update cache
    ↓
Update state
    ↓
Render with data
```

### Update Operation
```
User edits item
    ↓
Form submission
    ↓
Hook function (updateX)
    ↓
Firebase updateDoc() call
    ↓
State map & update
    ↓
Cache update
    ↓
UI re-render
```

### Delete Operation
```
User confirms delete
    ↓
Hook function (deleteX)
    ↓
Firebase deleteDoc() call
    ↓
State filter
    ↓
Cache update
    ↓
UI re-render
```

---

## 🔐 Authentication Flow

1. User navigates to `/login`
2. Firebase email/password auth
3. `AuthContext` stores user state
4. Protected routes check `currentUser`
5. Auto-initialize FCM on login
6. Admin sidebar shown with navigation
7. Logout clears auth state

---

## 🎨 Styling

### Framework
- **Tailwind CSS** for utility-first styling
- **Custom CSS** in `global.css` for globals
- **Shadcn UI** for pre-built components

### Design System
```
Colors:
  Primary: Blue (#3b82f6)
  Success: Green (#10b981)
  Warning: Yellow (#f59e0b)
  Danger: Red (#ef4444)
  Muted: Gray (#6b7280)

Spacing: 4px base unit (rem)
Fonts: System fonts with fallbacks
Shadows: Subtle card shadows
Borders: 1px solid gray-200

Responsive:
  Mobile: 320px - 639px
  Tablet: 640px - 1023px
  Desktop: 1024px+

Breakpoints (Tailwind):
  sm: 640px
  md: 768px
  lg: 1024px
  xl: 1280px
  2xl: 1536px
```

### Component Patterns
- Button variants: default, outline, ghost, destructive
- Card-based layouts for content
- Badge for tags and status
- Modal dialogs for forms
- Toast notifications for feedback
- Loading spinners during async operations

---

## 📦 Build & Deployment

### Development
```bash
npm run dev          # Start dev server on localhost:3000
```

### Production Build
```bash
npm run build        # Build client + server
npm run build:client # Build React app
npm run build:server # Build Express server
```

### Deployment Options
- **GitHub Pages**: Static deployment (no backend)
- **Netlify**: With serverless functions support
- **Custom Node.js**: Full-stack deployment

---

## 🔌 Environment Variables

### Client
```
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### Server
```
FIREBASE_SERVICE_ACCOUNT=your_service_account_json
```

---

## 📝 Key Design Patterns

1. **Custom Hooks**: CRUD operations abstracted to hooks
2. **Context API**: Global auth state management
3. **Component Composition**: Small, reusable components
4. **Offline-First**: Local cache with Firebase sync
5. **Deduplication**: Set-based ID tracking in listeners
6. **Bilingual Support**: BilingualText interface for i18n
7. **Error Boundaries**: Graceful error handling
8. **Loading States**: User feedback during async operations

---

## 🚀 Future Enhancements

- Real-time collaboration
- Advanced analytics
- Email notifications
- SMS notifications
- Video processing
- File storage optimization
- Search indexing
- Role-based permissions
- Audit logging
- API documentation

