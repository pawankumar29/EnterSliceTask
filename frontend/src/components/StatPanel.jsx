import React from "react";
import { Badge } from "./utils.jsx";

const priorities = ["low", "medium", "high", "urgent"];

function StatPanel({ stats, loading }) {
  const statusMap = Object.fromEntries(
    (stats?.statusCounts || []).map((item) => [item.status, item.count]),
  );
  const priorityMap = Object.fromEntries(
    (stats?.priorityCounts || []).map((item) => [item.priority, item.count]),
  );

  return (
    <section className="stats-bar">
      <div>
        <span>Open</span>
        <strong>{loading ? "-" : statusMap.open || 0}</strong>
      </div>
      <div>
        <span>In progress</span>
        <strong>{loading ? "-" : statusMap.in_progress || 0}</strong>
      </div>
      <div>
        <span>Breached</span>
        <strong className="danger">
          {loading ? "-" : stats?.breached || 0}
        </strong>
      </div>
      <div>
        <span>At risk</span>
        <strong className="warn">{loading ? "-" : stats?.atRisk || 0}</strong>
      </div>
      <div className="priority-strip">
        {priorities.map((priority) => (
          <Badge key={priority} tone={priority}>
            {priority}: {priorityMap[priority] || 0}
          </Badge>
        ))}
      </div>
    </section>
  );
}

export default React.memo(StatPanel);
