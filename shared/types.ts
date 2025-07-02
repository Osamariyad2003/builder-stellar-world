export interface NewsItem {
  id?: string;
  title: string;
  content: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  authorName: string;
  authorId: string;
  tags: string[];
  isPinned: boolean;
  viewsCount: number;
  attachments: string[];
  videoUrl?: string;
}

export interface Lecture {
  id?: string;
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

export interface Video {
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

export interface FileResource {
  id?: string;
  title: string;
  fileUrl: string;
  fileType: string;
  fileSize?: string;
  description?: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface Quiz {
  id?: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  timeLimit?: number;
  passingScore?: number;
  createdAt: Date;
  createdBy: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  imageUrl?: string;
}

export interface Professor {
  id?: string;
  name: string;
  department: string;
  email: string;
  officeLocation: string;
  imageUrl?: string;
}

export interface StoreCategory {
  id?: string;
  name: string;
  order: number;
  imageUrl?: string;
}

export interface Product {
  id?: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  createdAt: Date;
}
