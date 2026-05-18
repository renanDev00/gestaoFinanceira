import { useState, useEffect, useCallback } from 'react';
import { supabase, DbTransaction } from '../lib/supabase';
import { Transaction, TransactionType, TransactionStatus } from '../types';

// -----------------------------------------------
// Converters: DB ↔ App
// -----------------------------------------------
function dbToApp(db: DbTransaction): Transaction {
  return {
    id: db.id,
    description: db.description,
    amount: Number(db.amount),
    date: db.date,
    type: db.type as TransactionType,
    category: db.category,
    isFixed: db.is_fixed,
    endMonth: db.end_month ?? undefined,
    paymentDate: db.payment_date ?? undefined,
    parentId: db.parent_id ?? undefined,
    status: db.status as TransactionStatus,
    person: db.person ?? undefined,
    paymentMethod: (db.payment_method ?? 'cash') as 'cash' | 'credit',
  };
}

function appToDb(t: Transaction, userId: string): Omit<DbTransaction, 'created_at' | 'updated_at'> {
  return {
    id: t.id,
    user_id: userId,
    description: t.description,
    amount: t.amount,
    date: t.date,
    type: t.type,
    category: t.category,
    is_fixed: t.isFixed,
    end_month: t.endMonth ?? null,
    payment_date: t.paymentDate ?? null,
    parent_id: t.parentId ?? null,
    status: t.status,
    person: t.person ?? null,
    payment_method: t.paymentMethod ?? 'cash',
  };
}

// -----------------------------------------------
// Hook
// -----------------------------------------------
export function useTransactions(userId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Fetch all transactions for the logged-in user
  const fetchTransactions = useCallback(async () => {
    if (!userId) return;
    setLoadingTransactions(true);
    setSyncError(null);

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      setSyncError('Erro ao carregar transações: ' + error.message);
      setLoadingTransactions(false);
      return;
    }

    setTransactions((data as DbTransaction[]).map(dbToApp));
    setLoadingTransactions(false);
  }, [userId]);

  // Fetch on mount / userId change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // ---------- CRUD ----------

  const saveTransaction = async (transaction: Transaction) => {
    if (!userId) return;

    const row = appToDb(transaction, userId);
    const existing = transactions.find(t => t.id === transaction.id);

    if (existing) {
      // UPDATE
      const { error } = await supabase
        .from('transactions')
        .update(row)
        .eq('id', transaction.id)
        .eq('user_id', userId);

      if (error) {
        setSyncError('Erro ao atualizar: ' + error.message);
        return;
      }
      setTransactions(prev => prev.map(t => t.id === transaction.id ? transaction : t));
    } else {
      // INSERT
      const { error } = await supabase
        .from('transactions')
        .insert(row);

      if (error) {
        setSyncError('Erro ao salvar: ' + error.message);
        return;
      }
      setTransactions(prev => [...prev, transaction]);
    }
  };

  const saveManyTransactions = async (newTransactions: Transaction[]) => {
    if (!userId) return;

    const rows = newTransactions.map(t => appToDb(t, userId));
    const { error } = await supabase
      .from('transactions')
      .insert(rows);

    if (error) {
      setSyncError('Erro ao salvar parcelas: ' + error.message);
      return;
    }
    setTransactions(prev => [...prev, ...newTransactions]);
  };

  const deleteTransaction = async (id: string) => {
    if (!userId) return;

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      setSyncError('Erro ao excluir: ' + error.message);
      return;
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const updateTransaction = async (updated: Transaction) => {
    if (!userId) return;

    const row = appToDb(updated, userId);
    const { error } = await supabase
      .from('transactions')
      .update(row)
      .eq('id', updated.id)
      .eq('user_id', userId);

    if (error) {
      setSyncError('Erro ao atualizar: ' + error.message);
      return;
    }
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  return {
    transactions,
    setTransactions,
    loadingTransactions,
    syncError,
    fetchTransactions,
    saveTransaction,
    saveManyTransactions,
    deleteTransaction,
    updateTransaction,
  };
}
