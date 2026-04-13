import { useState } from 'react';
import { Bell, BellOff, Trash2, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { flightsService } from '@/services/flights.service';
import { useToast } from '@/hooks/useToast';

export function FareAlertsPage() {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    origin: '',
    destination: '',
    targetPrice: '',
    departDateFrom: '',
    departDateTo: '',
  });

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const res = await flightsService.getAlerts();
      if (res.error != null) throw new Error(res.error.message);
      return res.data;
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => flightsService.deleteAlert(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['alerts'] }); success('Alert deleted'); },
  });

  const toggleMut = useMutation({
    mutationFn: (id: string) => flightsService.toggleAlert(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const createMut = useMutation({
    mutationFn: () =>
      flightsService.createAlert({
        origin: form.origin.toUpperCase(),
        destination: form.destination.toUpperCase(),
        targetPrice: Number(form.targetPrice),
        currency: 'INR',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['alerts'] });
      setIsCreateOpen(false);
      success('Alert created!');
    },
    onError: () => toastError('Failed to create alert.'),
  });

  return (
    <PageLayout>
      <div className="page-container py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-display font-bold text-primary">Fare Alerts</h1>
          <Button leftIcon={<Plus size={16} />} onClick={() => setIsCreateOpen(true)}>
            New Alert
          </Button>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} height="72px" />)}
          </div>
        )}

        {alerts != null && alerts.length === 0 && (
          <div className="text-center py-16">
            <Bell size={40} className="text-muted mx-auto mb-3" />
            <p className="font-semibold text-primary mb-1">No alerts set</p>
            <p className="text-sm text-muted">Get notified when fares drop to your target price</p>
          </div>
        )}

        {alerts != null && alerts.length > 0 && (
          <div className="flex flex-col gap-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="card p-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-primary">
                    {alert.origin} → {alert.destination}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    Target: ₹{alert.targetPrice.amount.toLocaleString('en-IN')} · {alert.cabinClass}
                  </p>
                </div>
                <Badge variant={alert.isActive ? 'teal' : 'muted'} size="xs">
                  {alert.isActive ? 'Active' : 'Paused'}
                </Badge>
                <button
                  onClick={() => toggleMut.mutate(alert.id)}
                  className="p-2 rounded-lg hover:bg-card transition-colors text-muted hover:text-primary"
                >
                  {alert.isActive ? <BellOff size={16} /> : <Bell size={16} />}
                </button>
                <button
                  onClick={() => deleteMut.mutate(alert.id)}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors text-muted hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Fare Alert">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="From"
                placeholder="DEL"
                value={form.origin}
                onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
              />
              <Input
                label="To"
                placeholder="GOI"
                value={form.destination}
                onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
              />
            </div>
            <Input
              label="Target Price (₹)"
              type="number"
              placeholder="5000"
              value={form.targetPrice}
              onChange={(e) => setForm((f) => ({ ...f, targetPrice: e.target.value }))}
            />
            <Button
              onClick={() => createMut.mutate()}
              isLoading={createMut.isPending}
              className="w-full"
            >
              Create Alert
            </Button>
          </div>
        </Modal>
      </div>
    </PageLayout>
  );
}
