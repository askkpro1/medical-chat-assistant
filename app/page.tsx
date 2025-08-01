"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Send, Bot, User, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function MedicalChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: input }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error. Please try again later.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold text-blue-700">
              <Bot className="h-8 w-8" />🩺 Medical Chat Assistant
            </CardTitle>
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> This assistant provides general health information only. It is not a
                substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified
                healthcare providers for medical concerns.
              </AlertDescription>
            </Alert>
          </CardHeader>
        </Card>

        {/* Chat Interface */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Chat with Medical Assistant</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {/* Messages */}
            <ScrollArea className="flex-1 pr-4 mb-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                  <p className="text-lg font-medium">Welcome to your Medical Assistant</p>
                  <p className="text-sm mt-2">Describe your symptoms or ask health-related questions to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`flex gap-3 max-w-[80%] ${
                          message.role === "user" ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.role === "user" ? "bg-blue-500 text-white" : "bg-green-500 text-white"
                          }`}
                        >
                          {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div
                          className={`rounded-lg p-3 ${
                            message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className={`text-xs mt-1 ${message.role === "user" ? "text-blue-100" : "text-gray-500"}`}>
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-gray-600">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe your symptoms or ask a health question..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={!input.trim() || isLoading} size="icon">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 mt-4">
          <p>Built with Next.js, OpenAI GPT-4, and Supabase • Always consult healthcare professionals</p>
        </div>
      </div>
    </div>
  )
}
