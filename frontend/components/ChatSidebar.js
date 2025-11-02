import { useState, useEffect } from 'react'
import {
    MessageSquare,
    Plus,
    Trash2,
    Clock,
    FileText,
    MoreVertical
} from 'lucide-react'
import axios from 'axios'

export default function ChatSidebar({
    documentId,
    currentSessionId,
    onSessionSelect,
    onNewSession,
    isOpen,
    onToggle
}) {
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (documentId) {
            loadSessions()
        }
    }, [documentId])

    const loadSessions = async () => {
        try {
            setLoading(true)
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/chat-history/sessions`)
            setSessions(response.data.filter(session => session.document_id === documentId))
        } catch (error) {
            console.error('Error loading sessions:', error)
        } finally {
            setLoading(false)
        }
    }

    const deleteSession = async (sessionId) => {
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/chat-history/sessions/${sessionId}`)
            setSessions(prev => prev.filter(s => s.id !== sessionId))
            if (currentSessionId === sessionId) {
                onSessionSelect(null)
            }
        } catch (error) {
            console.error('Error deleting session:', error)
        }
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffTime = Math.abs(now - date)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 1) return 'Today'
        if (diffDays === 2) return 'Yesterday'
        if (diffDays <= 7) return `${diffDays - 1} days ago`
        return date.toLocaleDateString()
    }

    if (!isOpen) {
        return (
            <button
                onClick={onToggle}
                className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50 bg-white border border-gray-200 rounded-lg p-2 shadow-lg hover:shadow-xl transition-shadow"
                title="Open chat history"
            >
                <MessageSquare className="h-5 w-5 text-gray-600" />
            </button>
        )
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-30"
                onClick={onToggle}
            />

            {/* Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200 h-full flex flex-col fixed left-0 top-0 z-40 shadow-lg pt-[5%]">
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Chat History</h2>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={onToggle}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Close sidebar"
                            >
                                <MoreVertical className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* New Chat Button */}
                    <button
                        onClick={onNewSession}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        <Plus className="h-4 w-4" />
                        <span>New Chat</span>
                    </button>
                </div>

                {/* Sessions List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent mx-auto mb-2"></div>
                            Loading sessions...
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No chat sessions yet</p>
                            <p className="text-xs text-gray-400 mt-1">Start a conversation to create one</p>
                        </div>
                    ) : (
                        <div className="p-2">
                            {sessions.map((session) => (
                                <div
                                    key={session.id}
                                    className={`group relative p-3 rounded-lg cursor-pointer transition-colors mb-2 ${currentSessionId === session.id
                                        ? 'bg-primary-50 border border-primary-200'
                                        : 'hover:bg-gray-50 border border-transparent'
                                        }`}
                                    onClick={() => onSessionSelect(session.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-medium text-gray-900 truncate">
                                                {session.session_name}
                                            </h3>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <div className="flex items-center space-x-1 text-xs text-gray-500">
                                                    <MessageSquare className="h-3 w-3" />
                                                    <span>{session.message_count} messages</span>
                                                </div>
                                                <div className="flex items-center space-x-1 text-xs text-gray-500">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{formatDate(session.updated_at)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                deleteSession(session.id)
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all"
                                            title="Delete session"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
