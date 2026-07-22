import { useState, type ReactNode } from 'react';

// Neutral panels use the default tone; "rose" marks a warning panel such as a
// stall explanation, so it reads as a callout while still folding away.
const toneClasses = {
    default: {
        shell: 'border-slate-300 bg-[#fbfcfd] dark:border-slate-700 dark:bg-slate-900/60',
        divider: 'border-slate-200 dark:border-slate-800',
        chevron: 'text-slate-400 dark:text-slate-500',
        title: 'text-slate-950 dark:text-slate-100',
        subtitle: 'text-slate-500 dark:text-slate-400',
    },
    rose: {
        shell: 'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40',
        divider: 'border-rose-200 dark:border-rose-900',
        chevron: 'text-rose-400 dark:text-rose-400',
        title: 'text-rose-900 dark:text-rose-200',
        subtitle: 'text-rose-600 dark:text-rose-300',
    },
} as const;

// A panel that can be folded away to reduce clutter. The header stays visible
// when collapsed, so the `meta` badge still reports the panel's state.
export default function CollapsibleSection({
    id,
    title,
    subtitle,
    meta,
    defaultOpen = true,
    openWhen,
    tone = 'default',
    className = '',
    children,
}: {
    id: string;
    title: string;
    subtitle?: string;
    meta?: ReactNode;
    defaultOpen?: boolean;
    // When this value changes to something set, the panel opens itself — used
    // where an action elsewhere (picking a datapath component) fills the panel.
    openWhen?: string | number | null;
    tone?: keyof typeof toneClasses;
    className?: string;
    children: ReactNode;
}) {
    // Deliberately not persisted: a stored value silently outranks the
    // default, so a panel meant to open would stay shut for anyone who had
    // used an earlier build. The default decides how the page opens; folding
    // a panel lasts for the visit.
    const [open, setOpen] = useState(defaultOpen);
    const styles = toneClasses[tone];

    // Adjusting state while rendering, rather than in an effect: when the
    // watched value changes to something set, the panel opens itself.
    const [seenOpenWhen, setSeenOpenWhen] = useState(openWhen);
    if (openWhen !== seenOpenWhen) {
        setSeenOpenWhen(openWhen);
        if (openWhen !== null && openWhen !== undefined && !open) {
            setOpen(true);
        }
    }

    return (
        <section
            id={id}
            className={`rounded-lg border shadow-sm ${styles.shell} ${className}`}
        >
            <div
                className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 ${
                    open ? `border-b ${styles.divider}` : ''
                }`}
            >
                <button
                    type="button"
                    onClick={() => setOpen(!open)}
                    aria-expanded={open}
                    className="flex items-center gap-2 text-left"
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                            styles.chevron
                        } ${open ? 'rotate-90' : ''}`}
                    >
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                    <span>
                        <span
                            className={`block text-sm font-semibold ${styles.title}`}
                        >
                            {title}
                        </span>
                        {subtitle !== undefined && (
                            <span
                                className={`block text-xs ${styles.subtitle}`}
                            >
                                {subtitle}
                            </span>
                        )}
                    </span>
                </button>
                {meta !== undefined && (
                    // Using a control in the header (Edit, Reset, a format
                    // toggle) on a folded panel opens it, so the result of the
                    // click is visible. The control still runs its own action.
                    <div
                        onClickCapture={() => {
                            if (!open) {
                                setOpen(true);
                            }
                        }}
                    >
                        {meta}
                    </div>
                )}
            </div>
            {open && children}
        </section>
    );
}
