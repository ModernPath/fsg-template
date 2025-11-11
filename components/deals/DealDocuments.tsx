"use client";

/**
 * Deal Documents Component
 * Shows NDA and other documents
 */

import { FileText, Download, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DealDocumentsProps {
  dealId: string;
  ndas: Array<{
    id: string;
    status: string;
    signed_at?: string;
    document_url?: string;
  }>;
}

export function DealDocuments({ dealId, ndas }: DealDocumentsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Documents
      </h3>

      <div className="space-y-3">
        {/* NDAs */}
        {ndas.map((nda) => (
          <div
            key={nda.id}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  NDA
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {nda.status === "signed" ? (
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Signed
                    </Badge>
                  ) : (
                    <Badge
                      variant="default"
                      className="bg-yellow-100 text-yellow-800"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                  {nda.signed_at && (
                    <span className="text-xs text-gray-500">
                      {new Date(nda.signed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {nda.document_url && (
              <Button variant="ghost" size="icon">
                <Download className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}

        {ndas.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No documents yet
          </p>
        )}
      </div>
    </div>
  );
}

