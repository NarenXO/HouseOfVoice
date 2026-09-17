# HouseOfVoice

An AI-powered speech therapy platform designed to make speech therapy accessible, engaging, and effective for children and adults.

## Quickstart

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Configure your Supabase and Gemini credentials
uvicorn app.main:app --reload
```

The backend will be available at `http://localhost:8000`

### Frontend
```bash
cd frontend
npm install
cp .env.example .env  # Configure your environment variables
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Tech Stack

- **Backend**: FastAPI (Python 3.11+)
- **Frontend**: React 18 + TypeScript + Tailwind CSS (Vite)
- **Database/Auth**: Supabase (Postgres + Auth + Storage)
- **LLM**: Google Gemini Pro

## Project Structure

```
HouseOfVoice/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── core/           # Configuration and Supabase client
│   │   ├── models/         # Pydantic models (shared types)
│   │   ├── routers/        # API route handlers
│   │   └── services/       # Business logic
│   ├── requirements.txt
│   └── .env.example
├── frontend/               # React frontend
│   ├── src/
│   │   ├── features/       # Feature modules
│   │   ├── shared/         # Shared types and utilities
│   │   └── App.tsx
│   ├── package.json
│   └── .env.example
├── shared/
│   └── mocks/             # Mock data for development
├── docs/                  # Documentation
└── README.md
```

## Features

- **Auth & Onboarding**: Multi-role authentication (patient, guardian, therapist, supervisor)
- **Screening**: AI-powered speech assessment and evaluation
- **Matching**: Intelligent therapist-patient matching
- **Learning**: Personalized learning paths and progress tracking
- **Session**: Real-time therapy sessions with activity tracking
- **Documentation**: Comprehensive session notes and progress reports

## Development

This project is designed for parallel development across 6 feature branches:
- `feature/naren-auth` - Authentication and onboarding
- `feature/salman-screening` - Speech screening and assessment
- `feature/kavya-matching` - Therapist-patient matching
- `feature/sameer-learning` - Learning paths and progress tracking
- `feature/saipranav-session` - Live therapy sessions
- `feature/sanjeevi-docs` - Documentation and reporting

## License

MIT
