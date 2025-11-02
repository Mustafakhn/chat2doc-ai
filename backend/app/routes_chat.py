from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from .auth import get_user_from_auth
from .utils_vector import stream_answer_from_doc
from .db import get_session
from .models import Document, ChatSession, ChatMessage
from sqlmodel import Session, select
from fastapi.responses import StreamingResponse
from typing import Optional
from datetime import datetime

router = APIRouter()

class ChatIn(BaseModel):
    doc_filename: str
    question: str
    session_id: Optional[int] = None

class PublicChatIn(BaseModel):
    share_token: str
    question: str
    session_id: Optional[int] = None

@router.post('/stream')
async def chat_stream(data: ChatIn, user=Depends(get_user_from_auth), session: Session = Depends(get_session)):
    namespace = f"user_{user.id}_doc_{data.doc_filename.replace(' ', '_')}"
    
    # Find the document to get full context
    doc = session.exec(select(Document).where(
        Document.filename == data.doc_filename,
        Document.user_id == user.id
    )).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get conversation history if session_id is provided (limit to last 5 messages for performance)
    conversation_history = []
    if data.session_id:
        messages = session.exec(
            select(ChatMessage)
            .where(ChatMessage.session_id == data.session_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(5)
        ).all()
        # Reverse to get chronological order
        conversation_history = [
            {"role": msg.role, "content": msg.content} 
            for msg in reversed(messages)
        ]
    
    # Get document file path for full context
    from .routes_upload import UPLOAD_ROOT
    import os
    file_path = os.path.join(UPLOAD_ROOT, doc.filename)
    
    async def generate():
        async for chunk in stream_answer_from_doc(
            namespace, 
            data.question, 
            conversation_history,
            document_id=doc.id,
            user_id=user.id,
            file_path=file_path
        ):
            yield chunk
    
    return StreamingResponse(generate(), media_type='text/plain')

@router.post('/public/stream')
async def public_chat_stream(data: PublicChatIn, session: Session = Depends(get_session)):
    # Find document by share token
    doc = session.exec(select(Document).where(Document.share_token == data.share_token)).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check if document is public
    if not doc.is_public:
        raise HTTPException(status_code=403, detail="Document access has been disabled by the owner")
    
    # Check if document has expired
    if doc.expires_at and datetime.utcnow() > doc.expires_at:
        # Auto-disable expired documents
        doc.is_public = False
        session.add(doc)
        session.commit()
        raise HTTPException(status_code=410, detail="Document access has expired")
    
    namespace = f"user_{doc.user_id}_doc_{doc.filename.replace(' ', '_')}"
    
    # Get conversation history if session_id is provided (limit to last 5 messages for performance)
    conversation_history = []
    if data.session_id:
        messages = session.exec(
            select(ChatMessage)
            .where(ChatMessage.session_id == data.session_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(5)
        ).all()
        # Reverse to get chronological order
        conversation_history = [
            {"role": msg.role, "content": msg.content} 
            for msg in reversed(messages)
        ]
    
    # Get document file path for full context
    from .routes_upload import UPLOAD_ROOT
    import os
    file_path = os.path.join(UPLOAD_ROOT, doc.filename)
    
    async def generate():
        async for chunk in stream_answer_from_doc(
            namespace, 
            data.question, 
            conversation_history,
            document_id=doc.id,
            user_id=doc.user_id,
            file_path=file_path
        ):
            yield chunk
    
    return StreamingResponse(generate(), media_type='text/plain')
