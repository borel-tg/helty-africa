import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "convex/react";
import { ArrowLeft, CheckCircle, Circle, Award } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Select } from "../../components/ui/Input";
import { useConvexSession } from "../../hooks/useConvexSession";
import { ProgressBar } from "../../components/ui/Progress";
import { formatTimeAgo } from "../../lib/utils";

export default function LearnerDetailPage() {
  const { t } = useTranslation();
  const { learnerId } = useParams();
  const navigate = useNavigate();
  const { convexUser } = useConvexSession();
  const [programId, setProgramId] = useState(null);
  const orgId = convexUser?.organizationId;

  const learner = useQuery(
    api.users.getById,
    learnerId ? { userId: learnerId } : "skip"
  );

  const programOptions = useQuery(
    api.stats.getLearnerProgramOptions,
    learner?._id && orgId
      ? { userId: learner._id, organizationId: orgId }
      : "skip"
  );

  useEffect(() => {
    if (!programId && programOptions?.length) {
      const enrolled = programOptions.find((p) => p.enrolled);
      setProgramId(enrolled?._id ?? programOptions[0]._id);
    }
  }, [programId, programOptions]);

  const progressData = useQuery(
    api.stats.getLearnerModuleProgress,
    learner?._id && orgId && programId
      ? { userId: learner._id, organizationId: orgId, programId }
      : "skip"
  );

  if (!learner || programOptions === undefined) {
    return (
      <div className="p-6 text-center text-text-secondary">
        {t("common.loading")}
      </div>
    );
  }

  const moduleProgress = progressData?.modules ?? [];
  const overallPct =
    moduleProgress.length > 0
      ? Math.round(
          (moduleProgress.filter((m) => m.passed).length / moduleProgress.length) *
            100
        )
      : 0;

  return (
    <div className="p-4 md:p-6 w-full">
      <button
        type="button"
        onClick={() => navigate("/lead/learners")}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary mb-4"
      >
        <ArrowLeft size={16} /> {t("lead.backToTeam")}
      </button>

      <div className="bg-white rounded-card shadow-card p-5 mb-4">
        <h1 className="text-xl font-semibold">{learner.name}</h1>
        <p className="text-sm text-text-secondary mt-1">
          {t("lead.lastActiveLine", {
            email: learner.email,
            time: formatTimeAgo(learner.lastLoginAt),
          })}
        </p>
      </div>

      {programOptions.length > 0 && (
        <div className="bg-white rounded-card shadow-card p-4 mb-4">
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
        </div>
      )}

      {progressData && (
        <>
          <ProgressBar value={overallPct} className="mb-1" />
          <p className="text-xs text-text-secondary mb-4">
            {t("lead.modulesPassedOverall", { pct: overallPct })}
          </p>
        </>
      )}

      {!progressData ? (
        <div className="p-6 text-center text-text-secondary">{t("common.loading")}</div>
      ) : (
        <div className="space-y-3">
          {moduleProgress.map(
            ({ module: mod, lessons, lessonProgress, passed, bestScore }) => (
              <div key={mod._id} className="bg-white rounded-card shadow-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-text-primary">{mod.title}</h2>
                  {passed && <Award size={18} className="text-primary" />}
                </div>
                <div className="space-y-1">
                  {lessons.map((lesson) => {
                    const p = lessonProgress.find(
                      (row) => row.lessonId === lesson._id
                    );
                    return (
                      <div
                        key={lesson._id}
                        className="flex items-center gap-2 text-sm"
                      >
                        {p?.completed ? (
                          <CheckCircle size={14} className="text-green-500" />
                        ) : (
                          <Circle size={14} className="text-gray-300" />
                        )}
                        <span>{lesson.title}</span>
                      </div>
                    );
                  })}
                </div>
                {bestScore != null && (
                  <p className="text-xs text-text-secondary mt-2">
                    {t("lead.bestExamScore", { score: bestScore })}
                  </p>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
