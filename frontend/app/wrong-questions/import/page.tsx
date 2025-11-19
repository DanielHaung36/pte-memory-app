'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload, Download, FileSpreadsheet, CheckCircle, XCircle,
  AlertCircle, Loader2, ArrowLeft
} from 'lucide-react'
import {
  usePreviewWrongQuestionsImportMutation,
  useExecuteWrongQuestionsImportMutation,
  useLazyDownloadWrongQuestionTemplateQuery,
} from '@/lib/store/importApi'

interface PreviewData {
  total_rows: number
  valid_count: number
  invalid_count: number
  errors: string[]
  preview_data: any[]
}

export default function WrongQuestionImportPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [importResult, setImportResult] = useState<any>(null)
  const [isDragging, setIsDragging] = useState(false)

  const [previewImport, { isLoading: isPreviewing }] = usePreviewWrongQuestionsImportMutation()
  const [executeImport, { isLoading: isImporting }] = useExecuteWrongQuestionsImportMutation()
  const [downloadTemplate, { isLoading: isDownloading }] = useLazyDownloadWrongQuestionTemplateQuery()

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

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile)
      setPreviewData(null)
      setImportResult(null)
    } else {
      alert('请上传 Excel 文件（.xlsx 或 .xls）')
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreviewData(null)
      setImportResult(null)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const result = await downloadTemplate().unwrap()
      const url = window.URL.createObjectURL(result)
      const a = document.createElement('a')
      a.href = url
      a.download = `wrong_question_import_template_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('下载模板失败:', error)
      alert('下载模板失败')
    }
  }

  const handlePreview = async () => {
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const result = await previewImport(formData).unwrap()
      setPreviewData(result)
    } catch (error: any) {
      console.error('预览失败:', error)
      alert(error?.data?.error || '预览失败')
    }
  }

  const handleImport = async () => {
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const result = await executeImport(formData).unwrap()
      setImportResult(result.result)
      setPreviewData(null)

      if (result.result.success_count > 0) {
        alert(`成功导入 ${result.result.success_count} 条错题！`)
      }
    } catch (error: any) {
      console.error('导入失败:', error)
      alert(error?.data?.error || '导入失败')
    }
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">批量导入错题</h1>
              <p className="text-gray-600 mt-2">通过 Excel 文件批量导入错题记录</p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              下载模板
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Upload className="w-6 h-6" />
            上传 Excel 文件
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
            {file ? (
              <div className="space-y-4">
                <FileSpreadsheet className="w-16 h-16 mx-auto text-green-600" />
                <div>
                  <p className="text-lg font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => {
                      setFile(null)
                      setPreviewData(null)
                      setImportResult(null)
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    更换文件
                  </button>
                  <button
                    onClick={handlePreview}
                    disabled={isPreviewing}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isPreviewing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        预览中...
                      </>
                    ) : (
                      '预览数据'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-16 h-16 mx-auto text-gray-400" />
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    拖拽 Excel 文件到此处，或
                  </p>
                  <label className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
                    选择文件
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-500">支持 .xlsx 和 .xls 格式</p>
              </div>
            )}
          </div>
        </div>

        {previewData && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">预览结果</h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{previewData.total_rows}</div>
                <div className="text-sm text-gray-600">总行数</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{previewData.valid_count}</div>
                <div className="text-sm text-gray-600">有效数据</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{previewData.invalid_count}</div>
                <div className="text-sm text-gray-600">错误数据</div>
              </div>
            </div>

            {previewData.errors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  数据错误 ({previewData.errors.length})
                </h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <ul className="space-y-2">
                    {previewData.errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                        <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setPreviewData(null)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting || previewData.valid_count === 0}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    导入中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    确认导入 ({previewData.valid_count} 条)
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {importResult && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              导入完成
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{importResult.total_rows}</div>
                <div className="text-sm text-gray-600">总处理</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{importResult.success_count}</div>
                <div className="text-sm text-gray-600">成功导入</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{importResult.error_count}</div>
                <div className="text-sm text-gray-600">失败</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-red-600">失败原因</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <ul className="space-y-2">
                    {importResult.errors.map((error: string, index: number) => (
                      <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                        <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setFile(null)
                  setImportResult(null)
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                继续导入
              </button>
              <button
                onClick={() => router.push('/wrong-questions')}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                查看错题本
              </button>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-900">使用说明</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>1. 点击"下载模板"获取标准导入模板</li>
            <li>2. 按模板格式填写错题数据（必填字段：题目ID、错误类型）</li>
            <li>3. 上传填好的 Excel 文件</li>
            <li>4. 点击"预览数据"查看验证结果</li>
            <li>5. 确认无误后点击"确认导入"完成导入</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
