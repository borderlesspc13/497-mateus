import FichaConsorciado from "../ui/FichaConsorciado";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function FichaConsorciadoPage({ params }: PageProps) {
  const { id } = await params;
  return <FichaConsorciado id={id} />;
}
