import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarDays,
  Filter,
  Landmark,
  ReceiptText,
  Wallet,
  ScrollText,
} from "lucide-react";
import toast from "react-hot-toast";
import { getSales } from "../services/sale.service";

type Sale = {
  id: number;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paidAmount: number;
  remaining: number;
  createdAt: string;
  customer?: string | null;
  product?: {
    id: number;
    name: string;
  };
  client?: {
    id: number;
    name: string;
  };
};

type QuickFilter = "today" | "yesterday" | "week" | "month" | "year";

const quickFilters: { key: QuickFilter; label: string }[] = [
  { key: "today", label: "Aujourd’hui" },
  { key: "yesterday", label: "Hier" },
  { key: "week", label: "Cette semaine" },
  { key: "month", label: "Ce mois" },
  { key: "year", label: "Cette année" },
];

export default function Caisse() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeFilter, setActiveFilter] = useState<QuickFilter>("today");
  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState(getTodayDate());

  const fetchSales = async () => {
    try {
      setLoading(true);
      const data = await getSales();
      setSales(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des ventes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const saleDate = new Date(sale.createdAt);
      const onlyDate = sale.createdAt.slice(0, 10);

      const inRange = onlyDate >= startDate && onlyDate <= endDate;
      const inQuick = matchesQuickFilter(saleDate, activeFilter);

      return inRange && inQuick;
    });
  }, [sales, startDate, endDate, activeFilter]);

  const totalVendu = useMemo(
    () => filteredSales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0),
    [filteredSales]
  );

  const totalEncaisse = useMemo(
    () => filteredSales.reduce((sum, sale) => sum + Number(sale.paidAmount || 0), 0),
    [filteredSales]
  );

  const totalReste = useMemo(
    () => filteredSales.reduce((sum, sale) => sum + Number(sale.remaining || 0), 0),
    [filteredSales]
  );

  const nombreTransactions = filteredSales.length;

  const historique = useMemo(
    () =>
      filteredSales
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [filteredSales]
  );

  const formatCurrency = (value: number) =>
    `${value.toLocaleString("fr-FR")} FCFA`;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Activités de caisse
            </h1>
            <p className="mt-1 text-gray-500">
              SamaStock • Résumé réel des ventes
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-xl bg-slate-800 px-4 py-3 text-sm font-medium text-white"
            >
              Clôturer
            </button>

            <button
              type="button"
              className="rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white"
            >
              Encaisser
            </button>

            <button
              type="button"
              className="rounded-xl bg-yellow-500 px-4 py-3 text-sm font-medium text-slate-900"
            >
              Décaisser
            </button>

            <button
              type="button"
              onClick={fetchSales}
              className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white"
            >
              Actualiser
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-3">
          {quickFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => {
                setActiveFilter(filter.key);
                applyQuickFilterDates(filter.key, setStartDate, setEndDate);
              }}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                activeFilter === filter.key
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-blue-300 bg-white text-blue-600 hover:bg-blue-50"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 p-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Début
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-gray-300 px-3 py-3">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-transparent outline-none"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 p-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Fin
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-gray-300 px-3 py-3">
              <CalendarDays className="h-5 w-5 text-red-500" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-transparent outline-none"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white"
            >
              <Filter className="h-5 w-5" />
              Filtrer
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <CaisseStatCard
          title="Montant total vendu"
          subtitle="Total des ventes enregistrées"
          icon={
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
          }
          value={formatCurrency(totalVendu)}
          valueColor="text-blue-600"
          borderColor="border-blue-500"
        />

        <CaisseStatCard
          title="Encaissements"
          subtitle="Montants déjà payés"
          icon={
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <ArrowDownToLine className="h-8 w-8 text-green-600" />
            </div>
          }
          value={formatCurrency(totalEncaisse)}
          valueColor="text-green-600"
          borderColor="border-green-500"
        />

        <CaisseStatCard
          title="Reste à encaisser"
          subtitle="Montants restant à payer"
          icon={
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <ArrowUpFromLine className="h-8 w-8 text-red-500" />
            </div>
          }
          value={formatCurrency(totalReste)}
          valueColor="text-red-500"
          borderColor="border-red-500"
        />

        <CaisseStatCard
          title="Nombre de transactions"
          subtitle="Nombre total de ventes"
          icon={
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-100">
              <ReceiptText className="h-8 w-8 text-cyan-500" />
            </div>
          }
          value={String(nombreTransactions)}
          valueColor="text-cyan-500"
          borderColor="border-cyan-500"
        />
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <ScrollText className="h-7 w-7 text-slate-800" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Historique des ventes
            </h2>
            <p className="text-gray-500">
              Données réelles issues des ventes enregistrées
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
            Chargement...
          </div>
        ) : historique.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
            Aucune vente trouvée pour ce filtre.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b text-sm text-gray-500">
                  <th className="pb-3">Produit</th>
                  <th className="pb-3">Client</th>
                  <th className="pb-3">Qté</th>
                  <th className="pb-3">Prix unitaire</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Payé</th>
                  <th className="pb-3">Reste</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {historique.map((sale) => (
                  <tr key={sale.id} className="border-b">
                    <td className="py-4 font-medium text-slate-900">
                      {sale.product?.name || "-"}
                    </td>
                    <td>{sale.client?.name || sale.customer || "-"}</td>
                    <td>{sale.quantity}</td>
                    <td>{formatCurrency(Number(sale.unitPrice || 0))}</td>
                    <td className="font-semibold text-slate-900">
                      {formatCurrency(Number(sale.totalAmount || 0))}
                    </td>
                    <td className="font-semibold text-green-600">
                      {formatCurrency(Number(sale.paidAmount || 0))}
                    </td>
                    <td className="font-semibold text-red-500">
                      {formatCurrency(Number(sale.remaining || 0))}
                    </td>
                    <td>{new Date(sale.createdAt).toLocaleString("fr-FR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        Les sections **Décaissements réels**, **solde réel de caisse** et **moyens de paiement**
        ne peuvent pas encore être exactes sans données dédiées côté backend. La page
        est maintenant branchée sur les **ventes réelles** de SamaStock.
      </div>
    </section>
  );
}

function CaisseStatCard({
  title,
  subtitle,
  icon,
  value,
  valueColor,
  borderColor,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  value: string;
  valueColor: string;
  borderColor: string;
}) {
  return (
    <div className={`rounded-3xl border-t-4 ${borderColor} bg-white p-6 shadow-sm`}>
      <div className="flex items-start gap-4">
        {icon}

        <div className="flex-1">
          <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-gray-500">{subtitle}</p>

          <div className="mt-5 flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Landmark className="h-5 w-5" />
              <span>SamaStock</span>
            </div>

            <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTodayDate() {
  const date = new Date();
  return date.toISOString().slice(0, 10);
}

function matchesQuickFilter(date: Date, filter: QuickFilter) {
  const now = new Date();
  const target = new Date(date);

  if (filter === "today") {
    return target.toDateString() === now.toDateString();
  }

  if (filter === "yesterday") {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return target.toDateString() === yesterday.toDateString();
  }

  if (filter === "week") {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    return target >= weekStart && target <= now;
  }

  if (filter === "month") {
    return (
      target.getMonth() === now.getMonth() &&
      target.getFullYear() === now.getFullYear()
    );
  }

  if (filter === "year") {
    return target.getFullYear() === now.getFullYear();
  }

  return true;
}

function applyQuickFilterDates(
  filter: QuickFilter,
  setStartDate: (value: string) => void,
  setEndDate: (value: string) => void
) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  if (filter === "today") {
    setStartDate(today);
    setEndDate(today);
    return;
  }

  if (filter === "yesterday") {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const y = yesterday.toISOString().slice(0, 10);
    setStartDate(y);
    setEndDate(y);
    return;
  }

  if (filter === "week") {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    setStartDate(weekStart.toISOString().slice(0, 10));
    setEndDate(today);
    return;
  }

  if (filter === "month") {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    setStartDate(monthStart.toISOString().slice(0, 10));
    setEndDate(today);
    return;
  }

  if (filter === "year") {
    const yearStart = new Date(now.getFullYear(), 0, 1);
    setStartDate(yearStart.toISOString().slice(0, 10));
    setEndDate(today);
  }
}