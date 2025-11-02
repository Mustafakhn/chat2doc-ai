import os
import asyncio
import httpx
import pickle
import numpy as np
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from langchain.text_splitter import RecursiveCharacterTextSplitter
import PyPDF2
import docx
from .document_cache import document_cache
from .vector_db_factory import get_vector_db
from dotenv import load_dotenv

load_dotenv()

# LLM Configuration
LLM_ENDPOINT = os.getenv("LLM_ENDPOINT", "http://144.24.121.168:5000/generate")

# Vector Database Configuration
VECTOR_DB_TYPE = os.getenv("VECTOR_DB_TYPE", "chroma")
VECTOR_DIMENSION = int(os.getenv("VECTOR_DIMENSION", "384"))
VECTOR_DISTANCE_METRIC = os.getenv("VECTOR_DISTANCE_METRIC", "cosine")

# Get vector database instance
vector_db = get_vector_db()

# 🧠 Lightweight Embedding Wrapper (TF-IDF)
class TfidfEmbedding:
    def __init__(self, vectorizer_path=None):
        self.vectorizer_path = vectorizer_path
        if vectorizer_path and os.path.exists(vectorizer_path):
            with open(vectorizer_path, "rb") as f:
                self.vectorizer = pickle.load(f)
        else:
            self.vectorizer = TfidfVectorizer(max_features=384)

    def _fit_if_needed(self, texts):
        if not hasattr(self.vectorizer, "vocabulary_"):
            self.vectorizer.fit(texts)

    def embed_documents(self, texts):
        self._fit_if_needed(texts)
        return self.vectorizer.transform(texts).toarray()

    def embed_query(self, query):
        if not hasattr(self.vectorizer, "vocabulary_"):
            return np.zeros((1, 384))  # Fallback with correct dimension
        return self.vectorizer.transform([query]).toarray()

    def save(self, path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            pickle.dump(self.vectorizer, f)

# Global embedding instance
embedding_model = TfidfEmbedding()

def extract_text_from_pdf(file_path):
    """Extract text from PDF file"""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return ""

def extract_text_from_docx(file_path):
    """Extract text from DOCX file"""
    try:
        doc = docx.Document(file_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    except Exception as e:
        print(f"Error extracting text from DOCX: {e}")
        return ""

def extract_text_from_txt(file_path):
    """Extract text from TXT file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    except Exception as e:
        print(f"Error extracting text from TXT: {e}")
        return ""

def extract_text_from_file(file_path):
    """Extract text from various file formats"""
    file_extension = os.path.splitext(file_path)[1].lower()
    
    if file_extension == '.pdf':
        return extract_text_from_pdf(file_path)
    elif file_extension == '.docx':
        return extract_text_from_docx(file_path)
    elif file_extension == '.txt':
        return extract_text_from_txt(file_path)
    else:
        print(f"Unsupported file format: {file_extension}")
        return ""

def create_embeddings_and_store(namespace, file_path, document_id, user_id):
    """Create embeddings and store them in the vector database"""
    try:
        print(f"Creating embeddings for {file_path}...")
        
        # Extract text from file
        text = extract_text_from_file(file_path)
        if not text.strip():
            print("No text extracted from file")
            return False
        
        # Split text into chunks
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=2000,
            chunk_overlap=400,
            separators=[
                "\n\n\n",  # Double line breaks (common story separators)
                "\n\n",    # Single line breaks
                "\n",      # Line breaks
                ". ",      # Sentence endings
                "! ",      # Exclamation endings
                "? ",      # Question endings
                " "        # Word boundaries
            ]
        )
        
        chunks = splitter.split_text(text)
        print(f"Created {len(chunks)} chunks")
        
        # Create embeddings
        embeddings = embedding_model.embed_documents(chunks)
        
        # Prepare documents for vector database
        documents = []
        metadatas = []
        ids = []
        
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            documents.append(chunk)
            metadatas.append({
                "document_id": document_id,
                "user_id": user_id,
                "chunk_index": i,
                "file_path": file_path,
                "namespace": namespace
            })
            # Generate integer ID for Qdrant (document_id * 10000 + chunk_index)
            ids.append(document_id * 10000 + i)
        
        # Check if collection exists, create if it doesn't
        try:
            # Try to get collection info to check if it exists
            collection_info = vector_db.client.get_collection(namespace)
            print(f"Collection {namespace} already exists with {collection_info.points_count} points")
        except Exception:
            # Collection doesn't exist, create it
            print(f"Creating new collection: {namespace}")
            collection_created = vector_db.create_collection(
                collection_name=namespace,
                dimension=384,
                distance_metric="cosine"
            )
            
            if not collection_created:
                print(f"Failed to create collection {namespace}")
                return False
            
        success = vector_db.add_documents(
            collection_name=namespace,
            documents=documents,
            metadatas=metadatas,
            ids=ids,
            embeddings=embeddings.tolist()
        )
        
        if success:
            print(f"Successfully stored {len(chunks)} chunks in vector database")
            # Cache the full document text
            document_cache.set_document_context(
                document_id=document_id,
                user_id=user_id,
                full_text=text,
                chunks=chunks,
                metadata={"file_path": file_path, "chunks_count": len(chunks)}
            )
            return True
        else:
            print("Failed to store chunks in vector database")
            return False
            
    except Exception as e:
        print(f"Error in create_embeddings_and_store: {e}")
        return False

def get_full_document_context(document_id, user_id, file_path):
    """Get full document context from cache or file"""
    
    # Try cache first
    cached = document_cache.get_document_context(document_id, user_id)
    if cached:
        context = cached.get('context', '')
        return context
    
    # Fallback to file
    if file_path and os.path.exists(file_path):
        text = extract_text_from_file(file_path)
        return text
    
    return ""

def get_smart_context(question, namespace, document_id, user_id, file_path, k=15):
    """Get smart context based on question type"""
    
    # Check if it's a counting/listing question
    if any(keyword in question.lower() for keyword in ['count', 'how many', 'number of', 'total', 'list all']):
        # For counting questions, get full document context
        full_context = get_full_document_context(document_id, user_id, file_path)
        if full_context:
            # Split into chunks for processing
            splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=400)
            chunks = splitter.split_text(full_context)
            result = "\n\n".join(chunks[:25])  # Limit to first 25 chunks
            return result
    
    # For specific questions, use vector search
    try:
        # Create query embedding
        query_embedding = embedding_model.embed_query(question)
        query_vector = query_embedding[0].tolist()
        
        # Search vector database
        results = vector_db.search(
        collection_name=namespace,
            query_vector=query_vector,
            k=k
        )
        
        if results:
            context = "\n\n".join([result['document'] for result in results])
            return context
        else:
            # Fallback to full document context
            return get_full_document_context(document_id, user_id, file_path)
            
    except Exception as e:
        # Fallback to full document context
        return get_full_document_context(document_id, user_id, file_path)

async def stream_answer_from_doc(namespace, question, conversation_history=None, document_id=None, user_id=None, file_path=None):
    """Stream answer from document using vector database"""
    
    # Get smart context
    context_text = get_smart_context(question, namespace, document_id, user_id, file_path)
    
    if not context_text:
        yield json.dumps({'error': 'No context found for this document'}) + "\n"
        return

    # Format conversation history
    conversation_context = ""
    if conversation_history:
        conversation_context = "\n\n".join([
            f"{i+1}. {msg['role'].title()}: {msg['content']}"
            for i, msg in enumerate(conversation_history[-10:])  # Last 10 messages
        ])
    
    # Determine document type for better prompting
    document_type_hint = ""
    if any(keyword in context_text.lower() for keyword in ['story', 'tale', 'narrative']):
        document_type_hint = "This appears to be a collection of stories or narratives."
    elif any(keyword in context_text.lower() for keyword in ['chapter', 'section', 'part']):
        document_type_hint = "This appears to be a structured document with chapters or sections."
    elif any(keyword in context_text.lower() for keyword in ['research', 'study', 'analysis']):
        document_type_hint = "This appears to be a research or analytical document."
    
    # Check if it's a counting/listing question
    is_counting_question = any(keyword in question.lower() for keyword in ['count', 'how many', 'number of', 'total', 'list all'])
    
    if is_counting_question:
        # Specialized prompt for counting/listing questions
        prompt = f"""# Document Analysis Task

## Document Context
{context_text}

## Document Type
{document_type_hint}

## Conversation History
{conversation_context if conversation_context else "No previous conversation."}

## Your Task
You are an AI assistant specialized in analyzing documents. The user has asked a counting or listing question that requires systematic review of the entire document.

**Question:** {question}

## Instructions for Counting/Listing Questions

1. **Systematic Review**: Carefully go through the entire document context provided
2. **Pattern Recognition**: Look for patterns, recurring elements, or specific items to count
3. **Comprehensive Counting**: Count every instance, don't miss any
4. **Transparency**: Show your methodology and reasoning
5. **Accuracy**: Double-check your count and provide confidence level

## Response Format

**Methodology:**
- Explain how you approached the counting task
- Mention any patterns or structures you identified

**Breakdown:**
- Provide a detailed breakdown of what you found
- List specific examples or categories

**Important Notes:**
- If the count is uncertain, explain why
- If you found patterns, describe them
- If the document is incomplete, mention this limitation

## Guidelines
- Be thorough and systematic
- Provide evidence for your count
- If you're not 100% certain, say so
- Use clear, organized formatting
- Be concise but comprehensive

Remember: The user is asking for a count or list, so accuracy and completeness are crucial."""
    else:
        # General question prompt
        prompt = f"""# Document Q&A Assistant

## Document Context
{context_text}

## Document Type
{document_type_hint}

## Conversation History
{conversation_context if conversation_context else "No previous conversation."}

## Your Task
Answer the user's question based on the document context provided.

**Question:** {question}

## Instructions

1. **Direct Answer**: Provide a clear, direct answer to the question
2. **Be Concise**: Keep your response brief and to the point
3. **Supporting Evidence**: Include relevant quotes or references from the document
4. **Context**: Provide necessary context for your answer
5. **Structure**: Organize your response clearly
6. **Conversation Awareness**: Consider the conversation history if relevant
7. **Accuracy**: Only use information from the provided document context
8. **Clarity**: Use simple, clear language

## Response Format

**Key Points:**
- Main answer points

**Details:**
- Supporting information and evidence

**Relevance:**
- Why this information is relevant

**Additional Context:**
- Any additional helpful context

**Important Notes:**
- Any limitations or caveats

## Guidelines
- Be helpful and informative
- Stay focused on the question asked
- Use emojis sparingly
- If you're unsure about something, say so
- Be concise unless asked to be more verbose

Remember: The user wants a helpful, accurate answer based on the document content."""

    # Stream the response
    try:
        async def generate_response():
            async with httpx.AsyncClient(timeout=60.0) as client:
                payload = {
                    "model": "gpt-oss:20b-cloud",
                    "prompt": prompt,
                    "stream": True,
                    "options": {
                        "num_thread": 4,
                        "num_gpu": 0,
                        "num_ctx": 4096,
                        "num_predict": 2048,
                        "temperature": 0.7
                    }
                }
                
                async with client.stream("POST", LLM_ENDPOINT, json=payload) as response:
                    if response.status_code != 200:
                        yield json.dumps({'error': f'LLM server error: {response.status_code}'}) + "\n"
                        return
                    
                    thinking_content = ""
                    response_content = ""
                    
                    async for line in response.aiter_lines():
                        # Handle both "data: " prefix and direct JSON
                        json_line = line
                        if line.startswith("data: "):
                            json_line = line[6:]
                        
                        try:
                            data = json.loads(json_line)
                            if "thinking" in data:
                                thinking_content += data["thinking"]
                                yield json.dumps({'thinking': data['thinking']}) + "\n"
                            elif "response" in data:
                                response_content += data["response"]
                                yield json.dumps({'response': data['response']}) + "\n"
                        except json.JSONDecodeError:
                            # If it's not JSON, treat as raw text response
                            if json_line.strip():
                                response_content += json_line
                                yield json.dumps({'response': json_line}) + "\n"
                            continue
                    
                    # Save to database if we have session info
                    if document_id and user_id:
                        try:
                            from .routes_chat_history import create_chat_message
                            # This would need to be implemented to save the full response
                            pass
                        except Exception as e:
                            print(f"Error saving to database: {e}")
        
        # Run the async generator
        async for chunk in generate_response():
                yield chunk
            
    except Exception as e:
        yield json.dumps({'error': f'Error generating response: {str(e)}'}) + "\n"
