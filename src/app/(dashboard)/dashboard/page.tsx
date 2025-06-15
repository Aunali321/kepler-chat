"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserProfileForm } from "@/components/auth/user-profile-form";
import { authClient } from "@/lib/auth-client";
import { LogOut, MessageCircle, Upload, Settings } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kepler Chat</h1>
              <p className="text-sm text-gray-600">Welcome to your dashboard</p>
            </div>
            
            <Button
              variant="outline"
              onClick={() => authClient.signOut()}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Welcome Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Welcome to Kepler Chat
                </CardTitle>
                <CardDescription>
                  Your multi-user AI chat platform is ready! Here's what you can do:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <MessageCircle className="h-5 w-5 text-blue-600" />
                      <h3 className="font-medium">Start Chatting</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Create your first chat and start conversations with AI models.
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Upload className="h-5 w-5 text-green-600" />
                      <h3 className="font-medium">Upload Files</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Share images, documents, and other files in your conversations.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Coming Soon:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Multiple AI providers (OpenAI, Anthropic, Google)</li>
                    <li>• Real-time streaming responses</li>
                    <li>• Multi-modal conversations</li>
                    <li>• Tool/function calling</li>
                    <li>• Chat history and organization</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Authentication</p>
                      <p className="text-xs text-gray-600">Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Database</p>
                      <p className="text-xs text-gray-600">Connected</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">File Storage</p>
                      <p className="text-xs text-gray-600">Ready</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Profile Section */}
          <div className="space-y-6">
            <UserProfileForm />
          </div>
        </div>
      </main>
    </div>
  );
}