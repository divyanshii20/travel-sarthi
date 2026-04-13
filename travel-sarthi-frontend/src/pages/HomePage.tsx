import { PageLayout } from '@/components/layout/PageLayout';
import { HeroSection } from '@/components/home/HeroSection';
import { HowItWorks } from '@/components/home/HowItWorks';
import { DestinationGrid } from '@/components/home/DestinationGrid';
import { SavingsProof } from '@/components/home/SavingsProof';

export function HomePage() {
  return (
    <PageLayout noPadding>
      <HeroSection />
      <HowItWorks />
      <DestinationGrid />
      <SavingsProof />
    </PageLayout>
  );
}
