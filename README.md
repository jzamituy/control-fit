# Control-Fit: Expense Management System for Gym

This is a monorepo project that includes a frontend application (Next.js) and a backend API (NestJS) for expense management.

- **API (NestJS + Prisma + PostgreSQL)**: Backend for expense management, categories, users and authentication.
- **Frontend (Next.js + TypeScript + Tailwind CSS)**: User interface for the expense management system.

## Technologies Used

### Backend

- **NestJS**: Node.js framework for building scalable server-side applications
- **Prisma**: ORM for database management and migrations
- **PostgreSQL**: Relational database
- **JWT**: For user authentication and authorization
- **bcrypt**: For password hashing

### Frontend

- **Next.js 14**: React framework with App Router
- **TypeScript**: For type safety
- **Tailwind CSS**: For styling

## Project Setup

### Prerequisites

- Node.js (recommended version 18 or higher)
- pnpm (package manager)
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Set up environment variables:

   - Copy `apps/api/.env.example` to `apps/api/.env` (if exists)
   - Configure PostgreSQL database URL:

   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/control_fit?schema=public"
   ```

4. Create database and apply migrations

   ```bash
   cd apps/api
   pnpm db:push
   ```

5. Seed the database (optional)
   ```bash
   cd apps/api
   pnpm db:seed
   ```

### Running the Project

#### Development Mode

```bash
# From project root
pnpm dev
```

This will start:

- Frontend on http://localhost:3000
- API on http://localhost:3001

#### Production Mode

```bash
# Build all applications
pnpm build

# Start in production mode
pnpm start
```

### Using Docker

```bash
# Start PostgreSQL database
docker-compose up -d

# Then follow the installation steps above
```

### Database Commands

```bash
# Navigate to API directory
cd apps/api

# Generate Prisma client
pnpm db:generate

# Apply migrations
pnpm db:push

# View database in browser
pnpm db:studio

# Seed database
pnpm db:seed
```

## Features

- **Authentication and authorization**: Login system and access control.
- **User management**: User creation and administration.
- **Expense categories**: Organization of expenses by categories.
- **Expense tracking**: Add, edit and delete expenses.
- **Reports**: Expense visualization and statistics.
- **Multi-currency support**: Record expenses in different currencies with automatic conversion.
- **Exchange rate management**: Configure and update exchange rates.

## Project Structure

```
control-fit/
├── apps/
│   ├── api/          # NestJS Backend
│   └── web/          # Next.js Frontend
├── packages/
│   ├── ui/           # Shared UI components
│   └── config/       # Shared configurations
└── docker-compose.yml
```

## Licence

[MIT](LICENSE)
