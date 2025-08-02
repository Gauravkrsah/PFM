import { useState, useRef, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Auth from './components/Auth'
import ResetPassword from './components/ResetPassword'
import Header from './components/Header'
import GroupManager from './components/GroupManager'
import Chat from './components/Chat'
import Table from './components/Table'
import Analytics from './components/Analytics'
import EnhancedAnalytics from './components/EnhancedAnalytics'
import { ToastProvider } from './components/Toast'
import { supabase } from './supabase'

function App() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('pfm_active_tab') || 'chat')
  const [expenses, setExpenses] = useState([])
  const [user, setUser] = useState(null)
  const [currentGroup, setCurrentGroup] = useState(() => {
    try {
      const saved = localStorage.getItem('pfm_current_group')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const tableRef = useRef()
  const [toast, setToast] = useState(null)
  
  // Save active tab to localStorage
  useEffect(() => {
    localStorage.setItem('pfm_active_tab', activeTab)
  }, [activeTab])
  
  // Save current group to localStorage
  useEffect(() => {
    if (currentGroup) {
      localStorage.setItem('pfm_current_group', JSON.stringify(currentGroup))
    } else {
      localStorage.removeItem('pfm_current_group')
    }
  }, [currentGroup])

  const handleExpenseAdded = async (newExpenses) => {
    try {
      for (const expense of newExpenses) {
        const expenseData = {
          amount: expense.amount || 0,
          item: expense.item || 'item',
          category: expense.category || 'other',
          remarks: expense.remarks || '',
          paid_by: expense.paid_by || null,
          date: new Date().toISOString().split('T')[0],
          user_id: user?.id,
          added_by: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Unknown'
        }
        
        if (currentGroup) {
          expenseData.group_id = currentGroup.id
        }
        
        const { error } = await supabase.from('expenses').insert(expenseData)
        
        if (error) {
          console.error('Database error:', error)
          throw error
        }
      }
      
      // Refresh table immediately
      if (tableRef.current) {
        tableRef.current.refresh()
      }
    } catch (error) {
      console.error('Error adding expenses:', error)
      throw error
    }
  }

  const handleTableRefresh = () => {
    if (tableRef.current) {
      tableRef.current.refresh()
    }
  }

  // Main App Component
  const MainApp = () => {
    if (!user) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Auth onAuth={setUser} />
        </div>
      )
    }

    const tabs = [
      { id: 'chat', label: '💬', fullLabel: 'Chat', icon: '💬' },
      { id: 'table', label: '📊', fullLabel: 'Table', icon: '📊' },
      { id: 'analytics', label: '📈', fullLabel: 'Analytics', icon: '📈' }
    ]

    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          user={user}
          onLogout={() => setUser(null)}
          onProfileUpdate={() => {}}
        />
        
        <div className="max-w-6xl mx-auto px-4 py-6">
          <GroupManager
            user={user}
            currentGroup={currentGroup}
            onGroupChange={setCurrentGroup}
          />
          
          {/* Mobile-first tab navigation */}
          <div className="flex bg-white rounded-lg shadow-sm border mb-6 overflow-hidden">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-3 py-3 text-center transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <div className="text-lg sm:hidden">{tab.icon}</div>
                <div className="hidden sm:flex items-center justify-center space-x-2">
                  <span className="text-lg">{tab.icon}</span>
                  <span className="font-medium">{tab.fullLabel}</span>
                </div>
              </button>
            ))}
          </div>
          
          {/* Content area with better mobile spacing */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <Chat 
              onExpenseAdded={handleExpenseAdded} 
              onTableRefresh={handleTableRefresh} 
              user={user} 
              currentGroup={currentGroup}
              isVisible={activeTab === 'chat'}
            />
            {activeTab === 'table' && <Table ref={tableRef} expenses={expenses} currentGroup={currentGroup} user={user} />}
            {activeTab === 'analytics' && <EnhancedAnalytics currentGroup={currentGroup} user={user} />}
          </div>
        </div>
      </div>
    )
  }

  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<MainApp />} />
        </Routes>
      </Router>
    </ToastProvider>
  )
}

export default App