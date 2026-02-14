"use client"

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    type ReactNode,
} from "react"
import apiClient from "@/lib/api/client"

interface User {
    id: string
    githubId: string
    username: string
    name: string
    email: string
    avatarUrl: string
    createdAt: string
}

interface AuthContextType {
    user: User | null
    loading: boolean
    isAuthenticated: boolean
    logout: () => Promise<void>
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isAuthenticated: false,
    logout: async () => { },
    refreshUser: async () => { },
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchUser = useCallback(async () => {
        try {
            const response = await apiClient.get("/auth/me")
            setUser(response.data.user)
        } catch {
            setUser(null)
        } finally {
            setLoading(false)
        }
    }, [])

    const logout = useCallback(async () => {
        try {
            await apiClient.post("/auth/logout")
        } finally {
            setUser(null)
            window.location.href = "/"
        }
    }, [])

    const refreshUser = useCallback(async () => {
        setLoading(true)
        await fetchUser()
    }, [fetchUser])

    useEffect(() => {
        fetchUser()
    }, [fetchUser])

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAuthenticated: !!user,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
