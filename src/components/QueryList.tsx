import React, { useState } from 'react';
import { ArrowRight, Trash2 } from 'lucide-react';
import { Query, JobCategory } from '../types';

interface QueryListProps {
  queries: Query[];
  onDelete?: (query: Query) => void;
  onConvertToJob?: (query: Query, jobType: JobCategory) => void;
}

const QueryList: React.FC<QueryListProps> = ({ queries, onDelete, onConvertToJob }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  if (!queries.length) {
    return <p className="empty-state">No queries yet.</p>;
  }

  const toggleExpanded = (queryId: string) => {
    setExpandedId((current) => (current === queryId ? null : queryId));
  };

  const handleConvert = (query: Query, jobType: JobCategory) => {
    onConvertToJob?.(query, jobType);
    setConvertingId(null);
  };

  return (
    <div className="job-list">
      {queries.map((query) => {
        const isExpanded = expandedId === query.id;
        const isConverting = convertingId === query.id;

        return (
          <article
            className={`job-card ${isExpanded ? 'expanded' : 'collapsed'}`}
            key={query.id}
            onClick={() => toggleExpanded(query.id)}
          >
            <header className="job-card-header">
              <div>
                <h3>{query.customerName}</h3>
                <p className="job-phone">{query.phoneNumber}</p>
              </div>
              <div className="job-card-meta">
                <span className="status-pill query">Query</span>
              </div>
            </header>
            {isExpanded ? (
              <>
                <section className="job-card-body">
                  <div className="section-divider">
                    <span>Query Details</span>
                  </div>
                  <p className="job-description">{query.description}</p>

                  {query.items && query.items.length > 0 && (
                    <>
                      <div className="section-divider">
                        <span>Items</span>
                      </div>
                      <ul className="job-items">
                        {query.items.map((item, index) => (
                          <li key={`item-${index}`}>{item.description}</li>
                        ))}
                      </ul>
                    </>
                  )}

                  <div className="section-divider">
                    <span>Actions</span>
                  </div>
                  {!isConverting ? (
                    <div className="job-card-actions">
                      <button
                        type="button"
                        className="primary"
                        onClick={(event) => {
                          event.stopPropagation();
                          setConvertingId(query.id);
                        }}
                      >
                        <ArrowRight className="icon" />
                        Convert to Job
                      </button>
                      {onDelete && (
                        <button
                          type="button"
                          className="danger"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDelete(query);
                          }}
                        >
                          <Trash2 className="icon" />
                          Delete
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="convert-to-job-section">
                      <p>Select job type:</p>
                      <div className="job-card-actions">
                        <button
                          type="button"
                          className="secondary"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleConvert(query, 'Repair');
                          }}
                        >
                          Repair
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleConvert(query, 'Fabrication');
                          }}
                        >
                          Fabrication
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleConvert(query, 'Deliveries and Dispatch');
                          }}
                        >
                          Dispatch
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={(event) => {
                            event.stopPropagation();
                            setConvertingId(null);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              </>
            ) : null}
          </article>
        );
      })}
    </div>
  );
};

export default QueryList;
