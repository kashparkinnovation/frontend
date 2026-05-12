"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import apiClient from "@/lib/api";
import StatusBadge from "@/components/ui/StatusBadge";
import Drawer, { DrawerRow, DrawerSection } from "@/components/ui/Drawer";
import { useToast } from "@/context/ToastContext";

const ORDER_STATUSES = [
  "awaiting_confirmation",
  "processing",
  "shipped",
  "delivered",
  "distributed",
  "cancelled",
  "refunded",
];

const STATUS_LABELS = {
  awaiting_confirmation: 'Awaiting Confirmation',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  distributed: 'Distributed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export default function VendorOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    apiClient
      .get("/orders/", { params })
      .then((r) => setOrders(r.data.results ?? r.data))
      .catch(() => showToast('Failed to load orders', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const openDrawer = (order) => {
    setSelected(order);
    setNewStatus(order.status);
  };

  const updateStatus = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      const { data } = await apiClient.patch(`/orders/${selected.id}/status/`, {
        status: newStatus,
      });
      setOrders((prev) => prev.map((o) => (o.id === data.id ? data : o)));
      setSelected(data);
      setNewStatus(data.status);
      showToast("Order status updated", "success");
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to update status", "error");
    } finally {
      setUpdating(false);
    }
  };

  const downloadFile = async (url, filename) => {
    try {
      const res = await apiClient.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      showToast('Download failed', 'error');
    }
  };

  // Client-side search
  const filteredOrders = orders.filter(o => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.order_number?.toLowerCase().includes(q) ||
      o.student_name?.toLowerCase().includes(q) ||
      o.parent_name?.toLowerCase().includes(q) ||
      o.school_name?.toLowerCase().includes(q)
    );
  });

  // Summary stats
  const stats = {
    total: orders.length,
    awaiting: orders.filter(o => o.status === 'awaiting_confirmation').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Orders</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div className="chip">📦 {stats.total} Total</div>
          {stats.awaiting > 0 && <div className="chip" style={{ background: '#fef3c7', color: '#92400e' }}>⏳ {stats.awaiting} New</div>}
          {stats.processing > 0 && <div className="chip" style={{ background: '#dbeafe', color: '#1e40af' }}>⚙️ {stats.processing} Processing</div>}
          {stats.shipped > 0 && <div className="chip" style={{ background: '#e0e7ff', color: '#3730a3' }}>🚚 {stats.shipped} Shipped</div>}
        </div>
      </div>

      {/* Filters Row */}
      <div className="card" style={{ marginBottom: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 2, minWidth: '200px' }}>
          <div className="search-bar">
            <span>🔍</span>
            <input
              placeholder="Search order, student, parent, school…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: '160px' }}>
          <select
            className="select"
            style={{ width: "100%" }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="tabs" style={{ marginBottom: '1rem' }}>
        <button className={`tab-btn ${statusFilter === '' ? 'active' : ''}`} onClick={() => setStatusFilter('')}>All ({orders.length})</button>
        {['awaiting_confirmation', 'processing', 'shipped', 'delivered'].map(s => {
          const count = orders.filter(o => o.status === s).length;
          return count > 0 ? (
            <button key={s} className={`tab-btn ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
              {STATUS_LABELS[s]} ({count})
            </button>
          ) : null;
        })}
      </div>

      {/* Orders Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
            <span className="spinner dark" style={{ width: "2rem", height: "2rem" }} />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛒</div>
            <p className="empty-state-title">No orders found</p>
            <p className="empty-state-desc">
              {searchQuery ? 'Try adjusting your search query' : 'Orders placed by students will appear here'}
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Student</th>
                  <th>Parent</th>
                  <th>School</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} onClick={() => openDrawer(order)} style={{ cursor: 'pointer' }}>
                    <td>
                      <span style={{ fontFamily: "monospace", fontWeight: 600 }}>
                        {order.order_number}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{order.student_name}</div>
                      {order.student_details && (
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          {order.student_details.class_name}{order.student_details.section ? `-${order.student_details.section}` : ''}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{order.parent_name || '—'}</div>
                      {order.parent_phone && (
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{order.parent_phone}</div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{order.school_name}</td>
                    <td style={{ textAlign: 'center' }}>
                      {order.items?.length ?? 0}
                    </td>
                    <td>
                      <strong>
                        ₹{parseFloat(order.total_amount).toLocaleString("en-IN")}
                      </strong>
                    </td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                      {new Date(order.created_at).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Drawer */}
      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Order ${selected?.order_number ?? ""}`}
        subtitle={selected?.student_name}
        width="520px"
      >
        {selected && (
          <>
            {/* Overview */}
            <DrawerSection title="Order Details" />
            <DrawerRow label="Order #" value={<span style={{ fontFamily: "monospace" }}>{selected.order_number}</span>} />
            <DrawerRow label="Date" value={new Date(selected.created_at).toLocaleString("en-IN")} />
            <DrawerRow label="Total" value={<strong style={{ color: '#059669', fontSize: '1.05rem' }}>₹{parseFloat(selected.total_amount).toLocaleString("en-IN")}</strong>} />
            <DrawerRow label="Current Status" value={<StatusBadge status={selected.status} />} />
            <DrawerRow label="Payment" value={`${selected.payment_method?.replace(/_/g, ' ')} (${selected.payment_status})`} />

            {/* Parent Details */}
            <DrawerSection title="Parent / Guardian" />
            <DrawerRow label="Name" value={selected.parent_name || '—'} />
            <DrawerRow label="Phone" value={selected.parent_phone || '—'} />
            <DrawerRow label="Email" value={selected.parent_email || '—'} />

            {/* Student Details */}
            <DrawerSection title="Student" />
            <DrawerRow label="Student" value={selected.student_name} />
            {selected.student_details && (
              <>
                <DrawerRow label="Class" value={`${selected.student_details.class_name}${selected.student_details.section ? ` - ${selected.student_details.section}` : ''}`} />
                {selected.student_details.roll_number && (
                  <DrawerRow label="Roll No" value={selected.student_details.roll_number} />
                )}
              </>
            )}
            <DrawerRow label="School" value={selected.school_name} />

            {/* Items */}
            {selected.items && selected.items.length > 0 && (
              <>
                <DrawerSection title="Items" />
                {selected.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #f1f5f9", fontSize: "0.875rem" }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{item.product_name}</div>
                      <div style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
                        {item.size}{item.color ? ` / ${item.color}` : ""} × {item.quantity}
                      </div>
                    </div>
                    <div style={{ fontWeight: 600 }}>₹{parseFloat(item.line_total).toLocaleString('en-IN')}</div>
                  </div>
                ))}
                {/* Totals */}
                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '2px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                    <span>Subtotal</span><span>₹{parseFloat(selected.subtotal).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700, marginTop: '0.25rem', color: '#0f172a' }}>
                    <span>Total</span><span>₹{parseFloat(selected.total_amount).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </>
            )}

            {/* Shipping Address */}
            {selected.shipping_address && (
              <>
                <DrawerSection title="Shipping Address" />
                <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                  {selected.shipping_name}<br />
                  {selected.shipping_address}<br />
                  {selected.shipping_city}, {selected.shipping_state} — {selected.shipping_pincode}<br />
                  📞 {selected.shipping_phone}
                </p>
              </>
            )}

            {/* Update Status */}
            <DrawerSection title="Update Status" />
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <select
                className="select"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                style={{ flex: 1 }}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              <button
                className="btn btn-primary"
                onClick={updateStatus}
                disabled={updating || newStatus === selected.status}
                style={{ whiteSpace: 'nowrap' }}
              >
                {updating ? "Updating…" : "Update"}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="drawer-actions" style={{ display: "flex", gap: "0.5rem", flexWrap: 'wrap' }}>
              <button
                onClick={() => downloadFile(`/orders/${selected.id}/invoice/`, `Invoice_${selected.order_number}.pdf`)}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                📄 Invoice
              </button>
              <button
                onClick={() => downloadFile(`/orders/${selected.id}/delivery-slip/`, `Slip_${selected.order_number}.pdf`)}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                🏷️ Slip
              </button>
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <Link
                href={`/vendor/orders/${selected.id}/print`}
                className="btn btn-outline"
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                onClick={() => setSelected(null)}
              >
                🖨️ Print Invoice Page
              </Link>
            </div>

            {/* Notes */}
            {selected.notes && (
              <>
                <DrawerSection title="Notes" />
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569' }}>{selected.notes}</p>
              </>
            )}
            {selected.cancelled_reason && (
              <>
                <DrawerSection title="Cancellation Reason" />
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#dc2626' }}>{selected.cancelled_reason}</p>
              </>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}
