# document_cache.py
import os
import hashlib
import json
from typing import Dict, Optional, List
from datetime import datetime, timedelta
import threading

class DocumentContextCache:
    """
    In-memory cache for document contexts to avoid repeated processing
    """
    
    def __init__(self, max_size: int = 50, ttl_hours: int = 24):
        self.cache: Dict[str, dict] = {}
        self.max_size = max_size
        self.ttl_hours = ttl_hours
        self.lock = threading.RLock()
    
    def _get_cache_key(self, document_id: int, user_id: int) -> str:
        """Generate a unique cache key for the document"""
        return f"doc_{user_id}_{document_id}"
    
    def _is_expired(self, cache_entry: dict) -> bool:
        """Check if cache entry is expired"""
        created_at = datetime.fromisoformat(cache_entry['created_at'])
        return datetime.now() - created_at > timedelta(hours=self.ttl_hours)
    
    def _cleanup_expired(self):
        """Remove expired entries from cache"""
        expired_keys = []
        for key, entry in self.cache.items():
            if self._is_expired(entry):
                expired_keys.append(key)
        
        for key in expired_keys:
            del self.cache[key]
    
    def _evict_oldest(self):
        """Remove oldest entry when cache is full"""
        if len(self.cache) >= self.max_size:
            oldest_key = min(self.cache.keys(), 
                           key=lambda k: self.cache[k]['created_at'])
            del self.cache[oldest_key]
    
    def get_document_context(self, document_id: int, user_id: int) -> Optional[dict]:
        """Get cached document context"""
        with self.lock:
            key = self._get_cache_key(document_id, user_id)
            
            if key in self.cache:
                entry = self.cache[key]
                if not self._is_expired(entry):
                    # Update access time
                    entry['last_accessed'] = datetime.now().isoformat()
                    return entry
                else:
                    # Remove expired entry
                    del self.cache[key]
            
            return None
    
    def set_document_context(self, document_id: int, user_id: int, 
                           full_text: str, chunks: List[str], 
                           metadata: dict = None) -> dict:
        """Cache document context"""
        with self.lock:
            self._cleanup_expired()
            self._evict_oldest()
            
            key = self._get_cache_key(document_id, user_id)
            now = datetime.now().isoformat()
            
            context = {
                'full_text': full_text,
                'chunks': chunks,
                'metadata': metadata or {},
                'document_id': document_id,
                'user_id': user_id,
                'created_at': now,
                'last_accessed': now,
                'text_hash': hashlib.md5(full_text.encode()).hexdigest()
            }
            
            self.cache[key] = context
            return context
    
    def invalidate_document(self, document_id: int, user_id: int):
        """Remove document from cache"""
        with self.lock:
            key = self._get_cache_key(document_id, user_id)
            if key in self.cache:
                del self.cache[key]
    
    def get_cache_stats(self) -> dict:
        """Get cache statistics"""
        with self.lock:
            return {
                'size': len(self.cache),
                'max_size': self.max_size,
                'keys': list(self.cache.keys())
            }

# Global cache instance
document_cache = DocumentContextCache()
