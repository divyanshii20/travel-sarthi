import { PageLayout } from '@/components/layout/PageLayout';
import { HeroSection } from '@/components/home/HeroSection';
import { ModeSelector } from '@/components/home/ModeSelector';
import { ModeAForm } from '@/components/search/ModeAForm';
import { ModeBForm } from '@/components/search/ModeBForm';
import { HowItWorks } from '@/components/home/HowItWorks';
import { DestinationGrid } from '@/components/home/DestinationGrid';
import { SavingsProof } from '@/components/home/SavingsProof';
import { useSearchStore } from '@/store/searchStore';

export function HomePage() {
  const mode = useSearchStore((s) => s.mode);

  return (
    <PageLayout noPadding>
      <HeroSection />

      {/* Search panel */}
      <section className="bg-white border-y border-card py-8">
        <div className="page-container flex flex-col gap-5">
          <ModeSelector />
          {mode === 'A' ? <ModeAForm /> : <ModeBForm />}
        </div>
      </section>

      <HowItWorks />
      <DestinationGrid />
      <SavingsProof />
    </PageLayout>
  );
}
