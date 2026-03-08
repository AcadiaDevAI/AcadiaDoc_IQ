import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Tag, Tooltip, Collapse, Modal, Input, message } from "antd";
import {
  UserOutlined,
  RobotOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  CopyOutlined,
  CheckOutlined,
  LikeOutlined,
  LikeFilled,
  DislikeOutlined,
  DislikeFilled,
} from "@ant-design/icons";
import { sendThumbsUp, sendThumbsDown } from "../services/api";

const { TextArea } = Input;

export default function ChatMessage({ msg, index, sessionId }) {
  const [copied, setCopied] = useState(false);
  const [feedbackState, setFeedbackState] = useState(null); // null | "up" | "down"
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isUser = msg.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleThumbsUp = async () => {
    if (feedbackState === "up") return; // already clicked
    setFeedbackState("up");
    try {
      await sendThumbsUp({
        message_index: index,
        session_id: sessionId || null,
      });
    } catch {
      // Silent fail — don't disrupt UX
    }
  };

  const handleThumbsDown = () => {
    if (feedbackState === "down") return;
    setFeedbackState("down");
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      message.warning("Please enter your feedback");
      return;
    }
    setSubmitting(true);
    try {
      await sendThumbsDown({
        message_index: index,
        session_id: sessionId || null,
        question: msg._question || null,
        answer: msg.content?.substring(0, 500) || null,
        feedback_text: feedbackText.trim(),
      });
      message.success("Thank you for your feedback!");
      setShowFeedbackModal(false);
      setFeedbackText("");
    } catch {
      message.error("Failed to send feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelFeedback = () => {
    setShowFeedbackModal(false);
    setFeedbackText("");
    // Reset to neutral if they cancel without submitting
    if (!feedbackText.trim()) {
      setFeedbackState(null);
    }
  };

  const confidenceColor = (c) => {
    if (c >= 0.8) return "#10b981";
    if (c >= 0.6) return "#3b82f6";
    if (c >= 0.4) return "#f59e0b";
    return "#ef4444";
  };

  const confidenceLabel = (c) => {
    if (c >= 0.8) return "High";
    if (c >= 0.6) return "Good";
    if (c >= 0.4) return "Medium";
    return "Low";
  };

  const allSources = Array.isArray(msg.sources) ? msg.sources.filter(Boolean) : [];

  return (
    <div
      className="flex gap-3 px-4 py-4 md:px-8 lg:px-16 xl:px-24 animate-slide-up"
      style={{ backgroundColor: isUser ? "transparent" : "var(--msg-assistant-bg)" }}
    >
      {/* Avatar */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
        style={
          isUser
            ? { backgroundColor: "var(--brand-light)", border: "1px solid var(--brand-accent)" }
            : { background: "linear-gradient(135deg, #0A3F63, #0A3F63)" }
        }
      >
        {isUser ? (
          <UserOutlined style={{ color: "var(--brand-accent)", fontSize: 12 }} />
        ) : (
          <RobotOutlined style={{ color: "#fff", fontSize: 18 }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold t-text-secondary">
            {isUser ? "You" : "Acadia AI"}
          </span>
          {msg.timestamp && (
            <span className="text-[10px] t-text-faint">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {!isUser && msg.processingTime && (
            <Tooltip title="Processing time">
              <span className="text-[10px] t-text-faint flex items-center gap-0.5">
                <ClockCircleOutlined />
                {(msg.processingTime / 1000).toFixed(1)}s
              </span>
            </Tooltip>
          )}
          {!isUser && msg.confidence !== undefined && (
            <Tooltip title={`Confidence: ${(msg.confidence * 100).toFixed(0)}%`}>
              <span className="text-[10px] flex items-center gap-0.5" style={{ color: confidenceColor(msg.confidence) }}>
                <ThunderboltOutlined />
                {confidenceLabel(msg.confidence)}
              </span>
            </Tooltip>
          )}
        </div>

        {/* Message body */}
        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
        </div>

        {/* Sources */}
        {!isUser && allSources.length > 0 && (
          <Collapse
            ghost
            size="small"
            className="mt-3"
            items={[
              {
                key: "sources",
                label: (
                  <span className="text-xs font-medium" style={{ color: "var(--brand-accent)" }}>
                    <FileTextOutlined className="mr-1" />
                    Sources ({allSources.length})
                  </span>
                ),
                children: (
                  <div className="flex flex-wrap gap-1.5">
                    {allSources.map((s, i) => (
                      <Tag key={i} color="blue" className="text-[10px] rounded-md">{s}</Tag>
                    ))}
                  </div>
                ),
              },
            ]}
          />
        )}

        {/* Action buttons: Copy + Thumbs Up + Thumbs Down */}
        {!isUser && (
          <div className="mt-2 flex items-center gap-3">
            {/* Copy */}
            <Tooltip title={copied ? "Copied!" : "Copy"}>
              <button
                onClick={handleCopy}
                className="t-text-faint transition-colors text-xs"
                style={{ cursor: "pointer", background: "none", border: "none", padding: 0 }}
              >
                {copied ? <CheckOutlined style={{ color: "#10b981" }} /> : <CopyOutlined />}
              </button>
            </Tooltip>

            {/* Thumbs Up */}
            <Tooltip title="Helpful">
              <button
                onClick={handleThumbsUp}
                className="transition-colors text-sm"
                style={{
                  cursor: feedbackState === "up" ? "default" : "pointer",
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: feedbackState === "up" ? "#10b981" : "var(--text-faint)",
                }}
              >
                {feedbackState === "up" ? <LikeFilled /> : <LikeOutlined />}
              </button>
            </Tooltip>

            {/* Thumbs Down */}
            <Tooltip title="Needs improvement">
              <button
                onClick={handleThumbsDown}
                className="transition-colors text-sm"
                style={{
                  cursor: feedbackState === "down" ? "default" : "pointer",
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: feedbackState === "down" ? "#ef4444" : "var(--text-faint)",
                }}
              >
                {feedbackState === "down" ? <DislikeFilled /> : <DislikeOutlined />}
              </button>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Thumbs Down Feedback Modal */}
      <Modal
        title="How can we improve?"
        open={showFeedbackModal}
        onOk={handleSubmitFeedback}
        onCancel={handleCancelFeedback}
        okText="Submit Feedback"
        cancelText="Cancel"
        confirmLoading={submitting}
        okButtonProps={{ disabled: !feedbackText.trim() }}
      >
        <p className="t-text-muted text-sm mb-3">
          Your feedback helps us improve. Please describe what was wrong or what you expected.
        </p>
        <TextArea
          rows={4}
          maxLength={2000}
          showCount
          placeholder="e.g., The answer was incorrect because... / I expected it to..."
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          autoFocus
        />
      </Modal>
    </div>
  );
}