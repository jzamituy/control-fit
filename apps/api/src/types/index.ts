import { Request } from 'express';

// JWT payload interface
export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Extend the Express Request type
export interface RequestWithUser extends Request {
  user: JwtPayload;
}

// Category interface
export interface Category {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  companyId?: string | null;
  _count?: {
    expenses: number;
  };
}

// Expense interface
export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: Date;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  categoryId: string;
  userId: string;
  companyId?: string | null;
  category?: Category;
}

// User interface
export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'ADMIN' | 'USER';
  createdAt: Date;
  updatedAt: Date;
  companyId?: string | null;
}

// Company interface
export interface Company {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Exchange Rate interface
export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}
