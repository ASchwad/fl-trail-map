import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { RegionExplorer } from "@/components/RegionExplorer";
import { getRegion, regions } from "@/lib/regions";

interface RegionPageProps {
  params: Promise<{ region: string }>;
}

export function generateStaticParams() {
  return regions.map((region) => ({ region: region.id }));
}

export async function generateMetadata({ params }: RegionPageProps): Promise<Metadata> {
  const { region: regionId } = await params;
  const region = getRegion(regionId);
  if (!region) return {};
  return {
    title: `${region.name} Trail Map`,
    description: `${region.name} interactive trail map with up-to-date trail status`,
  };
}

export default async function RegionPage({ params }: RegionPageProps) {
  const { region: regionId } = await params;
  const region = getRegion(regionId);

  if (!region) {
    notFound();
  }

  return <RegionExplorer region={region} />;
}
