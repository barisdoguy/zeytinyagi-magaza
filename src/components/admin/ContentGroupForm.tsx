import { ActionForm, Field, SubmitButton } from "@/components/ui/ActionForm";
import { fieldsInGroup, GROUP_LABELS, type Content, type FieldGroup } from "@/lib/content/definitions";
import { saveContentGroup } from "@/app/yonetim/actions";
import { Badge, Panel } from "./ui";

export function ContentGroupForm({ group, content }: { group: FieldGroup; content: Content }) {
  const meta = GROUP_LABELS[group];
  const fields = fieldsInGroup(group);
  const empty = fields.filter(({ key, def }) => def.default === "" && content[key] === "").length;
  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl">{meta.title}</h2>
        {empty > 0 && <Badge tone="warn">{empty} alan boş</Badge>}
      </div>
      <p className="mb-5 text-korfez/75">{meta.description}</p>
      <ActionForm action={saveContentGroup} className="space-y-4">
        <input type="hidden" name="group" value={group} />
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map(({ key, def }) => (
            <Field key={key} name={key} label={def.label} defaultValue={content[key]} multiline={def.multiline} rows={def.multiline ? 4 : undefined} help={def.help} className={def.multiline ? "md:col-span-2" : ""} />
          ))}
        </div>
        <SubmitButton className="btn btn-dark" pendingLabel="Kaydediliyor…">{meta.title} bölümünü kaydet</SubmitButton>
      </ActionForm>
    </Panel>
  );
}
