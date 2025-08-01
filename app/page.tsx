"use client"

import { TooltipTrigger } from "@/components/ui/tooltip"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Loader2,
  Send,
  Bot,
  User,
  AlertTriangle,
  Download,
  Mic,
  MicOff,
  ThumbsUp,
  ThumbsDown,
  Moon,
  Sun,
  Phone,
  AlertCircle,
  Clock,
  MessageSquare,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useTheme } from "next-themes"
import { Tooltip, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import type { SpeechRecognition } from "types/web"

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  isEmergency?: boolean
  feedback?: "positive" | "negative"
  severity?: "low" | "medium" | "high" | "emergency"
}

interface TypingIndicator {
  isTyping: boolean
  message: string
}

export default function MedicalChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [typingIndicator, setTypingIndicator] = useState<TypingIndicator>({ isTyping: false, message: "" })
  const [chatStats, setChatStats] = useState({ totalMessages: 0, emergencyAlerts: 0 })
  const { theme, setTheme } = useTheme()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("medical-chat-history")
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages)
        setMessages(
          parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        )
      } catch (error) {
        console.error("Error loading chat history:", error)
      }
    }
  }, [])

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("medical-chat-history", JSON.stringify(messages))
      setChatStats({
        totalMessages: messages.length,
        emergencyAlerts: messages.filter((m) => m.isEmergency).length,
      })
    }
  }, [messages])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages, typingIndicator])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = "en-US"

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsListening(false)
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [])

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true)
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const detectEmergencyKeywords = (text: string): boolean => {
    const emergencyKeywords = [
      "chest pain",
      "heart attack",
      "can't breathe",
      "difficulty breathing",
      "severe pain",
      "unconscious",
      "bleeding heavily",
      "suicide",
      "overdose",
      "stroke",
      "seizure",
      "choking",
      "severe allergic reaction",
    ]
    return emergencyKeywords.some((keyword) => text.toLowerCase().includes(keyword.toLowerCase()))
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const isEmergency = detectEmergencyKeywords(input)

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
      isEmergency,
      severity: isEmergency ? "emergency" : "low",
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Show typing indicator
    setTypingIndicator({ isTyping: true, message: "Analyzing your symptoms..." })

    // Add emergency alert if detected
    if (isEmergency) {
      const emergencyAlert: Message = {
        id: (Date.now() + 0.5).toString(),
        role: "system",
        content:
          "🚨 EMERGENCY DETECTED: Your symptoms may require immediate medical attention. Please call 911 or go to the nearest emergency room if you're experiencing a medical emergency.",
        timestamp: new Date(),
        isEmergency: true,
        severity: "emergency",
      }
      setMessages((prev) => [...prev, emergencyAlert])
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: input,
          isEmergency,
          chatHistory: messages.slice(-5), // Send last 5 messages for context
        }),
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
        severity: data.severity || "low",
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I apologize, but I encountered an error. Please try again later. If this is an emergency, please call 911 immediately.",
        timestamp: new Date(),
        severity: "medium",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setTypingIndicator({ isTyping: false, message: "" })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const provideFeedback = (messageId: string, feedback: "positive" | "negative") => {
    setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, feedback } : msg)))
  }

  const exportChat = () => {
    const chatData = {
      exportDate: new Date().toISOString(),
      totalMessages: messages.length,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        severity: msg.severity,
      })),
    }

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `medical-chat-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearChat = () => {
    setMessages([])
    localStorage.removeItem("medical-chat-history")
    setChatStats({ totalMessages: 0, emergencyAlerts: 0 })
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "emergency":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      default:
        return "bg-green-500"
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 transition-colors">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-2xl font-bold text-blue-700 dark:text-blue-400">
                  <Bot className="h-8 w-8" />🩺 Medical Chat Assistant
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {chatStats.totalMessages}
                  </Badge>
                  {chatStats.emergencyAlerts > 0 && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {chatStats.emergencyAlerts}
                    </Badge>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      >
                        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Toggle theme</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={exportChat} disabled={messages.length === 0}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Export chat history</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> This assistant provides general health information only. It is not a
                  substitute for professional medical advice, diagnosis, or treatment.
                  <strong className="text-red-600"> For emergencies, call 911 immediately.</strong>
                </AlertDescription>
              </Alert>

              {/* Emergency Contact */}
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <Phone className="h-4 w-4" />
                  <span className="font-semibold">Emergency: 911 | Poison Control: 1-800-222-1222</span>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Chat Interface */}
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Chat with Medical Assistant</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={clearChat} disabled={messages.length === 0}>
                    Clear Chat
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Messages */}
              <ScrollArea className="flex-1 pr-4 mb-4" ref={scrollAreaRef}>
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                    <p className="text-lg font-medium">Welcome to your Medical Assistant</p>
                    <p className="text-sm mt-2">
                      Describe your symptoms or ask health-related questions to get started.
                    </p>
                    <div className="mt-4 text-xs text-gray-400">
                      💡 Try voice input, export your chat, or switch to dark mode
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`flex gap-3 max-w-[85%] ${
                            message.role === "user" ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              message.role === "user"
                                ? "bg-blue-500 text-white"
                                : message.role === "system"
                                  ? "bg-red-500 text-white"
                                  : "bg-green-500 text-white"
                            }`}
                          >
                            {message.role === "user" ? (
                              <User className="h-4 w-4" />
                            ) : message.role === "system" ? (
                              <AlertCircle className="h-4 w-4" />
                            ) : (
                              <Bot className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <div
                              className={`rounded-lg p-3 ${
                                message.role === "user"
                                  ? "bg-blue-500 text-white"
                                  : message.role === "system"
                                    ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              }`}
                            >
                              {message.severity && message.role !== "user" && (
                                <div className="flex items-center gap-2 mb-2">
                                  <div className={`w-2 h-2 rounded-full ${getSeverityColor(message.severity)}`} />
                                  <span className="text-xs font-medium capitalize">{message.severity} Priority</span>
                                </div>
                              )}
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              <div className="flex items-center justify-between mt-2">
                                <p
                                  className={`text-xs ${
                                    message.role === "user"
                                      ? "text-blue-100"
                                      : message.role === "system"
                                        ? "text-red-600 dark:text-red-400"
                                        : "text-gray-500 dark:text-gray-400"
                                  }`}
                                >
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {message.timestamp.toLocaleTimeString()}
                                </p>
                                {message.role === "assistant" && (
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={`h-6 w-6 p-0 ${
                                        message.feedback === "positive" ? "text-green-600" : "text-gray-400"
                                      }`}
                                      onClick={() => provideFeedback(message.id, "positive")}
                                    >
                                      <ThumbsUp className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={`h-6 w-6 p-0 ${
                                        message.feedback === "negative" ? "text-red-600" : "text-gray-400"
                                      }`}
                                      onClick={() => provideFeedback(message.id, "negative")}
                                    >
                                      <ThumbsDown className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Typing Indicator */}
                    {typingIndicator.isTyping && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{typingIndicator.message}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Describe your symptoms or ask a health question..."
                      disabled={isLoading}
                      className="min-h-[44px] max-h-32 resize-none pr-12"
                      rows={1}
                    />
                    <div className="absolute right-2 top-2 flex gap-1">
                      {recognitionRef.current && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={isListening ? stopListening : startListening}
                              disabled={isLoading}
                            >
                              {isListening ? <MicOff className="h-4 w-4 text-red-500" /> : <Mic className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{isListening ? "Stop listening" : "Voice input"}</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                  <Button onClick={sendMessage} disabled={!input.trim() || isLoading} size="icon" className="h-11 w-11">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>

                {isListening && (
                  <div className="text-center">
                    <Badge variant="secondary" className="animate-pulse">
                      🎤 Listening... Speak now
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
            <p>Built with Next.js, OpenAI GPT-4, and Supabase • Always consult healthcare professionals</p>
            <p className="text-xs mt-1">Enhanced with voice input, emergency detection, and chat export</p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
