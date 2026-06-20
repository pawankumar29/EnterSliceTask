import React from "react";
import { api } from "../api/client.js";

const priorities = ["low", "medium", "high", "urgent"];

function NewTicketForm({ agents, onCreated }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    subject: "",
    description: "",
    priority: "medium",
    assignedAgentId: "",
  });
  const [error, setError] = React.useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.createTicket({
        ...form,
        assignedAgentId: form.assignedAgentId
          ? Number(form.assignedAgentId)
          : null,
      });
      setForm({
        subject: "",
        description: "",
        priority: "medium",
        assignedAgentId: "",
      });
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="new-ticket">
      <button className="primary" onClick={() => setOpen((value) => !value)}>
        <span>New ticket</span>
      </button>
      {open && (
        <form onSubmit={submit}>
          {error && <div className="inline-error">{error}</div>}
          <input
            placeholder="Subject"
            value={form.subject}
            onChange={(event) =>
              setForm({ ...form, subject: event.target.value })
            }
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
          />
          <div className="control-grid">
            <select
              value={form.priority}
              onChange={(event) =>
                setForm({ ...form, priority: event.target.value })
              }
            >
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
            <select
              value={form.assignedAgentId}
              onChange={(event) =>
                setForm({ ...form, assignedAgentId: event.target.value })
              }
            >
              <option value="">Unassigned</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit">Create</button>
        </form>
      )}
    </div>
  );
}

export default NewTicketForm;
