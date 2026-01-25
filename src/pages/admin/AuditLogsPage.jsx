import React, { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import api from '../../api';

/**
 * Pagina de Logs de Auditoria
 */
function AuditLogsPage() {
    const { sessionToken, hasPermission } = useAdminAuth();
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        action: '',
        entityType: ''
    });

    const fetchLogs = useCallback(async (page = 1) => {
        if (!sessionToken) return;

        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '50'
            });

            if (filters.action) params.append('action', filters.action);
            if (filters.entityType) params.append('entityType', filters.entityType);

            const response = await api.get(`/scheduler/audit-logs?${params}`, {
                headers: { Authorization: `Bearer ${sessionToken}` }
            });

            setLogs(response.data.data);
            setPagination(response.data.pagination);
        } catch (err) {
            setError(err.response?.data?.message || 'Error cargando logs');
        } finally {
            setIsLoading(false);
        }
    }, [sessionToken, filters]);

    useEffect(() => {
        fetchLogs(1);
    }, [fetchLogs]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatAddress = (address) => {
        if (!address || address === 'system') return 'Sistema';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const getActionColor = (action) => {
        if (action.includes('error')) return '#FF6B6B';
        if (action.includes('created') || action.includes('opened')) return '#4CAF50';
        if (action.includes('closed') || action.includes('completed')) return '#2196F3';
        if (action.includes('vrf')) return '#9C27B0';
        return '#FFD700';
    };

    const actionOptions = [
        { value: '', label: 'Todas las acciones' },
        { value: 'draw_created', label: 'Sorteo creado' },
        { value: 'draw_opened', label: 'Sorteo abierto' },
        { value: 'draw_closed', label: 'Sorteo cerrado' },
        { value: 'draw_vrf_requested', label: 'VRF solicitado' },
        { value: 'draw_vrf_fulfilled', label: 'VRF completado' },
        { value: 'draw_completed', label: 'Sorteo completado' },
        { value: 'admin_login', label: 'Login admin' },
        { value: 'system_error', label: 'Error sistema' }
    ];

    const entityOptions = [
        { value: '', label: 'Todas las entidades' },
        { value: 'draw', label: 'Sorteos' },
        { value: 'admin', label: 'Admin' },
        { value: 'system', label: 'Sistema' }
    ];

    if (!hasPermission('audit:read')) {
        return (
            <div style={styles.container}>
                <div style={styles.errorBox}>
                    No tienes permisos para ver los logs de auditoria
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Logs de Auditoria</h1>
                <button onClick={() => fetchLogs(1)} style={styles.refreshBtn}>
                    Actualizar
                </button>
            </div>

            {/* Filtros */}
            <div style={styles.filters}>
                <select
                    value={filters.action}
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                    style={styles.select}
                >
                    {actionOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

                <select
                    value={filters.entityType}
                    onChange={(e) => handleFilterChange('entityType', e.target.value)}
                    style={styles.select}
                >
                    {entityOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            {isLoading ? (
                <div style={styles.loading}>Cargando logs...</div>
            ) : logs.length === 0 ? (
                <div style={styles.empty}>No hay logs que mostrar</div>
            ) : (
                <>
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Fecha</th>
                                    <th style={styles.th}>Accion</th>
                                    <th style={styles.th}>Entidad</th>
                                    <th style={styles.th}>Actor</th>
                                    <th style={styles.th}>Detalles</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <span style={styles.date}>{formatDate(log.created_at)}</span>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={{
                                                ...styles.actionBadge,
                                                backgroundColor: getActionColor(log.action) + '22',
                                                color: getActionColor(log.action)
                                            }}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={styles.entityType}>{log.entity_type}</span>
                                            {log.entity_id && (
                                                <span style={styles.entityId}>#{log.entity_id}</span>
                                            )}
                                        </td>
                                        <td style={styles.td}>
                                            <span style={styles.actor}>{formatAddress(log.actor_address)}</span>
                                        </td>
                                        <td style={styles.td}>
                                            <details style={styles.details}>
                                                <summary style={styles.summary}>Ver detalles</summary>
                                                <pre style={styles.json}>
                                                    {JSON.stringify(log.details, null, 2)}
                                                </pre>
                                            </details>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginacion */}
                    <div style={styles.pagination}>
                        <button
                            onClick={() => fetchLogs(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            style={styles.pageBtn}
                        >
                            Anterior
                        </button>
                        <span style={styles.pageInfo}>
                            Pagina {pagination.page} de {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => fetchLogs(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            style={styles.pageBtn}
                        >
                            Siguiente
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

const styles = {
    container: {
        padding: '2rem',
        maxWidth: '1400px',
        margin: '0 auto'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
    },
    title: {
        color: '#FFD700',
        fontSize: '1.5rem',
        margin: 0
    },
    refreshBtn: {
        padding: '0.5rem 1rem',
        backgroundColor: '#333',
        color: '#FFF',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer'
    },
    filters: {
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem'
    },
    select: {
        padding: '0.5rem 1rem',
        backgroundColor: '#1A1A1A',
        color: '#FFF',
        border: '1px solid #333',
        borderRadius: '6px',
        minWidth: '200px'
    },
    errorBox: {
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        border: '1px solid #FF6B6B',
        borderRadius: '8px',
        padding: '1rem',
        color: '#FF6B6B',
        marginBottom: '1rem'
    },
    loading: {
        textAlign: 'center',
        color: '#888',
        padding: '3rem'
    },
    empty: {
        textAlign: 'center',
        color: '#666',
        padding: '3rem',
        backgroundColor: '#1A1A1A',
        borderRadius: '8px'
    },
    tableContainer: {
        overflowX: 'auto',
        backgroundColor: '#1A1A1A',
        borderRadius: '8px',
        border: '1px solid #333'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse'
    },
    th: {
        textAlign: 'left',
        padding: '1rem',
        color: '#888',
        fontWeight: '500',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        borderBottom: '1px solid #333'
    },
    tr: {
        borderBottom: '1px solid #252525'
    },
    td: {
        padding: '0.75rem 1rem',
        color: '#FFF',
        fontSize: '0.875rem',
        verticalAlign: 'top'
    },
    date: {
        color: '#888',
        fontSize: '0.8rem',
        fontFamily: 'monospace'
    },
    actionBadge: {
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontFamily: 'monospace'
    },
    entityType: {
        color: '#B0B0B0'
    },
    entityId: {
        color: '#FFD700',
        marginLeft: '0.5rem',
        fontFamily: 'monospace'
    },
    actor: {
        fontFamily: 'monospace',
        fontSize: '0.8rem'
    },
    details: {
        cursor: 'pointer'
    },
    summary: {
        color: '#888',
        fontSize: '0.75rem'
    },
    json: {
        backgroundColor: '#0D0D0D',
        padding: '0.5rem',
        borderRadius: '4px',
        fontSize: '0.7rem',
        color: '#B0B0B0',
        overflow: 'auto',
        maxWidth: '300px',
        maxHeight: '150px'
    },
    pagination: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1rem',
        marginTop: '1.5rem'
    },
    pageBtn: {
        padding: '0.5rem 1rem',
        backgroundColor: '#333',
        color: '#FFF',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer'
    },
    pageInfo: {
        color: '#888'
    }
};

export default AuditLogsPage;
