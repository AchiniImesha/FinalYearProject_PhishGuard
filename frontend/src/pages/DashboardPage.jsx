import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiShield, FiCheckCircle, FiClock, FiRefreshCw, FiBarChart2 } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import useAuth from '../hooks/useAuth';
import useDashboard from '../hooks/useDashboard';
import StatCard from '../components/dashboard/StatCard';
import QuickScanPanel from '../components/dashboard/QuickScanPanel';
import RecentActivityPanel from '../components/dashboard/RecentActivityPanel';
import ThreatOverview from '../components/dashboard/ThreatOverview';
import DashboardNotifications from '../components/dashboard/DashboardNotifications';
import DebugPanel from '../components/dashboard/DebugPanel';
import Alert from '../components/common/Alert';
import Button from '../components/common/Button';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    dashboardStats,
    analyticsData,
    isLoading,
    isRefreshing,
    lastUpdated,
    error,
    refreshDashboard,
    formatChange
  } = useDashboard();
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [recentScans, setRecentScans] = useState([]);
  const [latestScanResult, setLatestScanResult] = useState(null);

  // Generate personalized welcome message
  useEffect(() => {
    if (user) {
      const hour = new Date().getHours();
      let greeting = 'Good evening';
      if (hour < 12) greeting = 'Good morning';
      else if (hour < 18) greeting = 'Good afternoon';
      
      // Use first_name if available, otherwise fall back to username or email
      const displayName = user.first_name || user.username || user.email;
      setWelcomeMessage(`${greeting}, ${displayName}!`);
    }
  }, [user]);

  // Extract recent scans for notifications
  useEffect(() => {
    if (analyticsData && analyticsData.recentScans) {
      setRecentScans(analyticsData.recentScans || []);
    }
  }, [analyticsData]);

  // Handle scan completion from quick scan
  const handleScanComplete = useCallback((scanResult) => {
    console.log('=== DASHBOARD: SCAN COMPLETED ===');
    console.log('Scan result received:', scanResult);
    console.log('Time of completion:', new Date().toLocaleString());
    
    // Set the latest scan result for immediate display
    setLatestScanResult(scanResult);
    console.log('Latest scan result set for RecentActivityPanel');
    
    // Trigger immediate refresh of analytics data and recent activity
    setRefreshTrigger(prev => {
      console.log('Refresh trigger updated:', prev + 1);
      return prev + 1;
    });
    
    // Refresh dashboard data
    setTimeout(() => {
      console.log('Refreshing dashboard data...');
      refreshDashboard(false);
    }, 1000);

    // Clear the scan result after a delay to avoid duplicate adds
    setTimeout(() => {
      console.log('Clearing latest scan result to prevent duplicates');
      setLatestScanResult(null);
    }, 2000);
  }, [refreshDashboard]);

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    await refreshDashboard(true);
    setRefreshTrigger(prev => prev + 1);
  }, [refreshDashboard]);



  // Generate trend data for StatCards with real MongoDB data
  const generateTrendData = (dataKey, data) => {
    if (!data || !data.scansOverTime || data.scansOverTime.length === 0) {
      return [];
    }
    
    // Get last 7 days of data, or all available if less than 7
    const recentData = data.scansOverTime.slice(-7);
    
    return recentData.map((point, index) => {
      let value = 0;
      if (dataKey === 'total') {
        value = (point.safe || 0) + (point.suspicious || 0) + (point.phishing || 0);
      } else if (dataKey === 'phishing') {
        value = point.phishing || 0;
      } else if (dataKey === 'suspicious') {
        value = point.suspicious || 0;
      } else if (dataKey === 'safe') {
        value = point.safe || 0;
      }
      return {
        day: index,
        value: Math.max(0, value) // Ensure no negative values
      };
    });
  };

  // Generate trend data for each card with real MongoDB data
  const totalScansTrend = generateTrendData('total', analyticsData);
  const phishingTrend = generateTrendData('phishing', analyticsData);
  
  // Generate accuracy trend from real data
  const accuracyTrend = analyticsData?.accuracyTrend?.slice(-7).map((point, index) => ({
    day: index,
    value: Math.max(0, Math.min(100, point.accuracy || 0)) // Clamp between 0-100
  })) || [];
  
  const pendingTrend = generateTrendData('suspicious', analyticsData); // Use suspicious as pending

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Real-time Notifications */}
      <DashboardNotifications
        recentScans={recentScans}
      />

    <div className="container mx-auto px-4 py-4 md:py-5 lg:py-6">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 md:mb-6 lg:mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                {welcomeMessage} Here's your email security overview.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
                className="flex items-center space-x-2"
              >
                <FiRefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/analytics')}
                className="flex items-center space-x-2"
              >
                <FiBarChart2 className="h-4 w-4" />
                <span>Analytics</span>
              </Button>
            </div>
          </div>



          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <Alert type="error" message={error} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

                {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6 lg:mb-8">
          <StatCard
            title="Total Scans"
            value={isLoading ? '...' : dashboardStats.totalScans.toLocaleString()}
            icon={FiMail}
            gradient="primary"
            change={formatChange(dashboardStats.weeklyTrend, 'percentage') || 'This week'}
            isLoading={isLoading}
            onClick={() => navigate('/analytics')}
            trendData={totalScansTrend}
          />

          <StatCard
            title="Threats Detected"
            value={isLoading ? '...' : dashboardStats.phishingDetected.toLocaleString()}
            icon={FiShield}
            gradient="danger"
            change={`${dashboardStats.todayPhishing} detected today`}
            isLoading={isLoading}
            onClick={() => navigate('/analytics?filter=phishing')}
            trendData={phishingTrend}
          />

          <StatCard
            title="Detection Accuracy"
            value={isLoading ? '...' : `${dashboardStats.accuracy.toFixed(1)}%`}
            icon={FiCheckCircle}
            gradient="success"
            change="ML Model Active"
            isLoading={isLoading}
            onClick={() => navigate('/scanner')}
            trendData={accuracyTrend}
          />

          <StatCard
            title="Pending Reviews"
            value={isLoading ? '...' : dashboardStats.pendingReports.toString()}
            icon={FiClock}
            gradient="warning"
            change="Manual review needed"
            isLoading={isLoading}
            onClick={() => navigate('/analytics')}
            trendData={pendingTrend}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6 lg:mb-8">
          {/* Quick Scan Panel */}
          <QuickScanPanel onScanComplete={handleScanComplete} />

          {/* Recent Activity Panel */}
                              <RecentActivityPanel 
                      refreshTrigger={refreshTrigger} 
                      newScanResult={latestScanResult}
                    />
      </div>

        {/* Threat Overview - Full Width */}
        <div className="mb-4 md:mb-6 lg:mb-8">
          <ThreatOverview 
            analyticsData={analyticsData} 
            isLoading={isLoading} 
          />
        </div>

        {/* Debug Panel for Development */}
        {import.meta.env.MODE === 'development' && <DebugPanel />}
      </div>
    </div>
  );
};

export default DashboardPage; 