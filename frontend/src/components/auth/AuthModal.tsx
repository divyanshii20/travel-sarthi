import { useEffect, useState, forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, User, X, Plane, ArrowRight, Eye, EyeOff,
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { useToast } from '@/hooks/useToast';
import { extractApiError } from '@/services/api';

// ─── Schemas ──────────────────────────────────────────────────────────────────
const signInSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const signUpSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Min 8 characters')
    .regex(/[A-Z]/, 'Add an uppercase letter')
    .regex(/[0-9]/, 'Add a number')
    .regex(/[^A-Za-z0-9]/, 'Add a special character'),
});

type SignInData = z.infer<typeof signInSchema>;
type SignUpData = z.infer<typeof signUpSchema>;

// ─── Premium font loader ──────────────────────────────────────────────────────
function usePremiumFont() {
  useEffect(() => {
    const id = 'auth-modal-font';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=DM+Sans:wght@400;500;600&display=swap';
    document.head.appendChild(link);
  }, []);
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export function AuthModal() {
  const activeModal = useUIStore((s) => s.activeModal);
  const closeModal = useUIStore((s) => s.closeModal);

  const isOpen = activeModal === 'auth-signin' || activeModal === 'auth-signup';
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  usePremiumFont();

  useEffect(() => {
    if (activeModal === 'auth-signup') setMode('signup');
    else if (activeModal === 'auth-signin') setMode('signin');
  }, [activeModal]);

  useEffect(() => {
    if (!isOpen) return undefined;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, closeModal]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="auth-modal-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
            fontFamily: '"DM Sans", system-ui, sans-serif',
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={closeModal}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(20,12,4,0.55)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          />

          {/* Modal panel */}
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'relative',
              width: '100%', maxWidth: 980,
              height: 620, maxHeight: '92vh',
              background: '#FFFCF8',
              borderRadius: 28,
              overflow: 'hidden',
              boxShadow:
                '0 50px 120px rgba(40,20,5,0.40), 0 16px 40px rgba(40,20,5,0.20), 0 0 0 1px rgba(255,255,255,0.6) inset',
              display: 'flex',
            }}
            role="dialog" aria-modal="true"
          >
            {/* Left visual */}
            <ModalVisual />

            {/* Right form */}
            <div style={{
              flex: 1,
              display: 'flex', flexDirection: 'column',
              padding: '52px 56px 44px',
              position: 'relative',
              minWidth: 0,
              background: '#FFFCF8',
            }}>
              {/* Close */}
              <button
                onClick={closeModal} aria-label="Close"
                style={{
                  position: 'absolute', top: 22, right: 22,
                  width: 36, height: 36, borderRadius: 11,
                  background: 'transparent',
                  border: '1px solid rgba(20,12,4,0.08)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#8A6E5C',
                  transition: 'all 0.22s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1A1208';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.borderColor = '#1A1208';
                  e.currentTarget.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#8A6E5C';
                  e.currentTarget.style.borderColor = 'rgba(20,12,4,0.08)';
                  e.currentTarget.style.transform = 'rotate(0deg)';
                }}
              >
                <X size={15} />
              </button>

              {/* Tabs */}
              <div style={{
                display: 'inline-flex', alignSelf: 'flex-start',
                background: '#F4ECE0',
                borderRadius: 99, padding: 4,
                marginBottom: 32,
              }}>
                {(['signin', 'signup'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    style={{
                      position: 'relative',
                      padding: '8px 22px', borderRadius: 99,
                      fontSize: 13, fontWeight: 500,
                      letterSpacing: '0.02em',
                      border: 'none', cursor: 'pointer',
                      background: 'transparent',
                      color: mode === m ? '#1A1208' : '#9A7E68',
                      transition: 'color 0.25s ease',
                    }}
                  >
                    {mode === m && (
                      <motion.div
                        layoutId="auth-tab-pill"
                        style={{
                          position: 'absolute', inset: 0,
                          background: 'white',
                          borderRadius: 99,
                          boxShadow:
                            '0 2px 10px rgba(40,20,5,0.10), 0 0 0 0.5px rgba(40,20,5,0.04)',
                        }}
                        transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }}
                      />
                    )}
                    <span style={{ position: 'relative', zIndex: 1 }}>
                      {m === 'signin' ? 'Sign in' : 'Create account'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Form */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <AnimatePresence mode="wait">
                  {mode === 'signin' ? (
                    <SignInForm key="signin" onClose={closeModal} switchMode={() => setMode('signup')} />
                  ) : (
                    <SignUpForm key="signup" onClose={closeModal} switchMode={() => setMode('signin')} />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Left Visual — single editorial image ────────────────────────────────────
function ModalVisual() {
  return (
    <div
      className="hidden md:block"
      style={{
        width: '46%',
        position: 'relative',
        overflow: 'hidden',
        background: '#1A1208',
      }}
    >
      {/* Hero image — calm Aman-style aerial coast */}
      <motion.img
        src="https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=92"
        alt=""
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 50%',
        }}
      />

      {/* Warm dark gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background:
          'linear-gradient(180deg, rgba(20,12,4,0.10) 0%, rgba(20,12,4,0.20) 40%, rgba(20,12,4,0.85) 100%)',
      }} />

      {/* Subtle saffron tint at bottom for warmth */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
        background:
          'linear-gradient(to top, rgba(232,98,42,0.18) 0%, transparent 100%)',
        mixBlendMode: 'soft-light',
      }} />

      {/* Grain texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        opacity: 0.30, mixBlendMode: 'overlay',
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.45'/></svg>\")",
      }} />

      {/* Brand mark */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        style={{
          position: 'absolute', top: 32, left: 36,
          display: 'flex', alignItems: 'center', gap: 10,
          zIndex: 5,
        }}
      >
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'rgba(255,255,255,0.14)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.30)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Plane size={13} color="white" />
        </div>
        <span style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: 19, color: 'white', letterSpacing: '0.005em',
          fontWeight: 400,
        }}>
          Travel Sarthi
        </span>
      </motion.div>

      {/* Top-right destination badge */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
        style={{
          position: 'absolute', top: 36, right: 36,
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '6px 12px', borderRadius: 99,
          background: 'rgba(255,255,255,0.10)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.22)',
          zIndex: 5,
        }}
      >
        <div style={{
          width: 5, height: 5, borderRadius: '50%', background: '#5BD672',
          boxShadow: '0 0 8px rgba(91,214,114,0.85)',
        }} />
        <span style={{
          fontSize: 9.5, color: 'white', fontWeight: 500,
          letterSpacing: '0.16em', textTransform: 'uppercase',
        }}>
          350+ Live
        </span>
      </motion.div>

      {/* Editorial quote at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute', bottom: 44, left: 36, right: 36,
          zIndex: 5,
        }}
      >
        {/* Ornament */}
        <div style={{
          width: 32, height: 1.5,
          background: '#FFB84A',
          marginBottom: 22,
          borderRadius: 2,
        }} />

        <p style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: 28, fontWeight: 400, fontStyle: 'italic',
          color: 'white', lineHeight: 1.25,
          letterSpacing: '-0.01em', margin: 0,
          textShadow: '0 2px 24px rgba(0,0,0,0.35)',
        }}>
          The world is a book —<br />
          and those who do not travel<br />
          read only one page.
        </p>

        <p style={{
          fontSize: 10.5, color: 'rgba(255,255,255,0.55)',
          letterSpacing: '0.20em', textTransform: 'uppercase',
          marginTop: 18, marginBottom: 0,
          fontWeight: 500,
        }}>
          — St. Augustine
        </p>
      </motion.div>
    </div>
  );
}

// ─── Sign In Form ────────────────────────────────────────────────────────────
function SignInForm({ onClose, switchMode }: { onClose: () => void; switchMode: () => void }) {
  const setUser = useAuthStore((s) => s.setUser);
  const { error: toastError, success } = useToast();
  const [showPwd, setShowPwd] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInData) => {
    try {
      const res = await authService.login({ email: data.email, password: data.password });
      if (res.error != null) toastError(res.error.message);
      else if (res.data != null) {
        setUser(res.data.user);
        success(`Welcome back, ${res.data.user.displayName.split(' ')[0]} 👋`);
        onClose();
      }
    } catch (err) { toastError(extractApiError(err)); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
    >
      <FormHeader
        title="Welcome"
        accent="back."
        sub="Continue your journey where you left off."
      />

      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} style={{ marginTop: 28 }}>
        <ModalField label="Email address" icon={<Mail size={14} />} type="email"
          placeholder="you@example.com"
          error={errors.email?.message} {...register('email')} />

        <ModalField
          label="Password" icon={<Lock size={14} />}
          type={showPwd ? 'text' : 'password'}
          placeholder="Enter your password"
          error={errors.password?.message}
          rightAction={
            <button type="button" onClick={() => setShowPwd((p) => !p)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#B89F8A', display: 'flex', alignItems: 'center',
                padding: 4,
              }}>
              {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          }
          {...register('password')} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -4, marginBottom: 22 }}>
          <a href="/forgot-password" onClick={onClose}
            style={{ fontSize: 12, color: '#E8622A', fontWeight: 600, textDecoration: 'none' }}>
            Forgot password?
          </a>
        </div>

        <SubmitButton isLoading={isSubmitting} label="Sign in to your account" />
      </form>

      <Divider />

      <GoogleButton label="Continue with Google" />

      <SwitchPrompt
        text="New to Travel Sarthi?"
        link="Create an account"
        onClick={switchMode}
      />
    </motion.div>
  );
}

// ─── Sign Up Form ────────────────────────────────────────────────────────────
function SignUpForm({ onClose, switchMode }: { onClose: () => void; switchMode: () => void }) {
  const setUser = useAuthStore((s) => s.setUser);
  const { error: toastError, success } = useToast();
  const [showPwd, setShowPwd] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpData) => {
    try {
      const res = await authService.register(data);
      if (res.error != null) toastError(res.error.message);
      else if (res.data != null) {
        setUser(res.data.user);
        success('Welcome to Travel Sarthi 🎉');
        onClose();
      }
    } catch (err) { toastError(extractApiError(err)); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
    >
      <FormHeader
        title="Begin"
        accent="your story."
        sub="Join 4 lakh+ travellers planning smarter."
      />

      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} style={{ marginTop: 28 }}>
        <ModalField label="Full name" icon={<User size={14} />}
          placeholder="Your name"
          error={errors.displayName?.message} {...register('displayName')} />

        <ModalField label="Email address" icon={<Mail size={14} />} type="email"
          placeholder="you@example.com"
          error={errors.email?.message} {...register('email')} />

        <ModalField
          label="Password" icon={<Lock size={14} />}
          type={showPwd ? 'text' : 'password'}
          placeholder="At least 8 characters"
          error={errors.password?.message}
          rightAction={
            <button type="button" onClick={() => setShowPwd((p) => !p)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#B89F8A', display: 'flex', alignItems: 'center',
                padding: 4,
              }}>
              {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          }
          {...register('password')} />

        <SubmitButton isLoading={isSubmitting} label="Create my free account" />
      </form>

      <p style={{
        fontSize: 11, color: '#A8907A', textAlign: 'center',
        margin: '14px 0 0', lineHeight: 1.5,
      }}>
        By creating an account, you agree to our{' '}
        <a href="/terms" style={{ color: '#8A6E5C', textDecoration: 'underline' }}>Terms</a>{' '}
        &amp;{' '}
        <a href="/privacy" style={{ color: '#8A6E5C', textDecoration: 'underline' }}>Privacy Policy</a>.
      </p>

      <SwitchPrompt
        text="Already a member?"
        link="Sign in instead"
        onClick={switchMode}
      />
    </motion.div>
  );
}

// ─── Reusable parts ──────────────────────────────────────────────────────────
function FormHeader({ title, accent, sub }: { title: string; accent: string; sub: string }) {
  return (
    <div>
      <h2 style={{
        fontFamily: '"Cormorant Garamond", serif',
        fontSize: 42, fontWeight: 300,
        color: '#1A1208', lineHeight: 1.04,
        letterSpacing: '-0.025em', margin: 0,
      }}>
        {title}{' '}
        <em style={{
          color: '#E8622A', fontWeight: 500, fontStyle: 'italic',
        }}>
          {accent}
        </em>
      </h2>
      <p style={{
        marginTop: 10, marginBottom: 0,
        fontSize: 13.5, color: '#8A6E5C',
        lineHeight: 1.55, letterSpacing: '0.005em',
      }}>
        {sub}
      </p>
    </div>
  );
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: React.ReactNode;
  error?: string | undefined;
  rightAction?: React.ReactNode;
}

const ModalField = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, icon, error, rightAction, ...rest }, ref) => (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        fontSize: 10.5, fontWeight: 600, color: '#9A7E68',
        letterSpacing: '0.14em', textTransform: 'uppercase',
        marginBottom: 8, display: 'block',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span style={{
          position: 'absolute', left: 14,
          color: error ? '#E54B4B' : '#B89F8A',
          display: 'flex', alignItems: 'center',
          pointerEvents: 'none', zIndex: 1,
        }}>
          {icon}
        </span>
        <input
          ref={ref}
          {...rest}
          style={{
            width: '100%',
            padding: rightAction ? '13px 42px 13px 40px' : '13px 14px 13px 40px',
            fontSize: 14, fontFamily: 'inherit', color: '#1A1208',
            background: '#FBF5EE',
            border: error ? '1.5px solid #E54B4B' : '1.5px solid transparent',
            borderRadius: 12, outline: 'none',
            transition: 'all 0.22s ease',
          }}
          onFocus={(e) => {
            if (!error) {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#E8622A';
              e.currentTarget.style.boxShadow = '0 0 0 4px rgba(232,98,42,0.10)';
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.background = '#FBF5EE';
            e.currentTarget.style.borderColor = error ? '#E54B4B' : 'transparent';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        {rightAction && (
          <span style={{ position: 'absolute', right: 12, zIndex: 1 }}>
            {rightAction}
          </span>
        )}
      </div>
      {error && (
        <p style={{ fontSize: 11, color: '#E54B4B', margin: '6px 0 0', fontWeight: 500 }}>
          {error}
        </p>
      )}
    </div>
  )
);
ModalField.displayName = 'ModalField';

function SubmitButton({ isLoading, label }: { isLoading: boolean; label: string }) {
  return (
    <motion.button
      type="submit"
      disabled={isLoading}
      whileHover={!isLoading ? { y: -1 } : {}}
      whileTap={!isLoading ? { scale: 0.99 } : {}}
      style={{
        width: '100%',
        padding: '14px 20px',
        background: isLoading
          ? '#D9C8B8'
          : 'linear-gradient(135deg, #FF8B5A 0%, #E8622A 50%, #C94E1A 100%)',
        color: 'white',
        fontSize: 14, fontWeight: 600, letterSpacing: '0.005em',
        fontFamily: 'inherit',
        border: 'none', borderRadius: 12,
        cursor: isLoading ? 'wait' : 'pointer',
        boxShadow: isLoading ? 'none'
          : '0 12px 30px rgba(232,98,42,0.30), inset 0 1px 0 rgba(255,255,255,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        marginTop: 4, transition: 'all 0.25s ease',
      }}
    >
      {isLoading ? 'Please wait…' : (
        <>
          {label}
          <ArrowRight size={15} />
        </>
      )}
    </motion.button>
  );
}

function Divider() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      margin: '22px 0 18px',
    }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(20,12,4,0.08)' }} />
      <span style={{
        fontSize: 10, color: '#A8907A',
        letterSpacing: '0.20em', textTransform: 'uppercase', fontWeight: 500,
      }}>
        or
      </span>
      <div style={{ flex: 1, height: 1, background: 'rgba(20,12,4,0.08)' }} />
    </div>
  );
}

function GoogleButton({ label }: { label: string }) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -1, boxShadow: '0 6px 18px rgba(20,12,4,0.10)' }}
      whileTap={{ scale: 0.99 }}
      style={{
        width: '100%',
        padding: '12px 18px',
        background: 'white',
        border: '1.5px solid rgba(20,12,4,0.10)',
        borderRadius: 12,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        fontSize: 13.5, fontWeight: 500, color: '#1A1208',
        fontFamily: 'inherit',
        transition: 'all 0.22s ease',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {label}
    </motion.button>
  );
}

function SwitchPrompt({ text, link, onClick }: { text: string; link: string; onClick: () => void }) {
  return (
    <p style={{
      textAlign: 'center', fontSize: 13,
      color: '#8A6E5C', marginTop: 'auto', paddingTop: 24, marginBottom: 0,
    }}>
      {text}{' '}
      <button
        type="button"
        onClick={onClick}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#E8622A', fontWeight: 600, fontSize: 13,
          padding: 0, fontFamily: 'inherit',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
        onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
      >
        {link}
      </button>
    </p>
  );
}
