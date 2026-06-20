import React from "react";
import { api } from "./api/client.js";
import { useAsync } from "./hooks/useAsync.js";
import "./styles/app.css";
import TicketTable from "./components/TicketTable.jsx";

function App() {
  const [filters, setFilters] = React.useState({
    page: 1,
    pageSize: 8,
  });
  const [selectedId, setSelectedId] = React.useState(null);

  const tickets = useAsync(
    (signal) => api.listTickets(filters, { signal }),
    [filters],
  );

  const handlePage = React.useCallback(
    (page) => setFilters((currentFilters) => ({ ...currentFilters, page })),
    [],
  );

  return (
    <main>
      <header className="topbar">
        <div>
          <span className="eyebrow">Support operations</span>
          <h1>Ticket SLA Desk</h1>
        </div>
      </header>

      <section className="workspace">
        <div className="tickets-panel">
          <TicketTable
            result={tickets.data}
            loading={tickets.loading}
            error={tickets.error}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onPage={handlePage}
          />
        </div>
      </section>
    </main>
  );
}

export default App;