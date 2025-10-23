import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useToast } from './Toast'

export default function Auth({ onAuth }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const [showVerification, setShowVerification] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) onAuth(session.user)
    }
    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      onAuth(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [onAuth])

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          toast.error('Passwords do not match')
          setLoading(false)
          return
        }
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) toast.error(error.message)
        else {
          toast.success('Account created — please verify')
          // Show verification instructions modal. Supabase will send an email link for confirmation.
          setShowVerification(true)
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) toast.error(error.message)
        else toast.success('Welcome back')
      }
    } catch (err) {
      toast.error('Error: ' + err.message)
    }
    setLoading(false)
  }

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      setShowVerification(false)
      onAuth(session.user)
      toast.success('Email verified — signed in')
    } else {
      toast.info('No active session yet. Please click the verification link in your email and then press Continue.')
    }
  }

  const verifyCode = async () => {
    if (!verificationCode || !email) {
      toast.error('Enter the verification code and the email you signed up with')
      return
    }
    setLoading(true)
    try {
      // Supabase verify OTP for signup
      const { error } = await supabase.auth.verifyOtp({ type: 'signup', email, token: verificationCode })
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Verification successful — signing in')
        // After verifying, try to fetch session
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) onAuth(session.user)
        setShowVerification(false)
      }
    } catch (err) {
      toast.error('Error: ' + err.message)
    }
    setLoading(false)
  }

  const resendCode = async () => {
    if (!email) {
      toast.error('Please enter your email to resend code')
      return
    }
    try {
      // Send a new OTP to the user's email (signInWithOtp sends an email OTP)
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) toast.error(error.message)
      else toast.success('Verification code resent — check your email')
    } catch (err) {
      toast.error('Error: ' + err.message)
    }
  }

  const enterDemoMode = () => {
    // Lightweight demo mode: set a demo flag and call onAuth with a mock user.
    const demoUser = { id: 'demo', email: 'demo@local', user_metadata: { name: 'Demo User' } }
    try {
      localStorage.setItem('pfm_demo', '1')
    } catch (e) {}
    onAuth(demoUser)
    toast.success('Entered demo mode')
  }

  return (<>
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-black text-white flex items-center justify-center text-2xl font-bold">P</div>
          <h1 className="text-2xl font-bold mb-1">PFM</h1>
          <p className="text-sm text-gray-600">Personal Finance Manager</p>
        </div>
        
        <div className="bg-white border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">{isSignUp ? 'Create Account' : 'Sign In'}</h2>
          
          <form onSubmit={handleAuth} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" required />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" required />
            </div>
            
            {isSignUp && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field" required />
              </div>
            )}
            
            <button type="submit" disabled={loading} className="w-full btn-primary disabled:opacity-50">
              {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          <div className="mt-3 text-center">
            <button onClick={enterDemoMode} className="text-sm text-blue-600 hover:underline">Try demo</button>
          </div>
          
          <div className="mt-4 text-center">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-gray-600 hover:text-black">
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </div>
        </div>
      </div>
    </div>
    {showVerification && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
        <div className="bg-white border border-gray-200 shadow-lg max-w-md w-full p-6">
          <h3 className="font-semibold mb-2">Confirm your signup</h3>
          <p className="text-sm text-gray-700 mb-4">Enter the verification code we sent to your email.</p>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Verification code</label>
            <input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} className="input-field" placeholder="e.g. 097046" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowVerification(false)} className="btn-secondary">Close</button>
            <button onClick={resendCode} type="button" className="btn-secondary">Resend code</button>
            <button onClick={verifyCode} type="button" className="btn-primary">Verify code</button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
