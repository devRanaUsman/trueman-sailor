const ITEMS = ['Haircut', 'Hot Towel Shave', 'Beard Trim', 'Skin Fade', 'Grey Blending', 'Est. 1998'];

export default function Marquee() {
  const strip = (
    <>
      {ITEMS.map((item) => (
        <span key={item} className="marquee-item">
          {item} <em>✂</em>
        </span>
      ))}
    </>
  );
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {strip}
        {strip}
        {strip}
      </div>
    </div>
  );
}
