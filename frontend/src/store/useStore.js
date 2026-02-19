import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set) => ({
      // Backend status
      backendStatus: false,
      setBackendStatus: (status) => set({ backendStatus: status }),

      // User's selected car
      selectedCar: null,
      setSelectedCar: (car) => set({ selectedCar: car }),

      // User info
      user: null,
      setUser: (user) => set({ user: user }),

      // Current route info
      currentRoute: null,
      setCurrentRoute: (route) => set({ currentRoute: route }),

      // Battery state
      currentBatteryPercent: 80,
      setCurrentBatteryPercent: (percent) => set({ currentBatteryPercent: percent }),

      // Clear all data (logout)
      clearData: () => set({
        selectedCar: null,
        user: null,
        currentRoute: null,
        currentBatteryPercent: 80
      })
    }),
    {
      name: 'ev-planner-storage', // localStorage key
      partialize: (state) => ({
        selectedCar: state.selectedCar,
        user: state.user,
        currentBatteryPercent: state.currentBatteryPercent
      })
    }
  )
)
