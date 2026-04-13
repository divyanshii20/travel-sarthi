import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/auth.service';
import { useToast } from '@/hooks/useToast';

const schema = z.object({
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Uppercase required')
    .regex(/[0-9]/, 'Number required')
    .regex(/[^A-Za-z0-9]/, 'Special character required'),
});

type FormData = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const res = await authService.resetPassword(token, data.password);
    if (res.error != null) {
      toastError(res.error.message);
    } else {
      success('Password reset! Please sign in.');
      navigate('/login');
    }
  };

  return (
    <AuthLayout title="Set new password">
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex flex-col gap-4">
        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock size={16} />}
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" isLoading={isSubmitting} className="w-full mt-2">
          Reset Password
        </Button>
      </form>
    </AuthLayout>
  );
}
