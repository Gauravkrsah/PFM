import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useToast } from './Toast'

export default function Header({ user, onLogout, onProfileUpdate }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profile, setProfile] = useState({
    name: user?.user_metadata?.name || '',
    phone: user?.user_metadata?.phone || '',
    bio: user?.user_metadata?.bio || ''
  })
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  useEffect(() => {
    // Auto-open profile edit if user has no name
    if (user && !user.user_metadata?.name) {
      setIsEditingProfile(true)
    }
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onLogout()
  }

  const updateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Update user metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          name: profile.name,
          phone: profile.phone,
          bio: profile.bio
        }
      })
      
      // Also update display name if name is provided
      if (profile.name && !metadataError) {
        await supabase.auth.updateUser({
          data: {
            display_name: profile.name,
            full_name: profile.name,
            name: profile.name,
            phone: profile.phone,
            bio: profile.bio
          }
        })
      }
      
      if (!metadataError) {
        setIsEditingProfile(false)
        setShowProfileMenu(false)
        onProfileUpdate?.(profile)
        toast.success('Profile updated successfully!')
        
        // Small delay before reload to ensure data is saved
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        toast.error('Error updating profile: ' + metadataError.message)
      }
    } catch (err) {
      toast.error('Error updating profile: ' + err.message)
    }
    
    setLoading(false)
  }

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <>
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🧾</div>
              <h1 className="text-xl font-bold text-gray-800 hidden sm:block">
                Minimalist PFM
              </h1>
              <h1 className="text-lg font-bold text-gray-800 sm:hidden">
                PFM
              </h1>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {userInitial}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-900">
                    Welcome, {userName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.email}
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border py-2 z-50">
                  <div className="px-4 py-2 border-b">
                    <div className="font-medium text-gray-900">{userName}</div>
                    <div className="text-sm text-gray-500">{user?.email}</div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsEditingProfile(true)
                      setShowProfileMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit Profile</span>
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Profile Edit Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Edit Profile</h3>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={updateProfile} className="space-y-4">
              {!user?.user_metadata?.name && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                  <p className="text-sm text-blue-800">
                    ℹ️ Please add your name to use chat features and get personalized responses.
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                  autoFocus={!user?.user_metadata?.name}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {showProfileMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </>
  )
}