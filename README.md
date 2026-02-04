# LootLinks 🔗💰

Monetize your links with ad-gated content. Create short links that require viewers to complete tasks (watch ads) before accessing your content.

## 🚀 Tech Stack

- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[Clerk](https://clerk.com/)** - Authentication and user management
- **[Prisma](https://www.prisma.io/)** - Type-safe ORM for database operations
- **[Neon](https://neon.tech/)** - Serverless Postgres database
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[shadcn/ui](https://ui.shadcn.com/)** - UI components

## ✨ Features

- 🔐 **Secure Authentication** - Powered by Clerk
- 🔗 **Short Link Generation** - Create unique, memorable short links
- 🎯 **Customizable Gates** - Set how many ads viewers must watch (1-5)
- 📊 **Analytics Dashboard** - Track views, completions, and earnings
- 💰 **CPM Tracking** - Different rates per country
- 🤖 **Bot Detection** - Filter out bot traffic
- 📱 **Responsive Design** - Works on all devices
- ⚡ **Fast & Reliable** - Server-side rendering and API routes

## 🛠️ Setup

### Prerequisites

- Node.js 20 or higher
- npm or pnpm
- A [Clerk](https://clerk.com/) account
- A [Neon](https://neon.tech/) account (or any PostgreSQL database)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ranguyafk/lootlinks.git
   cd lootlinks
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
   CLERK_SECRET_KEY=sk_test_xxx
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma Client
   npm run db:generate
   
   # Create database tables
   npm run db:migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Documentation

For detailed migration information from the previous Supabase version, see [MIGRATION.md](MIGRATION.md).

## 🎮 Usage

### Creating a Link

1. Sign up or sign in at `/auth/sign-up` or `/auth/sign-in`
2. Go to your dashboard
3. Click "Create Link"
4. Enter your destination URL
5. Optionally add a title
6. Set how many ads viewers must watch
7. Copy your short link and share it!

### Accessing a Link

1. Visit a LootLinks URL (e.g., `https://lootlinks.com/abc123`)
2. Complete the required number of tasks
3. Get redirected to the destination

## 📁 Project Structure

```
lootlinks/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── links/        # Link CRUD operations
│   │   └── gate/         # Gate tracking
│   ├── auth/             # Authentication pages (Clerk)
│   ├── dashboard/        # User dashboard
│   ├── [slug]/          # Dynamic link route
│   └── layout.tsx        # Root layout with ClerkProvider
├── components/           # React components
│   ├── dashboard/       # Dashboard-specific components
│   ├── gate/            # Gate/interstitial components
│   ├── navigation/      # Navigation components
│   └── ui/              # shadcn/ui components
├── lib/                 # Utility libraries
│   ├── db.ts           # Prisma client
│   ├── bots.ts         # Bot detection
│   ├── cpm.ts          # CPM calculation
│   └── utils.ts        # Utility functions
├── prisma/
│   └── schema.prisma   # Database schema
└── middleware.ts       # Clerk middleware
```

## 🗄️ Database Schema

### User
- Links to Clerk user ID
- Stores email and creation date

### Link
- User's monetized links
- Includes slug, destination URL, title
- Tracks views, completions, active status

### LinkEvent
- Individual gate view events
- IP, user agent, country tracking
- Bot detection and CPM calculation
- Deduplication per link/IP/UA/minute

## 🔧 Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Database commands
npm run db:generate  # Generate Prisma Client
npm run db:migrate   # Run database migrations
npm run db:push      # Push schema changes without migration
npm run db:studio    # Open Prisma Studio (database GUI)
```

## 🧪 Testing

The project uses [Vitest](https://vitest.dev/) for testing. Tests are colocated with the code in `__tests__` directories.

Run tests:
```bash
npm run test
```

Watch mode for development:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `DATABASE_URL`
4. Deploy!

Vercel automatically runs `prisma generate` during build.

### Other Platforms

Ensure your deployment platform:
1. Runs `npm run db:generate` before building
2. Has all environment variables set
3. Can connect to your PostgreSQL database

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Yes |
| `CLERK_SECRET_KEY` | Clerk secret key | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Clerk](https://clerk.com/) for authentication
- [Prisma](https://www.prisma.io/) for the ORM
- [Neon](https://neon.tech/) for serverless Postgres
- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Vercel](https://vercel.com/) for deployment

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

Made with ❤️ by [ranguyafk](https://github.com/ranguyafk)
