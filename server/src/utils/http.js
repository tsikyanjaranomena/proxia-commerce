export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Valide `data` avec un schéma zod ; lève une erreur 400 lisible sinon. */
export function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) throw new HttpError(400, result.error.issues[0]?.message || 'Requête invalide.', 'validation');
  return result.data;
}
