import type { PaymentMethod } from '@/types/order';

interface Option {
  value: PaymentMethod;
  label: string;
  hint: string;
  badgeClass: string;
  icon: React.ReactNode;
}

const OPTIONS: Option[] = [
  {
    value: 'Yape',
    label: 'Yape',
    hint: 'App BCP',
    badgeClass: 'bg-[#742284]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <rect x="4" y="2" width="16" height="20" rx="3" stroke="white" strokeWidth="1.6" />
        <circle cx="12" cy="17.3" r="1.1" fill="white" />
        <path d="M8 6.5h8M9 10.5l3 4 3-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: 'Plin',
    label: 'Plin',
    hint: 'Interbanco',
    badgeClass: 'bg-gradient-to-br from-[#00C4B3] to-[#5B3DF5]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <rect x="3" y="5" width="18" height="14" rx="3" stroke="white" strokeWidth="1.6" />
        <path d="M3 9.5h18" stroke="white" strokeWidth="1.6" />
        <circle cx="7" cy="14.3" r="1" fill="white" />
        <path d="M11 14.3h6" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'Transferencia',
    label: 'Transferencia',
    hint: 'Cuenta bancaria',
    badgeClass: 'bg-ink-700',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path d="M3 10l9-6 9 6M5 10v9M9 10v9M15 10v9M19 10v9M3 19h18" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

interface Props {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={selected}
            className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-3.5 text-center transition-all ${
              selected ? 'border-brand-500 bg-brand-50/60 shadow-soft' : 'border-ink-100 bg-white hover:border-ink-200'
            }`}
          >
            {selected && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-white">
                <svg viewBox="0 0 20 20" fill="none" className="h-2.5 w-2.5">
                  <path d="M4 10l4 4 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${opt.badgeClass}`}>{opt.icon}</span>
            <span>
              <span className="block text-sm font-bold text-ink-800">{opt.label}</span>
              <span className="block text-[11px] text-ink-400">{opt.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
