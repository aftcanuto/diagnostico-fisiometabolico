import { ProdutoForm } from '@/components/forms/ProdutoForm';
export default async function EditarProdutoPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <ProdutoForm id={params.id} />;
}
