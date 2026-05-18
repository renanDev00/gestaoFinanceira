/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Repeat, 
  HandCoins, 
  Plus, 
  Menu, 
  X, 
  LogOut, 
  User as UserIcon,
  TrendingDown,
  TrendingUp,
  ChevronRight,
  Filter,
  CreditCard,
  Pencil,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart, 
  Pie,
  Legend,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Transaction, TransactionType, TransactionStatus, View, LoanReport } from './types';

// Simple initial data for demonstration
const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', description: 'Salário', amount: 5000, date: '2026-05-01', type: TransactionType.INCOME, category: 'Salário', isFixed: true, status: TransactionStatus.PAID, paymentDate: '2026-05-01', paymentMethod: 'cash' },
  { id: '2', description: 'Aluguel', amount: 1500, date: '2026-05-02', type: TransactionType.EXPENSE, category: 'Moradia', isFixed: true, status: TransactionStatus.PAID, paymentDate: '2026-05-02', paymentMethod: 'cash' },
  { id: '3', description: 'Mercado', amount: 800, date: '2026-05-10', type: TransactionType.EXPENSE, category: 'Alimentação', isFixed: false, status: TransactionStatus.PAID, paymentDate: '2026-05-10', paymentMethod: 'credit' },
  { id: '4', description: 'Empréstimo João', amount: 200, date: '2026-05-12', type: TransactionType.EXPENSE, category: 'Empréstimo', isFixed: false, status: TransactionStatus.PAID, paymentDate: '2026-05-12', person: 'João', paymentMethod: 'cash' },
  { id: '5', description: 'Pagamento João', amount: 50, date: '2026-05-15', type: TransactionType.INCOME, category: 'Empréstimo', isFixed: false, status: TransactionStatus.PENDING, person: 'João', paymentMethod: 'cash' },
  { id: '6', description: 'Freelance', amount: 1200, date: '2026-05-05', type: TransactionType.INCOME, category: 'Extra', isFixed: false, status: TransactionStatus.PENDING, paymentMethod: 'cash' },
  { id: '7', description: 'Internet', amount: 100, date: '2026-05-20', type: TransactionType.EXPENSE, category: 'Utilidades', isFixed: true, status: TransactionStatus.PENDING, paymentMethod: 'cash' },
  { id: '8', description: 'Academia', amount: 120, date: '2026-04-10', type: TransactionType.EXPENSE, category: 'Saúde', isFixed: true, status: TransactionStatus.PENDING, paymentMethod: 'cash' },
  { id: '9', description: 'Seguro Carro', amount: 350, date: '2026-04-15', type: TransactionType.EXPENSE, category: 'Transporte', isFixed: true, status: TransactionStatus.PENDING, paymentMethod: 'cash' },
  { id: '10', description: 'Assinatura Stream', amount: 55.90, date: '2026-05-05', type: TransactionType.EXPENSE, category: 'Lazer', isFixed: true, status: TransactionStatus.PAID, paymentDate: '2026-05-05', paymentMethod: 'credit' },
  { id: '11', description: 'Restaurante', amount: 150, date: '2026-05-12', type: TransactionType.EXPENSE, category: 'Alimentação', isFixed: false, status: TransactionStatus.PAID, paymentDate: '2026-05-12', paymentMethod: 'credit' },
];

const CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Lazer',
  'Empréstimo',
  'Investimento',
  'Salário',
  'Outros'
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [user, setUser] = useState({ name: '', email: '', password: '' });
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [filterMonth, setFilterMonth] = useState('2026-05');

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isFixedModalOpen, setIsFixedModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<{ transaction: Transaction, month: string } | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Handlers
  const handleDeleteTransaction = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (transaction && transaction.paymentMethod === 'credit') {
      const month = transaction.date.substring(0, 7);
      const isBillPaid = transactions.some(t => 
        t.description === `Pagamento Fatura ${month}` && 
        t.category === 'Cartão de Crédito'
      );
      if (isBillPaid) {
        alert("Não é possível excluir transações de uma fatura que já foi paga.");
        return;
      }
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    if (transaction.isFixed) {
      setIsFixedModalOpen(true);
    } else {
      setIsTransactionModalOpen(true);
    }
  };

  const handleSaveTransaction = (transaction: Transaction) => {
    setTransactions(prev => {
      const exists = prev.find(t => t.id === transaction.id);
      if (exists) {
        return prev.map(t => t.id === transaction.id ? transaction : t);
      }
      return [...prev, transaction];
    });
    setEditingTransaction(null);
  };

  const handleExecutePayment = (transaction: Transaction, amount: number, paymentDate: string, month: string) => {
    if (transaction.isFixed) {
      // Create a specific transaction for this month
      const newTransaction: Transaction = {
        ...transaction,
        id: Math.random().toString(36).substr(2, 9),
        isFixed: false,
        amount: amount,
        date: `${month}-${transaction.date.split('-')[2]}`,
        paymentDate: paymentDate,
        status: TransactionStatus.PAID,
        parentId: transaction.id
      };
      setTransactions(prev => [...prev, newTransaction]);
    } else {
      // Update existing transaction
      setTransactions(prev => prev.map(t => t.id === transaction.id ? {
        ...t,
        amount: amount,
        paymentDate: paymentDate,
        status: TransactionStatus.PAID
      } : t));
    }
    setIsPaymentModalOpen(false);
    setPaymentTarget(null);
  };

  const handlePayBill = (month: string, amount: number) => {
    if (amount <= 0) return;

    const paymentDate = new Date().toISOString().split('T')[0];
    const billPayment: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      description: `Pagamento Fatura ${month}`,
      amount: amount,
      date: paymentDate,
      type: TransactionType.EXPENSE,
      category: 'Cartão de Crédito',
      isFixed: false,
      paymentDate: paymentDate,
      status: TransactionStatus.PAID,
      paymentMethod: 'cash'
    };

    setTransactions(prev => [...prev, billPayment]);
  };

  const handleCancelPayBill = (month: string) => {
    setTransactions(prev => {
      // Find the bill payment transaction
      const billPaymentId = prev.find(t => 
        t.description === `Pagamento Fatura ${month}` && 
        t.category === 'Cartão de Crédito'
      )?.id;

      if (!billPaymentId) return prev;

      // Filter out the payment
      return prev.filter(t => t.id !== billPaymentId);
    });
  };

  // Calculations
  const balance = useMemo(() => {
    return transactions.reduce((acc, t) => {
      // Only consider transactions that have been effectively paid/received
      if (!t.paymentDate || t.paymentMethod === 'credit') return acc;
      return t.type === TransactionType.INCOME ? acc + t.amount : acc - t.amount;
    }, 0);
  }, [transactions]);

  const performanceData = useMemo(() => {
    const data = [];
    const now = new Date(filterMonth + '-01T12:00:00');
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const mStr = d.toISOString().substring(0, 7);
      
      const monthTransactions = transactions.filter(t => !t.isFixed && t.date.startsWith(mStr));
      const fixedTransactions = transactions.filter(t => t.isFixed);
      
      let income = 0;
      let expense = 0;
      
      monthTransactions.forEach(t => {
        if (t.type === TransactionType.INCOME) income += t.amount;
        else expense += t.amount;
      });
      
      fixedTransactions.forEach(t => {
        const startMonth = t.date.substring(0, 7);
        const isWithinRange = mStr >= startMonth && (!t.endMonth || mStr <= t.endMonth.substring(0, 7));
        const hasOverride = monthTransactions.some(mt => mt.parentId === t.id);
        
        if (isWithinRange && !hasOverride) {
          if (t.type === TransactionType.INCOME) income += t.amount;
          else expense += t.amount;
        }
      });
      
      data.push({
        name: d.toLocaleString('pt-BR', { month: 'short' }),
        income,
        expense,
        balance: income - expense
      });
    }
    return data;
  }, [transactions, filterMonth]);

  const projectionData = useMemo(() => {
    const data = [];
    let currentBalance = balance;
    const now = new Date(filterMonth + '-01T12:00:00');
    
    const recurringIncome = transactions.filter(t => t.isFixed && t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
    const recurringExpense = transactions.filter(t => t.isFixed && t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
    const recurringBalance = recurringIncome - recurringExpense;
    
    for (let i = 1; i <= 6; i++) {
      const d = new Date(now);
      d.setMonth(d.getMonth() + i);
      const mStr = d.toISOString().substring(0, 7);
      
      const futureIncomes = transactions.filter(t => !t.isFixed && t.date.startsWith(mStr) && t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
      const futureExpenses = transactions.filter(t => !t.isFixed && t.date.startsWith(mStr) && t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);

      const monthlyBalance = recurringBalance + (futureIncomes - futureExpenses);
      currentBalance += monthlyBalance;
      
      data.push({
        name: d.toLocaleString('pt-BR', { month: 'short' }),
        total: currentBalance,
        monthly: monthlyBalance
      });
    }
    return data;
  }, [transactions, balance, filterMonth]);

  const fixedBalance = useMemo(() => {
    const income = transactions.filter(t => t.isFixed && t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.isFixed && t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
    return income - expense;
  }, [transactions]);

  const loanReports = useMemo((): LoanReport[] => {
    const people = Array.from(new Set(transactions.filter(t => t.category === 'Empréstimo' && t.person).map(t => t.person as string)));
    return people.map(person => {
      const out = transactions.filter(t => t.person === person && t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
      const incoming = transactions.filter(t => t.person === person && t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
      return { person, out, in: incoming, balance: out - incoming };
    }).filter(report => report.balance !== 0);
  }, [transactions]);

  // Auth handler
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'register') {
      if (user.name && user.email && user.password) {
        setIsLoggedIn(true);
      }
    } else {
      if (user.email && user.password) {
        setIsLoggedIn(true);
        if (!user.name) setUser(prev => ({ ...prev, name: prev.email.split('@')[0] }));
      }
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 rounded-3xl w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tighter mb-2">Finantz</h1>
            <p className="text-secondary">
              {authMode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta gratuita'}
            </p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {authMode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                >
                  <label className="block text-xs uppercase tracking-widest text-secondary mb-1 ml-1 font-semibold">Nome</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors"
                    placeholder="Seu nome completo"
                    value={user.name}
                    onChange={e => setUser({...user, name: e.target.value})}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            <div>
              <label className="block text-xs uppercase tracking-widest text-secondary mb-1 ml-1 font-semibold">Email</label>
              <input 
                type="email" 
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors"
                placeholder="seu@email.com"
                value={user.email}
                onChange={e => setUser({...user, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-secondary mb-1 ml-1 font-semibold">Senha</label>
              <input 
                type="password" 
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors"
                placeholder="••••••••"
                value={user.password}
                onChange={e => setUser({...user, password: e.target.value})}
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-opacity-90 transition-all mt-4"
            >
              {authMode === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-sm font-medium text-secondary hover:text-white transition-colors"
            >
              {authMode === 'login' ? (
                <>Não tem uma conta? <span className="text-white font-bold underline underline-offset-4 pl-1">Cadastre-se</span></>
              ) : (
                <>Já possui conta? <span className="text-white font-bold underline underline-offset-4 pl-1">Entre aqui</span></>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar Mobile Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-6 right-6 z-50 glass p-3 rounded-full"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Content */}
      <aside className={`
        fixed inset-0 z-40 md:relative md:flex md:w-72 glass border-r-0 md:border-r border-white/10
        flex-col transition-all duration-500 bg-surface/90 md:bg-transparent
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <span className="text-black font-black text-xl italic">F</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tighter">Finantz</h2>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <SidebarLink 
            active={currentView === 'dashboard'} 
            onClick={() => {setCurrentView('dashboard'); setIsSidebarOpen(false);}}
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
          />
          <SidebarLink 
            active={currentView === 'monthly'} 
            onClick={() => {setCurrentView('monthly'); setIsSidebarOpen(false);}}
            icon={<CalendarDays size={20} />}
            label="Visão Mensal"
          />
          <SidebarLink 
            active={currentView === 'credit-card'} 
            onClick={() => {setCurrentView('credit-card'); setIsSidebarOpen(false);}}
            icon={<CreditCard size={20} />}
            label="Cartão de Crédito"
          />
          <SidebarLink 
            active={currentView === 'fixed'} 
            onClick={() => {setCurrentView('fixed'); setIsSidebarOpen(false);}}
            icon={<Repeat size={20} />}
            label="Transações Fixas"
          />
          <SidebarLink 
            active={currentView === 'loans'} 
            onClick={() => {setCurrentView('loans'); setIsSidebarOpen(false);}}
            icon={<HandCoins size={20} />}
            label="Empréstimos"
          />
        </nav>

        <div className="p-6 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-white font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-semibold truncate">{user.name}</p>
              <p className="text-xs text-secondary truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl glass-hover text-rose-400 font-medium"
          >
            <LogOut size={20} />
            <span>Sair do App</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-12 relative">
        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">Saldo em conta</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-light text-secondary">R$</span>
              <h1 className="text-5xl font-black tracking-tighter tabular-nums leading-none">
                {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h1>
            </div>
          </div>
          
          <button 
            onClick={() => setIsTransactionModalOpen(true)}
            className="flex items-center justify-center gap-3 bg-white text-black px-6 py-4 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
            <span className="text-base">Nova Transação</span>
          </button>
        </header>

        <AnimatePresence mode="wait">
          {currentView === 'dashboard' && <DashboardView transactions={transactions} performance={performanceData} projection={projectionData} key="dashboard" />}
          {currentView === 'monthly' && (
            <MonthlyView 
              transactions={transactions} 
              filterMonth={filterMonth}
              setFilterMonth={setFilterMonth}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
              onPay={(t, month) => {
                setPaymentTarget({ transaction: t, month });
                setIsPaymentModalOpen(true);
              }}
              key="monthly" 
            />
          )}
          {currentView === 'fixed' && (
            <FixedView 
              transactions={transactions} 
              balance={fixedBalance} 
              onAddClick={() => setIsFixedModalOpen(true)}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
              key="fixed" 
            />
          )}
          {currentView === 'loans' && <LoansView reports={loanReports} key="loans" />}
          {currentView === 'credit-card' && (
            <CreditCardView 
              transactions={transactions} 
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
              onPayBill={handlePayBill}
              onCancelPayBill={handleCancelPayBill}
              onPay={(t, month) => {
                setPaymentTarget({ transaction: t, month });
                setIsPaymentModalOpen(true);
              }}
              key="credit-card" 
            />
          )}
        </AnimatePresence>
      </main>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        target={paymentTarget}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentTarget(null);
        }}
        onConfirm={handleExecutePayment}
      />

      <TransactionModal 
        isOpen={isTransactionModalOpen} 
        editingTransaction={editingTransaction}
        transactions={transactions}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
        onAdd={handleSaveTransaction}
      />

      <FixedTransactionModal 
        isOpen={isFixedModalOpen}
        editingTransaction={editingTransaction}
        transactions={transactions}
        onClose={() => {
          setIsFixedModalOpen(false);
          setEditingTransaction(null);
        }}
        onAdd={handleSaveTransaction}
      />
    </div>
  );
}

function FixedTransactionModal({ isOpen, editingTransaction, transactions, onClose, onAdd }: { isOpen: boolean, editingTransaction: Transaction | null, transactions: Transaction[], onClose: () => void, onAdd: (t: Transaction) => void }) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: TransactionType.EXPENSE,
    dueDay: '10',
    category: CATEGORIES[0],
    startMonth: new Date().toISOString().split('T')[0].substring(0, 7),
    endMonth: '',
    paymentMethod: 'cash' as 'cash' | 'credit'
  });

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        description: editingTransaction.description,
        amount: editingTransaction.amount.toString(),
        type: editingTransaction.type,
        dueDay: parseInt(editingTransaction.date.split('-')[2]).toString(),
        category: editingTransaction.category || CATEGORIES[0],
        startMonth: editingTransaction.date.substring(0, 7),
        endMonth: '',
        paymentMethod: editingTransaction.paymentMethod || 'cash'
      });
    } else {
      setFormData({
        description: '',
        amount: '',
        type: TransactionType.EXPENSE,
        dueDay: '10',
        category: CATEGORIES[0],
        startMonth: new Date().toISOString().split('T')[0].substring(0, 7),
        endMonth: '',
        paymentMethod: 'cash'
      });
    }
  }, [editingTransaction, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isBillPaid = transactions.some(t => 
      t.description === `Pagamento Fatura ${formData.startMonth}` && 
      t.category === 'Cartão de Crédito'
    );

    if (isBillPaid) {
      alert(`Não é possível cadastrar transações para este mês (${formData.startMonth}) pois a fatura já está paga.`);
      return;
    }

    // For now, we add it to the current month view as a fixed transaction
    const transaction: Transaction = {
      id: editingTransaction ? editingTransaction.id : Math.random().toString(36).substr(2, 9),
      description: formData.description,
      amount: parseFloat(formData.amount),
      date: `${formData.startMonth}-${formData.dueDay.padStart(2, '0')}`,
      type: formData.paymentMethod === 'credit' ? TransactionType.EXPENSE : formData.type,
      category: formData.category,
      isFixed: true,
      endMonth: formData.endMonth || undefined,
      status: TransactionStatus.PENDING,
      paymentMethod: formData.paymentMethod
    };

    onAdd(transaction);
    onClose();
    setFormData({
      description: '',
      amount: '',
      type: TransactionType.EXPENSE,
      dueDay: '10',
      startMonth: new Date().toISOString().split('T')[0].substring(0, 7),
      endMonth: '',
      paymentMethod: 'cash'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass w-full max-w-lg rounded-3xl overflow-hidden relative z-10"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Novo Fixo Mensal</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex glass p-1 rounded-2xl">
            <button 
              onClick={() => setFormData({...formData, paymentMethod: 'cash'})}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${formData.paymentMethod === 'cash' ? 'bg-white text-black shadow-lg' : 'text-secondary hover:text-white'}`}
            >
              Débito / Dinheiro
            </button>
            <button 
              onClick={() => setFormData({...formData, paymentMethod: 'credit', type: TransactionType.EXPENSE})}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${formData.paymentMethod === 'credit' ? 'bg-white text-black shadow-lg' : 'text-secondary hover:text-white'}`}
            >
              Cartão de Crédito
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase tracking-widest text-secondary mb-2 ml-1 font-bold">Nome da Transação</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Aluguel, Internet..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-secondary mb-2 ml-1 font-bold">Valor</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  placeholder="0,00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors tabular-nums"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-secondary mb-2 ml-1 font-bold">Tipo</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors appearance-none"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as TransactionType})}
                >
                  <option value={TransactionType.EXPENSE} className="bg-zinc-900">Saída Fixa</option>
                  <option value={TransactionType.INCOME} className="bg-zinc-900">Entrada Fixa</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-secondary mb-2 ml-1 font-bold">Categoria</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors appearance-none"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-zinc-900">{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-secondary mb-2 ml-1 font-bold">Dia do Vencimento</label>
                <input 
                  type="number" 
                  min="1"
                  max="31"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors"
                  value={formData.dueDay}
                  onChange={e => setFormData({...formData, dueDay: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-secondary mb-2 ml-1 font-bold">Mês de Início</label>
                <input 
                  type="month" 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors"
                  value={formData.startMonth}
                  onChange={e => setFormData({...formData, startMonth: e.target.value})}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase tracking-widest text-secondary mb-2 ml-1 font-bold">Mês de Fim (Opcional)</label>
                <input 
                  type="month" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors"
                  value={formData.endMonth}
                  onChange={e => setFormData({...formData, endMonth: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="submit"
                className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-opacity-90 transition-all text-sm uppercase tracking-widest shadow-xl shadow-white/5"
              >
                Salvar Transação Fixa
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function TransactionModal({ isOpen, editingTransaction, transactions, onClose, onAdd }: { isOpen: boolean, editingTransaction: Transaction | null, transactions: Transaction[], onClose: () => void, onAdd: (t: Transaction) => void }) {
  const [method, setMethod] = useState<'cash' | 'credit'>('cash');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: TransactionType.EXPENSE,
    category: CATEGORIES[0],
    paymentDate: new Date().toISOString().split('T')[0],
    installments: '1',
    person: '',
    billMonth: new Date().toISOString().split('T')[0].substring(0, 7)
  });

  useEffect(() => {
    if (editingTransaction) {
      setMethod(editingTransaction.paymentMethod || 'cash');
      setFormData({
        description: editingTransaction.description,
        amount: editingTransaction.amount.toString(),
        type: editingTransaction.type,
        category: editingTransaction.category,
        paymentDate: editingTransaction.paymentDate || editingTransaction.date,
        installments: '1',
        person: editingTransaction.person || '',
        billMonth: editingTransaction.date.substring(0, 7)
      });
    } else {
      setMethod('cash');
      setFormData({
        description: '',
        amount: '',
        type: TransactionType.EXPENSE,
        category: CATEGORIES[0],
        paymentDate: new Date().toISOString().split('T')[0],
        installments: '1',
        person: '',
        billMonth: new Date().toISOString().split('T')[0].substring(0, 7)
      });
    }
  }, [editingTransaction, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const monthToCheck = method === 'credit' ? formData.billMonth : formData.paymentDate.substring(0, 7);
    const isBillPaid = transactions.some(t => 
      t.description === `Pagamento Fatura ${monthToCheck}` && 
      t.category === 'Cartão de Crédito'
    );

    if (isBillPaid) {
      alert(`Não é possível cadastrar transações para este mês (${monthToCheck}) pois a fatura já está paga.`);
      return;
    }

    const baseTransaction: Transaction = {
      id: editingTransaction ? editingTransaction.id : Math.random().toString(36).substr(2, 9),
      description: formData.description,
      amount: parseFloat(formData.amount),
      date: method === 'credit' ? `${formData.billMonth}-01` : formData.paymentDate,
      type: method === 'credit' ? TransactionType.EXPENSE : formData.type,
      category: formData.category,
      isFixed: false,
      person: formData.category === 'Empréstimo' ? formData.person : undefined,
      paymentDate: formData.paymentDate || undefined,
      status: formData.paymentDate ? TransactionStatus.PAID : TransactionStatus.PENDING,
      paymentMethod: method
    };

    if (method === 'credit' && parseInt(formData.installments) > 1) {
      const numInstallments = parseInt(formData.installments);
      const installmentAmount = parseFloat(formData.amount) / numInstallments;
      const [startYear, startMonth] = formData.billMonth.split('-').map(Number);

      for (let i = 0; i < numInstallments; i++) {
        let currentYear = startYear;
        let currentMonth = startMonth + i;

        while (currentMonth > 12) {
          currentMonth -= 12;
          currentYear += 1;
        }

        const formattedMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        
        const installmentTransaction: Transaction = {
          ...baseTransaction,
          id: Math.random().toString(36).substr(2, 9),
          description: `${formData.description} (${i + 1}/${numInstallments})`,
          amount: installmentAmount,
          date: `${formattedMonth}-01`,
        };
        onAdd(installmentTransaction);
      }
    } else {
      onAdd(baseTransaction);
    }

    onClose();
    setFormData({
      description: '',
      amount: '',
      type: TransactionType.EXPENSE,
      category: CATEGORIES[0],
      paymentDate: new Date().toISOString().split('T')[0],
      installments: '1',
      person: '',
      billMonth: new Date().toISOString().split('T')[0].substring(0, 7)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass w-full max-w-lg rounded-3xl overflow-hidden relative z-10"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Nova Transação</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex glass p-1 rounded-2xl">
            <button 
              onClick={() => setMethod('cash')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${method === 'cash' ? 'bg-white text-black shadow-lg' : 'text-secondary hover:text-white'}`}
            >
              Débito / Dinheiro
            </button>
            <button 
              onClick={() => setMethod('credit')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${method === 'credit' ? 'bg-white text-black shadow-lg' : 'text-secondary hover:text-white'}`}
            >
              Cartão de Crédito
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase tracking-widest text-secondary mb-2 ml-1 font-bold">Descrição</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Mercado Central"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              {method === 'cash' ? (
                <>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-secondary mb-2 ml-1 font-bold">Valor</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      placeholder="0,00"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors tabular-nums"
                      value={formData.amount}
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-secondary mb-2 ml-1 font-bold">Tipo</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors appearance-none"
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value as TransactionType})}
                    >
                      <option value={TransactionType.EXPENSE} className="bg-zinc-900">Saída</option>
                      <option value={TransactionType.INCOME} className="bg-zinc-900">Entrada</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-secondary mb-2 ml-1 font-bold">Categoria</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors appearance-none"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-zinc-900">{cat}</option>)}
                    </select>
                  </div>
                  {formData.category === 'Empréstimo' && (
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-secondary mb-2 ml-1 font-bold">Pessoa</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Nome da pessoa"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors"
                        value={formData.person}
                        onChange={e => setFormData({...formData, person: e.target.value})}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-secondary mb-2 ml-1 font-bold">Data de Pagamento</label>
                    <input 
                      type="date" 
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors"
                      value={formData.paymentDate}
                      onChange={e => setFormData({...formData, paymentDate: e.target.value})}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-secondary mb-2 ml-1 font-bold">Valor da Parcela</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      placeholder="0,00"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors tabular-nums"
                      value={formData.amount}
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-secondary mb-2 ml-1 font-bold">Qtd Parcelas</label>
                    <input 
                      type="number" 
                      min="1"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors"
                      value={formData.installments}
                      onChange={e => setFormData({...formData, installments: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-secondary mb-2 ml-1 font-bold">Fatura do Cartão</label>
                    <input 
                      type="month" 
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors"
                      value={formData.billMonth}
                      onChange={e => setFormData({...formData, billMonth: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-secondary mb-2 ml-1 font-bold">Categoria</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors appearance-none"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-zinc-900">{cat}</option>)}
                    </select>
                  </div>
                  {formData.category === 'Empréstimo' && (
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-secondary mb-2 ml-1 font-bold">Pessoa</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Nome da pessoa"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors"
                        value={formData.person}
                        onChange={e => setFormData({...formData, person: e.target.value})}
                      />
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase tracking-widest text-secondary mb-2 ml-1 font-bold">Data do Pagamento</label>
                    <input 
                      type="date" 
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors"
                      value={formData.paymentDate}
                      onChange={e => setFormData({...formData, paymentDate: e.target.value})}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="pt-6">
              <button 
                type="submit"
                className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-opacity-90 transition-all text-sm uppercase tracking-widest shadow-xl shadow-white/5"
              >
                Confirmar Transação
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function PaymentModal({ isOpen, target, onClose, onConfirm }: { isOpen: boolean, target: { transaction: Transaction, month: string } | null, onClose: () => void, onConfirm: (t: Transaction, amount: number, paymentDate: string, month: string) => void }) {
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (target) {
      setAmount(target.transaction.amount.toString());
      setPaymentDate(new Date().toISOString().split('T')[0]);
    }
  }, [target, isOpen]);

  if (!isOpen || !target) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(target.transaction, parseFloat(amount), paymentDate, target.month);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass w-full max-w-sm rounded-[2rem] overflow-hidden relative z-10"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Confirmar Pagamento</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white/5 p-4 rounded-2xl space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">Transação</p>
              <p className="font-bold text-lg">{target.transaction.description}</p>
              <p className="text-xs text-secondary">{target.transaction.category}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-secondary mb-2 ml-1 font-bold">Valor a Pagar</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors tabular-nums text-lg font-bold"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-secondary mb-2 ml-1 font-bold">Data do Pagamento</label>
                <input 
                  type="date" 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white transition-colors"
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-opacity-90 transition-all text-sm uppercase tracking-widest shadow-xl shadow-white/5"
            >
              Confirmar Pagamento
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function SidebarLink({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`
        w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-medium transition-all group
        ${active ? 'bg-white text-black' : 'text-secondary glass-hover'}
      `}
    >
      <div className={`${active ? '' : 'group-hover:translate-x-1'} transition-transform duration-300`}>
        {icon}
      </div>
      <span className="flex-1 text-left">{label}</span>
      {active && <ChevronRight size={16} />}
    </button>
  );
}

// --- VIEW COMPONENTS ---

function DashboardView({ transactions, performance, projection }: { transactions: Transaction[], performance: any[], projection: any[], key?: string }) {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const [chartType, setChartType] = useState<'history' | 'projection'>('history');
  
  const expandedCurrentMonth = useMemo(() => {
    const monthTransactions = transactions.filter(t => !t.isFixed && t.date.startsWith(currentMonth));
    const fixedTransactions = transactions.filter(t => t.isFixed);

    const expanded = [...monthTransactions];

    fixedTransactions.forEach(t => {
      const startMonth = t.date.substring(0, 7);
      const isWithinRange = currentMonth >= startMonth && (!t.endMonth || currentMonth <= t.endMonth.substring(0, 7));
      
      const hasOverride = monthTransactions.some(mt => mt.parentId === t.id);

      if (isWithinRange && !hasOverride) {
        expanded.push({ ...t, date: `${currentMonth}-${t.date.split('-')[2]}` });
      }
    });

    return expanded;
  }, [transactions, currentMonth]);

  const income = expandedCurrentMonth.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
  const expense = expandedCurrentMonth.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
  
  const overdueFixedMonths = useMemo(() => {
    const months: Record<string, { count: number, total: number }> = {};
    const currentMonthStr = new Date().toISOString().substring(0, 7); // Use real current date
    
    const fixedTransactions = transactions.filter(t => t.isFixed);
    if (fixedTransactions.length === 0) return [];
    
    const startMonths = fixedTransactions.map(t => t.date.substring(0, 7)).sort();
    const earliestMonthStr = startMonths[0];
    
    let iterDate = new Date(earliestMonthStr + '-01T12:00:00');
    const endDate = new Date(currentMonthStr + '-01T12:00:00');
    
    while (iterDate <= endDate) {
      const iterMonthStr = iterDate.toISOString().substring(0, 7);
      
      fixedTransactions.forEach(t => {
        const tStartMonth = t.date.substring(0, 7);
        const tEndMonth = t.endMonth ? t.endMonth.substring(0, 7) : null;
        const isWithinRange = iterMonthStr >= tStartMonth && (!tEndMonth || iterMonthStr <= tEndMonth);
        
        if (isWithinRange) {
          const hasPaidOverride = transactions.some(mt => 
            mt.parentId === t.id && 
            mt.date.startsWith(iterMonthStr) && 
            mt.status === TransactionStatus.PAID
          );
          
          if (!hasPaidOverride) {
            if (!months[iterMonthStr]) months[iterMonthStr] = { count: 0, total: 0 };
            months[iterMonthStr].count += 1;
            months[iterMonthStr].total += t.amount;
          }
        }
      });
      iterDate.setMonth(iterDate.getMonth() + 1);
    }
    
    return Object.entries(months)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [transactions]);
  
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    let totalExpenses = 0;
    expandedCurrentMonth.forEach(t => {
      // We filter out 'Cartão de Crédito' category from the distribution chart 
      // because the individual items of the bill already have their own categories 
      // and we don't want to double count the expense.
      if (t.type === TransactionType.EXPENSE && t.category !== 'Cartão de Crédito') {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
        totalExpenses += t.amount;
      }
    });
    return Object.entries(categories).map(([name, value]) => ({ 
      name, 
      value,
      percentage: totalExpenses > 0 ? (value / totalExpenses) * 100 : 0
    }));
  }, [expandedCurrentMonth]);

  const COLORS = ['#ffffff', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)'];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Chart Card */}
        <div className="glass p-6 rounded-[2rem] flex flex-col h-[400px]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold tracking-tight">
                {chartType === 'history' ? 'Histórico de Rendimento' : 'Projeção Acumulada'}
              </h3>
              <p className="text-secondary text-xs">
                {chartType === 'history' 
                  ? 'Comparativo de receitas e despesas dos últimos 6 meses.' 
                  : 'Previsão de saldo para os próximos 6 meses com base em custos fixos.'}
              </p>
            </div>
            <div className="flex bg-white/5 p-1 rounded-xl">
              <button 
                onClick={() => setChartType('history')}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${chartType === 'history' ? 'bg-white text-black' : 'text-secondary hover:text-white'}`}
              >
                Histórico
              </button>
              <button 
                onClick={() => setChartType('projection')}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${chartType === 'projection' ? 'bg-white text-black' : 'text-secondary hover:text-white'}`}
              >
                Projeção
              </button>
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'history' ? (
                <BarChart data={performance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px' }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', paddingBottom: '20px' }} />
                  <Bar name="Receitas" dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={15} />
                  <Bar name="Despesas" dataKey="expense" fill="#fb7185" radius={[4, 4, 0, 0]} barSize={15} />
                </BarChart>
              ) : (
                <AreaChart data={projection}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px' }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Saldo Previsto']}
                  />
                  <Area type="monotone" dataKey="total" stroke="#fff" fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="glass p-6 rounded-[2rem] flex flex-col h-[400px]">
          <div className="mb-4">
            <h3 className="text-lg font-bold tracking-tight">Distribuição por Categoria</h3>
            <p className="text-secondary text-xs">Percentual de despesas por categoria de gasto para o mês atual.</p>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => [
                    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${props.payload.percentage.toFixed(1)}%)`,
                    name
                  ]}
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  align="center" 
                  iconType="circle" 
                  layout="horizontal"
                  wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }}
                  formatter={(value, entry: any) => (
                    <span className="text-secondary font-medium">
                      {value} <span className="text-white ml-1">{entry.payload.percentage.toFixed(1)}%</span>
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Grid: Statistics and Overdue Fixed */}
      <div className="grid grid-cols-1 gap-6 mt-8">
        <div className="glass rounded-[2rem] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Meses com Pendências Fixas</h2>
            <span className="px-3 py-1 rounded-full bg-rose-500/10 text-[10px] font-bold uppercase tracking-widest text-rose-400">
              {overdueFixedMonths.length} Meses Vencidos
            </span>
          </div>
          <div className="divide-y divide-white/5 flex-1 overflow-y-auto max-h-[400px]">
            {overdueFixedMonths.map(item => (
              <div key={item.month} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-secondary group-hover:text-white transition-colors">
                    <CalendarDays size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest">
                      {new Date(item.month + '-01T12:00:00').toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-[11px] text-secondary leading-none mt-1">
                      {item.count} transações fixas não pagas
                    </p>
                  </div>
                </div>
                <div className="text-right ml-auto">
                  <p className="font-black tabular-nums text-lg text-rose-400">
                    R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">Total Vencido</span>
                </div>
              </div>
            ))}
            {overdueFixedMonths.length === 0 && (
              <div className="p-12 text-center text-secondary text-sm italic">
                Nenhuma pendência fixa vencida encontrada. Ótimo trabalho!
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MonthlyView({ transactions, filterMonth, setFilterMonth, onEdit, onDelete, onPay }: { transactions: Transaction[], filterMonth: string, setFilterMonth: (m: string) => void, onEdit: (t: Transaction) => void, onDelete: (id: string) => void, onPay: (t: Transaction, month: string) => void, key?: string }) {
  const filtered = useMemo(() => {
    const monthTransactions = transactions.filter(t => !t.isFixed && t.date.startsWith(filterMonth) && t.paymentMethod !== 'credit');
    const fixedTransactions = transactions.filter(t => t.isFixed && t.paymentMethod !== 'credit');

    const result = [...monthTransactions];

    fixedTransactions.forEach(t => {
      const startMonth = t.date.substring(0, 7);
      const isWithinRange = filterMonth >= startMonth && (!t.endMonth || filterMonth <= t.endMonth.substring(0, 7));
      
      const hasOverride = monthTransactions.some(mt => mt.parentId === t.id);

      if (isWithinRange && !hasOverride) {
        result.push({ ...t, date: `${filterMonth}-${t.date.split('-')[2]}` });
      }
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions, filterMonth]);

  const incomes = filtered.filter(t => t.type === TransactionType.INCOME);
  const expenses = filtered.filter(t => t.type === TransactionType.EXPENSE);

  const totalIn = incomes.reduce((acc, t) => acc + t.amount, 0);
  const totalOut = expenses.reduce((acc, t) => acc + t.amount, 0);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-5 rounded-2xl">
        <h2 className="text-xl font-bold tracking-tight">Visão Geral Mensal</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
            <input 
              type="month" 
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-2 outline-none focus:border-white transition-colors text-sm"
            />
          </div>
        </div>
      </div>

      {/* SUMMARY LIST - TOP */}
      <div className="space-y-4">
        <div className="glass rounded-3xl p-6 border-b-4 border-white/5 shadow-2xl shadow-white/5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-secondary text-sm font-medium">Receita Bruta</span>
            <span className="text-emerald-400 font-bold tabular-nums text-lg">
              R$ {totalIn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-white/5">
            <span className="text-secondary text-sm font-medium">Despesas Totais</span>
            <span className="text-rose-400 font-bold tabular-nums text-lg">
              R$ {totalOut.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-white font-black uppercase tracking-widest text-xs">Saldo Mensal</span>
            <span className={`font-black text-3xl tabular-nums ${(totalIn - totalOut) >= 0 ? 'text-white' : 'text-rose-400'}`}>
              R$ {(totalIn - totalOut).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ENTRADAS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-400" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-secondary">Entradas</h3>
            </div>
            <span className="text-sm font-bold text-emerald-400">R$ {totalIn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="glass rounded-3xl overflow-hidden min-h-[100px] divide-y divide-white/5">
             {incomes.length > 0 ? (
                incomes.map(t => (
                  <div key={t.id} className="p-4 hover:bg-white/[0.02] transition-colors group flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-emerald-400">
                        <TrendingUp size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{t.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-[10px] text-secondary tabular-nums">
                             Venc: {t.date.split('-').reverse().slice(0,2).join('/')}
                           </span>
                           {t.paymentDate && (
                             <span className="text-[10px] text-emerald-400 tabular-nums">
                               Pago: {t.paymentDate.split('-').reverse().slice(0,2).join('/')}
                             </span>
                           )}
                           <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${t.status === TransactionStatus.PAID ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                              {t.status === TransactionStatus.PAID ? 'Pago' : 'Pendente'}
                           </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-auto">
                      <p className="text-sm font-bold tabular-nums text-emerald-400">
                        R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {t.status === TransactionStatus.PENDING && (
                           <button onClick={() => onPay(t, filterMonth)} className="px-3 py-1.5 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20">
                             Pagar
                           </button>
                         )}
                        <button onClick={() => onEdit(t)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-secondary hover:text-white">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => onDelete(t.id)} className="p-1.5 hover:bg-rose-500/10 rounded-lg transition-colors text-secondary hover:text-rose-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
             ) : (
                <div className="p-10 text-center text-xs text-secondary italic">Nenhuma entrada</div>
             )}
          </div>
        </div>

        {/* SAÍDAS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <TrendingDown size={18} className="text-rose-400" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-secondary">Saídas</h3>
            </div>
            <span className="text-sm font-bold text-rose-400">R$ {totalOut.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="glass rounded-3xl overflow-hidden min-h-[100px] divide-y divide-white/5">
             {expenses.length > 0 ? (
                expenses.map(t => (
                  <div key={t.id} className="p-4 hover:bg-white/[0.02] transition-colors group flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-rose-400">
                        <TrendingDown size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{t.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-[10px] text-secondary tabular-nums">
                             Venc: {t.date.split('-').reverse().slice(0,2).join('/')}
                           </span>
                           {t.paymentDate && (
                             <span className="text-[10px] text-emerald-400 tabular-nums">
                               Pago: {t.paymentDate.split('-').reverse().slice(0,2).join('/')}
                             </span>
                           )}
                           <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${t.status === TransactionStatus.PAID ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                              {t.status === TransactionStatus.PAID ? 'Pago' : 'Pendente'}
                           </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-auto">
                      <p className="text-sm font-bold tabular-nums text-white">
                        R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {t.status === TransactionStatus.PENDING && (
                           <button onClick={() => onPay(t, filterMonth)} className="px-3 py-1.5 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20">
                             Pagar
                           </button>
                         )}
                        <button onClick={() => onEdit(t)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-secondary hover:text-white">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => onDelete(t.id)} className="p-1.5 hover:bg-rose-500/10 rounded-lg transition-colors text-secondary hover:text-rose-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
             ) : (
                <div className="p-10 text-center text-xs text-secondary italic">Nenhuma saída</div>
             )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CreditCardView({ transactions, onEdit, onDelete, onPayBill, onCancelPayBill, onPay }: { transactions: Transaction[], onEdit: (t: Transaction) => void, onDelete: (id: string) => void, onPayBill: (month: string, amount: number) => void, onCancelPayBill: (month: string) => void, onPay: (t: Transaction, month: string) => void, key?: string }) {
  const [filterMonth, setFilterMonth] = useState('2026-05');
  
  const filtered = useMemo(() => {
    const monthTransactions = transactions.filter(t => !t.isFixed && t.paymentMethod === 'credit' && t.date.startsWith(filterMonth));
    const fixedTransactions = transactions.filter(t => t.isFixed && t.paymentMethod === 'credit');

    const result = [...monthTransactions];

    fixedTransactions.forEach(t => {
      const startMonth = t.date.substring(0, 7);
      const isWithinRange = filterMonth >= startMonth && (!t.endMonth || filterMonth <= t.endMonth.substring(0, 7));
      
      const hasOverride = monthTransactions.some(mt => mt.parentId === t.id);

      if (isWithinRange && !hasOverride) {
        result.push({ ...t, date: `${filterMonth}-${t.date.split('-')[2]}` });
      }
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions, filterMonth]);

  const isPaid = useMemo(() => {
    return transactions.some(t => 
      t.description === `Pagamento Fatura ${filterMonth}` && 
      t.category === 'Cartão de Crédito'
    );
  }, [transactions, filterMonth]);

  const total = filtered.reduce((acc, t) => acc + t.amount, 0);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass p-8 rounded-[2rem] bg-gradient-to-br from-white/5 via-transparent to-transparent">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[1.5rem] bg-white text-black flex items-center justify-center shadow-lg shadow-white/10">
            <CreditCard size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight">Cartão de Crédito</h2>
            <p className="text-secondary text-sm">Gerenciamento das faturas e gastos parcelados.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="relative">
             <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
             <input 
               type="month" 
               value={filterMonth}
               onChange={e => setFilterMonth(e.target.value)}
               className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-3 outline-none focus:border-white transition-colors text-sm font-semibold"
             />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="glass rounded-[2rem] overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold uppercase tracking-widest text-xs text-secondary">Lançamentos na Fatura</h3>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/5">{filtered.length} Itens</span>
            </div>
            <div className="divide-y divide-white/5">
              {filtered.map(t => (
                <div key={t.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-secondary">
                      <Plus size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{t.description}</p>
                      </div>
                      <p className="text-xs text-secondary">{t.category} • {t.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 ml-auto">
                    <p className="font-bold tabular-nums">
                      R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isPaid ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-secondary">
                          <X size={12} className="text-rose-400" />
                          <span>Fatura Paga</span>
                        </div>
                      ) : (
                        <>
                          {t.status === TransactionStatus.PENDING && (
                            <button onClick={() => onPay(t, filterMonth)} className="px-3 py-1.5 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20">
                              Pagar
                            </button>
                          )}
                          <button onClick={() => onEdit(t)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-secondary hover:text-white">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => onDelete(t.id)} className="p-1.5 hover:bg-rose-500/10 rounded-lg transition-colors text-secondary hover:text-rose-400">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="p-20 text-center text-secondary italic">
                  Nenhuma movimentação no cartão para este período.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass p-8 rounded-[2rem] space-y-6 border-t-2 border-white/10">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">Total da Fatura</p>
              <h3 className="text-4xl font-black tracking-tight tabular-nums">
                R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            


            {isPaid ? (
              <div className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Fatura Liquidada</p>
                    <p className="text-xs text-secondary">Essa fatura já foi paga.</p>
                  </div>
                </div>
                <button 
                  onClick={() => onCancelPayBill(filterMonth)}
                  className="w-full py-4 bg-rose-500/10 text-rose-400 font-black rounded-xl hover:bg-rose-500/20 transition-all text-xs uppercase tracking-widest"
                >
                  Cancelar Pagamento
                </button>
              </div>
            ) : (
              <button 
                onClick={() => onPayBill(filterMonth, total)}
                disabled={total === 0}
                className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs uppercase tracking-widest mt-4"
              >
                Pagar Fatura Total
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function FixedView({ transactions, balance, onAddClick, onEdit, onDelete }: { transactions: Transaction[], balance: number, onAddClick: () => void, onEdit: (t: Transaction) => void, onDelete: (id: string) => void, key?: string }) {
  const fixed = transactions.filter(t => t.isFixed);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="glass p-8 rounded-[2rem] flex flex-col md:flex-row items-center gap-6 bg-gradient-to-br from-white/5 to-transparent">
        <div className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center">
            <Repeat size={24} />
        </div>
        <div className="flex-1 text-center md:text-left space-y-1">
            <h3 className="text-lg font-bold tracking-tight">Fluxo Fixo Mensal</h3>
            <p className="text-secondary text-xs">Saldo projetado considerando entradas e saídas recorrentes.</p>
        </div>
        <div className="text-right">
            <p className={`text-2xl font-black tracking-tighter tabular-nums ${balance >= 0 ? 'text-white' : 'text-rose-400'}`}>
                {balance >= 0 ? '+ ' : '- '}
                R$ {Math.abs(balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-secondary mt-0.5">Saldo Projetado</p>
        </div>
      </div>

      <div className="glass rounded-[2rem] overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Transações Recorrentes</h2>
          <button 
            onClick={onAddClick}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border border-white/10"
          >
            <Plus size={16} />
            Novo Fixo
          </button>
        </div>
        <div className="divide-y divide-white/5">
          {fixed.map(t => (
            <div key={t.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
              <div className="flex items-center gap-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${t.type === TransactionType.INCOME ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                   <Repeat size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.description}</p>
                  <p className="text-[11px] text-secondary">
                    {t.paymentMethod === 'credit' ? 'Cartão de Crédito' : 'Recorrente Mensal'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 ml-auto">
                <p className={`font-bold tabular-nums text-base ${t.type === TransactionType.INCOME ? 'text-emerald-400' : 'text-white'}`}>
                  {t.type === TransactionType.INCOME ? '+ ' : '- '}
                  R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(t)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-secondary hover:text-white">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => onDelete(t.id)} className="p-1.5 hover:bg-rose-500/10 rounded-lg transition-colors text-secondary hover:text-rose-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function LoansView({ reports }: { reports: LoanReport[], key?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {reports.map(report => (
        <div key={report.person} className="glass p-6 rounded-[2rem] space-y-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight">{report.person}</h3>
            <div className="w-8 h-8 rounded-full glass flex items-center justify-center">
              <HandCoins size={16} />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
                <span className="text-secondary font-medium">Emprestado</span>
                <span className="font-semibold text-white/80">R$ {report.out.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs">
                <span className="text-secondary font-medium">Devolvido</span>
                <span className="font-semibold text-white/80">R$ {report.in.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="pt-2 border-t border-white/5 flex justify-between items-baseline">
                <span className="text-[10px] uppercase tracking-widest font-bold text-secondary">A pagar</span>
                <span className={`text-xl font-black tabular-nums ${report.balance > 0 ? 'text-white' : 'text-emerald-400'}`}>
                    R$ {Math.abs(report.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
            </div>
          </div>
          
          <div className="absolute top-0 right-0 p-4 pointer-events-none transition-opacity duration-500">
             <span className="text-8xl font-black text-white/[0.03] select-none absolute -right-2 -top-6 italic">
                {report.person.charAt(0)}
             </span>
          </div>
        </div>
      ))}
      {reports.length === 0 && (
        <div className="col-span-full py-16 text-center glass rounded-[2rem]">
          <HandCoins size={48} className="mx-auto text-white/5 mb-4" />
          <h3 className="text-lg font-bold">Sem dívidas ativas</h3>
          <p className="text-secondary text-sm">Parece que todos os empréstimos foram quitados.</p>
        </div>
      )}
    </motion.div>
  );
}
