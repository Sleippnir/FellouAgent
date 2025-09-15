# Installation Guide

This document provides instructions on how to set up and run the React Voice Interview System application.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

-   [Node.js](https://nodejs.org/) (v18 or later recommended)
-   [Python](https://www.python.org/) (v3.9 or later recommended)
-   [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) (for production deployment)

## Project Structure

The project is a monorepo with the following structure:

-   `/frontend`: The React/Vite frontend application.
-   `/backend`: The Node.js/Express backend server.
-   `/python`: Python services for audio processing (STT and TTS).
-   `/supabase`: SQL schema for the Supabase database.

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository_url>
cd <repository_directory>
```

### 2. Supabase Setup

1.  **Create a Supabase Project**: Go to [Supabase](https://supabase.com/) and create a new project.
2.  **Database Schema**: In your Supabase project dashboard, go to the "SQL Editor" and paste the contents of the `/supabase/schema.sql` file. Run the query to create all the necessary tables, indexes, and policies.
3.  **Get API Keys**: In your Supabase project dashboard, go to "Project Settings" -> "API". You will need the **Project URL** and the **`anon` public key**. You will also need the **`service_role` secret key**.

### 3. Backend Setup

1.  **Navigate to the backend directory**:
    ```bash
    cd backend
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Create a `.env` file**: Create a `.env` file in the `backend` directory by copying the `.env.example` file.
    ```bash
    cp .env.example .env
    ```
    Update the `backend/.env` file with your credentials:
    ```
    # Supabase Configuration
    SUPABASE_URL=your_supabase_url
    SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_KEY=your_supabase_service_key

    # OpenAI Configuration
    OPENAI_API_KEY=your_openai_api_key

    # Server Configuration
    PORT=3001
    ```
4.  **Start the server**:
    ```bash
    npm start
    ```

### 4. Frontend Setup

1.  **Navigate to the frontend directory**:
    ```bash
    cd frontend
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Create a `.env` file**: Create a `.env` file in the `frontend` directory.
    Update it with your Supabase credentials:
    ```
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
4.  **Start the development server**:
    ```bash
    npm run dev
    ```

### 5. Python Services Setup

1.  **Navigate to the python directory**:
    ```bash
    cd python
    ```
2.  **Create a virtual environment** (recommended):
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```
3.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
4.  **Download AI Models**:
    *   **Piper TTS Model**: The Text-to-Speech service requires a voice model. From the `python` directory, run the following command to download the recommended English voice model. This will create a `models` directory inside the `python` directory and place the voice files there.
        ```bash
        python -m piper.download en_US-lessac-medium
        ```
        This command will download the `en_US-lessac-medium.onnx` and `en_US-lessac-medium.onnx.json` files into the `./models` directory relative to where you run the command.
    *   **Whisper STT Model**: The Speech-to-Text service uses the `openai-whisper` library, which will automatically download the 'base' model on its first run. No manual download is required for this one.

5.  **Start the Python server**:
    From the `python` directory, run the following command to start the FastAPI server:
    ```bash
    uvicorn main:app --host 0.0.0.0 --port 8000
    ```
    Alternatively, you can use the provided `Dockerfile` to build and run the service in a container.

### 6. Running Tests

Due to issues with the development environment, running tests via the command line was not possible during development. However, the testing infrastructure is in place.

-   **Backend Tests**:
    ```bash
    cd backend
    npm test
    ```
-   **Frontend Tests**:
    ```bash
    cd frontend
    npm test
    ```
