import React, { useState } from 'react';
import { Plus, Edit2, UserX, Search, Shield } from 'lucide-react';
import { usersAPI, authAPI } from '../utils/api';
import { fmtDate, initials, timeAgo } from '../utils/helpers';
import { StatusPill, EmptyState, SkeletonRows, ConfirmDialog } from '../components/common/index.jsx';
import Modal from '../components/common/Modal.jsx';
import { usePagination, useDebounce } from '../hooks/useAsync';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ROLES = ['admin', 'manager', 'cashier', 'viewer'];

const ROLE_COLORS = {
  admin:   'bg-blue-100 text-blue-700',
  manager: 'bg-emerald-100 text-emerald-700',
  cashier: 'bg-amber-100 text-amber-700',
  viewer:  'bg-gray-100 text-gray-600',
};

const ROLE_PERMS = {
  admin:   ['Full system access', 'Manage users', 'All reports', 'All CRUD'],
  manager: ['Products CRUD', 'Orders management', 'Invoices', 'Inventory', 'Analytics'],
  cashier: ['View products', 'Create orders', 'Create invoices', 'View inventory'],
  viewer:  ['View products', 'View orders', 'View invoices', 'View analytics'],
};

const EMPTY_FORM = {
  name: '', email: '', password: '', role: 'manager', department: '',
};

const EDIT_FORM = {
  name: '', role: 'viewer', department: '', isActive: true,
};

export default function Users() {
  const { user: currentUser } = useAuth();
  const [search,    setSearch]    = useState('');
  const [addModal,  setAddModal]  = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [editForm,  setEditForm]  = useState(EDIT_FORM);
  const [saving,    setSaving]    = useState(false);
  const [deacting,  setDeacting]  = useState(null);
  const [showPerms, setShowPerms] = useState(false);

  const dSearch = useDebounce(search, 350);

  const { data: users, loading, load } = usePagination(
    usersAPI.getAll, {}
  );

  const filtered = users?.filter(u =>
    !dSearch ||
    u.name.toLowerCase().includes(dSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(dSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(dSearch.toLowerCase())
  ) || [];

  const set     = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setEdit = (k) => (e) => setEditForm(f => ({ ...f, [k]: e.target.value }));

  const openEdit = (u) => {
    setEditing(u);
    setEditForm({
      name: u.name,
      role: u.role,
      department: u.department || '',
      isActive: u.isActive,
    });
    setEditModal(true);
  };

  // ── Create staff account with correct role ─────────────
  const handleAdd = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error('Name, email and password are required');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      // registerStaff is admin-only — assigns the role properly
      await authAPI.registerStaff({
        name:       form.name,
        email:      form.email,
        password:   form.password,
        role:       form.role,
        department: form.department,
      });
      toast.success(`${form.role} account created for ${form.name}`);
      setAddModal(false);
      setForm(EMPTY_FORM);
      load(1);
    } catch { /* handled globally by axios interceptor */ }
    finally { setSaving(false); }
  };

  // ── Edit existing user ─────────────────────────────────
  const handleEdit = async () => {
    setSaving(true);
    try {
      await usersAPI.update(editing._id, editForm);
      toast.success('User updated successfully');
      setEditModal(false);
      load(1);
    } catch { /* handled globally */ }
    finally { setSaving(false); }
  };

  // ── Deactivate user ────────────────────────────────────
  const handleDeactivate = async (id) => {
    try {
      await usersAPI.deactivate(id);
      toast.success('User deactivated');
      load(1);
    } catch { /* handled globally */ }
  };

  // Role count stats
  const roleCounts = ROLES.reduce((acc, r) => {
    acc[r] = users?.filter(u => u.role === r).length || 0;
    return acc;
  }, {});

  return (
    <div className="space-y-5">

      {/* Role stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ROLES.map(role => (
          <div key={role} className="stat-card">
            <div className="flex items-center justify-between">
              <div className="stat-label capitalize">{role}s</div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[role]}`}>
                {role}
              </span>
            </div>
            <div className="stat-value">{roleCounts[role]}</div>
            <div className="text-xs text-gray-400">{ROLE_PERMS[role][0]}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users…"
            className="input pl-8"
          />
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setShowPerms(true)} className="btn">
            <Shield size={14} /> Permissions
          </button>
          <button
            onClick={() => { setForm(EMPTY_FORM); setAddModal(true); }}
            className="btn btn-primary"
          >
            <Plus size={14} /> Add user
          </button>
        </div>
      </div>

      {/* Users table */}
      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Department</th>
                <th>Last login</th>
                <th>Created</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <SkeletonRows rows={6} cols={7} />
                : !filtered.length
                ? (
                  <tr><td colSpan={7}>
                    <EmptyState
                      icon={Search}
                      title="No users found"
                      action={
                        <button onClick={() => setAddModal(true)} className="btn btn-primary">
                          <Plus size={14} /> Add user
                        </button>
                      }
                    />
                  </td></tr>
                )
                : filtered.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${ROLE_COLORS[u.role]}`}>
                          {initials(u.name)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 flex items-center gap-1.5">
                            {u.name}
                            {u._id === currentUser?._id && (
                              <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">You</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`pill ${ROLE_COLORS[u.role]} capitalize`}>{u.role}</span>
                    </td>
                    <td className="text-gray-500 text-sm">{u.department || '—'}</td>
                    <td className="text-gray-400 text-xs">
                      {u.lastLogin ? timeAgo(u.lastLogin) : 'Never'}
                    </td>
                    <td className="text-gray-400 text-xs">{fmtDate(u.createdAt)}</td>
                    <td><StatusPill status={u.isActive ? 'active' : 'inactive'} /></td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(u)}
                          className="btn btn-sm btn-icon text-gray-500"
                          title="Edit user"
                        >
                          <Edit2 size={13} />
                        </button>
                        {u._id !== currentUser?._id && u.isActive && (
                          <button
                            onClick={() => setDeacting(u._id)}
                            className="btn btn-sm btn-icon text-red-500"
                            title="Deactivate user"
                          >
                            <UserX size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ADD USER MODAL ─────────────────────────────── */}
      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        title="Add new staff member"
        footer={<>
          <button className="btn" onClick={() => setAddModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
            {saving ? 'Creating…' : 'Create account'}
          </button>
        </>}
      >
        <div className="space-y-4">

          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
            This creates a staff account with the role you select. The user can login immediately with the email and password you set.
          </div>

          <div className="form-row">
            <label className="input-label">Full name *</label>
            <input
              className="input"
              value={form.name}
              onChange={set('name')}
              placeholder="e.g. Sarah Ahmed"
            />
          </div>

          <div className="form-row">
            <label className="input-label">Email address *</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="sarah@yourcompany.com"
            />
          </div>

          <div className="form-row">
            <label className="input-label">Password *</label>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="Min 8 characters"
            />
          </div>

          <div className="form-grid-2">
            <div className="form-row">
              <label className="input-label">Role *</label>
              <select className="input" value={form.role} onChange={set('role')}>
                {ROLES.map(r => (
                  <option key={r} value={r} className="capitalize">{r}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label className="input-label">Department</label>
              <input
                className="input"
                value={form.department}
                onChange={set('department')}
                placeholder="e.g. Billing"
              />
            </div>
          </div>

          {/* Role permissions preview */}
          {form.role && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                {form.role} can do
              </div>
              <ul className="space-y-1">
                {ROLE_PERMS[form.role].map((p, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Modal>

      {/* ── EDIT USER MODAL ────────────────────────────── */}
      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title={`Edit — ${editing?.name}`}
        footer={<>
          <button className="btn" onClick={() => setEditModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleEdit} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </>}
      >
        <div className="space-y-4">
          <div className="form-row">
            <label className="input-label">Full name</label>
            <input className="input" value={editForm.name} onChange={setEdit('name')} />
          </div>
          <div className="form-grid-2">
            <div className="form-row">
              <label className="input-label">Role</label>
              <select
                className="input"
                value={editForm.role}
                onChange={setEdit('role')}
                disabled={editing?._id === currentUser?._id}
              >
                {ROLES.map(r => (
                  <option key={r} value={r} className="capitalize">{r}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label className="input-label">Department</label>
              <input
                className="input"
                value={editForm.department}
                onChange={setEdit('department')}
                placeholder="e.g. Inventory"
              />
            </div>
          </div>
          <div className="form-row">
            <label className="input-label">Account status</label>
            <select
              className="input"
              value={editForm.isActive ? 'true' : 'false'}
              onChange={e => setEditForm(f => ({ ...f, isActive: e.target.value === 'true' }))}
              disabled={editing?._id === currentUser?._id}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              {editForm.role} permissions
            </div>
            <ul className="space-y-1">
              {ROLE_PERMS[editForm.role]?.map((p, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Modal>

      {/* ── PERMISSIONS OVERVIEW MODAL ─────────────────── */}
      <Modal
        open={showPerms}
        onClose={() => setShowPerms(false)}
        title="Role permissions overview"
        size="lg"
      >
        <div className="grid grid-cols-2 gap-4">
          {ROLES.map(role => (
            <div key={role} className="border border-gray-100 rounded-xl p-4">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold mb-3 capitalize ${ROLE_COLORS[role]}`}>
                <Shield size={11} />
                {role}
              </div>
              <ul className="space-y-1.5">
                {ROLE_PERMS[role].map((p, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Modal>

      {/* ── DEACTIVATE CONFIRM ─────────────────────────── */}
      <ConfirmDialog
        open={!!deacting}
        onClose={() => setDeacting(null)}
        onConfirm={() => handleDeactivate(deacting)}
        title="Deactivate user"
        message="This user will lose access immediately. You can reactivate them later by editing their account."
        danger
      />

    </div>
  );
}
