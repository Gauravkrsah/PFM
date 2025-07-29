import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useToast } from './Toast'

export default function GroupManager({ user, currentGroup, onGroupChange }) {
  const [groups, setGroups] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitations, setInvitations] = useState([])
  const [groupMembers, setGroupMembers] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (user) {
      fetchGroups()
      fetchInvitations()
    }
  }, [user])

  useEffect(() => {
    if (currentGroup) {
      fetchGroupMembers()
    }
  }, [currentGroup])

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('groups(*)')
        .eq('user_id', user.id)
      
      if (error) {
        console.error('Error fetching groups:', error)
      } else {
        console.log('Fetched groups:', data)
        setGroups(data?.map(item => item.groups) || [])
      }
    } catch (err) {
      console.error('Unexpected error fetching groups:', err)
    }
  }

  const fetchInvitations = async () => {
    console.log('Fetching invitations for:', user.email)
    const { data, error } = await supabase
      .from('group_invitations')
      .select('*, groups(name)')
      .eq('invited_email', user.email)
      .eq('status', 'pending')
    
    console.log('Invitations data:', data)
    console.log('Invitations error:', error)
    setInvitations(data || [])
  }

  const acceptInvitation = async (invitationId, groupId) => {
    await supabase
      .from('group_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitationId)
    
    await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: user.id })
    
    fetchGroups()
    fetchInvitations()
  }

  const createGroup = async (e) => {
    e.preventDefault()
    if (isProcessing) return
    setIsProcessing(true)
    
    try {
      console.log('Creating group:', groupName, 'for user:', user.id)
      const { data, error } = await supabase
        .from('groups')
        .insert({ name: groupName, created_by: user.id })
        .select()
      
      if (error) {
        console.error('Error creating group:', error)
        toast.error('Error creating group: ' + error.message)
        return
      }
      
      if (data?.[0]) {
        console.log('Group created:', data[0])
        const { error: memberError } = await supabase
          .from('group_members')
          .insert({ group_id: data[0].id, user_id: user.id })
        
        if (memberError) {
          console.error('Error adding member:', memberError)
          toast.error('Group created but error adding you as member: ' + memberError.message)
        } else {
          console.log('Member added successfully')
          toast.success('Group created successfully!')
          setGroupName('')
          setShowCreate(false)
          // Set the newly created group as current group
          onGroupChange(data[0])
          fetchGroups()
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      toast.error('Unexpected error creating group: ' + err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const fetchGroupMembers = async () => {
    if (!currentGroup) {
      setGroupMembers([])
      return
    }

    setLoadingMembers(true)
    try {
      console.log('🔄 Fetching group members for group:', currentGroup.id)

      // First fetch group members user_ids
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', parseInt(currentGroup.id))

      if (membersError) {
        console.error('❌ Error fetching group members:', membersError)
        setGroupMembers([])
        return
      }

      if (!membersData || membersData.length === 0) {
        setGroupMembers([])
        return
      }

      // Extract user_ids
      const userIds = membersData.map(m => m.user_id)

      // Fetch user details for these user_ids from profiles table
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds)

      if (usersError) {
        console.error('❌ Error fetching users:', usersError)
        setGroupMembers([])
        return
      }

      // Combine members with user info
      const combined = membersData.map(member => {
        const userInfo = usersData.find(u => u.id === member.user_id)
        return {
          user_id: member.user_id,
          users: userInfo || null
        }
      })

      console.log('✅ Fetched and combined group members:', combined)
      setGroupMembers(combined)
    } catch (err) {
      console.error('❌ Unexpected error fetching group members:', err)
      setGroupMembers([])
    } finally {
      setLoadingMembers(false)
    }
  }

  const leaveGroup = async () => {
    if (!currentGroup || isProcessing) return
    setIsProcessing(true)
    
    toast.confirm(
      'Are you sure you want to leave this group?',
      async () => {
    
        await supabase
          .from('group_members')
          .delete()
          .eq('group_id', currentGroup.id)
          .eq('user_id', user.id)
        
        onGroupChange(null)
        fetchGroups()
        toast.success('Left group successfully')
        setIsProcessing(false)
      },
      () => setIsProcessing(false)
    )
  }

  const deleteGroup = async () => {
    if (!currentGroup || currentGroup.created_by !== user.id || isProcessing) return
    setIsProcessing(true)
    
    toast.confirm(
      'Are you sure you want to delete this group? This cannot be undone.',
      async () => {
        try {
          // Delete group members first
          await supabase.from('group_members').delete().eq('group_id', currentGroup.id)
          
          // Delete group invitations
          await supabase.from('group_invitations').delete().eq('group_id', currentGroup.id)
          
          // Delete expenses related to the group
          await supabase.from('expenses').delete().eq('group_id', currentGroup.id)
          
          // Finally delete the group
          const { error } = await supabase.from('groups').delete().eq('id', currentGroup.id)
          
          if (error) {
            console.error('Error deleting group:', error)
            toast.error('Error deleting group: ' + error.message)
          } else {
            onGroupChange(null)
            fetchGroups()
            toast.success('Group deleted successfully')
          }
        } catch (err) {
          console.error('Unexpected error deleting group:', err)
          toast.error('Error deleting group: ' + err.message)
        } finally {
          setIsProcessing(false)
        }
      },
      () => setIsProcessing(false)
    )
  }

  const inviteUser = async (e) => {
    e.preventDefault()
    if (!currentGroup) return
    
    try {
      const { error } = await supabase
        .from('group_invitations')
        .insert({
          group_id: currentGroup.id,
          invited_email: inviteEmail,
          invited_by: user.id
        })
      
      if (error) {
        toast.error('Error sending invitation: ' + (error.message || 'Unknown error'))
      } else {
        toast.success(`Invitation sent to ${inviteEmail}!`)
        setInviteEmail('')
      }
    } catch (err) {
      toast.error('Error sending invitation: ' + (err.message || 'Failed to send invitation'))
    }
  }

  return (
    <div className="mb-6 p-4 bg-white border rounded-lg shadow-sm">
      {invitations.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium mb-3 text-blue-800">📧 Group Invitations</h3>
          <div className="space-y-2">
            {invitations.map(inv => (
              <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white rounded border">
                <span className="text-sm font-medium">Join "{inv.groups?.name || 'Unknown Group'}"</span>
                <button
                  onClick={() => acceptInvitation(inv.id, inv.group_id)}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Single row layout */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <select
          value={currentGroup?.id || 'personal'}
          onChange={(e) => {
            const group = e.target.value === 'personal' ? null : groups.find(g => g.id === parseInt(e.target.value))
            onGroupChange(group)
            setShowMembers(false)
          }}
          className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="personal">👤 Personal</option>
          {groups.map(group => (
            <option key={group.id} value={group.id}>👥 {group.name}</option>
          ))}
        </select>
        
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          + New Group
        </button>

        {currentGroup && (
          <>
            <form onSubmit={inviteUser} className="flex gap-2">
              <input
                type="email"
                placeholder="Invite by email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
              />
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Invite
              </button>
            </form>
            
            {/* Group Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={leaveGroup}
                disabled={isProcessing}
                className="px-3 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                title="Leave Group"
              >
                🚪 Leave
              </button>
              
              {currentGroup.created_by === user.id && (
                <button
                  onClick={deleteGroup}
                  disabled={isProcessing}
                  className="px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  title="Delete Group"
                >
                  🗑️ Delete
                </button>
              )}
              
              <button
                onClick={() => setShowMembers(!showMembers)}
                className="px-3 py-2 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                title="View Group Members"
              >
                👥 Members
              </button>
            </div>
          </>
        )}
      </div>


      {/* New Group Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Create New Group</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={createGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                <input
                  placeholder="e.g., Roommates, Trip Budget, Family Expenses"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                  autoFocus
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button 
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isProcessing ? 'Creating...' : 'Create Group'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {currentGroup && showMembers && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold mb-3 text-blue-800 flex items-center justify-between">
            <span className="flex items-center">
              <span className="text-lg mr-2">👥</span>
              {currentGroup.name} Members ({groupMembers.length})
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-100 px-2 py-1 rounded-full">
                Group ID: {currentGroup.id}
              </span>
              <button
                onClick={() => setShowMembers(false)}
                className="text-blue-600 hover:text-blue-800 p-1"
                title="Hide Members"
              >
                ✕
              </button>
            </div>
          </h4>
          
          {loadingMembers ? (
            <div className="text-center py-6 text-gray-500">
              <div className="text-2xl mb-2">👥</div>
              <p className="text-sm">Loading group members...</p>
              <div className="mt-2">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            </div>
          ) : groupMembers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {groupMembers.map((member, idx) => {
                const isAdmin = member.user_id === currentGroup.created_by
                const isCurrentUser = member.user_id === user?.id
                
                return (
                  <div key={idx} className={`flex items-center space-x-3 p-3 rounded-lg border-2 ${
                    isAdmin ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      isAdmin ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}>
                      {(member.users?.name || member.users?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {member.users?.full_name || member.users?.email?.split('@')[0] || 'Unknown'}
                          {isCurrentUser && <span className="text-blue-600 ml-1">(You)</span>}
                        </div>
                        {isAdmin && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            👑 Admin
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {member.users?.email}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <div className="text-2xl mb-2">❌</div>
              <p className="text-sm">No group members found or failed to load.</p>
              <button
                onClick={fetchGroupMembers}
                className="mt-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          )}
          
          {/* Group Info */}
          <div className="mt-4 pt-3 border-t border-blue-200">
            <div className="flex flex-wrap gap-4 text-xs text-blue-600">
              <span>👑 Admin: {groupMembers.find(m => m.user_id === currentGroup.created_by)?.users?.name || 'Unknown'}</span>
              <span>📅 Created: {new Date(currentGroup.created_at).toLocaleDateString()}</span>
              <span>👥 Total Members: {groupMembers.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}