import { Header } from "@/components/header";
import { PitchForm } from "@/features/simulation/pitch-form";

export default function Simulate() {
  return (
    <>
      <Header />
      <main className="shell form-page">
        <div className="form-intro"><h1>The pitch room.</h1></div>
        <PitchForm />
      </main>
    </>
  );
}
