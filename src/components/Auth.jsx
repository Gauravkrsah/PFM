import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useToast } from './Toast'

export default function Auth({ onAuth }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const toast = useToast()

  useEffect(() => {
    // Check if user is already logged in
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        onAuth(session.user)
      }
    }
    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null)
      onAuth(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [onAuth])

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { data, error } = isSignUp 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password })
      
      if (error) {
        toast.error('Error: ' + error.message)
      } else if (isSignUp) {
        if (data.user && !data.session) {
          toast.info('Please check your email and click the confirmation link to activate your account!')
        } else {
          toast.success('Account created successfully!')
        }
      }
    } catch (err) {
      toast.error('Please configure Supabase credentials in .env file')
      console.error('Supabase not configured:', err)
    }
    setLoading(false)
  }

  const handleDemoMode = () => {
    // Create a mock user for demo purposes
    const mockUser = {
      id: 'demo-user-123',
      email: 'demo@example.com',
      user_metadata: { name: 'Demo User' }
    }
    onAuth(mockUser)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (user) {
    return (
      <div className="flex items-center justify-between mb-6 p-4 bg-white border rounded-lg shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
            {user.user_metadata?.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium">Welcome, {user.user_metadata?.name || user.email}</span>
        </div>
        <button onClick={handleLogout} className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
          Logout
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🧾</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Minimalist PFM</h1>
          <p className="text-gray-600">Your personal finance companion</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8 border">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center space-y-3">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors block w-full"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
            
            <div className="border-t pt-3">
              <button
                onClick={handleDemoMode}
                className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                🚀 Try Demo Mode
              </button>
              <p className="text-xs text-gray-500 mt-1">
                Skip authentication and explore with sample data
              </p>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-6 text-sm text-gray-500">
          Secure • Private • Easy to use
        </div>
      </div>
    </div>
  )
}