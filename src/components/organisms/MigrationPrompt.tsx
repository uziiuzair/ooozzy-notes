"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  hasLocalStorageData,
  isMigrationCompleted,
  migrateLocalStorageToFirestore,
  clearLocalStorageData,
  MigrationResult,
} from "@/lib/migration/localStorageToFirestore";
import { cn } from "@/lib/utils";

export function MigrationPrompt() {
  const { user, isAuthenticated } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function checkMigrationNeeded() {
      if (!isAuthenticated || !user || dismissed) {
        return;
      }

      // Check if migration already completed
      if (isMigrationCompleted()) {
        return;
      }

      // Check if there's LocalStorage data to migrate
      const hasData = await hasLocalStorageData();
      setShowPrompt(hasData);
    }

    checkMigrationNeeded();
  }, [isAuthenticated, user, dismissed]);

  const handleMigrate = async () => {
    if (!user) return;

    setMigrating(true);
    setProgress("Starting migration...");

    try {
      const migrationResult = await migrateLocalStorageToFirestore(
        user.uid,
        (message) => {
          setProgress(message);
        }
      );

      setResult(migrationResult);
      setProgress("");

      // If successful, optionally prompt to clear LocalStorage
      if (migrationResult.success) {
        setTimeout(() => {
          setShowPrompt(false);
        }, 3000);
      }
    } catch (error) {
      setProgress(`Migration failed: ${error}`);
    } finally {
      setMigrating(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowPrompt(false);
  };

  const handleClearLocalStorage = () => {
    if (
      confirm(
        "Are you sure you want to clear your LocalStorage data? This cannot be undone."
      )
    ) {
      try {
        clearLocalStorageData(true);
        alert("LocalStorage data cleared successfully!");
        setShowPrompt(false);
      } catch (error) {
        alert(`Failed to clear LocalStorage: ${error}`);
      }
    }
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Migrate Your Data
          </h2>
          <p className="text-gray-600">
            We found notes, folders, photos, or links in your browser&apos;s local
            storage. Would you like to migrate them to your cloud account?
          </p>
        </div>

        {/* Progress */}
        {migrating && progress && (
          <div className="mb-4 p-3 bg-lavender rounded-xl">
            <p className="text-sm text-gray-700">{progress}</p>
          </div>
        )}

        {/* Result */}
        {result && !migrating && (
          <div
            className={cn(
              "mb-4 p-4 rounded-xl",
              result.success ? "bg-green-50" : "bg-red-50"
            )}
          >
            <h3
              className={cn(
                "font-semibold mb-2",
                result.success ? "text-green-900" : "text-red-900"
              )}
            >
              {result.success ? "Migration Successful!" : "Migration Completed with Errors"}
            </h3>
            <ul className="text-sm space-y-1">
              <li className="text-gray-700">
                ✅ {result.notesCount} notes migrated
              </li>
              <li className="text-gray-700">
                ✅ {result.foldersCount} folders migrated
              </li>
              <li className="text-gray-700">
                ✅ {result.photosCount} photos migrated
              </li>
              <li className="text-gray-700">
                ✅ {result.linksCount} links migrated
              </li>
            </ul>

            {result.errors.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-semibold text-red-900 mb-1">
                  Errors:
                </h4>
                <ul className="text-xs text-red-700 space-y-1">
                  {result.errors.slice(0, 3).map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                  {result.errors.length > 3 && (
                    <li>• ... and {result.errors.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}

            {result.success && (
              <button
                onClick={handleClearLocalStorage}
                className="mt-3 text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear local storage data
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        {!result && (
          <div className="flex gap-3">
            <button
              onClick={handleMigrate}
              disabled={migrating}
              className={cn(
                "flex-1 px-4 py-3 rounded-xl font-medium",
                "bg-electric-violet text-white",
                "hover:bg-heliotrope",
                "focus:outline-none focus:ring-2 focus:ring-electric-violet focus:ring-offset-2",
                "transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {migrating ? "Migrating..." : "Migrate Now"}
            </button>

            <button
              onClick={handleDismiss}
              disabled={migrating}
              className={cn(
                "px-4 py-3 rounded-xl font-medium",
                "bg-gray-100 text-gray-700",
                "hover:bg-gray-200",
                "focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2",
                "transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Later
            </button>
          </div>
        )}

        {result && (
          <button
            onClick={() => setShowPrompt(false)}
            className={cn(
              "w-full px-4 py-3 rounded-xl font-medium",
              "bg-electric-violet text-white",
              "hover:bg-heliotrope",
              "focus:outline-none focus:ring-2 focus:ring-electric-violet focus:ring-offset-2",
              "transition-all duration-200"
            )}
          >
            Close
          </button>
        )}

        {/* Info */}
        <p className="mt-4 text-xs text-gray-500 text-center">
          Your data will remain in local storage unless you manually clear it.
          You can migrate again later from settings.
        </p>
      </div>
    </div>
  );
}
