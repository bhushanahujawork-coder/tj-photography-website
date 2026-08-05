import type { Wedding, Photo, Album, Folder, Participant, DashboardStats, AnalyticsData, ActivityLog, Notification, ShareLink, DownloadRecord, AppSettings, StorageInfo } from '@/types/platform'

const NOW = new Date().toISOString()
const DAY = (n: number) => new Date(Date.now() - n * 86400000).toISOString()

export const MOCK_USER = {
  id: 'usr-1',
  name: 'TJ',
  email: 'tj@tjphotography.com',
  phone: '+1 (555) 100-0001',
  role: 'admin' as const,
  isActive: true,
  isVerified: true,
  createdAt: DAY(365),
  lastLoginAt: NOW,
}

export const MOCK_WEDDINGS: Wedding[] = [
  { id: 'wed-1', weddingName: 'Sunset Elegance', brideName: 'Sophia', groomName: 'Alexander', weddingDate: '2024-06-15T00:00:00Z', location: 'Tuscany, Italy', weddingCode: 'SUNSET24', status: 'active', visibility: 'public', totalPhotos: 26, totalAlbums: 3, totalFolders: 3, photographerId: 'usr-1', createdAt: DAY(200), updatedAt: DAY(0) },
  { id: 'wed-2', weddingName: 'Golden Hour Romance', brideName: 'Isabella', groomName: 'Benjamin', weddingDate: '2024-08-20T00:00:00Z', location: 'Santorini, Greece', weddingCode: 'GOLDEN20', status: 'active', visibility: 'public', totalPhotos: 15, totalAlbums: 2, totalFolders: 2, photographerId: 'usr-2', createdAt: DAY(150), updatedAt: DAY(1) },
  { id: 'wed-3', weddingName: 'Winter Whispers', brideName: 'Charlotte', groomName: 'Daniel', weddingDate: '2024-12-05T00:00:00Z', location: 'Aspen, Colorado', weddingCode: 'WINTER05', status: 'active', visibility: 'private', totalPhotos: 0, totalAlbums: 0, totalFolders: 0, photographerId: 'usr-1', createdAt: DAY(100), updatedAt: DAY(2) },
  { id: 'wed-4', weddingName: 'Garden Serenade', brideName: 'Amelia', groomName: 'Ethan', weddingDate: '2025-03-10T00:00:00Z', location: 'Cotswolds, England', weddingCode: 'GARDEN10', status: 'draft', visibility: 'private', totalPhotos: 0, totalAlbums: 0, totalFolders: 0, photographerId: 'usr-2', createdAt: DAY(60), updatedAt: DAY(3) },
  { id: 'wed-5', weddingName: 'Coastal Dreams', brideName: 'Olivia', groomName: 'William', weddingDate: '2024-09-28T00:00:00Z', location: 'Amalfi Coast, Italy', weddingCode: 'COAST28', status: 'active', visibility: 'public', totalPhotos: 15, totalAlbums: 0, totalFolders: 0, photographerId: 'usr-1', createdAt: DAY(120), updatedAt: DAY(4) },
  { id: 'wed-6', weddingName: 'Vintage Charm', brideName: 'Ella', groomName: 'James', weddingDate: '2024-04-12T00:00:00Z', location: 'Provence, France', weddingCode: 'VINTAGE12', status: 'archived', visibility: 'private', totalPhotos: 0, totalAlbums: 0, totalFolders: 0, photographerId: 'usr-1', createdAt: DAY(300), updatedAt: DAY(200) },
]

export function getMockWedding(idOrCode: string): Wedding | undefined {
  return MOCK_WEDDINGS.find(w => w.id === idOrCode || w.weddingCode === idOrCode)
}

export const MOCK_ALBUMS: Album[] = [
  { id: 'album-1', weddingId: 'wed-1', name: 'Ceremony', description: 'The beautiful ceremony', photoCount: 8, sortOrder: 1, createdAt: DAY(200) },
  { id: 'album-2', weddingId: 'wed-1', name: 'Reception', description: 'Evening celebration', photoCount: 12, sortOrder: 2, createdAt: DAY(200) },
  { id: 'album-3', weddingId: 'wed-1', name: 'Portraits', description: 'Couple portraits', photoCount: 6, sortOrder: 3, createdAt: DAY(200) },
  { id: 'album-4', weddingId: 'wed-2', name: 'Getting Ready', photoCount: 10, sortOrder: 1, createdAt: DAY(150) },
  { id: 'album-5', weddingId: 'wed-2', name: 'First Dance', photoCount: 5, sortOrder: 2, createdAt: DAY(150) },
]

export const MOCK_FOLDERS: Folder[] = [
  { id: 'folder-1', weddingId: 'wed-1', name: 'Raw Edits', photoCount: 10, sortOrder: 1, visibility: 'private', createdAt: DAY(200) },
  { id: 'folder-2', weddingId: 'wed-1', name: 'Final Selections', photoCount: 15, sortOrder: 2, visibility: 'public', createdAt: DAY(200) },
  { id: 'folder-3', weddingId: 'wed-1', name: 'BTS', photoCount: 8, sortOrder: 3, visibility: 'hidden', createdAt: DAY(200) },
  { id: 'folder-4', weddingId: 'wed-2', name: 'Ceremony', photoCount: 20, sortOrder: 1, visibility: 'public', createdAt: DAY(150) },
  { id: 'folder-5', weddingId: 'wed-2', name: 'Details', photoCount: 6, sortOrder: 2, visibility: 'public', createdAt: DAY(150) },
]

export const MOCK_PHOTOS: Photo[] = Array.from({ length: 50 }, (_, i) => ({
  id: `photo-${i + 1}`,
  weddingId: i < 20 ? 'wed-1' : i < 35 ? 'wed-2' : 'wed-5',
  src: `/placeholder.svg`,
  alt: `Wedding photo ${i + 1}`,
  width: 1200,
  height: 800,
  favorite: i < 5,
  isHighlight: i < 3,
  createdAt: DAY(i),
  folderId: i < 10 ? 'folder-1' : i < 20 ? 'folder-2' : undefined,
  albumId: i < 8 ? 'album-1' : undefined,
}))

export const MOCK_PARTICIPANTS: Participant[] = [
  { id: 'part-1', weddingId: 'wed-1', userId: 'usr-4', name: 'Emily & James', email: 'emily.james@example.com', role: 'client', status: 'accepted', invitedAt: DAY(180), acceptedAt: DAY(170) },
  { id: 'part-2', weddingId: 'wed-1', name: 'Lisa Parker', email: 'lisa@example.com', role: 'guest', status: 'pending', invitedAt: DAY(50) },
  { id: 'part-3', weddingId: 'wed-1', name: 'Tom Parker', email: 'tom@example.com', role: 'guest', status: 'accepted', invitedAt: DAY(50), acceptedAt: DAY(45) },
  { id: 'part-4', weddingId: 'wed-2', name: 'Maria Santos', email: 'maria@example.com', role: 'client', status: 'accepted', invitedAt: DAY(140), acceptedAt: DAY(130) },
  { id: 'part-5', weddingId: 'wed-2', name: 'David Kim', email: 'david@example.com', role: 'editor', status: 'pending', invitedAt: DAY(30) },
  { id: 'part-6', weddingId: 'wed-3', name: 'Rachel Green', email: 'rachel@example.com', role: 'client', status: 'accepted', invitedAt: DAY(90), acceptedAt: DAY(85) },
]

export const MOCK_ACTIVITIES: ActivityLog[] = [
  { id: 'act-1', action: 'Uploaded photos', description: '24 photos uploaded to Sunset Elegance', userId: 'usr-1', weddingId: 'wed-1', type: 'upload', createdAt: DAY(0) },
  { id: 'act-2', action: 'Shared gallery', description: 'Shared Sunset Elegance with Emily & James', userId: 'usr-1', weddingId: 'wed-1', type: 'share', createdAt: DAY(0) },
  { id: 'act-3', action: 'Downloaded photos', description: '12 photos downloaded as ZIP', userId: 'usr-4', weddingId: 'wed-1', type: 'download', createdAt: DAY(0) },
  { id: 'act-4', action: 'Created wedding', description: 'Winter Whispers wedding created', userId: 'usr-1', weddingId: 'wed-3', type: 'create', createdAt: DAY(1) },
  { id: 'act-5', action: 'Edited album', description: 'Updated Ceremony album cover', userId: 'usr-2', weddingId: 'wed-1', type: 'edit', createdAt: DAY(2) },
  { id: 'act-6', action: 'Invited participant', description: 'Invited Lisa Parker to Sunset Elegance', userId: 'usr-1', weddingId: 'wed-1', type: 'invite', createdAt: DAY(3) },
  { id: 'act-7', action: 'Deleted photos', description: '3 photos removed from Raw Edits', userId: 'usr-2', weddingId: 'wed-1', type: 'delete', createdAt: DAY(4) },
  { id: 'act-8', action: 'User logged in', description: 'Mike Chen logged in from Chrome on Windows', userId: 'usr-3', type: 'login', createdAt: DAY(5) },
  { id: 'act-9', action: 'Created album', description: 'First Dance album created for Golden Hour Romance', userId: 'usr-2', weddingId: 'wed-2', type: 'create', createdAt: DAY(6) },
  { id: 'act-10', action: 'Downloaded photos', description: 'Bulk download of 48 photos', userId: 'usr-4', weddingId: 'wed-1', type: 'download', createdAt: DAY(7) },
  { id: 'act-11', action: 'Updated settings', description: 'Changed watermark position to bottom-right', userId: 'usr-1', type: 'edit', createdAt: DAY(8) },
  { id: 'act-12', action: 'Uploaded photos', description: '56 photos uploaded to Coastal Dreams', userId: 'usr-1', weddingId: 'wed-5', type: 'upload', createdAt: DAY(9) },
]

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'notif-1', userId: 'usr-1', title: 'Upload complete', description: '24 photos uploaded to Sunset Elegance gallery', type: 'success', read: false, link: '/weddings/wed-1/gallery', createdAt: DAY(0) },
  { id: 'notif-2', userId: 'usr-1', title: 'New download', description: 'Emily & James downloaded 12 photos', type: 'info', read: false, link: '/downloads', createdAt: DAY(0) },
  { id: 'notif-3', userId: 'usr-1', title: 'Participant joined', description: 'Lisa Parker accepted invitation to Sunset Elegance', type: 'success', read: false, link: '/participants', createdAt: DAY(0) },
  { id: 'notif-4', userId: 'usr-1', title: 'Storage warning', description: 'You have used 85% of your storage limit', type: 'warning', read: true, link: '/storage', createdAt: DAY(1) },
  { id: 'notif-5', userId: 'usr-2', title: 'Gallery shared', description: 'Winter Whispers gallery shared via link', type: 'info', read: true, createdAt: DAY(2) },
  { id: 'notif-6', userId: 'usr-1', title: 'New client registration', description: 'Rachel Green registered as a client', type: 'info', read: true, link: '/participants', createdAt: DAY(3) },
]

export const MOCK_SHARE_LINKS: ShareLink[] = [
  { id: 'sl-1', weddingId: 'wed-1', code: 'SUNSET24', url: '/gallery/SUNSET24', role: 'client', downloadEnabled: true, accessCount: 47, createdAt: DAY(30) },
  { id: 'sl-2', weddingId: 'wed-1', code: 'SUNSET-GUEST', url: '/gallery/SUNSET-GUEST', role: 'guest', downloadEnabled: false, expiresAt: DAY(-30), accessCount: 12, createdAt: DAY(7) },
  { id: 'sl-3', weddingId: 'wed-2', code: 'GOLDEN20', url: '/gallery/GOLDEN20', role: 'client', downloadEnabled: true, accessCount: 89, createdAt: DAY(60) },
  { id: 'sl-4', weddingId: 'wed-5', code: 'COAST28', url: '/gallery/COAST28', role: 'editor', downloadEnabled: true, expiresAt: DAY(-14), accessCount: 5, createdAt: DAY(3) },
]

export const MOCK_DOWNLOADS: DownloadRecord[] = [
  { id: 'dl-1', weddingId: 'wed-1', weddingName: 'Sunset Elegance', userName: 'Emily & James', type: 'zip', photoCount: 24, totalSize: 156_000_000, status: 'completed', createdAt: DAY(0) },
  { id: 'dl-2', weddingId: 'wed-1', weddingName: 'Sunset Elegance', type: 'single', photoCount: 3, totalSize: 18_000_000, status: 'completed', createdAt: DAY(0) },
  { id: 'dl-3', weddingId: 'wed-2', weddingName: 'Golden Hour Romance', userName: 'Maria Santos', type: 'bulk', photoCount: 48, totalSize: 312_000_000, status: 'completed', createdAt: DAY(1) },
  { id: 'dl-4', weddingId: 'wed-5', weddingName: 'Coastal Dreams', type: 'multiple', photoCount: 12, totalSize: 78_000_000, status: 'completed', createdAt: DAY(2) },
  { id: 'dl-5', weddingId: 'wed-1', weddingName: 'Sunset Elegance', type: 'zip', photoCount: 24, totalSize: 156_000_000, status: 'failed', createdAt: DAY(3) },
  { id: 'dl-6', weddingId: 'wed-3', weddingName: 'Winter Whispers', userName: 'Rachel Green', type: 'single', photoCount: 1, totalSize: 6_000_000, status: 'processing', createdAt: DAY(4) },
  { id: 'dl-7', weddingId: 'wed-2', weddingName: 'Golden Hour Romance', type: 'zip', photoCount: 56, totalSize: 420_000_000, status: 'completed', createdAt: DAY(5) },
]

export const MOCK_SETTINGS: AppSettings = {
  general: { siteName: 'TJ Photography', dateFormat: 'YYYY-MM-DD', timezone: 'UTC', language: 'en' },
  gallery: { visibility: 'public', downloadEnabled: true, shareEnabled: true, screenshotProtection: false, anonymousViewing: true, watermarkEnabled: false, pinProtection: false },
  downloads: { singleEnabled: true, multipleEnabled: true, bulkEnabled: true, zipEnabled: true, pinRequired: false },
  branding: { photographerLogo: '', watermarkPosition: 'bottom-right', watermarkSize: 10, watermarkType: 'text', watermarkText: 'TJ Photography', galleryTheme: 'dark', primaryColor: '#D4AF37', typography: { headings: 'Playfair Display', body: 'Inter' } },
  theme: { mode: 'dark', primaryColor: '#D4AF37' },
  sorting: { defaultSort: 'newest' },
}

export const MOCK_STORAGE: StorageInfo = { usedBytes: 2_478_000_000, limitBytes: 10_000_000_000, photoCount: 1423, videoCount: 24, albumCount: 15, usedPercentage: 24.78 }

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalWeddings: 6,
  totalPhotos: 1423,
  totalStorage: 2_478_000_000,
  totalDownloads: 156,
  activeUsers: 12,
  storageUsed: 2_478_000_000,
  storageLimit: 10_000_000_000,
  recentWeddings: MOCK_WEDDINGS.slice(0, 3),
}

export const MOCK_ANALYTICS: AnalyticsData = {
  dailyViews: Array.from({ length: 30 }, (_, i) => ({ date: DAY(29 - i), count: Math.floor(Math.random() * 100) + 10 })),
  dailyDownloads: Array.from({ length: 30 }, (_, i) => ({ date: DAY(29 - i), count: Math.floor(Math.random() * 20) })),
  storageGrowth: Array.from({ length: 12 }, (_, i) => ({ date: `2024-${String(i + 1).padStart(2, '0')}-01`, used: (i + 1) * 200_000_000 })),
  topWeddings: MOCK_WEDDINGS.slice(0, 4).map(w => ({ id: w.id, name: w.weddingName, views: Math.floor(Math.random() * 500), downloads: Math.floor(Math.random() * 50) })),
  viewsByDevice: [{ type: 'Desktop', count: 1240 }, { type: 'Mobile', count: 890 }, { type: 'Tablet', count: 210 }],
  viewsByLocation: [{ country: 'United States', count: 850 }, { country: 'United Kingdom', count: 320 }, { country: 'Canada', count: 180 }, { country: 'Australia', count: 95 }],
  totalViews: 2340,
  totalDownloads: 156,
  averageSessionDuration: '4m 32s',
  bounceRate: '32%',
  activeUsers: 12,
}

export function resolveMock(path: string, method: string, body?: unknown): unknown {
  const segments = path.split('?')[0].split('/').filter(Boolean)

  const tryMatch = (pattern: string[], extractId?: (m: RegExpMatchArray) => string): unknown => {
    const re = new RegExp('^' + pattern.map(s => s.replace(/\{id\}/g, '([^/]+)')).join('/') + '$', 'i')
    const full = segments.join('/')
    const m = full.match(re)
    if (!m) return undefined
    const id = extractId?.(m)

    if (method === 'GET') {
      if (full === 'api/v1/weddings') {
        const url = new URL(path, 'http://x')
        const limit = parseInt(url.searchParams.get('page_size') || '100')
        return { items: MOCK_WEDDINGS.slice(0, limit), total: MOCK_WEDDINGS.length }
      }
      if (full === 'api/v1/weddings/by-code' && id) return getMockWedding(id) || null
      if (full.match(/^api\/v1\/weddings\/[^/]+$/) && id) return getMockWedding(id) || null
      if (full.match(/^api\/v1\/weddings\/[^/]+\/albums$/) && id) return MOCK_ALBUMS.filter(a => a.weddingId === id)
      if (full.match(/^api\/v1\/weddings\/[^/]+\/folders$/) && id) return MOCK_FOLDERS.filter(f => f.weddingId === id)
      if (full.match(/^api\/v1\/weddings\/[^/]+\/photos/) && id) return { items: MOCK_PHOTOS.filter(p => p.weddingId === id), total: MOCK_PHOTOS.filter(p => p.weddingId === id).length }
      if (full.match(/^api\/v1\/weddings\/[^/]+\/participants/) && id) return MOCK_PARTICIPANTS.filter(p => p.weddingId === id)
      if (full === 'api/v1/dashboard/stats') return MOCK_DASHBOARD_STATS
      if (full === 'api/v1/dashboard/analytics') return MOCK_ANALYTICS
      if (full === 'api/v1/downloads' || full.startsWith('api/v1/downloads')) return { items: MOCK_DOWNLOADS, total: MOCK_DOWNLOADS.length }
      if (full === 'api/v1/activity' || full.startsWith('api/v1/activity')) return { items: MOCK_ACTIVITIES, total: MOCK_ACTIVITIES.length }
      if (full === 'api/v1/notifications' || full.startsWith('api/v1/notifications')) return { items: MOCK_NOTIFICATIONS, total: MOCK_NOTIFICATIONS.length }
      if (full === 'api/v1/users/me') return MOCK_USER
      if (full === 'api/v1/storage/usage') return MOCK_STORAGE
      if (full === 'api/v1/settings') return MOCK_SETTINGS
      if (full === 'api/v1/share-links') return { items: MOCK_SHARE_LINKS, total: MOCK_SHARE_LINKS.length }
      if (full.match(/^api\/v1\/weddings\/[^/]+\/publish$/) && id) return { success: true }
      if (full.match(/^api\/v1\/weddings\/[^/]+\/archive$/) && id) return { success: true }
    }

    if (method === 'POST') {
      if (full === 'api/v1/auth/login') {
        return { user: MOCK_USER, accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token', expiresAt: new Date(Date.now() + 86400000 * 7).toISOString() }
      }
      if (full === 'api/v1/weddings') {
        const input = (typeof body === 'string' ? JSON.parse(body) : body || {}) as Record<string, unknown>
        return {
          id: 'wed-new-' + Date.now(),
          weddingName: input.weddingName || 'New Wedding',
          brideName: input.brideName || '',
          groomName: input.groomName || '',
          weddingDate: input.weddingDate || NOW,
          location: input.location || '',
          weddingCode: input.weddingCode || '',
          status: 'draft',
          visibility: 'private',
          totalPhotos: 0, totalAlbums: 0, totalFolders: 0,
          photographerId: 'usr-1',
          createdAt: NOW, updatedAt: NOW,
        }
      }
      if (full.match(/^api\/v1\/weddings\/[^/]+\/duplicate$/) && id) {
        const original = getMockWedding(id)
        return original ? { ...original, id: 'wed-' + Date.now(), weddingName: original.weddingName + ' (Copy)', weddingCode: original.weddingCode + '-COPY', createdAt: NOW, updatedAt: NOW, status: 'draft' } : { success: true }
      }
    }

    if (method === 'PATCH') {
      if (full === 'api/v1/settings/gallery' || full === 'api/v1/settings/downloads' || full === 'api/v1/settings/branding' || full === 'api/v1/settings/theme') return { success: true }
    }

    if (method === 'DELETE') {
      if (full.match(/^api\/v1\/weddings\/[^/]+$/) && id) return { success: true }
    }

    return { success: true }
  }

  return tryMatch(['api', 'v1', '{id}', ...(segments.slice(3).map(() => '{id}'))], m => m[1])
}
