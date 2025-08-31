# 🏍️ OnTwoWheelz - Motorcycle Adventure Platform

![OnTwoWheelz](https://ontwowheelz.vercel.app/)

**Live Demo:** [https://ontwowheelz.vercel.app/](https://ontwowheelz.vercel.app/)

A comprehensive motorcycle adventure platform that connects riders worldwide. Plan epic journeys, discover amazing routes, share your adventures, and build lasting friendships in the motorcycle community.

## ✨ Features

### 🛣️ Trip Management
- **Create & Plan Trips**: Organize motorcycle adventures with detailed itineraries
- **Trip Discovery**: Browse and join upcoming trips from fellow riders
- **Advanced Filtering**: Search by difficulty, date, location, and more
- **Real-time Updates**: Live participant counts and trip status tracking

### 👥 Social Features
- **Adventure Posts**: Share your riding experiences with photos and stories
- **Interactive Feed**: Like and engage with other riders' posts
- **Trip Chat**: Real-time messaging within trip groups
- **User Profiles**: Showcase your riding achievements and statistics

### 🔐 Authentication & Security
- **Supabase Authentication**: Secure login with email/password and Google OAuth
- **Profile Management**: Customizable user profiles with avatars and bios
- **Row Level Security**: Database-level security policies
- **JWT Tokens**: Secure API authentication

### 🎨 Modern UI/UX
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Dark/Light Themes**: Theme switching capability
- **Smooth Animations**: Framer Motion powered transitions
- **Accessible Components**: Built with Radix UI primitives

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool with SWC
- **React Router** - Client-side routing with protected routes
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful and accessible component library

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Supabase Auth** - Authentication and user management
- **Supabase Storage** - File storage for images and avatars
- **Row Level Security** - Database-level access control

### Development Tools
- **ESLint** - Code linting and formatting
- **TypeScript** - Type checking
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd ontwowheelz
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env.local` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Start development server**
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run build:dev       # Build in development mode
npm run preview         # Preview production build
npm run lint            # Run ESLint
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Navigation.tsx  # Main navigation
│   ├── TripPlanningModal.tsx
│   └── ...
├── pages/              # Page components
│   ├── Landing.tsx     # Homepage
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Profile.tsx     # User profile
│   ├── AllTrips.tsx    # Trip discovery
│   └── ...
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
│   ├── auth.ts         # Authentication services
│   ├── supabase.ts     # Supabase client
│   └── utils.ts        # Helper functions
└── assets/             # Static assets
```

## 🔧 Configuration

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings > API
3. Set up the required database tables using the SQL scripts in the project

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Yes |

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository**
   - Import your GitHub repository to Vercel
   - Vercel will automatically detect the Vite configuration

2. **Environment Variables**
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel dashboard

3. **Deploy**
   - Vercel uses the `vercel.json` configuration for proper routing
   - Build command: `npm run build`
   - Output directory: `dist`

The `vercel.json` file handles SPA routing to prevent 404 errors on refresh:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

## 📱 Features Overview

### 🏠 Landing Page
- Hero section with call-to-action
- Feature highlights
- Testimonials from riders
- Responsive design

### 📊 Dashboard
- Personalized feed with posts from followed users
- Trip discovery section
- Quick action buttons
- Real-time activity updates

### 👤 User Profiles
- Customizable profile information
- Riding statistics and achievements
- Trip history
- Social connections

### 🛣️ Trip Management
- Create detailed trip itineraries
- Join existing trips
- Real-time chat within trip groups
- Image galleries for trip highlights

### 💬 Social Features
- Post creation with image uploads
- Like and comment system
- User following
- Activity feeds

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use ESLint configuration for code quality
- Write meaningful commit messages
- Test your changes thoroughly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/) and [Supabase](https://supabase.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)

## 📞 Support

For support or questions:
- Create an issue in this repository
- Contact the development team

---

**Happy Riding! 🏍️✨**

*Built for riders, by riders.*
