import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// Mock data for testing when Supabase is not available or empty
const mockExpenses = [
  { id: 1, amount: 500, category: 'food', item: 'Groceries', date: '2024-01-15', paid_by: 'Sonu', remarks: 'Weekly groceries' },
  { id: 2, amount: 1200, category: 'transport', item: 'Fuel', date: '2024-01-14', paid_by: 'Sonu', remarks: 'Car fuel' },
  { id: 3, amount: 300, category: 'entertainment', item: 'Movie', date: '2024-01-13', paid_by: 'Sonu', remarks: 'Weekend movie' },
  { id: 4, amount: 200, category: 'food', item: 'Restaurant', date: '2024-01-12', paid_by: 'Sonu', remarks: 'Lunch out' }
]

export default function EnhancedAnalytics({ currentGroup, user }) {
  const [analytics, setAnalytics] = useState({
    totalSpent: 0,
    categoryBreakdown: {},
    monthlyTrend: [],
    dailyAverage: 0,
    topExpense: null,
    userBreakdown: {}
  })
  const [timeRange, setTimeRange] = useState('30')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAnalytics()
  }, [currentGroup, timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    
    try {
      let data = []
      let usesMockData = false

      // Try to fetch real data first
      if (user?.id) {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - parseInt(timeRange))
        
        let query = supabase
          .from('expenses')
          .select('*')
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0])
        
        if (currentGroup) {
          // GROUP MODE: Only fetch group expenses
          query = query.eq('group_id', currentGroup.id)
        } else {
          // PERSONAL MODE: Only fetch personal expenses (no group_id)
          query = query.eq('user_id', user.id).is('group_id', null)
        }
        
        const { data: fetchedData, error } = await query.order('date', { ascending: false })
        
        if (error) {
          console.error('Error fetching analytics data:', error)
          console.log('Falling back to mock data due to database error')
          data = mockExpenses
          usesMockData = true
        } else {
          data = fetchedData || []
        }
      } else {
        console.log('No user authenticated, using mock data')
        data = mockExpenses
        usesMockData = true
      }

      // If no real data found, use mock data for demonstration
      if (!usesMockData && (!data || data.length === 0)) {
        console.log('No expenses found, using mock data for demonstration')
        data = mockExpenses
        usesMockData = true
      }
    
      if (data && data.length > 0) {
        const totalSpent = data.reduce((sum, expense) => sum + (expense.amount || 0), 0)
        const dailyAverage = Math.round(totalSpent / parseInt(timeRange))
        
        const categoryBreakdown = data.reduce((acc, expense) => {
          const category = expense.category || 'other'
          acc[category] = (acc[category] || 0) + (expense.amount || 0)
          return acc
        }, {})
        
        const userBreakdown = data.reduce((acc, expense) => {
          const userName = expense.paid_by || 'Unknown'
          acc[userName] = (acc[userName] || 0) + (expense.amount || 0)
          return acc
        }, {})
        
        const topExpense = data.reduce((max, expense) =>
          (expense.amount || 0) > (max?.amount || 0) ? expense : max, null)
        
        const monthlyData = {}
        data.forEach(expense => {
          const month = expense.date ? expense.date.substring(0, 7) : new Date().toISOString().substring(0, 7)
          monthlyData[month] = (monthlyData[month] || 0) + (expense.amount || 0)
        })
        const monthlyTrend = Object.entries(monthlyData)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, amount]) => ({ month, amount }))
        
        setAnalytics({
          totalSpent,
          categoryBreakdown,
          monthlyTrend,
          dailyAverage,
          topExpense,
          userBreakdown,
          usesMockData
        })
      } else {
        // Reset analytics when no data
        setAnalytics({
          totalSpent: 0,
          categoryBreakdown: {},
          monthlyTrend: [],
          dailyAverage: 0,
          topExpense: null,
          userBreakdown: {},
          usesMockData: false
        })
      }
    } catch (error) {
      console.error('Error in fetchAnalytics:', error)
      setError(`Unexpected error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryPercentage = (amount) => {
    return analytics.totalSpent > 0 ? Math.round((amount / analytics.totalSpent) * 100) : 0
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium mb-2">Error Loading Analytics</h3>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          📈 {currentGroup ? `${currentGroup.name} Group` : 'Personal'} Analytics
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            🔄 Refresh
          </button>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1 border rounded"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>
      
      {analytics.usesMockData && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-yellow-600 mr-2">⚠️</span>
            <span className="text-yellow-800 text-sm">
              Showing demo data. {!user ? 'Please sign in to see your real expenses.' : 'Add some expenses to see your actual analytics.'}
            </span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-800 mb-1">💰 Total Spent</h3>
          <p className="text-2xl font-bold text-blue-600">Rs.{analytics.totalSpent.toLocaleString()}</p>
          <p className="text-xs text-blue-500">Last {timeRange} days</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="font-medium text-green-800 mb-1">📊 Daily Average</h3>
          <p className="text-2xl font-bold text-green-600">Rs.{analytics.dailyAverage.toLocaleString()}</p>
          <p className="text-xs text-green-500">Per day spending</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="font-medium text-purple-800 mb-1">🎯 Top Expense</h3>
          <p className="text-lg font-bold text-purple-600">
            {analytics.topExpense ? `Rs.${analytics.topExpense.amount}` : 'N/A'}
          </p>
          <p className="text-xs text-purple-500">
            {analytics.topExpense?.remarks || 'No expenses'}
          </p>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h3 className="font-medium text-orange-800 mb-1">📈 Categories</h3>
          <p className="text-2xl font-bold text-orange-600">
            {Object.keys(analytics.categoryBreakdown).length}
          </p>
          <p className="text-xs text-orange-500">Different categories</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-medium mb-4">🏷️ Category Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(analytics.categoryBreakdown)
              .sort(([,a], [,b]) => b - a)
              .map(([category, amount]) => (
              <div key={category} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="capitalize font-medium">{category}</span>
                  <span className="font-bold">Rs.{amount.toLocaleString()} ({getCategoryPercentage(amount)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${getCategoryPercentage(amount)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {currentGroup && Object.keys(analytics.userBreakdown).length > 1 && (
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-medium mb-4">👥 User Spending</h3>
            <div className="space-y-3">
              {Object.entries(analytics.userBreakdown)
                .sort(([,a], [,b]) => b - a)
                .map(([user, amount]) => (
                <div key={user} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{user}</span>
                    <span className="font-bold">Rs.{amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.round((amount / analytics.totalSpent) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {analytics.monthlyTrend.length > 1 && (
          <div className="bg-white p-4 rounded-lg border lg:col-span-2">
            <h3 className="font-medium mb-4">📅 Monthly Trend</h3>
            <div className="flex items-end space-x-2 h-32">
              {analytics.monthlyTrend.map(({ month, amount }) => {
                const maxAmount = Math.max(...analytics.monthlyTrend.map(t => t.amount))
                const height = (amount / maxAmount) * 100
                return (
                  <div key={month} className="flex-1 flex flex-col items-center">
                    <div className="text-xs mb-1 font-medium">Rs.{amount.toLocaleString()}</div>
                    <div 
                      className="w-full bg-blue-500 rounded-t transition-all duration-300" 
                      style={{ height: `${height}%` }}
                    ></div>
                    <div className="text-xs mt-1 text-gray-600">{month}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}