'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, File, Check, X, Download, Trash2, Eye, AlertCircle } from 'lucide-react'

interface Document {
  id: string
  document_type: string
  file_name: string
  file_path: string
  file_size: number
  status: string
  uploaded_at: string
}

interface DocumentType {
  id: string
  category: string
  name: string
  description: string
  required: boolean
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [clientId, setClientId] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    fetchClientData()
    fetchDocuments()
    fetchDocumentTypes()
  }, [])

  const fetchClientData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (client) {
        setClientId(client.id)
      }
    }
  }

  const fetchDocuments = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!client) return

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('client_id', client.id)
      .order('uploaded_at', { ascending: false })

    if (data) {
      setDocuments(data)
    }
  }

  const fetchDocumentTypes = async () => {
    const { data, error } = await supabase
      .from('document_types')
      .select('*')
      .order('sort_order')

    if (data) {
      setDocumentTypes(data)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0]
    if (!file || !clientId) return

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (file.size > maxSize) {
      setError('File size exceeds 10MB limit. Please choose a smaller file.')
      e.target.value = ''
      return
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 
                         'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload PDF, JPG, PNG, DOC, or DOCX files only.')
      e.target.value = ''
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const sanitizedDocType = docType.replace(/[^a-zA-Z0-9_-]/g, '_')
      const fileName = `${clientId}/${sanitizedDocType}_${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        // Handle specific storage errors
        if (uploadError.message?.includes('row-level security')) {
          throw new Error('Permission denied. Please ensure you are logged in and try again.')
        } else if (uploadError.message?.includes('already exists')) {
          throw new Error('A file with this name already exists. Please try again.')
        } else if (uploadError.message?.includes('payload too large')) {
          throw new Error('File is too large. Maximum size is 10MB.')
        } else {
          throw uploadError
        }
      }

      // Create document record in database
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          client_id: clientId,
          document_type: docType,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          status: 'pending_review'
        })
        .select()
        .single()

      if (docError) throw docError

      setSuccess(`${docType} uploaded successfully!`)
      fetchDocuments() // Refresh the list
      
      // Clear file input
      e.target.value = ''
    } catch (err: any) {
      setError(err.message || 'Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (doc: Document) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([doc.file_path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id)

      if (dbError) throw dbError

      setSuccess('Document deleted successfully')
      fetchDocuments()
    } catch (err: any) {
      setError(err.message || 'Failed to delete document')
    }
  }

  const handleDownload = async (doc: Document) => {
    try {
      // Generate a signed URL for secure download
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.file_path, 3600) // URL valid for 1 hour

      if (error) {
        throw error
      }

      if (data?.signedUrl) {
        // Create a temporary link and trigger download
        const link = document.createElement('a')
        link.href = data.signedUrl
        link.download = doc.file_name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (err: any) {
      setError('Failed to download document. Please try again.')
      console.error('Download error:', err)
    }
  }

  const categories = ['all', ...Array.from(new Set(documentTypes.map(dt => dt.category)))]
  const filteredDocTypes = selectedCategory === 'all' 
    ? documentTypes 
    : documentTypes.filter(dt => dt.category === selectedCategory)

  // Group uploaded documents by type
  const uploadedByType = documents.reduce((acc, doc) => {
    acc[doc.document_type] = doc
    return acc
  }, {} as Record<string, Document>)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
        <p className="mt-2 text-gray-600">
          Upload and manage your credentialing documents
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-4">
          <div className="flex">
            <Check className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="mb-6 flex space-x-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Document Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocTypes.map(docType => {
          const uploaded = uploadedByType[docType.name]
          const isRequired = docType.required

          return (
            <div
              key={docType.id}
              className={`bg-white rounded-lg shadow p-6 ${
                isRequired && !uploaded ? 'border-2 border-yellow-200' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {docType.name}
                    {isRequired && (
                      <span className="ml-2 text-xs text-red-500">*Required</span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{docType.description}</p>
                </div>
                {uploaded && (
                  <div className={`ml-4 px-2 py-1 rounded-full text-xs font-medium ${
                    uploaded.status === 'approved' 
                      ? 'bg-green-100 text-green-800'
                      : uploaded.status === 'pending_review'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {uploaded.status.replace('_', ' ')}
                  </div>
                )}
              </div>

              {uploaded ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center space-x-3">
                      <File className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {uploaded.file_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Uploaded {new Date(uploaded.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDownload(uploaded)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(uploaded)}
                        className="p-1 text-red-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <label className="block">
                    <span className="sr-only">Replace {docType.name}</span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => handleFileUpload(e, docType.name)}
                      disabled={uploading}
                    />
                    <div className="cursor-pointer text-center py-2 px-3 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50">
                      Replace Document
                    </div>
                  </label>
                </div>
              ) : (
                <label className="block">
                  <span className="sr-only">Upload {docType.name}</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => handleFileUpload(e, docType.name)}
                    disabled={uploading}
                  />
                  <div className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Click to upload {docType.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, JPG, PNG, DOC up to 10MB
                    </p>
                  </div>
                </label>
              )}
            </div>
          )
        })}
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Document Guidelines</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            All documents must be clear and legible
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            For licenses and certificates, include both front and back if applicable
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            Insurance certificates must show current coverage dates
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            Documents will be reviewed within 24-48 hours
          </li>
        </ul>
      </div>
    </div>
  )
}