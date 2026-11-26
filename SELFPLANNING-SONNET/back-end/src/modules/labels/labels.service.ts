import { AppDataSource } from "../../database";
import { Label } from "../../entities/Label";

const labels = () => AppDataSource.getRepository(Label);

const view = (l: Label) => ({ id: l.id, name: l.name, color: l.color });

export async function listLabels(boardId: string) {
  const rows = await labels().find({ where: { boardId }, order: { name: "ASC" } });
  return rows.map(view);
}

export async function createLabel(boardId: string, data: { name: string; color: string }) {
  return view(
    await labels().save(
      labels().create({ boardId, name: data.name.trim(), color: data.color.toUpperCase() }),
    ),
  );
}

export async function updateLabel(
  labelId: string,
  data: { name?: string; color?: string },
) {
  const label = await labels().findOneByOrFail({ id: labelId });
  if (data.name !== undefined) label.name = data.name.trim();
  if (data.color !== undefined) label.color = data.color.toUpperCase();
  return view(await labels().save(label));
}

export async function deleteLabel(labelId: string) {
  await labels().delete({ id: labelId });
}
