"use client";

/**
 * Cancel Deal Button with Confirmation
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";

interface CancelDealButtonProps {
  dealId: string;
  companyName: string;
  locale: string;
}

export function CancelDealButton({
  dealId,
  companyName,
  locale,
}: CancelDealButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("deals");
  const [isOpen, setIsOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    try {
      setIsCancelling(true);

      const response = await fetch(`/api/bizexit/deals/${dealId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel deal");
      }

      toast({
        title: t("cancelSuccess"),
        description: t("cancelSuccessDescription", { name: companyName }),
      });

      // Redirect to deals list
      router.push(`/${locale}/dashboard/deals`);
      router.refresh();
    } catch (error) {
      console.error("Error cancelling deal:", error);
      toast({
        title: t("cancelError"),
        description: t("cancelErrorDescription"),
        variant: "destructive",
      });
      setIsCancelling(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button variant="destructive" onClick={() => setIsOpen(true)}>
        <Ban className="w-4 h-4 mr-2" />
        {t("cancelDeal")}
      </Button>

      <ConfirmDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title={t("cancelConfirmTitle")}
        description={t("cancelConfirmDescription", { name: companyName })}
        confirmText={t("cancelConfirm")}
        cancelText={t("cancel")}
        variant="destructive"
        onConfirm={handleCancel}
        loading={isCancelling}
      />
    </>
  );
}

