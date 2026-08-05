'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, formatBytes } from '@/lib/utils'
import { Icon } from '@/lib/icons'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { AuthGuard } from '@/components/platform/auth-guard'
import { Breadcrumb } from '@/components/platform/breadcrumb'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/api'
import { initUploadSession, uploadFile, cancelUploadSession } from '@/lib/api-uploads'
import type { UploadItem, UploadStatus } from '@/lib/api-uploads'

interface WeddingOption { id: string; weddingName: string }
interface AlbumOption { id: string; name: string; weddingId: string }
interface FolderOption { id: string; name: string; weddingId: string }

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/tiff']
const MAX_FILE_SIZE = 50 * 1024 * 1024
const ACCEPT_STRING = '.jpg,.jpeg,.png,.webp,.heic,.tiff,.tif'
const MAX_BATCH = 500

const statusBadgeVariant: Record<UploadStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  queued: 'default',
  uploading: 'info',
  processing: 'warning',
  completed: 'success',
  error: 'error',
}

function generateId() {
  return `upload-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function getFileExtension(name: string) {
  return name.split('.').pop()?.toLowerCase() || ''
}

function validateFile(file: File): string | null {
  const ext = getFileExtension(file.name)
  const isAllowedExt = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.tiff', '.tif'].includes(`.${ext}`)
  if (!isAllowedExt && !ALLOWED_TYPES.includes(file.type)) {
    return `Invalid file type. Accepted: JPEG, PNG, WebP, HEIC, TIFF`
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File exceeds ${formatBytes(MAX_FILE_SIZE)} limit`
  }
  if (file.size === 0) {
    return 'File is empty'
  }
  return null
}

export default function UploadPage() {
  const { toast } = useToast()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const [isDragOver, setIsDragOver] = useState(false)
  const [weddingId, setWeddingId] = useState('')
  const [albumId, setAlbumId] = useState('')
  const [folderId, setFolderId] = useState('')
  const [newAlbumName, setNewAlbumName] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([])
  const [pausedIds, setPausedIds] = useState<Set<string>>(new Set())
  const [isUploading, setIsUploading] = useState(false)
  const [showNewAlbumInput, setShowNewAlbumInput] = useState(false)
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [summary, setSummary] = useState<{ totalFiles: number; totalSize: number; errorCount: number } | null>(null)

  const [weddings, setWeddings] = useState<WeddingOption[]>([])
  const [albums, setAlbums] = useState<AlbumOption[]>([])
  const [folders, setFolders] = useState<FolderOption[]>([])
  const [loadingWeddings, setLoadingWeddings] = useState(true)

  const intervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const previewsRef = useRef<Map<string, string>>(new Map())
  const pausedRef = useRef<Set<string>>(new Set())
  const sessionIdRef = useRef<string | null>(null)
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map())

  useEffect(() => { pausedRef.current = pausedIds }, [pausedIds])

  useEffect(() => {
    fetchWeddings()
    return () => {
      intervalsRef.current.forEach(id => clearInterval(id))
      intervalsRef.current.clear()
      previewsRef.current.forEach(url => URL.revokeObjectURL(url))
      previewsRef.current.clear()
      abortControllersRef.current.forEach(c => c.abort())
      abortControllersRef.current.clear()
    }
  }, [])

  async function fetchWeddings() {
    try {
      const data = await apiFetch<{ items: any[] }>('/api/v1/weddings/?page_size=100')
      setWeddings((data.items || []).map(w => ({ id: w.id, weddingName: w.weddingName })))
    } catch (e) {
      toast({ title: 'Failed to load weddings', description: String(e), variant: 'error' })
    } finally {
      setLoadingWeddings(false)
    }
  }

  async function fetchAlbums(wId: string) {
    try {
      const data = await apiFetch<{ id: string; name: string }[]>(`/api/v1/weddings/${wId}/albums`)
      setAlbums(data.map(a => ({ id: a.id, name: a.name, weddingId: wId })))
    } catch { setAlbums([]) }
  }

  async function fetchFolders(wId: string) {
    try {
      const data = await apiFetch<{ id: string; name: string }[]>(`/api/v1/weddings/${wId}/folders`)
      setFolders(data.map(f => ({ id: f.id, name: f.name, weddingId: wId })))
    } catch { setFolders([]) }
  }

  useEffect(() => {
    if (weddingId) {
      fetchAlbums(weddingId)
      fetchFolders(weddingId)
    } else {
      setAlbums([])
      setFolders([])
    }
  }, [weddingId])

  useEffect(() => {
    return () => {
      intervalsRef.current.forEach(id => clearInterval(id))
      intervalsRef.current.clear()
    }
  }, [])

  const weddingOptions = weddings.map(w => ({ label: w.weddingName, value: w.id }))
  const albumOptions = albums.map(a => ({ label: a.name, value: a.id }))
  const folderOptions = folders.map(f => ({ label: f.name, value: f.id }))

  const queuedItems = uploadItems.filter(i => i.status === 'queued')
  const activeUploadingItems = uploadItems.filter(i => i.status === 'uploading' || i.status === 'processing')
  const completedItems = uploadItems.filter(i => i.status === 'completed')
  const failedItems = uploadItems.filter(i => i.status === 'error')
  const hasActiveUploads = activeUploadingItems.length > 0
  const hasPausedItems = pausedIds.size > 0
  const allDone = uploadItems.length > 0 && uploadItems.every(i => i.status === 'completed' || i.status === 'error')

  const overallProgress = uploadItems.length
    ? Math.round(uploadItems.reduce((sum, i) => sum + i.progress, 0) / uploadItems.length)
    : 0

  const clearIntervals = useCallback(() => {
    intervalsRef.current.forEach(id => clearInterval(id))
    intervalsRef.current.clear()
  }, [])

  async function handleStartUpload() {
    const toUpload = uploadItems.filter(i => i.status === 'queued')
    if (!toUpload.length) {
      toast({ title: 'No files to upload', variant: 'warning' })
      return
    }

    setIsUploading(true)
    setSummary(null)

    try {
      const filesMeta = toUpload.map(i => ({
        name: i.name,
        size: i.size,
        content_type: 'image/jpeg',
      }))

      const initResp = await initUploadSession(
        weddingId,
        filesMeta,
        albumId || undefined,
        folderId || undefined,
      )

      sessionIdRef.current = initResp.upload_id

      setUploadItems(prev => prev.map(i =>
        i.status === 'queued' ? { ...i, status: 'uploading' } : i
      ))

      const promises = toUpload.map(async (item, idx) => {
        const allocation = initResp.files[idx]
        if (!allocation) return

        const file = previewFilesRef.current.get(item.id)
        if (!file) {
          markFailed(item.id, 'File not found')
          return
        }

        try {
          const photo = await uploadFile(
            initResp.upload_id,
            allocation.file_id,
            file,
            (pct) => {
              setUploadItems(prev => prev.map(i =>
                i.id === item.id && i.status !== 'completed' && i.status !== 'error'
                  ? { ...i, progress: pct }
                  : i
              ))
            },
          )

          setUploadItems(prev => prev.map(i =>
            i.id === item.id
              ? { ...i, progress: 100, status: 'completed', response: photo as any }
              : i
          ))
        } catch (err) {
          markFailed(item.id, String(err))
        }
      })

      await Promise.allSettled(promises)
    } catch (err) {
      toast({ title: 'Upload session failed', description: String(err), variant: 'error' })
      setUploadItems(prev => prev.map(i =>
        i.status === 'uploading' ? { ...i, status: 'error', error: String(err) } : i
      ))
    } finally {
      setIsUploading(false)
    }
  }

  const previewFilesRef = useRef<Map<string, File>>(new Map())

  function markFailed(id: string, error: string) {
    setUploadItems(prev => prev.map(i =>
      i.id === id ? { ...i, status: 'error', error } : i
    ))
  }

  const processFiles = useCallback((files: File[]) => {
    if (!weddingId) {
      toast({ title: 'Select a wedding first', variant: 'warning' })
      return
    }
    if (uploadItems.length + files.length > MAX_BATCH) {
      toast({ title: `Maximum ${MAX_BATCH} files per batch`, variant: 'warning' })
      return
    }
    const newItems: UploadItem[] = []
    files.forEach((file) => {
      const validationError = validateFile(file)
      const id = generateId()
      const preview = URL.createObjectURL(file)
      previewsRef.current.set(id, preview)
      previewFilesRef.current.set(id, file)
      newItems.push({
        id,
        name: file.name,
        size: file.size,
        progress: 0,
        status: validationError ? 'error' : ('queued' as UploadStatus),
        weddingId,
        albumId: albumId || undefined,
        folderId: folderId || undefined,
        error: validationError || undefined,
      })
    })
    setUploadItems(prev => [...prev, ...newItems])
    setSummary(null)
  }, [weddingId, albumId, folderId, toast, uploadItems.length])

  const readFilesFromDataTransfer = useCallback(async (items: DataTransferItem[]): Promise<File[]> => {
    const files: File[] = []
    const entryQueue: FileSystemEntry[] = []
    for (const item of items) {
      const entry = item.webkitGetAsEntry()
      if (entry) entryQueue.push(entry)
    }
    while (entryQueue.length > 0) {
      const entry = entryQueue.shift()!
      if (entry.isFile) {
        const file = await new Promise<File | null>(resolve => {
          (entry as FileSystemFileEntry).file(f => resolve(f), () => resolve(null))
        })
        if (file) files.push(file)
      } else if (entry.isDirectory) {
        const reader = (entry as FileSystemDirectoryEntry).createReader()
        const subEntries = await new Promise<FileSystemEntry[]>(resolve => {
          reader.readEntries(results => resolve(results), () => resolve([]))
        })
        entryQueue.push(...subEntries)
      }
    }
    return files
  }, [])

  const addFiles = useCallback((fileList: FileList | File[]) => {
    processFiles(Array.from(fileList))
  }, [processFiles])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const hasFolder = Array.from(e.dataTransfer.items).some(item => {
        const entry = item.webkitGetAsEntry()
        return entry && entry.isDirectory
      })
      if (hasFolder) {
        const files = await readFilesFromDataTransfer(Array.from(e.dataTransfer.items))
        addFiles(files)
      } else {
        addFiles(e.dataTransfer.files)
      }
    } else if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
    }
  }, [addFiles, readFilesFromDataTransfer])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files)
    e.target.value = ''
  }, [addFiles])

  const handleFolderSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files)
    e.target.value = ''
  }, [addFiles])

  const removeItem = useCallback((id: string) => {
    const url = previewsRef.current.get(id)
    if (url) {
      URL.revokeObjectURL(url)
      previewsRef.current.delete(id)
    }
    previewFilesRef.current.delete(id)
    setUploadItems(prev => prev.filter(i => i.id !== id))
    setPausedIds(prev => { const next = new Set(prev); next.delete(id); return next })
  }, [])

  const handlePause = useCallback((id: string) => {
    setPausedIds(prev => { const next = new Set(prev); next.add(id); return next })
  }, [])

  const handleResume = useCallback((id: string) => {
    setPausedIds(prev => { const next = new Set(prev); next.delete(id); return next })
  }, [])

  const handleRetry = useCallback((id: string) => {
    setUploadItems(prev => prev.map(i =>
      i.id === id ? { ...i, progress: 0, status: 'queued', error: undefined } : i
    ))
    setPausedIds(prev => { const next = new Set(prev); next.delete(id); return next })
  }, [])

  const handlePauseAll = useCallback(() => {
    const uploadingIds = uploadItems.filter(i => i.status === 'uploading').map(i => i.id)
    setPausedIds(prev => {
      const next = new Set(prev)
      uploadingIds.forEach(id => next.add(id))
      return next
    })
  }, [uploadItems])

  const handleResumeAll = useCallback(() => {
    const toResume = uploadItems.filter(i => i.status === 'uploading' && pausedIds.has(i.id))
    setPausedIds(prev => {
      const next = new Set(prev)
      toResume.forEach(i => next.delete(i.id))
      return next
    })
  }, [uploadItems, pausedIds])

  const handleCancelAll = useCallback(() => {
    const removable = uploadItems.filter(i => i.status === 'queued' || i.status === 'uploading')
    const ids = removable.map(i => i.id)
    ids.forEach(id => {
      const url = previewsRef.current.get(id)
      if (url) {
        URL.revokeObjectURL(url)
        previewsRef.current.delete(id)
      }
      previewFilesRef.current.delete(id)
    })
    if (sessionIdRef.current) {
      cancelUploadSession(sessionIdRef.current).catch(() => {})
      sessionIdRef.current = null
    }
    setUploadItems(prev => prev.filter(i => i.status !== 'queued' && i.status !== 'uploading'))
    setPausedIds(new Set())
    setIsUploading(false)
  }, [uploadItems])

  const handleClearCompleted = useCallback(() => {
    const completedIds = uploadItems.filter(i => i.status === 'completed').map(i => i.id)
    completedIds.forEach(id => {
      const url = previewsRef.current.get(id)
      if (url) { URL.revokeObjectURL(url); previewsRef.current.delete(id) }
      previewFilesRef.current.delete(id)
    })
    setUploadItems(prev => prev.filter(i => i.status !== 'completed'))
  }, [uploadItems])

  const handleClearAll = useCallback(() => {
    clearIntervals()
    previewsRef.current.forEach(url => URL.revokeObjectURL(url))
    previewsRef.current.clear()
    previewFilesRef.current.clear()
    if (sessionIdRef.current) {
      cancelUploadSession(sessionIdRef.current).catch(() => {})
      sessionIdRef.current = null
    }
    setUploadItems([])
    setPausedIds(new Set())
    setIsUploading(false)
    setSummary(null)
  }, [clearIntervals])

  useEffect(() => {
    if (allDone && uploadItems.length > 0) {
      setIsUploading(false)
      const all = uploadItems
      const completed = all.filter(i => i.status === 'completed')
      const errors = all.filter(i => i.status === 'error')
      setSummary({
        totalFiles: completed.length,
        totalSize: completed.reduce((s, i) => s + i.size, 0),
        errorCount: errors.length,
      })
    }
  }, [allDone, uploadItems])

  const uploadingAndPaused = uploadItems.filter(i => i.status === 'uploading')
  const remainingQueued = uploadItems.filter(i => i.status === 'queued')
  const remainingFailed = uploadItems.filter(i => i.status === 'error')
  const remainingCompleted = uploadItems.filter(i => i.status === 'completed')

  const itemMotion = {
    initial: { opacity: 0, x: -20, height: 0 },
    animate: { opacity: 1, x: 0, height: 'auto' },
    exit: { opacity: 0, x: 20, height: 0, transition: { duration: 0.2 } },
  }

  const progressBarColor = (status: string) => {
    if (status === 'completed') return 'bg-gradient-to-r from-green-500 to-green-400'
    if (status === 'error') return 'bg-gradient-to-r from-red-500 to-red-400'
    if (status === 'processing') return 'bg-gradient-to-r from-yellow-500 to-yellow-400'
    return 'bg-gradient-to-r from-gold to-[#F0D68A]'
  }

  function renderQueueItem(item: UploadItem) {
    const previewUrl = previewsRef.current.get(item.id)
    const isPaused = pausedIds.has(item.id)

    return (
      <motion.div
        key={item.id}
        layout
        initial={itemMotion.initial}
        animate={itemMotion.animate}
        exit={itemMotion.exit}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-sm hover:border-gold/20 hover:shadow-gold/5 transition-all duration-300"
      >
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-sm">
          {previewUrl ? (
            <img src={previewUrl} alt={item.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Icon name="image" size={20} className="text-muted" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-muted">
                <span>{formatBytes(item.size)}</span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Badge variant={statusBadgeVariant[item.status]} className="shrink-0 capitalize flex items-center gap-1">
                {item.status === 'uploading' && <Icon name="upload" size={10} />}
                {item.status === 'completed' && <Icon name="check" size={10} />}
                {item.status === 'error' && <Icon name="alert-circle" size={10} />}
                {item.status === 'processing' && <Icon name="refresh" size={10} />}
                {item.status === 'queued' && <Icon name="more-horizontal" size={10} />}
                {isPaused ? 'Paused' : item.status}
              </Badge>
            </div>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-white/5 ring-1 ring-inset ring-white/[0.02]">
            <motion.div
              className={cn(
                'relative h-full rounded-full',
                progressBarColor(item.status),
                item.status === 'uploading' && 'overflow-hidden'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${item.progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {item.status === 'uploading' && !isPaused && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
              )}
            </motion.div>
          </div>

          <div className="flex items-center gap-1.5">
            {item.status === 'uploading' && !isPaused && (
              <button onClick={() => handlePause(item.id)} className="rounded p-1 text-muted hover:bg-white/5 hover:text-foreground transition-colors" title="Pause">
                <Icon name="pause" size={14} />
              </button>
            )}
            {(item.status === 'uploading' && isPaused) && (
              <button onClick={() => handleResume(item.id)} className="rounded p-1 text-muted hover:bg-white/5 hover:text-foreground transition-colors" title="Resume">
                <Icon name="play" size={14} />
              </button>
            )}
            {(item.status === 'queued') && (
              <button onClick={() => removeItem(item.id)} className="rounded p-1 text-muted hover:bg-white/5 hover:text-foreground transition-colors" title="Cancel">
                <Icon name="x" size={14} />
              </button>
            )}
            {item.status === 'error' && !item.error?.includes('Invalid') && (
              <button onClick={() => handleRetry(item.id)} className="rounded p-1 text-muted hover:bg-white/5 hover:text-foreground transition-colors" title="Retry">
                <Icon name="refresh" size={14} />
              </button>
            )}
            {item.status === 'error' && (
              <button onClick={() => removeItem(item.id)} className="rounded p-1 text-muted hover:bg-white/5 hover:text-foreground transition-colors" title="Remove">
                <Icon name="trash" size={14} />
              </button>
            )}
            {item.status === 'completed' && (
              <button onClick={() => removeItem(item.id)} className="rounded p-1 text-muted hover:bg-white/5 hover:text-foreground transition-colors" title="Remove">
                <Icon name="x" size={14} />
              </button>
            )}
          </div>

          {item.error && (
            <p className="text-xs text-red-400">{item.error}</p>
          )}
        </div>
      </motion.div>
    )
  }

  function renderFileGroup(title: string, items: UploadItem[], icon: string, count: number) {
    if (items.length === 0) return null
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Icon name={icon} size={16} />
          <span>{title}</span>
          <span className="ml-auto text-xs">{count}</span>
        </div>
        <AnimatePresence mode="popLayout">
          {items.map(renderQueueItem)}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Upload' }]} />

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-serif text-3xl text-foreground">Upload Photos</h1>
              <p className="mt-1 text-sm text-muted">Upload and manage your wedding photos</p>
            </div>
            {uploadItems.length > 0 && !allDone && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
                  {hasActiveUploads && (
                    <Button variant="ghost" size="sm" onClick={handlePauseAll}>
                      <Icon name="pause" size={14} />
                      Pause
                    </Button>
                  )}
                  {hasPausedItems && (
                    <Button variant="ghost" size="sm" onClick={handleResumeAll}>
                      <Icon name="play" size={14} />
                      Resume
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={handleCancelAll}>
                    <Icon name="x" size={14} />
                    Cancel
                  </Button>
                </div>
                <Button
                  onClick={handleStartUpload}
                  disabled={isUploading || queuedItems.length === 0}
                  loading={isUploading}
                  size="sm"
                  className={cn(
                    queuedItems.length > 0 && !isUploading && 'shadow-lg shadow-gold/20'
                  )}
                >
                  <Icon name="upload" size={14} />
                  {isUploading ? `Uploading ${activeUploadingItems.length}...` : `Upload ${queuedItems.length} Files`}
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Wedding *"
            placeholder={loadingWeddings ? 'Loading...' : 'Select a wedding'}
            options={weddingOptions}
            value={weddingId}
            onChange={e => { setWeddingId(e.target.value); setAlbumId(''); setFolderId('') }}
          />
          <Select
            label="Album (optional)"
            placeholder="Select album"
            options={albumOptions}
            value={albumId}
            onChange={e => setAlbumId(e.target.value)}
            disabled={!weddingId}
          />
          <Select
            label="Folder (optional)"
            placeholder="Select folder"
            options={folderOptions}
            value={folderId}
            onChange={e => setFolderId(e.target.value)}
            disabled={!weddingId}
          />
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-16 transition-all duration-300',
            isDragOver
              ? 'border-gold bg-gold/5 shadow-[0_0_30px_rgba(212,175,55,0.15)]'
              : 'border-border hover:border-gold/50 hover:bg-white/[0.02]'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPT_STRING}
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            // @ts-expect-error webkitdirectory is non-standard
            webkitdirectory=""
            className="hidden"
            onChange={handleFolderSelect}
          />
          <motion.div
            animate={{ y: isDragOver ? -4 : 0, scale: isDragOver ? 1.1 : 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10 ring-1 ring-gold/20"
          >
            <Icon name="upload" size={28} className="text-gold" />
          </motion.div>
          <motion.p
            animate={{ y: isDragOver ? -2 : 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="mt-4 font-serif text-lg text-foreground"
          >
            {isDragOver ? 'Drop files here' : 'Drag & drop photos here'}
          </motion.p>
          <p className="mt-1 text-sm text-muted/80">
            or click to browse &mdash; <span className="text-gold/70">JPEG</span>, <span className="text-gold/70">PNG</span>, <span className="text-gold/70">WebP</span>, <span className="text-gold/70">HEIC</span> &bull; up to 50MB each
          </p>
          <div className="mt-4 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
            >
              <Icon name="image" size={14} />
              Select Files
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={e => { e.stopPropagation(); folderInputRef.current?.click() }}
            >
              <Icon name="folder" size={14} />
              Select Folder
            </Button>
          </div>
        </div>

        {uploadItems.length > 0 && (
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle>Upload Queue ({uploadItems.length} files)</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <span>{completedItems.length} completed</span>
                  <span className="text-white/20">|</span>
                  <span>{failedItems.length} failed</span>
                  {allDone && (
                    <Button variant="ghost" size="sm" onClick={handleClearAll}>
                      <Icon name="trash" size={14} />
                      Clear All
                    </Button>
                  )}
                  {completedItems.length > 0 && !allDone && (
                    <Button variant="ghost" size="sm" onClick={handleClearCompleted}>
                      <Icon name="x" size={14} />
                      Clear Completed
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>Overall Progress</span>
                  <span>{overallProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-gold to-[#F0D68A]"
                    initial={{ width: 0 }}
                    animate={{ width: `${overallProgress}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
              </div>

              <div className="max-h-[480px] space-y-4 overflow-y-auto pr-1 custom-scrollbar">
                {uploadingAndPaused.length > 0 && renderFileGroup('Active Uploads', uploadingAndPaused, 'upload', uploadingAndPaused.length)}
                {remainingQueued.length > 0 && renderFileGroup('Queued', remainingQueued, 'more-horizontal', remainingQueued.length)}
                {completedItems.length > 0 && renderFileGroup('Completed', completedItems, 'check-circle', completedItems.length)}
                {failedItems.length > 0 && renderFileGroup('Failed', failedItems, 'alert-circle', failedItems.length)}
              </div>
            </CardContent>
          </Card>
        )}

        <AnimatePresence>
          {summary && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <Card className="border-gold/30 bg-gradient-to-br from-card via-gold/[0.03] to-gold/5 shadow-lg shadow-gold/5">
                <CardContent className="space-y-5 p-6">
                  <div className="flex items-center gap-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 ring-1 ring-green-500/20"
                    >
                      <Icon name="check-circle" size={24} className="text-green-400" />
                    </motion.div>
                    <div>
                      <CardTitle className="font-serif text-xl">Upload Complete</CardTitle>
                      <p className="text-sm text-muted/80">All files have been processed successfully</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-4 text-center transition-colors hover:border-gold/20">
                      <p className="font-serif text-2xl font-bold text-foreground">{summary.totalFiles}</p>
                      <p className="mt-1 text-xs text-muted/70">Files Uploaded</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-4 text-center transition-colors hover:border-gold/20">
                      <p className="font-serif text-2xl font-bold text-foreground">{formatBytes(summary.totalSize)}</p>
                      <p className="mt-1 text-xs text-muted/70">Total Size</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-4 text-center transition-colors hover:border-red-500/20">
                      <p className={cn('font-serif text-2xl font-bold', summary.errorCount > 0 ? 'text-red-400' : 'text-foreground')}>
                        {summary.errorCount}
                      </p>
                      <p className="mt-1 text-xs text-muted/70">Errors</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-1">
                    <Button variant="outline" onClick={handleClearAll} className="group">
                      <Icon name="upload" size={16} className="transition-transform group-hover:-translate-y-0.5" />
                      Upload More
                    </Button>
                    <Link href={`/weddings/${weddingId}/gallery`}>
                      <Button className="group">
                        <Icon name="eye" size={16} className="transition-transform group-hover:scale-110" />
                        View Gallery
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthGuard>
  )
}
