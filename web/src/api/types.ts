// Tipos extraídos de los DTO de Spring Boot del proyecto Manka.
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface Ingredient {
  id: number
  nombre: string
  parentId: number | null
  parentNombre: string | null
}

export interface DishIngredient {
  ingredienteId: number
  nombre: string
  cantidad: string | null
  detalle: string | null
  obligatorio: boolean | null
}

export interface Dish {
  id: number
  sourceId: number | null
  sourceUrl: string | null
  nombre: string
  tiempoPreparacion: number | null
  dificultad: string | null
  popularidad: number | null
  categoriaProteina: string | null
  preparacion: string | null
  country: string | null
  servings: number | null
  mealType: string | null
  ratingAverage: number | null
  ratingVotes: number | null
  durationEstimated: boolean | null
  difficultyEstimated: boolean | null
  proteinSources?: string[] | null
  tags?: string[] | null
  ingredientesCsv?: string[] | null
  ingredientes?: DishIngredient[] | null
}

export interface ScoreBreakdown {
  ingredientCoverage: number
  time: number
  proteinVariety: number
  repetition: number
  popularity: number
}

export interface Recommendation {
  platoId: number
  nombre: string
  tiempoPreparacion: number | null
  dificultad: string | null
  score: number
  ingredientCoveragePercent: number
  matchedIngredients: number
  totalIngredients: number
  missingIngredients: string[]
  breakdown: ScoreBreakdown | null
  reasons: string[]
  presentacionesCoincidentes?: string[] | null
}

export interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  roles: string[]
}

export interface LoginResponse { token: string; refreshToken: string }
export interface RegisterRequest { firstName: string; lastName: string; email: string; password: string }
export interface HistoryItem { id: number; dishId: number; dishName: string; cookedAt: string }
