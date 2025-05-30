"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  expenseService,
  categoryService,
  Category,
  authService,
} from "../../../lib/apiService";

export default function NewExpensePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authenticating, setAuthenticating] = useState<boolean>(true);

  // Verify authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = authService.isAuthenticated();
        setIsAuthenticated(isAuth);

        if (isAuth) {
          // Verify token
          const token = authService.getToken();
          if (token) {
            await authService.validateToken(token);
          }
        }
      } catch (error) {
        console.error("Authentication error:", error);
        authService.logout();
        setIsAuthenticated(false);
      } finally {
        setAuthenticating(false);
      }
    };

    checkAuth();
  }, [router]);

  // List of available currencies
  const currencies = [
    { code: "USD", name: "US Dollar" },
    { code: "EUR", name: "Euro" },
    { code: "UYU", name: "Uruguayan Peso" },
    { code: "MXN", name: "Mexican Peso" },
    { code: "ARS", name: "Argentine Peso" },
    { code: "CLP", name: "Chilean Peso" },
    { code: "COP", name: "Colombian Peso" },
  ];

  // Form state
  const [form, setForm] = useState({
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0], // Current date in YYYY-MM-DD format
    categoryId: "",
    currency: "USD", // Default currency
  });

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      if (!isAuthenticated || authenticating) return;

      try {
        const data = await categoryService.getAll();
        setCategories(data);
        // If there are categories, select the first one by default
        if (data.length > 0) {
          setForm((prev) => ({
            ...prev,
            categoryId: data[0].id,
          }));
        }
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, [isAuthenticated, authenticating]);

  // Handle form changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "amount" ? value.replace(/[^0-9.]/g, "") : value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.description || !form.amount || !form.categoryId || !form.date) {
      alert("Please complete all required fields");
      return;
    }

    setIsSaving(true);

    try {
      const response = await expenseService.create({
        amount: parseFloat(form.amount),
        description: form.description,
        date: new Date(form.date).toISOString(),
        categoryId: form.categoryId,
        currency: form.currency,
      });

      console.log("Expense created successfully:", response);

      // Redirect to expenses list after saving
      router.push("/expenses");
    } catch (error) {
      console.error("Error creating expense:", error);
      alert("Could not create expense");
      setIsSaving(false);
    }
  };

  // If authenticating, show loading screen
  if (authenticating) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em]"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login message
  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen flex-col items-center p-6 md:p-24">
        <div className="w-full max-w-6xl text-center">
          <h1 className="text-4xl font-bold mb-6">Restricted Access</h1>
          <p className="text-xl mb-8">You must log in to access this section</p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/auth/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-lg font-medium"
            >
              Log in
            </Link>
            <Link
              href="/auth/register"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-md text-lg font-medium"
            >
              Register
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-24">
      <div className="w-full max-w-3xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">New Expense</h1>
          <Link
            href="/expenses"
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
          >
            Cancel
          </Link>
        </div>

        {isLoading ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-center">Loading...</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="text"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md py-2 px-3"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency *
                </label>
                <select
                  name="currency"
                  value={form.currency}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md py-2 px-3"
                  required
                >
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-70"
              >
                {isSaving ? "Saving..." : "Save Expense"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
