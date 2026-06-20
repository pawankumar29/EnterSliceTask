import React from "react";
import { AlertCircle } from "lucide-react";
import { Badge, formatDate } from "./utils.jsx";

function TicketTable({ result, loading, error, selectedId, onSelect, onPage }) {
  if (loading) return <div className="state">Loading tickets...</div>;
  if (error)
    return (
      <div className="state error">
        <AlertCircle size={18} />
        {error}
      </div>
    );

  const tickets = result?.data || [];
  if (!tickets.length)
    return <div className="state">No tickets match these filters.</div>;

  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Agent</th>
              <th>SLA</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                className={selectedId === ticket.id ? "selected" : ""}
                onClick={() => onSelect(ticket.id)}
              >
                <td>
                  <strong>
                    #{ticket.id} {ticket.subject}
                  </strong>
                  <span>{ticket.description}</span>
                </td>
                <td>
                  <Badge tone={ticket.priority}>{ticket.priority}</Badge>
                </td>
                <td>
                  <Badge>{ticket.status.replace("_", " ")}</Badge>
                </td>
                <td>{ticket.assignedAgentName || "Unassigned"}</td>
                <td>
                  <div className="sla-cell">
                    {ticket.isBreached ? (
                      <Badge tone="danger">breached</Badge>
                    ) : ticket.isAtRisk ? (
                      <Badge tone="warning">at risk</Badge>
                    ) : (
                      <Badge>on track</Badge>
                    )}
                    <span>{formatDate(ticket.slaDueAt)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <button
          onClick={() => onPage(result.pagination.page - 1)}
          disabled={result.pagination.page <= 1}
        >
          Prev
        </button>
        <span>
          Page {result.pagination.page} of{" "}
          {Math.max(1, result.pagination.totalPages)}
        </span>
        <button
          onClick={() => onPage(result.pagination.page + 1)}
          disabled={result.pagination.page >= result.pagination.totalPages}
        >
          Next
        </button>
      </div>
    </>
  );
}

export default React.memo(TicketTable);
