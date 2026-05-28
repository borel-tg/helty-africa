import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search, UserPlus, Filter, MoreVertical, ChevronRight,
  Mail, Phone, Shield, UserX, UserCheck, Trash2, KeyRound,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { RoleBadge } from "../../components/ui/Badge";
import { Modal, ConfirmModal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import { MOCK_EMPLOYEES, MOCK_INVITATIONS, MOCK_USERS } from "../../lib/mockData";
import { formatTimeAgo } from "../../lib/utils";
function InviteModal({ open, onClose }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("learner");
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    toast.success(t("admin.invitationSentTo", { email }));
    setEmail("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={t("admin.inviteLearner")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
          <Button loading={loading} onClick={handleInvite}>{t("admin.sendInvitation")}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label={`${t("admin.emailAddress")} *`} type="email" placeholder={t("admin.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} leftIcon={<Mail size={16} />} />
        <Select label={t("admin.role")} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="learner">{t("roles.learner")}</option>
          <option value="lead">{t("roles.lead")}</option>
          <option value="admin">{t("roles.admin")}</option>
        </Select>
        <div className="bg-primary-50 rounded-lg p-3 text-sm text-primary-700">
          {t("admin.invitationMagicLink")}
        </div>
      </div>
    </Modal>
  );
}

function CreateManualModal({ open, onClose }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "learner", tempPassword: "" });
  const [loading, setLoading] = useState(false);
  const update = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    toast.success(t("admin.accountCreatedFor", { name: form.name }));
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={t("admin.createManually")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
          <Button loading={loading} onClick={handleCreate}>{t("admin.createAccount")}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label={`${t("admin.fullName")} *`} placeholder={t("admin.fullNamePlaceholder")} value={form.name} onChange={update("name")} />
        <Input label={t("admin.phoneOptional")} type="email" placeholder={t("admin.emailPlaceholder")} value={form.email} onChange={update("email")} leftIcon={<Mail size={16} />} />
        <Input label={`${t("admin.phoneNumber")} *`} type="tel" placeholder={t("admin.phonePlaceholder")} value={form.phone} onChange={update("phone")} leftIcon={<Phone size={16} />} />
        <Select label={t("admin.role")} value={form.role} onChange={update("role")}>
          <option value="learner">{t("roles.learner")}</option>
          <option value="lead">{t("roles.lead")}</option>
          <option value="admin">{t("roles.admin")}</option>
        </Select>
        <Input label={`${t("admin.tempPassword")} *`} type="password" placeholder={t("admin.tempPasswordPlaceholder")} value={form.tempPassword} onChange={update("tempPassword")} />
        <p className="text-xs text-text-secondary">{t("admin.changePasswordHint")}</p>
      </div>
    </Modal>
  );
}

export default function EmployeesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [employees, setEmployees] = useState(MOCK_EMPLOYEES);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showInvite, setShowInvite] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const invitations = MOCK_INVITATIONS;

  const pendingInvites = invitations.filter((inv) => inv.status === "pending").length;
  const signedUpInvites = invitations.filter((inv) => inv.status === "signed_up").length;
  const expiredInvites = invitations.filter((inv) => inv.status === "expired").length;
  const activationRate =
    invitations.length > 0 ? Math.round((signedUpInvites / invitations.length) * 100) : 0;

  const filtered = employees.filter((e) => {
    const matchSearch =
      !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email?.toLowerCase().includes(search.toLowerCase()) ||
      e.phone?.includes(search);
    const matchRole = roleFilter === "all" || e.role === roleFilter;
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const toggleStatus = (emp) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e._id === emp._id
          ? { ...e, status: e.status === "active" ? "inactive" : "active" }
          : e
      )
    );
    toast.success(
      emp.status === "active"
        ? t("admin.deactivated", { name: emp.name })
        : t("admin.reactivated", { name: emp.name })
    );
    setDeactivateTarget(null);
    setOpenMenu(null);
  };

  const leadName = (emp) => {
    if (!emp.leadId) return "—";
    const lead = employees.find((e) => e._id === emp.leadId);
    return lead?.name || "—";
  };

  return (
    <div className="p-4 md:p-6 w-full">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">{t("admin.learnersTitle")}</h2>
          <p className="text-sm text-text-secondary mt-0.5">
            {t("admin.activeLearnersCount", {
              count: employees.filter((e) => e.status === "active").length,
            })}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreate(true)}
            className="w-full sm:w-auto justify-center"
          >
            <UserPlus size={14} /> {t("admin.manualCreate")}
          </Button>
          <Button
            size="sm"
            onClick={() => setShowInvite(true)}
            className="w-full sm:w-auto justify-center"
          >
            <Mail size={14} /> {t("admin.invite")}
          </Button>
        </div>
      </div>

      {/* Funnel stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-card shadow-card p-4">
          <p className="text-xs text-text-secondary">{t("admin.totalLearners")}</p>
          <p className="text-2xl font-bold text-text-primary">{employees.length}</p>
        </div>
        <div className="bg-white rounded-card shadow-card p-4">
          <p className="text-xs text-text-secondary">{t("admin.pendingInvites")}</p>
          <p className="text-2xl font-bold text-amber-600">{pendingInvites}</p>
        </div>
        <div className="bg-white rounded-card shadow-card p-4">
          <p className="text-xs text-text-secondary">{t("status.signed_up")}</p>
          <p className="text-2xl font-bold text-green-600">{signedUpInvites}</p>
        </div>
        <div className="bg-white rounded-card shadow-card p-4">
          <p className="text-xs text-text-secondary">{t("admin.activationRate")}</p>
          <p className="text-2xl font-bold text-primary">{activationRate}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t("admin.searchLearners")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-gray-200 rounded-input px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">{t("admin.allRoles")}</option>
          <option value="learner">{t("roles.learner")}</option>
          <option value="lead">{t("roles.lead")}</option>
          <option value="admin">{t("roles.admin")}</option>
          <option value="super_admin">{t("roles.super_admin")}</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-input px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">{t("admin.allStatus")}</option>
          <option value="active">{t("status.active")}</option>
          <option value="inactive">{t("status.inactive")}</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-card shadow-card overflow-hidden">
        {/* Desktop table header */}
        <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50 text-xs font-medium text-text-secondary uppercase tracking-wide">
          <span>Learner</span>
          <span>Contact</span>
          <span>Role</span>
          <span>Lead</span>
          <span>Last Login</span>
          <span></span>
        </div>

        <div className="divide-y divide-gray-50">
          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-text-secondary">
              No learners match your filters.
            </div>
          )}
          {filtered.map((emp) => (
            <div key={emp._id}
              className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-2 md:gap-4 px-5 py-3 hover:bg-gray-50 items-center relative">
              {/* Learner */}
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${emp.status === "inactive" ? "bg-gray-100" : "bg-primary-100"}`}>
                  <span className={`text-sm font-semibold ${emp.status === "inactive" ? "text-gray-400" : "text-primary"}`}>
                    {emp.name.charAt(0)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${emp.status === "inactive" ? "text-text-secondary" : "text-text-primary"}`}>
                    {emp.name}
                    {emp.status === "inactive" && <span className="ml-1 text-xs text-gray-400">(inactive)</span>}
                  </p>
                  <p className="text-xs text-text-secondary truncate md:hidden">{emp.email}</p>
                </div>
              </div>
              {/* Contact */}
              <div className="hidden md:block">
                <p className="text-xs text-text-secondary truncate">{emp.email || "—"}</p>
                <p className="text-xs text-text-secondary">{emp.phone || "—"}</p>
              </div>
              {/* Role */}
              <div><RoleBadge role={emp.role} /></div>
              {/* Lead */}
              <div className="hidden md:block text-xs text-text-secondary">{leadName(emp)}</div>
              {/* Last login */}
              <div className="hidden md:block text-xs text-text-secondary">{formatTimeAgo(emp.lastLoginAt)}</div>
              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigate(`/admin/learners/${emp._id}`)}
                  className="p-2 text-gray-400 hover:text-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <ChevronRight size={16} />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setOpenMenu(openMenu === emp._id ? null : emp._id)}
                    className="p-2 text-gray-400 hover:text-text-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {openMenu === emp._id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-card shadow-modal border border-gray-100 z-10">
                      <button onClick={() => { toast.success(`Password reset sent to ${emp.name}`); setOpenMenu(null); }}
                        className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-text-secondary hover:bg-gray-50">
                        <KeyRound size={14} /> Reset Password
                      </button>
                      <button onClick={() => { setDeactivateTarget(emp); setOpenMenu(null); }}
                        className={`flex items-center gap-2 w-full px-3 py-2.5 text-sm hover:bg-gray-50 ${emp.status === "active" ? "text-amber-600" : "text-green-600"}`}>
                        {emp.status === "active" ? <UserX size={14} /> : <UserCheck size={14} />}
                        {emp.status === "active" ? "Deactivate" : "Reactivate"}
                      </button>
                      <button className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-500 hover:bg-red-50">
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invitations pipeline */}
      <div className="bg-white rounded-card shadow-card overflow-hidden mt-4">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-base font-semibold text-text-primary">Invitations</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {invitations.map((inv) => (
            <div key={inv._id} className="px-5 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{inv.email}</p>
                <p className="text-xs text-text-secondary">
                  Invited {formatTimeAgo(inv.invitedAt)}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  inv.status === "signed_up"
                    ? "bg-green-100 text-green-700"
                    : inv.status === "pending"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {inv.status === "signed_up"
                  ? "Signed Up"
                  : inv.status === "pending"
                  ? "Pending"
                  : "Expired"}
              </span>
              <Button variant="ghost" size="xs">Resend</Button>
            </div>
          ))}
        </div>
      </div>

      <InviteModal open={showInvite} onClose={() => setShowInvite(false)} />
      <CreateManualModal open={showCreate} onClose={() => setShowCreate(false)} />
      <ConfirmModal
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => toggleStatus(deactivateTarget)}
        title={deactivateTarget?.status === "active" ? "Deactivate Learner" : "Reactivate Learner"}
        message={deactivateTarget?.status === "active"
          ? `Deactivate ${deactivateTarget?.name}? They will lose access immediately but their data is retained.`
          : `Reactivate ${deactivateTarget?.name}? They will regain access to the platform.`}
        confirmLabel={deactivateTarget?.status === "active" ? "Deactivate" : "Reactivate"}
        confirmVariant={deactivateTarget?.status === "active" ? "danger" : "primary"}
      />
    </div>
  );
}
