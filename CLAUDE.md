# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Kepler Chat** - a comprehensive multi-user LLM chat platform built with Next.js 15, TypeScript, and Tailwind CSS. The project is designed to showcase the full capabilities of the Vercel AI SDK, including multi-provider support, streaming responses, tool calling, multi-modal interactions, and file attachments.

## Development Commands

### Core Commands
- `npm run dev` - Start development server with Turbopack (opens on http://localhost:3000)
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

### Database Commands
- `npm run db:generate` - Generate database migration files from schema changes
- `npm run db:migrate` - Apply migrations to database
- `npm run db:push` - Push schema changes directly to database (development)
- `npm run db:studio` - Open Drizzle Studio for database inspection

### Testing Commands
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Alternative Package Managers
The project supports multiple package managers:
- `bun dev` - Development with Bun
- `yarn dev` - Development with Yarn
- `pnpm dev` - Development with pnpm

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Database**: PostgreSQL (self-hosted VPS), Drizzle ORM for type-safe database operations
- **Authentication**: BetterAuth with secure session management
- **File Storage**: Cloudflare R2 with presigned URL uploads
- **AI Integration**: Vercel AI SDK (planned)

### Project Structure
```
src/
├── app/
│   ├── globals.css           # Global styles with Tailwind
│   ├── layout.tsx           # Root layout with Geist fonts
│   └── page.tsx             # Home page (Next.js default)
├── components/
│   └── ui/                  # shadcn/ui components (button, input, etc.)
├── lib/
│   ├── db/
│   │   ├── schema.ts        # Drizzle database schema definitions
│   │   ├── index.ts         # Database client configuration
│   │   ├── queries.ts       # Database query functions
│   │   ├── types.ts         # TypeScript type definitions
│   │   └── migrations/      # Generated migration files
│   ├── auth.ts             # BetterAuth server configuration
│   ├── auth-client.ts      # BetterAuth client utilities
│   ├── auth-server.ts      # Server-side auth helpers
│   ├── r2-storage.ts       # Cloudflare R2 storage utilities
│   ├── file-upload.ts      # Client-side file upload functions
│   └── utils.ts            # Utility functions (from shadcn)
├── (current API routes)
│   └── app/api/
│       ├── auth/[...all]/   # BetterAuth API endpoints
│       └── files/           # File upload/management endpoints
├── (future directories)
│   └── components/chat/     # Chat-specific components
└── stores
    └── ui-store.ts             # Zustand store for UI state (dialogs, etc.)
```

### Key Features (Planned)
- Multi-provider LLM support (OpenAI, Anthropic, Google, OpenRouter)
- Streaming chat responses with `useChat` hook
- Multi-modal capabilities (text, images, files, audio)
- Tool/function calling with custom tools
- Multi-step autonomous agents
- Persistent chat history per user
- Real-time collaboration
- File upload and processing

## Development Guidelines

### Font Configuration
The project uses Geist fonts (Sans and Mono) loaded via `next/font/google` with CSS variables:
- `--font-geist-sans` for main text
- `--font-geist-mono` for code/monospace text

### Path Aliases
- `@/*` maps to `./src/*` for clean imports

### TypeScript Configuration
- Strict mode enabled
- Target: ES2017
- Module resolution: bundler
- JSX: preserve (for Next.js)

## Database Schema

The PostgreSQL database schema is implemented with Drizzle ORM and includes:

### Core Tables
- **users** - User accounts (managed by BetterAuth)
- **sessions** - User sessions (managed by BetterAuth)  
- **chats** - Chat conversations with model configurations
- **messages** - Individual messages with multi-part support and tool invocations
- **files** - File attachments stored in Cloudflare R2
- **custom_tools** - User-defined tools for enhanced functionality
- **usage_metrics** - Token usage and cost tracking per user/chat

### Key Features
- Type-safe database operations with Drizzle ORM
- Optimized indexes for query performance
- Foreign key constraints for data integrity
- JSONB fields for flexible metadata storage
- Future-ready for vector search (pgvector)

## File Storage System

Cloudflare R2 integration is implemented with:

### Core Features
- **Direct uploads** - Files upload directly to R2 using presigned URLs
- **Security** - File type validation and size limits (50MB max)
- **Metadata tracking** - Database storage of file information
- **Multi-format support** - Images, documents, audio, video files
- **Progress tracking** - Upload progress monitoring (ready for UI)

### API Endpoints
- `POST /api/files/upload-url` - Generate presigned upload URLs
- `POST /api/files/confirm-upload` - Confirm upload and save metadata
- `GET /api/files/[fileId]` - Retrieve file metadata
- `DELETE /api/files/[fileId]` - Delete files from R2 and database

### Client Components
- `<FileUpload />` - Drag & drop file upload component
- File validation and progress tracking utilities
- Support for multiple file uploads

## Authentication System

Complete authentication implementation with:

### User Interface
- **Sign Up** - Registration with password strength validation
- **Sign In** - Login with remember me and redirect support
- **Password Reset** - Email-based password recovery flow
- **User Profile** - Profile editing with password change
- **Auth Layout** - Responsive design for all auth pages

### Features
- Form validation with React Hook Form + Zod
- Password strength indicator with visual feedback
- Loading states and error handling
- Accessibility support (ARIA labels, keyboard navigation)
- Responsive design for mobile and desktop

## Important Context

This project is in active development. **Epic 1 (Foundation & Infrastructure) is COMPLETE**:

### ✅ Completed Epic 1 Tasks
- **KEP-33**: Next.js 15 setup with TypeScript and App Router
- **KEP-34**: Complete PostgreSQL database schema with Drizzle ORM
- **KEP-36**: BetterAuth authentication system with route protection
- **KEP-37**: Cloudflare R2 file storage with presigned URL uploads
- **KEP-48**: Complete authentication UI with forms and validation
- **KEP-47**: Vercel deployment pipeline configuration

### Additional Implementations
- Type-safe database queries and migrations  
- Development tooling and scripts
- Comprehensive testing suite with Jest and React Testing Library
- Component tests, API tests, and utility tests
- 90%+ test coverage across all foundation components

The platform now has a solid foundation ready for AI SDK integration and chat functionality.

### ✅ **Recent Critical Fixes (Epic 2 - Chat Implementation)**

**Major Refactor Completed**: Comprehensive state management migration and settings integration.

#### **State Management Architecture**
- **Zustand Migration**: Migrated from local React state to centralized Zustand stores
- **8 Specialized Stores**: chat-store, ui-store, settings-store, notification-store, form-store, file-upload-store, chat-data-store, password-store
- **Persistent State**: All stores use localStorage persistence with selective partitioning
- **Immer Integration**: All stores use Immer middleware for immutable updates

#### **Settings System Implementation**
- **Comprehensive Settings Store**: Full user preferences with server synchronization
- **App-Level Loading**: Settings load at app initialization in StoreProvider 
- **Dynamic UI Application**: CSS custom properties for fontSize and sidebarWidth
- **Settings Synchronization**: All stores respect user preferences (provider, model, theme, UI settings)
- **Notification Filtering**: Notifications respect user notification preferences

#### **Media Attachment System**
- **Fixed Critical Bug**: Resolved race condition preventing media attachments from being sent
- **File Upload Pipeline**: Complete R2 integration with progress tracking and validation
- **Multi-Format Support**: Images, audio, video, PDFs, and documents
- **Error Handling**: Comprehensive upload error handling and user feedback

#### **UI/UX Enhancements**
- **Dynamic Typography**: User-configurable font sizes (small/medium/large) applied globally
- **Responsive Sidebar**: User-configurable sidebar width (narrow/normal/wide)
- **Theme System**: Complete dark/light/system theme support with instant switching
- **Enhanced Forms**: Form validation, loading states, error handling across all auth forms
- **Notification System**: Toast notifications with filtering and dismissal

#### **Code Quality & Architecture**
- **TypeScript Strict**: Enhanced type safety across all stores and components
- **ESLint Integration**: Added comprehensive linting rules
- **Component Architecture**: Provider pattern for global state management
- **Error Boundaries**: Graceful error handling throughout the application
- **Performance**: Optimized re-renders and state updates

The comprehensive product design document (PRODUCT_DESIGN.md) outlines the full vision for this multi-user chat platform.

## Current Architecture Status

### **Store Structure**
```
src/lib/stores/
├── settings-store.ts        # User preferences (theme, language, defaults)
├── ui-store.ts             # UI state (sidebar, dialogs, responsive)
├── chat-store.ts           # Chat settings (provider, model, tools, params)
├── chat-data-store.ts      # Chat data (messages, folders, search)
├── notification-store.ts   # Toast notifications with filtering
├── form-store.ts           # Form state management with validation
├── file-upload-store.ts    # File upload state and progress
└── password-store.ts       # Password validation and strength
```

### **Provider Architecture**
```
src/components/providers/
├── store-provider.tsx      # App-level store initialization
├── theme-provider.tsx      # Theme switching and persistence
└── (app-level providers wrap entire application)
```

### **Settings Integration**
- All stores load from user preferences on app initialization
- Settings changes immediately propagate to all components
- CSS custom properties enable dynamic styling
- Persistent localStorage with server synchronization

### **Media Attachment Flow**
1. File selection triggers upload to R2 with presigned URLs
2. Upload progress tracked in file-upload-store
3. Completed uploads added to message as experimental_attachments
4. API route validates and processes attachments for AI models

## Future Implementation Notes

When implementing additional chat features:
- Use existing Zustand stores for state management
- Settings integration is automatic via app-level loading
- File attachments work end-to-end with R2 storage
- Notification system ready for chat events
- Form validation patterns established in form-store
- Responsive design respects user UI preferences


# Important Note
- DO NOT USE WORKAROUNDS, FALLBACKS, OR HACKS.
- DO NOT FOOL THE REVIEWER.