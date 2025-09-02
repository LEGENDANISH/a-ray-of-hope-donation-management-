// Dashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  IndianRupee ,
  TrendingUp,
  Users,
  Activity,
  Plus,
  Download,
  Heart,
  LogOut
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { formatCurrency, formatDate } from '../lib/utils';
import { api } from '../lib/api';
import { ExpenseManager } from './ExpenseManager';
import { DonorManager } from './DonorManager';
import { CampaignManager } from './CampaignManager';
import { BeneficiaryManager } from './BeneficiaryManager';
// Assuming recharts are imported if used, but omitted here as in the previous example
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface DashboardProps {
  username: string;
  onLogout: () => void;
}

interface DashboardStats {
  totalDonations: number;
  totalExpenses: number;
  activeCampaigns: number;
  recentDonors: Array<{
    id: string;
    amount: number;
    donor: { name: string };
    campaign?: { name: string };
    createdAt: string;
  }>;
}

export function Dashboard({ username, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true); // Handles initial load

  // useEffect for initial load when the Dashboard component mounts
  useEffect(() => {
    loadDashboardStats();
  }, []); // Empty dependency array - runs once on mount

  // useEffect to reload dashboard stats specifically when the dashboard tab is activated
  // This is the key addition to refresh data on tab switch
  useEffect(() => {
    if (activeTab === 'dashboard') {
      // Load or reload stats when switching to the dashboard tab
      // We don't set 'loading' to true here to avoid the full-screen spinner
      // The data fetch happens in the background.
      loadDashboardStats();
    }
    // Note: We intentionally omit loading state changes here for a smoother UI.
    // If you want a subtle indicator, you could add local state for it.
  }, [activeTab]); // Dependency array includes activeTab

  const loadDashboardStats = async () => {
    // Show the main spinner only on the very first load of the Dashboard component
    const isInitialLoad = stats === null && loading === true;
    // No need to set setLoading(true) again if it's already true initially

    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      // Optionally set an error state to display in the UI if the initial load fails
      // For subsequent tab switches, failure might be silent or show a local error.
    } finally {
      // Only stop the initial loading spinner after the first fetch attempt
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  const handleExport = async () => {
    try {
      await api.exportExpenses();
    } catch (error) {
      console.error('Export failed:', error);
      // Optionally show user feedback for export failure
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'expenses', label: 'Expenses', icon: IndianRupee  },
    { id: 'donors', label: 'Donors', icon: Users },
    { id: 'campaigns', label: 'Campaigns', icon: TrendingUp },
    { id: 'beneficiaries', label: 'Beneficiaries', icon: Heart },
  ];

  // Initial loading spinner (only shown once when the Dashboard component first loads)
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">A Ray of Hope</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {username}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Dashboard Content - This section will now refresh when activeTab === 'dashboard' */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats.totalDonations)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All time donations received
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                  <TrendingUp className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(stats.totalExpenses)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All time expenses
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                  <Activity className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.activeCampaigns}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Currently running campaigns
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Donors */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Donors</CardTitle>
                <CardDescription>Latest donations received</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentDonors.map((donation) => (
                    <div key={donation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{donation.donor.name}</p>
                        <p className="text-sm text-gray-600">
                          {donation.campaign?.name || 'General Fund'} • {formatDate(donation.createdAt)}
                        </p>
                      </div>
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(donation.amount)}
                      </div>
                    </div>
                  ))}
                  {stats.recentDonors.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No donations yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and exports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button onClick={() => setActiveTab('expenses')} className="flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Expense
                  </Button>
                  <Button onClick={() => setActiveTab('donors')} variant="outline" className="flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Donor
                  </Button>
                  <Button onClick={handleExport} variant="outline" className="flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    Export Expenses
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Other Tabs - These refresh automatically due to component mount/unmount */}
        {/* Using key={activeTab} ensures components remount and fetch data on switch */}
        {activeTab === 'expenses' && <ExpenseManager key={activeTab} />}
        {activeTab === 'donors' && <DonorManager key={activeTab} />}
        {activeTab === 'campaigns' && <CampaignManager key={activeTab} />}
        {activeTab === 'beneficiaries' && <BeneficiaryManager key={activeTab} />}

        {/* Optional: Handle case where stats failed to load initially and user is on dashboard tab */}
        {activeTab === 'dashboard' && !stats && !loading && (
             <div className="text-center py-8 text-red-500">
                 Failed to load dashboard data. Please try refreshing the page.
             </div>
        )}
      </div>
    </div>
  );
}