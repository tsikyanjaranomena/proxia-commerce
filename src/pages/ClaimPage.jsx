import { Building2, ChevronDown, ClipboardList, Info, LogOut, Mail, MessageCircle, Navigation, Phone, ShieldCheck, TriangleAlert } from 'lucide-react';
import { ClaimForm } from '../components/ClaimForm.jsx';
import { LoginPrompt } from '../components/LoginPrompt.jsx';
import { StaticMap } from '../components/StaticMap.jsx';
import { SectionCard } from '../components/ui/SectionCard.jsx';
import { BRAND, HQ } from '../data/config.js';
import { CLAIM_TYPES, FAQ } from '../data/support.js';
import { formatDate } from '../utils/format.js';
import { formatPhone } from '../utils/phone.js';

export function ClaimPage({ orders, claims, prefillOrderId, auth, onLogin, onSubmitClaim }) {
  const waNumber = HQ.phone.replace(/\D/g, '');
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 py-4">
      <h1 className="text-2xl font-extrabold">Support & réclamations</h1>
      <p className="mt-1 text-sm text-slate-500">Une question, un souci avec une livraison ? Notre équipe à Ankorondrano vous répond.</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <SectionCard title="Siège social" icon={Building2}>
            <StaticMap point={HQ} label={`<b>${HQ.name}</b><br/>${HQ.address}`} className="h-44" />
            <p className="mt-3 font-bold">{BRAND}</p>
            <p className="text-sm text-slate-600">{HQ.address}</p>
            <div className="mt-2 space-y-0.5 text-sm">
              {HQ.hours.map(([d, h]) => (
                <p key={d} className="flex justify-between gap-2"><span className="text-slate-500">{d}</span><span className="font-medium">{h}</span></p>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-semibold">
              <a href={`tel:${HQ.phone.replace(/\s/g, '')}`} className="flex flex-col items-center gap-1 rounded-2xl bg-emerald-50 p-3 text-emerald-900"><Phone className="h-5 w-5" /> Appeler</a>
              <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 rounded-2xl bg-green-50 p-3 text-green-900"><MessageCircle className="h-5 w-5" /> WhatsApp</a>
              <a href={`mailto:${HQ.email}`} className="flex flex-col items-center gap-1 rounded-2xl bg-slate-100 p-3 text-slate-800"><Mail className="h-5 w-5" /> E-mail</a>
            </div>
            <a
              href={`https://www.openstreetmap.org/directions?to=${HQ.lat}%2C${HQ.lng}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 text-sm font-semibold text-slate-700"
            >
              <Navigation className="h-4 w-4" /> Itinéraire vers le siège
            </a>
          </SectionCard>

          <SectionCard title="Questions fréquentes" icon={Info}>
            <div className="divide-y divide-slate-100">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group py-2">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-1.5 text-sm font-semibold">
                    {q}
                    <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" />
                  </summary>
                  <p className="pb-1 text-sm text-slate-600">{a}</p>
                </details>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Formulaire de réclamation" icon={TriangleAlert}>
            {auth.isAuthed ? (
              <ClaimForm orders={orders} prefillOrderId={prefillOrderId} defaultPhone={auth.user?.phone || ''} onSubmit={onSubmitClaim} />
            ) : (
              <LoginPrompt compact title="Connectez-vous pour signaler un problème" text="Votre réclamation est rattachée à votre compte et à votre commande." onLogin={onLogin} />
            )}
          </SectionCard>

          {auth.isAuthed && (
            <div className="flex items-center justify-between gap-3 ink-card-sm rounded-3xl bg-white px-4 py-3 text-sm">
              <span className="min-w-0 truncate text-slate-600">
                Connecté : <b className="text-slate-900">{formatPhone(auth.user?.phone || '')}</b>
              </span>
              <button onClick={auth.logout} className="flex shrink-0 items-center gap-1.5 font-semibold text-slate-700">
                <LogOut className="h-4 w-4" /> Se déconnecter
              </button>
            </div>
          )}

          {claims.length > 0 && (
            <SectionCard title="Mes réclamations" icon={ClipboardList}>
              <ul className="space-y-2">
                {claims.map((t) => {
                  const ct = CLAIM_TYPES.find((c) => c.id === t.type);
                  return (
                    <li key={t.id} className="rounded-2xl bg-slate-50 p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold">{t.id}</p>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">En cours de traitement</span>
                      </div>
                      <p className="text-slate-600">{ct?.label} · commande {t.orderId}</p>
                      <p className="line-clamp-2 text-xs text-slate-500">{t.message}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{formatDate(t.createdAt)} · rappel sous 2 h au {formatPhone(t.phone)}</p>
                    </li>
                  );
                })}
              </ul>
            </SectionCard>
          )}

          <SectionCard title="Mentions légales" icon={ShieldCheck}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-slate-500">Raison sociale</dt><dd>{BRAND} SARL</dd>
              <dt className="text-slate-500">Siège</dt><dd>{HQ.address}, Madagascar</dd>
              <dt className="text-slate-500">RCS</dt><dd>Antananarivo — à compléter</dd>
              <dt className="text-slate-500">NIF / STAT</dt><dd>à compléter</dd>
              <dt className="text-slate-500">Contact</dt><dd>{HQ.email}</dd>
            </dl>
            <p className="mt-3 text-xs text-slate-500">
              Prix en Ariary (MGA) TTC. Les données personnelles collectées servent uniquement au traitement des commandes et des réclamations.
              Cartographie © OpenStreetMap contributors, itinéraires OSRM.
            </p>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
