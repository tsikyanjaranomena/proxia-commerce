import { useEffect, useState } from 'react';
import { Camera, ChevronDown, LoaderCircle, Send, X } from 'lucide-react';
import { CLAIM_TYPES } from '../data/support.js';
import { formatDate } from '../utils/format.js';
import { formatAr } from '../utils/formatCurrency.js';
import { formatPhone, isValidPhone, normalizePhone } from '../utils/phone.js';
import { Field } from './ui/Field.jsx';
import { inputCls } from './ui/styles.js';

/** `onSubmit(formData)` est asynchrone : il envoie la réclamation (et la photo) au serveur. */
export function ClaimForm({ orders, prefillOrderId, defaultPhone = '', onSubmit }) {
  const [orderId, setOrderId] = useState(prefillOrderId || orders[0]?.id || '');
  const [type, setType] = useState('retard');
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState(defaultPhone);
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (prefillOrderId) setOrderId(prefillOrderId);
  }, [prefillOrderId]);

  // Les commandes arrivent après le premier rendu : présélectionne la plus récente.
  const firstOrderId = orders[0]?.id;
  useEffect(() => {
    if (firstOrderId) setOrderId((current) => current || firstOrderId);
  }, [firstOrderId]);

  useEffect(() => () => photo && URL.revokeObjectURL(photo.url), [photo]);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return setErrors((x) => ({ ...x, photo: 'Image uniquement (JPG, PNG…).' }));
    if (f.size > 8 * 1024 * 1024) return setErrors((x) => ({ ...x, photo: 'Image trop lourde (8 Mo max).' }));
    setErrors((x) => ({ ...x, photo: undefined }));
    setPhoto({ name: f.name, url: URL.createObjectURL(f), file: f });
  };

  const submit = async (e) => {
    e.preventDefault();
    const err = {};
    if (!orderId.trim()) err.orderId = 'Indiquez le numéro de commande.';
    if (message.trim().length < 15) err.message = 'Décrivez le problème (15 caractères minimum).';
    if (!isValidPhone(phone)) err.phone = 'Numéro invalide.';
    setErrors(err);
    if (Object.keys(err).length) return;

    const form = new FormData();
    form.append('orderCode', orderId.trim().toUpperCase());
    form.append('type', type);
    form.append('message', message.trim());
    form.append('phone', phone);
    if (photo) form.append('photo', photo.file);

    setSending(true);
    try {
      await onSubmit(form);
      setMessage('');
      setPhoto(null);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Commande concernée" error={errors.orderId}>
        {orders.length > 0 ? (
          <div className="relative">
            <select value={orderId} onChange={(e) => setOrderId(e.target.value)} className={`${inputCls(errors.orderId)} appearance-none pr-10`}>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>{o.id} — {formatDate(o.createdAt)} — {formatAr(o.total)}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          </div>
        ) : (
          <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="MX-XXXXXX" className={inputCls(errors.orderId)} />
        )}
      </Field>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Type de problème</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CLAIM_TYPES.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => setType(c.id)}
              className={`flex items-center gap-2 rounded-2xl border p-3 text-left text-sm font-medium transition ${type === c.id ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white'}`}
              aria-pressed={type === c.id}
            >
              <c.icon className="h-4 w-4 shrink-0" /> {c.label}
            </button>
          ))}
        </div>
      </div>

      <Field label="Description" error={errors.message} hint={`${message.trim().length} / 15 caractères minimum`}>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} className={`${inputCls(errors.message)} min-h-[110px] resize-y`} placeholder="Expliquez ce qui s’est passé…" maxLength={1000} />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Téléphone pour vous rappeler" error={errors.phone}>
          <input value={formatPhone(phone)} onChange={(e) => setPhone(normalizePhone(e.target.value))} inputMode="tel" placeholder="034 12 345 67" className={inputCls(errors.phone)} />
        </Field>
        <Field label="Photo (optionnel)" error={errors.photo}>
          <label className="flex h-[50px] cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 text-sm text-slate-600">
            <Camera className="h-5 w-5 shrink-0" />
            <span className="truncate">{photo ? photo.name : 'Ajouter une photo'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
          </label>
        </Field>
      </div>
      {photo && (
        <div className="relative inline-block">
          <img src={photo.url} alt="Aperçu de la pièce jointe" className="h-24 w-24 rounded-2xl object-cover ring-1 ring-slate-200" />
          <button type="button" onClick={() => setPhoto(null)} className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-slate-900 text-white" aria-label="Retirer la photo">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errors.submit && <p className="rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700">{errors.submit}</p>}

      <button type="submit" disabled={sending} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-700 font-bold text-white disabled:opacity-60">
        {sending ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        Envoyer la réclamation
      </button>
    </form>
  );
}
