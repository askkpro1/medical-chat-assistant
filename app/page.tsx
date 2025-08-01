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
  Clock,
  MessageSquare,
  AlertCircle,
  Trash2,
  MoreVertical,
  Archive,
  History,
  Plus,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useTheme } from "next-themes"
import { Tooltip, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { SpeechRecognition } from "types/web"

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  feedback?: "positive" | "negative"
  severity?: "low" | "medium" | "high"
}

interface TypingIndicator {
  isTyping: boolean
  message: string
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  lastActivity: Date
}

export default function MedicalChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [typingIndicator, setTypingIndicator] = useState<TypingIndicator>({ isTyping: false, message: "" })
  const [chatStats, setChatStats] = useState({ totalMessages: 0 })
  const [error, setError] = useState<string | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)
  const { theme, setTheme } = useTheme()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Load chat history and sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem("medical-chat-sessions")
    const savedCurrentSession = localStorage.getItem("medical-current-session")

    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions).map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          lastActivity: new Date(session.lastActivity),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }))
        setChatSessions(parsed)

        if (savedCurrentSession) {
          const currentSession = parsed.find((s: ChatSession) => s.id === savedCurrentSession)
          if (currentSession) {
            setCurrentSessionId(currentSession.id)
            setMessages(currentSession.messages)
          }
        }
      } catch (error) {
        console.error("Error loading chat sessions:", error)
      }
    }
  }, [])

  // Save chat sessions to localStorage
  useEffect(() => {
    if (chatSessions.length > 0) {
      localStorage.setItem("medical-chat-sessions", JSON.stringify(chatSessions))
    }
    if (currentSessionId) {
      localStorage.setItem("medical-current-session", currentSessionId)
    }
  }, [chatSessions, currentSessionId])

  // Update current session when messages change
  useEffect(() => {
    if (messages.length > 0 && currentSessionId) {
      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === currentSessionId
            ? {
                ...session,
                messages,
                lastActivity: new Date(),
                title: session.title || generateSessionTitle(messages[0]?.content || "New Chat"),
              }
            : session,
        ),
      )
      setChatStats({ totalMessages: messages.length })
    }
  }, [messages, currentSessionId])

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

  const generateSessionTitle = (firstMessage: string): string => {
    const words = firstMessage.split(" ").slice(0, 4).join(" ")
    return words.length > 30 ? words.substring(0, 30) + "..." : words
  }

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date(),
    }

    setChatSessions((prev) => [newSession, ...prev])
    setCurrentSessionId(newSession.id)
    setMessages([])
    setError(null)
  }

  const loadSession = (sessionId: string) => {
    const session = chatSessions.find((s) => s.id === sessionId)
    if (session) {
      setCurrentSessionId(sessionId)
      setMessages(session.messages)
      setShowHistoryPanel(false)
      setError(null)
    }
  }

  const deleteSession = (sessionId: string) => {
    setChatSessions((prev) => prev.filter((s) => s.id !== sessionId))
    if (currentSessionId === sessionId) {
      const remainingSessions = chatSessions.filter((s) => s.id !== sessionId)
      if (remainingSessions.length > 0) {
        loadSession(remainingSessions[0].id)
      } else {
        createNewSession()
      }
    }
  }

  const deleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
    setMessageToDelete(null)
    setShowDeleteDialog(false)
  }

  const clearCurrentChat = () => {
    if (currentSessionId) {
      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === currentSessionId
            ? { ...session, messages: [], title: "New Chat", lastActivity: new Date() }
            : session,
        ),
      )
    }
    setMessages([])
    setError(null)
    setShowClearDialog(false)
  }

  const archiveOldChats = () => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    setChatSessions((prev) => prev.filter((session) => session.lastActivity > oneWeekAgo))
  }

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

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    // Create new session if none exists
    if (!currentSessionId) {
      createNewSession()
    }

    console.log("🚀 Sending message:", input)
    setError(null)

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
      severity: "low",
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Show typing indicator
    setTypingIndicator({ isTyping: true, message: "Analyzing your symptoms..." })

    try {
      console.log("📡 Making API request...")

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: input,
          chatHistory: messages.slice(-5), // Send last 5 messages for context
        }),
      })

      console.log("📨 Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.text()
        console.error("❌ API Error Response:", errorData)
        throw new Error(`API Error: ${response.status} - ${errorData}`)
      }

      const data = await response.json()
      console.log("✅ API Response:", data)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        timestamp: new Date(),
        severity: data.severity || "low",
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("💥 Error sending message:", error)
      setError(error instanceof Error ? error.message : "Unknown error occurred")

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I apologize, but I encountered an error. Please try again later. For medical emergencies, please call 108 (Medical Emergency) or 112 (National Emergency) immediately.",
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
      sessionTitle: chatSessions.find((s) => s.id === currentSessionId)?.title || "Current Chat",
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

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
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
        <div className="max-w-6xl mx-auto flex gap-4">
          {/* Chat History Sidebar */}
          {showHistoryPanel && (
            <Card className="w-80 h-[700px] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Chat History
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setShowHistoryPanel(false)}>
                    ×
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex gap-2 mb-4">
                  <Button onClick={createNewSession} size="sm" className="flex-1">
                    New Chat
                  </Button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={archiveOldChats} variant="outline" size="sm">
                        <Archive className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Archive chats older than 7 days</TooltipContent>
                  </Tooltip>
                </div>

                <ScrollArea className="flex-1">
                  <div className="space-y-2">
                    {chatSessions.map((session) => (
                      <div
                        key={session.id}
                        className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          currentSessionId === session.id ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200" : ""
                        }`}
                        onClick={() => loadSession(session.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{session.title}</p>
                            <p className="text-xs text-gray-500">
                              {session.messages.length} messages • {session.lastActivity.toLocaleDateString()}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => loadSession(session.id)}>Load Chat</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => deleteSession(session.id)} className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Main Chat Interface */}
          <div className="flex-1">
            {/* Header */}
            <Card className="mb-4">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-xl font-bold text-blue-700 dark:text-blue-400">
                    <Bot className="h-6 w-6" />
                    MediChat India
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {chatStats.totalMessages}
                    </Badge>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => setShowHistoryPanel(!showHistoryPanel)}>
                          <History className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Chat History</TooltipContent>
                    </Tooltip>
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
                      <TooltipContent>Export chat</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <Alert className="mt-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Important:</strong> This provides general health information only. Always consult healthcare
                    providers for medical concerns.
                    <strong className="text-red-600 ml-1">
                      For emergencies: 108 (Medical) or 112 (National Emergency)
                    </strong>
                  </AlertDescription>
                </Alert>

                {error && (
                  <Alert variant="destructive" className="mt-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Error:</strong> {error}
                    </AlertDescription>
                  </Alert>
                )}
              </CardHeader>
            </Card>

            {/* Chat Interface */}
            <Card className="h-[650px] flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    MediChat India - AI Health Assistant
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={createNewSession}>
                      <Plus className="h-4 w-4 mr-1" />
                      New
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowClearDialog(true)}
                      disabled={messages.length === 0}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Messages */}
                <ScrollArea className="flex-1 pr-4 mb-4 max-h-[500px] overflow-y-auto" ref={scrollAreaRef}>
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-12">
                      <Bot className="h-16 w-16 mx-auto mb-4 text-blue-400" />
                      <p className="text-xl font-medium mb-2">Welcome to MediChat India</p>
                      <p className="text-sm text-gray-400 mb-4">
                        Ask health questions or describe symptoms to get started
                      </p>
                      <div className="flex justify-center gap-4 text-xs text-gray-400">
                        <span>💬 Voice Input</span>
                        <span>📱 Mobile Friendly</span>
                        <span>🔒 Private & Secure</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 group ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`flex gap-3 max-w-[80%] ${
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
                            <div className="flex flex-col gap-2 flex-1">
                              <div
                                className={`rounded-lg p-3 relative break-words overflow-hidden ${
                                  message.role === "user"
                                    ? "bg-blue-500 text-white"
                                    : message.role === "system"
                                      ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
                                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                }`}
                              >
                                {/* Delete button */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                                    message.role === "user"
                                      ? "text-white hover:bg-blue-600"
                                      : "hover:bg-gray-200 dark:hover:bg-gray-700"
                                  }`}
                                  onClick={() => {
                                    setMessageToDelete(message.id)
                                    setShowDeleteDialog(true)
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>

                                {message.severity && message.role !== "user" && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-2 h-2 rounded-full ${getSeverityColor(message.severity)}`} />
                                    <span className="text-xs font-medium capitalize">{message.severity} Priority</span>
                                  </div>
                                )}
                                <div className="text-sm break-words word-wrap pr-6 leading-relaxed">
                                  {message.content.split("\n").map((line, index) => {
                                    // Handle numbered lists
                                    if (/^\d+\./.test(line.trim())) {
                                      return (
                                        <div key={index} className="mb-2">
                                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                                            {line.match(/^\d+\./)?.[0]}
                                          </span>
                                          <span className="ml-1">{line.replace(/^\d+\.\s*/, "")}</span>
                                        </div>
                                      )
                                    }

                                    // Handle bullet points
                                    if (/^[•·-]/.test(line.trim())) {
                                      return (
                                        <div key={index} className="mb-1 ml-4">
                                          <span className="text-blue-500 mr-2">•</span>
                                          <span>{line.replace(/^[•·-]\s*/, "")}</span>
                                        </div>
                                      )
                                    }

                                    // Handle warning messages
                                    if (line.includes("⚠️")) {
                                      return (
                                        <div
                                          key={index}
                                          className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-yellow-800 dark:text-yellow-200 text-xs"
                                        >
                                          {line}
                                        </div>
                                      )
                                    }

                                    // Regular paragraphs
                                    if (line.trim()) {
                                      return (
                                        <p key={index} className="mb-2">
                                          {line}
                                        </p>
                                      )
                                    }

                                    return null
                                  })}
                                </div>
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
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {typingIndicator.message}
                              </span>
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
                                {isListening ? (
                                  <MicOff className="h-4 w-4 text-red-500" />
                                ) : (
                                  <Mic className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{isListening ? "Stop listening" : "Voice input"}</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || isLoading}
                      size="icon"
                      className="h-11 w-11"
                    >
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
              <p className="text-xs mt-1">For emergencies: 108 (Medical) or 112 (National Emergency) • India</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Message Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => messageToDelete && deleteMessage(messageToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Chat Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Current Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all messages in this chat? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={clearCurrentChat} className="bg-red-600 hover:bg-red-700">
              Clear Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}
