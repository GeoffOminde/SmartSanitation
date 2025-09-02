# Smart Sanitation Management Platform

## Overview

This is a cloud-native, multi-tenant SaaS platform for managing mobile-toilet fleets using IoT telemetry, route optimization, dynamic pricing, and mobile-money payments. The system targets operators in East Africa (Kenya, Uganda, Tanzania) and combines real-time monitoring, predictive maintenance, and customer booking capabilities to reduce emergency servicing and increase fleet utilization.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React SPA**: Built with TypeScript and Vite for fast development and building
- **Component Library**: shadcn/ui components with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom design system variables and dark mode support
- **State Management**: TanStack Query for server state and caching
- **Routing**: Wouter for client-side routing
- **Real-time Updates**: WebSocket integration for live telemetry and alerts

### Backend Architecture
- **Runtime**: Node.js with Express server using TypeScript and ES modules
- **API Design**: RESTful endpoints with WebSocket support for real-time features
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL session store
- **Real-time Communication**: WebSocket server for broadcasting telemetry updates and alerts

### Data Architecture
- **Database**: PostgreSQL with TimescaleDB for time-series telemetry data
- **Schema Design**: Multi-tenant structure with operators, units, telemetry, bookings, routes, and maintenance logs
- **Time-series Storage**: Optimized for IoT sensor data with efficient querying
- **Validation**: Zod schemas for runtime type validation and API input validation

### Authentication & Authorization
- **Session-based Auth**: Server-side session management with secure cookies
- **Multi-tenant**: Operator-based data isolation with role-based access control
- **Field Staff Management**: Different permission levels for operators and field workers

### Integration Architecture
- **Payment Processing**: InstaSend API integration for M-Pesa STK Push payments in East Africa
- **IoT Connectivity**: MQTT/HTTPS endpoints for device telemetry ingestion
- **Communication**: SMS/WhatsApp notifications via Twilio
- **Maps Integration**: Prepared for mapping services integration

## External Dependencies

### Core Infrastructure
- **Database**: PostgreSQL with TimescaleDB extension
- **Session Storage**: PostgreSQL-based session store using connect-pg-simple
- **WebSocket**: Native WebSocket implementation for real-time features

### Payment Systems
- **InstaSend**: Primary payment gateway for M-Pesa integration in East Africa (STK Push, webhook handling)
- **M-Pesa**: Mobile money integration via InstaSend API for Kenya, Uganda, Tanzania markets

### Development & Deployment
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle Kit**: Database migrations and schema management
- **Vite**: Frontend build tool with hot module replacement
- **ESBuild**: Backend bundling for production deployment

### UI & Component Libraries
- **Radix UI**: Accessible component primitives for forms, navigation, and overlays
- **Lucide React**: Consistent icon system
- **date-fns**: Date formatting and manipulation
- **React Hook Form**: Form handling with validation

### Communication & Monitoring
- **Twilio**: SMS and WhatsApp messaging capabilities
- **WebSocket**: Real-time telemetry and alert broadcasting
- **TanStack Query**: Efficient data fetching and caching with background updates