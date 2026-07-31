// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { AppLayout } from '@/components/layout/AppLayout'
import { Dashboard } from '@/pages/Dashboard'
import { MissionariesPage } from '@/pages/missionaries/Missionaries'
import { FamiliesPage } from '@/pages/families/Families'
import { LunchesPage } from '@/pages/lunches/Lunches'
import { PdayPage } from '@/pages/pday/Pday'
import { LoginPage } from '@/pages/auth/LoginPage.tsx'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/missionaries" element={<MissionariesPage />} />
            <Route path="/families" element={<FamiliesPage />} />
            <Route path="/lunches" element={<LunchesPage />} />
            <Route path="/pday" element={<PdayPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster richColors position="top-center" closeButton />
      </BrowserRouter>
    </QueryClientProvider>
  )
}