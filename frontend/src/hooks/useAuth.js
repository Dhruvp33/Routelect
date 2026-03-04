import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'

export function useAuth() {
  const [user,        setUser]        = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const { setSelectedCar, addToast }  = useStore()

  /* ── Boot: restore existing session ── */
  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadSavedCar(session.user.id)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) loadSavedCar(u.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  /* ── Load saved car from DB ── */
  const loadSavedCar = async (userId) => {
    if (!supabase) return
    try {
      const { data } = await supabase
        .from('user_preferences')
        .select('car_model_id, car_models(*, car_brands(name, logo_url))')
        .eq('user_id', userId)
        .single()

      if (data?.car_models) {
        const m = data.car_models
        setSelectedCar({ ...m, brand: m.car_brands?.name || '' })
        addToast('success', `Welcome back! ${m.car_brands?.name} ${m.name} loaded`)
      }
    } catch { /* no saved preference — fine */ }
  }

  /* ── Email + Password — Sign In ──
     Returns error string on failure, null on success */
  const signInWithEmail = async (email, password) => {
    if (!supabase) return 'Supabase not configured'
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.includes('Invalid login')) return 'Incorrect email or password'
      if (error.message.includes('Email not confirmed')) return 'Please verify your email first'
      return error.message
    }
    return null
  }

  /* ── Email + Password — Sign Up ──
     Returns error string on failure, null on success */
  const signUpWithEmail = async (email, password, fullName) => {
    if (!supabase) return 'Supabase not configured'
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    })
    if (error) {
      if (error.message.includes('already registered')) return 'An account with this email already exists — try logging in'
      return error.message
    }
    return null
  }

  /* ── Google OAuth ── */
  const signInWithGoogle = async () => {
    if (!supabase) return
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options:  { redirectTo: window.location.origin },
    })
  }

  /* ── Sign Out ── */
  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
    addToast('info', 'Signed out successfully')
  }

  /* ── Save car preference ── */
  const saveCarPreference = async (userId, carModelId) => {
    if (!supabase || !userId) return
    await supabase
      .from('user_preferences')
      .upsert({ user_id: userId, car_model_id: carModelId }, { onConflict: 'user_id' })
  }

  /* ── Save completed trip ── */
  const saveTrip = async (userId, tripData) => {
    if (!supabase || !userId) return
    await supabase.from('user_routes').insert({
      user_id:        userId,
      start_lat:      tripData.startCoords[0],
      start_lng:      tripData.startCoords[1],
      end_lat:        tripData.endCoords[0],
      end_lng:        tripData.endCoords[1],
      distance_km:    tripData.route.total_distance_km,
      charging_stops: tripData.route.charging_stops,
      route_result:   tripData.route,
    })
  }

  return {
    user,
    authLoading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    saveCarPreference,
    saveTrip,
  }
}