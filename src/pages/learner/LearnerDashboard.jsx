import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "convex/react";
import { Play, ChevronRight, Clock } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../hooks/useAuth";
import { useConvexSession } from "../../hooks/useConvexSession";
import { Card } from "../../components/ui/Card";
import { ProgressBar } from "../../components/ui/Progress";
import { TrainingProgramCard } from "../../components/learner/TrainingProgramCard";
import { useAvailablePrograms } from "../../hooks/useProgramEvaluation";
import { useRecentModules } from "../../hooks/useRecentModules";

function RecentModuleRow({ entry }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const progressData = useQuery(
    api.progress.getModuleProgress,
    entry.moduleId ? { moduleId: entry.moduleId } : "skip"
  );

  const lessons = useQuery(
    api.lessons.listByModule,
    entry.moduleId ? { moduleId: entry.moduleId } : "skip"
  );

  const total = lessons?.length ?? 0;
  const completed =
    progressData?.filter((p) => p.completed).length ?? 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <button
      type="button"
      onClick={() => navigate(`/learn/module/${entry.moduleId}`)}
      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left border border-gray-100"
    >
      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
        <Play size={18} className="text-primary ml-0.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {entry.moduleTitle}
        </p>
        <p className="text-xs text-text-secondary truncate">
          {entry.programTitle}
        </p>
        <ProgressBar value={pct} className="mt-1.5" size="xs" />
      </div>
      <div className="shrink-0 text-right">
        <span className="text-xs font-medium text-primary">
          {t("learner.resume")}
        </span>
        <ChevronRight size={14} className="text-gray-300 ml-auto" />
      </div>
    </button>
  );
}

export default function LearnerDashboard() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { convexUser } = useConvexSession();
  const navigate = useNavigate();
  const { programs, isLoading: programsLoading } = useAvailablePrograms();
  const enrollMutation = useMutation(api.trainingPrograms.enroll);

  const enrolledPrograms = programs.filter((p) => p.enrolled);
  const discoverPrograms = programs.filter((p) => !p.enrolled && p.canJoin);

  const { recentModules, isLoading: recentLoading } =
    useRecentModules(enrolledPrograms, 3);

  const onJoinProgram = async (program) => {
    if (!convexUser?._id) return;
    await enrollMutation({
      programId: program._id,
      organizationId: convexUser.organizationId,
    });
    navigate(`/learn/program/${program._id}`);
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-text-primary">
          {t("learner.hello", { name: currentUser?.name?.split(" ")[0] })}
        </h2>
        <p className="text-text-secondary mt-1">{t("trainings.homeSubtitle")}</p>
      </div>

      {(recentLoading || recentModules.length > 0) && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={18} className="text-primary" />
            <h2 className="text-base font-semibold text-text-primary">
              {t("trainings.continueLearning")}
            </h2>
          </div>
          {recentLoading ? (
            <p className="text-sm text-text-secondary">{t("common.loading")}</p>
          ) : (
            <div className="space-y-2">
              {recentModules.map((entry) => (
                <RecentModuleRow
                  key={`${entry.moduleId}-${entry.accessedAt}`}
                  entry={entry}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="text-base font-semibold text-text-primary mb-3">
          {t("trainings.yourTrainings")}
        </h2>
        {programsLoading ? (
          <p className="text-sm text-text-secondary">{t("common.loading")}</p>
        ) : enrolledPrograms.length === 0 ? (
          <Card className="p-6 text-center text-text-secondary text-sm">
            {t("trainings.noEnrollments")}
          </Card>
        ) : (
          <div className="space-y-3">
            {enrolledPrograms.map((program) => (
              <TrainingProgramCard key={program._id} program={program} />
            ))}
          </div>
        )}
      </section>

      {discoverPrograms.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-3">
            {t("trainings.discoverTrainings")}
          </h2>
          <div className="space-y-3">
            {discoverPrograms.map((program) => (
              <TrainingProgramCard
                key={program._id}
                program={program}
                onJoin={onJoinProgram}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
