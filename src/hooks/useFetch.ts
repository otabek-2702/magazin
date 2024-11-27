// composables/useFetch.ts
import { ref, computed, watch } from "vue";
import { AxiosResponse } from "axios";
import axios from "@/plugins/axios";
import { debounce } from "@/utils/debounce";
import { omit } from "@/helpers";

// Types and Interfaces
interface PaginationMeta {
  current_page: number;
  total: number;
  total_pages: number;
  per_page: number;
}

interface UseFetchConfig {
  baseUrl: string;
  resourceKey?: string;
  initialPage?: number;
  perPage?: number;
  debounceMs?: number;
  params?: Record<string, string | number>;
}

interface FetchState<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  totalItems: number;

  isFetching: boolean;
  searchQuery: string;
  metaDatas: Record<any, string | number>;
  totalQuantity: string | number;
  totalPrice: string | number;
  params: Record<any, string | number>;
}

export function useFetch<T = any>(config: UseFetchConfig) {
  // State
  const state = ref<FetchState<T>>({
    items: [],
    currentPage: config.initialPage || 1,
    totalPages: 1,
    rowsPerPage: config.perPage || 30,
    totalItems: 0,
    isFetching: false,
    searchQuery: "",
    metaDatas: {},
    totalQuantity: 0,
    totalPrice: 0,
    params: config.params,
  });

  // Internal state
  const finalSearch = ref("");
  const lastFetchedPage = ref<number | null>(null);

  // Computed Properties
  const paginationData = computed(() => {
    const firstIndex = state.value.items.length
      ? (state.value.currentPage - 1) * state.value.rowsPerPage + 1
      : 0;
    const lastIndex = Math.min(
      firstIndex + state.value.rowsPerPage - 1,
      state.value.totalItems
    );
    return `${firstIndex}-${lastIndex} of ${state.value.totalItems}`;
  });

  // Core fetch function
  const fetchData = async (force = false) => {
    if (
      !force &&
      (state.value.isFetching ||
        state.value.currentPage === lastFetchedPage.value)
    ) {
      return;
    }

    try {
      state.value.isFetching = true;
      const params = {
        page: state.value.currentPage,
        paginate: state.value.rowsPerPage,
        search: finalSearch.value,
        ...state.value.params,
      };

      const { data }: AxiosResponse = await axios.get(`/${config.baseUrl}`, {
        params,
      });

      // Update items based on resourceKey or default structure
      state.value.items =
        data.data || data[config.resourceKey || config.baseUrl || ""] || [];
      lastFetchedPage.value = state.value.currentPage;

      // Additional datas
      state.value.metaDatas = omit(data, [
        "data",
        config.resourceKey || config.baseUrl || "",
        "pagination",
      ]);

      // Update pagination meta
      const meta = data.meta?.pagination as PaginationMeta;
      if (meta) {
        state.value.currentPage = meta.current_page;
        state.value.totalItems = meta.total;
        state.value.totalPages = meta.total_pages;
        state.value.rowsPerPage = meta.per_page;
      }
    } catch (error) {
      state.value.items = [];
    } finally {
      state.value.isFetching = false;
    }
  };

  // Debounced version of fetchData
  const debouncedFetchData = debounce(fetchData, config.debounceMs || 300);

  // Search handler
  const handleSearch = () => {
    finalSearch.value = state.value.searchQuery;
    state.value.currentPage = 1;
    fetchData(true);
  };

  // Reset function
  const resetFetch = () => {
    state.value = {
      items: [],
      currentPage: config.initialPage || 1,
      totalPages: 1,
      rowsPerPage: config.perPage || 30,
      totalItems: 0,
      isFetching: false,
      searchQuery: "",
      metaDatas: {},
      totalQuantity: 0,
      totalPrice: 0,
      params: config.params,
    };
    finalSearch.value = "";
    lastFetchedPage.value = null;
  };

  // Update per page
  const updatePerPage = (newPerPage: number) => {
    state.value.rowsPerPage = newPerPage;
    state.value.currentPage = 1;
    fetchData(true);
  };

  // Watchers
  watch(
    () => state.value.searchQuery,
    (newVal) => {
      if (!newVal) {
        finalSearch.value = "";
        state.value.currentPage = 1;
        fetchData(true);
      }
    }
  );

  watch(
    () => state.value.currentPage,
    () => {
      if (state.value.currentPage > state.value.totalPages) {
        state.value.currentPage = Math.max(1, state.value.totalPages);
      } else if (!state.value.isFetching) {
        debouncedFetchData();
      }
    }
  );

  watch(
    () => state.value.totalPages,
    (newTotalPages) => {
      if (state.value.currentPage > newTotalPages) {
        state.value.currentPage = Math.max(1, newTotalPages);
      }
    }
  );

  watch(
    () => state.value.params,
    () => {
      state.value.currentPage = 1;
      fetchData(true);
    }
  );

  fetchData(true);

  return {
    // State (wrapped in computed to make them readonly from outside)
    items: computed(() => state.value.items),
    currentPage: computed(() => state.value.currentPage),
    totalPages: computed(() => state.value.totalPages),
    rowsPerPage: computed(() => state.value.rowsPerPage),
    totalItems: computed(() => state.value.totalItems),
    isFetching: computed(() => state.value.isFetching),
    searchQuery: computed({
      get: () => state.value.searchQuery,
      set: (value) => (state.value.searchQuery = value),
    }),
    metaDatas: computed(() => state.value.metaDatas),

    // Computed
    paginationData,

    // Methods
    fetchData,
    debouncedFetchData,
    handleSearch,
    resetFetch,
    updatePerPage,

    // For template binding
    state,
  };
}
