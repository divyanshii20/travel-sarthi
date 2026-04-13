import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { ToastContainer } from '@/components/ui/Toast';
import { SarthiFAB } from '@/components/sarthi/SarthiFAB';
import { SarthiChatPanel } from '@/components/sarthi/SarthiChatPanel';

export function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
      <SarthiFAB />
      <SarthiChatPanel />
    </>
  );
}
