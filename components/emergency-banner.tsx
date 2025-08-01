"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Phone, X } from "lucide-react"

interface EmergencyBannerProps {
  isVisible: boolean
  onClose: () => void
}

export default function EmergencyBanner({ isVisible, onClose }: EmergencyBannerProps) {
  const [isBlinking, setIsBlinking] = useState(true)

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setIsBlinking((prev) => !prev)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-red-600 text-white shadow-lg">
      <div className="max-w-4xl mx-auto">
        <Alert className="border-red-700 bg-red-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone className={`h-5 w-5 ${isBlinking ? "opacity-100" : "opacity-50"} transition-opacity`} />
              <AlertDescription className="text-white font-semibold">
                🚨 MEDICAL EMERGENCY DETECTED - If this is a life-threatening emergency, call 911 immediately
              </AlertDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-white text-red-600 hover:bg-gray-100"
                onClick={() => window.open("tel:911")}
              >
                <Phone className="h-4 w-4 mr-1" />
                Call 911
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-red-700" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Alert>
      </div>
    </div>
  )
}
