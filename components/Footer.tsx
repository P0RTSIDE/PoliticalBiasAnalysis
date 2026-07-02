import Link from "next/link";
import { isLiveData } from "@/lib/utils";

export function Footer() {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="font-mono text-xs uppercase tracking-wider text-text-secondary">
            Blindspot Tracker
          </p>
          <p className="text-xs text-text-secondary">
            {isLiveData
              ? "Showing live coverage data. See the "
              : "Data is illustrative and for demonstration only. See the "}
            <Link href="/about" className="text-highlight hover:underline">
              methodology
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-4 font-mono text-xs uppercase tracking-wider text-text-secondary">
          <Link href="/about" className="hover:text-text-primary">
            About
          </Link>
        </div>
      </div>
    </footer>
  );
}
