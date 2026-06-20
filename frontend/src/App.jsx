import React from "react";
import { RefreshCw, Filter, Search } from "lucide-react";
import { api } from "./api/client.js";
import { useDebouncedValue } from "./hooks/useDebouncedValues.js";
import { useAsync } from "./hooks/useAsync.js";
import "./styles/App.css";
import StatPanel from "./components/StatPanel.jsx";
import TicketTable from "./components/TicketTable.jsx";
import TicketDetail from "./components/TicketDetail.jsx";
import NewTicketForm from "./components/NewTicketForm.jsx";

const statuses = ["open", "in_progress", "resolved", "closed"];
const emptyAgents = [];

function App() {
  const [filters, setFilters] = React.useState({
    status: "",
    priority: "",
    search: "",
    page: 1,
    pageSize: 4,
  });
  const [searchInput, setSearchInput] = React.useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [selectedId, setSelectedId] = React.useState(null);
  const ticketQuery = React.useMemo(() => {
    const query = { ...filters, search: debouncedSearch.trim() };
    Object.keys(query).forEach((key) => query[key] === "" && delete query[key]);
    return query;
  }, [filters, debouncedSearch]);

  const tickets = useAsync(
    (signal) => api.listTickets(ticketQuery, { signal }),
    [ticketQuery],
  );
  const stats = useAsync((signal) => api.stats({ signal }), []);
  const agents = useAsync((signal) => api.agents({ signal }), []);
  const agentOptions = agents.data || emptyAgents;

  const refreshAll = React.useCallback(() => {
    tickets.refresh();
    stats.refresh();
  }, [tickets.refresh, stats.refresh]);

  const handlePage = React.useCallback(
    (page) => setFilters((currentFilters) => ({ ...currentFilters, page })),
    [],
  );

  React.useEffect(() => {
    if (!selectedId && tickets.data?.data?.length)
      setSelectedId(tickets.data.data[0].id);
  }, [tickets.data, selectedId]);

  return (
    <main>
      <header className="topbar">
        <div>
          <span className="eyebrow">Support operations</span>
          <h1>Ticket SLA Desk</h1>
        </div>
        <button onClick={refreshAll}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      <StatPanel stats={stats.data} loading={stats.loading} />

      <section className="workspace">
        <div className="tickets-panel">
          <div className="toolbar">
            <label>
              <Filter size={16} />
              <select
                value={filters.status}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    status: event.target.value,
                    page: 1,
                  })
                }
              >
                <option value="">All status</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <select
                value={filters.priority}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    priority: event.target.value,
                    page: 1,
                  })
                }
              >
                <option value="">All priority</option>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="urgent">urgent</option>
              </select>
            </label>
            <label className="search">
              <Search size={16} />
              <input
                value={searchInput}
                onChange={(event) => {
                  setSearchInput(event.target.value);
                  setFilters({ ...filters, page: 1 });
                }}
                placeholder="Search subject"
              />
            </label>
          </div>
          <NewTicketForm agents={agentOptions} onCreated={refreshAll} />
          <TicketTable
            result={tickets.data}
            loading={tickets.loading}
            error={tickets.error}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onPage={handlePage}
          />
        </div>
        <TicketDetail
          ticketId={selectedId}
          agents={agentOptions}
          onChanged={refreshAll}
        />
      </section>
    </main>
  );
}

export default App;
