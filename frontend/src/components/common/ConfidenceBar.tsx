interface ConfidenceBarProps {
  value: number;
}

export const ConfidenceBar = ({ value }: ConfidenceBarProps) => (
  <div className="confidence">
    <div className="confidence-track" aria-hidden="true">
      <span style={{ width: `${value}%` }} />
    </div>
    <strong>{value}%</strong>
  </div>
);
