# Workshop Management System

This is a comprehensive React-based web application for managing a workshop, including projects, vehicles, parts, tools inventory, and service records.

## Features

1. Project Management
   - Create, view, edit, and delete projects
   - Manage epics and stories within projects
   - Track project progress and status

2. Vehicle Management
   - Add, view, edit, and delete vehicles
   - Track vehicle details including make, model, year, and mileage
   - Manage service records for each vehicle
   - Generate service reports

3. Parts Inventory
   - Add, view, edit, and delete parts
   - Track part details, including stock levels and reorder thresholds
   - Associate parts with vehicles and suppliers
   - Manage suppliers and their information
   - Upload and view part invoices

4. Tools Inventory
   - Add, view, edit, and delete tools
   - Track tool details, including location and maintenance dates
   - Categorize tools for easy management

5. Service Management
   - Create and manage service records for vehicles
   - Use service checklists for standardized maintenance
   - Track service costs and technician information

6. Location Management
   - Manage storage locations for parts and tools

7. Search and Filter
   - Search and filter functionality for parts, tools, and vehicles

8. User Interface
   - Responsive design with dark mode support
   - Pagination for large data sets

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- Firebase account and project

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/thompn/workshop-management.git
   ```

2. Navigate to the project directory:
   ```
   cd workshop-management
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Set up Firebase:
   - Create a new Firebase project at https://console.firebase.google.com/
   - Enable Firestore database and Authentication (with email/password)
   - In your Firebase project settings, find the configuration object

5. Create a `.env` file in the root directory and add your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

6. Start the development server:
   ```
   npm run dev
   ```

7. Open your browser and visit `http://localhost:5173`

## Usage

### Projects
- Navigate to the Projects page to view all projects
- Use the "Add Project" button to create a new project
- Click on a project to view its details, including epics and stories
- Manage epics and stories within each project

### Vehicles
- Go to the Vehicles page to see all registered vehicles
- Use the "Manage Vehicles" button to add, edit, or delete vehicles
- Click on a vehicle to view its details and service history
- Add new service records or edit existing ones

### Parts
- Access the Parts page to view the parts inventory
- Use filters and search to find specific parts
- Click "Manage Parts" to add, edit, or delete parts
- Manage suppliers and their information
- Upload invoices for parts

### Tools
- Visit the Tools page to see the tools inventory
- Use categories and search to find specific tools
- Click "Manage Tools" to add, edit, or delete tools
- Track tool locations and maintenance schedules

### Service Management
- Access service records through the Vehicle Details page
- Use the service checklist when performing maintenance
- Add detailed service information, including costs and technician notes

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.