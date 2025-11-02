import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (token) {
            // Set default authorization header for axios
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            // You could verify the token here if needed
            setUser({ token })
        }
        setLoading(false)
    }, [])

    const login = async (email, password) => {
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/login`, {
                email,
                password
            })

            const { access_token } = response.data
            localStorage.setItem('token', access_token)
            axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
            setUser({ token: access_token })
            return { success: true }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.detail || 'Login failed'
            }
        }
    }

    const register = async (email, password) => {
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/register`, {
                email,
                password
            })

            const { access_token } = response.data
            localStorage.setItem('token', access_token)
            axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
            setUser({ token: access_token })
            return { success: true }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.detail || 'Registration failed'
            }
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        delete axios.defaults.headers.common['Authorization']
        setUser(null)
        router.push('/')
    }

    const value = {
        user,
        login,
        register,
        logout,
        loading
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
