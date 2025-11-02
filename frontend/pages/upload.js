import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute'
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react'
import axios from 'axios'
import { useRouter } from 'next/router'

export default function UploadPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const uploadFile = async () => {
    if (!file) return

    setUploading(true)
    setUploadStatus(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/upload/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      setUploadStatus({
        type: 'success',
        message: `File "${response.data.filename}" uploaded successfully!`,
        data: response.data
      })

      setFile(null)

      // Redirect to dashboard after successful upload
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: error.response?.data?.detail || 'Upload failed. Please try again.'
      })
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setUploadStatus(null)
  }

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop()?.toLowerCase()
    return <FileText className="h-8 w-8 text-primary-600" />
  }

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          {/* <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-6">
            <Upload className="w-4 h-4 mr-2" />
            Document Upload
          </div> */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Upload Your Documents
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload PDF, DOCX, or text documents to start chatting with them using AI.
            Your documents are processed securely and ready for intelligent conversations.
          </p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${dragActive
              ? 'border-blue-500 bg-blue-50 scale-105'
              : file
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-6">
                <div className="flex items-center justify-center">
                  <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to upload
                  </p>
                </div>
                <button
                  onClick={removeFile}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Drop your file here
                  </h3>
                  <p className="text-gray-500">
                    or click to browse your computer
                  </p>
                  <div className="text-sm text-gray-400">
                    Supports PDF, DOCX, DOC, TXT files up to 10MB
                  </div>
                </div>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.docx,.doc,.txt"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* File Info */}
          {file && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getFileIcon(file.name)}
                  <span className="text-sm text-gray-600">Ready to upload</span>
                </div>
                <span className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>
          )}

          {/* Upload Button */}
          {file && (
            <div className="mt-6">
              <button
                onClick={uploadFile}
                disabled={uploading}
                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Status Messages */}
          {uploadStatus && (
            <div className={`mt-4 p-4 rounded-lg flex items-center space-x-3 ${uploadStatus.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
              {uploadStatus.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <p className="text-sm font-medium">{uploadStatus.message}</p>
            </div>
          )}
        </div>
      </div>

      {/* Supported Formats */}
      {/* <div className="card">
        <div className="card-content">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Supported Formats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>PDF</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>DOCX</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>DOC</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>TXT</span>
            </div>
          </div>
        </div>
      </div> */}
      {/* </div> */}
    </ProtectedRoute>
  )
}
