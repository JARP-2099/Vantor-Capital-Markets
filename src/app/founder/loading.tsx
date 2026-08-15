import { Container } from "@/components/layout/container";
import { Spinner } from "@/components/ui/spinner";

export default function FounderLoading() {
  return (
    <Container className="flex justify-center py-24">
      <Spinner className="size-6" />
    </Container>
  );
}
