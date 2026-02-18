# Diff King Job Tracker

## Overview
The Diff King Job Tracker is a desktop application designed to manage jobs in three categories: Repair, Fabrication, and Deliveries and Dispatch. The application features touch screen functionality for employees to easily interact with job statuses, allowing them to mark jobs as complete, in progress, or not started.

## Features
- **Job Creation**: Employees can create new jobs by entering customer details, job descriptions, dates, and pricing.
- **Job Tracking**: Jobs can be tracked and updated in real-time, with statuses that can be changed via touch screens.
- **Queries Management**: A dedicated section for managing customer enquiries before converting them into jobs.
  - **Tabbed interface** with three sections: Create Query, Active Queries, and Deleted Queries
  - Create queries with customer name, phone number, job description, and items
  - **Search queries** by customer name, phone number, or query ID
  - View and manage deleted queries in a separate tab
  - Convert queries to jobs by selecting the job type (Repair, Fabrication, or Dispatch)
  - Automatic deletion of queries when converted to jobs
- **Offline Functionality**: The application is built to work offline, ensuring that employees can access and update job information without an internet connection.
- **Supabase Sync**: Optional cloud synchronization with Supabase for multi-device access and backup.

## Project Structure
```
diff-king-job-tracker
├── src
│   ├── app.tsx
│   ├── main.ts
│   ├── renderer.tsx
│   ├── components
│   │   └── index.ts
│   ├── screens
│   │   └── index.ts
│   ├── store
│   │   └── index.ts
│   ├── types
│   │   └── index.ts
│   └── styles
│       └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Installation
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/diff-king-job-tracker.git
   ```
2. Navigate to the project directory:
   ```
   cd diff-king-job-tracker
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Build Commands
- **Development**: `npm run dev` - Run in development mode
- **Build**: `npm run build` - Build the application
- **Production**: `npm start` - Build and start the application
- **Package**: `npm run dist` - Create distributable package

## Usage
1. Start the application:
   ```
   npm start
   ```
2. Use the touch screen interface to create and manage jobs.

## Database Setup (Optional - Supabase)

If you want to enable cloud synchronization, set up a Supabase project with the following tables:

### Jobs Table
```sql
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  address TEXT,
  invoice_number TEXT,
  quote_number TEXT,
  importance TEXT NOT NULL,
  description TEXT NOT NULL,
  date TEXT NOT NULL,
  estimated_dispatch_date TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL,
  measurements JSONB,
  attachments JSONB,
  updated_at TEXT,
  completed_at TEXT,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TEXT,
  is_archived BOOLEAN DEFAULT false,
  archived_at TEXT
);
```

### Queries Table
```sql
CREATE TABLE queries (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  description TEXT NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  date TEXT NOT NULL,
  updated_at TEXT,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TEXT
);
```

### Audit Table
```sql
CREATE TABLE job_audit (
  id TEXT PRIMARY KEY,
  job_id TEXT,
  action TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  summary TEXT NOT NULL,
  client_id TEXT
);
```

## Application Screens

- **Home** (`/`) - Create new jobs
- **Jobs** (`/track`) - View and manage active jobs with touchscreen interface
- **Queries** (`/queries`) - Manage customer enquiries and convert to jobs
- **Archive** (`/archive`) - View archived and deleted jobs
- **Settings** (`/settings`) - Configure application settings and Supabase connection

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.