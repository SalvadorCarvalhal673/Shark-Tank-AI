import { notFound } from "next/navigation";
import { StudioPrototype } from "@/features/studio/prototype";
import "./studio.css";

export default function StudioPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <StudioPrototype />;
}
