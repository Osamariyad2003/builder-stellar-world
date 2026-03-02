import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MessageSquare } from "lucide-react";

interface ResearchContactProps {
  email?: string;
  phone?: string;
  researchTitle: string;
}

export function ResearchContactMethods({
  email,
  phone,
  researchTitle,
}: ResearchContactProps) {
  const handleEmailClick = () => {
    if (email) {
      window.location.href = `mailto:${email}?subject=Interest in Research: ${researchTitle}`;
    }
  };

  const handlePhoneClick = () => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const handleMessageClick = () => {
    // This could integrate with an in-app messaging system
    alert("Messaging feature coming soon!");
  };

  return (
    <Card className="mt-8 border-t-2 border-t-blue-500">
      <div className="p-6">
        {/* Header */}
        <h3 className="text-lg md:text-xl font-semibold mb-6 text-gray-900">
          Contact Researcher
        </h3>

        {/* Contact Buttons Grid - Mobile: 1 column, Tablet: 3 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Email Button */}
          {email ? (
            <button
              onClick={handleEmailClick}
              className="group relative overflow-hidden rounded-lg border-2 border-gray-200 bg-white p-4 transition-all duration-300 hover:border-blue-500 hover:shadow-md active:scale-95 sm:flex sm:flex-col sm:items-center sm:justify-center"
            >
              <div className="flex items-center gap-3 sm:flex-col sm:gap-2">
                <Mail className="h-6 w-6 text-blue-600 transition-transform group-hover:scale-110" />
                <div className="sm:text-center">
                  <div className="text-sm font-semibold text-gray-900">
                    Send Email
                  </div>
                  <div className="hidden sm:block text-xs text-gray-600 mt-1">
                    {email}
                  </div>
                </div>
              </div>
            </button>
          ) : null}

          {/* Phone Button */}
          {phone ? (
            <button
              onClick={handlePhoneClick}
              className="group relative overflow-hidden rounded-lg border-2 border-gray-200 bg-white p-4 transition-all duration-300 hover:border-green-500 hover:shadow-md active:scale-95 sm:flex sm:flex-col sm:items-center sm:justify-center"
            >
              <div className="flex items-center gap-3 sm:flex-col sm:gap-2">
                <Phone className="h-6 w-6 text-green-600 transition-transform group-hover:scale-110" />
                <div className="sm:text-center">
                  <div className="text-sm font-semibold text-gray-900">
                    Call
                  </div>
                  <div className="hidden sm:block text-xs text-gray-600 mt-1">
                    {phone}
                  </div>
                </div>
              </div>
            </button>
          ) : null}

          {/* Message Button */}
          <button
            onClick={handleMessageClick}
            className="group relative overflow-hidden rounded-lg border-2 border-gray-200 bg-white p-4 transition-all duration-300 hover:border-purple-500 hover:shadow-md active:scale-95 sm:flex sm:flex-col sm:items-center sm:justify-center"
          >
            <div className="flex items-center gap-3 sm:flex-col sm:gap-2">
              <MessageSquare className="h-6 w-6 text-purple-600 transition-transform group-hover:scale-110" />
              <div className="sm:text-center">
                <div className="text-sm font-semibold text-gray-900">
                  Message
                </div>
                <div className="hidden sm:block text-xs text-gray-600 mt-1">
                  Send a message
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Mobile-friendly text display */}
        <div className="mt-6 space-y-3 sm:hidden text-sm text-gray-600">
          {email && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <span className="font-medium text-gray-900">Email: </span>
              {email}
            </div>
          )}
          {phone && (
            <div className="p-3 bg-green-50 rounded-lg">
              <span className="font-medium text-gray-900">Phone: </span>
              {phone}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
