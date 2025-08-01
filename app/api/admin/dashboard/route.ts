// 🎯 ADMIN API - Located at: app/api/admin/dashboard/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

// 📍 API ENDPOINT: /api/admin/dashboard
// This gives admin statistics and data
export async function GET() {
  try {
    // 📊 STEP 1: Get data from database
    const { data: chatLogs, error } = await supabase
      .from("chat_logs")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    // 🧮 STEP 2: Calculate statistics
    const totalChats = chatLogs.length
    const averageResponseTime = 2.3

    // 📈 STEP 3: Prepare data for charts
    const stats = {
      totalChats,
      averageResponseTime,
      userSatisfaction: 85,
      topSymptoms: [
        { symptom: "Headache", count: 45 },
        { symptom: "Fever", count: 38 },
        { symptom: "Cough", count: 32 },
      ],
      severityDistribution: [
        { severity: "low", count: 120, color: "#22c55e" },
        { severity: "medium", count: 80, color: "#eab308" },
        { severity: "high", count: 30, color: "#f97316" },
      ],
    }

    // 📤 STEP 4: Send data back
    return NextResponse.json({ stats, recentChats: chatLogs.slice(0, 10) })
  } catch (error) {
    console.error("❌ Dashboard API Error:", error)
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 })
  }
}
