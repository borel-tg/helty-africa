import { useState } from "react";
import { Award } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { FileUpload } from "../../components/ui/FileUpload";
import { useToast } from "../../components/ui/Toast";

export default function CertificateTemplatePage() {
  const toast = useToast();
  const [form, setForm] = useState({
    orgName: "PolioFree Africa NGO",
    signatureLine: "Dr. Amara Diallo, Training Director",
    borderColor: "#2E7D64",
    logoUrl: null,
    backgroundImageUrl: null,
  });
  const [saving, setSaving] = useState(false);
  const update = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success("Certificate template saved!");
  };

  return (
    <div className="p-4 md:p-6 w-full">
      <h2 className="text-xl font-semibold text-text-primary mb-6">Certificate Template</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings panel */}
        <div className="bg-white rounded-card shadow-card p-5 space-y-4">
          <h3 className="text-base font-semibold text-text-primary">Template Settings</h3>

          <Input label="Organization Name" value={form.orgName} onChange={update("orgName")} />
          <Input label="Signature Line" placeholder="e.g. Dr. Jane Smith, Training Director" value={form.signatureLine} onChange={update("signatureLine")} />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-text-primary">Border Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.borderColor} onChange={update("borderColor")}
                className="w-10 h-10 rounded cursor-pointer border border-gray-200" />
              <Input value={form.borderColor} onChange={update("borderColor")} className="flex-1" placeholder="#2E7D64" />
            </div>
          </div>

          <FileUpload
            preset="logo"
            label="Organization Logo"
            value={form.logoUrl}
            onUploaded={(result) =>
              setForm((p) => ({ ...p, logoUrl: result?.url ?? null }))
            }
          />

          <FileUpload
            preset="certificateBackground"
            label="Background Watermark (Optional)"
            value={form.backgroundImageUrl}
            onUploaded={(result) =>
              setForm((p) => ({
                ...p,
                backgroundImageUrl: result?.url ?? null,
              }))
            }
          />

          <Button fullWidth loading={saving} onClick={handleSave}>Save Template</Button>
        </div>

        {/* Live preview */}
        <div>
          <h3 className="text-base font-semibold text-text-primary mb-3">Live Preview</h3>
          <div
            className="bg-white rounded-card border-4 p-6 shadow-card"
            style={{ borderColor: form.borderColor }}
          >
            <div className="text-center mb-5">
              {form.logoUrl ? (
                <img
                  src={form.logoUrl}
                  alt="Organization logo"
                  className="h-12 mx-auto mb-3 object-contain"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: form.borderColor }}
                >
                  <Award size={24} className="text-white" />
                </div>
              )}
              <p className="text-[10px] uppercase tracking-[0.2em] text-text-secondary font-medium mb-1">
                Certificate of Completion
              </p>
              <h1 className="text-2xl font-bold" style={{ color: form.borderColor }}>
                {form.orgName}
              </h1>
            </div>

            <div className="text-center space-y-2 border-t border-b border-gray-100 py-5 mb-5">
              <p className="text-sm text-text-secondary">This certifies that</p>
              <h2 className="text-xl font-bold text-text-primary">Employee Name</h2>
              <p className="text-sm text-text-secondary">has successfully completed</p>
              <h3 className="text-base font-semibold" style={{ color: form.borderColor }}>Module Title</h3>
              <p className="text-sm text-text-secondary">with a passing score of <span className="font-bold text-text-primary">85%</span></p>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <div className="w-32 border-b-2 border-gray-200 mb-1" />
                <p className="text-[10px] text-text-secondary">{form.signatureLine}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-text-primary">26 May 2026</p>
                <p className="text-[10px] text-text-secondary">Date of Completion</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-text-secondary mt-2 text-center">
            Changes apply to newly generated certificates only.
          </p>
        </div>
      </div>
    </div>
  );
}
