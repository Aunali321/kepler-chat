'use client';

import { useState } from 'react';
import { Download, FileText, Code, FileImage, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  chatTitle: string;
}

export function ExportDialog({ isOpen, onClose, chatId, chatTitle }: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'markdown' | 'pdf'>('markdown');
  const [includeFiles, setIncludeFiles] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const exportFormats = [
    {
      id: 'markdown' as const,
      name: 'Markdown',
      description: 'Human-readable format, perfect for sharing and documentation',
      icon: FileText,
      extension: '.md',
      recommended: true,
    },
    {
      id: 'json' as const,
      name: 'JSON',
      description: 'Machine-readable format with full metadata and structure',
      icon: Code,
      extension: '.json',
      recommended: false,
    },
    {
      id: 'pdf' as const,
      name: 'PDF',
      description: 'Professional document format (coming soon)',
      icon: FileImage,
      extension: '.pdf',
      recommended: false,
      disabled: true,
    },
  ];

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportSuccess(false);

      const response = await fetch('/api/chat/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          format: selectedFormat,
          includeFiles,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      // Get the blob data
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get filename from response headers or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `chat-export-${Date.now()}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      } else {
        const format = exportFormats.find(f => f.id === selectedFormat);
        filename += format?.extension || '';
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Export error:', error);
      alert(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center">
                <Download className="w-5 h-5 mr-2" />
                Export Chat
              </h2>
              <p className="text-sm text-gray-500 mt-1">{chatTitle}</p>
            </div>
            <Button variant="outline" onClick={onClose} disabled={isExporting}>
              Close
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <Label className="text-base font-medium">Export Format</Label>
            <div className="mt-3 space-y-2">
              {exportFormats.map((format) => (
                <Card
                  key={format.id}
                  className={`p-4 cursor-pointer transition-all border-2 ${
                    selectedFormat === format.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  } ${format.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !format.disabled && setSelectedFormat(format.id)}
                >
                  <div className="flex items-start space-x-3">
                    <format.icon className="w-5 h-5 mt-0.5 text-gray-600 dark:text-gray-400" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{format.name}</h3>
                        {format.recommended && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Recommended
                          </span>
                        )}
                        {format.disabled && (
                          <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {format.description}
                      </p>
                    </div>
                    {selectedFormat === format.id && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Options */}
          <div>
            <Label className="text-base font-medium">Export Options</Label>
            <div className="mt-3 space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeFiles"
                  checked={includeFiles}
                  onChange={(e) => setIncludeFiles(e.target.checked)}
                  className="rounded"
                  disabled={isExporting}
                />
                <Label htmlFor="includeFiles" className="text-sm">
                  Include file attachments metadata
                </Label>
              </div>
            </div>
          </div>

          {/* Export Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-sm">What's included:</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
              <li>• All messages and timestamps</li>
              <li>• User roles and metadata</li>
              <li>• Tool calls and responses</li>
              {includeFiles && <li>• File attachment information</li>}
              <li>• Chat settings and configuration</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || exportFormats.find(f => f.id === selectedFormat)?.disabled}
            className="min-w-[120px]"
          >
            {isExporting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Exporting...</span>
              </div>
            ) : exportSuccess ? (
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4" />
                <span>Success!</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}