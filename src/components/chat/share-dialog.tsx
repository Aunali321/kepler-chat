'use client';

import { useState, useEffect } from 'react';
import { Share2, Copy, Users, Globe, Calendar, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useForm } from '@/lib/stores/form-store';
import { useNotify } from '@/lib/stores/notification-store';
import type { ChatShare } from '@/lib/db/types';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  chatTitle: string;
}

export function ShareDialog({ isOpen, onClose, chatId, chatTitle }: ShareDialogProps) {
  const [shares, setShares] = useState<ChatShare[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [permission, setPermission] = useState<'read' | 'comment' | 'edit'>('read');
  const [expiresAt, setExpiresAt] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Use form store for loading/error states
  const { form: formState, handleSubmit } = useForm('share-dialog');
  const notify = useNotify();

  useEffect(() => {
    if (isOpen) {
      loadShares();
    }
  }, [isOpen, chatId]);

  const loadShares = async () => {
    await handleSubmit(async () => {
      const response = await fetch(`/api/chat/share?chatId=${chatId}`);
      if (response.ok) {
        const data = await response.json();
        setShares(data.shares);
        return data;
      }
      throw new Error('Failed to load shares');
    });
  };

  const createShare = async () => {
    const result = await handleSubmit(async () => {
      const response = await fetch('/api/chat/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          permission,
          isPublic,
          expiresAt: expiresAt || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create share');
      }

      const data = await response.json();
      return data;
    }, {
      successMessage: 'Share created successfully!',
      showNotifications: true,
    });

    if (result) {
      setShares([...shares, result.share]);
      setUserEmail('');
      setPermission('read');
      setExpiresAt('');
      setIsPublic(false);
    }
  };

  const revokeShare = async (shareId: string) => {
    try {
      const response = await fetch(`/api/chat/share?shareId=${shareId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShares(shares.filter(share => share.id !== shareId));
      }
    } catch (error) {
      console.error('Error revoking share:', error);
    }
  };

  const copyShareToken = async (token: string) => {
    try {
      const shareUrl = `${window.location.origin}/shared/${token}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
      notify.success('Share link copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      notify.error('Failed to copy link to clipboard');
    }
  };

  const getPermissionColor = (perm: string) => {
    switch (perm) {
      case 'read': return 'text-green-600 bg-green-100';
      case 'comment': return 'text-blue-600 bg-blue-100';
      case 'edit': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center">
                <Share2 className="w-5 h-5 mr-2" />
                Share Chat
              </h2>
              <p className="text-sm text-gray-500 mt-1">{chatTitle}</p>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Create New Share */}
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Create New Share</h3>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="isPublic" className="flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  Make public (anyone with link can access)
                </Label>
              </div>

              {!isPublic && (
                <div>
                  <Label htmlFor="userEmail">Share with specific user (email)</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    placeholder="user@example.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="permission">Permission</Label>
                  <select
                    id="permission"
                    value={permission}
                    onChange={(e) => setPermission(e.target.value as any)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="read">Read only</option>
                    <option value="comment">Read & Comment</option>
                    <option value="edit">Full Edit</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="expiresAt">Expires at (optional)</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={createShare}
                disabled={formState.isLoading || (!isPublic && !userEmail.trim())}
                className="w-full"
              >
                {formState.isLoading ? 'Creating...' : 'Create Share'}
              </Button>
            </div>
          </Card>

          {/* Existing Shares */}
          <div>
            <h3 className="text-lg font-medium mb-4">Active Shares ({shares.length})</h3>

            {shares.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No active shares</p>
                <p className="text-sm text-gray-400 mt-1">Create a share to collaborate with others</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {shares.map((share) => (
                  <Card key={share.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          {share.isPublic ? (
                            <Globe className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Users className="w-4 h-4 text-green-500" />
                          )}

                          <div>
                            <p className="font-medium">
                              {share.isPublic ? 'Public Link' : share.sharedWithUserId || 'Direct Share'}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className={`px-2 py-1 rounded-full text-xs ${getPermissionColor(share.permission || 'read')}`}>
                                {share.permission}
                              </span>
                              {share.expiresAt && (
                                <span className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  Expires {new Date(share.expiresAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {share.shareToken && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyShareToken(share.shareToken!)}
                            className="flex items-center space-x-1"
                          >
                            {copiedToken === share.shareToken ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                            <span>{copiedToken === share.shareToken ? 'Copied!' : 'Copy Link'}</span>
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revokeShare(share.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}