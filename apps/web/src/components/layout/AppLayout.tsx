import { Outlet, Navigate, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { useAuthStore } from "@/store/authStore";

export function AppLayout() {
    const location = useLocation()
    const isAuthenticated = useAuthStore(s => s.isAuthenticated())

    if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />

    return (
        <div className="flex h-screen supports-[height:100dvh]:h-dvh bg-canvas overflow-hidden">
            <div className="hidden lg:block w-56 shrink-0 h-full">
                <Sidebar />
            </div>
            <main className="flex-1 overflow-auto pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
                <Outlet />
            </main>
            <BottomNav />
        </div>
    )
}
