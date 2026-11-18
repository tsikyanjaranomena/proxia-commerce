import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { Maki } from './brand/Maki.jsx';
import { BRAND, HQ } from '../data/config.js';
import { OPERATORS } from '../data/operators.js';
import { OperatorLogo } from './ui/OperatorLogo.jsx';

export function Footer({ navigate }) {
  return (
    <footer className="mt-20 bg-brand-deep text-white/80">
      <div className="mx-auto grid w-full max-w-[1600px] gap-8 px-4 py-10 text-sm sm:grid-cols-3 sm:px-6 lg:px-10">
        <div>
          <p className="font-display flex items-center gap-2.5 text-2xl font-semibold text-white">
            <span className="hover-flip grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-butter p-1">
              <Maki headOnly className="h-full w-full" />
            </span>
            {BRAND}
          </p>
          <p className="mt-3 max-w-xs text-white/70">E-commerce et livraison express, uniquement à Antananarivo.</p>
          <div className="mt-4 flex gap-2">
            {Object.values(OPERATORS).map((op) => (
              <OperatorLogo key={op.id} op={op} className="h-8 w-8 text-[10px]" />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-display text-lg font-semibold text-white">Siège social</p>
          <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {HQ.address}</p>
          <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> {HQ.phone}</p>
          <p className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /> {HQ.email}</p>
        </div>

        <div className="space-y-2">
          <p className="font-display text-lg font-semibold text-white">Horaires</p>
          {HQ.hours.map(([d, h]) => (
            <p key={d} className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0" /> {d} : {h}</p>
          ))}
          <button onClick={() => navigate('support')} className="block pt-1 font-bold text-sun hover:underline">
            Support, réclamations & mentions légales →
          </button>
          <button onClick={() => navigate('rider')} className="block text-white/55 hover:underline">
            Espace livreur →
          </button>
        </div>
      </div>
      <p className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {BRAND} SARL · Misaotra ! · Prix en Ariary (MGA) TTC · Cartes © OpenStreetMap
      </p>
    </footer>
  );
}
