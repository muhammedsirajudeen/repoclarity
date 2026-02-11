# RepoClarity

RepoClarity is a developer tooling SaaS that automatically generates database diagrams from your GitHub repositories. It helps developers understand their data architecture in seconds by visualizing schemas directly from the codebase.

## Features

- **Instant Diagrams**: Connect your repository and get a complete database schema diagram in seconds.
- **GitHub Integration**: Seamlessly integrates with your GitHub workflow. Automatically updates when you push code.
- **Secure by Design**: We never store your code. Your data is processed securely and is ephemeral.
- **Multiple DB Support**: Supports PostgreSQL, MySQL, SQLite, and MongoDB schemas defined in your ORM.
- **Dark/Light Mode**: Fully supported dark and light modes for a comfortable viewing experience.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (via Mongoose)
- **Authentication**: GitHub OAuth (Planned)
- **Icons**: [Lucide React](https://lucide.dev/)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Docker (for local MongoDB)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/muhammedsirajudeen/repoclarity.git
   cd repoclarity
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following:
   ```env
   MONGODB_URI=mongodb://root:password@localhost:27030/repoclarity?authSource=admin
   GITHUB_ID=your_github_client_id
   GITHUB_SECRET=your_github_client_secret
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret
   ```

4. Start the local database:
   ```bash
   docker-compose up -d
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/`: Next.js App Router pages and layouts.
- `components/`: Reusable UI components.
  - `landing/`: Components specific to the landing page.
  - `auth/`: Authentication related components.
  - `ui/`: Shadcn UI primitives.
- `lib/`: Utility functions and database configuration.
- `public/`: Static assets.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
