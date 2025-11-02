import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
    Home,
    Upload,
    MessageSquare,
    FileText,
    LogOut,
    User,
    Menu,
    X
} from 'lucide-react'
import { useState } from 'react'

export default function Layout({ children }) {
    const { user, logout } = useAuth()
    const router = useRouter()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Upload', href: '/upload', icon: Upload },
        { name: 'Chat', href: '/chat', icon: MessageSquare },
    ]

    const handleLogout = () => {
        logout()
        setMobileMenuOpen(false)
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation - Sticky */}
            <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200 backdrop-blur-sm bg-white/95">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <Link href="/" className="flex items-center space-x-2">
                                    <FileText className="h-8 w-8 text-primary-600" />
                                    <span className="text-xl font-bold text-gray-900">Chat2Doc</span>
                                </Link>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                {navigation.map((item) => {
                                    const isActive = router.pathname === item.href
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive
                                                ? 'border-primary-500 text-gray-900'
                                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                                }`}
                                        >
                                            <item.icon className="h-4 w-4 mr-2" />
                                            {item.name}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="hidden sm:ml-6 sm:flex sm:items-center">
                            <div className="ml-3 relative">
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm text-gray-700">
                                        <User className="h-4 w-4 inline mr-1" />
                                        {user?.email || 'User'}
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className="text-gray-500 hover:text-gray-700 transition-colors"
                                        title="Logout"
                                    >
                                        <LogOut className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Mobile menu button */}
                        <div className="sm:hidden flex items-center">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
                            >
                                {mobileMenuOpen ? (
                                    <X className="h-6 w-6" />
                                ) : (
                                    <Menu className="h-6 w-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="sm:hidden">
                        <div className="pt-2 pb-3 space-y-1">
                            {navigation.map((item) => {
                                const isActive = router.pathname === item.href
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive
                                            ? 'bg-primary-50 border-primary-500 text-primary-700'
                                            : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                                            }`}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <div className="flex items-center">
                                            <item.icon className="h-4 w-4 mr-3" />
                                            {item.name}
                                        </div>
                                    </Link>
                                )
                            })}
                            <div className="pt-4 pb-3 border-t border-gray-200">
                                <div className="flex items-center px-4">
                                    <div className="flex-shrink-0">
                                        <User className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-base font-medium text-gray-800">
                                            {user?.email || 'User'}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 px-2">
                                    <button
                                        onClick={handleLogout}
                                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                                    >
                                        <div className="flex items-center">
                                            <LogOut className="h-4 w-4 mr-3" />
                                            Logout
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Main content */}
            <main className="flex-1">
                {children}
            </main>
        </div>
    )
}
