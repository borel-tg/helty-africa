import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Users,
  BookOpen,
  Award,
  TrendingUp,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Card, CardBody } from "../../components/ui/Card";
import { ProgressBar } from "../../components/ui/Progress";
import { Button } from "../../components/ui/Button";
import { MOCK_STATS, MOCK_EMPLOYEES, MOCK_MODULES } from "../../lib/mockData";

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary mb-1">{label}</p>
          <p className="text-3xl font-bold text-text-primary">{value}</p>
          {sub && <p className="text-xs text-text-secondary mt-1">{sub}</p>}
        </div>
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}
        >
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </Card>
  );
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const stats = MOCK_STATS;

  return (
    <div className="p-4 md:p-6 w-full space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t("admin.activeLearners")}
          value={stats.totalEmployees}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          label={t("admin.publishedModules")}
          value={stats.totalModulesPublished}
          icon={BookOpen}
          color="bg-primary"
        />
        <StatCard
          label={t("admin.completionRate")}
          value={`${stats.overallCompletionRate}%`}
          icon={Award}
          color="bg-green-500"
          sub={t("admin.learnersPassedAll")}
        />
        <StatCard
          label={t("admin.avgTimeModule")}
          value={stats.avgTimePerModule}
          icon={Clock}
          color="bg-secondary"
        />
      </div>

      {/* Module Performance */}
      <Card>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">
            {t("admin.modulePerformance")}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/stats")}
          >
            {t("admin.viewAll")}
            <ChevronRight size={14} />
          </Button>
        </div>
        <div className="divide-y divide-gray-50">
          {stats.moduleStats.map((m) => (
            <div key={m.moduleId} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="text-sm font-medium text-text-primary">
                  {m.title}
                </h3>
                <span className="text-sm font-bold text-primary whitespace-nowrap">
                  {t("admin.avgScore", { score: m.avgScore })}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-secondary mb-2">
                <span className="flex items-center gap-1">
                  <CheckCircle size={11} className="text-green-500" />
                  {t("admin.passedCount", { count: m.passed })}
                </span>
                <span className="flex items-center gap-1">
                  <XCircle size={11} className="text-red-400" />
                  {t("admin.failedCount", { count: m.failed })}
                </span>
                <span>{t("admin.startedCount", { count: m.started })}</span>
              </div>
              <ProgressBar
                value={m.passed}
                max={m.started}
                size="sm"
                color="success"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: t("admin.createModule"),
            icon: BookOpen,
            to: "/admin/modules",
            color: "bg-primary-50 text-primary border-primary-100",
          },
          {
            label: t("admin.inviteLearner"),
            icon: Users,
            to: "/admin/learners",
            color: "bg-secondary-50 text-secondary border-secondary-100",
          },
          {
            label: t("admin.viewStats"),
            icon: TrendingUp,
            to: "/admin/stats",
            color: "bg-blue-50 text-blue-600 border-blue-100",
          },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.to)}
            className={`flex items-center gap-3 p-4 rounded-card border transition-all duration-150 hover:shadow-card ${action.color}`}
          >
            <action.icon size={20} />
            <span className="text-sm font-semibold">{action.label}</span>
            <ChevronRight size={14} className="ml-auto" />
          </button>
        ))}
      </div>

      {/* Recent learners */}
      <Card>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">
            Recent Learners
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/learners")}
          >
            View All <ChevronRight size={14} />
          </Button>
        </div>
        <div className="divide-y divide-gray-50">
          {MOCK_EMPLOYEES.slice(0, 5).map((emp) => (
            <div
              key={emp._id}
              className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer"
              onClick={() => navigate(`/admin/learners/${emp._id}`)}
            >
              <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                <span className="text-primary text-sm font-semibold">
                  {emp.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {emp.name}
                </p>
                <p className="text-xs text-text-secondary capitalize">
                  {emp.role.replace("_", " ")}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  emp.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {emp.status}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
