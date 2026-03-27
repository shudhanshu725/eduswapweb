export type Page = 'landing' | 'explore' | 'upload' | 'dashboard' | 'community' | 'chat' | 'about' | 'terms' | 'privacy' | 'help' | 'contact';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface Material {
  id: string;
  title: string;
  description: string;
  type: 'swap' | 'sell' | 'donate' | 'resource';
  subject: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  studentName?: string;
  studentYear?: string;
  studentDepartment?: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  contactInstagram?: string;
  contactTelegram?: string;
  rating: number;
  downloads: number;
  price?: number;
  isVerified?: boolean;
  isCommunityChoice?: boolean;
  icon: string;
  status: 'available' | 'completed';
  completedAt?: string;
  createdAt: string;
}

export interface Stat {
  label: string;
  value: string | number;
  change?: string;
  icon: string;
  color: string;
}

export interface SwapRequest {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  description: string;
  lookingFor: string;
  status: 'open' | 'closed';
  createdAt: string;
}

export interface ChatPeer {
  uid: string;
  displayName: string;
  photoURL?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}
