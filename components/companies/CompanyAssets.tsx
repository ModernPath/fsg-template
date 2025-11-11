"use client";

import { FileText, Image, Video, Database, Download } from "lucide-react";

export function CompanyAssets({ companyId, assets }: any) {
  const getAssetIcon = (assetType: string) => {
    switch (assetType) {
      case "image":
        return Image;
      case "video":
        return Video;
      case "data":
        return Database;
      default:
        return FileText;
    }
  };

  if (assets.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-gray-500 dark:text-gray-400">No assets yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {assets.map((asset: any) => {
        const Icon = getAssetIcon(asset.asset_type);
        return (
          <div
            key={asset.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="bg-blue-100 dark:bg-blue-900/20 rounded p-2">
                  <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {asset.file_name || "Untitled"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                    {asset.asset_type} • {asset.file_size || "Unknown size"}
                  </p>
                </div>
              </div>
              <button className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

