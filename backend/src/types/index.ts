// User types
export interface User {
  id: string;
  email: string;
  password_hash: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPayload {
  email: string;
  password: string;
}

// Product types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  style: 'casual' | 'formal' | 'wedding';
  sizes: string[];
  image_url: string;
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface ProductFilter {
  style?: 'casual' | 'formal' | 'wedding';
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

// Cart types
export interface CartItem {
  id: string;
  product_id: string;
  size: string;
  quantity: number;
  created_at: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

// Order types
export interface Order {
  id: string;
  user_id: string;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  shipping_address: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  size: string;
  quantity: number;
  price: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
}