import { Link } from "react-router-dom";
import congoMap from "../../assets/congo-logo.png";
import { APP_BRAND_INITIAL, APP_BRAND_NAME } from "../../lib/brand";
import { AuthBrandPanel } from "./AuthBrandPanel";
import { AuthFooter } from "./AuthFooter";

export function AuthLayout({ title, subtitle, children, showFooter = true }) {
  return (
    <div className="min-h-screen flex flex-col bg-background lg:grid lg:grid-cols-2 lg:grid-rows-[1fr_auto]">
      {/* Brand panel — first on mobile, left on desktop */}
      <div className="order-1 lg:order-1 lg:row-start-1">
        <div className="lg:hidden">
          <AuthBrandPanel compact />
        </div>
        <div className="hidden lg:block lg:h-full">
          <AuthBrandPanel />
        </div>
      </div>

      {/* Form panel */}
      <div className="relative order-2 lg:order-2 lg:row-start-1 flex flex-col justify-center overflow-hidden px-5 py-8 sm:px-10 lg:px-14 xl:px-20">
        <img
          src={congoMap}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-6 -right-4 w-[min(72vw,320px)] max-w-none object-contain opacity-[0.06] select-none lg:opacity-[0.05] lg:w-[min(42vw,380px)] lg:-right-8"
        />
        <div className="relative z-10 w-full max-w-md mx-auto lg:mx-0 lg:max-w-sm xl:max-w-md">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 mb-8 lg:mb-10 group"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white font-bold text-lg shadow-sm group-hover:bg-primary-600 transition-colors">
              {APP_BRAND_INITIAL}
            </span>
            <span className="text-lg font-semibold text-text-primary tracking-tight">
              {APP_BRAND_NAME}
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-text-secondary text-sm sm:text-base leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-gray-100/80 p-6 sm:p-8">
            {children}
          </div>
        </div>
      </div>

      {/* Footer */}
      {showFooter && (
        <div className="order-3 lg:col-span-2 lg:row-start-2">
          <AuthFooter />
        </div>
      )}
    </div>
  );
}
