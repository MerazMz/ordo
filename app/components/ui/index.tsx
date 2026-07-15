'use client';

import React from 'react';
import { cn } from '@/app/lib/utils';

// ============================================
// Button
// ============================================

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--accent)] text-[var(--text-inverse)] hover:bg-[var(--accent-hover)] active:scale-[0.98]',
  secondary:
    'bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--surface-hover)] active:bg-[var(--surface-active)]',
  ghost:
    'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
  danger:
    'bg-[var(--error)] text-white hover:opacity-90 active:scale-[0.98]',
  outline:
    'border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[15px] gap-2.5 rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium',
        'transition-all duration-[var(--duration-fast)] ease-[var(--ease-default)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'select-none cursor-pointer',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
      {children}
      {iconRight}
    </button>
  );
}

// ============================================
// Card
// ============================================

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({
  hover = false,
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)]',
        'shadow-[var(--shadow-card)]',
        'transition-all duration-[var(--duration-normal)] ease-[var(--ease-default)]',
        hover && 'hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 cursor-pointer',
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================
// Badge
// ============================================

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

const badgeVariantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--surface-hover)] text-[var(--text-secondary)]',
  success: 'bg-[var(--success-bg)] text-[var(--success)]',
  warning: 'bg-[var(--warning-bg)] text-[var(--warning)]',
  error: 'bg-[var(--error-bg)] text-[var(--error)]',
  info: 'bg-[var(--info-bg)] text-[var(--info)]',
};

export function Badge({ children, variant = 'default', dot = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        badgeVariantStyles[variant],
        className
      )}
    >
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          variant === 'success' && 'bg-[var(--success)]',
          variant === 'warning' && 'bg-[var(--warning)]',
          variant === 'error' && 'bg-[var(--error)]',
          variant === 'info' && 'bg-[var(--info)]',
          variant === 'default' && 'bg-[var(--text-muted)]',
        )} />
      )}
      {children}
    </span>
  );
}

// ============================================
// Input
// ============================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export function Input({
  label,
  error,
  icon,
  iconRight,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full h-10 px-3 text-sm rounded-xl',
            'bg-[var(--surface)] border border-[var(--border)]',
            'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
            'transition-all duration-[var(--duration-fast)]',
            'focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]',
            'hover:border-[var(--border-strong)]',
            icon ? 'pl-10' : '',
            iconRight ? 'pr-10' : '',
            error ? 'border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error)]' : '',
            className
          )}
          {...props}
        />
        {iconRight && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            {iconRight}
          </span>
        )}
      </div>
      {error && (
        <p className="text-xs text-[var(--error)]">{error}</p>
      )}
    </div>
  );
}

// ============================================
// Avatar
// ============================================

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const avatarSizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          'rounded-full object-cover',
          avatarSizes[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-medium',
        'bg-[var(--accent-subtle)] text-[var(--text-secondary)]',
        avatarSizes[size],
        className
      )}
    >
      {initials}
    </div>
  );
}

// ============================================
// Toggle
// ============================================

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Toggle({ checked, onChange, label, disabled = false, className }: ToggleProps) {
  return (
    <label className={cn('inline-flex items-center gap-2.5 cursor-pointer select-none', disabled && 'opacity-50 cursor-not-allowed', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative w-10 h-[22px] rounded-full transition-colors duration-[var(--duration-fast)]',
          checked ? 'bg-[var(--accent)]' : 'bg-[var(--border-strong)]'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white',
            'transition-transform duration-[var(--duration-fast)] ease-[var(--ease-spring)]',
            'shadow-sm',
            checked && 'translate-x-[18px]'
          )}
        />
      </button>
      {label && (
        <span className="text-sm text-[var(--text-primary)]">{label}</span>
      )}
    </label>
  );
}

// ============================================
// Tabs
// ============================================

interface TabsProps {
  tabs: { id: string; label: string; count?: number }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex items-center gap-1 p-1 bg-[var(--surface-hover)] rounded-xl', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-3.5 py-1.5 text-sm font-medium rounded-lg',
            'transition-all duration-[var(--duration-fast)]',
            'cursor-pointer',
            activeTab === tab.id
              ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              'ml-1.5 px-1.5 py-0.5 text-[11px] rounded-md',
              activeTab === tab.id
                ? 'bg-[var(--accent)] text-[var(--text-inverse)]'
                : 'bg-[var(--border)] text-[var(--text-muted)]'
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ============================================
// StatCard
// ============================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-[var(--text-muted)] font-medium">{title}</p>
          <p className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              'inline-flex items-center gap-1 text-xs font-medium',
              trend.value >= 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'
            )}>
              <span>{trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              <span className="text-[var(--text-muted)]">{trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--accent-subtle)] text-[var(--text-secondary)]">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

// ============================================
// Skeleton
// ============================================

interface SkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export function Skeleton({ className, rounded = 'md' }: SkeletonProps) {
  const radiusClass = {
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full',
  };

  return (
    <div
      className={cn(
        'animate-shimmer',
        radiusClass[rounded],
        className
      )}
    />
  );
}

// ============================================
// Progress Stepper (Order Tracking)
// ============================================

interface Step {
  id: string;
  label: string;
  description?: string;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: string;
  className?: string;
}

export function ProgressStepper({ steps, currentStep, className }: ProgressStepperProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className={cn('space-y-0', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex || (currentStep === steps[steps.length - 1].id && index === currentIndex);
        const isCurrent = index === currentIndex && currentStep !== steps[steps.length - 1].id;

        return (
          <div key={step.id} className="flex items-start gap-3">
            {/* Connector + Circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold',
                  'transition-all duration-[var(--duration-slow)]',
                  isCompleted && 'bg-[var(--accent)] text-[var(--text-inverse)]',
                  isCurrent && 'bg-[var(--accent)] text-[var(--text-inverse)] ring-4 ring-[var(--accent-subtle)]',
                  !isCompleted && !isCurrent && 'bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)]'
                )}
              >
                {isCompleted ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 h-10',
                    'transition-colors duration-[var(--duration-slow)]',
                    index < currentIndex ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                  )}
                />
              )}
            </div>
            {/* Label */}
            <div className="pt-1 pb-6">
              <p className={cn(
                'text-sm font-medium',
                (isCompleted || isCurrent) ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
              )}>
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{step.description}</p>
              )}
              {isCurrent && (
                <span className="inline-flex items-center gap-1.5 mt-1.5 text-xs text-[var(--accent)] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse-soft" />
                  In progress
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// Empty State
// ============================================

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-[var(--surface-hover)] flex items-center justify-center text-[var(--text-muted)] mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--text-muted)] max-w-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}
