import Link from "next/link";
import { Mountain, MapPin, ArrowRight } from "lucide-react";
import { regions } from "@/lib/regions";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-200 px-4 py-12">
      <div className="flex items-center gap-3 mb-2">
        <Mountain className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Trail Map</h1>
      </div>
      <p className="text-muted-foreground mb-10 text-center">
        Interactive MTB trail maps with live trail status
      </p>

      <div className="grid gap-4 w-full max-w-3xl md:grid-cols-3">
        {regions.map((region) => (
          <Link
            key={region.id}
            href={`/${region.id}`}
            className="group bg-white border rounded-xl shadow-sm p-5 flex flex-col gap-2 hover:shadow-md hover:border-primary/40 transition-all"
          >
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {region.location}
            </div>
            <h2 className="text-lg font-semibold">{region.name}</h2>
            <p className="text-sm text-muted-foreground flex-1">
              {region.description}
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-2">
              Open map
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
