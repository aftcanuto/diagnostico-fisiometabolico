import { ProdutoForm } from '@/components/forms/ProdutoForm';
export default function EditarProdutoPage({ params }: { params: { id: string } }) {
  return <ProdutoForm id={params.id} />;
}
