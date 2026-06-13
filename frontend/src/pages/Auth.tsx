import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAlerts } from '../context/AlertContext';
import { ShieldAlert, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export const Auth: React.FC = () => {
  const { login, signup } = useAlerts();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (isSignUp) {
      if (!confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      if (isSignUp) {
        await signup(email, role);
      } else {
        await login(email, role);
      }
      navigate('/'); // Redirect to dashboard on success
    } catch (err) {
      setErrors({ auth: 'Authentication failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabToggle = (signUpState: boolean) => {
    setIsSignUp(signUpState);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setRole('user');
    setErrors({});
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] sm:h-[500px] sm:w-[500px] rounded-full bg-red-650/10 blur-[80px] pointer-events-none"></div>
      
      {/* Back to Live Map Link */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-200 transition-all"
      >
        <ArrowLeft className="h-4 w-4 text-red-500" />
        <span>Return to Dashboard</span>
      </Link>

      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)]">
            <ShieldAlert className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Rapid<span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">Relief</span> Portal
            </h2>
            <p className="mt-1.5 text-xs text-zinc-500 uppercase tracking-widest font-semibold">
              Authorized Dispatcher Authentication
            </p>
          </div>
        </div>

        {/* Auth Box Container */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Tab Selector */}
          <div className="flex border-b border-zinc-800 mb-6 pb-0.5">
            <button
              onClick={() => handleTabToggle(false)}
              className={`flex-1 pb-3 text-center text-sm font-bold border-b-2 transition-all cursor-pointer ${
                !isSignUp 
                  ? 'border-red-500 text-white' 
                  : 'border-transparent text-zinc-500 hover:text-zinc-350'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => handleTabToggle(true)}
              className={`flex-1 pb-3 text-center text-sm font-bold border-b-2 transition-all cursor-pointer ${
                isSignUp 
                  ? 'border-red-500 text-white' 
                  : 'border-transparent text-zinc-500 hover:text-zinc-350'
              }`}
            >
              Register
            </button>
          </div>

          {errors.auth && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs font-medium text-red-400">
              {errors.auth}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Portal Access Scope
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                    role === 'user'
                      ? 'border-red-500/50 bg-red-500/5 text-white'
                      : 'border-zinc-800 bg-zinc-950/20 text-zinc-500 hover:text-zinc-350'
                  }`}
                >
                  <span className="text-xs font-bold">Citizen / Responder</span>
                  <span className="text-[9px] opacity-70 mt-0.5">Report & View alerts</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                    role === 'admin'
                      ? 'border-red-500/50 bg-red-500/5 text-white'
                      : 'border-zinc-800 bg-zinc-950/20 text-zinc-500 hover:text-zinc-350'
                  }`}
                >
                  <span className="text-xs font-bold">System Admin</span>
                  <span className="text-[9px] opacity-70 mt-0.5">Command Center</span>
                </button>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute top-3.5 left-3 h-4.5 w-4.5 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors(prev => ({ ...prev, email: '' }));
                  }}
                  disabled={isLoading}
                  placeholder="name@agency.gov"
                  className={`w-full rounded-xl border bg-zinc-950/40 py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-650 outline-none transition-all focus:border-red-500/50 ${
                    errors.email ? 'border-red-500' : 'border-zinc-800'
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500 font-medium">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <Lock className="absolute top-3.5 left-3 h-4.5 w-4.5 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors(prev => ({ ...prev, password: '' }));
                  }}
                  disabled={isLoading}
                  placeholder="••••••••"
                  className={`w-full rounded-xl border bg-zinc-950/40 py-3 pl-10 pr-10 text-sm text-white placeholder-zinc-650 outline-none transition-all focus:border-red-500/50 ${
                    errors.password ? 'border-red-500' : 'border-zinc-800'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-3.5 right-3 text-zinc-500 hover:text-zinc-350"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500 font-medium">{errors.password}</p>}
            </div>

            {/* Confirm Password Field (Only for Sign-Up) */}
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute top-3.5 left-3 h-4.5 w-4.5 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrors(prev => ({ ...prev, confirmPassword: '' }));
                    }}
                    disabled={isLoading}
                    placeholder="••••••••"
                    className={`w-full rounded-xl border bg-zinc-950/40 py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-650 outline-none transition-all focus:border-red-500/50 ${
                      errors.confirmPassword ? 'border-red-500' : 'border-zinc-800'
                    }`}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-650 to-orange-600 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/20 hover:from-red-600 hover:to-orange-500 transition-all active:scale-[0.98] disabled:opacity-50 mt-6 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{isSignUp ? 'Register Account' : 'Authenticate Credentials'}</span>
              )}
            </button>
          </form>
        </div>

        {/* Info footer */}
        <p className="text-center text-[10px] text-zinc-600 leading-normal">
          Authorized personnel access only. Incident audits and location-based actions are logged on secure decentralized ledgers.
        </p>
      </div>
    </div>
  );
};
