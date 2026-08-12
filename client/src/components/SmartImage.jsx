import { useState } from 'react';

/** Image with a branded fallback so the layout never breaks offline. */
export default function SmartImage({ src, alt = '', className = '', ...rest }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div className={`img-fallback ${className}`} role="img" aria-label={alt}>
        <span>✂</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
