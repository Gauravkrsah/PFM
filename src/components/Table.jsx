import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { supabase } from '../supabase'

const Table = forwardRef(({ expenses, onExpenseUpdate, currentGroup, user }, ref) => {
  const [data, setData] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [loading, setLoading] = useState(false)
  const [groupMembers, setGroupMembers] = useState([])

  const fetchGroupMembers = async () => {
    if (!currentGroup) {
      setGroupMembers([])
      return
    }
    
    try {
      const { data } = await supabase
        .from('group_members')
        .select('user_id, users(name, email)')
        .eq('group_id', currentGroup.id)
      setGroupMembers(data || [])
    } catch (error) {
      console.error('Error fetching group members:', error)
      setGroupMembers([])
    }
  }

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      let query = supabase.from('expenses').select('*')
      
      if (currentGroup) {
        // GROUP MODE: Only fetch group expenses
        query = query.eq('group_id', currentGroup.id)
      } else {
        // PERSONAL MODE: Only fetch personal expenses (no group_id)
        query = query.eq('user_id', user?.id).is('group_id', null)
      }
      
      const { data, error } = await query.order('date', { ascending: false })
      
      if (error) {
        console.error('Error fetching expenses:', error)
        setData([])
      } else {
        setData(data || [])
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
      setData([])
    }
    setLoading(false)
  }

  useImperativeHandle(ref, () => ({
    refresh: fetchExpenses
  }))

  useEffect(() => {
    fetchExpenses()
    fetchGroupMembers()
  }, [currentGroup, user])

  const handleEdit = (expense) => {
    setEditingId(expense.id)
    setEditForm(expense)
  }

  const handleSave = async () => {
    try {
      const { error } = await supabase.from('expenses').update(editForm).eq('id', editingId)
      if (error) throw error
      setEditingId(null)
      fetchExpenses()
    } catch (error) {
      console.error('Error updating expense:', error)
    }
  }

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
      fetchExpenses()
    } catch (error) {
      console.error('Error deleting expense:', error)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">
          📊 {currentGroup ? `${currentGroup.name} Group` : 'Personal'} Finance Sheet
        </h2>
        <button
          onClick={fetchExpenses}
          disabled={loading}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200 disabled:opacity-50"
        >
          {loading ? '...' : '🔄 Refresh'}
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-2">Date</th>
              <th className="text-left p-2">Item</th>
              <th className="text-left p-2">Category</th>
              <th className="text-left p-2">Amount</th>
              <th className="text-left p-2">Remarks</th>
              <th className="text-left p-2">Added by</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="7" className="p-4 text-center text-gray-500">
                  Loading expenses...
                </td>
              </tr>
            )}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan="7" className="p-4 text-center text-gray-500">
                  No expenses found. Add some using the chat input!
                </td>
              </tr>
            )}
            {!loading && data.map((expense) => (
              <tr key={expense.id} className="border-b border-gray-100">
                {editingId === expense.id ? (
                  <>
                    <td className="p-2">
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        value={editForm.item || ''}
                        onChange={(e) => setEditForm({...editForm, item: e.target.value})}
                        className="w-full px-2 py-1 border rounded"
                        placeholder="Item name"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        value={editForm.category}
                        onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={editForm.amount}
                        onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        value={editForm.remarks}
                        onChange={(e) => setEditForm({...editForm, remarks: e.target.value})}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="p-2">
                      <button onClick={handleSave} className="text-green-600 mr-2">✓</button>
                      <button onClick={() => setEditingId(null)} className="text-red-600">✗</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2">{new Date(expense.date).toLocaleDateString()}</td>
                    <td className="p-2">{expense.item || '-'}</td>
                    <td className="p-2">{expense.category}</td>
                    <td className="p-2">
                      {expense.amount === 0 ? (
                        <span className="text-red-500">Amount needed</span>
                      ) : (
                        `₹${expense.amount}`
                      )}
                    </td>
                    <td className="p-2">{expense.remarks}</td>
                    <td className="p-2">
                      {(() => {
                        if (expense.user_id === user?.id) {
                          // Current user added this expense
                          return user?.user_metadata?.name || user?.email?.split('@')[0] || 'You'
                        } else if (currentGroup && groupMembers.length > 0) {
                          // Find the group member who added this expense
                          const member = groupMembers.find(m => m.user_id === expense.user_id)
                          if (member?.users) {
                            return member.users.name || member.users.email?.split('@')[0] || 'Group Member'
                          }
                        }
                        // Fallback for unknown users
                        return 'Group Member'
                      })()}
                    </td>
                    <td className="p-2">
                      <button onClick={() => handleEdit(expense)} className="text-blue-600 mr-2">✏️</button>
                      <button onClick={() => handleDelete(expense.id)} className="text-red-600">🗑️</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
})

export default Table