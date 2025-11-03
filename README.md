# 🗄️ Cubby Server

> Your personal, self-hosted cloud storage solution. Own your data, control your destiny.

## ⚠️ Development Status

**🚧 This project is currently in active development and NOT ready for production use.**

Cubby Server is a **work in progress** and is evolving rapidly. Features are being built block by block, and breaking changes may occur frequently. This is an experimental project in its early stages – use at your own risk and expect significant changes as we iterate toward a stable release.

**Not recommended for:**

- Production environments
- Storing critical or irreplaceable data
- Use cases requiring stability and reliability

**Perfect for:**

- Developers interested in contributing
- Testing and experimentation
- Following along with the development journey

## 💡 The Idea

Welcome to **Cubby Server** – a lightweight, self-hosted storage solution designed for those who believe in decentralization, privacy, and truly owning their data.

Born from a simple question: _"Why pay for cloud storage subscriptions when I can run my own?"_

Cubby Server is designed to run alongside your other self-hosted applications on a cheap VPS, giving you a reliable place to upload, download, and manage your files – connected to any S3-compatible object storage.

## 🎯 Why Cubby?

- **💰 Cost-Effective**: Run on your existing VPS infrastructure – potentially cheaper than cloud storage subscriptions
- **🔒 Privacy-First**: Your data stays where you want it
- **🌍 Decentralized**: No dependence on big tech providers
- **🔌 S3-Compatible**: Works with any S3-compatible storage (AWS S3, Cloudflare R2, MinIO, and more)
- **🏠 Truly Self-Hosted**: Run it anywhere you trust (or don't – that's where E2EE comes in!)

## ✨ Current Features

- 📤 Upload and download files via REST API
- 🔗 S3-compatible object storage integration
- 🐳 Easy deployment with Docker Compose
- 🗃️ Support for local MinIO storage or cloud S3 providers (AWS, Cloudflare R2, etc.)
- 👤 User authentication and file management

## 🚀 Roadmap

This project is in its early stages – think of it as planting seeds that will grow into a full-featured ecosystem:

### Coming Soon

- 🔐 **End-to-End Encryption**: The ultimate goal – run your server on untrusted infrastructure without compromising privacy. Even server admins won't be able to read your data
- 📱 **Web Application**: A beautiful PWA for accessing your files from anywhere
- 📲 **Mobile Apps**: Native iOS and Android applications
- 📊 **QR Code Login**: Scan and connect to your self-hosted instance instantly
- 🎨 **Rich File Management**: Advanced file manipulation and organization features
- 🔄 **Sync Capabilities**: Keep your files synchronized across devices

## 🏗️ Philosophy

Cubby Server is built **block by block**, with each feature thoughtfully added to create a robust, trustworthy storage solution. We're starting with solid S3 integration and will progressively layer on advanced features like end-to-end encryption.

The vision? A complete ecosystem where you can:

1. Spin up your Cubby Server on any VPS
2. Connect your preferred S3 storage backend
3. Use official client apps (web, iOS, Android) to seamlessly interact with your data
4. Trust that your files are secure, even on infrastructure you don't fully control

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify
- **Database**: PostgreSQL with Prisma ORM
- **Storage**: S3-compatible object storage (MinIO, AWS S3, Cloudflare R2, etc.)
- **Deployment**: Docker & Docker Compose

## 🚦 Getting Started

```bash
# Clone the repository
git clone https://github.com/ZeroNode-Labs/cubby-server.git
cd cubby-server

# Install dependencies
npm install

# Set up your environment variables
cp .env.example .env

# Start with Docker Compose (includes MinIO)
docker-compose up -d

# Run database migrations
npm run migrate

# Start the server
npm run dev
```

## 🤝 Contributing

Cubby Server is an evolving project. Contributions, ideas, and feedback are welcome as we build this together!

## 📝 License

[View License](LICENSE)

---

**Status**: 🚧 **WORK IN PROGRESS** – Rapidly evolving, not production-ready

_Self-hosted. Privacy-focused. Your data, your rules._
