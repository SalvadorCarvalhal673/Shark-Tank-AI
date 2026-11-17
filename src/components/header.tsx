import Link from "next/link";
import { ArrowUpRight, Waves } from "lucide-react";

export function Header() {
  return <header className="site-header"><div className="shell header-inner">
    <Link className="brand" href="/"><Waves size={24} aria-hidden /> Shark Tank <span>AI</span></Link>
    <nav aria-label="Main navigation"><Link href="/#panel">The panel</Link><Link className="nav-start" href="/simulate">Pitch room <ArrowUpRight size={15} aria-hidden /></Link></nav>
  </div></header>;
}
