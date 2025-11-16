import React from 'react';

const TopPhishingDomains = ({ data }) => {
  const domains = data?.topPhishingDomains || [];
  
  if (!domains.length) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="mb-2">
          <svg className="mx-auto h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-sm font-medium text-gray-600 mb-1">
          No phishing domains detected
        </div>
        <div className="text-xs text-gray-400">
          {data?.totalScans > 0 
            ? `Great! No phishing attempts found in ${data.totalScans} scans`
            : 'Start scanning emails to detect phishing domains'
          }
        </div>
      </div>
    );
  }
  
  return (
    <ul className="divide-y divide-gray-200">
      {domains.map((item, index) => (
        <li key={index} className="py-3 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-gray-800 font-mono text-sm">{item.domain}</span>
          </div>
          <div className="flex items-center">
            <span className="bg-danger-100 text-danger-800 text-xs px-2 py-1 rounded">
              {item.count} detections
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default TopPhishingDomains; 