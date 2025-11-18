# Compartment Users App

## Overview
Angular 18 application with dependent dropdown fields for selecting compartments and users. The second field (users) is dependent on the first field (compartment) selection.

## Recent Changes (November 18, 2025)
- Created Angular 18 project with standalone components
- Implemented compartment-users component with reactive forms
- Created data service for API calls
- Set up mock Express backend API with test data
- Configured workflows for both frontend and backend

## Project Architecture

### Frontend (Angular 18)
- **Location**: `compartment-users-app/`
- **Component**: `src/app/components/compartment-users/`
  - Reactive form with two dependent fields
  - First field: Compartment (dropdown, single select)
  - Second field: Users (multi-select, enabled after compartment selection)
- **Service**: `src/app/services/data.ts`
  - `getCompartments()`: Fetches list of compartment names
  - `getUsersByCompartment(compartment)`: Fetches users for selected compartment
- **Port**: 5000 (configured in angular.json)

### Backend (Express)
- **Location**: `server.js`
- **Port**: 3000
- **Endpoints**:
  - `GET /api/compartments`: Returns array of compartment names
  - `GET /api/users?compartment=<name>`: Returns array of user objects for the compartment

### User Interface
The interface contains compartment dropdown that loads on component init, and users multi-select that only appears and loads after a compartment is selected. Users can select multiple users via checkboxes.

## Key Features
1. Dependent form fields with reactive forms
2. Multi-select users with checkbox interface
3. Loading states for both API calls
4. Form validation
5. Clean, responsive UI with visual feedback

## Running the Project
- Frontend runs on port 5000 (http://0.0.0.0:5000)
- Backend API runs on port 3000
- Both workflows start automatically
