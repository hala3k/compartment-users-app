# Compartment Users App

## Overview
Angular 18 application with dependent dropdown fields for selecting compartments and users. The second field (users) is dependent on the first field (compartment) selection. Now configured for production deployment on Replit Autoscale.

## Recent Changes (November 19, 2025)
- **Renamed User type to UserGroup** - Better reflects that the interface supports both individual users and groups
- **Added selected user chips** - Visual tags displayed above search field
  - Shows selected users as blue chips/badges
  - Each chip has an X button to quickly remove the user
  - Provides better visual feedback of current selections
- **Real-time external API sync** - Form automatically syncs with external API on changes
  - Debounced sync (500ms) to avoid excessive API calls
  - Only syncs when form is valid (compartment + at least one user selected)
  - Visual sync status indicator (Syncing/Success/Failed)
  - Automatic retry on failure with exponential backoff
  - Server logs all sync events with full user details
  - Supports external API URL via EXTERNAL_API_URL environment variable
- **Added search functionality** - Users can now filter compartments and users using search inputs
  - **Compartment autocomplete**: Single input field with dropdown suggestions (case-insensitive)
    - Type to filter compartments in real-time
    - Click to select from dropdown, or press Enter to select first match
    - Supports exact match selection on blur/tab
  - **User search**: Filter users by name or email (case-insensitive)
  - Search fields automatically clear when switching compartments for better UX
- **Enhanced user data structure** - Form now stores complete UserGroup objects instead of just IDs
  - UserGroup objects include: id, name, email, isGroup, organisationName, organisationId
  - Display shows user name, ID, and email for each selection
  - Added support for both individual users and groups (isGroup flag)

## Previous Changes (November 18, 2025)
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
- **Services**: 
  - `src/app/services/data.ts`:
    - Uses relative API paths (`/api`)
    - `getCompartments()`: Fetches list of compartment names
    - `getUsersByCompartment(compartment)`: Fetches users for selected compartment
  - `src/app/services/external-sync.ts`:
    - Handles real-time form synchronization with external API
    - Implements debouncing (500ms) and retry logic
    - Tracks sync status (idle/syncing/success/error)
    - Posts FormStateDto with compartment, selectedUsers, and timestamp

### Backend (Express)
- **Location**: `server.js`
- **Port**: 5000 (production and development)
- **Features**:
  - Serves Angular production build as static files
  - API endpoints with mock data including users and groups
  - Catch-all route for Angular routing support
- **Endpoints**:
  - `GET /api/compartments`: Returns array of compartment names
  - `GET /api/users?compartment=<name>`: Returns array of UserGroup objects (with id, name, email, isGroup, organisationName, organisationId)
  - `POST /api/sync`: Receives form state updates in real-time, logs to console, optionally forwards to external API
  - `GET /*`: Serves Angular app (catch-all for client-side routing)

### User Interface
The interface contains:
- **Compartment field**: Autocomplete input with dropdown suggestions
  - Type to search and filter compartments in real-time
  - Select by clicking dropdown item, pressing Enter, or typing exact match
  - Dropdown shows all options on focus, filters as you type
- **Selected user chips**: Visual badges showing currently selected users
  - Displayed above the user search field
  - Each chip shows the user's name
  - Click X button on any chip to remove that user
- **Users field**: Search input for filtering + multi-select that only appears after a compartment is selected
- Users can select multiple users via checkboxes
- Real-time search/filter functionality for both fields (case-insensitive)
- **Sync status indicator**: Shows current synchronization state
  - "Syncing..." (blue, pulsing) when sending to API
  - "Synced successfully" (green) on successful sync
  - "Sync failed" (red) on error
- The form displays current selections in real-time and automatically syncs to external API

## Key Features
1. Dependent form fields with reactive forms
2. Multi-select users with checkbox interface and visual chips
3. **Real-time search functionality** for both compartments and users
4. **Automatic external API synchronization** with debouncing and error handling
5. Custom array validation (minimum 1 user required)
6. Loading states for both API calls
7. Form validation with proper error display
8. Clean, responsive UI with visual feedback and sync status
9. Production-ready deployment configuration

## Environment Variables
- `EXTERNAL_API_URL` (optional): URL of external API to forward form state updates to. If not set, form state is only logged to server console.

## Development
- Run `npm start` in `compartment-users-app/` for Angular dev server (port 4200)
- The Production Server workflow serves the built app on port 5000

## Deployment
- **Target**: Autoscale
- **Build Command**: `cd compartment-users-app && npm run build`
- **Run Command**: `node server.js`
- **Port**: 5000 (automatically mapped to port 80 for external access)
- Ready to deploy via Replit's deployment interface
