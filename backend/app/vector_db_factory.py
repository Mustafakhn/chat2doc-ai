"""
Vector Database Factory
Supports multiple vector database backends: Chroma, Pinecone, Weaviate, Qdrant
"""

import os
from typing import Optional, List, Dict, Any
from abc import ABC, abstractmethod
from dotenv import load_dotenv

load_dotenv()

class VectorDBInterface(ABC):
    """Abstract interface for vector databases"""
    
    @abstractmethod
    def create_collection(self, collection_name: str, dimension: int, distance_metric: str = "cosine") -> bool:
        """Create a new collection/index"""
        pass
    
    @abstractmethod
    def add_documents(self, collection_name: str, documents: List[str], metadatas: List[Dict], ids: List[str]) -> bool:
        """Add documents to the collection"""
        pass
    
    @abstractmethod
    def search(self, collection_name: str, query_vector: List[float], k: int = 5, filter: Optional[Dict] = None) -> List[Dict]:
        """Search for similar documents"""
        pass
    
    @abstractmethod
    def delete_collection(self, collection_name: str) -> bool:
        """Delete a collection"""
        pass
    
    @abstractmethod
    def get_collection_info(self, collection_name: str) -> Dict:
        """Get collection information"""
        pass

class ChromaVectorDB(VectorDBInterface):
    """ChromaDB implementation"""
    
    def __init__(self, persist_directory: str = "./data/chroma"):
        try:
            import chromadb
            from chromadb.config import Settings
            
            self.client = chromadb.PersistentClient(
                path=persist_directory,
                settings=Settings(anonymized_telemetry=False)
            )
        except ImportError:
            raise ImportError("ChromaDB not installed. Run: pip install chromadb")
    
    def create_collection(self, collection_name: str, dimension: int, distance_metric: str = "cosine") -> bool:
        try:
            # ChromaDB automatically creates collections when first used
            collection = self.client.get_or_create_collection(
                name=collection_name,
                metadata={"hnsw:space": distance_metric}
            )
            return True
        except Exception as e:
            print(f"Error creating ChromaDB collection: {e}")
            return False
    
    def add_documents(self, collection_name: str, documents: List[str], metadatas: List[Dict], ids: List[str]) -> bool:
        try:
            collection = self.client.get_collection(collection_name)
            collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            return True
        except Exception as e:
            print(f"Error adding documents to ChromaDB: {e}")
            return False
    
    def search(self, collection_name: str, query_vector: List[float], k: int = 5, filter: Optional[Dict] = None) -> List[Dict]:
        try:
            collection = self.client.get_collection(collection_name)
            results = collection.query(
                query_embeddings=[query_vector],
                n_results=k,
                where=filter
            )
            
            # Convert to standard format
            documents = results['documents'][0] if results['documents'] else []
            metadatas = results['metadatas'][0] if results['metadatas'] else []
            distances = results['distances'][0] if results['distances'] else []
            
            return [
                {
                    'document': doc,
                    'metadata': meta,
                    'distance': dist
                }
                for doc, meta, dist in zip(documents, metadatas, distances)
            ]
        except Exception as e:
            print(f"Error searching ChromaDB: {e}")
            return []
    
    def delete_collection(self, collection_name: str) -> bool:
        try:
            self.client.delete_collection(collection_name)
            return True
        except Exception as e:
            print(f"Error deleting ChromaDB collection: {e}")
            return False
    
    def get_collection_info(self, collection_name: str) -> Dict:
        try:
            collection = self.client.get_collection(collection_name)
            return {
                'name': collection_name,
                'count': collection.count(),
                'metadata': collection.metadata
            }
        except Exception as e:
            print(f"Error getting ChromaDB collection info: {e}")
            return {}

class PineconeVectorDB(VectorDBInterface):
    """Pinecone implementation"""
    
    def __init__(self, api_key: str, environment: str):
        try:
            import pinecone
            
            pinecone.init(api_key=api_key, environment=environment)
            self.index = None
        except ImportError:
            raise ImportError("Pinecone not installed. Run: pip install pinecone-client")
    
    def create_collection(self, collection_name: str, dimension: int, distance_metric: str = "cosine") -> bool:
        try:
            import pinecone
            
            if collection_name not in pinecone.list_indexes():
                pinecone.create_index(
                    name=collection_name,
                    dimension=dimension,
                    metric=distance_metric
                )
            
            self.index = pinecone.Index(collection_name)
            return True
        except Exception as e:
            print(f"Error creating Pinecone index: {e}")
            return False
    
    def add_documents(self, collection_name: str, documents: List[str], metadatas: List[Dict], ids: List[str]) -> bool:
        try:
            if not self.index:
                self.index = pinecone.Index(collection_name)
            
            # Convert documents to vectors (you'll need to implement embedding)
            vectors = [(ids[i], [0.0] * 384, metadatas[i]) for i in range(len(ids))]  # Placeholder
            
            self.index.upsert(vectors=vectors)
            return True
        except Exception as e:
            print(f"Error adding documents to Pinecone: {e}")
            return False
    
    def search(self, collection_name: str, query_vector: List[float], k: int = 5, filter: Optional[Dict] = None) -> List[Dict]:
        try:
            if not self.index:
                self.index = pinecone.Index(collection_name)
            
            results = self.index.query(
                vector=query_vector,
                top_k=k,
                include_metadata=True,
                filter=filter
            )
            
            return [
                {
                    'document': match.metadata.get('text', ''),
                    'metadata': match.metadata,
                    'distance': match.score
                }
                for match in results.matches
            ]
        except Exception as e:
            print(f"Error searching Pinecone: {e}")
            return []
    
    def delete_collection(self, collection_name: str) -> bool:
        try:
            import pinecone
            pinecone.delete_index(collection_name)
            return True
        except Exception as e:
            print(f"Error deleting Pinecone index: {e}")
            return False
    
    def get_collection_info(self, collection_name: str) -> Dict:
        try:
            import pinecone
            stats = pinecone.describe_index(collection_name)
            return {
                'name': collection_name,
                'dimension': stats.dimension,
                'metric': stats.metric,
                'host': stats.host
            }
        except Exception as e:
            print(f"Error getting Pinecone index info: {e}")
            return {}

class WeaviateVectorDB(VectorDBInterface):
    """Weaviate implementation"""
    
    def __init__(self, url: str, api_key: Optional[str] = None):
        try:
            import weaviate
            
            auth_config = weaviate.AuthApiKey(api_key) if api_key else None
            self.client = weaviate.Client(url=url, auth_client_secret=auth_config)
        except ImportError:
            raise ImportError("Weaviate not installed. Run: pip install weaviate-client")
    
    def create_collection(self, collection_name: str, dimension: int, distance_metric: str = "cosine") -> bool:
        try:
            # Define schema
            schema = {
                "class": collection_name,
                "description": f"Document collection for {collection_name}",
                "vectorizer": "none",  # We'll provide our own vectors
                "properties": [
                    {
                        "name": "text",
                        "dataType": ["text"],
                        "description": "Document text content"
                    },
                    {
                        "name": "metadata",
                        "dataType": ["object"],
                        "description": "Document metadata"
                    }
                ]
            }
            
            self.client.schema.create_class(schema)
            return True
        except Exception as e:
            print(f"Error creating Weaviate class: {e}")
            return False
    
    def add_documents(self, collection_name: str, documents: List[str], metadatas: List[Dict], ids: List[str]) -> bool:
        try:
            with self.client.batch as batch:
                for i, (doc, meta, doc_id) in enumerate(zip(documents, metadatas, ids)):
                    batch.add_data_object(
                        data_object={
                            "text": doc,
                            "metadata": meta
                        },
                        class_name=collection_name,
                        uuid=doc_id
                    )
            return True
        except Exception as e:
            print(f"Error adding documents to Weaviate: {e}")
            return False
    
    def search(self, collection_name: str, query_vector: List[float], k: int = 5, filter: Optional[Dict] = None) -> List[Dict]:
        try:
            result = self.client.query.get(
                collection_name, ["text", "metadata"]
            ).with_near_vector({
                "vector": query_vector
            }).with_limit(k).do()
            
            documents = []
            for item in result['data']['Get'][collection_name]:
                documents.append({
                    'document': item['text'],
                    'metadata': item['metadata'],
                    'distance': 0.0  # Weaviate doesn't return distances by default
                })
            
            return documents
        except Exception as e:
            print(f"Error searching Weaviate: {e}")
            return []
    
    def delete_collection(self, collection_name: str) -> bool:
        try:
            self.client.schema.delete_class(collection_name)
            return True
        except Exception as e:
            print(f"Error deleting Weaviate class: {e}")
            return False
    
    def get_collection_info(self, collection_name: str) -> Dict:
        try:
            schema = self.client.schema.get()
            for class_info in schema['classes']:
                if class_info['class'] == collection_name:
                    return class_info
            return {}
        except Exception as e:
            print(f"Error getting Weaviate class info: {e}")
            return {}

class QdrantVectorDB(VectorDBInterface):
    """Qdrant implementation"""
    
    def __init__(self, url: str, api_key: Optional[str] = None):
        try:
            from qdrant_client import QdrantClient
            
            self.client = QdrantClient(
                url=url,
                api_key=api_key
            )
        except ImportError:
            raise ImportError("Qdrant not installed. Run: pip install qdrant-client")
    
    def create_collection(self, collection_name: str, dimension: int, distance_metric: str = "cosine") -> bool:
        try:
            from qdrant_client.http import models
            
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=models.VectorParams(
                    size=dimension,
                    distance=getattr(models.Distance, distance_metric.upper())
                )
            )
            return True
        except Exception as e:
            print(f"Error creating Qdrant collection: {e}")
            return False
    
    def add_documents(self, collection_name: str, documents: List[str], metadatas: List[Dict], ids: List[str], embeddings: List[List[float]] = None) -> bool:
        try:
            from qdrant_client.http import models
            from sklearn.feature_extraction.text import TfidfVectorizer
            import numpy as np
            
            points = []
            
            # Create embeddings if not provided
            if embeddings is None:
                vectorizer = TfidfVectorizer(max_features=384)
                embeddings = vectorizer.fit_transform(documents).toarray()
            
            for i, (doc, meta, doc_id, embedding) in enumerate(zip(documents, metadatas, ids, embeddings)):
                # Ensure 384 dimensions
                if len(embedding) < 384:
                    embedding = np.pad(embedding, (0, 384 - len(embedding)), 'constant')
                elif len(embedding) > 384:
                    embedding = embedding[:384]
                
                # Convert to list if it's a numpy array
                if hasattr(embedding, 'tolist'):
                    embedding_list = embedding.tolist()
                else:
                    embedding_list = embedding
                
                points.append(models.PointStruct(
                    id=doc_id,
                    vector=embedding_list,
                    payload={
                        "text": doc,
                        **meta  # Include all metadata directly
                    }
                ))
            
            self.client.upsert(
                collection_name=collection_name,
                points=points
            )
            return True
        except Exception as e:
            print(f"Error adding documents to Qdrant: {e}")
            return False
    
    def search(self, collection_name: str, query_vector: List[float], k: int = 5, filter: Optional[Dict] = None) -> List[Dict]:
        try:
            from qdrant_client.http import models
            
            results = self.client.search(
                collection_name=collection_name,
                query_vector=query_vector,
                limit=k,
                query_filter=models.Filter(**filter) if filter else None
            )
            
            return [
                {
                    'document': result.payload['text'],
                    'metadata': {k: v for k, v in result.payload.items() if k != 'text'},
                    'distance': result.score
                }
                for result in results
            ]
        except Exception as e:
            print(f"Error searching Qdrant: {e}")
            return []
    
    def delete_collection(self, collection_name: str) -> bool:
        try:
            self.client.delete_collection(collection_name)
            return True
        except Exception as e:
            print(f"Error deleting Qdrant collection: {e}")
            return False
    
    def get_collection_info(self, collection_name: str) -> Dict:
        try:
            info = self.client.get_collection(collection_name)
            return {
                'name': collection_name,
                'vectors_count': info.vectors_count,
                'points_count': info.points_count,
                'config': info.config
            }
        except Exception as e:
            print(f"Error getting Qdrant collection info: {e}")
            return {}

def get_vector_db() -> VectorDBInterface:
    """Factory function to get the appropriate vector database instance"""
    vector_db_type = os.getenv("VECTOR_DB_TYPE", "chroma").lower()
    
    if vector_db_type == "chroma":
        persist_dir = os.getenv("VECTOR_DB_PERSIST_DIR", "./data/chroma")
        return ChromaVectorDB(persist_dir)
    
    elif vector_db_type == "pinecone":
        api_key = os.getenv("PINECONE_API_KEY")
        environment = os.getenv("PINECONE_ENVIRONMENT")
        if not api_key or not environment:
            raise ValueError("PINECONE_API_KEY and PINECONE_ENVIRONMENT must be set")
        return PineconeVectorDB(api_key, environment)
    
    elif vector_db_type == "weaviate":
        url = os.getenv("WEAVIATE_URL", "http://localhost:8080")
        api_key = os.getenv("WEAVIATE_API_KEY")
        return WeaviateVectorDB(url, api_key)
    
    elif vector_db_type == "qdrant":
        url = os.getenv("QDRANT_URL", "http://localhost:6333")
        api_key = os.getenv("QDRANT_API_KEY")
        return QdrantVectorDB(url, api_key)
    
    else:
        raise ValueError(f"Unsupported vector database type: {vector_db_type}")

# Global vector database instance
vector_db = get_vector_db()
