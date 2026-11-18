import { ArrowUp, ArrowUpLeft, ArrowUpRight, CornerUpLeft, CornerUpRight, Flag, Navigation, RotateCw, Undo2 } from 'lucide-react';

export function ManeuverIcon({ step, className }) {
  if (!step) return <Navigation className={className} />;
  if (step.type === 'arrive') return <Flag className={className} />;
  if (step.type === 'depart') return <Navigation className={className} />;
  if (step.type?.includes('roundabout') || step.type?.includes('rotary')) return <RotateCw className={className} />;
  switch (step.modifier) {
    case 'uturn': return <Undo2 className={className} />;
    case 'left':
    case 'sharp left': return <CornerUpLeft className={className} />;
    case 'right':
    case 'sharp right': return <CornerUpRight className={className} />;
    case 'slight left': return <ArrowUpLeft className={className} />;
    case 'slight right': return <ArrowUpRight className={className} />;
    default: return <ArrowUp className={className} />;
  }
}
