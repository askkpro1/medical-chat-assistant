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

function assessSeverity(question: string, isEmergency: boolean): string {
  if (isEmergency) return "emergency"

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
  try {
    const ip = req.ip || req.headers.get("x-forwarded-for") || "unknown"

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before making another request." },
        { status: 429 },
      )
    }

    const { question, isEmergency = false, chatHistory = [] } = await req.json()

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Question is required and must be a string" }, { status: 400 })
    }

    // Build context from chat history
    const contextMessages = chatHistory.slice(-3).map((msg: any) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    }))

    const severity = assessSeverity(question, isEmergency)

    // Enhanced system prompt based on severity
    const systemPrompt = `You are a helpful medical assistant. Your role is to provide general health information and guidance, but you must:

1. NEVER provide specific medical diagnoses
2. ALWAYS recommend consulting with healthcare professionals for serious concerns
3. Provide helpful, evidence-based general health information
4. Be empathetic and supportive
5. Include appropriate disclaimers about not replacing professional medical advice
6. If symptoms seem serious or emergency-related, strongly encourage immediate medical attention

Current conversation context: You are continuing a conversation with this user. Consider the previous messages for context but focus on the current question.

Severity level: ${severity.toUpperCase()}
${isEmergency ? "⚠️ EMERGENCY DETECTED: This user may be experiencing a medical emergency. Prioritize safety and encourage immediate medical attention." : ""}

Always end your response with: "⚠️ This information is for educational purposes only and is not a substitute for professional medical advice. Please consult with a qualified healthcare provider for proper diagnosis and treatment."`

    // Generate response using AI SDK with context
    const { text } = await generateText({
      model: openai("gpt-4"),
      system: systemPrompt,
      messages: [...contextMessages, { role: "user", content: question }],
      maxTokens: isEmergency ? 300 : 500,
      temperature: 0.7,
    })

    // Enhanced logging with more metadata
    try {
      await supabase.from("chat_logs").insert([
        {
          question: question,
          answer: text,
          severity: severity,
          is_emergency: isEmergency,
          user_ip: ip,
          response_time: new Date(),
          context_length: chatHistory.length,
        },
      ])
    } catch (supabaseError) {
      console.error("Error saving to Supabase:", supabaseError)
      // Continue even if logging fails
    }

    return NextResponse.json({
      answer: text,
      severity: severity,
      isEmergency: isEmergency,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
