import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Tag, Tooltip, Collapse } from "antd";
import {
  UserOutlined,
  RobotOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  CopyOutlined,
  CheckOutlined,
} from "@ant-design/icons";

export default function ChatMessage({ msg, index }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  // Sources is now a flat array of document names
  const allSources = Array.isArray(msg.sources) ? msg.sources.filter(Boolean) : [];

  return (
    <div
      className={`flex gap-3 px-4 py-4 md:px-8 lg:px-16 xl:px-24 animate-slide-up`}
      style={{ backgroundColor: isUser ? "transparent" : "var(--msg-assistant-bg)" }}
    >
      {/* Avatar */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
        style={
          isUser
            ? { backgroundColor: "var(--brand-light)", border: "1px solid var(--brand-accent)" }
            : { background: "linear-gradient(135deg, #6366f1, #7c3aed)" }
        }
      >
        {isUser ? (
          <UserOutlined style={{ color: "var(--brand-accent)", fontSize: 12 }} />
        ) : (
          <RobotOutlined style={{ color: "#fff", fontSize: 12 }} />
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

        {/* Sources — only if there are relevant sources */}
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

        {/* Copy */}
        {!isUser && (
          <div className="mt-2">
            <Tooltip title={copied ? "Copied!" : "Copy"}>
              <button onClick={handleCopy} className="t-text-faint transition-colors text-xs" style={{ cursor: "pointer", background: "none", border: "none" }}>
                {copied ? <CheckOutlined style={{ color: "#10b981" }} /> : <CopyOutlined />}
              </button>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
}
