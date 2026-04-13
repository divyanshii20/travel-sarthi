import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Camera } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { usersService } from '@/services/users.service';
import { useToast } from '@/hooks/useToast';
import { CDN_IMAGES } from '@/constants/cdnImages';

interface ProfileForm {
  displayName: string;
  preferredCurrency: string;
}

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { success, error: toastError } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<ProfileForm>({
    defaultValues: {
      displayName: user?.displayName ?? '',
      preferredCurrency: user?.preferredCurrency ?? 'INR',
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    try {
      const res = await usersService.updateProfile(data);
      if (res.data != null) {
        updateUser(res.data);
        success('Profile updated!');
      }
    } catch {
      toastError('Failed to update profile.');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file == null) return;
    try {
      const res = await usersService.uploadAvatar(file);
      if (res.data != null) {
        updateUser({ avatarUrl: res.data.avatarUrl });
        success('Avatar updated!');
      }
    } catch {
      toastError('Failed to upload avatar.');
    }
  };

  if (user == null) return null;

  return (
    <PageLayout>
      <div className="page-container py-8 max-w-2xl">
        <h1 className="text-3xl font-display font-bold text-primary mb-8">Profile</h1>

        {/* Avatar */}
        <div className="flex items-center gap-5 mb-8">
          <div className="relative">
            <img
              src={user.avatarUrl ?? CDN_IMAGES.avatarPlaceholder}
              alt={user.displayName}
              className="w-20 h-20 rounded-full object-cover"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-saffron text-white flex items-center justify-center shadow-sm"
            >
              <Camera size={13} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handleAvatarChange(e)}
            />
          </div>
          <div>
            <p className="font-display font-bold text-primary text-xl">{user.displayName}</p>
            <p className="text-sm text-muted">{user.email}</p>
          </div>
        </div>

        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex flex-col gap-4">
          <Input label="Display Name" {...register('displayName')} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-primary">Preferred Currency</label>
            <select className="input-base" {...register('preferredCurrency')}>
              <option value="INR">INR – Indian Rupee</option>
              <option value="USD">USD – US Dollar</option>
              <option value="EUR">EUR – Euro</option>
              <option value="GBP">GBP – British Pound</option>
            </select>
          </div>
          <Button type="submit" isLoading={isSubmitting} className="w-full mt-2">
            Save Changes
          </Button>
        </form>

        {/* Voyage Coins */}
        <div className="card p-5 mt-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center text-white font-display font-bold text-xl">
            ✦
          </div>
          <div>
            <p className="text-xs text-muted">Voyage Coins Balance</p>
            <p className="text-2xl font-display font-bold text-primary">
              {user.voyageCoinBalance.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
