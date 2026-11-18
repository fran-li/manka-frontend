import type { Page } from '../api/types'

type PaginationProps = {
  data: Pick<Page<unknown>, 'number' | 'size' | 'totalElements' | 'totalPages'>
  sizes: readonly number[]
  onPageChange: (page: number) => void
  onSizeChange: (size: number) => void
  loading?: boolean
  label?: string
}

/** Pagination shared by Explore and Recommendations. Page indexes are zero-based. */
export function Pagination({
  data, sizes, onPageChange, onSizeChange, loading = false, label = 'resultados',
}: PaginationProps) {
  const { number: page, size, totalElements, totalPages } = data
  const start = totalElements === 0 ? 0 : page * size + 1
  const end = Math.min((page + 1) * size, totalElements)
  const numberFormat = (value: number) => value.toLocaleString('es-PE')

  // Show the first, last, current and adjacent pages, with gaps in between.
  const neighbors = Array.from(new Set([
    0, totalPages - 1, page - 1, page, page + 1,
  ].filter(index => index >= 0 && index < totalPages))).sort((a, b) => a - b)

  return (
    <nav className="pager" aria-label={`Paginación de ${label}`}>
      <div className="pager-summary">
        <span>
          Mostrando <strong>{numberFormat(start)}–{numberFormat(end)}</strong> de{' '}
          <strong>{numberFormat(totalElements)}</strong> {label}
        </span>
        <label className="pager-size">
          Por página
          <select
            aria-label={`Cantidad de ${label} por página`}
            value={size}
            onChange={event => onSizeChange(Number(event.target.value))}
            disabled={loading}
          >
            {sizes.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </div>

      {totalPages > 1 && (
        <div className="pager-controls">
          <button
            type="button" className="btn btn-outline pager-arrow"
            disabled={page === 0 || loading}
            onClick={() => onPageChange(page - 1)}
          >← Anterior</button>

          <div className="pager-numbers">
            {neighbors.map((index, position) => (
              <span className="pager-number-group" key={index}>
                {position > 0 && index - neighbors[position - 1] > 1 && (
                  <span className="pager-ellipsis" aria-hidden="true">…</span>
                )}
                <button
                  type="button"
                  className={`pager-page${page === index ? ' is-current' : ''}`}
                  aria-label={`Ir a la página ${index + 1}`}
                  aria-current={page === index ? 'page' : undefined}
                  disabled={loading || page === index}
                  onClick={() => onPageChange(index)}
                >{index + 1}</button>
              </span>
            ))}
          </div>

          <button
            type="button" className="btn btn-outline pager-arrow"
            disabled={page >= totalPages - 1 || loading}
            onClick={() => onPageChange(page + 1)}
          >Siguiente →</button>
        </div>
      )}
    </nav>
  )
}
