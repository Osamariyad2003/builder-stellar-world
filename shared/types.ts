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

export interface Video {
  id?: string;
  title: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
  uploadedBy: string;
  imageUrl?: string;
  subject: string;
}

export interface FileResource {
  id?: string;
  title: string;
  fileUrl: string;
  uploadedAt: Date;
  uploadedBy: string;
  imageUrl?: string;
  subject: string;
}

export interface Quiz {
  id?: string;
  title: string;
  questions: QuizQuestion[];
  subject: string;
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
