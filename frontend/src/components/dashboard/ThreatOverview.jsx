import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiShield, FiAlertTriangle, FiInfo, FiTrendingUp, FiTrendingDown, FiMinus, FiBarChart2, FiTarget } from 'react-icons/fi';
import Card from '../common/Card';
import Spinner from '../common/Spinner';
import { RadarChart } from '@mui/x-charts/RadarChart';

const ThreatOverview = ({ analyticsData, isLoading }) => {
  const [threatData, setThreatData] = useState({
    phishing: 0,
    suspicious: 0,
    safe: 0,
    malicious_links: 0,
    suspicious_domains: 0,
    urgency_indicators: 0
  });

  const [securityTips, setSecurityTips] = useState([]);
  const [threatTrends, setThreatTrends] = useState({});
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    if (analyticsData) {
      checkIfUserHasData();
      if (hasData) {
        calculateThreatData();
        generateSecurityTips();
        calculateThreatTrends();
      } else {
        generateWelcomeContent();
      }
    }
  }, [analyticsData, hasData]);

  const checkIfUserHasData = () => {
    const totalScans = analyticsData?.totalScans || 0;
    const scansOverTime = analyticsData?.scansOverTime || [];
    setHasData(totalScans > 0 || scansOverTime.length > 0);
  };

  const generateWelcomeContent = () => {
    // Set welcome security tips for new users
    setSecurityTips([
      {
        type: 'welcome',
        title: 'Welcome to PhishGuard!',
        message: 'Start scanning emails to see personalized threat analysis and security insights.',
        icon: FiShield
      },
      {
        type: 'info',
        title: 'Email Security Best Practices',
        message: 'Always verify sender identity, avoid clicking suspicious links, and report suspicious emails.',
        icon: FiInfo
      }
    ]);
  };

  const calculateThreatData = () => {
    // Use real data from backend
    const verdictDistribution = analyticsData?.verdictDistribution || { safe: 0, suspicious: 0, phishing: 0 };
    const topPhishingDomains = analyticsData?.topPhishingDomains || [];
    const accuracyMetrics = analyticsData?.accuracyMetrics || {};
    const scansOverTime = analyticsData?.scansOverTime || [];

    // Calculate real threat metrics from verdict distribution
    const phishingPercentage = verdictDistribution.phishing || 0;
    const suspiciousPercentage = verdictDistribution.suspicious || 0;
    const safePercentage = verdictDistribution.safe || 0;

    // Calculate malicious links based on real phishing domains data
    const phishingDomainsCount = topPhishingDomains.length;
    const totalPhishingScans = topPhishingDomains.reduce((sum, domain) => sum + (domain.count || 0), 0);
    const maliciousLinks = Math.min(100, (phishingDomainsCount * 10) + (totalPhishingScans * 2) + (phishingPercentage * 0.5));

    // Calculate suspicious domains based on unique domains and recent activity
    const uniqueDomains = new Set(topPhishingDomains.map(domain => domain.domain)).size;
    const recentActivity = scansOverTime.slice(-7).reduce((sum, point) => sum + (point.suspicious || 0), 0);
    const suspiciousDomains = Math.min(100, (uniqueDomains * 15) + (recentActivity * 3) + (suspiciousPercentage * 0.4));

    // Calculate urgency indicators based on accuracy metrics and false negatives
    const falseNegatives = accuracyMetrics.falseNegatives || 0;
    const totalFeedback = accuracyMetrics.totalFeedbackCount || 1;
    const falseNegativeRate = totalFeedback > 0 ? (falseNegatives / totalFeedback) * 100 : 0;
    const currentAccuracy = accuracyMetrics.currentAccuracy || 0;
    const urgencyIndicators = Math.min(100, (falseNegativeRate * 1.5) + ((100 - currentAccuracy) * 0.8) + (phishingPercentage * 0.3));

    setThreatData({
      phishing: Math.round(phishingPercentage),
      suspicious: Math.round(suspiciousPercentage),
      safe: Math.round(safePercentage),
      malicious_links: Math.round(maliciousLinks),
      suspicious_domains: Math.round(suspiciousDomains),
      urgency_indicators: Math.round(urgencyIndicators)
    });
  };

  const calculateThreatTrends = () => {
    const scansOverTime = analyticsData?.scansOverTime || [];
    if (scansOverTime.length < 2) return;

    // Calculate trends for last 7 days vs previous 7 days
    const recentWeek = scansOverTime.slice(-7);
    const previousWeek = scansOverTime.slice(-14, -7);

    const recentPhishing = recentWeek.reduce((sum, day) => sum + (day.phishing || 0), 0);
    const previousPhishing = previousWeek.reduce((sum, day) => sum + (day.phishing || 0), 0);
    const recentSuspicious = recentWeek.reduce((sum, day) => sum + (day.suspicious || 0), 0);
    const previousSuspicious = previousWeek.reduce((sum, day) => sum + (day.suspicious || 0), 0);

    setThreatTrends({
      phishing: recentPhishing > previousPhishing ? 'up' : recentPhishing < previousPhishing ? 'down' : 'stable',
      suspicious: recentSuspicious > previousSuspicious ? 'up' : recentSuspicious < previousSuspicious ? 'down' : 'stable'
    });
  };

  const generateSecurityTips = () => {
    const tips = [];
    const verdictDistribution = analyticsData?.verdictDistribution || {};
    const topPhishingDomains = analyticsData?.topPhishingDomains || [];
    const accuracyMetrics = analyticsData?.accuracyMetrics || {};

    // Tip based on phishing percentage
    if (verdictDistribution.phishing > 20) {
      tips.push({
        type: 'critical',
        title: 'High Phishing Activity',
        message: 'Phishing attempts are significantly elevated. Enable enhanced security measures.',
        icon: FiAlertTriangle
      });
    }

    // Tip based on accuracy
    if (accuracyMetrics.currentAccuracy < 85) {
      tips.push({
        type: 'warning',
        title: 'Detection Accuracy Alert',
        message: 'Model accuracy is below optimal levels. Consider reviewing recent detections.',
        icon: FiShield
      });
    }

    // Tip based on unique domains
    if (topPhishingDomains.length > 5) {
      tips.push({
        type: 'info',
        title: 'Multiple Threat Sources',
        message: `Detected ${topPhishingDomains.length} unique phishing domains. Stay vigilant.`,
        icon: FiInfo
      });
    }

    // Default security tip
    if (tips.length === 0) {
      tips.push({
        type: 'success',
        title: 'Security Status Good',
        message: 'Current threat levels are manageable. Continue monitoring for new threats.',
        icon: FiShield
      });
    }

    setSecurityTips(tips);
  };

  const getThreatLevel = () => {
    if (!hasData) return 'secure';
    const avgThreat = (threatData.phishing + threatData.suspicious + threatData.malicious_links + threatData.suspicious_domains + threatData.urgency_indicators) / 5;
    if (avgThreat > 30) return 'high';
    if (avgThreat > 15) return 'medium';
    return 'low';
  };

  const getThreatLevelConfig = (level) => {
    switch (level) {
      case 'high':
        return {
          color: 'text-red-600',
          bgColor: 'bg-gradient-to-r from-red-50 to-red-100',
          borderColor: 'border-red-300',
          icon: FiAlertTriangle,
          label: 'High Risk',
          description: 'Increased threat activity detected',
          shadow: 'shadow-red-100'
        };
      case 'medium':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-gradient-to-r from-yellow-50 to-yellow-100',
          borderColor: 'border-yellow-300',
          icon: FiShield,
          label: 'Medium Risk',
          description: 'Moderate threat activity observed',
          shadow: 'shadow-yellow-100'
        };
      case 'secure':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-gradient-to-r from-blue-50 to-blue-100',
          borderColor: 'border-blue-300',
          icon: FiShield,
          label: 'Protected',
          description: 'No scan data available yet - start scanning emails',
          shadow: 'shadow-blue-100'
        };
      default:
        return {
          color: 'text-green-600',
          bgColor: 'bg-gradient-to-r from-green-50 to-green-100',
          borderColor: 'border-green-300',
          icon: FiShield,
          label: 'Low Risk',
          description: 'Normal security levels maintained',
          shadow: 'shadow-green-100'
        };
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <FiTrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <FiTrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <FiMinus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTipConfig = (type) => {
    switch (type) {
      case 'critical':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-300',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          size: 'compact'
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-300',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          size: 'compact'
        };
      case 'info':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-300',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600',
          size: 'compact'
        };
      case 'welcome':
        return {
          bgColor: 'bg-gradient-to-r from-blue-50 to-indigo-50',
          borderColor: 'border-blue-300',
          textColor: 'text-blue-900',
          iconColor: 'text-blue-600',
          size: 'featured'
        };
      default:
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-300',
          textColor: 'text-green-800',
          iconColor: 'text-green-600',
          size: 'compact'
        };
    }
  };

  const threatLevel = getThreatLevel();
  const threatConfig = getThreatLevelConfig(threatLevel);
  const ThreatIcon = threatConfig.icon;

  if (isLoading) {
    return (
      <Card title="Threat Overview" className="w-full">
        <div className="flex items-center justify-center h-64">
          <Spinner size="md" />
        </div>
      </Card>
    );
  }

  return (
    <Card title="Threat Overview" className="w-full">
      <div className="space-y-6">
        {/* Enhanced Threat Level Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 lg:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                          <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-gray-100">
                  <ThreatIcon className={`h-6 w-6 lg:h-8 lg:w-8 ${threatConfig.color}`} />
                </div>
            <div>
                <h3 className={`text-lg lg:text-xl font-bold ${threatConfig.color}`}>
                {threatConfig.label}
              </h3>
                <p className="text-sm text-gray-600 mt-1">
                {threatConfig.description}
              </p>
              </div>
            </div>
            
            {/* Trend Indicators - Only show if user has data */}
            {hasData && (
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(threatTrends.phishing)}
                    <span className="text-sm font-medium text-gray-600">Phishing</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(threatTrends.suspicious)}
                    <span className="text-sm font-medium text-gray-600">Suspicious</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Radar Chart or Welcome Message */}
        {hasData ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-80 lg:h-96 flex items-center justify-center bg-gray-50 rounded-xl p-4 lg:p-6"
          >
            <RadarChart
              height={window.innerWidth < 1024 ? 300 : 350}
              series={[
                {
                  label: 'Threat Analysis',
                  data: [
                    threatData.phishing,
                    threatData.suspicious,
                    threatData.safe,
                    threatData.malicious_links,
                    threatData.suspicious_domains,
                    threatData.urgency_indicators
                  ],
                  area: {
                    fill: 'rgba(59, 130, 246, 0.15)',
                    stroke: 'rgba(59, 130, 246, 0.9)',
                    strokeWidth: 3,
                  },
                  line: {
                    stroke: 'rgba(59, 130, 246, 0.9)',
                    strokeWidth: 3,
                  },
                  points: {
                    fill: 'rgba(59, 130, 246, 0.9)',
                    stroke: 'rgba(59, 130, 246, 1)',
                    strokeWidth: 3,
                    size: 8,
                  },
                }
              ]}
              radar={{
                max: 100,
                metrics: [
                  'Phishing',
                  'Suspicious',
                  'Safe',
                  'Malicious Links',
                  'Suspicious Domains',
                  'Urgency Indicators'
                ],
              }}
              sx={{
                '& .MuiChartsAxis-line': {
                  stroke: '#d1d5db',
                  strokeWidth: 1,
                },
                '& .MuiChartsAxis-tick': {
                  stroke: '#d1d5db',
                  strokeWidth: 1,
                },
                '& .MuiChartsAxis-label': {
                  fill: '#374151',
                  fontSize: window.innerWidth < 768 ? '11px' : '13px',
                  fontWeight: '500',
                },
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-80 lg:h-96 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 lg:p-8"
          >
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-4 bg-blue-100 rounded-full">
                  <FiBarChart2 className="h-12 w-12 text-blue-600" />
                </div>
              </div>
        <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Start Your Security Journey
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Scan your first email to see personalized threat analysis and security insights appear here.
                </p>
              </div>
              <div className="flex justify-center">
                <FiTarget className="h-8 w-8 text-blue-400" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Compact Security Tips */}
        <div className="space-y-3">
          {securityTips.map((tip, index) => {
            const tipConfig = getTipConfig(tip.type);
            const TipIcon = tip.icon;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`${
                  tipConfig.size === 'featured' 
                    ? 'p-4 lg:p-6' 
                    : 'p-3 lg:p-4'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`${
                    tipConfig.size === 'featured' 
                      ? 'p-2 lg:p-3' 
                      : 'p-2'
                  } rounded-full bg-gray-100 flex-shrink-0`}>
                    <TipIcon className={`${
                      tipConfig.size === 'featured' 
                        ? 'h-5 w-5 lg:h-6 lg:w-6' 
                        : 'h-4 w-4'
                    } ${tipConfig.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`${
                      tipConfig.size === 'featured' 
                        ? 'font-bold text-base lg:text-lg' 
                        : 'font-semibold text-sm lg:text-base'
                    } ${tipConfig.textColor} mb-1`}>
                      {tip.title}
                    </h4>
                    <p className={`${
                      tipConfig.size === 'featured' 
                        ? 'text-sm lg:text-base' 
                        : 'text-xs lg:text-sm'
                    } ${tipConfig.textColor} opacity-90 leading-relaxed`}>
                      {tip.message}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default ThreatOverview; 