import axios from 'axios'

// API externa complementaria. Las recetas, ingredientes y la despensa siguen
// siendo gestionados por el backend de Manka en Railway.
const openFoodFacts = axios.create({
  baseURL: 'https://world.openfoodfacts.org',
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'User-Agent': 'MankaMobile/1.1.0 (https://github.com/fran-li/manka-frontend)',
  },
})

type ApiProduct = {
  code?: string
  product_name?: string
  product_name_es?: string
  generic_name?: string
  generic_name_es?: string
  brands?: string
  quantity?: string
  image_front_small_url?: string
}
type ApiResponse = {
  status?: string
  product?: ApiProduct
}

export type FoodProduct = {
  barcode: string
  name: string
  genericName: string
  brand: string
  quantity: string
  imageUrl: string | null
}

export class FoodLookupError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FoodLookupError'
  }
}

export async function findFoodByBarcode(rawCode: string): Promise<FoodProduct> {
  const code = rawCode.replace(/[\s-]/g, '').trim()
  if (!/^\d{8,14}$/.test(code)) {
    throw new FoodLookupError('Introduce un código de barras EAN/UPC válido (entre 8 y 14 dígitos).')
  }

  try {
    const response = await openFoodFacts.get<ApiResponse>(`/api/v3/product/${code}`, {
      params: {
        fields: 'code,product_name,product_name_es,generic_name,generic_name_es,brands,quantity,image_front_small_url',
      },
    })
    const product = response.data?.product
    if (!product || response.data?.status === 'failure') {
      throw new FoodLookupError('Este código no aparece en Open Food Facts. Puedes buscar el ingrediente manualmente.')
    }
    const name = (product.product_name_es || product.product_name || product.generic_name_es || product.generic_name || '').trim()
    if (!name) {
      throw new FoodLookupError('El producto existe, pero no tiene nombre. Selecciona el ingrediente manualmente.')
    }
    return {
      barcode: code,
      name,
      genericName: (product.generic_name_es || product.generic_name || '').trim(),
      brand: (product.brands || '').trim(),
      quantity: (product.quantity || '').trim(),
      imageUrl: product.image_front_small_url?.startsWith('https://') ? product.image_front_small_url : null,
    }
  } catch (error) {
    if (error instanceof FoodLookupError) throw error
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new FoodLookupError('Este producto no está registrado en Open Food Facts. Prueba otro código o el buscador manual.')
      }
      if (error.code === 'ECONNABORTED') {
        throw new FoodLookupError('Open Food Facts tardó demasiado. Vuelve a intentarlo o añade el ingrediente manualmente.')
      }
      if (!error.response) {
        throw new FoodLookupError('No se pudo conectar a Open Food Facts. Comprueba internet o utiliza la búsqueda manual.')
      }
    }
    throw new FoodLookupError('No se pudo identificar el producto. Puedes seleccionar el ingrediente manualmente.')
  }
}
