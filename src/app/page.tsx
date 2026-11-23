import Link from "next/link";
import { ArrowDown, ArrowRight, BarChart3, Compass, Lightbulb } from "lucide-react";
import { Header } from "@/components/header";

import { panel } from "@/features/simulation/panel";

const panelIcons = [BarChart3, Compass, Lightbulb];

export default function Home() {
  return <>
    <Header />
    <main>
      <section className="hero"><div className="shell hero-inner">
        <div className="hero-copy">
          <p className="kicker"><span className="signal" /> Fictional investment episode</p>
          <h1>Take your seat.<br /> <em>Make your case.</em></h1>
          <p className="lede">Pitch your business, defend your numbers, and negotiate with three fictional investors. The room is ready when you are.</p>
          <div className="hero-actions">
            <Link href="/simulate" className="button">Enter the pitch room <ArrowRight size={19} aria-hidden /></Link>
            <a href="#panel" className="quiet-link">Meet the panel <ArrowDown size={15} aria-hidden /></a>
          </div>
        </div>
        <div className="hero-visual" aria-label="Illustrated pitch room with three investor seats and a founder position" role="img">
          <div className="room-grid" />
          <div className="room-ring ring-outer" /><div className="room-ring ring-middle" /><div className="room-ring ring-inner" />
          <div className="room-label room-top"><span /> THE PITCH ROOM</div>
          <div className="room-label room-bottom">FOUNDER <span /></div>
          <div className="seat seat-left">MC</div><div className="seat seat-middle">AV</div><div className="seat seat-right">SM</div>
          <div className="founder-dot"><span /></div>
        </div>
      </div></section>
      <section className="episode-preview shell" aria-labelledby="episode-preview-title">
        <div className="section-heading"><div><p className="kicker">Your episode</p><h2 id="episode-preview-title">Pitch. Defend. Negotiate.</h2></div><p>Start with a clear premise, then make each decision yourself. The interactive room loads only after you enter.</p></div>
        <ol className="episode-steps">
          <li><span className="step-number">01</span><strong>Bring your business</strong><p>Share the idea, funding ask, and ownership you want to protect.</p></li>
          <li><span className="step-number">02</span><strong>Answer the panel</strong><p>Respond to finance, growth, and operations questions in order.</p></li>
          <li><span className="step-number">03</span><strong>Choose your terms</strong><p>Compare offers, negotiate, and confirm the outcome that fits.</p></li>
        </ol>
      </section>
      <section id="panel" className="panel-section shell">
        <div className="section-heading"><div><p className="kicker">The panel</p><h2>Three ways to see a deal.</h2></div><p>Each investor tests a different part of your business.</p></div>
        <div className="panel-grid">{panel.map(({ name, role, description }, index) => { const Icon = panelIcons[index]; return <article key={name} className="panel-card">
          <div className="role"><Icon size={18} aria-hidden /> {role}</div><h3>{name}</h3><p>{description}</p>
        </article>; })}</div>
      </section>
    </main>
    <footer className="shell site-footer"><span>Shark Tank AI</span><span>University programming project</span></footer>
  </>;
}
