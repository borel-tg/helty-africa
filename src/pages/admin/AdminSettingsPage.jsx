import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useTranslation } from "react-i18next";
import { Building2 } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { useToast } from "../../components/ui/Toast";
import { useConvexSession } from "../../hooks/useConvexSession";

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { convexUser } = useConvexSession();
  const updateName = useMutation(api.organizations.updateName);

  const organization = useQuery(
    api.organizations.get,
    convexUser?.organizationId
      ? { organizationId: convexUser.organizationId }
      : "skip"
  );

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (organization?.name) {
      setName(organization.name);
    }
  }, [organization?.name]);

  const handleSave = async () => {
    if (!convexUser?._id || !convexUser.organizationId) return;
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(t("admin.organizationNameRequired"));
      return;
    }

    setSaving(true);
    try {
      await updateName({
        organizationId: convexUser.organizationId,
        name: trimmed,
      });
      toast.success(t("admin.organizationNameSaved"));
    } catch (err) {
      toast.error(err.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  if (organization === undefined) {
    return (
      <div className="p-6 text-sm text-text-secondary">{t("common.loading")}</div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          {t("admin.settingsTitle")}
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {t("admin.settingsSubtitle")}
        </p>
      </div>

      <Card className="p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary">
              {t("admin.organizationSettings")}
            </h2>
            <p className="text-sm text-text-secondary">
              {t("admin.organizationSettingsHint")}
            </p>
          </div>
        </div>

        <Input
          label={t("admin.orgName")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("admin.organizationNamePlaceholder")}
        />

        <div className="flex justify-end">
          <Button loading={saving} onClick={handleSave}>
            {t("common.save")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
