export default function Stars({ value = 0, onChange = null }) {
  return (
    <span className={`stars ${onChange ? 'stars-input' : ''}`} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button
            key={n}
            type="button"
            className={n <= value ? 'star on' : 'star'}
            onClick={() => onChange(n)}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
          >
            ★
          </button>
        ) : (
          <span key={n} className={n <= value ? 'star on' : 'star'}>★</span>
        )
      )}
    </span>
  );
}
