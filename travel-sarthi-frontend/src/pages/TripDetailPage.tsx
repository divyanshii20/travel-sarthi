import { useParams, Link } from 'react-router-dom';
import { Edit, Share2, Trash2, MapPin, Calendar } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ItineraryContainer } from '@/components/itinerary/ItineraryContainer';
import { useTripDetail, useDeleteTrip } from '@/hooks/useTrips';
import { useToast } from '@/hooks/useToast';
import { tripsService } from '@/services/trips.service';
import { useNavigate } from 'react-router-dom';

export function TripDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data: trip, isLoading, isError } = useTripDetail(id);
  const deleteTrip = useDeleteTrip();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const handleShare = async () => {
    try {
      const res = await tripsService.shareTrip(id);
      if (res.data != null) {
        await navigator.clipboard.writeText(res.data.shareUrl);
        success('Share link copied to clipboard!');
      }
    } catch {
      toastError('Failed to generate share link.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this trip? This cannot be undone.')) return;
    await deleteTrip.mutateAsync(id);
    navigate('/my-trips');
  };

  if (isLoading) return <PageLayout><FullPageSpinner /></PageLayout>;
  if (isError || trip == null) {
    return (
      <PageLayout>
        <div className="page-container py-20 text-center">
          <p className="text-4xl mb-3">❌</p>
          <h2 className="font-display font-bold text-primary text-xl">Trip not found</h2>
          <Link to="/my-trips" className="btn-primary mt-4 inline-flex">Back to My Trips</Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="page-container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-display font-bold text-primary">{trip.title}</h1>
              <Badge variant={trip.status === 'booked' ? 'teal' : 'saffron'} size="xs">{trip.status}</Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-secondary">
              <span className="flex items-center gap-1"><MapPin size={14} />{trip.destination}</span>
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {new Date(trip.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} –{' '}
                {new Date(trip.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" leftIcon={<Share2 size={15} />} onClick={() => void handleShare()}>
              Share
            </Button>
            <Link to={`/trips/${id}/edit`}>
              <Button variant="ghost" size="sm" leftIcon={<Edit size={15} />}>Edit</Button>
            </Link>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 size={15} />}
              isLoading={deleteTrip.isPending}
              onClick={() => void handleDelete()}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Itinerary */}
        {trip.itineraries.length > 0 && trip.itineraries[0] != null ? (
          <ItineraryContainer itinerary={trip.itineraries[0]} />
        ) : (
          <div className="text-center py-16 card">
            <p className="text-4xl mb-3">🗺️</p>
            <h3 className="font-display font-bold text-primary text-lg mb-2">No itinerary yet</h3>
            <p className="text-sm text-secondary mb-4">Generate an AI-powered itinerary for this trip</p>
            <Link to={`/plan?destination=${trip.destination}`} className="btn-primary inline-flex">
              Generate Itinerary
            </Link>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
