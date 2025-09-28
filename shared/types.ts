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
  yearId?: string; // Reference to the academic year document id
  yearNumber?: number; // Optional year number for convenience
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
  type?: 'flashcard' | 'multiple_choice';
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
  weight?: number; // weight of this question in the quiz
}

export interface Professor {
  id?: string;
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

export interface StoreCategory {
  id?: string;
  name: string;
  order: number;
  imageUrl?: string;
}

export interface Product {
  id?: string;
  productId?: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  categoryId?: string;
  createdAt: Date;
}

export interface Category {
  id?: string;
  categoryId?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  order: number;
  createdAt: Date;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id?: string;
  userId?: string;
  username?: string;
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
