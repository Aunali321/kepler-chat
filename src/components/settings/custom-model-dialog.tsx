"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { providerMetadata } from '@/lib/provider-metadata';
import type { ProviderType } from '@/lib/db/types';

interface CustomModelDialogProps {
  provider: ProviderType;
  isOpen: boolean;
  onClose: () => void;
}

export function CustomModelDialog({ provider, isOpen, onClose }: CustomModelDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Custom model functionality has been simplified/removed
    toast.info('Feature Disabled', 'Custom model creation has been simplified in this version.');
    
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Custom Models for {providerMetadata[provider].name}
          </DialogTitle>
          <DialogDescription>
            Custom model configuration has been simplified in this version of the application.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            This feature is currently disabled as part of the codebase simplification. 
            The application now uses the default models provided by each AI service.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}