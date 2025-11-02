# cache_management.py
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db import get_session
from app.models import User, Document
from app.document_cache import document_cache
from app.auth import get_user_from_auth

router = APIRouter()

@router.get("/cache/stats")
async def get_cache_stats(user: User = Depends(get_user_from_auth)):
    """Get cache statistics"""
    stats = document_cache.get_cache_stats()
    return {
        "cache_size": stats['size'],
        "max_size": stats['max_size'],
        "cached_documents": len(stats['keys']),
        "status": "healthy"
    }

@router.post("/cache/clear")
async def clear_cache(user: User = Depends(get_user_from_auth)):
    """Clear all cached documents for the current user"""
    try:
        # Get all user documents
        with Session(get_session().__next__()) as session:
            user_docs = session.exec(select(Document).where(Document.user_id == user.id)).all()
            
            # Clear cache for each document
            for doc in user_docs:
                document_cache.invalidate_document(doc.id, user.id)
        
        return {"message": "Cache cleared successfully", "cleared_documents": len(user_docs)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cache/clear/{document_id}")
async def clear_document_cache(document_id: int, user: User = Depends(get_user_from_auth)):
    """Clear cache for a specific document"""
    try:
        # Verify document belongs to user
        with Session(get_session().__next__()) as session:
            doc = session.exec(select(Document).where(
                Document.id == document_id,
                Document.user_id == user.id
            )).first()
            
            if not doc:
                raise HTTPException(status_code=404, detail="Document not found")
        
        # Clear cache for this document
        document_cache.invalidate_document(document_id, user.id)
        
        return {"message": f"Cache cleared for document {document_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cache/documents")
async def get_cached_documents(user: User = Depends(get_user_from_auth)):
    """Get list of currently cached documents"""
    try:
        stats = document_cache.get_cache_stats()
        cached_docs = []
        
        for key in stats['keys']:
            if key.startswith(f"doc_{user.id}_"):
                doc_id = int(key.split('_')[2])
                cached_docs.append({
                    "document_id": doc_id,
                    "cache_key": key
                })
        
        return {
            "cached_documents": cached_docs,
            "total_cached": len(cached_docs)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
