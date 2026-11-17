import { Header } from "@/components/header";
import { PitchForm } from "@/features/simulation/pitch-form";

export default function Simulate() {
  return <><Header /><main className="shell form-page">
    <div className="form-intro"><p className="kicker"><span className="signal" /> The pitch room</p><h1>Prepare your pitch.</h1><p className="lede">Tell the panel what you’re building, who needs it, and what you’re asking for.</p></div>
    <PitchForm />
  </main></>;
}
