// Analytics utility functions
export interface AnalyticsEvent {
  event: string
  properties: Record<string, any>
  timestamp: Date
}

class Analytics {
  private events: AnalyticsEvent[] = []

  track(event: string, properties: Record<string, any> = {}) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        url: typeof window !== "undefined" ? window.location.href : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      },
      timestamp: new Date(),
    }

    this.events.push(analyticsEvent)

    // Send to analytics service (implement your preferred service)
    this.sendToAnalytics(analyticsEvent)
  }

  private async sendToAnalytics(event: AnalyticsEvent) {
    try {
      // Example: Send to your analytics endpoint
      await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      })
    } catch (error) {
      console.error("Analytics error:", error)
    }
  }

  // Medical-specific tracking methods
  trackSymptomQuery(symptom: string, severity: string) {
    this.track("symptom_query", { symptom, severity })
  }

  trackEmergencyAlert(symptom: string) {
    this.track("emergency_alert", { symptom, priority: "high" })
  }

  trackUserFeedback(messageId: string, feedback: "positive" | "negative") {
    this.track("user_feedback", { messageId, feedback })
  }

  trackChatExport(messageCount: number) {
    this.track("chat_export", { messageCount })
  }

  trackVoiceInput(duration: number) {
    this.track("voice_input", { duration })
  }
}

export const analytics = new Analytics()
