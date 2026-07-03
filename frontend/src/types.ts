export interface Brand {
  id: string
  name: string
  vision: string | null
  goal: string | null
  moat: string | null
  created_at: string
  updated_at: string
}

export interface BrandInput {
  name: string
  vision?: string | null
  goal?: string | null
  moat?: string | null
}

export interface Variant {
  id: string
  label: string
  description: string | null
  position: number
}

export interface VariantInput {
  label: string
  description?: string | null
}

export interface Persona {
  id: string
  brand_id: string
  name: string
  description: string | null
  position: number
  variants: Variant[]
  created_at: string
  updated_at: string
}

export interface PersonaInput {
  name: string
  description?: string | null
  variants?: VariantInput[]
}

export const MAX_PERSONAS = 5

export interface RewritePair {
  dont: string
  do: string
}

export interface VoiceProfile {
  id: string
  brand_id: string
  samples: string[]
  banned_terms: string[]
  rewrite_pairs: RewritePair[]
  created_at: string
  updated_at: string
}

export interface VoiceProfileInput {
  samples: string[]
  banned_terms: string[]
  rewrite_pairs: RewritePair[]
}
