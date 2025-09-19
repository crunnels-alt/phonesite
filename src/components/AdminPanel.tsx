'use client';

import { useState } from 'react';

export default function AdminPanel() {
  const [phoneNumber, setPhoneNumber] = useState('+1234567890');
  const [digit, setDigit] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<unknown>(null);

  const sendTestWebhook = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          digit,
        }),
      });

      const result = await response.json();
      setLastResponse(result);
    } catch {
      setLastResponse({ error: 'Failed to send test webhook' });
    }
    setIsLoading(false);
  };

  const clearNavigationHistory = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'DELETE',
      });
      const result = await response.json();
      setLastResponse(result);
    } catch {
      setLastResponse({ error: 'Failed to clear navigation history' });
    }
  };

  const fetchNavigationData = async () => {
    try {
      const response = await fetch('/api/users');
      const result = await response.json();
      setLastResponse(result);
    } catch {
      setLastResponse({ error: 'Failed to fetch navigation data' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h2>

      <div className="space-y-6">
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Test Webhook</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Selection
              </label>
              <select
                value={digit}
                onChange={(e) => setDigit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">1 - About</option>
                <option value="2">2 - Projects</option>
                <option value="3">3 - Photo</option>
                <option value="4">4 - Writing</option>
                <option value="0">0 - Home</option>
                <option value="*">* - Previous</option>
                <option value="#"># - Confirm</option>
              </select>
            </div>
          </div>

          <button
            onClick={sendTestWebhook}
            disabled={isLoading}
            className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {isLoading ? 'Sending...' : 'Send Test Webhook'}
          </button>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Navigation Data</h3>

          <div className="flex gap-3">
            <button
              onClick={fetchNavigationData}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              Fetch Navigation Data
            </button>

            <button
              onClick={clearNavigationHistory}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
            >
              Clear History
            </button>
          </div>
        </div>

        {lastResponse && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Last Response</h3>
            <pre className="text-sm text-gray-600 whitespace-pre-wrap overflow-auto max-h-64">
              {JSON.stringify(lastResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}