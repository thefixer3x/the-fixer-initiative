'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    DashboardIcon,
    CubeIcon,
    PersonIcon,
    ReaderIcon,
    CardStackIcon,
    BarChartIcon,
    GearIcon,
    ChatBubbleIcon,
    HomeIcon
} from '@radix-ui/react-icons';

const navigationItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: DashboardIcon },
    { name: 'Assistant', href: '/admin/assistant', icon: ChatBubbleIcon },
    { name: 'Projects', href: '/admin/projects', icon: CubeIcon },
    { name: 'Clients', href: '/admin/clients', icon: PersonIcon },
    { name: 'Vendors', href: '/admin/vendors', icon: ReaderIcon },
    { name: 'Billing', href: '/admin/billing', icon: CardStackIcon },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChartIcon },
    { name: 'Settings', href: '/admin/settings', icon: GearIcon },
    // Cross-navigation back to main dashboard
    { name: 'Main Dashboard', href: '/', icon: HomeIcon },
];

export function AdminNavigation() {
    const pathname = usePathname();

    return (
        <nav className="mt-5 px-2">
            <ul className="space-y-1">
                {navigationItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <li key={item.name}>
                            <Link
                                href={item.href}
                                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                    }`}
                            >
                                <item.icon className="w-5 h-5 mr-3" />
                                {item.name}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}