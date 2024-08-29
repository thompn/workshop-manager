# Workshop Management System

This is a React-based web application for managing a workshop, including projects, vehicles, parts, and tools inventory.

## Features

- Dashboard overview of workshop activities
- Project management
- Vehicle tracking
- Parts inventory
- Tools inventory
- Dark mode support

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

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

4. Start the development server:
   ```
   npm start
   ```

5. Open your browser and visit `http://localhost:3000`

## Project Structure

- `src/`
  - `components/`: Reusable React components
  - `context/`: React context for global state management
  - `pages/`: Main page components
  - `App.jsx`: Main application component
  - `index.js`: Entry point of the application

## Technologies Used

- React
- React Router
- Tailwind CSS
- React Icons

## Environment Setup

This project uses environment variables to manage sensitive information. Follow these steps to set up your environment:

1. Copy the `.env.example` file in the project root and rename it to `.env`:
   ```
   cp .env.example .env
   ```

2. Open the `.env` file and replace the placeholder values with your actual Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_actual_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_actual_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_actual_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_actual_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_actual_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_actual_measurement_id
   ```

3. Make sure to never commit your `.env` file to version control. It's already included in the `.gitignore` file.

For more information on how to obtain these Firebase configuration values, refer to the Firebase documentation.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.