import { create } from 'zustand'
import { persist } from 'zustand/middleware'

let _toastId = 0

export const useStore = create(
  persist(
    (set, get) => ({
      // ---- Backend Status ----
      backendStatus: false,
      setBackendStatus: (status) => set({ backendStatus: status }),

      // ---- Selected Vehicle ----
      selectedCar: null,
      setSelectedCar: (car) => set({ selectedCar: car }),

      // ---- User ----
      user: null,
      setUser: (user) => set({ user }),

      // ---- Current Route ----
      currentRoute: null,
      setCurrentRoute: (route) => set({ currentRoute: route }),

      // ---- Battery ----
      currentBatteryPercent: 80,
      setCurrentBatteryPercent: (percent) =>
        set({ currentBatteryPercent: Math.min(100, Math.max(5, percent)) }),

      // ---- Trip History (last 10 trips) ----
      tripHistory: [],
      addToHistory: (entry) =>
        set((state) => ({
          tripHistory: [
            { ...entry, id: Date.now() },
            ...state.tripHistory,
          ].slice(0, 10),
        })),

      // ---- Toast Notifications ----
      toasts: [],
      addToast: (type, message) =>
        set((state) => ({
          toasts: [
            ...state.toasts,
            { id: ++_toastId, type, message },
          ],
        })),
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      // ---- Clear All ----
      clearData: () =>
        set({
          selectedCar: null,
          user: null,
          currentRoute: null,
          currentBatteryPercent: 80,
        }),
    }),
    {
      name: 'ev-planner-v2',
      partialize: (state) => ({
        selectedCar: state.selectedCar,
        user: state.user,
        currentBatteryPercent: state.currentBatteryPercent,
        tripHistory: state.tripHistory,
      }),
    }
  )
)