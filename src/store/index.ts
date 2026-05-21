import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from '@/utils/axios'

interface CompressConfig {
  customerCompress?: boolean
  compressQuality?: number
  compressBar?: number
  serverCompress?: boolean
  convertToWebp?: boolean
}

interface UrlSettings {
  useCustomUrl: string
  customUrlPrefix: string
}

interface UserConfig {
  siteTitle?: string
  siteIcon?: string
  [key: string]: unknown
}

interface AppState {
  userConfig: UserConfig | null
  bingWallPapers: { url: string }[]
  adminLoggedIn: boolean
  userLoggedIn: boolean
  uploadMethod: string
  uploadCopyUrlForm: string
  compressConfig: CompressConfig
  storeUploadChannel: string
  storeChannelName: string | null
  storeAutoRetry: boolean
  storeUploadNameType: string
  uploadFolder: string
  customUrlSettings: UrlSettings
  adminUrlSettings: UrlSettings
  autoReUpload: boolean
  useDarkMode: boolean | null
  cusDarkMode: boolean

  // Actions
  setUserConfig: (config: UserConfig | null) => void
  setBingWallPapers: (papers: { url: string }[]) => void
  setAdminLoggedIn: (loggedIn: boolean) => void
  setUserLoggedIn: (loggedIn: boolean) => void
  setUploadMethod: (method: string) => void
  setUploadCopyUrlForm: (form: string) => void
  setCompressConfig: (key: string, value: unknown) => void
  setStoreUploadChannel: (channel: string) => void
  setStoreChannelName: (name: string | null) => void
  setStoreAutoRetry: (retry: boolean) => void
  setStoreUploadNameType: (type: string) => void
  setUploadFolder: (folder: string) => void
  setCustomUrlSettings: (key: string, value: string) => void
  setAdminUrlSettings: (key: string, value: string) => void
  setAutoReUpload: (auto: boolean) => void
  setUseDarkMode: (mode: boolean | null) => void
  setCusDarkMode: (cus: boolean) => void
  fetchUserConfig: () => Promise<void>
  fetchBingWallPapers: () => Promise<void>
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userConfig: null,
      bingWallPapers: [],
      adminLoggedIn: false,
      userLoggedIn: false,
      uploadMethod: 'default',
      uploadCopyUrlForm: '',
      compressConfig: {},
      storeUploadChannel: '',
      storeChannelName: null,
      storeAutoRetry: true,
      storeUploadNameType: '',
      uploadFolder: '',
      customUrlSettings: { useCustomUrl: 'false', customUrlPrefix: '' },
      adminUrlSettings: { useCustomUrl: 'false', customUrlPrefix: '' },
      autoReUpload: true,
      useDarkMode: null,
      cusDarkMode: false,

      setUserConfig: (config) => set({ userConfig: config }),
      setBingWallPapers: (papers) => set({ bingWallPapers: papers }),
      setAdminLoggedIn: (loggedIn) => set({ adminLoggedIn: loggedIn }),
      setUserLoggedIn: (loggedIn) => set({ userLoggedIn: loggedIn }),
      setUploadMethod: (method) => set({ uploadMethod: method }),
      setUploadCopyUrlForm: (form) => set({ uploadCopyUrlForm: form }),
      setCompressConfig: (key, value) =>
        set((state) => ({
          compressConfig: { ...state.compressConfig, [key]: value },
        })),
      setStoreUploadChannel: (channel) => set({ storeUploadChannel: channel }),
      setStoreChannelName: (name) => set({ storeChannelName: name }),
      setStoreAutoRetry: (retry) => set({ storeAutoRetry: retry }),
      setStoreUploadNameType: (type) => set({ storeUploadNameType: type }),
      setUploadFolder: (folder) => set({ uploadFolder: folder }),
      setCustomUrlSettings: (key, value) =>
        set((state) => ({
          customUrlSettings: { ...state.customUrlSettings, [key]: value },
        })),
      setAdminUrlSettings: (key, value) =>
        set((state) => ({
          adminUrlSettings: { ...state.adminUrlSettings, [key]: value },
        })),
      setAutoReUpload: (auto) => set({ autoReUpload: auto }),
      setUseDarkMode: (mode) => set({ useDarkMode: mode }),
      setCusDarkMode: (cus) => set({ cusDarkMode: cus }),

      fetchUserConfig: async () => {
        try {
          const response = await axios.get('/api/userConfig')
          set({ userConfig: response.data })
        } catch (error) {
          console.error('Failed to fetch user config:', error)
        }
      },

      fetchBingWallPapers: async () => {
        try {
          const response = await axios.get('/api/bing/wallpaper')
          const wallpapers = response.data.data
          const papers = wallpapers.map((wp: { url: string }) => ({
            url: 'https://www.bing.com' + wp.url,
          }))
          set({ bingWallPapers: papers })
        } catch (error) {
          console.error('Failed to fetch wallpapers:', error)
        }
      },
    }),
    {
      name: 'imgbed-storage',
      partialize: (state) => ({
        userConfig: state.userConfig,
        uploadMethod: state.uploadMethod,
        uploadCopyUrlForm: state.uploadCopyUrlForm,
        compressConfig: state.compressConfig,
        storeUploadChannel: state.storeUploadChannel,
        storeChannelName: state.storeChannelName,
        storeAutoRetry: state.storeAutoRetry,
        storeUploadNameType: state.storeUploadNameType,
        uploadFolder: state.uploadFolder,
        customUrlSettings: state.customUrlSettings,
        adminUrlSettings: state.adminUrlSettings,
        autoReUpload: state.autoReUpload,
        useDarkMode: state.useDarkMode,
        cusDarkMode: state.cusDarkMode,
      }),
    }
  )
)
