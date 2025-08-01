import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

export async function GET() {
  try {
    // Fetch basic stats
    const { data: chatLogs, error } = await supabase
      .from("chat_logs")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    // Calculate stats
    const totalChats = chatLogs.length
    const averageResponseTime = 2.3 // Mock data - implement actual timing

    // Calculate user satisfaction from feedback
    const feedbackLogs = chatLogs.filter((log) => log.feedback)
    const positiveFeedback = feedbackLogs.filter((log) => log.feedback === "positive").length
    const userSatisfaction = feedbackLogs.length > 0 ? Math.round((positiveFeedback / feedbackLogs.length) * 100) : 85

    // Severity distribution
    const severityCount = chatLogs.reduce(
      (acc, log) => {
        if (log.severity !== "emergency") {
          acc[log.severity] = (acc[log.severity] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>,
    )

    const severityDistribution = Object.entries(severityCount).map(([severity, count]) => ({
      severity,
      count,
      color: severity === "high" ? "#f97316" : severity === "medium" ? "#eab308" : "#22c55e",
    }))

    // Daily usage (last 7 days)
    const dailyUsage = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      const count = chatLogs.filter((log) => log.created_at.startsWith(dateStr)).length
      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        chats: count,
      }
    }).reverse()

    // Top symptoms (mock data - implement keyword extraction)
    const topSymptoms = [
      { symptom: "Headache", count: 45 },
      { symptom: "Fever", count: 38 },
      { symptom: "Cough", count: 32 },
      { symptom: "Stomach Pain", count: 28 },
      { symptom: "Fatigue", count: 25 },
    ]

    const stats = {
      totalChats,
      averageResponseTime,
      userSatisfaction,
      topSymptoms,
      severityDistribution,
      dailyUsage,
    }

    const recentChats = chatLogs.slice(0, 10)

    return NextResponse.json({ stats, recentChats })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
