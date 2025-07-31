import { useState, useEffect } from 'react'
import axios from 'axios'
import { supabase } from '../supabase'

// Get API base URL from config
const getApiBaseUrl = () => {
  // For mobile app, use deployed backend
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    const railwayUrl = 'https://pfm-production.up.railway.app'
    console.log('🚀 Mobile app using Railway URL:', railwayUrl)
    return railwayUrl
  }
  if (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) {
    return window.APP_CONFIG.API_BASE_URL
  }
  return 'http://localhost:8000' // fallback for development
}

export default function Chat({ onExpenseAdded, onTableRefresh, user, currentGroup, isVisible = true }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState(() => localStorage.getItem('pfm_chat_mode') || 'input')
  const [expensesData, setExpensesData] = useState([])
  const [wsConnected, setWsConnected] = useState(false)
  
  // WebSocket connection
  useEffect(() => {
    // Skip WebSocket in mobile app for now
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      setWsConnected(false)
      return
    }
    
    const wsUrl = getApiBaseUrl().replace('http', 'ws') + '/ws'
    const ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      console.log('WebSocket connected')
      setWsConnected(true)
    }
    
    ws.onclose = () => {
      console.log('WebSocket disconnected')
      setWsConnected(false)
    }
    
    ws.onerror = (error) => {
      console.log('WebSocket error:', error)
      setWsConnected(false)
    }
    
    return () => {
      ws.close()
    }
  }, [])
  
  // Load messages from localStorage
  const [inputMessages, setInputMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pfm_input_messages') || '[]')
    } catch { return [] }
  })
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pfm_chat_messages') || '[]')
    } catch { return [] }
  })

  // Save messages to localStorage
  useEffect(() => {
    localStorage.setItem('pfm_input_messages', JSON.stringify(inputMessages))
  }, [inputMessages])
  
  useEffect(() => {
    localStorage.setItem('pfm_chat_messages', JSON.stringify(chatMessages))
  }, [chatMessages])
  
  useEffect(() => {
    localStorage.setItem('pfm_chat_mode', mode)
  }, [mode])

  useEffect(() => {
    if (user && mode === 'chat') {
      console.log('🔄 Mode or context changed, fetching fresh data...')
      fetchExpensesData()
    }
  }, [user, mode, currentGroup])

  // Also fetch data when switching to chat mode
  useEffect(() => {
    if (mode === 'chat' && user) {
      fetchExpensesData()
    }
  }, [mode])

  const fetchExpensesData = async () => {
    try {
      console.log('🔄 Fetching expenses data...')
      console.log('👤 User ID:', user?.id)
      console.log('🏢 Current group:', currentGroup?.name || 'Personal')
      
      let query = supabase.from('expenses').select('*')
      
      if (currentGroup) {
        // Fetch group expenses
        console.log('🏢 Fetching GROUP expenses for group ID:', currentGroup.id)
        query = query.eq('group_id', currentGroup.id)
      } else {
        // Fetch personal expenses (no group_id)
        console.log('👤 Fetching PERSONAL expenses for user ID:', user.id)
        query = query.eq('user_id', user.id).is('group_id', null)
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) {
        console.error('❌ Database error fetching expenses:', error)
        setExpensesData([])
      } else {
        console.log('✅ Fetched', data?.length || 0, 'expenses')
        console.log('📊 Sample data:', data?.slice(0, 2))
        setExpensesData(data || [])
      }
    } catch (err) {
      console.error('❌ Unexpected error fetching expenses:', err)
      setExpensesData([])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    setLoading(true)
    
    // Add user message to appropriate message array
    if (mode === 'input') {
      setInputMessages(prev => [...prev, { type: 'user', text: input }])
    } else {
      setChatMessages(prev => [...prev, { type: 'user', text: input }])
    }

    // Set timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false)
      const errorMsg = '❌ Request timed out. Please check if the backend server is running.'
      if (mode === 'input') {
        setInputMessages(prev => [...prev, { type: 'system', text: errorMsg }])
      } else {
        setChatMessages(prev => [...prev, { type: 'system', text: errorMsg }])
      }
    }, 30000) // 30 second timeout

    try {
      if (mode === 'input') {
        // Only handle personal expense input in input mode
        console.log('🔄 Sending parse request:', input)
        const response = await axios.post(`${getApiBaseUrl()}/parse`, {
          text: input
        })
        const { expenses, reply } = response.data
        console.log('✅ Parse response:', { expenses, reply })
        setInputMessages(prev => [...prev, { type: 'system', text: reply }])
        if (expenses && expenses.length > 0) {
          try {
            await onExpenseAdded(expenses)
            setInputMessages(prev => [...prev, { type: 'system', text: '✅ Expenses saved successfully!' }])
          } catch (error) {
            console.error('❌ Database save error:', error)
            setInputMessages(prev => [...prev, { type: 'system', text: '❌ Error saving to database: ' + error.message }])
          }
        }
      } else {
        // Chat mode: use current context (personal vs group)
        console.log('🔄 Preparing chat request...')
        console.log('👤 Current user:', user?.email)
        console.log('🏢 Current group:', currentGroup?.name || 'Personal')
        console.log('📊 Expenses data count:', expensesData.length)
        
        const { data: { user: freshUser } } = await supabase.auth.getUser()
        const currentUser = freshUser || user
        let userName = currentUser?.user_metadata?.name
        if (!userName || !userName.trim()) {
          if (currentUser?.email) {
            let raw = currentUser.email.split('@')[0]
            raw = raw.replace(/[^a-zA-Z ]/g, ' ').replace(/\s+/g, ' ').trim()
            userName = raw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
            if (!userName) userName = 'there'
          } else {
            userName = 'there'
          }
        }

        let chatPayload = {
          text: input,
          user_id: currentUser?.id,
          user_email: currentUser?.email,
          user_name: userName
        }

        if (currentGroup) {
          // GROUP MODE: send group data
          console.log('🏢 Using GROUP mode with', expensesData.length, 'expenses')
          chatPayload.group_name = currentGroup.name
          chatPayload.group_expenses_data = expensesData
        } else {
          // PERSONAL MODE: send personal data
          console.log('👤 Using PERSONAL mode with', expensesData.length, 'expenses')
          chatPayload.expenses_data = expensesData
        }

        console.log('🔄 Sending chat request:', {
          text: chatPayload.text,
          user_name: chatPayload.user_name,
          group_name: chatPayload.group_name,
          personal_data_count: chatPayload.expenses_data?.length || 0,
          group_data_count: chatPayload.group_expenses_data?.length || 0
        })

        const response = await axios.post(`${getApiBaseUrl()}/chat`, chatPayload)
        const { reply, error } = response.data
        
        console.log('✅ Chat response:', { reply, error })
        
        if (error) {
          setChatMessages(prev => [...prev, { type: 'system', text: reply + '\n\n⚠️ There was an error processing your request.' }])
        } else {
          setChatMessages(prev => [...prev, { type: 'system', text: reply }])
        }
      }
    } catch (error) {
      console.error('❌ Request failed:', error)
      
      let errorMessage = '❌ Error processing request'
      
      if (error.response) {
        // Server responded with error status
        console.error('Server error:', error.response.status, error.response.data)
        errorMessage = `❌ Server error (${error.response.status}): ${error.response.data?.detail || error.response.data?.message || 'Unknown error'}`
      } else if (error.request) {
        // Request was made but no response received - use fallback
        console.error('Network error:', error.request)
        const contextType = currentGroup ? `group "${currentGroup.name}"` : 'personal'
        const fallbackResponse = getFallbackResponse(input, contextType)
        errorMessage = `${fallbackResponse}\n\n🔧 Technical details: Network connection failed`
      } else {
        // Something else happened
        console.error('Unexpected error:', error.message)
        errorMessage = `❌ Unexpected error: ${error.message}`
      }
      
      // Add error message to appropriate message array
      if (mode === 'input') {
        setInputMessages(prev => [...prev, { type: 'system', text: errorMessage }])
      } else {
        setChatMessages(prev => [...prev, { type: 'system', text: errorMessage }])
      }
    } finally {
      // Always clear timeout and reset loading
      clearTimeout(timeoutId)
      setLoading(false)
      setInput('')
    }
  }

  const clearChat = () => {
    if (mode === 'input') {
      setInputMessages([])
      localStorage.removeItem('pfm_input_messages')
    } else {
      setChatMessages([])
      localStorage.removeItem('pfm_chat_messages')
    }
  }

  // Fallback response when backend is unavailable
  const getFallbackResponse = (query, contextType) => {
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.includes('total') || lowerQuery.includes('expense')) {
      return `I'd love to help you with your ${contextType} expenses, but I can't connect to the server right now. Please make sure the backend is running and try again.`
    }
    
    if (lowerQuery.includes('help')) {
      return `I'm here to help with your ${contextType} finance questions, but I'm currently unable to connect to the server. Please check that the backend is running and try again.`
    }
    
    return `Sorry, I can't process your ${contextType} finance question right now due to a server connection issue. Please ensure the backend is running and try again.`
  }

  return (
    <div className="p-4 sm:p-6" style={{ display: isVisible ? 'block' : 'none' }}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            {mode === 'input' ? '📝 Expense Input' : '💬 Finance Chat'}
          </h2>
          {mode === 'chat' && (
            <p className="text-sm text-gray-600 mt-1">
              {currentGroup ? `🏢 Group: ${currentGroup.name}` : '👤 Personal Mode'}
              <span className={`ml-2 inline-block w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} title={wsConnected ? 'Connected' : 'Disconnected'}></span>
            </p>
          )}
        </div>
        <button
          onClick={clearChat}
          className="self-start sm:self-auto px-3 py-1 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
        >
          Clear Chat
        </button>
      </div>
      
      {/* Mode Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setMode('input')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
            mode === 'input' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <span className="hidden sm:inline">📝 Input Mode</span>
          <span className="sm:hidden">📝 Input</span>
        </button>
        <button
          onClick={() => setMode('chat')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
            mode === 'chat' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <span className="hidden sm:inline">💬 Chat Mode</span>
          <span className="sm:hidden">💬 Chat</span>
        </button>
      </div>
      
      {/* Messages Area */}
      <div className="h-64 sm:h-80 overflow-y-auto mb-6 space-y-3 bg-gray-50 rounded-lg p-4">
        {(() => {
          const currentMessages = mode === 'input' ? inputMessages : chatMessages
          return (
            <>
              {currentMessages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">{mode === 'input' ? '📝' : '💬'}</div>
                  <p className="text-sm">
                    {mode === 'input' 
                      ? 'Start by typing your expenses naturally'
                      : 'Ask me anything about personal finance!'}
                  </p>
                </div>
              )}
              {currentMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs sm:max-w-md px-4 py-2 rounded-lg ${
                    msg.type === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white border shadow-sm'
                  }`}>
                    <div className="text-xs opacity-75 mb-1">
                      {msg.type === 'user' ? 'You' : (mode === 'input' ? 'Parser' : 'Assistant')}
                    </div>
                    <div className="text-sm">{msg.text}</div>
                  </div>
                </div>
              ))}
            </>
          )
        })()}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border shadow-sm px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-xs text-gray-500">Processing...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'input' 
            ? "500 on biryani, 400 on grocery..." 
            : currentGroup 
              ? `Ask about ${currentGroup.name} group expenses...`
              : "Ask about your personal expenses..."
          }
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <span className="hidden sm:inline">{mode === 'input' ? 'Add Expense' : 'Send'}</span>
          )}
          <span className="sm:hidden">{mode === 'input' ? 'Add' : 'Send'}</span>
        </button>
      </form>
      
      {/* Helper Text */}
      <div className="mt-3 text-xs text-gray-500 text-center">
        {mode === 'input' 
          ? 'Try: "lunch 250, coffee 80" or "grocery sonu 1500, gas gaurav 800"'
          : currentGroup
            ? `Try: "What are our group expenses?" or "How much did we spend on food?"`
            : 'Try: "What are my expenses till now?" or "How much did I spend on food?"'
        }
      </div>
    </div>
  )
}