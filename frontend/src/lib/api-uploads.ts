import { apiFetch, apiFetchWithProgress } from './api'

export interface UploadFileMeta {
  name: string
  size: number
  content_type: string
}

export interface UploadFileAllocation {
  file_id: string
  filename: string
  size: number
  content_type: string
  upload_url: string
}

export interface UploadInitResponse {
  upload_id: string
  files: UploadFileAllocation[]
}

export interface UploadProgressResponse {
  upload_id: string
  total_files: number
  completed: number
  failed: number
  progress_percent: number
}

export interface PhotoResponse {
  id: string
  wedding_id: string
  album_id: string | null
  folder_id: string | null
  filename: string
  original_url: string
  medium_url: string | null
  thumbnail_url: string | null
  blur_hash: string | null
  alt_text: string | null
  width: number | null
  height: number | null
  file_size: number | null
  content_type: string | null
  camera: string | null
  lens: string | null
  aperture: string | null
  shutter_speed: string | null
  iso: number | null
  focal_length: string | null
  date_taken: string | null
  favorite: boolean
  is_highlight: boolean
  is_hidden: boolean
  created_at: string
}

export type UploadStatus = 'queued' | 'uploading' | 'processing' | 'completed' | 'error'

export interface UploadItem {
  id: string
  name: string
  size: number
  progress: number
  status: UploadStatus
  weddingId: string
  albumId?: string
  folderId?: string
  error?: string
  response?: PhotoResponse
}

export async function initUploadSession(
  weddingId: string,
  files: UploadFileMeta[],
  albumId?: string,
  folderId?: string,
): Promise<UploadInitResponse> {
  return apiFetch<UploadInitResponse>('/api/v1/upload/init', {
    method: 'POST',
    body: JSON.stringify({
      wedding_id: weddingId,
      album_id: albumId || null,
      folder_id: folderId || null,
      files,
    }),
  })
}

export async function uploadFile(
  uploadId: string,
  fileId: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<PhotoResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiFetchWithProgress(
    `/api/v1/upload/${uploadId}/files/${fileId}`,
    formData,
    onProgress,
  )

  return response.json()
}

export async function getUploadProgress(uploadId: string): Promise<UploadProgressResponse> {
  return apiFetch<UploadProgressResponse>(`/api/v1/upload/${uploadId}/progress`)
}

export async function cancelUploadSession(uploadId: string): Promise<void> {
  await apiFetch(`/api/v1/upload/${uploadId}/cancel`, { method: 'POST' })
}
