import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute'
import ChatMessage from '../components/ChatMessage'
import ChatSidebar from '../components/ChatSidebar'
import {
  Send,
  FileText,
  Loader2,
  Menu,
  X,
  MessageSquare,
  Bot,
  Plus
} from 'lucide-react'
import { useRouter } from 'next/router'
import axios from 'axios'

export default function ChatPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [question, setQuestion] = useState('')
  const [thinking, setThinking] = useState('')
  const [response, setResponse] = useState('')
  const [docFile, setDocFile] = useState('')
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [chatHistory, setChatHistory] = useState([])
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentDocument, setCurrentDocument] = useState(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const respRef = useRef()
  const inputRef = useRef()

  // Get document from URL params
  useEffect(() => {
    if (router.query.doc) {
      setDocFile(decodeURIComponent(router.query.doc))
    }
  }, [router.query.doc])

  // Load user documents
  useEffect(() => {
    loadDocuments()
  }, [])

  // Update current document when docFile changes
  useEffect(() => {
    if (docFile && documents.length > 0) {
      const doc = documents.find(d => d.filename === docFile)
      setCurrentDocument(doc)
    }
  }, [docFile, documents])

  const loadDocuments = async () => {
    try {
      setLoadingDocs(true)
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/upload/documents?user_id=1`)
      setDocuments(response.data)
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoadingDocs(false)
    }
  }

  const ask = async () => {
    if (!docFile || !question.trim() || !currentDocument) return

    setLoading(true)
    setIsStreaming(true)
    setThinking('')
    setResponse('')

    // Create or get current session
    let sessionId = currentSessionId
    if (!sessionId) {
      try {
        const sessionResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/chat-history/sessions`, {
          document_id: currentDocument.id,
          session_name: `Chat with ${currentDocument.filename}`
        })
        sessionId = sessionResponse.data.id
        setCurrentSessionId(sessionId)
      } catch (error) {
        console.error('Error creating session:', error)
      }
    }

    // Add user question to chat history immediately
    const userMessage = {
      role: 'user',
      content: question,
      created_at: new Date()
    }
    setChatHistory(prev => [...prev, userMessage])

    // Save user message to database
    if (sessionId) {
      try {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/chat-history/messages`, {
          session_id: sessionId,
          role: 'user',
          content: question
        })
      } catch (error) {
        console.error('Error saving user message:', error)
      }
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
          'Accept': 'text/plain'
        },
        body: JSON.stringify({
          doc_filename: docFile,
          question,
          session_id: sessionId
        })
      })

      if (!res.body) return

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullResponse = ''
      let fullThinking = ''

      // Create a temporary AI message for streaming
      const tempAiMessage = {
        role: 'ai',
        content: '',
        thinking: '',
        created_at: new Date(),
        isStreaming: true,
        isInitializing: true // Flag to show "thinking" initially
      }
      setChatHistory(prev => [...prev, tempAiMessage])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split("\n")
        buffer = lines.pop()

        for (let line of lines) {
          if (!line.trim()) continue
          try {
            const chunk = JSON.parse(line)
            if (chunk.thinking) {
              fullThinking += chunk.thinking
            }
            if (chunk.response) {
              fullResponse += chunk.response
            }

            // Update the streaming message in real-time
            setChatHistory(prev => {
              const newHistory = [...prev]
              const lastMessage = newHistory[newHistory.length - 1]
              if (lastMessage && lastMessage.role === 'ai' && lastMessage.isStreaming) {
                lastMessage.content = fullResponse
                lastMessage.thinking = fullThinking
                // Clear initializing flag once we start receiving content
                if (fullResponse || fullThinking) {
                  lastMessage.isInitializing = false
                }
              }
              return newHistory
            })
          } catch (err) {
            console.error("JSON parse error:", err, line)
          }
        }

        if (respRef.current) {
          respRef.current.scrollTop = respRef.current.scrollHeight
        }
      }

      if (buffer.trim()) {
        try {
          const chunk = JSON.parse(buffer)
          if (chunk.thinking) {
            fullThinking += chunk.thinking
          }
          if (chunk.response) {
            fullResponse += chunk.response
          }
        } catch (err) {
          console.error("JSON parse error:", err, buffer)
        }
      }

      // Final update to the streaming message
      setChatHistory(prev => {
        const newHistory = [...prev]
        const lastMessage = newHistory[newHistory.length - 1]
        if (lastMessage && lastMessage.role === 'ai' && lastMessage.isStreaming) {
          lastMessage.content = fullResponse
          lastMessage.thinking = fullThinking
          lastMessage.isStreaming = false // Mark as completed
        }
        return newHistory
      })

      // Save AI message to database
      if (sessionId) {
        try {
          await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/chat-history/messages`, {
            session_id: sessionId,
            role: 'ai',
            content: fullResponse,
            thinking: fullThinking
          })
        } catch (error) {
          console.error('Error saving AI message:', error)
        }
      }

    } catch (err) {
      console.error(err)
      const errorMessage = {
        role: 'ai',
        content: 'Sorry, there was an error processing your request. Please try again.',
        created_at: new Date(),
        isStreaming: false
      }
      setChatHistory(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
      setIsStreaming(false)
      setQuestion('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      ask()
    }
  }

  const loadSessionMessages = async (sessionId) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/chat-history/sessions/${sessionId}/messages`)
      setChatHistory(response.data)
    } catch (error) {
      console.error('Error loading session messages:', error)
    }
  }

  const handleSessionSelect = (sessionId) => {
    setCurrentSessionId(sessionId)
    if (sessionId) {
      loadSessionMessages(sessionId)
    } else {
      setChatHistory([])
    }
  }

  const handleNewSession = () => {
    setCurrentSessionId(null)
    setChatHistory([])
    setThinking('')
    setResponse('')
  }


  return (
    <ProtectedRoute>
      <div className="h-screen flex">
        {/* Chat Sidebar */}
        <ChatSidebar
          documentId={currentDocument?.id}
          currentSessionId={currentSessionId}
          onSessionSelect={handleSessionSelect}
          onNewSession={handleNewSession}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-h-0 w-full">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  title="Toggle chat history"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Chat with Document</h1>
                    <p className="text-sm text-gray-500 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      {docFile || 'Select a document to start chatting'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleNewSession}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all duration-200 flex items-center space-x-2"
                  title="Start new chat"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Chat</span>
                </button>
              </div>
            </div>
          </div>

          {/* Document Selector */}
          <div className="bg-gray-50 border-b border-gray-200 p-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Document:</label>
              <select
                value={docFile}
                onChange={(e) => setDocFile(e.target.value)}
                className="input flex-1 max-w-md"
                disabled={loadingDocs}
              >
                <option value="">Select a document...</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.filename}>
                    {doc.filename}
                  </option>
                ))}
              </select>
              {loadingDocs && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            </div>
          </div>

          {/* Chat Messages */}
          <div
            ref={respRef}
            className="flex-1 overflow-y-auto bg-gray-50"
          >
            <div className="max-w-4xl mx-auto p-6 pb-24">
              {chatHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No messages yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start a conversation by asking a question about your document.
                  </p>
                </div>
              ) : (
                <>
                  {chatHistory.map((message, index) => (
                    <ChatMessage key={index} message={message} />
                  ))}

                </>
              )}

            </div>
          </div>

          {/* Input Area - Fixed at bottom */}
          <div className="bg-white border-t border-gray-200 p-6 sticky bottom-0 z-10 shadow-lg">
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <div className="flex items-end space-x-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-3xl p-5 border-2 border-gray-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 transition-all duration-300 shadow-sm hover:shadow-md">
                  <div className="flex-1">
                    <textarea
                      ref={inputRef}
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={docFile ? "Ask anything about your document..." : "Select a document first to start chatting..."}
                      className="w-full bg-transparent border-none outline-none resize-none text-gray-900 placeholder-gray-500 text-base leading-relaxed"
                      rows={1}
                      disabled={loading || !docFile}
                      style={{ minHeight: '28px', maxHeight: '120px' }}
                    />
                  </div>
                  <button
                    onClick={ask}
                    disabled={loading || !docFile || !question.trim()}
                    className="group flex-shrink-0 p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:shadow-none"
                    title={loading ? "AI is thinking..." : !docFile ? "Select a document first" : !question.trim() ? "Type a message" : "Send message"}
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Send className="h-5 w-5 group-hover:translate-x-0.5 transition-transform duration-200" />
                        <span className="text-sm font-medium hidden sm:inline">Send</span>
                      </div>
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-4 px-3">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      AI Ready
                    </span>
                    {docFile && (
                      <span className="flex items-center bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        <FileText className="h-3 w-3 mr-1" />
                        {docFile}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}