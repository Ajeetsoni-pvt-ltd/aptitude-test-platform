import { motion } from 'framer-motion';
import type { HTMLMotionProps, Variants } from 'framer-motion';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type AdminTone =
  | 'default'
  | 'cyan'
  | 'violet'
  | 'magenta'
  | 'green'
  | 'amber'
  | 'red';

const panelToneClassMap: Record<AdminTone, string> = {
  default: 'border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.45)]',
  cyan: 'admin-panel-cyan',
  violet: 'admin-panel-violet',
  magenta: 'admin-panel-magenta',
  green: 'admin-panel-green',
  amber: 'admin-panel-amber',
  red: 'admin-panel-red',
};

const badgeToneClassMap: Record<AdminTone, string> = {
  default: 'border-white/12 bg-white/6 text-white/65',
  cyan: 'border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan',
  violet: 'border-neon-violet/30 bg-neon-violet/10 text-neon-violet',
  magenta: 'border-neon-magenta/30 bg-neon-magenta/10 text-neon-magenta',
  green: 'border-neon-green/30 bg-neon-green/10 text-neon-green',
  amber: 'border-neon-amber/30 bg-neon-amber/10 text-neon-amber',
  red: 'border-neon-red/30 bg-neon-red/10 text-neon-red',
};

const metricAccentMap: Record<AdminTone, string> = {
  default: 'from-white/70 via-white/40 to-transparent text-white',
  cyan: 'from-neon-cyan via-cyan-200/80 to-transparent text-neon-cyan',
  violet: 'from-neon-violet via-fuchsia-300/80 to-transparent text-neon-violet',
  magenta: 'from-neon-magenta via-pink-300/80 to-transparent text-neon-magenta',
  green: 'from-neon-green via-emerald-300/80 to-transparent text-neon-green',
  amber: 'from-neon-amber via-yellow-200/80 to-transparent text-neon-amber',
  red: 'from-neon-red via-rose-200/80 to-transparent text-neon-red',
};

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const pageTransitionProps = {
  initial: 'hidden',
  animate: 'show',
  variants: staggerContainer,
} as const;

export function AdminPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      {...pageTransitionProps}
      className={cn('space-y-6 md:space-y-7', className)}
    >
      {children}
    </motion.div>
  );
}

export function AdminPageHeader({
  eyebrow = 'Admin Control',
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={fadeUpVariants}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between',
        className
      )}
    >
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.38em] text-white/35">{eyebrow}</p>
        <div className="space-y-2">
          <h1 className="font-orbitron text-3xl font-semibold tracking-[0.08em] text-white md:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-3xl text-sm leading-6 text-white/50 md:text-[15px]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </motion.div>
  );
}

interface AdminPanelProps extends Omit<HTMLMotionProps<'section'>, 'title'> {
  children: ReactNode;
  tone?: AdminTone;
  title?: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
  contentClassName?: string;
}

export function AdminPanel({
  children,
  tone = 'default',
  title,
  description,
  eyebrow,
  actions,
  className,
  contentClassName,
  ...props
}: AdminPanelProps) {
  return (
    <motion.section
      variants={fadeUpVariants}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn('admin-panel', panelToneClassMap[tone], className)}
      {...props}
    >
      {(title || eyebrow || description || actions) && (
        <div className="relative z-[1] flex flex-col gap-3 border-b border-white/8 px-5 pb-4 pt-5 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              {eyebrow ? (
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/35">{eyebrow}</p>
              ) : null}
              {title ? (
                <h2 className="font-orbitron text-lg font-medium tracking-[0.08em] text-white">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p className="max-w-2xl text-sm leading-6 text-white/45">{description}</p>
              ) : null}
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        </div>
      )}
      <div className={cn('relative z-[1] p-5 sm:p-6', contentClassName)}>{children}</div>
    </motion.section>
  );
}

export function AdminMetricCard({
  label,
  value,
  icon,
  tone = 'cyan',
  caption,
  trend,
  className,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone?: AdminTone;
  caption?: ReactNode;
  trend?: ReactNode;
  className?: string;
}) {
  const accent = metricAccentMap[tone];
  return (
    <motion.div
      variants={fadeUpVariants}
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'admin-panel px-5 py-5 sm:px-6',
        panelToneClassMap[tone],
        'overflow-hidden',
        className
      )}
    >
      <div className="relative z-[1] flex items-start justify-between gap-4">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/35">{label}</p>
            <div className={cn('font-orbitron text-3xl font-semibold tracking-[0.08em]', accent)}>
              {value}
            </div>
          </div>
          {caption ? <p className="text-sm text-white/45">{caption}</p> : null}
          {trend ? <div className="text-xs text-white/35">{trend}</div> : null}
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          {icon}
        </div>
      </div>
      <div
        className={cn(
          'pointer-events-none absolute -right-10 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full bg-gradient-to-br opacity-20 blur-2xl',
          accent
        )}
      />
    </motion.div>
  );
}

export function AdminStatusBadge({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode;
  tone?: AdminTone;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.24em]',
        badgeToneClassMap[tone],
        className
      )}
    >
      {children}
    </Badge>
  );
}

export function AdminEmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <motion.div
      variants={fadeUpVariants}
      className="admin-panel border-dashed border-white/12 px-6 py-12 text-center"
    >
      <div className="relative z-[1] mx-auto max-w-lg space-y-4">
        {icon ? (
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-white/10 bg-white/[0.05] text-white/55">
            {icon}
          </div>
        ) : null}
        <div className="space-y-2">
          <h3 className="font-orbitron text-lg tracking-[0.08em] text-white">{title}</h3>
          {description ? <p className="text-sm leading-6 text-white/45">{description}</p> : null}
        </div>
        {action ? <div className="flex justify-center">{action}</div> : null}
      </div>
    </motion.div>
  );
}

export function AdminToggle({
  checked,
  onChange,
  label,
  description,
  tone = 'cyan',
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  tone?: AdminTone;
}) {
  const trackClass = checked
    ? tone === 'magenta'
      ? 'bg-neon-magenta/20 border-neon-magenta/30'
      : tone === 'violet'
        ? 'bg-neon-violet/20 border-neon-violet/30'
        : tone === 'green'
          ? 'bg-neon-green/20 border-neon-green/30'
          : tone === 'amber'
            ? 'bg-neon-amber/20 border-neon-amber/30'
            : tone === 'red'
              ? 'bg-neon-red/20 border-neon-red/30'
              : 'bg-neon-cyan/20 border-neon-cyan/30'
    : 'bg-white/[0.04] border-white/10';

  const knobClass = checked
    ? tone === 'magenta'
      ? 'bg-neon-magenta shadow-[0_0_18px_rgba(255,0,170,0.45)]'
      : tone === 'violet'
        ? 'bg-neon-violet shadow-[0_0_18px_rgba(157,0,255,0.45)]'
        : tone === 'green'
          ? 'bg-neon-green shadow-[0_0_18px_rgba(0,255,136,0.45)]'
          : tone === 'amber'
            ? 'bg-neon-amber shadow-[0_0_18px_rgba(255,183,0,0.45)]'
            : tone === 'red'
              ? 'bg-neon-red shadow-[0_0_18px_rgba(255,51,102,0.45)]'
              : 'bg-neon-cyan shadow-[0_0_18px_rgba(0,245,255,0.45)]'
    : 'bg-white/55';

  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="admin-panel flex w-full items-center justify-between gap-5 px-5 py-4 text-left"
    >
      <div className="relative z-[1] space-y-1">
        <p className="font-inter text-sm font-semibold text-white">{label}</p>
        {description ? <p className="text-sm leading-6 text-white/40">{description}</p> : null}
      </div>
      <div
        className={cn(
          'relative z-[1] h-8 w-14 rounded-full border transition-colors duration-300',
          trackClass
        )}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 560, damping: 34 }}
          className={cn(
            'absolute top-1 h-6 w-6 rounded-full',
            knobClass,
            checked ? 'left-7' : 'left-1'
          )}
        />
      </div>
    </button>
  );
}
