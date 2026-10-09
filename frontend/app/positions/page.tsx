import type { Metadata } from "next";
import { PositionsView } from "@/components/positions/PositionsView";

export const metadata: Metadata = {
  title: "Positions: Sorot",
  robots: { index: false },
};

export default function PositionsPage() {
  return <PositionsView />;
}
