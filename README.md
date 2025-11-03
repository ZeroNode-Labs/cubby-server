# Cubby Server

A modern REST API built with Fastify, Prisma, and TypeScript.

## 🚀 Features

- ⚡ **Fastify** - Fast and low overhead web framework
- 🗄️ **Prisma** - Next-generation ORM for TypeScript
- 📘 **TypeScript** - Full type safety
- 🔄 **ES Modules** - Modern JavaScript module system
- 🔌 **CORS** - Cross-Origin Resource Sharing enabled
- 🌍 **Environment Variables** - Dotenv configuration

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

## 🛠️ Installation

1. Clone the repository:

```bash
git clone https://github.com/ZeroNode-Labs/cubby-server.git
cd cubby-server
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and update DATABASE_URL with your PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/cubby_db?schema=public"
```

4. Generate Prisma Client:

```bash
npm run prisma:generate
```

5. Run database migrations:

```bash
npm run prisma:migrate
```

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
# Build the project
npm run build

# Start the server
npm run start
```

The server will start on `http://localhost:3000` (or the PORT specified in your .env file).

## 📚 API Endpoints

### Health Check

- `GET /health` - Check server status

### Users

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create a new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Posts

- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get post by ID
- `POST /api/posts` - Create a new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

## 🗄️ Database Management

### Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create and apply migrations
npm run prisma:migrate

# Push schema changes without migrations
npm run db:push

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

## 📁 Project Structure

```
cubby-server/
├── prisma/
│   └── schema.prisma       # Prisma schema definition
├── src/
│   ├── lib/
│   │   └── prisma.ts       # Prisma client singleton
│   ├── routes/
│   │   ├── users.ts        # User routes
│   │   └── posts.ts        # Post routes
│   └── index.ts            # Application entry point
├── .env                     # Environment variables (not in git)
├── .env.example            # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Technology Stack

- **Runtime**: Node.js
- **Framework**: Fastify
- **ORM**: Prisma
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Module System**: ES Modules

## 📝 License

ISC
