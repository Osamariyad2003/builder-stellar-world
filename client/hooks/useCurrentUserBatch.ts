import { useEffect, useState } from "react";
import {
  collectionGroup,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useYears } from "@/hooks/useYears";

type CurrentBatch = {
  id: string;
  batchName: string;
  cr?: string;
};

type UseCurrentUserBatchState = {
  batch?: CurrentBatch;
  loading: boolean;
  error: string | null;
};

export const useCurrentUserBatch = (): UseCurrentUserBatchState => {
  const { currentUser } = useAuth();
  const { batches } = useYears();
  const [state, setState] = useState<UseCurrentUserBatchState>({
    batch: undefined,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!currentUser) {
      setState({
        batch: undefined,
        loading: false,
        error: null,
      });
      return;
    }

    const loadBatchForUser = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setState({
            batch: undefined,
            loading: false,
            error: null,
          });
          return;
        }

        const userData = userSnap.data() as any;

        let batchId: string | undefined =
          (userData.batchId as string | undefined) ??
          (userData.batch_id as string | undefined);

        const rawYearId: string | undefined =
          (userData.yearId as string | undefined) ??
          (userData.year as string | undefined) ??
          (userData.year_id as string | undefined);

        if (!batchId && rawYearId) {
          let yearId = rawYearId;
          if (typeof rawYearId === "string" && rawYearId.includes(":")) {
            const [idPart] = rawYearId.split(":", 2);
            if (idPart && idPart.trim()) {
              yearId = idPart.trim();
            }
          }

          const yearsSnap = await getDocs(collectionGroup(db, "years"));
          yearsSnap.forEach((docSnap) => {
            if (docSnap.id === yearId && !batchId) {
              const yearData = docSnap.data() as any;
              batchId =
                (yearData.batchId as string | undefined) ??
                (yearData.batch_id as string | undefined);
            }
          });
        }

        if (!batchId) {
          setState({
            batch: undefined,
            loading: false,
            error: null,
          });
          return;
        }

        const fromHook = (batches || []).find((b: any) => b.id === batchId);
        if (fromHook) {
          setState({
            batch: {
              id: fromHook.id,
              batchName: fromHook.batchName || "",
              cr: fromHook.cr,
            },
            loading: false,
            error: null,
          });
          return;
        }

        const batchRef = doc(db, "batches", batchId);
        const batchSnap = await getDoc(batchRef);
        if (!batchSnap.exists()) {
          setState({
            batch: undefined,
            loading: false,
            error: null,
          });
          return;
        }

        const batchData = batchSnap.data() as any;

        setState({
          batch: {
            id: batchSnap.id,
            batchName:
              (batchData.batch_name as string | undefined) ??
              (batchData.batchName as string | undefined) ??
              "",
            cr: (batchData.cr as string | undefined) ?? "",
          },
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error("Failed to load current user batch:", err);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Błąd podczas ładowania informacji o batchu użytkownika.",
        }));
      }
    };

    loadBatchForUser();
  }, [currentUser, batches]);

  return state;
};

