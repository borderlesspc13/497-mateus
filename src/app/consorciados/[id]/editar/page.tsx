import ConsorciadoForm from "../../ui/ConsorciadoForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarConsorciadoPage({ params }: PageProps) {
  const { id } = await params;
  return <ConsorciadoForm mode="edit" id={id} />;
}
