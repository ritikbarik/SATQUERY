import { Mic, SendHorizontal } from "lucide-react";

interface QueryInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isProcessing: boolean;
}

export const QueryInput = ({ value, onChange, onSubmit, isProcessing }: QueryInputProps) => (
  <form
    className="query-input"
    onSubmit={(event) => {
      event.preventDefault();
      onSubmit();
    }}
  >
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Type your question here..."
      aria-label="Ask SatQuery AI"
      disabled={isProcessing}
    />
    <button type="button" className="mic-button" aria-label="Use microphone">
      <Mic size={22} />
    </button>
    <button type="submit" className="send-button" aria-label="Send query" disabled={isProcessing || !value.trim()}>
      {isProcessing ? <span className="spinner" /> : <SendHorizontal size={24} />}
    </button>
  </form>
);
