import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const GOLD = '#c9a44a'

export default function Login() {
  const navigate = useNavigate()
  const [isSignup, setIsSignup] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (isSignup) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (signUpError) {
        setError(signUpError.message)
      } else {
        setEmailSent(true)
      }
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
      } else {
        // Fetch role and redirect accordingly
        const userId = data.session?.user?.id
        if (userId) {
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single()
          if (profile?.role === 'admin') {
            navigate('/admin')
          } else {
            navigate('/dashboard')
          }
        } else {
          navigate('/dashboard')
        }
      }
    }

    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', fontFamily: "'Inter', sans-serif" }}>

      {/* Email confirmation modal */}
      {emailSent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ background: '#f7f5f0', borderRadius: 16, padding: '2.5rem', width: '100%', maxWidth: 380, textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📧</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111', marginBottom: 8 }}>Check your email!</h2>
            <p style={{ color: '#7a7a7a', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              We sent a confirmation link to <strong style={{ color: '#111' }}>{email}</strong>. Click the link to activate your account, then come back to sign in.
            </p>
            <button onClick={() => { setEmailSent(false); setIsSignup(false) }} style={{ background: GOLD, color: '#111', border: 'none', borderRadius: 8, padding: '0.65rem 1.75rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
              Go to Sign In
            </button>
          </div>
        </div>
      )}

      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 52, height: 52, background: GOLD, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <span style={{ color: '#111', fontSize: '1.5rem', fontWeight: 900 }}>✝</span>
          </div>
          <h1 style={{ color: '#111111', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.2px', marginBottom: 6 }}>
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p style={{ color: '#7a7a7a', fontSize: '0.875rem' }}>
            {isSignup ? 'Join the RUK Sermon Notes platform.' : 'Sign in to your sermon notes portal.'}
          </p>
        </div>

        {/* Card */}
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 16, padding: '2rem', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {isSignup && (
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text" required value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Pastor John Doe"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = GOLD}
                  onBlur={e => e.target.style.borderColor = '#2a2a2a'}
                />
              </div>
            )}
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="pastor@example.com"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = GOLD}
                onBlur={e => e.target.style.borderColor = '#2a2a2a'}
              />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required minLength={8} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: '3.5rem' }}
                  onFocus={e => e.target.style.borderColor = GOLD}
                  onBlur={e => e.target.style.borderColor = '#2a2a2a'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: GOLD, fontSize: '0.72rem', fontWeight: 700 }}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && <p style={{ color: '#e07070', fontSize: '0.83rem', margin: 0 }}>{error}</p>}

            <button type="submit" disabled={loading} style={{ background: GOLD, color: '#111', border: 'none', borderRadius: 8, padding: '0.75rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', letterSpacing: '0.02em', opacity: loading ? 0.65 : 1, marginTop: 4 }}>
              {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.83rem', color: '#5a5a5a', marginTop: '1.5rem' }}>
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <button onClick={() => { setIsSignup(!isSignup); setError('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: GOLD, fontWeight: 600, fontSize: '0.83rem', padding: 0 }}>
              {isSignup ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>

        <p style={{ textAlign: 'center', color: '#aaa', fontSize: '0.72rem', marginTop: '1.5rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          RUK · Sermon Notes Platform
        </p>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: '0.78rem', fontWeight: 600,
  color: '#7a7a7a', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase',
}

const inputStyle = {
  width: '100%', background: '#111111', border: '1px solid #2a2a2a',
  borderRadius: 8, padding: '0.65rem 0.875rem', fontSize: '0.875rem',
  color: '#f7f5f0', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit', transition: 'border-color 0.15s',
}
