# DropNote Frontend

This is the Vue.js frontend for the DropNote application, built with Vite, TypeScript, and Tailwind CSS. It provides the user interface for interacting with the DropNote API.

## Features

*   View public notes with pagination and infinite scrolling.
*   Create new public or private notes using a rich text editor (TipTap).
*   View individual note details.
*   Edit and delete notes (requires modification code).
*   Filter public notes by tags.
*   Search public notes by title/content.
*   Sort public notes.
*   View a random note.
*   Save/unsave notes locally (using Local Storage) and view saved notes.
*   Responsive design.
*   UI animations using VueUse Motion.
*   Notifications for actions.

## Tech Stack

*   Vue 3 (with `<script setup>`)
*   Vite
*   TypeScript
*   Tailwind CSS
*   Vue Router
*   VueUse / VueUse Motion
*   TipTap (Rich Text Editor)
*   Heroicons

## Setup

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm, pnpm, or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/eugenemartinez/drop-note-ui
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    # or
    # pnpm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env.local` file in the `frontend` directory. You need to specify the URL of the backend API:
    ```dotenv
    # .env.local
    VITE_API_BASE_URL=http://127.0.0.1:5333/api # Adjust port if your backend runs elsewhere
    ```

### Running the Development Server

```bash
npm run dev
# or
# yarn dev
# or
# pnpm dev
```
The frontend development server will start, typically at `http://localhost:5173`.

**Note:** The backend API must be running and accessible at the URL specified in `VITE_API_BASE_URL` for the frontend to function correctly.

## Building for Production

```bash
npm run build
# or
# yarn build
# or
# pnpm build
```
This will create a `dist` directory with the optimized production build.
