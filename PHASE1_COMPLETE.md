# Phase 1 Complete! 🎉

Your Cubby Server MVP is ready with:

## ✅ Completed Features

### Authentication

- User registration with email/password
- JWT-based login
- Password hashing with bcrypt
- Protected routes with JWT middleware

### File Storage

- Upload files to S3-compatible storage (MinIO locally)
- Download files with streaming
- Delete files
- Quota management (5GB default per user)
- File metadata stored in PostgreSQL

### Infrastructure

- PostgreSQL database (port 5433)
- MinIO S3-compatible storage (API: 9000, Console: 9002)
- Swagger API documentation

## 🚀 Quick Start

### 1. Start Services

```bash
# Start both database and storage
npm run db:up

# Or start individually
docker-compose up -d postgres
docker-compose up -d minio
```

### 2. Run the Server

```bash
npm run dev
```

### 3. Access Services

- **API Server**: http://localhost:3000
- **API Docs**: http://localhost:3000/docs
- **MinIO Console**: http://localhost:9002 (minioadmin / minioadmin123)

## 📝 API Endpoints

### Authentication

```bash
# Register
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Get current user
GET /api/auth/me
Authorization: Bearer <token>
```

### File Operations

```bash
# Upload file(s)
POST /api/files/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

# List files
GET /api/files
Authorization: Bearer <token>

# Download file
GET /api/files/:id/download
Authorization: Bearer <token>

# Delete file
DELETE /api/files/:id
Authorization: Bearer <token>
```

## 🧪 Testing Flow

1. **Register a user**:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

2. **Login and get token**:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

3. **Upload a file**:

```bash
curl -X POST http://localhost:3000/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@/path/to/your/file.pdf"
```

4. **List files**:

```bash
curl -X GET http://localhost:3000/api/files \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📊 Database Schema

### User

- id, email (unique), password (hashed)
- quota (default 5GB), usedSpace
- isActive, emailVerified
- timestamps

### File

- id, filename, originalName
- mimeType, size
- s3Key, s3Bucket
- userId (relation to User)
- isDeleted, deletedAt
- timestamps

## 🔧 Configuration

All configuration is in `.env`:

- Database connection
- JWT secret
- S3/MinIO credentials
- Server port and host

## 📦 Storage

- **Development**: MinIO running in Docker
- **Production**: Can use AWS S3, Cloudflare R2, or any S3-compatible service
- Just update the S3\_\* environment variables

## 🛠️ Next Steps (Phase 2)

- [ ] Folder structure
- [ ] File sharing with links
- [ ] Thumbnails for images
- [ ] Trash/recycle bin
- [ ] Search functionality
- [ ] User settings & profile updates
