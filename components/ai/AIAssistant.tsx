/**
 * BizExit - AI Assistant
 * Floating AI assistant that's always available
 * 
 * AI-NATIIVI: Aina saatavilla, oppii käyttäjästä, antaa proaktiivisia ehdotuksia
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Minimize2, Maximize2, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAIAssistant } from '@/hooks/useAI'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth/AuthProvider'

export function AIAssistant() {
  const { session } = useAuth()
  const {
    messages,
    sendMessage,
    isTyping,
    isOpen,
    hasUnread,
    open,
    close,
    toggle
  } = useAIAssistant()

  const [input, setInput] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Don't show for non-authenticated users
  if (!session?.user) {
    return null
  }

  const handleSend = () => {
    if (!input.trim() || isTyping) return
    sendMessage(input)
    setInput('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={open}
          className={cn(
            'fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50',
            'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700',
            'transition-all duration-300 ease-in-out',
            hasUnread && 'animate-bounce'
          )}
          aria-label="Open AI Assistant"
        >
          <Sparkles className="h-6 w-6" />
          {hasUnread && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-pulse" />
          )}
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-50',
            'bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700',
            'transition-all duration-300 ease-in-out',
            isMinimized ? 'w-80 h-14' : 'w-96 h-[600px]'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Sparkles className="h-5 w-5 text-white" />
                <span className="absolute -bottom-1 -right-1 h-2 w-2 bg-green-400 rounded-full" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  AI-Avustaja
                </h3>
                <p className="text-xs text-purple-100">
                  Aina valmiina auttamaan
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 text-white hover:bg-white/10"
              >
                {isMinimized ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={close}
                className="h-8 w-8 text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(600px-140px)]">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Sparkles className="h-12 w-12 text-purple-600 mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Hei! Olen AI-avustajasi
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Voin auttaa sinua yrityskauppaprosessissa,
                      analysoida yrityksiä, generoida sisältöä ja paljon muuta!
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {['Analysoi yritys', 'Näytä suositukset', 'Optimoi listaus'].map(
                        (suggestion) => (
                          <Button
                            key={suggestion}
                            variant="outline"
                            size="sm"
                            onClick={() => sendMessage(suggestion)}
                            className="text-xs"
                          >
                            {suggestion}
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[80%] rounded-lg px-4 py-2',
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.metadata?.suggestions && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {message.metadata.suggestions.map((suggestion: string, idx: number) => (
                            <Button
                              key={idx}
                              variant="ghost"
                              size="sm"
                              onClick={() => sendMessage(suggestion)}
                              className="h-6 text-xs"
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {session.user.email?.[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Kysy minulta mitä tahansa..."
                    disabled={isTyping}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:opacity-50"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {isTyping ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                  AI voi tehdä virheitä. Tarkista tärkeät tiedot.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}

