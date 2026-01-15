export interface Mentor {
  id: number;
  name: string;
  role: string;
  rating: number;
  sessions_count: number;
  price: number;
  location: string;
  tags: string[];
  is_available: boolean;
  avatar_url: string;
}

export interface MenuItem {
  name: string;
  path: string;
  icon: string;
}