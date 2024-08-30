# Workshop Management System

This is a React-based web application for managing a workshop, including projects, vehicles, parts, tools inventory, and locations.

## Features

- Dashboard overview of workshop activities
- Project management
- Vehicle tracking and service records
- Parts inventory with location tracking
- Tools inventory
- QR code generation for locations
- Dark mode support
- User authentication and profile management
- Dockerized deployment

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- Docker (for containerized deployment)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/workshop-management.git
   ```

2. Navigate to the project directory:
   ```
   cd workshop-management
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Create a `.env` file in the root directory and add your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

5. Start the development server:
   ```
   npm run dev
   ```

6. Open your browser and visit `http://localhost:5173`

### Docker Deployment

To deploy the application using Docker:

1. Build the Docker image:
   ```
   docker build -t workshop-management .
   ```

2. Run the Docker container:
   ```
   docker run -p 3000:3000 workshop-management
   ```

3. Access the application at `http://localhost:3000`

## Project Structure

- `src/`
  - `components/`: Reusable React components
  - `context/`: React context for global state management
  - `pages/`: Main page components
  - `utils/`: Utility functions
  - `App.jsx`: Main application component
  - `main.jsx`: Entry point of the application
  - `firebaseOperations.js`: Firebase CRUD operations
  - `firebase.js`: Firebase configuration

## Technologies Used

- React
- React Router
- Tailwind CSS
- Firebase (Firestore, Authentication)
- Vite
- date-fns
- React Icons
- QRCode.react
- Docker

## Key Features

1. **Project Management**: Create, update, and track projects with detailed information.
2. **Vehicle Management**: Manage vehicles, including service records and maintenance history.
3. **Parts Inventory**: Keep track of parts, their locations, and stock levels.
4. **Tools Inventory**: Manage workshop tools and their availability.
5. **Location Management**: Create and manage storage locations with QR code generation.
6. **Service Records**: Add and view service records for vehicles.
7. **User Authentication**: Secure login and registration system.
8. **Dark Mode**: Toggle between light and dark themes for better user experience.
9. **Dockerized Deployment**: Easy deployment and scaling using Docker containers.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.