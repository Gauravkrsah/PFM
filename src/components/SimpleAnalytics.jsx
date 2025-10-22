import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function SimpleAnalytics({ currentGroup, user }) {
  const [analytics, setAnalytics] = useState({
    totalExpenses: 0,
    totalIncome: 0,
    netBalance: 0,
    loanLent: 0,
    loanReceived: 0,
    netLoan: 0,
    expenseCategories: {},
    topExpenseCategory: null,
    transactionCount: 0,
    expenseCount: 0,
    incomeCount: 0,
    dailyAverage: 0,
    savingsRate: 0,
    avgPerExpense: 0
  })
  const [timeRange, setTimeRange] = useState('30')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [currentGroup, timeRange, user])

  const fetchAnalytics = async () => {
    setLoading(true)
    
    try {
      if (!user?.id) {
        setLoading(false)
        return
      }

      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(timeRange))
      
      let query = supabase
        .from('expenses')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
      
      if (currentGroup) {
        query = query.eq('group_id', currentGroup.id)
      } else {
        query = query.eq('user_id', user.id).is('group_id', null)
      }
      
      const { data, error } = await query.order('date', { ascending: false })
      
      if (error) {
        console.error('Error fetching analytics:', error)
        setLoading(false)
        return
      }

      const transactions = data || []
      
      // Separate by category first, then by amount
      const incomeTransactions = transactions.filter(t => 
        t.category && t.category.toLowerCase() === 'income'
      )
      const loanTransactions = transactions.filter(t => 
        t.category && t.category.toLowerCase() === 'loan'
      )
      const expenseTransactions = transactions.filter(t => 
        t.category && t.category.toLowerCase() !== 'income' && t.category.toLowerCase() !== 'loan'
      )
      
      // Calculate totals
      const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)
      const totalIncome = incomeTransactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)
      const netBalance = totalIncome - totalExpenses
      
      // Loan calculations - separate lent (positive) vs received (negative)
      const loanLent = loanTransactions
        .filter(t => (t.amount || 0) > 0)
        .reduce((sum, t) => sum + t.amount, 0)
      
      const loanReceived = loanTransactions
        .filter(t => (t.amount || 0) < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
      
      const netLoan = loanLent - loanReceived
      
      // Calculate expense categories (only actual expenses)
      const expenseCategories = {}
      expenseTransactions.forEach(t => {
        const category = (t.category || 'other').toLowerCase()
        expenseCategories[category] = (expenseCategories[category] || 0) + Math.abs(t.amount || 0)
      })
      
      // Find top expense category (exclude income and loan)
      const topExpenseCategory = Object.entries(expenseCategories)
        .filter(([category]) => category !== 'income' && category !== 'loan')
        .sort(([,a], [,b]) => b - a)[0]
      
      const dailyAverage = Math.round(totalExpenses / parseInt(timeRange))
      const savingsRate = totalIncome > 0 ? Math.round((netBalance / totalIncome) * 100) : 0
      const avgPerExpense = expenseTransactions.length > 0 ? Math.round(totalExpenses / expenseTransactions.length) : 0
      
      setAnalytics({
        totalExpenses,
        totalIncome,
        netBalance,
        loanLent,
        loanReceived,
        netLoan,
        expenseCategories,
        topExpenseCategory,
        transactionCount: transactions.length,
        expenseCount: expenseTransactions.length,
        incomeCount: incomeTransactions.length,
        dailyAverage,
        savingsRate,
        avgPerExpense
      })
      
    } catch (error) {
      console.error('Analytics error:', error)
      // Reset to default values on error
      setAnalytics({
        totalExpenses: 0,
        totalIncome: 0,
        netBalance: 0,
        loanLent: 0,
        loanReceived: 0,
        netLoan: 0,
        expenseCategories: {},
        topExpenseCategory: null,
        transactionCount: 0,
        expenseCount: 0,
        incomeCount: 0,
        dailyAverage: 0,
        savingsRate: 0,
        avgPerExpense: 0
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex justify-center items-center h-24">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Loading analytics...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold">
          📊 {currentGroup ? `${currentGroup.name} Group` : 'Personal'} Analytics
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            🔄 Refresh
          </button>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
          </select>
        </div>
      </div>

      {/* Main Stats - Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-red-800">💸 Total Expenses</h3>
          </div>
          <p className="text-lg font-bold text-red-600">Rs.{analytics.totalExpenses.toLocaleString()}</p>
          <p className="text-xs text-red-500">{analytics.expenseCount} transactions</p>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-green-800">💰 Total Income</h3>
          </div>
          <p className="text-lg font-bold text-green-600">Rs.{analytics.totalIncome.toLocaleString()}</p>
          <p className="text-xs text-green-500">{analytics.incomeCount} transactions</p>
        </div>
        
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-blue-800">📊 Net Balance</h3>
          </div>
          <p className={`text-lg font-bold ${analytics.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Rs.{Math.abs(analytics.netBalance).toLocaleString()}
          </p>
          <p className="text-xs text-blue-500">{analytics.netBalance >= 0 ? 'Surplus' : 'Deficit'}</p>
        </div>
        
        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-purple-800">🎯 Savings Rate</h3>
          </div>
          <p className="text-lg font-bold text-purple-600">{analytics.savingsRate}%</p>
          <p className="text-xs text-purple-500">Of total income</p>
        </div>
      </div>

      {/* Loan Stats - Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-yellow-800">🤝 Loan Lent</h3>
          </div>
          <p className="text-lg font-bold text-yellow-600">Rs.{analytics.loanLent.toLocaleString()}</p>
          <p className="text-xs text-yellow-500">Money given out</p>
        </div>
        
        <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-teal-800">🔄 Loan Received</h3>
          </div>
          <p className="text-lg font-bold text-teal-600">Rs.{analytics.loanReceived.toLocaleString()}</p>
          <p className="text-xs text-teal-500">Money got back</p>
        </div>
        
        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-indigo-800">📊 Net Loan</h3>
          </div>
          <p className={`text-lg font-bold ${analytics.netLoan >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            Rs.{Math.abs(analytics.netLoan).toLocaleString()}
          </p>
          <p className="text-xs text-indigo-500">{analytics.netLoan >= 0 ? 'Owed to you' : 'You owe'}</p>
        </div>
        
        <div className="bg-pink-50 p-3 rounded-lg border border-pink-200">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-pink-800">📈 Daily Avg</h3>
          </div>
          <p className="text-lg font-bold text-pink-600">Rs.{analytics.dailyAverage.toLocaleString()}</p>
          <p className="text-xs text-pink-500">Spending per day</p>
        </div>
      </div>

      {/* Additional Stats - Row 3 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-orange-800">📈 Avg Per Expense</h3>
          </div>
          <p className="text-lg font-bold text-orange-600">Rs.{analytics.avgPerExpense.toLocaleString()}</p>
          <p className="text-xs text-orange-500">Per transaction</p>
        </div>
        
        <div className="bg-cyan-50 p-3 rounded-lg border border-cyan-200">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-cyan-800">📊 Total Transactions</h3>
          </div>
          <p className="text-lg font-bold text-cyan-600">{analytics.transactionCount}</p>
          <p className="text-xs text-cyan-500">All transactions</p>
        </div>
        
        {analytics.topExpenseCategory && (
          <div className="bg-violet-50 p-3 rounded-lg border border-violet-200 col-span-2">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-violet-800">🏆 Top Expense Category</h3>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-violet-600 capitalize">{analytics.topExpenseCategory[0]}</p>
              <p className="text-lg font-bold text-violet-600">Rs.{analytics.topExpenseCategory[1].toLocaleString()}</p>
            </div>
            <p className="text-xs text-violet-500">
              {Math.round((analytics.topExpenseCategory[1] / analytics.totalExpenses) * 100)}% of total expenses
            </p>
          </div>
        )}
      </div>



      {/* Expense Categories */}
      {Object.keys(analytics.expenseCategories).length > 0 && (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-medium mb-4">💸 Expense Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(analytics.expenseCategories)
              .filter(([category]) => category !== 'income' && category !== 'loan')
              .sort(([,a], [,b]) => b - a)
              .map(([category, amount], index) => {
                const percentage = Math.round((amount / analytics.totalExpenses) * 100)
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500']
                const color = colors[index % colors.length]
                
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${color}`}></div>
                        <span className="capitalize font-medium">{category}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">Rs.{amount.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{percentage}%</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${color} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* No Data State */}
      {analytics.transactionCount === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Data Available</h3>
          <p className="text-gray-500">
            {currentGroup 
              ? `No expenses found for ${currentGroup.name} group in the selected time range.`
              : 'No personal expenses found in the selected time range.'
            }
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Add some expenses to see your analytics!
          </p>
        </div>
      )}
    </div>
  )
}