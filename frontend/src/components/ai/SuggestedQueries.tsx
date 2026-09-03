import type { QueryIntent } from "../../types/satquery";

interface SuggestedQueriesProps {
  queries: Array<{ text: string; intent: QueryIntent }>;
  onSelect: (query: string) => void;
  disabled?: boolean;
}

export const SuggestedQueries = ({ queries, onSelect, disabled = false }: SuggestedQueriesProps) => (
  <div className="suggestions">
    {queries.map((query) => (
      <button key={query.text} onClick={() => onSelect(query.text)} disabled={disabled}>
        {query.text}
      </button>
    ))}
  </div>
);
