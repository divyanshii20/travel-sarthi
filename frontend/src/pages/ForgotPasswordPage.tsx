import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/auth.service';
import { useToast } from '@/hooks/useToast';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type FormData = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { success } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await authService.forgotPassword(data.email);
    setSent(true);
    success('Reset link sent! Check your email.');
  };

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle="We've sent a password reset link to your email address.">
        <p className="text-sm text-secondary mb-4">Didn't receive it? Check your spam folder.</p>
        <Link to="/login" className="btn-primary w-full text-center">Back to Sign In</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot password?" subtitle="Enter your email and we'll send a reset link">
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail size={16} />}
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" isLoading={isSubmitting} className="w-full mt-2">
          Send Reset Link
        </Button>
      </form>
      <p className="text-center text-sm text-secondary mt-5">
        <Link to="/login" className="text-saffron font-semibold hover:underline">← Back to Sign In</Link>
      </p>
    </AuthLayout>
  );
}
