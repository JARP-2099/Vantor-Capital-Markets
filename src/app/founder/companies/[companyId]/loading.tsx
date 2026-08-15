import { Spinner } from "@/components/ui/spinner";

export default function ManageCompanyLoading() {
  return (
    <div className="flex justify-center py-24">
      <Spinner className="size-6" />
    </div>
  );
}
