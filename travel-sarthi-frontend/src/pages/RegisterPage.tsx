import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { extractApiError } from '@/services/api';

const schema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const { error: toastError, success } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await registerUser(data);
      if (res.error != null) {
        toastError(res.error.message);
      } else {
        success('Welcome to Travel Sarthi! 🎉');
      }
    } catch (err) {
      toastError(extractApiError(err));
    }
  };

  return (
    <AuthLayout title="Create account" subtitle="Join 4 lakh+ smart Indian travelers">
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex flex-col gap-4">
        <Input
          label="Full Name"
          placeholder="Riya Sharma"
          leftIcon={<User size={16} />}
          error={errors.displayName?.message}
          {...register('displayName')}
        />
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
        <Button type="submit" isLoading={isSubmitting} className="w-full mt-2">
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-secondary mt-5">
        Already have an account?{' '}
        <Link to="/login" className="text-saffron font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
