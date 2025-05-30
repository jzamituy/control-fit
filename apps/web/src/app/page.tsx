"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  expenseService,
  categoryService,
  Expense,
  Category,
  authService,
} from "../lib/apiService";

interface DashboardData {
  totalExpenses: number;
  monthlyExpenses: number;
  recentExpenses: Expense[];
  categoryTotals: Array<{
    category: Category;
    total: number;
  }>;
}

export default function HomePage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authenticating, setAuthenticating] = useState<boolean>(true);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");

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
  }, []);

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

  // Get data with selected currency
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!isAuthenticated || authenticating) return;

      try {
        const [expenses, , totals] = await Promise.all([
          expenseService.getAll({ targetCurrency: selectedCurrency, limit: 5 }),
          categoryService.getAll(),
          expenseService.getTotal({ targetCurrency: selectedCurrency }),
        ]);

        // Expenses are already sorted by date from backend
        const recentExpenses = expenses.data || expenses;

        setDashboardData({
          totalExpenses: totals.total,
          monthlyExpenses: totals.byCategory.reduce(
            (sum, cat) => sum + cat.total,
            0
          ),
          recentExpenses: Array.isArray(recentExpenses)
            ? recentExpenses.slice(0, 5)
            : [],
          categoryTotals: [],
        });
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadDashboardData();
  }, [selectedCurrency, isAuthenticated, authenticating]); // Update when currency changes or authentication changes

  // Handle currency change
  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
  };

  // Function to format amounts
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: selectedCurrency,
    }).format(amount);
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
          <h1 className="text-4xl font-bold mb-6">
            Gym Expense Management System
          </h1>
          <p className="text-xl mb-8">You must log in to access the system</p>
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

  // If loading data, show loading message
  if (!dashboardData) {
    return (
      <main className="flex min-h-screen flex-col items-center p-6 md:p-24">
        <div className="w-full max-w-6xl">
          <p>Loading data...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-24">
      <div className="w-full max-w-6xl">
        <h1 className="text-3xl font-bold">Gym Expense Control</h1>

        {/* Currency selector */}
        <div className="mb-6 flex justify-end">
          <div className="flex items-center space-x-2">
            <label
              htmlFor="currency"
              className="text-sm font-medium text-gray-700"
            >
              Currency:
            </label>
            <select
              id="currency"
              value={selectedCurrency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="border border-gray-300 rounded-md py-1 px-2 text-sm"
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="h-8 w-8 text-green-600">💰</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Expenses
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatAmount(dashboardData.totalExpenses)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="h-8 w-8 text-blue-600">📅</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Current Month Expenses
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatAmount(dashboardData.monthlyExpenses)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="h-8 w-8 text-purple-600">📊</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <div className="flex justify-between items-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData.categoryTotals.length}
                  </p>
                  <Link
                    href="/expenses"
                    className="text-purple-600 hover:text-purple-800 text-sm"
                  >
                    View all
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent expenses */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Expenses</h2>
          {dashboardData.recentExpenses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.recentExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {expense.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {expense.category?.name || "No category"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatAmount(expense.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No expenses registered</p>
              <Link
                href="/expenses/new"
                className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Add first expense
              </Link>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/expenses/new"
            className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg text-center block"
          >
            <h3 className="text-lg font-semibold">Add Expense</h3>
            <p className="mt-2">Record a new expense</p>
          </Link>
          <Link
            href="/expenses"
            className="bg-gray-600 hover:bg-gray-700 text-white p-6 rounded-lg text-center block"
          >
            <h3 className="text-lg font-semibold">View All Expenses</h3>
            <p className="mt-2">Review and manage your expenses</p>
          </Link>
        </div>

        {/* Message if no data available */}
        {dashboardData.recentExpenses.length === 0 && (
          <div className="text-center mt-8">
            <p className="text-gray-500">No data available</p>
          </div>
        )}

        {/* Expense trend chart placeholder */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Expense Trend</h2>
          <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Chart coming soon</p>
          </div>
        </div>
      </div>
    </main>
  );
}
