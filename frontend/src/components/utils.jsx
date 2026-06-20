import React from "react";

export const formatDate = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export const Badge = ({ children, tone = "neutral" }) => (
  <span className={`badge ${tone}`}>{children}</span>
);
