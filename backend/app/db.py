from sqlmodel import SQLModel, create_engine, Session
from .models import User, Document, ChatSession, ChatMessage
from dotenv import load_dotenv
import os
import sqlite3
import shutil
from datetime import datetime

load_dotenv()

# Ensure data directory exists
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
os.makedirs(DATA_DIR, exist_ok=True)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR}/chat2doc.db")
DB_TYPE = os.getenv("DB_TYPE", "sqlite")  # sqlite or mysql

# Create engine based on database type
if DB_TYPE == "mysql":
    # MySQL configuration
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
        pool_recycle=300
    )
else:
    # SQLite configuration (default)
    engine = create_engine(
        DATABASE_URL, 
        echo=False,
        connect_args={
            "check_same_thread": False,
            "timeout": 30,
            "isolation_level": None
        }
    )

def create_db_and_tables():
    """Create database tables and handle migrations"""
    # Create all tables
    SQLModel.metadata.create_all(engine)
    
    # Handle migrations for existing databases
    migrate_database()

def migrate_database():
    """Handle database migrations for schema changes"""
    with Session(engine) as session:
        # Check if document table exists and has the required columns
        try:
            # Try to query the document table to see if it exists
            session.exec("SELECT 1 FROM document LIMIT 1")
            
            # Check if share_token column exists
            try:
                session.exec("SELECT share_token FROM document LIMIT 1")
            except Exception:
                # Add missing columns
                print("Adding missing columns to document table...")
                if DB_TYPE == "mysql":
                    # MySQL syntax
                    session.exec("ALTER TABLE document ADD COLUMN share_token VARCHAR(255)")
                    session.exec("ALTER TABLE document ADD COLUMN is_public BOOLEAN DEFAULT FALSE")
                    session.exec("ALTER TABLE document ADD COLUMN expires_at DATETIME")
                else:
                    # SQLite syntax
                    session.exec("ALTER TABLE document ADD COLUMN share_token TEXT")
                    session.exec("ALTER TABLE document ADD COLUMN is_public BOOLEAN")
                    session.exec("ALTER TABLE document ADD COLUMN expires_at DATETIME")
                    # Update existing rows to set default values
                    session.exec("UPDATE document SET is_public = 0 WHERE is_public IS NULL")
                session.commit()
                print("Document table migration completed!")
                
        except Exception:
            # Table doesn't exist, will be created by create_all
            pass
        
        # Check if chat tables exist and create them if missing
        try:
            session.exec("SELECT 1 FROM chatsession LIMIT 1")
            print("Chat tables already exist")
        except Exception:
            print("Creating missing chat tables...")
            # Create only the missing chat tables
            try:
                if DB_TYPE == "mysql":
                    # MySQL syntax
                    session.exec("""
                        CREATE TABLE IF NOT EXISTS chatsession (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            user_id INT NOT NULL,
                            document_id INT NOT NULL,
                            session_name VARCHAR(255),
                            created_at DATETIME NOT NULL,
                            updated_at DATETIME NOT NULL,
                            INDEX idx_chatsession_user_id (user_id),
                            INDEX idx_chatsession_document_id (document_id)
                        )
                    """)
                    
                    session.exec("""
                        CREATE TABLE IF NOT EXISTS chatmessage (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            session_id INT NOT NULL,
                            role VARCHAR(50) NOT NULL,
                            content TEXT NOT NULL,
                            thinking TEXT,
                            created_at DATETIME NOT NULL,
                            INDEX idx_chatmessage_session_id (session_id),
                            INDEX idx_chatmessage_role (role)
                        )
                    """)
                else:
                    # SQLite syntax
                    session.exec("""
                        CREATE TABLE IF NOT EXISTS chatsession (
                            id INTEGER PRIMARY KEY,
                            user_id INTEGER NOT NULL,
                            document_id INTEGER NOT NULL,
                            session_name TEXT,
                            created_at DATETIME NOT NULL,
                            updated_at DATETIME NOT NULL
                        )
                    """)
                    session.exec("CREATE INDEX IF NOT EXISTS idx_chatsession_user_id ON chatsession(user_id)")
                    session.exec("CREATE INDEX IF NOT EXISTS idx_chatsession_document_id ON chatsession(document_id)")
                    
                    session.exec("""
                        CREATE TABLE IF NOT EXISTS chatmessage (
                            id INTEGER PRIMARY KEY,
                            session_id INTEGER NOT NULL,
                            role TEXT NOT NULL,
                            content TEXT NOT NULL,
                            thinking TEXT,
                            created_at DATETIME NOT NULL
                        )
                    """)
                    session.exec("CREATE INDEX IF NOT EXISTS idx_chatmessage_session_id ON chatmessage(session_id)")
                    session.exec("CREATE INDEX IF NOT EXISTS idx_chatmessage_role ON chatmessage(role)")
                
                session.commit()
                print("Chat tables created successfully!")
            except Exception as e:
                print(f"Error creating chat tables: {e}")
                # Fallback: use SQLModel to create missing tables
                try:
                    from .models import ChatSession, ChatMessage
                    ChatSession.__table__.create(engine, checkfirst=True)
                    ChatMessage.__table__.create(engine, checkfirst=True)
                    print("Chat tables created using SQLModel fallback!")
                except Exception as e2:
                    print(f"Fallback also failed: {e2}")

def get_session():
    """Get database session with error handling and recovery"""
    try:
        with Session(engine) as session:
            yield session
    except sqlite3.OperationalError as e:
        if "disk I/O error" in str(e) or "database is locked" in str(e):
            print(f"Database error detected: {e}")
            print("Attempting database recovery...")
            recover_database()
            # Try again after recovery
            with Session(engine) as session:
                yield session
        else:
            raise e

def recover_database():
    """Recover from database corruption or I/O errors"""
    try:
        db_path = DATABASE_URL.replace("sqlite:///", "")
        
        # Check if database file exists and is accessible
        if os.path.exists(db_path):
            # Try to backup the corrupted database
            backup_path = f"{db_path}.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            try:
                shutil.copy2(db_path, backup_path)
                print(f"Database backed up to: {backup_path}")
            except Exception as e:
                print(f"Could not backup database: {e}")
            
            # Try to repair the database
            try:
                conn = sqlite3.connect(db_path)
                conn.execute("PRAGMA integrity_check")
                conn.close()
                print("Database integrity check passed")
            except Exception as e:
                print(f"Database integrity check failed: {e}")
                # If integrity check fails, recreate the database
                print("Recreating database...")
                os.remove(db_path)
        
        # Recreate the database and tables
        create_db_and_tables()
        print("Database recovery completed!")
        
    except Exception as e:
        print(f"Database recovery failed: {e}")
        # Last resort: create a fresh database
        try:
            if os.path.exists(db_path):
                os.remove(db_path)
            create_db_and_tables()
            print("Fresh database created!")
        except Exception as e2:
            print(f"Failed to create fresh database: {e2}")
            raise e2
