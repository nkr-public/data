import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { createApiClient, createItemApi, type ItemDto } from "@app/api-client";
import { translateApiError, useTranslation } from "@app/i18n";
import { Button, Card, ConfirmDialog, Input, PageHeader, StateMessage, showToast } from "@app/ui";

const itemApi = createItemApi(createApiClient());
const ITEMS_KEY = ["items"] as const;

/** Page d'exemple : CRUD sur /api/v1/items, a remplacer par vos propres ecrans. */
export default function HomePage() {
  const { t } = useTranslation("app");
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [toDelete, setToDelete] = useState<ItemDto | null>(null);

  const { data: items, isLoading, error } = useQuery({ queryKey: ITEMS_KEY, queryFn: () => itemApi.list() });

  const onError = (err: unknown) =>
    showToast({ message: translateApiError(err as { code?: string; status?: number }), variant: "error" });

  const createItem = useMutation({
    mutationFn: () => itemApi.create({ name, description: description || undefined }),
    onSuccess: () => {
      setName("");
      setDescription("");
      return queryClient.invalidateQueries({ queryKey: ITEMS_KEY });
    },
    onError,
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => itemApi.remove(id),
    onSuccess: () => {
      setToDelete(null);
      return queryClient.invalidateQueries({ queryKey: ITEMS_KEY });
    },
    onError,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createItem.mutate();
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("items.title")} description={t("items.description")} />

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-1">
            <span className="text-xs font-semibold text-foreground-muted">{t("items.name")}</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={255} />
          </label>
          <label className="flex-1 space-y-1">
            <span className="text-xs font-semibold text-foreground-muted">{t("items.itemDescription")}</span>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <Button type="submit" isLoading={createItem.isPending}>
            <Plus className="w-4 h-4" />
            {t("items.add")}
          </Button>
        </form>
      </Card>

      {isLoading ? (
        <StateMessage kind="loading" />
      ) : error ? (
        <StateMessage kind="error" message={t("items.loadError")} />
      ) : items?.length === 0 ? (
        <StateMessage kind="empty" message={t("items.empty")} />
      ) : (
        <ul className="space-y-3">
          {items?.map((item) => (
            <li key={item.id}>
              <Card className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                  {item.description && <p className="text-sm text-foreground-muted">{item.description}</p>}
                </div>
                <Button variant="ghost" onClick={() => setToDelete(item)} aria-label="delete">
                  <Trash2 className="w-4 h-4 text-danger" />
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        isOpen={toDelete !== null}
        title={t("items.deleteTitle")}
        message={t("items.deleteMessage")}
        isSubmitting={deleteItem.isPending}
        onConfirm={() => toDelete && deleteItem.mutate(toDelete.id)}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
