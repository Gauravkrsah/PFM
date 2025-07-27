import { useState, useRef } from 'react'
import Auth from './components/Auth'
import Header from './components/Header'
import GroupManager from './components/GroupManager'
import Chat from './components/Chat'
import Table from './components/Table'
import Analytics from './components/Analytics'
import EnhancedAnalytics from './components/EnhancedAnalytics'
import { ToastProvider } from './components/Toast'
import { supabase } from './supabase'

function App() {
  const [activeTab, setActiveTab] = useState('chat')
  const [expenses, setExpenses] = useState([])
  const [user, setUser] = useState(null)
  const [currentGroup, setCurrentGroup] = useState(null)
  const tableRef = useRef()
  const [toast, setToast] = useState(null)

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
          user_id: user?.id
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

  if (!user) {
    return (
      <ToastProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Auth onAuth={setUser} />
        </div>
      </ToastProvider>
    )
  }

  const tabs = [
    { id: 'chat', label: '💬', fullLabel: 'Chat', icon: '💬' },
    { id: 'table', label: '📊', fullLabel: 'Table', icon: '📊' },
    { id: 'analytics', label: '📈', fullLabel: 'Analytics', icon: '📈' }
  ]

  return (
    <ToastProvider>
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
            <div style={{ display: activeTab === 'chat' ? 'block' : 'none' }}>
              <Chat onExpenseAdded={handleExpenseAdded} onTableRefresh={handleTableRefresh} user={user} currentGroup={currentGroup} />
            </div>
            {activeTab === 'table' && <Table ref={tableRef} expenses={expenses} currentGroup={currentGroup} user={user} />}
            {activeTab === 'analytics' && <EnhancedAnalytics currentGroup={currentGroup} user={user} />}
          </div>
        </div>
      </div>
    </ToastProvider>
  )
}

export default App