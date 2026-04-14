import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { FullPageSpinner } from '@/components/ui/Spinner';

// Eagerly loaded (critical path)
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';

// Lazy loaded
const PlanPage = lazy(() => import('@/pages/PlanPage').then((m) => ({ default: m.PlanPage })));
const DiscoverPage = lazy(() => import('@/pages/DiscoverPage').then((m) => ({ default: m.DiscoverPage })));
const ItineraryPage = lazy(() => import('@/pages/ItineraryPage').then((m) => ({ default: m.ItineraryPage })));
const DealsPage = lazy(() => import('@/pages/DealsPage').then((m) => ({ default: m.DealsPage })));
const MyTripsPage = lazy(() => import('@/pages/MyTripsPage').then((m) => ({ default: m.MyTripsPage })));
const TripDetailPage = lazy(() => import('@/pages/TripDetailPage').then((m) => ({ default: m.TripDetailPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const FareAlertsPage = lazy(() => import('@/pages/FareAlertsPage').then((m) => ({ default: m.FareAlertsPage })));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const VerifyEmailPage = lazy(() => import('@/pages/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })));

function LazyWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<FullPageSpinner />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/forgot-password',
    element: <LazyWrapper><ForgotPasswordPage /></LazyWrapper>,
  },
  {
    path: '/reset-password',
    element: <LazyWrapper><ResetPasswordPage /></LazyWrapper>,
  },
  {
    path: '/verify-email',
    element: <LazyWrapper><VerifyEmailPage /></LazyWrapper>,
  },
  {
    path: '/plan',
    element: <LazyWrapper><PlanPage /></LazyWrapper>,
  },
  {
    path: '/plan-trip',
    element: <LazyWrapper><PlanPage /></LazyWrapper>,
  },
  {
    path: '/plan/flights',
    element: <LazyWrapper><PlanPage /></LazyWrapper>,
  },
  {
    path: '/itinerary/:id',
    element: (
      <ProtectedRoute>
        <LazyWrapper><ItineraryPage /></LazyWrapper>
      </ProtectedRoute>
    ),
  },
  {
    path: '/discover',
    element: <LazyWrapper><DiscoverPage /></LazyWrapper>,
  },
  {
    path: '/discover/:slug',
    element: <LazyWrapper><DiscoverPage /></LazyWrapper>,
  },
  {
    path: '/deals',
    element: <LazyWrapper><DealsPage /></LazyWrapper>,
  },
  {
    path: '/my-trips',
    element: (
      <ProtectedRoute>
        <LazyWrapper><MyTripsPage /></LazyWrapper>
      </ProtectedRoute>
    ),
  },
  {
    path: '/trips/:id',
    element: (
      <ProtectedRoute>
        <LazyWrapper><TripDetailPage /></LazyWrapper>
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <LazyWrapper><ProfilePage /></LazyWrapper>
      </ProtectedRoute>
    ),
  },
  {
    path: '/fare-alerts',
    element: (
      <ProtectedRoute>
        <LazyWrapper><FareAlertsPage /></LazyWrapper>
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: (
      <div className="min-h-screen flex items-center justify-center bg-page text-center">
        <div>
          <p className="text-6xl mb-4">404</p>
          <h1 className="font-display font-bold text-primary text-2xl mb-2">Page not found</h1>
          <a href="/" className="btn-primary inline-flex mt-4">Go Home</a>
        </div>
      </div>
    ),
  },
]);
