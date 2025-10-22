import { useState, useRef, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Auth from './components/Auth'
import ResetPassword from './components/ResetPassword'
import Header from './components/Header'
import GroupManager from './components/GroupManager'
import Chat from './components/Chat'
import Table from './components/Table'
import EnhancedAnalytics from './components/EnhancedAnalytics'
import { ToastProvider } from './components/Toast'
import { supabase } from './supabase'
import { initializeMobile, getMobileStyles } from './mobile'

function App() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('pfm_active_tab') || 'chat')
  const [expenses] = useState([])
  const [user, setUser] = useState(null)
  const [currentGroup, setCurrentGroup] = useState(() => {
    try {
      const saved = localStorage.getItem('pfm_current_group')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [showAddExpense, setShowAddExpense] = useState(false)
  const tableRef = useRef()

  const mobileStyles = getMobileStyles()
  
  useEffect(() => {
    initializeMobile()
  }, [])
  
  useEffect(() => {
    localStorage.setItem('pfm_active_tab', activeTab)
  }, [activeTab])
  
  useEffect(() => {
    if (currentGroup) {
      localStorage.setItem('pfm_current_group', JSON.stringify(currentGroup))
    } else {
      localStorage.removeItem('pfm_current_group')
    }
  }, [currentGroup])

  const handleExpenseAdded = async (newExpenses) => {
    try {
      // Get user's display name
      const getUserDisplayName = () => {
        if (user?.user_metadata?.name && user.user_metadata.name.trim()) {
          return user.user_metadata.name.trim()
        }
        if (user?.email) {
          const emailName = user.email.split('@')[0]
          // Clean up email name and capitalize
          const cleanName = emailName.replace(/[^a-zA-Z ]/g, ' ').replace(/\s+/g, ' ').trim()
          return cleanName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') || 'Unknown'
        }
        return 'Unknown'
      }
      
      const displayName = getUserDisplayName()
      
      for (const expense of newExpenses) {
        const expenseData = {
          amount: expense.amount || 0,
          item: expense.item || 'item',
          category: expense.category || 'other',
          remarks: expense.remarks || '',
          paid_by: expense.paid_by || null,
          date: new Date().toISOString().split('T')[0],
          user_id: user?.id,
          added_by: displayName  // Always use the actual user who added it
        }
        
        if (currentGroup) {
          expenseData.group_id = currentGroup.id
        }
        
        const { error } = await supabase.from('expenses').insert(expenseData)
        
        if (error) {
          throw error
        }
      }
      
      // Refresh table immediately
      if (tableRef.current) {
        tableRef.current.refresh()
      }
    } catch (error) {
      throw error
    }
  }

  const handleTableRefresh = () => {
    if (tableRef.current) {
      tableRef.current.refresh()
    }
  }

  const MainApp = () => {
    if (!user) {
      return <Auth onAuth={setUser} />
    }

    const navItems = [
      { id: 'chat', label: 'Chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
      { id: 'expenses', label: 'Expenses', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
      { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
    ]

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar - Desktop */}
        <aside className="sidebar">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black text-white flex items-center justify-center text-sm font-bold">P</div>
              <span className="font-semibold text-sm">PFM</span>
            </div>
          </div>
          
          <nav className="p-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === item.id ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
                {item.label}
              </button>
            ))}
          </nav>
          
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <Header user={user} onLogout={() => setUser(null)} onProfileUpdate={() => {}} currentGroup={currentGroup} compact />
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:ml-56 h-screen flex flex-col">
          <div className="lg:hidden flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-black text-white flex items-center justify-center text-xs font-bold">P</div>
                <span className="font-semibold text-sm">PFM</span>
              </div>
              <Header user={user} onLogout={() => setUser(null)} onProfileUpdate={() => {}} currentGroup={currentGroup} compact />
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            {activeTab === 'chat' && (
              <div className="flex flex-col h-full">
                <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 lg:px-8">
                  <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <GroupManager user={user} currentGroup={currentGroup} onGroupChange={setCurrentGroup} />
                    </div>
                    <button 
                      onClick={() => {
                        localStorage.removeItem('pfm_messages')
                        window.location.reload()
                      }}
                      className="px-3 py-2 text-xs text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors font-medium flex-shrink-0"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <Chat onExpenseAdded={handleExpenseAdded} onTableRefresh={handleTableRefresh} user={user} currentGroup={currentGroup} isVisible={true} />
                </div>
              </div>
            )}
            
            {activeTab === 'expenses' && (
              <div className="flex flex-col h-full">
                <div className="flex-shrink-0 p-4 lg:p-6 lg:pt-6 max-w-7xl mx-auto w-full">
                  <GroupManager user={user} currentGroup={currentGroup} onGroupChange={setCurrentGroup} />
                </div>
                <div className="flex-1 overflow-auto px-4 lg:px-6 pb-20 lg:pb-4 max-w-7xl mx-auto w-full">
                  <Table ref={tableRef} expenses={expenses} currentGroup={currentGroup} user={user} />
                </div>
              </div>
            )}
            
            {activeTab === 'analytics' && (
              <div className="flex flex-col h-full">
                <div className="flex-shrink-0 p-4 lg:p-6 lg:pt-6 max-w-7xl mx-auto w-full">
                  <GroupManager user={user} currentGroup={currentGroup} onGroupChange={setCurrentGroup} />
                </div>
                <div className="flex-1 overflow-auto px-4 lg:px-6 pb-20 lg:pb-4 max-w-7xl mx-auto w-full">
                  <EnhancedAnalytics currentGroup={currentGroup} user={user} />
                </div>
              </div>
            )}
          </div>
        </main>



        {/* Bottom Nav - Mobile */}
        <nav className="bottom-nav safe-bottom">
          <div className="flex h-14">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === item.id ? 'text-black' : 'text-gray-400'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={activeTab === item.id ? 2 : 1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Add Modal */}
        {showAddExpense && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end lg:items-center justify-center" onClick={() => setShowAddExpense(false)}>
            <div className="bg-white w-full lg:max-w-md lg:mx-4 p-4 lg:shadow-lg" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Add Expense</h3>
                <button onClick={() => setShowAddExpense(false)} className="text-gray-400 hover:text-black">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <Chat onExpenseAdded={(e) => { handleExpenseAdded(e); setShowAddExpense(false); }} onTableRefresh={handleTableRefresh} user={user} currentGroup={currentGroup} isVisible={true} compact />
            </div>
          </div>
        )}
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