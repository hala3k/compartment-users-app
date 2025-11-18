# Compartment Users App

## Overview
Angular 18 application with dependent dropdown fields for selecting compartments and users. The second field (users) is dependent on the first field (compartment) selection. Now configured for production deployment on Replit Autoscale.

## Recent Changes (November 18, 2025)
- Created Angular 18 project with standalone components
- Implemented compartment-users component with reactive forms
- Created data service for API calls
- Set up Express backend API with test data
- **Configured for production deployment:**
  - Angular builds to production bundle
  - Express serves both API and Angular static files on port 5000
  - Deployment configured for Replit Autoscale
  - Single unified server for both frontend and backend
- **Removed submit button** - Form now just displays selections without a submit action
- Created GitHub repository at https://github.com/hala3k/compartment-users-app

## Project Architecture

### Production Setup
- **Server**: Express on port 5000 serves both the API and Angular production build
- **Build Process**: Angular compiles to `compartment-users-app/dist/compartment-users-app/browser`
- **Deployment**: Configured for Autoscale with automatic build on deploy

### Frontend (Angular 18)
- **Location**: `compartment-users-app/`
- **Component**: `src/app/components/compartment-users/`
  - Reactive form with two dependent fields
  - First field: Compartment (dropdown, single select)
  - Second field: Users (multi-select, enabled after compartment selection)
  - Custom validation ensures at least one user is selected
- **Service**: `src/app/services/data.ts`
  - Uses relative API paths (`/api`)
  - `getCompartments()`: Fetches list of compartment names
  - `getUsersByCompartment(compartment)`: Fetches users for selected compartment

### Backend (Express)
- **Location**: `server.js`
- **Port**: 5000 (production and development)
- **Features**:
  - Serves Angular production build as static files
  - API endpoints with mock data
  - Catch-all route for Angular routing support
- **Endpoints**:
  - `GET /api/compartments`: Returns array of compartment names
  - `GET /api/users?compartment=<name>`: Returns array of user objects for the compartment
  - `GET /*`: Serves Angular app (catch-all for client-side routing)

### User Interface
The interface contains compartment dropdown that loads on component init, and users multi-select that only appears and loads after a compartment is selected. Users can select multiple users via checkboxes. The form displays current selections in real-time without requiring a submit action.

## Key Features
1. Dependent form fields with reactive forms
2. Multi-select users with checkbox interface
3. Custom array validation (minimum 1 user required)
4. Loading states for both API calls
5. Form validation with proper error display
6. Clean, responsive UI with visual feedback
7. Production-ready deployment configuration

## Development
- Run `npm start` in `compartment-users-app/` for Angular dev server (port 4200)
- The Production Server workflow serves the built app on port 5000

## Deployment
- **Target**: Autoscale
- **Build Command**: `cd compartment-users-app && npm run build`
- **Run Command**: `node server.js`
- **Port**: 5000 (automatically mapped to port 80 for external access)
- Ready to deploy via Replit's deployment interface
