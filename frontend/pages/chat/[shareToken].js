import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
    Send,
    FileText,
    Bot,
    User,
    Loader2,
    ExternalLink
} from 'lucide-react'
import axios from 'axios'

export default function PublicChatPage() {
    const router = useRouter()
    const { shareToken } = router.query
    const [question, setQuestion] = useState('')
    const [document, setDocument] = useState(null)
    const [loading, setLoading] = useState(false)
    const [loadingDoc, setLoadingDoc] = useState(true)
    const [error, setError] = useState('')
    const [chatHistory, setChatHistory] = useState([])
    const respRef = useRef()
    const inputRef = useRef()

    useEffect(() => {
        if (shareToken) {
            loadDocument()
        }
    }, [shareToken])

    const loadDocument = async () => {
        try {
            setLoadingDoc(true)
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/upload/documents/${shareToken}`)
            setDocument(response.data)
        } catch (error) {
            if (error.response?.status === 403) {
                setError('Document access has been disabled by the owner')
            } else if (error.response?.status === 410) {
                setError('Document access has expired')
            } else {
                setError('Document not found or not accessible')
            }
            console.error('Error loading document:', error)
        } finally {
            setLoadingDoc(false)
        }
    }

    const ask = async () => {
        if (!shareToken || !question.trim()) return

        setLoading(true)

        // Add user question to chat history
        const userMessage = { type: 'user', content: question, timestamp: new Date() }
        setChatHistory(prev => [...prev, userMessage])

        // Add empty AI message for streaming
        const aiMessage = {
            type: 'ai',
            content: '',
            thinking: '',
            isStreaming: true,
            timestamp: new Date()
        }
        setChatHistory(prev => [...prev, aiMessage])

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/chat/public/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/plain'
                },
                body: JSON.stringify({ share_token: shareToken, question })
            })

            if (!res.ok) {
                throw new Error('Failed to get response')
            }

            if (!res.body) return

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''
            let fullResponse = ''

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
                            // Update the streaming message in chatHistory
                            setChatHistory(prev => {
                                const newHistory = [...prev]
                                const lastMessage = newHistory[newHistory.length - 1]
                                if (lastMessage && lastMessage.type === 'ai' && lastMessage.isStreaming) {
                                    lastMessage.thinking = (lastMessage.thinking || '') + chunk.thinking
                                }
                                return newHistory
                            })
                        }
                        if (chunk.response) {
                            fullResponse += chunk.response
                            // Update the streaming message in chatHistory
                            setChatHistory(prev => {
                                const newHistory = [...prev]
                                const lastMessage = newHistory[newHistory.length - 1]
                                if (lastMessage && lastMessage.type === 'ai' && lastMessage.isStreaming) {
                                    lastMessage.content = fullResponse
                                }
                                return newHistory
                            })
                        }
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
                        // Update the streaming message in chatHistory
                        setChatHistory(prev => {
                            const newHistory = [...prev]
                            const lastMessage = newHistory[newHistory.length - 1]
                            if (lastMessage && lastMessage.type === 'ai' && lastMessage.isStreaming) {
                                lastMessage.thinking = (lastMessage.thinking || '') + chunk.thinking
                            }
                            return newHistory
                        })
                    }
                    if (chunk.response) {
                        fullResponse += chunk.response
                        // Update the streaming message in chatHistory
                        setChatHistory(prev => {
                            const newHistory = [...prev]
                            const lastMessage = newHistory[newHistory.length - 1]
                            if (lastMessage && lastMessage.type === 'ai' && lastMessage.isStreaming) {
                                lastMessage.content = fullResponse
                            }
                            return newHistory
                        })
                    }
                } catch (err) {
                    console.error("JSON parse error:", err, buffer)
                }
            }

            // Mark streaming as complete
            setChatHistory(prev => {
                const newHistory = [...prev]
                const lastMessage = newHistory[newHistory.length - 1]
                if (lastMessage && lastMessage.type === 'ai' && lastMessage.isStreaming) {
                    lastMessage.isStreaming = false
                }
                return newHistory
            })

        } catch (err) {
            console.error(err)
            let errorMessage = 'Sorry, there was an error processing your request. Please try again.'

            if (err.response?.status === 403) {
                errorMessage = 'Document access has been disabled by the owner. This chat is no longer available.'
            } else if (err.response?.status === 410) {
                errorMessage = 'Document access has expired. This chat is no longer available.'
            }

            setChatHistory(prev => [...prev, {
                type: 'ai',
                content: errorMessage,
                timestamp: new Date()
            }])
        } finally {
            setLoading(false)
            setQuestion('')
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            ask()
        }
    }


    if (loadingDoc) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading document...</h3>
                    <p className="text-gray-600">Please wait while we prepare the document for chat.</p>
                </div>
            </div>
        )
    }

    if (error || !document) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <FileText className="h-8 w-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">Document not found</h1>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        {error || 'The document you\'re looking for doesn\'t exist or is not accessible.'}
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen flex bg-gray-50">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 p-6 shadow-sm">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Public Chat</h1>
                                <p className="text-sm text-gray-500">
                                    {document.filename} • Guest Access
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-xs text-gray-500">Public Document</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <a
                                href="/"
                                className="px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 flex items-center space-x-2"
                                title="Go to main site"
                            >
                                <ExternalLink className="h-4 w-4" />
                                <span>Main Site</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Chat Messages */}
                <div
                    ref={respRef}
                    className="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto w-full"
                >
                    {chatHistory.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6">
                                <Bot className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Start a conversation</h3>
                            <p className="text-gray-600 max-w-md mx-auto">
                                Ask questions about this shared document and get AI-powered answers.
                            </p>
                        </div>
                    ) : (
                        chatHistory.map((message, index) => (
                            <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-4xl ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                                    <div className={`flex items-start space-x-4 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                                        }`}>
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${message.type === 'user'
                                            ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                                            : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600'
                                            }`}>
                                            {message.type === 'user' ? (
                                                <User className="h-5 w-5" />
                                            ) : (
                                                <Bot className="h-5 w-5" />
                                            )}
                                        </div>
                                        <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''
                                            }`}>
                                            <div className={`inline-block px-6 py-4 rounded-2xl shadow-sm ${message.type === 'user'
                                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                                : 'bg-white border border-gray-200'
                                                }`}>
                                                {message.type === 'ai' && message.thinking && (
                                                    <div className="mb-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                                            <span className="font-medium">
                                                                {message.isStreaming ? 'AI is thinking...' : 'AI was thinking...'}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs italic">{message.thinking}</div>
                                                    </div>
                                                )}
                                                {message.type === 'ai' && message.isStreaming && !message.content && (
                                                    <div className="flex items-center space-x-2 text-gray-500">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        <span className="text-sm">AI is responding...</span>
                                                    </div>
                                                )}
                                                <div className="prose prose-sm max-w-none">
                                                    {message.type === 'ai' ? (
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                            {message.content}
                                                        </ReactMarkdown>
                                                    ) : (
                                                        <p className="whitespace-pre-wrap">{message.content}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mt-2 text-xs text-gray-500">
                                                {message.timestamp.toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                </div>

                {/* Input Area */}
                <div className="bg-white border-t border-gray-200 p-6 sticky bottom-0 z-10 shadow-lg">
                    <div className="max-w-6xl mx-auto">
                        <div className="relative">
                            <div className="flex items-end space-x-4 bg-gray-50 rounded-2xl p-4 border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
                                <textarea
                                    ref={inputRef}
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask a question about this document..."
                                    className="w-full bg-transparent border-none outline-none resize-none text-gray-900 placeholder-gray-500"
                                    style={{ minHeight: '24px', maxHeight: '120px' }}
                                    rows={1}
                                    disabled={loading}
                                />
                                <button
                                    onClick={ask}
                                    disabled={loading || !question.trim()}
                                    className="flex-shrink-0 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                                >
                                    {loading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Send className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                                <p className="text-xs text-gray-500">
                                    Press Enter to send, Shift+Enter for new line
                                </p>
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>AI Ready</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
