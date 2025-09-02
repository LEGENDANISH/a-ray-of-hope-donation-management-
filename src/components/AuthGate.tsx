import React, { useState } from 'react';
import { Heart, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { api } from '../lib/api';

interface AuthGateProps {
  onAuthenticated: (username: string) => void;
}

export function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [username, setUsername] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.login(username, accessKey);
      onAuthenticated(response.username);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            A Ray of Hope
          </CardTitle>
          <CardDescription>
            Expense Management System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-gray-700">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="accessKey" className="text-sm font-medium text-gray-700">
                Access Key
              </label>
              <Input
                id="accessKey"
                type="password"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="Enter your access key"
                required
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Authenticating...
                </div>
              ) : (
                <div className="flex items-center">
                  <Lock className="w-4 h-4 mr-2" />
                  Access System
                </div>
              )}
            </Button>
          </form>
          <div className="mt-6 text-xs text-gray-500 text-center">
            <p>Demo Credentials:</p>
            <p>Username: <code className="bg-gray-100 px-1 rounded">admin</code> | Key: <code className="bg-gray-100 px-1 rounded">ray-hope-2024</code></p>
            <p>Username: <code className="bg-gray-100 px-1 rounded">staff</code> | Key: <code className="bg-gray-100 px-1 rounded">staff-access-2024</code></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}