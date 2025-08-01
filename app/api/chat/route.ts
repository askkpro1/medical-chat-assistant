import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json()

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Question is required and must be a string" }, { status: 400 })
    }

    // Generate response using AI SDK
    const { text } = await generateText({
      model: openai("gpt-4"),
      system: `You are a helpful medical assistant. Your role is to provide general health information and guidance, but you must:

1. NEVER provide specific medical diagnoses
2. ALWAYS recommend consulting with healthcare professionals for serious concerns
3. Provide helpful, evidence-based general health information
4. Be empathetic and supportive
5. Include appropriate disclaimers about not replacing professional medical advice
6. If symptoms seem serious or emergency-related, strongly encourage immediate medical attention

Always end your response with: "⚠️ This information is for educational purposes only and is not a substitute for professional medical advice. Please consult with a qualified healthcare provider for proper diagnosis and treatment."`,
      prompt: question,
      maxTokens: 500,
    })

    // Optional: Save chat log to Supabase
    try {
      await supabase.from("chat_logs").insert([
        {
          question: question,
          answer: text,
        },
      ])
    } catch (supabaseError) {
      console.error("Error saving to Supabase:", supabaseError)
      // Continue even if logging fails
    }

    return NextResponse.json({ answer: text })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
