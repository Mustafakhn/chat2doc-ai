from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from pydantic import BaseModel
from .db import get_session
from .models import ChatSession, ChatMessage, Document
from .auth import get_user_from_auth
from typing import List, Optional
from datetime import datetime

router = APIRouter()

class ChatSessionCreate(BaseModel):
    document_id: int
    session_name: Optional[str] = None

class ChatMessageCreate(BaseModel):
    session_id: int
    role: str
    content: str
    thinking: Optional[str] = None

class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    thinking: Optional[str]
    created_at: datetime

class ChatSessionResponse(BaseModel):
    id: int
    document_id: int
    session_name: Optional[str]
    created_at: datetime
    updated_at: datetime
    message_count: int

@router.post("/sessions", response_model=ChatSessionResponse)
def create_chat_session(
    session_data: ChatSessionCreate,
    user=Depends(get_user_from_auth),
    session: Session = Depends(get_session)
):
    # Verify document belongs to user
    doc = session.get(Document, session_data.document_id)
    if not doc or doc.user_id != user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Create new chat session
    chat_session = ChatSession(
        user_id=user.id,
        document_id=session_data.document_id,
        session_name=session_data.session_name or f"Chat with {doc.filename}"
    )
    session.add(chat_session)
    session.commit()
    session.refresh(chat_session)
    
    return ChatSessionResponse(
        id=chat_session.id,
        document_id=chat_session.document_id,
        session_name=chat_session.session_name,
        created_at=chat_session.created_at,
        updated_at=chat_session.updated_at,
        message_count=0
    )

@router.get("/sessions", response_model=List[ChatSessionResponse])
def get_user_chat_sessions(
    user=Depends(get_user_from_auth),
    session: Session = Depends(get_session)
):
    sessions = session.exec(
        select(ChatSession)
        .where(ChatSession.user_id == user.id)
        .order_by(ChatSession.updated_at.desc())
    ).all()
    
    result = []
    for chat_session in sessions:
        # Count messages for this session
        messages = session.exec(
            select(ChatMessage).where(ChatMessage.session_id == chat_session.id)
        ).all()
        message_count = len(messages)
        
        result.append(ChatSessionResponse(
            id=chat_session.id,
            document_id=chat_session.document_id,
            session_name=chat_session.session_name,
            created_at=chat_session.created_at,
            updated_at=chat_session.updated_at,
            message_count=message_count
        ))
    
    return result

@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
def get_chat_messages(
    session_id: int,
    user=Depends(get_user_from_auth),
    session: Session = Depends(get_session)
):
    # Verify session belongs to user
    chat_session = session.get(ChatSession, session_id)
    if not chat_session or chat_session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    messages = session.exec(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    ).all()
    
    return [
        ChatMessageResponse(
            id=msg.id,
            role=msg.role,
            content=msg.content,
            thinking=msg.thinking,
            created_at=msg.created_at
        )
        for msg in messages
    ]

@router.post("/messages", response_model=ChatMessageResponse)
def create_chat_message(
    message_data: ChatMessageCreate,
    user=Depends(get_user_from_auth),
    session: Session = Depends(get_session)
):
    # Verify session belongs to user
    chat_session = session.get(ChatSession, message_data.session_id)
    if not chat_session or chat_session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    # Create new message
    message = ChatMessage(
        session_id=message_data.session_id,
        role=message_data.role,
        content=message_data.content,
        thinking=message_data.thinking
    )
    session.add(message)
    
    # Update session timestamp
    chat_session.updated_at = datetime.utcnow()
    session.add(chat_session)
    
    try:
        session.commit()
        session.refresh(message)
    except Exception as e:
        session.rollback()
        print(f"Database commit error: {e}")
        # Try to recover and retry once
        try:
            session.commit()
            session.refresh(message)
        except Exception as e2:
            print(f"Retry also failed: {e2}")
            raise HTTPException(status_code=500, detail="Database error occurred")
    
    return ChatMessageResponse(
        id=message.id,
        role=message.role,
        content=message.content,
        thinking=message.thinking,
        created_at=message.created_at
    )

@router.delete("/sessions/{session_id}")
def delete_chat_session(
    session_id: int,
    user=Depends(get_user_from_auth),
    session: Session = Depends(get_session)
):
    # Verify session belongs to user
    chat_session = session.get(ChatSession, session_id)
    if not chat_session or chat_session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    # Delete all messages in the session
    messages = session.exec(
        select(ChatMessage).where(ChatMessage.session_id == session_id)
    ).all()
    
    for message in messages:
        session.delete(message)
    
    # Delete the session
    session.delete(chat_session)
    session.commit()
    
    return {"message": "Chat session deleted successfully"}
