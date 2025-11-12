'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    HamburgerMenuIcon,
    Cross1Icon,
    ChevronRightIcon,
    DashboardIcon
} from '@radix-ui/react-icons';
import { AdminNavigation } from './AdminNavigation';
import { useAuth } from '@/contexts/SimpleAuthContext';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const { user } = useAuth();

    // Generate breadcrumbs from pathname
    const breadcrumbs = pathname.split('/').filter(Boolean).map((segment, index, array) => ({
        label: segment.charAt(0).toUpperCase() + segment.slice(1),
        href: '/' + array.slice(0, index + 1).join('/'),
        isLast: index === array.length - 1
    }));

    // Close sidebar when route changes (for mobile)
    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Mobile sidebar toggle button */}
            <button
                className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-gray-800 text-white"
                onClick={() => setSidebarOpen(!sidebarOpen)}
            >
                {sidebarOpen ? <Cross1Icon /> : <HamburgerMenuIcon />}
            </button>

            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-800 text-white transition-transform duration-300 ease-in-out transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } md:translate-x-0 md:static md:z-auto`}
            >
                <div className="flex items-center justify-center h-16 border-b border-gray-700">
                    <h1 className="text-xl font-bold">Control Room</h1>
                </div>
                <AdminNavigation />
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white shadow-sm z-10">
                    <div className="px-6 py-4">
                        {/* Top Header Row */}
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Control Room</h1>
                                <p className="text-sm text-gray-500">Multi-Database Admin Interface</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                {/* Database Selector - Placeholder for Phase 3 */}
                                <div className="px-3 py-1 bg-green-50 border border-green-200 rounded-md">
                                    <span className="text-xs font-medium text-green-700">● Supabase</span>
                                </div>
                                
                                {/* User Profile */}
                                <div className="flex items-center space-x-2">
                                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
                                        <span className="font-semibold text-white text-sm">
                                            {user?.email?.charAt(0).toUpperCase() || 'A'}
                                        </span>
                                    </div>
                                    <div className="hidden md:block">
                                        <p className="text-sm font-medium text-gray-700">{user?.email || 'Admin'}</p>
                                        <p className="text-xs text-gray-500">Administrator</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Breadcrumbs */}
                        <div className="flex items-center space-x-2 text-sm">
                            <Link href="/" className="text-gray-500 hover:text-gray-700">
                                <DashboardIcon className="w-4 h-4" />
                            </Link>
                            {breadcrumbs.map((crumb, index) => (
                                <React.Fragment key={crumb.href}>
                                    <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                                    {crumb.isLast ? (
                                        <span className="font-medium text-gray-900">{crumb.label}</span>
                                    ) : (
                                        <Link href={crumb.href} className="text-gray-500 hover:text-gray-700">
                                            {crumb.label}
                                        </Link>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    <div className="mx-auto max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>

            {/* Overlay for mobile sidebar */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}
        </div>
    );
}