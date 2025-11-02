# Chat2Doc - AI-Powered Document Chat

A modern web application that allows users to upload documents and chat with them using AI. Features include user authentication, document management, persistent chat history, and public sharing capabilities.

## Features

- 🔐 **User Authentication** - Secure login and registration system with JWT tokens
- 📄 **Document Upload** - Support for PDF, DOCX, DOC, and TXT files
- 🤖 **AI Chat** - Chat with your documents using advanced AI with streaming responses
- 💬 **Chat History** - Persistent chat sessions with message history management
- 📊 **Document Analysis** - Analyze document structure and content
- 🗄️ **Multiple Vector Databases** - Support for ChromaDB, Pinecone, Weaviate, and Qdrant
- 🔗 **Document Sharing** - Share document chats with unique URLs (public/private)
- ⚡ **Smart Caching** - Intelligent document caching for improved performance
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🎨 **Modern UI** - Beautiful, intuitive interface built with Tailwind CSS
- 📝 **Markdown Support** - Rich text rendering with react-markdown

## Tech Stack

### Frontend
- Next.js 15.5.6
- React 19.1.0
- Tailwind CSS
- Axios (HTTP client)
- react-markdown (Markdown rendering)
- remark-gfm (GitHub Flavored Markdown)

### Backend
- FastAPI 0.119.0+
- Python 3.12+
- SQLModel 0.0.27+ (ORM)
- ChromaDB 1.1.1+ (default vector storage)
- LangChain 0.3.27+ (AI integration)
- Instructor Embeddings 1.0.1+ (with TF-IDF fallback)
- JWT Authentication (python-jose)
- Argon2 Password Hashing (passlib)
- Support for multiple vector databases (ChromaDB, Pinecone, Weaviate, Qdrant)
- Document caching system

## Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.12+
- uv (Python package manager) - [Installation guide](https://github.com/astral-sh/uv)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
uv sync
```

3. Set up environment variables:
```bash
# Create a .env file in the backend directory
cat > .env << EOF
SECRET_KEY=your-secret-key-here-generate-a-secure-random-string
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Vector Database Configuration (optional)
VECTOR_DB_TYPE=chroma  # Options: chroma, pinecone, weaviate, qdrant
VECTOR_DB_PERSIST_DIR=./data/chroma
VECTOR_DIMENSION=384
VECTOR_DISTANCE_METRIC=cosine

# LLM Configuration (optional - defaults to provided endpoint)
LLM_ENDPOINT=http://144.24.121.168:5000/generate

# For external vector databases, add:
# PINECONE_API_KEY=your_key (for Pinecone)
# WEAVIATE_URL=http://localhost:8080 (for Weaviate)
# QDRANT_URL=http://localhost:6333 (for Qdrant)
EOF
```

For detailed vector database setup, see [VECTOR_DB_SETUP.md](backend/VECTOR_DB_SETUP.md)

4. Run the backend server:
```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create a .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

4. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Usage

1. **Register/Login** - Create an account or sign in with your credentials
2. **Upload Documents** - Upload PDF, DOCX, DOC, or TXT files from the dashboard
3. **Chat with Documents** - Start a chat session and ask questions about your documents
4. **View Chat History** - Access previous conversations and continue where you left off
5. **Analyze Documents** - Get detailed analysis of document structure and content
6. **Share Documents** - Make documents public and share the chat link with others
7. **Manage Documents** - View, organize, and manage all your documents in the dashboard

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Documents
- `POST /upload/` - Upload a document
- `GET /upload/documents?user_id={id}` - Get user's documents
- `GET /upload/documents/{share_token}` - Get document by share token
- `PATCH /upload/documents/{doc_id}/toggle-public` - Toggle document visibility

### Chat
- `POST /chat/stream` - Chat with document (authenticated, streaming)
- `POST /chat/public/stream` - Chat with public document (streaming)

### Chat History
- `POST /chat-history/sessions` - Create a new chat session
- `GET /chat-history/sessions` - Get all user's chat sessions
- `GET /chat-history/sessions/{session_id}/messages` - Get messages in a session
- `POST /chat-history/messages` - Create a chat message
- `DELETE /chat-history/sessions/{session_id}` - Delete a chat session

### Document Analysis
- `POST /analysis/analyze-document` - Analyze document structure and content

### Cache Management
- `GET /cache/stats` - Get cache statistics
- `GET /cache/documents` - Get list of cached documents
- `POST /cache/clear` - Clear all cached documents for user
- `POST /cache/clear/{document_id}` - Clear cache for a specific document

## Project Structure

```
chat2doc-os/
├── backend/
│   ├── app/
│   │   ├── auth.py              # Authentication logic
│   │   ├── main.py              # FastAPI application
│   │   ├── models.py            # Database models (User, Document, ChatSession, ChatMessage)
│   │   ├── db.py                # Database connection and setup
│   │   ├── routes_auth.py       # Authentication routes
│   │   ├── routes_chat.py       # Chat endpoints (streaming)
│   │   ├── routes_chat_history.py  # Chat history management
│   │   ├── routes_upload.py     # Document upload endpoints
│   │   ├── document_analysis.py # Document structure analysis
│   │   ├── cache_management.py  # Cache management endpoints
│   │   ├── document_cache.py    # Document caching implementation
│   │   ├── utils_pdf.py         # PDF processing utilities
│   │   ├── utils_vector.py      # Vector operations and embeddings
│   │   └── vector_db_factory.py # Multi-vector-database support
│   ├── data/
│   │   ├── uploads/             # Uploaded documents
│   │   └── chat2doc.db         # SQLite database
│   ├── pyproject.toml          # Python dependencies (uv)
│   ├── requirements.txt        # Alternative dependency file
│   └── VECTOR_DB_SETUP.md      # Vector database setup guide
├── frontend/
│   ├── components/
│   │   ├── ChatMessage.js      # Chat message component
│   │   ├── ChatSidebar.js      # Chat sidebar navigation
│   │   ├── Layout.js           # Application layout
│   │   ├── LoadingSpinner.js   # Loading indicator
│   │   └── ProtectedRoute.js   # Route protection
│   ├── contexts/
│   │   └── AuthContext.js      # Authentication context
│   ├── pages/
│   │   ├── index.js            # Landing page
│   │   ├── login.js            # Login page
│   │   ├── register.js         # Registration page
│   │   ├── dashboard.js        # User dashboard
│   │   ├── upload.js           # Document upload
│   │   ├── chat.js             # Chat interface
│   │   └── chat/[shareToken].js # Public chat view
│   ├── styles/
│   │   └── globals.css         # Global styles
│   ├── package.json           # Node dependencies
│   └── tailwind.config.js     # Tailwind configuration
└── README.md                  # This file
```

## Development

### Backend Development
- The backend uses FastAPI with automatic API documentation
- Visit `http://localhost:8000/docs` for interactive API docs (Swagger UI)
- Visit `http://localhost:8000/redoc` for alternative API documentation
- Database is automatically created on first run
- Uses SQLite for development (can be configured for PostgreSQL in production)
- Vector database type can be switched via environment variables

### Frontend Development
- Built with Next.js 15 for optimal performance
- Uses Tailwind CSS for styling
- Responsive design works on all devices
- Markdown rendering for AI responses
- Real-time streaming chat interface

### Vector Database Configuration
The application supports multiple vector databases. By default, it uses ChromaDB (local storage). You can configure external databases like Pinecone, Weaviate, or Qdrant. See [backend/VECTOR_DB_SETUP.md](backend/VECTOR_DB_SETUP.md) for detailed setup instructions.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Environment Variables

### Backend (.env)
- `SECRET_KEY` - Secret key for JWT token signing (required)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Token expiration time (default: 1440)
- `VECTOR_DB_TYPE` - Vector database type: `chroma`, `pinecone`, `weaviate`, or `qdrant` (default: `chroma`)
- `VECTOR_DB_PERSIST_DIR` - Local storage path for ChromaDB (default: `./data/chroma`)
- `VECTOR_DIMENSION` - Embedding dimension (default: `384`)
- `VECTOR_DISTANCE_METRIC` - Distance metric: `cosine`, `euclidean`, or `dot` (default: `cosine`)
- `LLM_ENDPOINT` - LLM API endpoint URL (optional)
- `PINECONE_API_KEY` - Pinecone API key (required if using Pinecone)
- `WEAVIATE_URL` - Weaviate instance URL (required if using Weaviate)
- `QDRANT_URL` - Qdrant instance URL (required if using Qdrant)

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: `http://localhost:8000`)

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue on GitHub.

## Additional Resources

- [Vector Database Setup Guide](backend/VECTOR_DB_SETUP.md) - Detailed guide for configuring vector databases
- [FastAPI Documentation](https://fastapi.tiangolo.com/) - Backend framework documentation
- [Next.js Documentation](https://nextjs.org/docs) - Frontend framework documentation
