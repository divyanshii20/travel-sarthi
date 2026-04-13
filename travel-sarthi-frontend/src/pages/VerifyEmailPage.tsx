import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { Spinner } from '@/components/ui/Spinner';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (token.length === 0) { setStatus('error'); return; }
    authService.verifyEmail(token)
      .then((res) => setStatus(res.error == null ? 'success' : 'error'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-page">
      <div className="text-center">
        {status === 'loading' && <Spinner size="lg" />}
        {status === 'success' && (
          <>
            <p className="text-4xl mb-3">✅</p>
            <h2 className="font-display font-bold text-primary text-xl mb-2">Email verified!</h2>
            <p className="text-secondary mb-4">Your account is now fully activated.</p>
            <Link to="/" className="btn-primary inline-flex">Go Home</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-4xl mb-3">❌</p>
            <h2 className="font-display font-bold text-primary text-xl mb-2">Invalid or expired link</h2>
            <p className="text-secondary mb-4">Please request a new verification email.</p>
            <Link to="/login" className="btn-primary inline-flex">Sign In</Link>
          </>
        )}
      </div>
    </div>
  );
}
