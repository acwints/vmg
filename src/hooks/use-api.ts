"use client";

import { useState, useEffect } from "react";
import {
  getCompanies,
  getCompany,

  getMemos,
  getActivityLogs,
  toPortfolioCompany,

  getFundOverview,
  getFundDetail,
  getInvestments,
  getPortfolioConstruction,
  getDeploymentModel,
  getFundReturns,
  toFundOverview,
  toFundDetail,
  toInvestment,
  toPortfolioConstruction,
  toDeploymentModel,
  toFundReturns,
  getMacroIndicators,
  getMacroSeries,
  getFundingRounds,
  toFundingRound,
  getPipelineDeals,
  toPipelineDeal,
  type CompanyListResponse,
  type CompanyResponse,

  type MemoResponse,
  type ActivityLogResponse,
  type FundOverviewApiResponse,
  type FundDetailApiResponse,
  type InvestmentApiResponse,
  type PortfolioConstructionApiResponse,
  type DeploymentModelApiResponse,
  type FundReturnsApiResponse,
  type MacroIndicator,
  type MacroSeries,
  type FundingRoundApiResponse,
  type PipelineDealApiResponse,
} from "@/lib/api";
import type { WorkspaceSummary } from "@/types";


interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Generic hook
function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []): UseApiState<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

// --- Typed hooks ---

export function useCompanies(params?: {
  portfolio?: string;
  sector?: string;
  status?: string;
  search?: string;
}) {
  const { data, loading, error } = useApi<CompanyListResponse>(
    () => getCompanies(params),
    [params?.portfolio, params?.sector, params?.status, params?.search]
  );

  return {
    companies: data?.companies.map(toPortfolioCompany) || [],
    total: data?.total || 0,
    loading,
    error,
  };
}

export function useCompany(slug: string) {
  const { data, loading, error } = useApi<CompanyResponse>(
    () => getCompany(slug),
    [slug]
  );

  return {
    company: data ? toPortfolioCompany(data) : null,
    loading,
    error,
  };
}

export function useStats() {
  const { data, loading, error } = useApi<CompanyListResponse>(
    () => getCompanies(),
    []
  );

  function deriveStats(companies: CompanyResponse[]) {
    return {
      totalCompanies: companies.length,
      activeCompanies: companies.filter((c) => c.status === "active").length,
      realizedCompanies: companies.filter((c) => c.status === "realized").length,
      sectors: new Set(companies.map((c) => c.sector)).size,
    };
  }

  const all = data?.companies ?? [];
  const consumerList = all.filter((c) => c.portfolio === "consumer");
  const technologyList = all.filter((c) => c.portfolio === "technology");

  return {
    overall: data ? deriveStats(all) : null,
    technology: data ? deriveStats(technologyList) : null,
    consumer: data ? deriveStats(consumerList) : null,
    loading,
    error,
  };
}

export function useWorkspaceSummary(enabled: boolean) {
  const [state, setState] = useState<UseApiState<WorkspaceSummary>>({
    data: null,
    loading: enabled,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState({ data: null, loading: true, error: null });

    fetch("/api/google/workspace-summary", {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        return (await response.json()) as WorkspaceSummary;
      })
      .then((data) => {
        if (!cancelled) {
          setState({ data, loading: false, error: null });
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setState({ data: null, loading: false, error: error.message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return {
    summary: state.data,
    loading: state.loading,
    error: state.error,
  };
}

export function useMemos() {
  const { data, loading, error } = useApi<{ memos: MemoResponse[]; total: number }>(
    getMemos,
    []
  );

  return {
    memos: data?.memos || [],
    total: data?.total || 0,
    loading,
    error,
  };
}

export function useActivityLogs(companyId: string | undefined) {
  const { data, loading, error } = useApi<ActivityLogResponse[]>(
    () => (companyId ? getActivityLogs(companyId) : Promise.resolve([])),
    [companyId]
  );

  return {
    logs: data || [],
    loading,
    error,
  };
}

// --- Fund Model hooks ---

export function useFundOverview() {
  const { data, loading, error } = useApi<FundOverviewApiResponse>(getFundOverview, []);
  return {
    overview: data ? toFundOverview(data) : null,
    loading,
    error,
  };
}

export function useFundDetail(slug: string) {
  const { data, loading, error } = useApi<FundDetailApiResponse>(
    () => getFundDetail(slug),
    [slug]
  );
  return {
    fund: data ? toFundDetail(data) : null,
    loading,
    error,
  };
}

export function useInvestments(params?: { fundSlug?: string; realized?: boolean }) {
  const { data, loading, error } = useApi<InvestmentApiResponse[]>(
    () => getInvestments(params),
    [params?.fundSlug, params?.realized]
  );
  return {
    investments: data?.map(toInvestment) || [],
    loading,
    error,
  };
}

export function usePortfolioConstruction() {
  const { data, loading, error } = useApi<PortfolioConstructionApiResponse>(
    getPortfolioConstruction,
    []
  );
  return {
    construction: data ? toPortfolioConstruction(data) : null,
    loading,
    error,
  };
}

export function useDeploymentModel(fundSlug: string) {
  const { data, loading, error } = useApi<DeploymentModelApiResponse>(
    () => getDeploymentModel(fundSlug),
    [fundSlug]
  );
  return {
    deployment: data ? toDeploymentModel(data) : null,
    loading,
    error,
  };
}

export function useFundReturns() {
  const { data, loading, error } = useApi<FundReturnsApiResponse>(
    getFundReturns,
    []
  );
  return {
    returns: data ? toFundReturns(data) : null,
    loading,
    error,
  };
}

// --- Macro hooks ---

export function useMacroIndicators() {
  const { data, loading, error } = useApi<MacroIndicator[]>(getMacroIndicators, []);
  return { indicators: data || [], loading, error };
}

export function useMacroSeries(seriesId: string | null) {
  const { data, loading, error } = useApi<MacroSeries>(
    () => seriesId ? getMacroSeries(seriesId) : Promise.reject("no series"),
    [seriesId]
  );
  return { series: data, loading, error };
}

// --- Funding Rounds hooks ---

export function useFundingRounds(companyId?: string) {
  const { data, loading, error } = useApi<FundingRoundApiResponse[]>(
    () => getFundingRounds(companyId),
    [companyId]
  );
  return {
    rounds: data?.map(toFundingRound) || [],
    loading,
    error,
  };
}

// --- Pipeline hooks ---

export function usePipelineDeals() {
  const { data, loading, error } = useApi<PipelineDealApiResponse[]>(
    getPipelineDeals,
    []
  );
  return {
    deals: data?.map(toPipelineDeal) || [],
    loading,
    error,
  };
}
