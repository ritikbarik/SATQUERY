import React from "react";
import { ChevronRight, Clock } from "lucide-react";
import type { RecentQuery } from "../../types/satquery";
import { Card } from "../common/Card";

interface RecentQueriesProps {
  queries: RecentQuery[];
  onSelectQuery?: (queryText: string) => void;
}

export const RecentQueries: React.FC<RecentQueriesProps> = ({ queries, onSelectQuery }) => (
  <Card className="recent-card">
    <div className="recent-title">
      <Clock size={15} />
      <span>RECENT QUERIES</span>
    </div>
    {queries.length === 0 ? (
      <p className="empty">No queries yet.</p>
    ) : (
      <div className="recent-list">
        {queries.slice(0, 4).map((query) => (
          <button
            key={query.id}
            className={`recent-item ${query.intent}`}
            onClick={() => onSelectQuery?.(query.text)}
            title="Click to rerun this query"
          >
            <span className="query-dot" />
            <span className="query-content">
              <strong>{query.text}</strong>
              <small>
                {query.timestamp}
                {query.location ? ` • ${query.location.split(",")[0]}` : ""}
              </small>
            </span>
          </button>
        ))}
      </div>
    )}
    <button className="outline-action" onClick={() => queries[0] && onSelectQuery?.(queries[0].text)}>
      Re-run Last Query <ChevronRight size={16} />
    </button>
  </Card>
);
