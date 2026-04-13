import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { extractApiError } from '@/services/api';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  totpCode: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const { error: toastError } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const loginData = data.totpCode !== undefined
        ? { email: data.email, password: data.password, totpCode: data.totpCode }
        : { email: data.email, password: data.password };
      const res = await login(loginData);
      if (res.error != null) {
        toastError(res.error.message);
      }
    } catch (err) {
      toastError(extractApiError(err));
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your Travel Sarthi account">
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail size={16} />}
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock size={16} />}
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-saffron hover:underline font-semibold">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" isLoading={isSubmitting} className="w-full mt-2">
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-secondary mt-5">
        Don't have an account?{' '}
        <Link to="/register" className="text-saffron font-semibold hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
