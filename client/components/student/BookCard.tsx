import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, BookOpen } from "lucide-react";

interface BookCardProps {
  id?: string;
  title: string;
  author: string;
  description?: string;
  imageUrl?: string;
  googleDriveUrl?: string;
  pdfUrl?: string;
}

export function BookCard({
  title,
  author,
  description,
  imageUrl,
  googleDriveUrl,
  pdfUrl,
}: BookCardProps) {
  const handleDriveClick = () => {
    if (googleDriveUrl) {
      window.open(googleDriveUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handlePdfClick = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Book Image */}
      {imageUrl ? (
        <div className="relative w-full bg-gradient-to-b from-gray-200 to-gray-100 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="w-full h-48 bg-gradient-to-b from-blue-100 to-blue-50 flex items-center justify-center">
          <BookOpen className="h-16 w-16 text-blue-300" />
        </div>
      )}

      {/* Card Content */}
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <CardTitle className="line-clamp-2 text-base md:text-lg">
            {title}
          </CardTitle>
          <CardDescription className="text-sm">by {author}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col pb-4">
        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">
            {description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 mt-auto pt-4 border-t">
          {/* Google Drive Button */}
          {googleDriveUrl && (
            <Button
              onClick={handleDriveClick}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
            >
              <ExternalLink className="h-4 w-4" />
              Open in Drive
            </Button>
          )}

          {/* PDF Download Button */}
          {pdfUrl && (
            <Button
              onClick={handlePdfClick}
              variant="outline"
              className="w-full rounded-lg py-2 flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
            >
              <ExternalLink className="h-4 w-4" />
              Open PDF
            </Button>
          )}

          {/* No links message */}
          {!googleDriveUrl && !pdfUrl && (
            <div className="text-xs text-gray-400 text-center py-2">
              No links available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
