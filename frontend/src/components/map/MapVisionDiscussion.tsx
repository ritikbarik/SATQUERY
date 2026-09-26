import React, { useState } from "react";
import { Camera, ChevronDown, ChevronUp, Maximize2, RefreshCw, Send, Sparkles, X } from "lucide-react";
import type { DiscussionMessage, SnapshotDiscussionResponse } from "../../types/satquery";

interface MapVisionDiscussionProps {
  snapshotData: SnapshotDiscussionResponse | null;
  screenshotUrl: string | null;
  isCapturing: boolean;
  isAnalyzing: boolean;
  onRetakeSnapshot: () => void;
  onAskFollowup: (question: string) => void;
  onClose?: () => void;
}

export const MapVisionDiscussion: React.FC<MapVisionDiscussionProps> = ({
  snapshotData,
  screenshotUrl,
  isCapturing,
  isAnalyzing,
  onRetakeSnapshot,
  onAskFollowup,
  onClose,
}) => {
  const [followupInput, setFollowupInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFullImageModal, setShowFullImageModal] = useState(false);

  const handleFollowupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (followupInput.trim() && !isAnalyzing) {
      onAskFollowup(followupInput.trim());
      setFollowupInput("");
    }
  };

  if (!snapshotData && !isCapturing && !isAnalyzing) {
    return null;
  }

  const getSpeakerIcon = (role: DiscussionMessage["role"]) => {
    switch (role) {
      case "vision_model":
        return "🛰️";
      case "analyst":
        return "📊";
      case "radar_specialist":
        return "📡";
      case "consensus":
        return "⚡";
      default:
        return "🤖";
    }
  };

  const getSpeakerClass = (role: DiscussionMessage["role"]) => {
    switch (role) {
      case "vision_model":
        return "vision-speaker";
      case "analyst":
        return "spectral-speaker";
      case "radar_specialist":
        return "radar-speaker";
      case "consensus":
        return "consensus-speaker";
      default:
        return "";
    }
  };

  return (
    <>
      <div className={`map-vision-drawer ${isExpanded ? "expanded" : "collapsed"}`}>
        {/* Drawer Header */}
        <div className="vision-drawer-header">
          <div className="vision-header-left">
            <div className="vision-pulse-icon">
              <Camera size={16} />
            </div>
            <div>
              <strong>Map Snapshot &amp; Vision AI Discussion</strong>
              <small>
                {snapshotData ? `${snapshotData.location_name} • ${snapshotData.coordinates}` : "Analyzing captured satellite frame..."}
              </small>
            </div>
          </div>

          <div className="vision-header-actions">
            <button
              type="button"
              className="vision-action-btn retake"
              onClick={onRetakeSnapshot}
              disabled={isCapturing || isAnalyzing}
              title="Retake snapshot from current map view"
            >
              <RefreshCw size={13} className={isCapturing || isAnalyzing ? "spin" : ""} />
              <span>{isCapturing ? "Capturing..." : "Retake Frame"}</span>
            </button>

            <button
              type="button"
              className="vision-action-btn icon"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Collapse Panel" : "Expand Panel"}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>

            {onClose && (
              <button
                type="button"
                className="vision-action-btn icon"
                onClick={onClose}
                title="Close Vision Inspector"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="vision-drawer-body">
            {/* Left: Snapshot Preview Frame */}
            <div className="vision-snapshot-pane">
              <div className="snapshot-frame-wrapper" onClick={() => screenshotUrl && setShowFullImageModal(true)}>
                {screenshotUrl ? (
                  <>
                    <img
                      src={screenshotUrl}
                      alt="Captured Mappls Satellite Frame"
                      className="snapshot-img-preview"
                    />
                    <div className="snapshot-frame-overlay">
                      <div className="snapshot-tag">
                        <span className="live-dot" />
                        <span>Mappls Satellite</span>
                      </div>
                      <button className="expand-lens-btn" title="View Fullscreen Frame">
                        <Maximize2 size={14} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="snapshot-placeholder">
                    <span className="spinner" />
                    <span>Rendering satellite frame capture...</span>
                  </div>
                )}
              </div>

              {snapshotData && (
                <div className="detected-features-list">
                  <span className="features-title">
                    <Sparkles size={12} />
                    <span>Detected Visual Landforms:</span>
                  </span>
                  <div className="features-chips-wrap">
                    {snapshotData.detected_features.map((feat) => (
                      <div key={feat.name} className="feature-evidence-pill" title={feat.description}>
                        <span className="feat-name">{feat.name}</span>
                        <span className="feat-conf">{feat.confidence.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Collaborative Vision Models Discussion */}
            <div className="vision-discussion-pane">
              <div className="discussion-messages-wrap">
                {isAnalyzing ? (
                  <div className="analyzing-state">
                    <span className="spinner-orbit" />
                    <span>Multi-agent vision models are discussing the captured frame...</span>
                  </div>
                ) : (
                  snapshotData?.detailed_discussion.map((msg, idx) => (
                    <div key={idx} className={`discussion-msg-item ${getSpeakerClass(msg.role)}`}>
                      <div className="msg-header">
                        <span className="speaker-avatar">{getSpeakerIcon(msg.role)}</span>
                        <strong className="speaker-name">{msg.speaker}</strong>
                        <span className="msg-time">{msg.timestamp}</span>
                      </div>
                      <div className="msg-body">{msg.message}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Follow-up Question Input directly about this screenshot */}
              <form onSubmit={handleFollowupSubmit} className="vision-followup-box">
                <input
                  type="text"
                  placeholder="Ask the models a follow-up question about this snapshot..."
                  value={followupInput}
                  onChange={(e) => setFollowupInput(e.target.value)}
                  disabled={isAnalyzing}
                />
                <button
                  type="submit"
                  className="followup-send-btn"
                  disabled={!followupInput.trim() || isAnalyzing}
                  title="Submit follow-up to vision models"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Snapshot Modal */}
      {showFullImageModal && screenshotUrl && (
        <div className="snapshot-modal-backdrop" onClick={() => setShowFullImageModal(false)}>
          <div className="snapshot-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <strong>Mappls Satellite Snapshot</strong>
              <button onClick={() => setShowFullImageModal(false)} className="close-modal-btn">
                <X size={18} />
              </button>
            </div>
            <img src={screenshotUrl} alt="Satellite Snapshot" className="modal-img-full" />
            <div className="modal-footer">
              <span>{snapshotData?.coordinates} • Zoom {snapshotData?.zoom_level}</span>
              <span className="modal-attribution">Mappls Satellite &bull; High-Resolution Earth Observation</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
