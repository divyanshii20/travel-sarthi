import { useEffect, useState, forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, X, Plane, Sparkles, ArrowRight } from 'lucide-react';
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
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
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
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=DM+Sans:wght@400;500;600&display=swap';
    document.head.appendChild(link);
  }, []);
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export function AuthModal() {
  const activeModal = useUIStore((s) => s.activeModal);
  const closeModal  = useUIStore((s) => s.closeModal);

  const isOpen = activeModal === 'auth-signin' || activeModal === 'auth-signup';
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  usePremiumFont();

  // Sync mode with store
  useEffect(() => {
    if (activeModal === 'auth-signup') setMode('signup');
    else if (activeModal === 'auth-signin') setMode('signin');
  }, [activeModal]);

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, closeModal]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeModal}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(20,12,4,0.45)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 101,
              width: '92vw', maxWidth: 880,
              maxHeight: '90vh',
              background: '#FFFCF8',
              borderRadius: 24,
              overflow: 'hidden',
              boxShadow:
                '0 40px 100px rgba(40,20,5,0.32), 0 12px 32px rgba(40,20,5,0.18)',
              fontFamily: '"DM Sans", system-ui, sans-serif',
              display: 'flex',
            }}
            role="dialog"
            aria-modal="true"
          >
            {/* ── Left: Visual ── */}
            <ModalVisual />

            {/* ── Right: Form ── */}
            <div style={{
              flex: 1,
              padding: '40px 44px 36px',
              display: 'flex', flexDirection: 'column',
              position: 'relative',
              minWidth: 0,
            }}>
              {/* Close button */}
              <button
                onClick={closeModal}
                aria-label="Close"
                style={{
                  position: 'absolute', top: 18, right: 18,
                  width: 32, height: 32, borderRadius: 10,
                  background: 'rgba(20,12,4,0.04)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#8A6E5C', transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(232,98,42,0.10)'; e.currentTarget.style.color = '#E8622A'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(20,12,4,0.04)'; e.currentTarget.style.color = '#8A6E5C'; }}
              >
                <X size={16} />
              </button>

              {/* Tabs */}
              <div style={{
                display: 'inline-flex', alignSelf: 'flex-start',
                background: '#F4ECE0',
                borderRadius: 99, padding: 4,
                marginBottom: 28, marginTop: 6,
              }}>
                {(['signin', 'signup'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    style={{
                      position: 'relative',
                      padding: '7px 18px', borderRadius: 99,
                      fontSize: 12.5, fontWeight: 500,
                      letterSpacing: '0.01em',
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
                          boxShadow: '0 2px 8px rgba(40,20,5,0.10)',
                        }}
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                    <span style={{ position: 'relative', zIndex: 1 }}>
                      {m === 'signin' ? 'Sign In' : 'Sign Up'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Content swap */}
              <AnimatePresence mode="wait">
                {mode === 'signin' ? (
                  <SignInForm key="signin" onClose={closeModal} switchMode={() => setMode('signup')} />
                ) : (
                  <SignUpForm key="signup" onClose={closeModal} switchMode={() => setMode('signin')} />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Left visual (mini moodboard) ────────────────────────────────────────────
function ModalVisual() {
  return (
    <div
      className="hidden md:block"
      style={{
        width: '42%',
        position: 'relative', overflow: 'hidden',
        background:
          'radial-gradient(ellipse at top, #FFE8D6 0%, #FBF1E5 50%, #F5E5D2 100%)',
      }}
    >
      {/* Grain noise */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        opacity: 0.35, mixBlendMode: 'multiply',
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.6  0 0 0 0 0.45  0 0 0 0 0.3  0 0 0 0.05 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      }} />

      {/* Saffron glow */}
      <div style={{
        position: 'absolute', top: '-15%', left: '-15%',
        width: 240, height: 240, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(232,98,42,0.18), transparent 70%)',
        filter: 'blur(50px)', pointerEvents: 'none',
      }} />

      {/* Two polaroid images */}
      <motion.div
        initial={{ opacity: 0, y: 24, rotate: -3.5 }}
        animate={{ opacity: 1, y: 0, rotate: -3.5 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute', top: '14%', left: '12%',
          width: '70%', height: '46%',
          borderRadius: 14, overflow: 'hidden',
          border: '4px solid white',
          boxShadow: '0 20px 40px rgba(80,40,15,0.20)',
        }}
      >
        <motion.img
          src="https://images.unsplash.com/photo-1545158535-c3f7168c28b6?w=600&q=85"
          alt="Balloons"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24, rotate: 4 }}
        animate={{ opacity: 1, y: 0, rotate: 4 }}
        transition={{ duration: 0.7, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute', bottom: '14%', right: '8%',
          width: '64%', height: '40%',
          borderRadius: 14, overflow: 'hidden',
          border: '4px solid white',
          boxShadow: '0 20px 40px rgba(80,40,15,0.22)',
        }}
      >
        <motion.img
          src="https://images.unsplash.com/photo-1547235001-d703406d3641?w=600&q=85"
          alt="Dunes"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </motion.div>

      {/* Brand top */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={{
          position: 'absolute', top: 22, left: 24,
          display: 'flex', alignItems: 'center', gap: 8,
          zIndex: 5,
        }}
      >
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: '#E8622A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(232,98,42,0.40)',
        }}>
          <Plane size={11} color="white" />
        </div>
        <span style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: 17, color: '#1A1208', letterSpacing: '0.005em',
        }}>
          <span style={{ fontWeight: 500, color: '#E8622A' }}>Travel</span>{' '}
          <span style={{ fontWeight: 400 }}>Sarthi</span>
        </span>
      </motion.div>

      {/* Bottom poetic line */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        style={{
          position: 'absolute', bottom: 22, left: 24, right: 24,
          textAlign: 'left',
        }}
      >
        <div style={{
          fontSize: 9, color: '#B07050',
          letterSpacing: '0.24em', textTransform: 'uppercase',
          fontWeight: 500, marginBottom: 6,
        }}>
          ✦ Wander Beautifully
        </div>
        <p style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: 18, fontStyle: 'italic', fontWeight: 400,
          color: '#1A1208', lineHeight: 1.25, letterSpacing: '-0.01em',
          margin: 0,
        }}>
          Curated journeys,<br />
          <span style={{ color: '#E8622A', fontWeight: 500 }}>beautifully planned.</span>
        </p>
      </motion.div>
    </div>
  );
}

// ─── Sign In Form ─────────────────────────────────────────────────────────────
function SignInForm({ onClose, switchMode }: { onClose: () => void; switchMode: () => void }) {
  const setUser = useAuthStore((s) => s.setUser);
  const { error: toastError, success } = useToast();
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
    } catch (err) {
      toastError(extractApiError(err));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <FormHeader
        eyebrow="Welcome back"
        title="Sign in to your"
        accent="account."
      />

      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} style={{ marginTop: 24 }}>
        <ModalField label="Email" icon={<Mail size={14} />} type="email" placeholder="you@example.com"
          error={errors.email?.message} {...register('email')} />
        <ModalField label="Password" icon={<Lock size={14} />} type="password" placeholder="••••••••"
          error={errors.password?.message} {...register('password')} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -2, marginBottom: 18 }}>
          <a href="/forgot-password" style={{
            fontSize: 12, color: '#E8622A', fontWeight: 600, textDecoration: 'none',
          }}>
            Forgot password?
          </a>
        </div>

        <SubmitButton isLoading={isSubmitting} label="Sign in" />
      </form>

      <SwitchPrompt
        text="New to Travel Sarthi?"
        link="Create an account"
        onClick={switchMode}
      />
    </motion.div>
  );
}

// ─── Sign Up Form ─────────────────────────────────────────────────────────────
function SignUpForm({ onClose, switchMode }: { onClose: () => void; switchMode: () => void }) {
  const setUser = useAuthStore((s) => s.setUser);
  const { error: toastError, success } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpData) => {
    try {
      const res = await authService.register(data);
      if (res.error != null) toastError(res.error.message);
      else if (res.data != null) {
        setUser(res.data.user);
        success('Welcome to Travel Sarthi! 🎉');
        onClose();
      }
    } catch (err) {
      toastError(extractApiError(err));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <FormHeader
        eyebrow="Begin the journey"
        title="Create your"
        accent="free account."
      />

      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} style={{ marginTop: 24 }}>
        <ModalField label="Full Name" icon={<User size={14} />} placeholder="Riya Sharma"
          error={errors.displayName?.message} {...register('displayName')} />
        <ModalField label="Email" icon={<Mail size={14} />} type="email" placeholder="you@example.com"
          error={errors.email?.message} {...register('email')} />
        <ModalField label="Password" icon={<Lock size={14} />} type="password" placeholder="At least 8 characters"
          error={errors.password?.message} {...register('password')} />

        <SubmitButton isLoading={isSubmitting} label="Create account" />
      </form>

      <SwitchPrompt
        text="Already have an account?"
        link="Sign in"
        onClick={switchMode}
      />
    </motion.div>
  );
}

// ─── Reusable bits ────────────────────────────────────────────────────────────
function FormHeader({ eyebrow, title, accent }: { eyebrow: string; title: string; accent: string }) {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
      }}>
        <Sparkles size={11} color="#E8622A" />
        <span style={{
          fontSize: 10, color: '#B07050',
          letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 500,
        }}>
          {eyebrow}
        </span>
      </div>
      <h2 style={{
        fontFamily: '"Cormorant Garamond", serif',
        fontSize: 36, fontWeight: 300,
        color: '#1A1208', lineHeight: 1.08,
        letterSpacing: '-0.025em', margin: 0,
      }}>
        {title}{' '}
        <em style={{
          color: '#E8622A', fontWeight: 500, fontStyle: 'italic',
        }}>
          {accent}
        </em>
      </h2>
    </div>
  );
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: React.ReactNode;
  error?: string | undefined;
}
const ModalField = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, icon, error, ...rest }, ref) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        fontSize: 11, fontWeight: 500, color: '#9A7E68',
        letterSpacing: '0.10em', textTransform: 'uppercase',
        marginBottom: 7, display: 'block',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span style={{
          position: 'absolute', left: 14,
          color: error ? '#E54B4B' : '#B89F8A',
          display: 'flex', alignItems: 'center',
          pointerEvents: 'none',
        }}>
          {icon}
        </span>
        <input
          ref={ref}
          {...rest}
          style={{
            width: '100%',
            padding: '12px 14px 12px 38px',
            fontSize: 14,
            fontFamily: 'inherit',
            color: '#1A1208',
            background: '#FBF5EE',
            border: error ? '1.5px solid #E54B4B' : '1.5px solid transparent',
            borderRadius: 12,
            outline: 'none',
            transition: 'all 0.2s ease',
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
      whileHover={!isLoading ? { y: -1, boxShadow: '0 14px 32px rgba(232,98,42,0.35)' } : {}}
      whileTap={!isLoading ? { scale: 0.99 } : {}}
      style={{
        width: '100%',
        padding: '13px 20px',
        background: isLoading ? '#D9C8B8' : 'linear-gradient(135deg, #FF8B5A 0%, #E8622A 100%)',
        color: 'white',
        fontSize: 14, fontWeight: 600,
        letterSpacing: '0.01em',
        border: 'none', borderRadius: 12,
        cursor: isLoading ? 'wait' : 'pointer',
        boxShadow: isLoading ? 'none' : '0 8px 22px rgba(232,98,42,0.28)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        marginTop: 6, transition: 'all 0.2s ease',
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

function SwitchPrompt({ text, link, onClick }: { text: string; link: string; onClick: () => void }) {
  return (
    <p style={{
      textAlign: 'center', fontSize: 13,
      color: '#8A6E5C', marginTop: 22, marginBottom: 0,
    }}>
      {text}{' '}
      <button
        type="button"
        onClick={onClick}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#E8622A', fontWeight: 600, fontSize: 13,
          padding: 0, textDecoration: 'none',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
        onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
      >
        {link}
      </button>
    </p>
  );
}
