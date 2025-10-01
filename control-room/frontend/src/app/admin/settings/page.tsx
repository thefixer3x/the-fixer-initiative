'use client';

import React, { useState } from 'react';
import { 
  GearIcon, 
  BellIcon, 
  ShieldIcon,
  DatabaseIcon,
  CreditCardIcon,
  UserIcon
} from '@radix-ui/react-icons';

const settingsCategories = [
  { id: 'general', name: 'General', icon: GearIcon },
  { id: 'notifications', name: 'Notifications', icon: BellIcon },
  { id: 'security', name: 'Security', icon: ShieldIcon },
  { id: 'database', name: 'Database', icon: DatabaseIcon },
  { id: 'billing', name: 'Billing', icon: CreditCardIcon },
  { id: 'users', name: 'Users', icon: UserIcon },
];

export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState('general');

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure platform settings and preferences
        </p>
      </div>

      {/* Settings layout */}
      <div className="bg-white shadow rounded-lg">
        <div className="flex flex-col md:flex-row">
          {/* Settings sidebar */}
          <div className="md:w-64 border-r border-gray-200">
            <nav className="space-y-1 py-6 px-4">
              {settingsCategories.map((category) => {
                const isActive = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <category.icon className={`flex-shrink-0 -ml-1 mr-3 h-6 w-6 ${
                      isActive ? 'text-blue-500' : 'text-gray-400'
                    }`} />
                    <span className="truncate">{category.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Settings content */}
          <div className="flex-1 p-6">
            {activeCategory === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure basic platform settings
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="platform-name" className="block text-sm font-medium text-gray-700">
                      Platform Name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="platform-name"
                        id="platform-name"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        defaultValue="The Fixer Initiative"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                      Timezone
                    </label>
                    <div className="mt-1">
                      <select
                        id="timezone"
                        name="timezone"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        defaultValue="UTC"
                      >
                        <option>UTC</option>
                        <option>EST</option>
                        <option>PST</option>
                        <option>CET</option>
                        <option>GMT+1</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                      Language
                    </label>
                    <div className="mt-1">
                      <select
                        id="language"
                        name="language"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        defaultValue="English"
                      >
                        <option>English</option>
                        <option>Spanish</option>
                        <option>French</option>
                        <option>German</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="maintenance-mode"
                      name="maintenance-mode"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="maintenance-mode" className="ml-2 block text-sm text-gray-900">
                      Maintenance Mode
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {activeCategory === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure how you receive notifications
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900">Email Notifications</h4>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center">
                        <input
                          id="email-alerts"
                          name="email-alerts"
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          defaultChecked
                        />
                        <label htmlFor="email-alerts" className="ml-3 block text-sm text-gray-700">
                          Critical alerts
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="email-reports"
                          name="email-reports"
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          defaultChecked
                        />
                        <label htmlFor="email-reports" className="ml-3 block text-sm text-gray-700">
                          Weekly reports
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="email-updates"
                          name="email-updates"
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="email-updates" className="ml-3 block text-sm text-gray-700">
                          Product updates
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900">Push Notifications</h4>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center">
                        <input
                          id="push-alerts"
                          name="push-alerts"
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          defaultChecked
                        />
                        <label htmlFor="push-alerts" className="ml-3 block text-sm text-gray-700">
                          Critical alerts
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="push-reports"
                          name="push-reports"
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="push-reports" className="ml-3 block text-sm text-gray-700">
                          Daily summaries
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {activeCategory === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure platform security options
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900">Authentication</h4>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center">
                        <input
                          id="two-factor"
                          name="two-factor"
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          defaultChecked
                        />
                        <label htmlFor="two-factor" className="ml-3 block text-sm text-gray-700">
                          Two-factor authentication
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="session-expiry"
                          name="session-expiry"
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          defaultChecked
                        />
                        <label htmlFor="session-expiry" className="ml-3 block text-sm text-gray-700">
                          Session expiry after 30 minutes of inactivity
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900">API Security</h4>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="rate-limit" className="block text-sm font-medium text-gray-700">
                          API Rate Limit (requests/minute)
                        </label>
                        <div className="mt-1">
                          <input
                            type="number"
                            name="rate-limit"
                            id="rate-limit"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            defaultValue="1000"
                          />
                        </div>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="ip-whitelist"
                          name="ip-whitelist"
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="ip-whitelist" className="ml-3 block text-sm text-gray-700">
                          Enable IP whitelisting
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {activeCategory === 'database' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Database Settings</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure database connection and performance settings
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900">Connection</h4>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="db-host" className="block text-sm font-medium text-gray-700">
                          Database Host
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="db-host"
                            id="db-host"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            defaultValue="db.fixer-initiative.com"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="db-port" className="block text-sm font-medium text-gray-700">
                          Port
                        </label>
                        <div className="mt-1">
                          <input
                            type="number"
                            name="db-port"
                            id="db-port"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            defaultValue="5432"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900">Performance</h4>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="connection-pool" className="block text-sm font-medium text-gray-700">
                          Connection Pool Size
                        </label>
                        <div className="mt-1">
                          <input
                            type="number"
                            name="connection-pool"
                            id="connection-pool"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            defaultValue="20"
                          />
                        </div>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="query-cache"
                          name="query-cache"
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          defaultChecked
                        />
                        <label htmlFor="query-cache" className="ml-3 block text-sm text-gray-700">
                          Enable query caching
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {activeCategory === 'billing' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Billing Settings</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure billing and payment processing settings
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900">Payment Providers</h4>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center">
                        <input
                          id="stripe"
                          name="stripe"
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          defaultChecked
                        />
                        <label htmlFor="stripe" className="ml-3 block text-sm text-gray-700">
                          Stripe
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="paypal"
                          name="paypal"
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="paypal" className="ml-3 block text-sm text-gray-700">
                          PayPal
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900">Invoicing</h4>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="invoice-prefix" className="block text-sm font-medium text-gray-700">
                          Invoice Prefix
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="invoice-prefix"
                            id="invoice-prefix"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            defaultValue="INV-"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="due-days" className="block text-sm font-medium text-gray-700">
                          Default Due Days
                        </label>
                        <div className="mt-1">
                          <input
                            type="number"
                            name="due-days"
                            id="due-days"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            defaultValue="14"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {activeCategory === 'users' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure user roles and permissions
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900">Roles</h4>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center">
                        <input
                          id="admin-role"
                          name="admin-role"
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          defaultChecked
                        />
                        <label htmlFor="admin-role" className="ml-3 block text-sm text-gray-700">
                          Admin
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="developer-role"
                          name="developer-role"
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          defaultChecked
                        />
                        <label htmlFor="developer-role" className="ml-3 block text-sm text-gray-700">
                          Developer
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="viewer-role"
                          name="viewer-role"
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          defaultChecked
                        />
                        <label htmlFor="viewer-role" className="ml-3 block text-sm text-gray-700">
                          Viewer
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900">Permissions</h4>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center">
                        <input
                          id="manage-projects"
                          name="manage-projects"
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          defaultChecked
                        />
                        <label htmlFor="manage-projects" className="ml-3 block text-sm text-gray-700">
                          Manage Projects
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="manage-clients"
                          name="manage-clients"
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          defaultChecked
                        />
                        <label htmlFor="manage-clients" className="ml-3 block text-sm text-gray-700">
                          Manage Clients
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="view-analytics"
                          name="view-analytics"
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          defaultChecked
                        />
                        <label htmlFor="view-analytics" className="ml-3 block text-sm text-gray-700">
                          View Analytics
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}