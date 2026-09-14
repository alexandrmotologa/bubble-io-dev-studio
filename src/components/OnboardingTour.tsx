import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Database,
  Languages,
  Stethoscope,
  Keyboard,
  ArrowRight,
  ArrowLeft,
  Check,
  X
} from 'lucide-react';
import { NavigationTab } from '../types';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: NavigationTab) => void;
}

interface TourStep {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  tab?: NavigationTab;
  badge: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to Bubble.io Dev Studio',
    subtitle: 'Your professional companion environment for Bubble development',
    description: 'Connect multiple Bubble applications across version-test and version-live environments. Inspect schemas, query live data, and streamline deployments with native desktop performance.',
    icon: <Sparkles size={32} color="#fff" />,
    badge: 'Overview'
  },
  {
    title: 'Interactive Data Studio & DevOps',
    subtitle: 'Direct CRUD grid, ERD diagrams & database backups',
    description: 'Explore Bubble Data Types, build visual query filters, export SQLite/PostgreSQL scripts, run relational database seeders, and compare blueprints across environments.',
    icon: <Database size={32} color="#fff" />,
    tab: 'devops',
    badge: 'DevOps'
  },
  {
    title: 'AST Health Scorer & Dead Code Detector',
    subtitle: 'Optimize performance and eliminate orphaned code',
    description: 'Run deep static AST inspection on your .bubble blueprints. Detect dead workflows, orphaned UI elements, unused custom events, and unindexed searches with actionable cleanup recommendations.',
    icon: <Stethoscope size={32} color="#fff" />,
    tab: 'audit',
    badge: 'Quality'
  },
  {
    title: 'AI Localization Studio',
    subtitle: 'Multi-provider matrix translation for global Bubble apps',
    description: 'Translate Bubble app texts into 20+ languages simultaneously using OpenAI, Claude, Gemini, Groq, or local Ollama models with custom prompt guardrails and brand glossaries.',
    icon: <Languages size={32} color="#fff" />,
    tab: 'translator',
    badge: 'AI Studio'
  },
  {
    title: 'Command Palette & Keyboard Shortcuts',
    subtitle: 'Maximum velocity with zero friction',
    description: 'Press Ctrl+K anytime for the quick Command Palette. Jump directly between views with Ctrl+1 through Ctrl+9, open AI Copilot with Ctrl+I, or press Ctrl+/ to view all shortcuts.',
    icon: <Keyboard size={32} color="#fff" />,
    badge: 'Productivity'
  }
];

const ONBOARDING_STORAGE_KEY = 'bubble_dev_studio_onboarding_completed';

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      if (TOUR_STEPS[nextIdx].tab && onNavigate) {
        onNavigate(TOUR_STEPS[nextIdx].tab!);
      }
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      if (TOUR_STEPS[prevIdx].tab && onNavigate) {
        onNavigate(TOUR_STEPS[prevIdx].tab!);
      }
    }
  };

  const handleComplete = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      } catch (e) {
        console.warn('Failed to save onboarding state:', e);
      }
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-active)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top Banner */}
        <div
          style={{
            padding: '32px 28px 24px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.12) 100%)',
            borderBottom: '1px solid var(--border-subtle)',
            position: 'relative'
          }}
        >
          <button
            onClick={handleComplete}
            className="btn btn-ghost btn-sm"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              padding: '6px',
              color: 'var(--text-muted)'
            }}
            title="Skip Tour"
          >
            <X size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)'
              }}
            >
              {currentStep.icon}
            </div>

            <div>
              <span className="badge badge-indigo" style={{ marginBottom: '6px', display: 'inline-block' }}>
                {currentStep.badge} • Step {currentStepIndex + 1} of {TOUR_STEPS.length}
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {currentStep.title}
              </h2>
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {currentStep.subtitle}
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px 28px', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <p style={{ margin: 0 }}>
            {currentStep.description}
          </p>

          {/* Step Progress Indicators */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
            {TOUR_STEPS.map((_, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setCurrentStepIndex(idx);
                  if (TOUR_STEPS[idx].tab && onNavigate) onNavigate(TOUR_STEPS[idx].tab!);
                }}
                style={{
                  width: idx === currentStepIndex ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: idx === currentStepIndex ? 'var(--primary)' : 'var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-input)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="dont-show-tour"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              style={{ accentColor: 'var(--primary)' }}
            />
            <label htmlFor="dont-show-tour" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
              Don't show on startup
            </label>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {currentStepIndex > 0 && (
              <button onClick={handlePrev} className="btn btn-secondary btn-sm">
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            )}

            <button onClick={handleNext} className="btn btn-primary btn-sm">
              <span>{isLastStep ? 'Get Started' : 'Next'}</span>
              {isLastStep ? <Check size={14} /> : <ArrowRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
