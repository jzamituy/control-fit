"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { exchangeRateService } from "../../lib/apiService";

interface Message {
  text: string;
  type: "success" | "error";
}

export default function ExchangeRatesPage() {
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
    fromCurrency: "",
    toCurrency: "",
    rate: "",
  });

  // Handle form changes
  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.fromCurrency || !form.toCurrency || !form.rate) {
      setMessage({
        text: "Please complete all fields",
        type: "error",
      });
      return;
    }

    // Validate that currencies are different
    if (form.fromCurrency === form.toCurrency) {
      setMessage({
        text: "Source and target currencies must be different",
        type: "error",
      });
      return;
    }

    setIsLoading(true);

    try {
      await exchangeRateService.upsertRate({
        fromCurrency: form.fromCurrency,
        toCurrency: form.toCurrency,
        rate: parseFloat(form.rate),
        date: new Date().toISOString(),
      });

      setMessage({
        text: "Exchange rate updated successfully",
        type: "success",
      });

      // Clear the form
      setForm({
        fromCurrency: "",
        toCurrency: "",
        rate: "",
      });
    } catch (error) {
      console.error("Error updating exchange rate:", error);
      setMessage({
        text: "Error updating exchange rate",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to query a rate
  const handleQueryRate = async () => {
    if (!form.fromCurrency || !form.toCurrency) {
      setMessage({
        text: "Select the currencies to query the rate",
        type: "error",
      });
      return;
    }

    if (form.fromCurrency === form.toCurrency) {
      setMessage({
        text: "Source and target currencies must be different",
        type: "error",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { rate } = await exchangeRateService.getLatestRate(
        form.fromCurrency,
        form.toCurrency
      );

      setMessage({
        text: `Current rate: 1 ${form.fromCurrency} = ${rate} ${form.toCurrency}`,
        type: "success",
      });
    } catch (error) {
      console.error("Error getting exchange rate:", error);
      setMessage({
        text: "No exchange rate found for these currencies",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-24">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Exchange Rate Management</h1>
          <Link
            href="/"
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
          >
            Back to Dashboard
          </Link>
        </div>

        {message && (
          <div
            className={`mt-4 p-4 rounded-md ${
              message.type === "success"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            Add/Update Exchange Rate
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Currency *
                </label>
                <select
                  name="fromCurrency"
                  value={form.fromCurrency}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md py-2 px-3"
                  required
                >
                  <option value="">Select a currency</option>
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Currency *
                </label>
                <select
                  name="toCurrency"
                  value={form.toCurrency}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md py-2 px-3"
                  required
                >
                  <option value="">Select a currency</option>
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
                Exchange Rate *
              </label>
              <input
                type="number"
                name="rate"
                value={form.rate}
                onChange={handleChange}
                step="0.0001"
                className="w-full border border-gray-300 rounded-md py-2 px-3"
                placeholder="0.0000"
                required
              />
            </div>

            <div className="flex space-x-4 mb-6">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-70"
              >
                {isLoading ? "Saving..." : "Save Exchange Rate"}
              </button>

              <button
                type="button"
                onClick={handleQueryRate}
                disabled={isLoading}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md disabled:opacity-70"
              >
                Query
              </button>
            </div>

            <div className="text-sm text-gray-600">
              <p className="mb-2">
                Example: 42.5 (means that 1 {form.fromCurrency} equals{" "}
                {form.rate ? parseFloat(form.rate) : "X"} {form.toCurrency})
              </p>
            </div>
          </form>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Information</h2>

          <div className="space-y-4 text-sm text-gray-600">
            <p>
              Use this form to set or update exchange rates between different
              currencies. These rates will be used to convert expense amounts to
              the selected currency in reports.
            </p>

            <p>
              <strong>Important:</strong> Exchange rates vary daily. Make sure
              to update rates regularly to maintain accuracy in conversions.
            </p>

            <p>
              If no direct rate is found between two currencies, the system will
              try to use the inverse rate (if it exists).
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
