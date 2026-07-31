import { Outlet, Navigate, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useAuthStore } from "@/store/authStore";

export function AppLayout() {
    const location = useLocation()
    const isAuthenticated = useAuthStore(s => s.isAuthenticated())

    if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">
            <div className="w-56 shrink-0 h-full">
                <Sidebar />
            </div>
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    )
}