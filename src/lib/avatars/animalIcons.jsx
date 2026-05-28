/**
 * Inline SVG animal avatars for learners (offline-friendly, no external API).
 * Each icon is a simple, friendly illustration suitable for a training app.
 */

/** @typedef {{ id: string, label: string, bgClass: string, Icon: React.FC<{ className?: string }> }} AnimalAvatarDef */

function SvgWrapper({ children, className }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function LionIcon({ className }) {
  return (
    <SvgWrapper className={className}>
      <circle cx="32" cy="34" r="18" fill="#F59E0B" />
      <circle cx="32" cy="34" r="22" stroke="#D97706" strokeWidth="3" strokeDasharray="6 4" />
      <circle cx="26" cy="32" r="2" fill="#1F2937" />
      <circle cx="38" cy="32" r="2" fill="#1F2937" />
      <path d="M28 40 Q32 44 36 40" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
    </SvgWrapper>
  );
}

function ElephantIcon({ className }) {
  return (
    <SvgWrapper className={className}>
      <ellipse cx="34" cy="36" rx="20" ry="16" fill="#9CA3AF" />
      <path d="M14 36 C14 28 18 22 24 24 L24 44 C18 44 14 40 14 36Z" fill="#9CA3AF" />
      <circle cx="40" cy="30" r="2" fill="#1F2937" />
      <path d="M44 38 L48 42" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
    </SvgWrapper>
  );
}

function GiraffeIcon({ className }) {
  return (
    <SvgWrapper className={className}>
      <ellipse cx="36" cy="44" rx="10" ry="8" fill="#FBBF24" />
      <path d="M32 44 L32 18" stroke="#D97706" strokeWidth="6" strokeLinecap="round" />
      <circle cx="32" cy="16" r="8" fill="#FBBF24" />
      <circle cx="29" cy="15" r="1.5" fill="#1F2937" />
      <circle cx="35" cy="15" r="1.5" fill="#1F2937" />
      <circle cx="30" cy="28" r="2" fill="#B45309" opacity="0.6" />
      <circle cx="34" cy="34" r="2" fill="#B45309" opacity="0.6" />
    </SvgWrapper>
  );
}

function ZebraIcon({ className }) {
  return (
    <SvgWrapper className={className}>
      <ellipse cx="32" cy="38" rx="22" ry="14" fill="#F3F4F6" />
      <path d="M14 32 L50 32 M16 38 L48 38 M18 44 L46 44" stroke="#1F2937" strokeWidth="2" />
      <circle cx="42" cy="32" r="2" fill="#1F2937" />
      <path d="M48 36 L54 32 L54 40 Z" fill="#F3F4F6" stroke="#D1D5DB" />
    </SvgWrapper>
  );
}

function BirdIcon({ className }) {
  return (
    <SvgWrapper className={className}>
      <ellipse cx="30" cy="36" rx="14" ry="12" fill="#38BDF8" />
      <circle cx="38" cy="28" r="10" fill="#0EA5E9" />
      <circle cx="41" cy="27" r="2" fill="#1F2937" />
      <path d="M44 28 L52 24 L48 32 Z" fill="#F59E0B" />
      <path d="M18 36 Q8 32 12 44" stroke="#0284C7" strokeWidth="3" fill="none" strokeLinecap="round" />
    </SvgWrapper>
  );
}

function MonkeyIcon({ className }) {
  return (
    <SvgWrapper className={className}>
      <circle cx="32" cy="34" r="16" fill="#A16207" />
      <circle cx="18" cy="30" r="7" fill="#CA8A04" opacity="0.9" />
      <circle cx="46" cy="30" r="7" fill="#CA8A04" opacity="0.9" />
      <circle cx="27" cy="32" r="2" fill="#1F2937" />
      <circle cx="37" cy="32" r="2" fill="#1F2937" />
      <circle cx="32" cy="38" r="3" fill="#FDE68A" />
    </SvgWrapper>
  );
}

function TurtleIcon({ className }) {
  return (
    <SvgWrapper className={className}>
      <ellipse cx="32" cy="36" rx="20" ry="14" fill="#22C55E" />
      <path d="M20 32 L44 32 M22 38 L42 38 M24 42 L40 42" stroke="#15803D" strokeWidth="1.5" />
      <circle cx="48" cy="38" r="6" fill="#86EFAC" />
      <circle cx="50" cy="37" r="1.5" fill="#1F2937" />
    </SvgWrapper>
  );
}

function RabbitIcon({ className }) {
  return (
    <SvgWrapper className={className}>
      <ellipse cx="32" cy="40" rx="14" ry="12" fill="#F9FAFB" stroke="#E5E7EB" />
      <ellipse cx="24" cy="18" rx="5" ry="14" fill="#F9FAFB" stroke="#E5E7EB" />
      <ellipse cx="40" cy="18" rx="5" ry="14" fill="#F9FAFB" stroke="#E5E7EB" />
      <circle cx="28" cy="38" r="2" fill="#1F2937" />
      <circle cx="36" cy="38" r="2" fill="#1F2937" />
      <circle cx="32" cy="42" r="2" fill="#FDA4AF" />
    </SvgWrapper>
  );
}

function FoxIcon({ className }) {
  return (
    <SvgWrapper className={className}>
      <path d="M32 12 L20 28 L32 24 L44 28 Z" fill="#EA580C" />
      <ellipse cx="32" cy="38" rx="16" ry="14" fill="#F97316" />
      <circle cx="27" cy="36" r="2" fill="#1F2937" />
      <circle cx="37" cy="36" r="2" fill="#1F2937" />
      <circle cx="32" cy="42" r="3" fill="#FFF7ED" />
    </SvgWrapper>
  );
}

function OwlIcon({ className }) {
  return (
    <SvgWrapper className={className}>
      <ellipse cx="32" cy="36" rx="18" ry="20" fill="#78716C" />
      <circle cx="24" cy="34" r="8" fill="#FEF3C7" stroke="#57534E" strokeWidth="2" />
      <circle cx="40" cy="34" r="8" fill="#FEF3C7" stroke="#57534E" strokeWidth="2" />
      <circle cx="24" cy="34" r="3" fill="#1F2937" />
      <circle cx="40" cy="34" r="3" fill="#1F2937" />
      <path d="M32 42 L28 46 L36 46 Z" fill="#F59E0B" />
    </SvgWrapper>
  );
}

function FishIcon({ className }) {
  return (
    <SvgWrapper className={className}>
      <ellipse cx="30" cy="34" rx="18" ry="12" fill="#06B6D4" />
      <path d="M48 34 L58 26 L58 42 Z" fill="#0891B2" />
      <circle cx="22" cy="32" r="2" fill="#1F2937" />
      <path d="M18 34 Q12 30 14 38" stroke="#22D3EE" strokeWidth="2" fill="none" />
    </SvgWrapper>
  );
}

function ButterflyIcon({ className }) {
  return (
    <SvgWrapper className={className}>
      <ellipse cx="22" cy="30" rx="12" ry="16" fill="#C084FC" opacity="0.9" />
      <ellipse cx="42" cy="30" rx="12" ry="16" fill="#A855F7" opacity="0.9" />
      <ellipse cx="32" cy="38" rx="3" ry="14" fill="#4B5563" />
      <circle cx="32" cy="22" r="5" fill="#1F2937" />
    </SvgWrapper>
  );
}

/** Ordered registry — index is stable; do not reorder without a migration plan. */
export const ANIMAL_AVATARS = [
  { id: "lion", label: "Lion", bgClass: "bg-amber-100", Icon: LionIcon },
  { id: "elephant", label: "Éléphant", bgClass: "bg-gray-100", Icon: ElephantIcon },
  { id: "giraffe", label: "Girafe", bgClass: "bg-yellow-100", Icon: GiraffeIcon },
  { id: "zebra", label: "Zèbre", bgClass: "bg-slate-100", Icon: ZebraIcon },
  { id: "bird", label: "Oiseau", bgClass: "bg-sky-100", Icon: BirdIcon },
  { id: "monkey", label: "Singe", bgClass: "bg-amber-50", Icon: MonkeyIcon },
  { id: "turtle", label: "Tortue", bgClass: "bg-green-100", Icon: TurtleIcon },
  { id: "rabbit", label: "Lapin", bgClass: "bg-rose-50", Icon: RabbitIcon },
  { id: "fox", label: "Renard", bgClass: "bg-orange-100", Icon: FoxIcon },
  { id: "owl", label: "Hibou", bgClass: "bg-stone-100", Icon: OwlIcon },
  { id: "fish", label: "Poisson", bgClass: "bg-cyan-100", Icon: FishIcon },
  { id: "butterfly", label: "Papillon", bgClass: "bg-purple-100", Icon: ButterflyIcon },
];
