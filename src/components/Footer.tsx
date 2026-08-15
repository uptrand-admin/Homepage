import Image from "next/image";
import { Icon } from "@/components/Icon";
import { site, socials } from "@/data/content";
import { asset } from "@/lib/asset";

export function Footer() {
  return (
    <footer className="bg-title px-5 pt-15 pb-10 text-slate-400 sm:px-8">
      <div className="mx-auto flex max-w-[1140px] flex-col items-center gap-8 sm:flex-row sm:justify-between">
        <div className="text-center sm:text-left">
          <Image
            src={asset("/images/logo-dark.png")}
            alt={site.name}
            width={1600}
            height={448}
            className="mx-auto mb-4 h-8 w-auto opacity-90 sm:mx-0"
          />
          <p className="text-[0.95rem]">{site.tagline}</p>
        </div>

        <ul className="flex gap-4">
          {socials.map((social) => (
            <li key={social.label}>
              <a
                href={social.href}
                aria-label={social.label}
                target={social.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="grid size-11 place-items-center rounded-full border border-white/10 bg-white/5 text-white transition-all hover:-translate-y-1 hover:border-orange hover:bg-orange"
              >
                <Icon name={social.icon} className="size-5" />
              </a>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-10 text-center font-display text-[0.85rem] opacity-50">
        © {new Date().getFullYear()} {site.fullName}. ALL RIGHTS RESERVED.
      </p>
    </footer>
  );
}
