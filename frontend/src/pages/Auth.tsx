import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAlerts } from '../context/AlertContext';
import { ShieldAlert, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export const Auth: React.FC = () => {
  const { login, signup, verifyEmail, resendOtp } = useAlerts();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [adminCode, setAdminCode] = useState('');

  // OTP Verification States
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [cooldown, setCooldown] = useState(0);
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Verification resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

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

    if (role === 'admin' && !adminCode.trim()) {
      newErrors.adminCode = 'Administrative secret code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});
    try {
      if (isSignUp) {
        const res = await signup(email, password, role, adminCode);
        if (res.success) {
          if (res.requiresVerification) {
            setIsVerifying(true);
            setCooldown(60);
          } else {
            navigate('/');
          }
        } else {
          setErrors({ auth: res.message || 'Registration failed.' });
        }
      } else {
        const res = await login(email, password, adminCode, role);
        if (res.success) {
          navigate('/'); // Redirect to dashboard on success
        } else if (res.requiresVerification) {
          setIsVerifying(true);
          setCooldown(60);
        } else {
          setErrors({ auth: res.message || 'Authentication failed.' });
        }
      }
    } catch (err) {
      setErrors({ auth: 'Authentication failed. Please check your network connection.' });
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
    setAdminCode('');
    setErrors({});
  };

  // Premium OTP 6-digit box focus controls
  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;
    const value = element.value;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance focus to the next field if input was written
    if (value !== '') {
      const nextInput = element.nextElementSibling as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const target = e.currentTarget;
      if (target.value === '') {
        const prevInput = target.previousElementSibling as HTMLInputElement;
        if (prevInput) {
          prevInput.focus();
        }
      }
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setErrors({ otp: 'Please enter the complete 6-digit verification code.' });
      return;
    }

    setIsLoading(true);
    setErrors({});
    try {
      const res = await verifyEmail(email, otpCode);
      if (res.success) {
        navigate('/'); // Redirect to dashboard
      } else {
        setErrors({ auth: res.message || 'Invalid passcode or expired code. Please try again.' });
      }
    } catch (err) {
      setErrors({ auth: 'Verification failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (cooldown > 0) return;
    setIsLoading(true);
    setErrors({});
    try {
      const res = await resendOtp(email);
      if (res.success) {
        setCooldown(60);
        setErrors({ success: 'A fresh verification passcode has been dispatched to your email.' });
      } else {
        setErrors({ auth: res.message || 'Failed to dispatch verification code. Please try again.' });
      }
    } catch (err) {
      setErrors({ auth: 'Failed to resend code. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] sm:h-[500px] sm:w-[500px] rounded-full bg-red-600/10 blur-[80px] pointer-events-none"></div>
      
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
              Authorized Responder Authentication
            </p>
          </div>
        </div>

        {/* Auth Box Container */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          
          {isVerifying ? (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Email Verification Required</h3>
                <p className="text-xs text-zinc-400 mt-2">
                  We have dispatched a 6-digit security code to:
                </p>
                <p className="text-sm font-mono font-bold text-red-400 select-all mt-1">{email}</p>
              </div>

              {errors.success && (
                <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs font-medium text-emerald-400">
                  {errors.success}
                </div>
              )}

              {errors.auth && (
                <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs font-medium text-red-400">
                  {errors.auth}
                </div>
              )}

              <form onSubmit={handleVerifySubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 text-center">
                    Enter OTP Code
                  </label>
                  <div className="flex justify-center gap-2.5 my-4">
                    {otp.map((data, index) => (
                      <input
                        key={index}
                        type="text"
                        maxLength={1}
                        value={data}
                        onChange={e => handleOtpChange(e.target, index)}
                        onKeyDown={e => handleOtpKeyDown(e)}
                        onFocus={e => e.target.select()}
                        className="w-11 h-12 text-center text-xl font-bold bg-zinc-950/60 border border-zinc-800 rounded-xl text-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-all font-mono"
                      />
                    ))}
                  </div>
                  {errors.otp && <p className="mt-2 text-xs text-red-500 font-medium text-center">{errors.otp}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-650 to-orange-600 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/20 hover:from-red-600 hover:to-orange-500 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <span className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <span>Confirm & Activate Portal</span>
                  )}
                </button>
              </form>

              <div className="flex flex-col items-center gap-3 pt-4 border-t border-zinc-800/60 text-xs">
                {cooldown > 0 ? (
                  <span className="text-zinc-500 font-mono">
                    Resend passcode in {cooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="text-red-500 hover:text-red-400 font-bold transition-all cursor-pointer underline decoration-dotted underline-offset-4"
                  >
                    Resend Code
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsVerifying(false);
                    setOtp(Array(6).fill(''));
                    setErrors({});
                  }}
                  className="text-zinc-500 hover:text-zinc-300 font-medium cursor-pointer transition-all mt-1"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Selector */}
              <div className="flex border-b border-zinc-800 mb-6 pb-0.5">
                <button
                  onClick={() => handleTabToggle(false)}
                  className={`flex-1 pb-3 text-center text-sm font-bold border-b-2 transition-all cursor-pointer ${
                    !isSignUp 
                      ? 'border-red-500 text-white' 
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleTabToggle(true)}
                  className={`flex-1 pb-3 text-center text-sm font-bold border-b-2 transition-all cursor-pointer ${
                    isSignUp 
                      ? 'border-red-500 text-white' 
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
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
                      onClick={() => {
                        setRole('user');
                        setErrors(prev => ({ ...prev, adminCode: '' }));
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                        role === 'user'
                          ? 'border-red-500/50 bg-red-500/5 text-white'
                          : 'border-zinc-800 bg-zinc-950/20 text-zinc-500 hover:text-zinc-300'
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
                          : 'border-zinc-800 bg-zinc-950/20 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <span className="text-xs font-bold">System Admin</span>
                      <span className="text-[9px] opacity-70 mt-0.5">Command Center</span>
                    </button>
                  </div>
                </div>

                {/* Admin Secret Code Field (Displayed only when admin is selected) */}
                {role === 'admin' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Admin Secret Passcode
                    </label>
                    <div className="relative">
                      <ShieldAlert className="absolute top-3.5 left-3 h-4.5 w-4.5 text-zinc-500" />
                      <input
                        type="password"
                        value={adminCode}
                        onChange={(e) => {
                          setAdminCode(e.target.value);
                          setErrors(prev => ({ ...prev, adminCode: '' }));
                        }}
                        disabled={isLoading}
                        placeholder="Enter Admin secret code"
                        className={`w-full rounded-xl border bg-zinc-950/40 py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-605 outline-none transition-all focus:border-red-500/50 ${
                          errors.adminCode ? 'border-red-500' : 'border-zinc-800'
                        }`}
                      />
                    </div>
                    {errors.adminCode && <p className="mt-1 text-xs text-red-500 font-medium">{errors.adminCode}</p>}
                  </div>
                )}

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
                      className="absolute top-3.5 right-3 text-zinc-500 hover:text-zinc-300"
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
            </>
          )}
        </div>

        {/* Info footer */}
        <p className="text-center text-[10px] text-zinc-600 leading-normal">
          Authorized personnel access only. Incident audits and location-based actions are logged on secure decentralised systems.
        </p>
      </div>
    </div>
  );
};
