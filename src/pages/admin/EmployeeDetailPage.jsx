import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "convex/react";
import {
  ArrowLeft,
  CheckCircle,
  Circle,
  Clock,
  Award,
  RotateCcw,
  RefreshCcw,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Input";
import { RoleBadge } from "../../components/ui/Badge";
import { useToast } from "../../components/ui/Toast";
import { useConvexSession } from "../../hooks/useConvexSession";
import { getLearnerCategoryLabel } from "../../lib/learnerCategories";
import { formatDate, formatTimeAgo, formatDuration } from "../../lib/utils";

export default function EmployeeDetailPage() {
  const { t, i18n } = useTranslation();
  const { empId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { convexUser } = useConvexSession();
  const resetProgress = useMutation(api.progress.resetModuleProgress);
  const [programId, setProgramId] = useState(null);

  const orgId = convexUser?.organizationId;

  const emp = useQuery(api.users.getById, empId ? { userId: empId } : "skip");

  const programOptions = useQuery(
    api.stats.getLearnerProgramOptions,
    emp?._id && orgId ? { userId: emp._id, organizationId: orgId } : "skip"
  );

  useEffect(() => {
    if (!programId && programOptions?.length) {
      const enrolled = programOptions.find((p) => p.enrolled);
      setProgramId(enrolled?._id ?? programOptions[0]._id);
    }
  }, [programId, programOptions]);

  const progressData = useQuery(
    api.stats.getLearnerModuleProgress,
    emp?._id && orgId && programId
      ? { userId: emp._id, organizationId: orgId, programId }
      : "skip"
  );

  if (!emp || programOptions === undefined) {
    return (
      <div className="p-6 text-center text-text-secondary">
        {t("common.loading")}
      </div>
    );
  }

  if (programOptions.length === 0) {
    return (
      <div className="p-4 md:p-6 w-full">
        <BackLink onBack={() => navigate("/admin/learners")} label={t("admin.backToLearners")} />
        <LearnerHeader emp={emp} t={t} i18n={i18n} />
        <p className="text-sm text-text-secondary text-center py-8">
          {t("admin.noProgramsPublished")}
        </p>
      </div>
    );
  }

  const moduleProgress = progressData?.modules ?? [];
  const selectedProgram = programOptions.find((p) => p._id === programId);

  return (
    <div className="p-4 md:p-6 w-full">
      <BackLink onBack={() => navigate("/admin/learners")} label={t("admin.backToLearners")} />

      <LearnerHeader emp={emp} t={t} i18n={i18n} />

      <div className="bg-white rounded-card shadow-card p-4 md:p-5 mb-4 space-y-3">
        <Select
          label={t("admin.learnerDetailProgram")}
          value={programId ?? ""}
          onChange={(e) => setProgramId(e.target.value)}
        >
          {programOptions.map((p) => (
            <option key={p._id} value={p._id}>
              {p.title}
              {!p.enrolled ? ` — ${t("admin.programNotEnrolledShort")}` : ""}
            </option>
          ))}
        </Select>
        {selectedProgram && (
          <div className="flex flex-wrap gap-2">
            {selectedProgram.enrolled ? (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  selectedProgram.passed
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {selectedProgram.passed
                  ? t("admin.programEnrollmentPassed")
                  : t("admin.programEnrollmentActive")}
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800">
                {t("admin.learnerNotEnrolledInProgram")}
              </span>
            )}
          </div>
        )}
      </div>

      {!progressData ? (
        <div className="p-6 text-center text-text-secondary">{t("common.loading")}</div>
      ) : moduleProgress.length === 0 ? (
        <p className="text-sm text-text-secondary text-center py-8">
          {t("admin.noModulesInProgram")}
        </p>
      ) : (
        <div className="space-y-4">
          {moduleProgress.map(
            ({
              module: mod,
              lessons,
              lessonProgress,
              completedLessons,
              totalLessons,
              bestScore,
              passed,
              attemptCount,
            }) => (
              <div
                key={mod._id}
                className="bg-white rounded-card shadow-card overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="text-base font-semibold text-text-primary">
                      {mod.title}
                    </h2>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {t("admin.lessonsCountShort", {
                        done: completedLessons,
                        total: totalLessons,
                      })}
                      {bestScore != null &&
                        t("admin.bestScoreInline", { score: bestScore })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() =>
                        toast.success(t("admin.contactAdminResetRetakes"))
                      }
                    >
                      <RotateCcw size={12} /> {t("admin.resetRetakes")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={async () => {
                        await resetProgress({
                          userId: emp._id,
                          moduleId: mod._id,
                        });
                        toast.success(t("admin.progressReset"));
                      }}
                    >
                      <RefreshCcw size={12} /> {t("admin.resetProgress")}
                    </Button>
                  </div>
                </div>

                <div className="px-5 py-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {lessons.map((lesson) => {
                      const p = lessonProgress.find(
                        (row) => row.lessonId === lesson._id
                      );
                      return (
                        <div
                          key={lesson._id}
                          className="flex items-center gap-2 p-2 rounded bg-gray-50"
                        >
                          {p?.completed ? (
                            <CheckCircle
                              size={14}
                              className="text-green-500 shrink-0"
                            />
                          ) : (
                            <Circle size={14} className="text-gray-300 shrink-0" />
                          )}
                          <span className="text-xs text-text-primary truncate flex-1">
                            {lesson.title}
                          </span>
                          {p && (
                            <span className="text-[10px] text-text-secondary flex items-center gap-0.5 shrink-0">
                              <Clock size={9} />
                              {formatDuration(p.timeSpentSeconds ?? 0)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                    {t("admin.examAttemptsTitle")}
                  </h3>
                  {attemptCount === 0 ? (
                    <p className="text-xs text-text-secondary">
                      {t("admin.noExamAttempts")}
                    </p>
                  ) : (
                    <p className="text-sm text-text-secondary">
                      {t("admin.examAttemptCount", { count: attemptCount })}
                      {bestScore != null &&
                        t("admin.examBestShort", { score: bestScore })}
                      {passed ? ` · ${t("status.passed").toUpperCase()}` : ""}
                    </p>
                  )}

                  {passed && (
                    <div className="mt-3 flex items-center gap-2 p-2.5 bg-primary-50 rounded">
                      <Award size={16} className="text-primary" />
                      <span className="text-sm font-medium text-primary">
                        {t("admin.moduleExamPassed")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function BackLink({ onBack, label }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary mb-4 transition-colors"
    >
      <ArrowLeft size={16} /> {label}
    </button>
  );
}

function LearnerHeader({ emp, t, i18n }) {
  return (
    <div className="bg-white rounded-card shadow-card p-5 mb-4">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
          <span className="text-primary text-xl font-bold">
            {emp.name.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-xl font-semibold text-text-primary">{emp.name}</h1>
            <RoleBadge role={emp.role} />
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                emp.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {t(`status.${emp.status}`)}
            </span>
            {emp.role === "learner" && emp.learnerCategoryKey && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700">
                {getLearnerCategoryLabel(emp.learnerCategoryKey, i18n.language)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
            {emp.email && <span>{emp.email}</span>}
            {emp.phone && <span>{emp.phone}</span>}
            <span>
              {t("admin.enrolled")} {formatDate(emp.createdAt)}
            </span>
            <span>
              {t("admin.lastLogin")} {formatTimeAgo(emp.lastLoginAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
