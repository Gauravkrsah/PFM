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
    totalIncome: 0,
    netBalance: 0,
    loanLent: 0,
    loanReceived: 0,
    netLoan: 0,
    expenseCategories: {},
    incomeCategories: {},
    monthlyTrend: [],
    dailySpending: 0,
    dailyIncome: 0,
    topExpense: null,
    userBreakdown: {},
    weeklyTrend: [],
    expenseCount: 0,
    incomeCount: 0,
    totalTransactions: 0,
    avgPerExpense: 0,
    avgPerIncome: 0,
    topExpenseCategory: null,
    topIncomeCategory: null,
    spendingPattern: {},
    budgetInsights: {}
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
        // Separate transactions by type
        const expenses = data.filter(t => (t.amount || 0) > 0)
        const income = data.filter(t => (t.amount || 0) < 0)
        
        // Calculate totals
        const totalSpent = expenses.reduce((sum, t) => sum + (t.amount || 0), 0)
        const totalIncome = income.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)
        const netBalance = totalIncome - totalSpent // Positive = surplus, Negative = deficit
        
        // Separate loan tracking
        const loanLent = expenses
          .filter(t => (t.category || '').toLowerCase() === 'loan')
          .reduce((sum, t) => sum + (t.amount || 0), 0)
        
        const loanReceived = income
          .filter(t => (t.category || '').toLowerCase() === 'loan')
          .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)
        
        const netLoan = loanLent - loanReceived // Positive = owed to you
        
        // Expense categories (only positive amounts, excluding loans)
        const expenseCategories = expenses
          .filter(t => (t.category || '').toLowerCase() !== 'loan')
          .reduce((acc, t) => {
            const category = (t.category || 'Other').toLowerCase()
            acc[category] = (acc[category] || 0) + (t.amount || 0)
            return acc
          }, {})
        
        // Income categories (only negative amounts)
        const incomeCategories = income.reduce((acc, t) => {
          const category = (t.category || 'Other').toLowerCase()
          acc[category] = (acc[category] || 0) + Math.abs(t.amount || 0)
          return acc
        }, {})
        const expenseCount = expenses.length
        const incomeCount = income.length
        const totalTransactions = data.length
        const dailySpending = Math.round(totalSpent / parseInt(timeRange))
        const dailyIncome = Math.round(totalIncome / parseInt(timeRange))
        const avgPerExpense = expenseCount > 0 ? Math.round(totalSpent / expenseCount) : 0
        const avgPerIncome = incomeCount > 0 ? Math.round(totalIncome / incomeCount) : 0
        
        const topExpenseCategory = Object.entries(expenseCategories)
          .sort(([,a], [,b]) => b - a)[0]
        const topIncomeCategory = Object.entries(incomeCategories)
          .sort(([,a], [,b]) => b - a)[0]
        
        const userBreakdown = data.reduce((acc, expense) => {
          const userName = expense.paid_by || 'Unknown'
          acc[userName] = (acc[userName] || 0) + (expense.amount || 0)
          return acc
        }, {})
        
        const topExpense = data.reduce((max, expense) =>
          (expense.amount || 0) > (max?.amount || 0) ? expense : max, null)
        
        // Monthly trend
        const monthlyData = {}
        data.forEach(expense => {
          const month = expense.date ? expense.date.substring(0, 7) : new Date().toISOString().substring(0, 7)
          monthlyData[month] = (monthlyData[month] || 0) + (expense.amount || 0)
        })
        const monthlyTrend = Object.entries(monthlyData)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, amount]) => ({ month, amount }))
        
        // Weekly trend for last 4 weeks
        const weeklyData = {}
        const now = new Date()
        for (let i = 0; i < 4; i++) {
          const weekStart = new Date(now)
          weekStart.setDate(now.getDate() - (i * 7) - 6)
          const weekEnd = new Date(now)
          weekEnd.setDate(now.getDate() - (i * 7))
          
          const weekKey = `Week ${4-i}`
          weeklyData[weekKey] = data
            .filter(expense => {
              const expenseDate = new Date(expense.date)
              return expenseDate >= weekStart && expenseDate <= weekEnd
            })
            .reduce((sum, expense) => sum + (expense.amount || 0), 0)
        }
        const weeklyTrend = Object.entries(weeklyData).map(([week, amount]) => ({ week, amount }))
        
        // Spending pattern by day of week
        const spendingPattern = data.reduce((acc, expense) => {
          const dayOfWeek = new Date(expense.date).toLocaleDateString('en', { weekday: 'short' })
          acc[dayOfWeek] = (acc[dayOfWeek] || 0) + (expense.amount || 0)
          return acc
        }, {})
        
        // Budget insights
        const budgetInsights = {
          projectedMonthlySpending: Math.round(dailySpending * 30),
          projectedMonthlyIncome: Math.round(dailyIncome * 30),
          projectedMonthlySavings: Math.round((dailyIncome - dailySpending) * 30),
          highestSpendingDay: Object.entries(spendingPattern)
            .sort(([,a], [,b]) => b - a)[0],
          expenseCategoryCount: Object.keys(expenseCategories).length,
          incomeCategoryCount: Object.keys(incomeCategories).length,
          avgDaysBetweenExpenses: expenseCount > 0 ? Math.round(parseInt(timeRange) / expenseCount) : 0
        }
        
        setAnalytics({
          totalSpent,
          totalIncome,
          netBalance,
          loanLent,
          loanReceived,
          netLoan,
          expenseCategories,
          incomeCategories,
          monthlyTrend,
          dailySpending,
          dailyIncome,
          topExpense,
          userBreakdown,
          weeklyTrend,
          expenseCount,
          incomeCount,
          totalTransactions,
          avgPerExpense,
          avgPerIncome,
          topExpenseCategory,
          topIncomeCategory,
          spendingPattern,
          budgetInsights,
          usesMockData
        })
      } else {
        // Reset analytics when no data
        setAnalytics({
          totalSpent: 0,
          totalIncome: 0,
          netBalance: 0,
          loanLent: 0,
          loanReceived: 0,
          netLoan: 0,
          expenseCategories: {},
          incomeCategories: {},
          monthlyTrend: [],
          dailySpending: 0,
          dailyIncome: 0,
          topExpense: null,
          userBreakdown: {},
          weeklyTrend: [],
          expenseCount: 0,
          incomeCount: 0,
          totalTransactions: 0,
          avgPerExpense: 0,
          avgPerIncome: 0,
          topExpenseCategory: null,
          topIncomeCategory: null,
          spendingPattern: {},
          budgetInsights: {},
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

  const getExpensePercentage = (amount) => {
    const expenseTotal = Object.values(analytics.expenseCategories).reduce((sum, amt) => sum + amt, 0)
    return expenseTotal > 0 ? Math.round((amount / expenseTotal) * 100) : 0
  }
  
  const getIncomePercentage = (amount) => {
    return analytics.totalIncome > 0 ? Math.round((amount / analytics.totalIncome) * 100) : 0
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-red-50 p-3 sm:p-4 rounded-lg border border-red-200">
          <h3 className="font-medium text-red-800 mb-1 text-sm sm:text-base">💸 Total Expenses</h3>
          <p className="text-xl sm:text-2xl font-bold text-red-600">Rs.{analytics.totalSpent.toLocaleString()}</p>
          <p className="text-xs text-red-500">{analytics.expenseCount} transactions</p>
        </div>
        
        <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
          <h3 className="font-medium text-green-800 mb-1 text-sm sm:text-base">💰 Total Income</h3>
          <p className="text-xl sm:text-2xl font-bold text-green-600">Rs.{analytics.totalIncome.toLocaleString()}</p>
          <p className="text-xs text-green-500">{analytics.incomeCount} transactions</p>
        </div>
        
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-800 mb-1 text-sm sm:text-base">📊 Net Balance</h3>
          <p className={`text-xl sm:text-2xl font-bold ${analytics.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Rs.{Math.abs(analytics.netBalance).toLocaleString()}
          </p>
          <p className="text-xs text-blue-500">{analytics.netBalance >= 0 ? 'Surplus' : 'Deficit'}</p>
        </div>
        
        <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-200">
          <h3 className="font-medium text-purple-800 mb-1 text-sm sm:text-base">🎯 Savings Rate</h3>
          <p className="text-xl sm:text-2xl font-bold text-purple-600">
            {analytics.totalIncome > 0 ? Math.round((analytics.netBalance / analytics.totalIncome) * 100) : 0}%
          </p>
          <p className="text-xs text-purple-500">Of total income</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-200">
          <h3 className="font-medium text-yellow-800 mb-1 text-sm sm:text-base">🤝 Loan Lent</h3>
          <p className="text-xl sm:text-2xl font-bold text-yellow-600">Rs.{analytics.loanLent.toLocaleString()}</p>
          <p className="text-xs text-yellow-500">Money given out</p>
        </div>
        
        <div className="bg-teal-50 p-3 sm:p-4 rounded-lg border border-teal-200">
          <h3 className="font-medium text-teal-800 mb-1 text-sm sm:text-base">🔄 Loan Received</h3>
          <p className="text-xl sm:text-2xl font-bold text-teal-600">Rs.{analytics.loanReceived.toLocaleString()}</p>
          <p className="text-xs text-teal-500">Money got back</p>
        </div>
        
        <div className="bg-indigo-50 p-3 sm:p-4 rounded-lg border border-indigo-200">
          <h3 className="font-medium text-indigo-800 mb-1 text-sm sm:text-base">📊 Net Loan</h3>
          <p className={`text-xl sm:text-2xl font-bold ${analytics.netLoan >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            Rs.{Math.abs(analytics.netLoan).toLocaleString()}
          </p>
          <p className="text-xs text-indigo-500">{analytics.netLoan >= 0 ? 'Owed to you' : 'You owe'}</p>
        </div>
        
        <div className="bg-pink-50 p-3 sm:p-4 rounded-lg border border-pink-200">
          <h3 className="font-medium text-pink-800 mb-1 text-sm sm:text-base">📈 Daily Avg</h3>
          <p className="text-lg sm:text-xl font-bold text-pink-600">
            Rs.{analytics.dailySpending.toLocaleString()}
          </p>
          <p className="text-xs text-pink-500">Spending per day</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-200">
          <h3 className="font-medium text-purple-800 mb-1 text-sm sm:text-base">🎯 Top Expense Category</h3>
          <p className="text-lg sm:text-xl font-bold text-purple-600">
            {analytics.topExpenseCategory ? analytics.topExpenseCategory[0].toUpperCase() : 'N/A'}
          </p>
          <p className="text-xs text-purple-500">
            {analytics.topExpenseCategory ? `Rs.${(analytics.topExpenseCategory[1] || 0).toLocaleString()}` : 'No expenses'}
          </p>
        </div>
        
        <div className="bg-orange-50 p-3 sm:p-4 rounded-lg border border-orange-200">
          <h3 className="font-medium text-orange-800 mb-1 text-sm sm:text-base">📈 Avg Per Expense</h3>
          <p className="text-lg sm:text-xl font-bold text-orange-600">
            Rs.{(analytics.avgPerExpense || 0).toLocaleString()}
          </p>
          <p className="text-xs text-orange-500">Per expense transaction</p>
        </div>
        
        <div className="bg-indigo-50 p-3 sm:p-4 rounded-lg border border-indigo-200">
          <h3 className="font-medium text-indigo-800 mb-1 text-sm sm:text-base">💰 Avg Per Income</h3>
          <p className="text-lg sm:text-xl font-bold text-indigo-600">
            Rs.{(analytics.avgPerIncome || 0).toLocaleString()}
          </p>
          <p className="text-xs text-indigo-500">Per income transaction</p>
        </div>
        
        <div className="bg-teal-50 p-3 sm:p-4 rounded-lg border border-teal-200">
          <h3 className="font-medium text-teal-800 mb-1 text-sm sm:text-base">📊 Total Transactions</h3>
          <p className="text-lg sm:text-xl font-bold text-teal-600">
            {(analytics.totalTransactions || 0).toLocaleString()}
          </p>
          <p className="text-xs text-teal-500">All transactions</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <h3 className="font-medium text-indigo-800 mb-1">🏆 Highest Spending Day</h3>
          <p className="text-lg font-bold text-indigo-600">
            {analytics.budgetInsights?.highestSpendingDay?.[0] || 'N/A'}
          </p>
          <p className="text-xs text-indigo-500">
            Rs.{(analytics.budgetInsights?.highestSpendingDay?.[1] || 0).toLocaleString()}
          </p>
        </div>
        
        <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
          <h3 className="font-medium text-pink-800 mb-1">🎨 Expense Categories</h3>
          <p className="text-2xl font-bold text-pink-600">
            {analytics.budgetInsights?.expenseCategoryCount || 0}
          </p>
          <p className="text-xs text-pink-500">Different expense areas</p>
        </div>
        
        <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
          <h3 className="font-medium text-teal-800 mb-1">⏱️ Spending Frequency</h3>
          <p className="text-2xl font-bold text-teal-600">
            {analytics.budgetInsights?.avgDaysBetweenExpenses || 0}
          </p>
          <p className="text-xs text-teal-500">Days between expenses</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-medium mb-4">💸 Expense Categories</h3>
          <div className="space-y-4">
            {Object.entries(analytics.expenseCategories)
              .sort(([,a], [,b]) => b - a)
              .map(([category, amount], index) => {
                const percentage = getExpensePercentage(amount)
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500', 'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500']
                const color = colors[index % colors.length]
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${color}`}></div>
                        <span className="capitalize font-medium text-gray-700">{category}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">Rs.{amount.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{percentage}% of expenses</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className={`${color} h-2 rounded-full transition-all duration-500 ease-out`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            {Object.keys(analytics.expenseCategories).length === 0 && (
              <div className="text-center text-gray-500 py-4">
                <div className="text-2xl mb-2">💸</div>
                <p className="text-sm">No expense categories yet</p>
              </div>
            )}
          </div>
        </div>
        
        {Object.keys(analytics.incomeCategories).length > 0 && (
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-medium mb-4">💰 Income Sources</h3>
            <div className="space-y-4">
              {Object.entries(analytics.incomeCategories)
                .sort(([,a], [,b]) => b - a)
                .map(([category, amount], index) => {
                  const percentage = getIncomePercentage(amount)
                  const colors = ['bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-blue-500']
                  const color = colors[index % colors.length]
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${color}`}></div>
                          <span className="capitalize font-medium text-gray-700">{category}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">Rs.{amount.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{percentage}% of income</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className={`${color} h-2 rounded-full transition-all duration-500 ease-out`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
        
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
        
        {analytics.weeklyTrend.length > 0 && (
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-medium mb-4">📅 Weekly Trend (Last 4 Weeks)</h3>
            <div className="flex items-end space-x-2 h-32">
              {analytics.weeklyTrend.map(({ week, amount }) => {
                const maxAmount = Math.max(...analytics.weeklyTrend.map(t => t.amount))
                const height = maxAmount > 0 ? (amount / maxAmount) * 100 : 0
                return (
                  <div key={week} className="flex-1 flex flex-col items-center">
                    <div className="text-xs mb-1 font-medium">Rs.{amount.toLocaleString()}</div>
                    <div 
                      className="w-full bg-green-500 rounded-t transition-all duration-300" 
                      style={{ height: `${height}%` }}
                    ></div>
                    <div className="text-xs mt-1 text-gray-600">{week}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        
        {Object.keys(analytics.spendingPattern).length > 0 && (
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-medium mb-4">📆 Spending by Day of Week</h3>
            <div className="flex items-end space-x-1 h-32">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                const amount = analytics.spendingPattern[day] || 0
                const maxAmount = Math.max(...Object.values(analytics.spendingPattern))
                const height = maxAmount > 0 ? (amount / maxAmount) * 100 : 0
                return (
                  <div key={day} className="flex-1 flex flex-col items-center">
                    <div className="text-xs mb-1 font-medium">Rs.{amount.toLocaleString()}</div>
                    <div 
                      className="w-full bg-purple-500 rounded-t transition-all duration-300" 
                      style={{ height: `${height}%` }}
                    ></div>
                    <div className="text-xs mt-1 text-gray-600">{day}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        
        {analytics.monthlyTrend.length > 1 && (
          <div className="bg-white p-4 rounded-lg border lg:col-span-2">
            <h3 className="font-medium mb-4">📈 Monthly Trend</h3>
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