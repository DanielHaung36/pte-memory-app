'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload, Music, CheckCircle, XCircle, ArrowLeft, Loader2, FileAudio
} from 'lucide-react'
import { useBatchUploadAudioMutation } from '@/lib/store/importApi'

interface UploadResult {
  filename: string
  success: boolean
  url?: string
  saved_as?: string
  error?: string
}

export default function BatchUploadAudioPage() {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [uploadResults, setUploadResults] = useState<UploadResult[] | null>(null)
  const [audioMap, setAudioMap] = useState<Record<string, string>>({})
  const [isDragging, setIsDragging] = useState(false)

  const [batchUpload, { isLoading: isUploading }] = useBatchUploadAudioMutation()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.type.startsWith('audio/') ||
               file.name.endsWith('.mp3') ||
               file.name.endsWith('.wav') ||
               file.name.endsWith('.ogg')
    )

    if (droppedFiles.length > 0) {
      setFiles((prev) => [...prev, ...droppedFiles])
      setUploadResults(null)
    } else {
      alert('请上传音频文件（mp3, wav, ogg）')
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length > 0) {
      setFiles((prev) => [...prev, ...selectedFiles])
      setUploadResults(null)
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    const formData = new FormData()
    files.forEach((file) => {
      formData.append('audio_files', file)
    })

    try {
      const result = await batchUpload(formData).unwrap()
      setUploadResults(result.results)
      setAudioMap(result.audio_map)
      alert(`成功上传 ${result.success_count} 个音频文件！`)
    } catch (error: any) {
      console.error('上传失败:', error)
      alert(error?.data?.error || '上传失败')
    }
  }

  const copyAudioMap = () => {
    const mapText = JSON.stringify(audioMap, null, 2)
    navigator.clipboard.writeText(mapText)
    alert('音频映射已复制到剪贴板！')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">批量上传音频</h1>
            <p className="text-gray-600 mt-2">批量上传题目音频文件，用于题目导入</p>
          </div>
        </div>

        {/* 上传区域 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Upload className="w-6 h-6" />
            选择音频文件
          </h2>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="space-y-4">
              <Music className="w-16 h-16 mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-700">
                  拖拽音频文件到此处，或
                </p>
                <label className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
                  选择文件
                  <input
                    type="file"
                    accept="audio/*,.mp3,.wav,.ogg"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500">支持 mp3, wav, ogg 格式，可同时上传多个文件</p>
            </div>
          </div>
        </div>

        {/* 文件列表 */}
        {files.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">待上传文件 ({files.length})</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileAudio className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    移除
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setFiles([])}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                清空列表
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    上传中...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    开始上传 ({files.length} 个文件)
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 上传结果 */}
        {uploadResults && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              上传完成
            </h2>

            <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
              {uploadResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    result.success ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{result.filename}</p>
                      {result.success && result.url && (
                        <p className="text-xs text-gray-600 truncate">{result.url}</p>
                      )}
                      {!result.success && result.error && (
                        <p className="text-xs text-red-600">{result.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 音频映射表 */}
            {Object.keys(audioMap).length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">音频文件映射</h3>
                  <button
                    onClick={copyAudioMap}
                    className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg"
                  >
                    复制映射
                  </button>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                  <pre className="text-xs text-gray-700">{JSON.stringify(audioMap, null, 2)}</pre>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setFiles([])
                  setUploadResults(null)
                  setAudioMap({})
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                继续上传
              </button>
              <button
                onClick={() => router.push('/questions/import')}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                去导入题目
              </button>
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-900">使用说明</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>1. 选择或拖拽需要上传的音频文件（支持多文件）</li>
            <li>2. 点击"开始上传"批量上传所有文件</li>
            <li>3. 上传完成后，系统会生成文件名到URL的映射表</li>
            <li>4. 在题目导入的 Excel 中，audio_filename 列填写原始文件名</li>
            <li>5. 导入系统会自动匹配已上传的音频文件</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
