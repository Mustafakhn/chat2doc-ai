# document_analysis.py
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db import get_session
from app.models import User, Document
from app.routes_upload import UPLOAD_ROOT
from app.utils_vector import extract_text_from_file
from app.auth import get_user_from_auth
from langchain.text_splitter import RecursiveCharacterTextSplitter
import os
import re

router = APIRouter()

@router.post("/analyze-document")
async def analyze_document(
    doc_filename: str,
    user: User = Depends(get_user_from_auth),
    session: Session = Depends(get_session)
):
    """
    Analyze a document to get comprehensive information about its structure and content.
    This is especially useful for large documents with many stories or sections.
    """
    try:
        # Find the document
        doc = session.exec(select(Document).where(
            Document.filename == doc_filename,
            Document.user_id == user.id
        )).first()
        
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Read the document content
        file_path = os.path.join(UPLOAD_ROOT, doc.filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Document file not found")
        
        # Extract text from the document
        text = extract_text_from_file(file_path)
        
        if not text:
            raise HTTPException(status_code=400, detail="Could not extract text from document")
        
        # Analyze the document structure
        analysis = analyze_document_structure(text)
        
        return {
            "document_name": doc.filename,
            "total_characters": len(text),
            "total_words": len(text.split()),
            "analysis": analysis
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def analyze_document_structure(text: str) -> dict:
    """
    Analyze document structure to identify stories, sections, etc.
    """
    # Split text into potential stories/sections
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n\n", "\n\n", "Story ", "Chapter ", "\n", ". ", "! ", "? "]
    )
    chunks = splitter.split_text(text)
    
    # Look for story patterns
    story_indicators = []
    story_count = 0
    
    for i, chunk in enumerate(chunks):
        # Look for common story patterns
        lines = chunk.split('\n')
        for line in lines:
            line = line.strip()
            if line and len(line) < 100:  # Likely a title/heading
                # Check if it looks like a story title
                if any(indicator in line.lower() for indicator in [
                    'story', 'tale', 'chapter', 'part', 'section'
                ]) or (len(line.split()) <= 5 and line.isupper()):
                    story_indicators.append({
                        'title': line,
                        'chunk_index': i,
                        'position': text.find(line)
                    })
                    story_count += 1
    
    # Also try to count by looking for numbered items
    numbered_items = []
    number_patterns = [
        r'^\d+\.\s+',  # 1. Title
        r'^Story\s+\d+',  # Story 1
        r'^Chapter\s+\d+',  # Chapter 1
        r'^\d+\)\s+',  # 1) Title
    ]
    
    for pattern in number_patterns:
        matches = re.findall(pattern, text, re.MULTILINE)
        numbered_items.extend(matches)
    
    # Look for common story title patterns
    story_title_patterns = [
        r'^[A-Z][a-z]+ [A-Z][a-z]+',  # Title Case titles
        r'^[A-Z][a-z]+$',  # Single word titles
        r'^[A-Z][a-z]+ [a-z]+ [A-Z][a-z]+',  # Three word titles
    ]
    
    potential_titles = []
    for pattern in story_title_patterns:
        matches = re.findall(pattern, text, re.MULTILINE)
        potential_titles.extend(matches)
    
    return {
        "total_chunks": len(chunks),
        "story_indicators": story_indicators[:20],  # First 20 indicators
        "story_count_by_indicators": story_count,
        "numbered_items_count": len(numbered_items),
        "potential_titles_count": len(potential_titles),
        "estimated_stories": max(story_count, len(numbered_items), len(potential_titles)),
        "chunk_size_avg": sum(len(chunk) for chunk in chunks) // len(chunks) if chunks else 0,
        "sample_titles": potential_titles[:10]  # First 10 potential titles
    }
