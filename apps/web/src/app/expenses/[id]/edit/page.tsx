"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  expenseService,
  categoryService,
  exchangeRateService,
  Category,
} from "../../../../lib/apiService";

interface FetchError extends Error {
  message: string;
}

export default function EditExpensePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { id } = params;

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");
  const [convertedAmount, setConvertedAmount] = useState<number>(0);

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
    date: "",
    categoryId: "",
    currency: "USD", // Use USD as default value if no currency
  });

  // Load data on initialization
  useEffect(() => {
    async function loadData() {
      try {
        // Load categories
        const categoriesData = await categoryService.getAll();
        setCategories(categoriesData);

        // Load expense data
        const expense = await expenseService.getById(id);

        // Format date to YYYY-MM-DD for date input
        const formattedDate = new Date(expense.date)
          .toISOString()
          .split("T")[0];

        setForm({
          amount: expense.amount.toString(),
          description: expense.description,
          date: formattedDate,
          categoryId: expense.categoryId,
          currency: expense.currency || "USD", // Use USD as default value if no currency
        });

        // Calculate converted value
        updateConvertedAmount(expense.amount, expense.currency || "USD");
      } catch (error) {
        console.error("Error loading data:", error);

        // If expense not found
        const fetchError = error as FetchError;
        if (fetchError.message?.includes("Error retrieving expense")) {
          setNotFound(true);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id]);

  // Function to update converted amount
  const updateConvertedAmount = async (
    amount: number | string,
    fromCurrency: string,
    targetCurrency: string = selectedCurrency
  ) => {
    try {
      if (typeof amount === "string") {
        amount = parseFloat(amount) || 0;
      }

      if (fromCurrency === targetCurrency) {
        setConvertedAmount(amount);
        return;
      }

      const result = await exchangeRateService.convertAmount(
        amount,
        fromCurrency,
        targetCurrency
      );
      setConvertedAmount(result.convertedAmount);
    } catch (error) {
      console.error("Error converting amount:", error);
      setConvertedAmount(0);
    }
  };

  // Handle form changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "amount" || name === "currency") {
      const newForm = {
        ...form,
        [name]: name === "amount" ? value.replace(/[^0-9.]/g, "") : value,
      };
      setForm(newForm);

      // Update converted amount when amount or currency changes
      if (name === "amount") {
        updateConvertedAmount(value, form.currency);
      } else if (name === "currency") {
        updateConvertedAmount(form.amount, value);
      }
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Function to format amounts
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
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
      await expenseService.update(id, {
        amount: parseFloat(form.amount),
        description: form.description,
        date: new Date(form.date).toISOString(),
        categoryId: form.categoryId,
        currency: form.currency,
      });

      // Redirect to expenses list after saving
      router.push("/expenses");
    } catch (error) {
      console.error("Error updating expense:", error);
      alert("Could not update expense");
      setIsSaving(false);
    }
  };

  if (notFound) {
    return (
      <main className="flex min-h-screen flex-col items-center p-6 md:p-24">
        <div className="w-full max-w-3xl text-center">
          <h1 className="text-3xl font-bold mb-4">Expense not found</h1>
          <p className="mb-6">
            The expense you are trying to edit does not exist or is not
            available.
          </p>
          <Link
            href="/expenses"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Back to expenses list
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-24">
      <div className="w-full max-w-3xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Edit Expense</h1>
          <div className="flex space-x-2">
            <div className="flex items-center">
              <label
                htmlFor="currencySelector"
                className="mr-2 text-sm text-gray-500"
              >
                Display in:
              </label>
              <select
                id="currencySelector"
                value={selectedCurrency}
                onChange={(e) => {
                  setSelectedCurrency(e.target.value);
                  updateConvertedAmount(
                    form.amount,
                    form.currency,
                    e.target.value
                  );
                }}
                className="border border-gray-300 rounded-md py-1 px-2 text-sm"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code}
                  </option>
                ))}
              </select>
            </div>
            <Link
              href="/expenses"
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
            >
              Cancel
            </Link>
          </div>
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
                {selectedCurrency !== form.currency && (
                  <div className="text-xs text-gray-500 mt-1">
                    Approximate value in {selectedCurrency}:{" "}
                    {formatAmount(convertedAmount, selectedCurrency)}
                  </div>
                )}
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
                <option value="" disabled>
                  Select a category
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push("/expenses")}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Update Expense"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
