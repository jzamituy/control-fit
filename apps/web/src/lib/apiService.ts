"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Type for companies (gyms)
export interface Company {
  id: string;
  name: string;
  description?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

// Type for expenses
export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  currency?: string;
  createdAt: string;
  updatedAt: string;
  categoryId: string;
  userId?: string;
  companyId?: string;
  // Additional fields for converted amounts
  convertedAmount?: number;
  originalAmount?: number;
  originalCurrency?: string;
  category?: Category;
  user?: User;
  company?: Company;
}

// Type for categories
export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  companyId?: string;
  _count?: {
    expenses: number;
  };
}

// Type for users
export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  companyId?: string;
  company?: Company;
}

// Type for expense totals by category
export interface CategoryTotal {
  categoryId: string;
  categoryName: string;
  total: number;
}

// Type for expense meta data
export interface ExpenseMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  totalAmount?: number;
  targetCurrency?: string;
}

// Type for expense totals
export interface ExpensesTotals {
  total: number;
  byCategory: CategoryTotal[];
  targetCurrency?: string;
}

// Search parameters for expenses
export interface ExpenseSearchParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  targetCurrency?: string;
}

// Type for exchange rate response
export interface ExchangeRateResponse {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

// Authentication services
export const authService = {
  // Register a new user
  async register(data: { email: string; password: string; name: string }) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Error registering user");
    }

    const result = await response.json();

    // Save token in localStorage
    if (result.access_token) {
      localStorage.setItem("token", result.access_token);
      localStorage.setItem("user", JSON.stringify(result.user));
    }

    return result;
  },

  // Log in
  async login(email: string, password: string) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error("Invalid credentials");
    }

    const result = await response.json();

    // Save token in localStorage
    if (result.access_token) {
      localStorage.setItem("token", result.access_token);
      localStorage.setItem("user", JSON.stringify(result.user));
    }

    return result;
  },

  // Log out
  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem("token");
  },

  // Get current user
  getCurrentUser() {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (e) {
      console.error("Error parsing user data:", e);
      return null;
    }
  },

  // Get JWT token
  getToken() {
    return localStorage.getItem("token");
  },

  // Validate token
  async validateToken(token: string) {
    const response = await fetch(`${API_URL}/auth/validate-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      return false;
    }

    return await response.json();
  },
};

// Function to add authentication token to requests
export const withAuth = async (url: string, options: RequestInit = {}) => {
  const token = authService.getToken();

  if (!token) {
    return fetch(url, options);
  }

  const authOptions = {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  };

  return fetch(url, authOptions);
};

// API service for expenses
export const expenseService = {
  // Get all expenses with filters and pagination
  async getAll(
    params: {
      page?: number;
      limit?: number;
      categoryId?: string;
      startDate?: string;
      endDate?: string;
      targetCurrency?: string;
    } = {}
  ): Promise<{ data: Expense[]; meta: ExpenseMeta }> {
    // Build URL with query params
    const url = new URL(`${API_URL}/expenses`);

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });

    const response = await withAuth(url.toString());

    if (!response.ok) {
      throw new Error("Error retrieving expenses");
    }

    return await response.json();
  },

  // Get total expenses
  async getTotal(
    params: {
      categoryId?: string;
      startDate?: string;
      endDate?: string;
      targetCurrency?: string;
    } = {}
  ): Promise<{
    total: number;
    byCategory: CategoryTotal[];
    targetCurrency: string;
  }> {
    // Build URL with query params
    const url = new URL(`${API_URL}/expenses/total`);

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });

    const response = await withAuth(url.toString());

    if (!response.ok) {
      throw new Error("Error retrieving expense totals");
    }

    return await response.json();
  },

  // Get an expense by ID
  async getById(id: string): Promise<Expense> {
    const response = await withAuth(`${API_URL}/expenses/${id}`);

    if (!response.ok) {
      throw new Error("Error retrieving expense");
    }

    return await response.json();
  },

  // Create a new expense
  async create(
    data: Omit<
      Expense,
      "id" | "createdAt" | "updatedAt" | "category" | "user" | "userId"
    >
  ): Promise<Expense> {
    const response = await withAuth(`${API_URL}/expenses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Error creating expense");
    }

    return await response.json();
  },

  // Update an expense
  async update(
    id: string,
    data: Partial<
      Omit<Expense, "id" | "createdAt" | "updatedAt" | "category" | "user">
    >
  ): Promise<Expense> {
    const response = await withAuth(`${API_URL}/expenses/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Error updating expense");
    }

    return await response.json();
  },

  // Delete an expense
  async delete(id: string): Promise<void> {
    const response = await withAuth(`${API_URL}/expenses/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Error deleting expense");
    }
  },
};

// API service for categories
export const categoryService = {
  // Get all categories
  async getAll(): Promise<Category[]> {
    const response = await withAuth(`${API_URL}/categories`);

    if (!response.ok) {
      throw new Error("Error retrieving categories");
    }

    return await response.json();
  },

  // Get a category by ID
  async getById(id: string): Promise<Category> {
    const response = await withAuth(`${API_URL}/categories/${id}`);

    if (!response.ok) {
      throw new Error("Error retrieving category");
    }

    return await response.json();
  },

  // Create a new category
  async create(
    data: Omit<Category, "id" | "createdAt" | "updatedAt" | "userId">
  ): Promise<Category> {
    const response = await withAuth(`${API_URL}/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Error creating category");
    }

    return await response.json();
  },

  // Update a category
  async update(id: string, data: Partial<Category>): Promise<Category> {
    const response = await withAuth(`${API_URL}/categories/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Error updating category");
    }

    return await response.json();
  },

  // Delete a category
  async delete(id: string): Promise<void> {
    const response = await withAuth(`${API_URL}/categories/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Error deleting category");
    }
  },
};

// API service for exchange rates
export const exchangeRateService = {
  // Get the latest exchange rate
  async getLatestRate(
    fromCurrency: string,
    toCurrency: string
  ): Promise<{ rate: number }> {
    const response = await withAuth(
      `${API_URL}/exchange-rates/latest?fromCurrency=${fromCurrency}&toCurrency=${toCurrency}`
    );

    if (!response.ok) {
      throw new Error("Error retrieving exchange rate");
    }

    return await response.json();
  },

  // Create or update an exchange rate
  async upsertRate(data: {
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    date: string;
  }): Promise<ExchangeRateResponse> {
    const response = await withAuth(`${API_URL}/exchange-rates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Error creating/updating exchange rate");
    }

    return await response.json();
  },

  // Convert an amount from one currency to another
  async convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<{
    originalAmount: number;
    originalCurrency: string;
    convertedAmount: number;
    targetCurrency: string;
  }> {
    const response = await withAuth(
      `${API_URL}/exchange-rates/convert?amount=${amount}&fromCurrency=${fromCurrency}&toCurrency=${toCurrency}`
    );

    if (!response.ok) {
      throw new Error("Error converting amount");
    }

    return await response.json();
  },
};
