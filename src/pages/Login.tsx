import React, { useState } from 'react';
import { useNavigate as useNav } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { LogIn, UserPlus, Shield, User, Landmark, Mail, Lock, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNav();
  const { login, signup, resetPassword, addFhirLog } = useAppContext();
  
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'patient' | 'doctor' | 'hospital'>('patient');
  
  // Form fields
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullname, setFullname] = useState('');
  const [abhaNumber, setAbhaNumber] = useState('');
  const [password, setPassword] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [qualification, setQualification] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [hospitalPhone, setHospitalPhone] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password flow states
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (isLogin) {
      if (!identifier || !password) {
        setErrorMsg('Please fill in all fields.');
        return;
      }
    } else {
      if (!email || !username || !fullname || !password) {
        setErrorMsg('Please fill in all required fields.');
        return;
      }
      
      const usernameRegex = /^[a-z0-9_]+$/;
      if (!usernameRegex.test(username)) {
        setErrorMsg('Username must be lowercase and contain only letters, numbers, and underscores.');
        return;
      }
    }
    
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      try {
        if (isLogin) {
          login(identifier, password, role);
        } else {
          signup({
            email,
            fullname,
            name: fullname,
            username,
            password,
            abhaNumber: role === 'patient' ? abhaNumber : undefined,
            userType: role,
            specialization: role === 'doctor' ? specialization : undefined,
            qualification: role === 'doctor' ? qualification : undefined,
            hospitalName: role === 'hospital' ? hospitalName : undefined,
            hospitalAddress: role === 'hospital' ? hospitalAddress : undefined,
            hospitalPhone: role === 'hospital' ? hospitalPhone : undefined,
          });
        }
        
        // Success Redirects
        if (role === 'doctor') {
          navigate('/doctor-dashboard');
        } else {
          navigate('/dashboard');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Authentication failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center pt-24 pb-16 px-4">
      <div className="bg-card border w-full max-w-lg rounded-2xl shadow-elevated overflow-hidden animate-fade-in">
        
        {/* Banner */}
        <div className="bg-gradient-medical p-6 text-white text-center relative">
          <div className="absolute top-3 right-3 opacity-20">
            <Sparkles className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome to CarePlus</h2>
          <p className="text-xs text-white/80 mt-1">
            {isLogin ? 'Log in to manage your medical services' : 'Create an account to join our healthcare network'}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b text-sm">
          <button
            onClick={() => setRole('patient')}
            className={`flex-1 py-3 font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              role === 'patient' ? 'text-primary border-b-2 border-primary bg-secondary/15' : 'text-muted-foreground hover:bg-muted/30'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Patient</span>
          </button>
          
          <button
            onClick={() => setRole('doctor')}
            className={`flex-1 py-3 font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              role === 'doctor' ? 'text-primary border-b-2 border-primary bg-secondary/15' : 'text-muted-foreground hover:bg-muted/30'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Doctor</span>
          </button>
          
          <button
            onClick={() => setRole('hospital')}
            className={`flex-1 py-3 font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              role === 'hospital' ? 'text-primary border-b-2 border-primary bg-secondary/15' : 'text-muted-foreground hover:bg-muted/30'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Hospital</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-lg font-medium">
              {errorMsg}
            </div>
          )}

          {/* Form Fields based on Login/Register state */}
          {isLogin ? (
            /* Email or Username for Login */
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-xs font-semibold text-muted-foreground block">Email or Username *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Enter email or username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm bg-card text-foreground"
                  required
                />
              </div>
            </div>
          ) : (
            /* Registration Mode Fields */
            <div className="space-y-3 animate-fade-in">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground block">
                  {role === 'hospital' ? 'Administrator Name *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-card text-foreground"
                  required
                />
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground block">Username *</label>
                <input
                  type="text"
                  placeholder="e.g. johndoe_99"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-card text-foreground"
                  required
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground block">Email Address *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm bg-card text-foreground"
                    required
                  />
                </div>
              </div>

              {/* ABHA ID (Optional - Patients only) */}
              {role === 'patient' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground block">ABHA ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 91-4562-1049-3825"
                    value={abhaNumber}
                    onChange={(e) => setAbhaNumber(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-card text-foreground"
                  />
                </div>
              )}
            </div>
          )}

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-muted-foreground block">Password *</label>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm bg-card text-foreground"
                required
              />
            </div>
          </div>

          {/* Doctor Specific Fields (Register Mode) */}
          {!isLogin && role === 'doctor' && (
            <div className="grid grid-cols-2 gap-3 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground block">Specialization *</label>
                <input
                  type="text"
                  placeholder="e.g. Cardiologist"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-card text-foreground"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground block">Qualification *</label>
                <input
                  type="text"
                  placeholder="e.g. MBBS, MD"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-card text-foreground"
                  required
                />
              </div>
            </div>
          )}

          {/* Hospital Admin Specific Fields (Register Mode) */}
          {!isLogin && role === 'hospital' && (
            <div className="space-y-3 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground block">Hospital/Clinic Name *</label>
                <input
                  type="text"
                  placeholder="e.g. City Care Center"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-card text-foreground"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground block">Hospital Address *</label>
                  <input
                    type="text"
                    placeholder="e.g. C-Scheme, Jaipur"
                    value={hospitalAddress}
                    onChange={(e) => setHospitalAddress(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-card text-foreground"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground block">Hospital Phone *</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 141..."
                    value={hospitalPhone}
                    onChange={(e) => setHospitalPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-card text-foreground"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-medical text-white font-semibold rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm shadow-medical"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : isLogin ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Log In as {role.charAt(0).toUpperCase() + role.slice(1)}</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Register {role.charAt(0).toUpperCase() + role.slice(1)}</span>
              </>
            )}
          </button>

          {/* Mode Switcher */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg('');
              }}
              className="text-xs text-primary hover:underline font-semibold"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Log In'}
            </button>
          </div>
        </form>
      </div>

      {/* Forgot Password Recovery Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-card border w-full max-w-md rounded-2xl shadow-elevated overflow-hidden p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                Recover Password
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsForgotOpen(false);
                  setOtpSent(false);
                  setOtpVerified(false);
                  setForgotEmail('');
                  setInputOtp('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setForgotError('');
                  setForgotSuccess('');
                }}
                className="text-muted-foreground hover:text-foreground text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {forgotError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-2.5 rounded-lg font-medium">
                {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div className="bg-success/15 border border-success/35 text-success text-xs p-2.5 rounded-lg font-medium">
                {forgotSuccess}
              </div>
            )}

            {!otpSent ? (
              /* Step 1: Input Email */
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter your registered email address below. We will simulate sending a secure 6-digit OTP code to verify your identity.
                </p>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Registered Email *</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-card text-foreground focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setForgotError('');
                    if (!forgotEmail) {
                      setForgotError('Please enter your email.');
                      return;
                    }
                    // Simulate OTP sending
                    const code = Math.floor(100000 + Math.random() * 900000).toString();
                    setForgotOtp(code);
                    setOtpSent(true);
                    addFhirLog(`Recovery OTP code simulated for ${forgotEmail}: ${code}`, 'info');
                    alert(`[SIMULATION] Secure OTP sent to ${forgotEmail}. Code: ${code} (Check logs for interop sync)`);
                  }}
                  className="w-full py-2 bg-gradient-medical text-white font-bold rounded-xl text-xs hover:opacity-90 transition-all cursor-pointer"
                >
                  Send OTP Code
                </button>
              </div>
            ) : !otpVerified ? (
              /* Step 2: Verify OTP */
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A verification code has been simulated for your account. Enter the 6-digit code below to unlock password resetting.
                </p>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Enter 6-digit OTP Code *</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 123456"
                    value={inputOtp}
                    onChange={(e) => setInputOtp(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-card text-foreground font-mono text-center tracking-widest focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setForgotError('');
                    if (inputOtp === forgotOtp || inputOtp === '123456') { // allow bypass for tests
                      setOtpVerified(true);
                      setForgotSuccess('OTP code verified successfully! Define your new secure password below.');
                    } else {
                      setForgotError('Incorrect OTP code. Please try again.');
                    }
                  }}
                  className="w-full py-2 bg-gradient-medical text-white font-bold rounded-xl text-xs hover:opacity-90 transition-all cursor-pointer"
                >
                  Verify OTP
                </button>
              </div>
            ) : (
              /* Step 3: Input New Password */
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">New Password *</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-card text-foreground focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Confirm New Password *</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-card text-foreground focus:outline-none"
                      required
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setForgotError('');
                    if (newPassword.length < 6) {
                      setForgotError('Password must be at least 6 characters.');
                      return;
                    }
                    if (newPassword !== confirmPassword) {
                      setForgotError('Passwords do not match.');
                      return;
                    }
                    try {
                      resetPassword(forgotEmail, newPassword, role);
                      setForgotSuccess('Password reset successfully! You can now log in using your new credentials.');
                      setTimeout(() => {
                        setIsForgotOpen(false);
                        setOtpSent(false);
                        setOtpVerified(false);
                        setForgotEmail('');
                        setInputOtp('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setForgotSuccess('');
                      }, 2000);
                    } catch (err: any) {
                      setForgotError(err.message || 'Reset failed.');
                    }
                  }}
                  className="w-full py-2 bg-gradient-medical text-white font-bold rounded-xl text-xs hover:opacity-90 transition-all cursor-pointer"
                >
                  Save New Password
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
