"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  expenseService,
  categoryService,
  Category,
  Expense,
  authService,
} from "../../lib/apiService";

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [targetCurrency, setTargetCurrency] = useState("UYU");
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

  // State for filters
  const [filters, setFilters] = useState({
    categoryId: "",
    startDate: "",
    endDate: "",
    targetCurrency: "UYU",
  });

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

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated || authenticating) return;

      try {
        setIsLoading(true);

        // Load categories
        const categoriesData = await categoryService.getAll();
        setCategories(categoriesData);

        // Load expenses with filters
        const response = await expenseService.getAll({
          categoryId: filters.categoryId,
          startDate: filters.startDate,
          endDate: filters.endDate,
          targetCurrency: filters.targetCurrency,
        });

        // Expenses are already sorted by date from the backend
        setExpenses(response.data);
        setTotalAmount(response.meta.totalAmount ?? 0);
        setTargetCurrency(response.meta.targetCurrency ?? "UYU");
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [filters, isAuthenticated, authenticating]);

  // Handle filter changes
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Apply filters
  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    // Filters are automatically applied by useEffect
  };

  // Function to format amounts
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US");
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
      <div className="w-full max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Expenses</h1>
          <Link
            href="/expenses/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            New Expense
          </Link>
        </div>

        {/* Filters */}
        <form
          onSubmit={handleApplyFilters}
          className="bg-white p-6 rounded-lg shadow-md mb-8"
        >
          <h2 className="text-xl font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="categoryId"
                value={filters.categoryId}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start date
              </label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End date
              </label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display currency
            </label>
            <select
              name="targetCurrency"
              value={filters.targetCurrency}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md py-2 px-3"
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>
        </form>

        {/* Total */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Total expenses</h2>
            <div className="text-2xl font-bold">
              {formatAmount(totalAmount, targetCurrency)}
            </div>
          </div>
        </div>

        {/* Expenses list */}
        {isLoading ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-center">Loading...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-center">No expenses to show.</p>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Expenses list</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-3">Description</th>
                    <th className="text-left p-3">Category</th>
                    <th className="text-left p-3">Date</th>
                    <th className="text-right p-3">Original Amount</th>
                    <th className="text-right p-3">Converted Amount</th>
                    <th className="text-center p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="p-3">{expense.description}</td>
                      <td className="p-3">{expense.category?.name}</td>
                      <td className="p-3">{formatDate(expense.date)}</td>
                      <td className="p-3 text-right">
                        {formatAmount(
                          expense.amount,
                          expense.currency || "UYU"
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {formatAmount(
                          expense.convertedAmount || expense.amount,
                          targetCurrency
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <Link
                          href={`/expenses/${expense.id}/edit`}
                          className="text-blue-600 hover:text-blue-800 mx-1"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
