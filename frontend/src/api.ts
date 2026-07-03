import type {
  Brand,
  BrandInput,
  Persona,
  PersonaInput,
  VoiceProfile,
  VoiceProfileInput,
} from './types'

const BASE = '/api'

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body.detail ?? detail
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }
  return res.json() as Promise<T>
}

export const api = {
  listBrands: () => fetch(`${BASE}/brands`).then(handle<Brand[]>),

  getBrand: (id: string) => fetch(`${BASE}/brands/${id}`).then(handle<Brand>),

  createBrand: (data: BrandInput) =>
    fetch(`${BASE}/brands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handle<Brand>),

  updateBrand: (id: string, data: Partial<BrandInput>) =>
    fetch(`${BASE}/brands/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handle<Brand>),

  // Phase 2 — ICP builder
  listPersonas: (brandId: string) =>
    fetch(`${BASE}/brands/${brandId}/personas`).then(handle<Persona[]>),

  createPersona: (brandId: string, data: PersonaInput) =>
    fetch(`${BASE}/brands/${brandId}/personas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handle<Persona>),

  updatePersona: (personaId: string, data: Partial<PersonaInput>) =>
    fetch(`${BASE}/personas/${personaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handle<Persona>),

  deletePersona: (personaId: string) =>
    fetch(`${BASE}/personas/${personaId}`, { method: 'DELETE' }).then((res) => {
      if (!res.ok) throw new Error('Failed to delete persona')
    }),

  // Phase 3 — Voice codifier
  getVoice: (brandId: string) =>
    fetch(`${BASE}/brands/${brandId}/voice`).then(handle<VoiceProfile>),

  putVoice: (brandId: string, data: VoiceProfileInput) =>
    fetch(`${BASE}/brands/${brandId}/voice`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handle<VoiceProfile>),
}
