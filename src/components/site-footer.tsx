import { Linkedin, Github, Facebook, Instagram } from "lucide-react";
import devLogo from "@/assets/qr-code.png.asset.json";

const socials = [
  { icon: Linkedin, href: "https://www.linkedin.com/in/tehreem22/", label: "LinkedIn" },
  { icon: Github, href: "https://github.com/TEHREEM-RANA", label: "GitHub" },
  { icon: Facebook, href: "https://www.facebook.com/profile.php?id=100079974231742", label: "Facebook" },
  { icon: Instagram, href: "https://www.instagram.com/tr.webstudio/", label: "Instagram" },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t bg-gradient-soft">
      <div className="mx-auto max-w-6xl px-6 py-12 grid gap-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-hero grid place-items-center text-primary-foreground font-bold shadow-brand">CG</div>
            <span className="font-display text-lg font-bold">ChallengeGrid</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-xs">
            Turn any goal into a visual grid. Check a box a day. Watch progress become inevitable.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Connect</h4>
          <div className="flex gap-3">
            {socials.map(({ icon: Icon, href, label }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}
                 className="h-10 w-10 grid place-items-center rounded-full border bg-card hover:bg-primary hover:text-primary-foreground transition-colors shadow-card">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Developer</h4>
          <div className="flex items-center gap-3">
            <a
              href="https://tehreem-rana.vercel.app/"
              target="_blank"
              rel="noreferrer"
              aria-label="Open Tehreem Rana portfolio"
              className="rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-shadow"
            >
              <img src={devLogo.url} alt="TR Web Studio" className="h-16 w-16 rounded-lg bg-card p-1 shadow-card" />
            </a>
            <div className="text-sm">
              <p className="font-medium">Tehreem Rana</p>
              <p className="text-muted-foreground">TR Web Studio</p>
              <p className="text-xs text-muted-foreground mt-1">Full-stack Developer</p>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ChallengeGrid · Built with ❤ by Tehreem Rana
      </div>
    </footer>
  );
}
