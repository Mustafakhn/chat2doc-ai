from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from .auth import get_user_from_auth
from .utils_pdf import extract_text_from_file
from .utils_vector import create_embeddings_and_store
from .db import get_session
from sqlmodel import Session, select
from .models import Document
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
import os
import time

router = APIRouter()
# Use the same data directory as the database
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
UPLOAD_ROOT = os.path.join(DATA_DIR, 'uploads')
os.makedirs(UPLOAD_ROOT, exist_ok=True)

class DocumentSharingUpdate(BaseModel):
    is_public: bool
    expires_in_hours: Optional[int] = None  # None means no expiry

class DocumentSharingResponse(BaseModel):
    id: int
    filename: str
    is_public: bool
    share_token: Optional[str]
    expires_at: Optional[datetime]
    share_url: Optional[str]

@router.post('/')
async def upload_file(file: UploadFile = File(...), user=Depends(get_user_from_auth), session: Session = Depends(get_session)):
    filename = file.filename
    save_path = os.path.join(UPLOAD_ROOT, filename)
    if os.path.exists(save_path):
        base, ext = os.path.splitext(filename)
        filename = f"{base}_{int(time.time())}{ext}"
        save_path = os.path.join(UPLOAD_ROOT, filename)
    with open(save_path, 'wb') as f:
        content = await file.read()
        f.write(content)
    text = extract_text_from_file(save_path)
    if not text.strip():
        raise HTTPException(status_code=400, detail='No extractable text found in file')
    
    # Create document record first to get the ID
    doc = Document(user_id=user.id, filename=filename, filepath=save_path)
    session.add(doc)
    session.commit()
    session.refresh(doc)
    
    # Now create embeddings with the document ID
    namespace = f"user_{user.id}_doc_{filename.replace(' ', '_')}"
    count_chunks = create_embeddings_and_store(namespace, save_path, doc.id, user.id)
    
    return {"status": "ok", "doc_id": doc.id, "filename": filename, "chunks": count_chunks, "namespace": namespace}

@router.get("/documents")
def get_user_documents(
    user_id: int = Query(..., description="User ID to fetch uploaded docs for"),
    session: Session = Depends(get_session)
):
    docs = session.exec(select(Document).where(Document.user_id == user_id)).all()
    return [
        {
            "id": doc.id,
            "filename": doc.filename,
            "share_token": doc.share_token,
            "is_public": doc.is_public,
            "created_at": doc.created_at,
        }
        for doc in docs
    ]

@router.get("/documents/{share_token}")
def get_document_by_share_token(
    share_token: str,
    session: Session = Depends(get_session)
):
    doc = session.exec(select(Document).where(Document.share_token == share_token)).first()
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
    
    return {
        "id": doc.id,
        "filename": doc.filename,
        "share_token": doc.share_token,
        "is_public": doc.is_public,
        "expires_at": doc.expires_at,
        "created_at": doc.created_at,
    }

@router.patch("/documents/{doc_id}/toggle-public")
def toggle_document_public(
    doc_id: int,
    user=Depends(get_user_from_auth),
    session: Session = Depends(get_session)
):
    doc = session.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    doc.is_public = not doc.is_public
    session.add(doc)
    session.commit()
    session.refresh(doc)
    
    return {
        "id": doc.id,
        "filename": doc.filename,
        "share_token": doc.share_token,
        "is_public": doc.is_public,
    }

@router.put('/{doc_id}/sharing')
async def update_document_sharing(
    doc_id: int,
    sharing_data: DocumentSharingUpdate,
    user=Depends(get_user_from_auth),
    session: Session = Depends(get_session)
):
    """Update document sharing settings including expiry"""
    doc = session.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update sharing settings
    doc.is_public = sharing_data.is_public
    
    # Handle expiry
    if sharing_data.expires_in_hours and sharing_data.expires_in_hours > 0:
        doc.expires_at = datetime.utcnow() + timedelta(hours=sharing_data.expires_in_hours)
    else:
        doc.expires_at = None
    
    session.add(doc)
    session.commit()
    session.refresh(doc)
    
    # Generate share URL if public
    share_url = None
    if doc.is_public and doc.share_token:
        share_url = f"/chat/{doc.share_token}"
    
    return DocumentSharingResponse(
        id=doc.id,
        filename=doc.filename,
        is_public=doc.is_public,
        share_token=doc.share_token,
        expires_at=doc.expires_at,
        share_url=share_url
    )

@router.get('/{doc_id}/sharing')
async def get_document_sharing(
    doc_id: int,
    user=Depends(get_user_from_auth),
    session: Session = Depends(get_session)
):
    """Get document sharing settings"""
    doc = session.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if expired
    is_expired = doc.expires_at and datetime.utcnow() > doc.expires_at
    if is_expired:
        doc.is_public = False
        session.add(doc)
        session.commit()
        session.refresh(doc)
    
    # Generate share URL if public and not expired
    share_url = None
    if doc.is_public and doc.share_token and not is_expired:
        share_url = f"/chat/{doc.share_token}"
    
    return DocumentSharingResponse(
        id=doc.id,
        filename=doc.filename,
        is_public=doc.is_public,
        share_token=doc.share_token,
        expires_at=doc.expires_at,
        share_url=share_url
    )