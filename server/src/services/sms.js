/**
 * Envoi de SMS. Aucun fournisseur n'est branché pour l'instant : le message est
 * écrit dans la console du serveur. Pour la production, remplacez le corps de
 * `sendSms` par l'appel à votre passerelle SMS (opérateur local ou agrégateur).
 */
export async function sendSms(phone, text) {
  console.log(`[sms → ${phone}] ${text}`);
}
