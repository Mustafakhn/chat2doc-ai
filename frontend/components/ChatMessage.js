import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
    Bot,
    User,
    ChevronDown,
    ChevronRight,
    Copy,
    Clock
} from 'lucide-react'

export default function ChatMessage({ message, isStreaming = false }) {
    const [isThinkingExpanded, setIsThinkingExpanded] = useState(false)
    const [copied, setCopied] = useState(false)

    // Use isStreaming from message if available, otherwise use prop
    const actuallyStreaming = message.isStreaming || isStreaming

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy text: ', err)
        }
    }

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-6`}>
            <div className={`max-w-4xl ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                <div className={`flex items-start space-x-3 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${message.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                        }`}>
                        {message.role === 'user' ? (
                            <User className="h-5 w-5" />
                        ) : (
                            <Bot className="h-5 w-5" />
                        )}
                    </div>

                    {/* Message Content */}
                    <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                        <div className={`inline-block px-6 py-4 rounded-2xl shadow-sm ${message.role === 'user'
                            ? 'bg-primary-600 text-white rounded-br-md'
                            : 'bg-white border border-gray-200 rounded-bl-md'
                            }`}>

                            {/* Thinking Section (Collapsible) */}
                            {message.thinking && (
                                <div className="mb-4">
                                    <button
                                        onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
                                        className="flex items-center space-x-2 text-xs text-gray-500 hover:text-gray-700 transition-colors mb-2"
                                    >
                                        {isThinkingExpanded ? (
                                            <ChevronDown className="h-3 w-3" />
                                        ) : (
                                            <ChevronRight className="h-3 w-3" />
                                        )}
                                        <span className="font-medium">AI Thinking Process</span>
                                    </button>

                                    {isThinkingExpanded && (
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 italic">
                                            <div className="whitespace-pre-wrap">{message.thinking}</div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Main Content */}
                            <div className="prose prose-sm max-w-none">
                                {message.role === 'ai' ? (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {message.content}
                                    </ReactMarkdown>
                                ) : (
                                    <p className="whitespace-pre-wrap">{message.content}</p>
                                )}
                            </div>

                            {/* Streaming Indicator */}
                            {actuallyStreaming && message.role === 'ai' && (
                                <div className="flex items-center space-x-2 mt-2 text-gray-400">
                                    <div className="flex space-x-1">
                                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                    <span className="text-xs">
                                        {message.isInitializing
                                            ? 'AI is thinking...'
                                            : message.thinking
                                                ? 'AI is thinking...'
                                                : 'AI is responding...'
                                        }
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Message Footer */}
                        <div className={`flex items-center space-x-2 mt-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span>{formatTime(message.created_at)}</span>
                            </div>

                            {message.role === 'ai' && (
                                <button
                                    onClick={() => copyToClipboard(message.content)}
                                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Copy message"
                                >
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
