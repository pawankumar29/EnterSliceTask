import React from "react";
import { Clock, MessageSquare, Send } from "lucide-react";
import { api } from "../api/client.js";
import { useAsync } from "../hooks/useAsync.js";
import { Badge, formatDate } from "./utils.jsx";

const statuses = ["open", "in_progress", "resolved", "closed"];

function TicketDetail({ ticketId, agents, onChanged }) {
  const {
    data: ticket,
    loading,
    error,
    refresh,
  } = useAsync(
    (signal) =>
      ticketId ? api.getTicket(ticketId, { signal }) : Promise.resolve(null),
    [ticketId],
  );
  const [comment, setComment] = React.useState("");
  const [actionError, setActionError] = React.useState("");

  const mutate = async (operation) => {
    setActionError("");
    try {
      await operation();
      await refresh();
      onChanged();
    } catch (err) {
      setActionError(err.message);
    }
  };

  if (!ticketId)
    return (
      <aside className="detail empty">
        Select a ticket to inspect SLA history.
      </aside>
    );
  if (loading)
    return (
      <aside className="detail">
        <div className="state">Loading detail...</div>
      </aside>
    );
  if (error)
    return (
      <aside className="detail">
        <div className="state error">{error}</div>
      </aside>
    );

     if (!ticket)
    return (
      <aside className="detail">
        <div className="state">Loading...</div>
      </aside>
    );

  return (
    <aside className="detail">
      <header>
        <div>
          <span className="eyebrow">Ticket #{ticket.id}</span>
          <h2>{ticket.subject}</h2>
        </div>
        <Badge tone={ticket.priority}>{ticket.priority}</Badge>
      </header>
      <p>{ticket.description}</p>

      {actionError && <div className="inline-error">{actionError}</div>}

      <div className="control-grid">
        <label>
          Status
          <select
            value={ticket.status}
            onChange={(event) =>
              mutate(() => api.updateStatus(ticket.id, event.target.value))
            }
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label>
          Agent
          <select
            value={ticket.assignedAgentId || ""}
            onChange={(event) =>
              mutate(() =>
                api.assignTicket(
                  ticket.id,
                  event.target.value ? Number(event.target.value) : null,
                ),
              )
            }
          >
            <option value="">Unassigned</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="timeline">
        <h3>
          <Clock size={16} /> SLA timeline
        </h3>
        <div className="due-line">Due {formatDate(ticket.slaDueAt)}</div>
        {ticket.slaEvents.length ? (
          ticket.slaEvents.map((event) => (
            <div key={event.id} className={`event ${event.eventType}`}>
              <Badge
                tone={
                  event.eventType === "breached"
                    ? "danger"
                    : event.eventType === "warning"
                      ? "warning"
                      : "urgent"
                }
              >
                {event.eventType}
              </Badge>
              <span>{formatDate(event.createdAt)}</span>
            </div>
          ))
        ) : (
          <div className="muted">No SLA events yet.</div>
        )}
      </section>

      <section className="conversation">
        <h3>
          <MessageSquare size={16} /> Conversation
        </h3>
        {ticket.comments.map((item) => (
          <article key={item.id}>
            <strong>{item.author}</strong>
            <span>{formatDate(item.createdAt)}</span>
            <p>{item.message}</p>
          </article>
        ))}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!comment.trim()) return;
            mutate(() =>
              api.addComment(ticket.id, { author: "agent", message: comment }),
            ).then(() => setComment(""));
          }}
        >
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Add an internal reply..."
          />
          <button type="submit">
            <Send size={16} />
            Send
          </button>
        </form>
      </section>
    </aside>
  );
}

export default React.memo(TicketDetail);
