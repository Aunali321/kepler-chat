"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type LoadingSize = "sm" | "md" | "lg";

interface LoadingSpinnerProps {
  size?: LoadingSize;
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6", 
  lg: "h-8 w-8",
};

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  return (
    <Loader2 
      className={cn(
        "animate-spin",
        sizeClasses[size],
        className
      )} 
    />
  );
}

interface LoadingOverlayProps {
  children: React.ReactNode;
  isLoading: boolean;
  size?: LoadingSize;
  text?: string;
}

export function LoadingOverlay({ 
  children, 
  isLoading, 
  size = "md", 
  text = "Loading..." 
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex items-center space-x-2">
            <LoadingSpinner size={size} />
            <span className="text-sm text-muted-foreground">{text}</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface SkeletonLoaderProps {
  lines?: number;
  className?: string;
}

export function SkeletonLoader({ lines = 3, className }: SkeletonLoaderProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className={cn(
            "h-4 bg-muted rounded animate-pulse",
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          )} 
        />
      ))}
    </div>
  );
}

interface LoadingPageProps {
  title?: string;
  description?: string;
  size?: LoadingSize;
}

export function LoadingPage({ 
  title = "Loading", 
  description = "Please wait while we prepare your content...",
  size = "lg" 
}: LoadingPageProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <LoadingSpinner size={size} className="mx-auto" />
        <div className="space-y-2">
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}