"use client";

import React from "react";
import Link from "next/link";

export default function ExpensesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <div className="flex space-x-2">
          <Link
            href="/expenses/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            New Expense
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
