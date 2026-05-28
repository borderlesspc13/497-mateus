import EditarEquipeForm from "../ui/EditarEquipeForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarEquipePage({ params }: PageProps) {
  const { id } = await params;
  return <EditarEquipeForm id={id} />;
}
