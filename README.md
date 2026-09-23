# Tutorly

Tutorly is an AI Agent tutoring platform comprising a Python backend and a Next.js frontend.

## Project Structure

The project is structured into two main components:

- [`/agent`](./agent/): The Python backend running a FastAPI server. It manages the AI agents (ReAct Planners, etc.) and handles interactions with MongoDB.
- [`/app`](./app/): The Next.js frontend application, built with React, Tailwind CSS, and NextAuth.

## Getting Started

### Backend (`/agent`)

The backend is built with FastAPI.

1. Navigate to the `agent` directory:
   ```bash
   cd agent
   ```
2. Set up your Python environment and dependencies.
3. Configure the environment variables by referencing or creating the `.env` file.
4. Run the FastAPI development server:
   ```bash
   fastapi dev main.py
   # or
   uvicorn main:app --reload
   ```

### Frontend (`/app`)

The frontend is a modern Next.js application.

1. Navigate to the `app` directory:
   ```bash
   cd app
   ```
2. Install the Node.js dependencies:
   ```bash
   npm install
   ```
3. Configure the required environment variables in `app/.env` (e.g., MongoDB credentials, NextAuth settings).
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Technologies Used

- **Backend**: Python, FastAPI, MongoDB
- **Frontend**: Next.js, React, Tailwind CSS, NextAuth

