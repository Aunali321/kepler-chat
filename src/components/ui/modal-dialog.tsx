"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Dynamic content imports
import { SearchContent } from "@/components/dialogs/search-content";
import { ExportContent } from "@/components/dialogs/export-content";
import { ShareContent } from "@/components/dialogs/share-content";
import { SettingsContent } from "@/components/dialogs/settings-content";

type DialogType = "search" | "export" | "share" | "settings";

interface SearchData {
  onChatSelect: (chatId: string) => void;
}

interface ExportData {
  chatId: string;
  chatTitle: string;
}

interface ShareData {
  chatId: string;
  chatTitle: string;
}

interface SettingsData {
  // No additional data needed for settings
}

type DialogData = {
  search: SearchData;
  export: ExportData;
  share: ShareData;
  settings: SettingsData;
};

interface ModalDialogProps<T extends DialogType> {
  type: T;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: DialogData[T];
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[95vw]",
};

export function ModalDialog<T extends DialogType>({
  type,
  isOpen,
  onClose,
  title,
  data,
  className,
  size = "md",
}: ModalDialogProps<T>) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Handle click outside
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Focus management
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const focusableElement = dialogRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      
      if (focusableElement) {
        focusableElement.focus();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const renderContent = () => {
    switch (type) {
      case "search":
        return <SearchContent onClose={onClose} {...(data as SearchData)} />;
      case "export":
        return <ExportContent onClose={onClose} {...(data as ExportData)} />;
      case "share":
        return <ShareContent onClose={onClose} {...(data as ShareData)} />;
      case "settings":
        return <SettingsContent onClose={onClose} {...(data as SettingsData)} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={dialogRef}
        className={cn(
          "bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-200",
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 
              id="modal-title" 
              className="text-xl font-semibold text-gray-900 dark:text-gray-100"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

// Type-safe wrapper components for easier usage
export function SearchModal(props: Omit<ModalDialogProps<"search">, "type">) {
  return <ModalDialog {...props} type="search" />;
}

export function ExportModal(props: Omit<ModalDialogProps<"export">, "type">) {
  return <ModalDialog {...props} type="export" />;
}

export function ShareModal(props: Omit<ModalDialogProps<"share">, "type">) {
  return <ModalDialog {...props} type="share" />;
}

export function SettingsModal(props: Omit<ModalDialogProps<"settings">, "type">) {
  return <ModalDialog {...props} type="settings" size="xl" />;
}