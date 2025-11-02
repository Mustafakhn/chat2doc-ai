import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute'
import {
    FileText,
    Upload,
    MessageSquare,
    Share2,
    Calendar,
    MoreVertical,
    Copy,
    ExternalLink,
    Trash2
} from 'lucide-react'
import axios from 'axios'
import Link from 'next/link'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Dashboard() {
    const { user } = useAuth()
    const [documents, setDocuments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [sharingModal, setSharingModal] = useState({ open: false, document: null })
    const [sharingSettings, setSharingSettings] = useState({
        is_public: false,
        expires_in_hours: null
    })

    useEffect(() => {
        fetchDocuments()
    }, [])

    const fetchDocuments = async () => {
        try {
            setLoading(true)
            // For now, we'll use a mock user ID. In a real app, you'd get this from the auth context
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/upload/documents?user_id=1`)
            setDocuments(response.data)
        } catch (err) {
            setError('Failed to fetch documents')
            console.error('Error fetching documents:', err)
        } finally {
            setLoading(false)
        }
    }

    const copyShareLink = (doc) => {
        const shareUrl = `${window.location.origin}/chat/${doc.share_token}`
        navigator.clipboard.writeText(shareUrl)
        alert('Share link copied to clipboard!')
    }

    const openSharingModal = (document) => {
        setSharingModal({ open: true, document })
        setSharingSettings({
            is_public: document.is_public,
            expires_in_hours: document.expires_in_hours || null
        })
    }

    const closeSharingModal = () => {
        setSharingModal({ open: false, document: null })
        setSharingSettings({ is_public: false, expires_in_hours: null })
    }

    const updateSharingSettings = async () => {
        if (!sharingModal.document) return

        try {
            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/upload/${sharingModal.document.id}/sharing`,
                sharingSettings
            )

            // Update the document in the list
            setDocuments(prev => prev.map(doc =>
                doc.id === sharingModal.document.id
                    ? { ...doc, ...response.data }
                    : doc
            ))

            closeSharingModal()
        } catch (error) {
            console.error('Error updating sharing settings:', error)
            alert('Failed to update sharing settings')
        }
    }

    const togglePublic = async (docId) => {
        try {
            const response = await axios.patch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/upload/documents/${docId}/toggle-public`
            )
            // Update the document in the local state
            setDocuments(prev => prev.map(doc =>
                doc.id === docId ? { ...doc, is_public: response.data.is_public } : doc
            ))
        } catch (error) {
            console.error('Error toggling public status:', error)
            alert('Failed to update document visibility')
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner size="lg" />
                </div>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">Your Documents</h1>
                            <p className="text-blue-100 text-lg">
                                Upload and chat with your documents using AI
                            </p>
                        </div>
                        <Link href="/upload">
                            <button className="group relative px-8 py-4 bg-gradient-to-r from-white to-blue-50 text-blue-600 font-bold rounded-2xl hover:from-blue-50 hover:to-blue-100 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl border-2 border-blue-200 hover:border-blue-300">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <span className="relative flex items-center">
                                    <Upload className="h-6 w-6 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                                    Upload Document
                                </span>
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl">
                                <FileText className="h-6 w-6 text-white" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                                <p className="text-3xl font-bold text-gray-900">{documents.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center">
                            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl">
                                <MessageSquare className="h-6 w-6 text-white" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Public Documents</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {documents.filter(doc => doc.is_public).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl">
                                <Share2 className="h-6 w-6 text-white" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Shared Documents</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {documents.filter(doc => doc.share_token).length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Documents Grid */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                        {error}
                    </div>
                )}

                {documents.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Get started by uploading your first document.
                        </p>
                        <div className="mt-6">
                            <Link href="/upload">
                                <button className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-300 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <span className="relative flex items-center">
                                        <Upload className="h-6 w-6 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                                        Upload Document
                                    </span>
                                    <div className="absolute -right-2 -top-2 w-4 h-4 bg-white/30 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
                                </button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {documents.map((doc) => (
                            <div key={doc.id} className="card hover:shadow-lg transition-shadow">
                                <div className="card-header">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-primary-100 rounded-lg">
                                                <FileText className="h-5 w-5 text-primary-600" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                                    {doc.filename}
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Uploaded {formatDate(doc.created_at || new Date())}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <button
                                                onClick={() => openSharingModal(doc)}
                                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                                title="Sharing settings"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-content">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${doc.is_public
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {doc.is_public ? 'Public' : 'Private'}
                                            </span>
                                            <button
                                                onClick={() => openSharingModal(doc)}
                                                className="text-xs text-primary-600 hover:text-primary-800"
                                            >
                                                {doc.is_public ? 'Sharing Settings' : 'Make Public'}
                                            </button>
                                        </div>

                                        <div className="flex space-x-3">
                                            <Link href={`/chat?doc=${encodeURIComponent(doc.filename)}`}>
                                                <button className="group flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-300 overflow-hidden">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                    <span className="relative flex items-center justify-center">
                                                        <MessageSquare className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                                                        Chat
                                                    </span>
                                                </button>
                                            </Link>
                                            {doc.is_public && (
                                                <button
                                                    onClick={() => copyShareLink(doc)}
                                                    className="group px-4 py-3 border-2 border-gray-300 text-gray-700 text-sm font-bold rounded-xl hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                    title="Copy share link"
                                                >
                                                    <Share2 className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Sharing Settings Modal */}
            {sharingModal.open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4">Sharing Settings</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            {sharingModal.document?.filename}
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    id="is_public"
                                    checked={sharingSettings.is_public}
                                    onChange={(e) => setSharingSettings(prev => ({
                                        ...prev,
                                        is_public: e.target.checked
                                    }))}
                                    className="rounded"
                                />
                                <label htmlFor="is_public" className="text-sm font-medium">
                                    Make document public
                                </label>
                            </div>

                            {sharingSettings.is_public && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Expiry (optional)</label>
                                    <select
                                        value={sharingSettings.expires_in_hours || ''}
                                        onChange={(e) => setSharingSettings(prev => ({
                                            ...prev,
                                            expires_in_hours: e.target.value ? parseInt(e.target.value) : null
                                        }))}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="">No expiry</option>
                                        <option value="1">1 hour</option>
                                        <option value="24">24 hours</option>
                                        <option value="72">3 days</option>
                                        <option value="168">1 week</option>
                                        <option value="720">1 month</option>
                                    </select>
                                </div>
                            )}

                            {sharingSettings.is_public && sharingModal.document?.share_token && (
                                <div className="p-3 bg-gray-50 rounded-md">
                                    <p className="text-xs text-gray-600 mb-2">Share URL:</p>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            value={`${window.location.origin}/chat/${sharingModal.document.share_token}`}
                                            readOnly
                                            className="flex-1 text-xs p-2 border border-gray-300 rounded bg-white"
                                        />
                                        <button
                                            onClick={() => copyShareLink(sharingModal.document)}
                                            className="p-2 text-gray-600 hover:text-gray-800"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={closeSharingModal}
                                className="px-6 py-2 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={updateSharingSettings}
                                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                            >
                                Save Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ProtectedRoute>
    )
}
