"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { checkApiHealth } from "@/lib/api/health-check";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ApiStatus() {
  const [status, setStatus] = useState<{
    isHealthy: boolean;
    message: string;
    url: string;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      setIsChecking(true);
      const result = await checkApiHealth();
      setStatus(result);
      setIsChecking(false);
    };

    checkHealth();
    
    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (isChecking && !status) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <AlertTitle className="text-blue-900">Checking API connection...</AlertTitle>
        <AlertDescription className="text-blue-700">
          Verifying backend API availability
        </AlertDescription>
      </Alert>
    );
  }

  if (!status) return null;

  if (!status.isHealthy) {
    return (
      <Alert variant="destructive" className="border-red-300 bg-red-50">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Backend API Not Available</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>{status.message}</p>
          <p className="text-xs">
            Expected URL: <code className="rounded bg-red-100 px-1 py-0.5">{status.url}</code>
          </p>
          <p className="text-xs font-semibold">
            Please start the backend API server on port 4560
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-green-200 bg-green-50">
      <CheckCircle2 className="h-4 w-4 text-green-600" />
      <AlertTitle className="text-green-900">API Connected</AlertTitle>
      <AlertDescription className="text-green-700">
        Backend API is running at {status.url}
      </AlertDescription>
    </Alert>
  );
}
