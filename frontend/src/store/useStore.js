import { create } from 'zustand'
import { persist } from 'zustand/middleware'

let _toastId = 0

export const useStore = create(
  persist(
    (set) => ({
      // ── Backend ──────────────────────────────────────
      backendStatus: false,
      setBackendStatus: (s) => set({ backendStatus: s }),

      // ── Selected Vehicle ─────────────────────────────
      selectedCar: null,
      setSelectedCar: (car) => set({ selectedCar: car }),

      // ── Battery ──────────────────────────────────────
      currentBatteryPercent: 80,
      setCurrentBatteryPercent: (pct) =>
        set({ currentBatteryPercent: Math.min(100, Math.max(5, pct)) }),

      // ── Trip History (persisted, last 20) ────────────
      tripHistory: [],
      addToHistory: (entry) =>
        set((state) => ({
          tripHistory: [
            { ...entry, id: Date.now() },
            ...state.tripHistory,
          ].slice(0, 20),
        })),
      clearHistory: () => set({ tripHistory: [] }),

      // ── Toast Notifications ───────────────────────────
      toasts: [],
      addToast: (type, message) =>
        set((state) => ({
          toasts: [...state.toasts, { id: ++_toastId, type, message }],
        })),
      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

      // ── Clear session data ─────────────────────────────
      clearData: () =>
        set({ selectedCar: null, currentBatteryPercent: 80 }),
    }),
    {
      name: 'ev-route-v3',
      partialize: (state) => ({
        selectedCar:           state.selectedCar,
        currentBatteryPercent: state.currentBatteryPercent,
        tripHistory:           state.tripHistory,
      }),
    }
  )
)