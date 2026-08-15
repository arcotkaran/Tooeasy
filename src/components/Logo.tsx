import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-baseline gap-[0.3rem] ${className}`}
      aria-label="Too Easy home"
    >
      <span className="display text-[1.35rem] leading-none tracking-[-0.045em]">
        TOO
      </span>
      <span className="display text-[1.35rem] leading-none tracking-[-0.045em] text-brand">
        EASY
      </span>
      <span
        aria-hidden
        className="mb-[2px] h-[6px] w-[6px] rounded-full bg-brand transition-transform duration-300 group-hover:scale-150"
      />
    </Link>
  );
}
