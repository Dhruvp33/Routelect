import { create } from 'zustand'
import { persist } from 'zustand/middleware'

let _toastId = 0

/* ── Apply theme to <html> so CSS vars switch ── */
export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

export const useStore = create(
  persist(
    (set, get) => ({
      // ── Car ──
      selectedCar: null,
      setSelectedCar: (car) => set({ selectedCar: car }),

      // ── Backend status ──
      backendStatus: false,
      setBackendStatus: (s) => set({ backendStatus: s }),

      // ── Battery ──
      currentBatteryPercent: 85,
      setCurrentBatteryPercent: (v) => set({ currentBatteryPercent: v }),
      _carToastShown: false,
      setCarToastShown: () => set({ _carToastShown: true }),

      // ── Theme ──
      theme: 'dark',
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        applyTheme(next)
        set({ theme: next })
      },

      // ── Trip history ──
      tripHistory: [],
      addToHistory: (entry) =>
        set((s) => ({ tripHistory: [...s.tripHistory, { ...entry, id: Date.now() }] })),
      removeFromHistory: (id) =>
        set((s) => ({ tripHistory: s.tripHistory.filter((t) => t.id !== id) })),
      clearHistory: () => set({ tripHistory: [] }),

      // ── Toasts ──
      toasts: [],
      addToast: (type, message) => {
        const id = ++_toastId
        set((s) => ({ toasts: [...s.toasts, { id, type, message }] }))
      },
      removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'routelect-store',
      partialize: (state) => ({
        selectedCar: state.selectedCar,
        currentBatteryPercent: state.currentBatteryPercent,
        _carToastShown: state._carToastShown,
        tripHistory: state.tripHistory,
        theme: state.theme,
      }),
    }
  )
)