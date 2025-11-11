"use client";

/**
 * Delete Company Button with Confirmation
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";

interface DeleteCompanyButtonProps {
  companyId: string;
  companyName: string;
  locale: string;
}

export function DeleteCompanyButton({
  companyId,
  companyName,
  locale,
}: DeleteCompanyButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("companies");
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      const response = await fetch(`/api/bizexit/companies/${companyId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete company");
      }

      toast({
        title: t("deleteSuccess"),
        description: t("deleteSuccessDescription", { name: companyName }),
      });

      // Redirect to companies list
      router.push(`/${locale}/dashboard/companies`);
      router.refresh();
    } catch (error) {
      console.error("Error deleting company:", error);
      toast({
        title: t("deleteError"),
        description: t("deleteErrorDescription"),
        variant: "destructive",
      });
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button variant="destructive" onClick={() => setIsOpen(true)}>
        <Trash2 className="w-4 h-4 mr-2" />
        {t("delete")}
      </Button>

      <ConfirmDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDescription", { name: companyName })}
        confirmText={t("deleteConfirm")}
        cancelText={t("cancel")}
        variant="destructive"
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </>
  );
}

