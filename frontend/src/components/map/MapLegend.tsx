const legend = [
  ["Vegetation", "vegetation"],
  ["Water", "water"],
  ["Built-up", "built"],
  ["Change (Decrease)", "decrease"],
  ["Change (Increase)", "increase"],
];

export const MapLegend = () => (
  <div className="map-legend">
    {legend.map(([label, tone]) => (
      <span key={label}>
        <i className={tone} />
        {label}
      </span>
    ))}
  </div>
);
