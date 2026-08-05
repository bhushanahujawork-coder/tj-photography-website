export type Role = 'admin' | 'photographer' | 'editor' | 'client' | 'guest'

export type Permission = 'view' | 'download' | 'upload' | 'delete' | 'edit' | 'share'

export type GalleryVisibility = 'public' | 'private' | 'hidden'

export type WeddingStatus = 'active' | 'archived' | 'draft'

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  avatarUrl?: string | null
  role: Role
  isActive: boolean
  isVerified: boolean
  createdAt: string
  lastLoginAt?: string | null
}

export interface Session {
  user: User
  token: string
  expiresAt: string
}

export interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface Wedding {
  id: string
  weddingName: string
  brideName: string
  groomName: string
  weddingDate: string
  location: string
  weddingCode: string
  coverImageUrl?: string | null
  status: WeddingStatus
  visibility: GalleryVisibility
  totalPhotos: number
  totalAlbums: number
  totalFolders: number
  photographerId: string
  createdAt: string
  updatedAt: string
  publishedAt?: string | null
}

export interface Photo {
  id: string
  weddingId: string
  src: string
  alt: string
  width: number
  height: number
  blurDataURL?: string
  favorite: boolean
  isHighlight: boolean
  createdAt: string
  exif?: ExifData
  folderId?: string
  albumId?: string
}

export interface ExifData {
  camera?: string
  lens?: string
  aperture?: string
  shutterSpeed?: string
  iso?: number
  focalLength?: string
  dateTaken?: string
}

export interface Album {
  id: string
  weddingId: string
  name: string
  description?: string | null
  coverImageUrl?: string | null
  photoCount: number
  sortOrder: number
  createdAt: string
}

export interface Folder {
  id: string
  weddingId: string
  name: string
  coverImageUrl?: string | null
  photoCount: number
  sortOrder: number
  visibility: GalleryVisibility
  createdAt: string
}

export interface Participant {
  id: string
  weddingId: string
  userId?: string | null
  name: string
  email?: string | null
  phone?: string | null
  role: Role
  status: 'pending' | 'accepted' | 'declined'
  invitedAt: string
  acceptedAt?: string | null
}

export interface PermissionSet {
  view: boolean
  download: boolean
  upload: boolean
  delete: boolean
  edit: boolean
  share: boolean
}

export const DEFAULT_PERMISSIONS: Record<Role, PermissionSet> = {
  admin: { view: true, download: true, upload: true, delete: true, edit: true, share: true },
  photographer: { view: true, download: true, upload: true, delete: true, edit: true, share: true },
  editor: { view: true, download: true, upload: true, delete: false, edit: true, share: false },
  client: { view: true, download: true, upload: false, delete: false, edit: false, share: true },
  guest: { view: true, download: false, upload: false, delete: false, edit: false, share: false },
}

export interface BrandingSettings {
  photographerLogo: string
  watermarkPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  watermarkSize: number
  watermarkType: 'text' | 'logo'
  watermarkText: string
  galleryTheme: 'dark' | 'light' | 'auto'
  primaryColor: string
  typography: {
    headings: string
    body: string
  }
}

export interface GallerySettings {
  visibility: GalleryVisibility
  downloadEnabled: boolean
  shareEnabled: boolean
  screenshotProtection: boolean
  anonymousViewing: boolean
  watermarkEnabled: boolean
  pinProtection: boolean
  pinCode?: string
}

export interface DownloadSettings {
  singleEnabled: boolean
  multipleEnabled: boolean
  bulkEnabled: boolean
  zipEnabled: boolean
  pinRequired: boolean
  pinCode?: string
}

export interface AppSettings {
  general: {
    siteName: string
    dateFormat: string
    timezone: string
    language: string
  }
  gallery: GallerySettings
  downloads: DownloadSettings
  branding: BrandingSettings
  theme: {
    mode: 'dark' | 'light'
    primaryColor: string
  }
  sorting: {
    defaultSort: 'newest' | 'oldest' | 'name' | 'custom'
  }
}

export interface NavItem {
  label: string
  href: string
  icon: string
  badge?: number
  roles?: Role[]
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface ActivityLog {
  id: string
  action: string
  description?: string | null
  userId?: string | null
  userName?: string | null
  weddingId?: string | null
  type: string
  metadata?: Record<string, unknown> | null
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  description?: string | null
  type: string
  read: boolean
  link?: string | null
  createdAt: string
}

export interface UploadItem {
  id: string
  name: string
  size: number
  progress: number
  status: 'queued' | 'uploading' | 'processing' | 'completed' | 'error'
  weddingId: string
  albumId?: string
  folderId?: string
  error?: string
}

export interface ShareLink {
  id: string
  weddingId: string
  code: string
  url: string
  role: Role
  downloadEnabled: boolean
  expiresAt?: string | null
  accessCount: number
  createdAt: string
}

export interface DownloadRecord {
  id: string
  weddingId: string
  weddingName: string
  userName?: string | null
  type: string
  photoCount: number
  totalSize?: number | null
  status: string
  createdAt: string
}

export interface StorageInfo {
  usedBytes: number
  limitBytes: number
  photoCount: number
  videoCount: number
  albumCount: number
  usedPercentage: number
}

export interface DashboardStats {
  totalWeddings: number
  totalPhotos: number
  totalStorage: number
  totalDownloads: number
  activeUsers: number
  storageUsed: number
  storageLimit: number
  recentWeddings: Wedding[]
}

export interface AnalyticsData {
  dailyViews: { date: string; count: number }[]
  dailyDownloads: { date: string; count: number }[]
  storageGrowth: { date: string; used: number }[]
  topWeddings: { id: string; name: string; views: number; downloads: number }[]
  viewsByDevice: { type: string; count: number }[]
  viewsByLocation: { country: string; count: number }[]
  totalViews: number
  totalDownloads: number
  averageSessionDuration: string
  bounceRate: string
  activeUsers: number
}
