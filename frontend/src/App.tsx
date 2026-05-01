import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { ToastContainer } from '@/components/ui/Toast';
import { SarthiFAB } from '@/components/sarthi/SarthiFAB';
import { SarthiChatPanel } from '@/components/sarthi/SarthiChatPanel';
import { AuthModal } from '@/components/auth/AuthModal';

export function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
      <SarthiFAB />
      <SarthiChatPanel />
      <AuthModal />
    </>
  );
}
