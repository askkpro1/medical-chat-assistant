import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

// Rate limiting (simple in-memory store - use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const maxRequests = 10

  const current = rateLimitMap.get(ip)

  if (!current || now > current.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (current.count >= maxRequests) {
    return false
  }

  current.count++
  return true
}

function assessSeverity(question: string): string {
  const highSeverityKeywords = [
    "severe pain",
    "high fever",
    "difficulty swallowing",
    "persistent vomiting",
    "severe headache",
    "vision problems",
    "numbness",
    "weakness",
  ]

  const mediumSeverityKeywords = ["pain", "fever", "nausea", "headache", "dizziness", "rash", "cough"]

  const questionLower = question.toLowerCase()

  if (highSeverityKeywords.some((keyword) => questionLower.includes(keyword))) {
    return "high"
  }

  if (mediumSeverityKeywords.some((keyword) => questionLower.includes(keyword))) {
    return "medium"
  }

  return "low"
}

export async function POST(req: NextRequest) {
  console.log("🚀 Chat API called")

  try {
    const ip = req.ip || req.headers.get("x-forwarded-for") || "unknown"
    console.log("📍 Request IP:", ip)

    // Check rate limit
    if (!checkRateLimit(ip)) {
      console.log("⚠️ Rate limit exceeded for IP:", ip)
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before making another request." },
        { status: 429 },
      )
    }

    const body = await req.json()
    console.log("📝 Request body:", body)

    const { question, chatHistory = [] } = body

    if (!question || typeof question !== "string") {
      console.log("❌ Invalid question:", question)
      return NextResponse.json({ error: "Question is required and must be a string" }, { status: 400 })
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY is not configured")
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    console.log("🔑 OpenAI API Key present:", process.env.OPENAI_API_KEY?.substring(0, 7) + "...")

    // Build context from chat history
    const contextMessages = chatHistory.slice(-3).map((msg: any) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    }))

    console.log("💬 Context messages:", contextMessages.length)

    const severity = assessSeverity(question)
    console.log("📊 Assessed severity:", severity)

    // Enhanced system prompt for India
    const systemPrompt = `You are a helpful medical assistant for users in India. Your role is to provide general health information and guidance, but you must:

1. NEVER provide specific medical diagnoses
2. ALWAYS recommend consulting with healthcare professionals for serious concerns
3. Provide helpful, evidence-based general health information
4. Be empathetic and supportive
5. Include appropriate disclaimers about not replacing professional medical advice
6. If symptoms seem serious, encourage consulting with a healthcare provider
7. For emergencies, mention calling 112 (National Emergency Number) or 108 (Medical Emergency)

Current conversation context: You are continuing a conversation with this user. Consider the previous messages for context but focus on the current question.

Severity level: ${severity.toUpperCase()}

Always end your response with: "⚠️ This information is for educational purposes only and is not a substitute for professional medical advice. Please consult with a qualified healthcare provider for proper diagnosis and treatment. For medical emergencies, call 108 or 112."`

    console.log("🤖 Calling OpenAI API...")

    // Generate response using AI SDK with context
    const { text } = await generateText({
      model: openai("gpt-4o-mini"), // Using gpt-4o-mini for cost efficiency
      system: systemPrompt,
      messages: [...contextMessages, { role: "user", content: question }],
      maxTokens: 500,
      temperature: 0.7,
    })

    console.log("✅ OpenAI response received, length:", text.length)
    console.log("📄 Response preview:", text.substring(0, 100) + "...")

    // Enhanced logging with more metadata
    try {
      console.log("💾 Saving to Supabase...")
      const { data, error } = await supabase.from("chat_logs").insert([
        {
          question: question,
          answer: text,
          severity: severity,
          user_ip: ip,
          response_time: new Date(),
          context_length: chatHistory.length,
        },
      ])

      if (error) {
        console.error("❌ Supabase error:", error)
      } else {
        console.log("✅ Saved to Supabase successfully")
      }
    } catch (supabaseError) {
      console.error("❌ Error saving to Supabase:", supabaseError)
      // Continue even if logging fails
    }

    const response = {
      answer: text,
      severity: severity,
      timestamp: new Date().toISOString(),
    }

    console.log("🎉 Sending successful response")
    return NextResponse.json(response)
  } catch (error) {
    console.error("💥 Error in chat API:", error)

    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name)
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 },
    )
  }
}
