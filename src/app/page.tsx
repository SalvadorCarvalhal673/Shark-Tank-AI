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
          <p className="kicker"><span className="signal" /> Startup investment simulator</p>
          <h1>Make your<br /> <em>case.</em></h1>
          <p className="lede">Three investors. One pitch. Defend your numbers, negotiate your terms, and find out how your pitch holds up.</p>
          <div className="hero-actions">
            <Link href="/simulate" className="button">Enter the pitch room <ArrowRight size={19} aria-hidden /></Link>
            <a href="#panel" className="quiet-link">Meet the panel <ArrowDown size={15} aria-hidden /></a>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="room-grid" />
          <div className="room-ring ring-outer" /><div className="room-ring ring-middle" /><div className="room-ring ring-inner" />
          <div className="room-label room-top"><span /> THE PITCH ROOM</div>
          <div className="room-label room-bottom">FOUNDER <span /></div>
          <div className="seat seat-left">MC</div><div className="seat seat-middle">AV</div><div className="seat seat-right">SM</div>
          <div className="founder-dot"><span /></div>
        </div>
      </div></section>
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
