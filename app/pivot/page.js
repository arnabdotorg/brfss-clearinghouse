// app/pivot/page.js
import nextDynamic from "next/dynamic";

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
