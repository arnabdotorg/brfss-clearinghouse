// app/pivot/page.js
import nextDynamic from "next/dynamic";

// Tell Next not to statically generate this page (avoids running react-pivottable on the server)
export const dynamic = "force-dynamic";
export const revalidate = 0;

const PivotClient = nextDynamic(() => import("./PivotClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-stone-600">Loading pivot UI…</p>
    </div>
  ),
});

export default function PivotPage() {
  return <PivotClient />;
}
