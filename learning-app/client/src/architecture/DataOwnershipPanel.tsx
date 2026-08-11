import type { OwnershipRelation } from "@learning-app/shared";

interface DataOwnershipPanelProps {
  ownership: OwnershipRelation[];
}

export function DataOwnershipPanel({ ownership }: DataOwnershipPanelProps) {
  if (ownership.length === 0) {
    return (
      <p className="text-sm text-slate-600">
        No curated ownership relations for this lesson.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-700">
        Conceptual ownership model based on the curriculum source. Addresses are not
        shown — this teaches responsibilities and lifetime rules.
      </p>
      {ownership.map((relation) => (
        <section
          key={relation.resourceId}
          aria-labelledby={`ownership-${relation.resourceId}`}
          className="rounded-md border border-slate-200 bg-white p-4"
        >
          <h3
            id={`ownership-${relation.resourceId}`}
            className="text-lg font-semibold text-slate-900"
          >
            {relation.label}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Owner module:{" "}
            <span className="font-medium uppercase">{relation.ownerModuleId}</span>
          </p>
          <p className="mt-2 text-sm text-slate-800">{relation.description}</p>
          {relation.resourceId === "taskstore-items" ? (
            <dl className="mt-4 grid gap-2 rounded-md bg-slate-50 p-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="font-medium text-slate-500">count</dt>
                <dd className="text-slate-800">Live Task elements</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">capacity</dt>
                <dd className="text-slate-800">Allocated slots before growth</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">next_id</dt>
                <dd className="text-slate-800">Next id assigned on add</dd>
              </div>
            </dl>
          ) : null}
        </section>
      ))}
    </div>
  );
}
