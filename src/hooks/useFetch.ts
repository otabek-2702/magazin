// composables/useFetch.ts
import { ref, computed, watch, onUnmounted } from "vue";
import { AxiosResponse } from "axios";
import axios from "@/plugins/axios";
import { debounce } from "@/utils/debounce";

// Types and Interfaces
interface PaginationMeta {
  current_page: number;
  total: number;
  total_pages: number;
  per_page: number;
}

interface FetchOptions {
  additionalParams?: Record<string, any>;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface UseFetchConfig {
  baseUrl: string;
  resourceKey?: string;
  immediate?: boolean;
  initialPage?: number;
  perPage?: number;
  debounceMs?: number;
  params?: Record<string, any>;
}

interface FetchState<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  totalItems: number;
  error: string | null;
  isError: boolean;
  isFetching: boolean;
  searchQuery: string;
  totalQuantity: string | number;
  totalPrice: string | number;
}

export function useFetch<T = any>(config: UseFetchConfig) {
  // State
  const state = ref<FetchState<T>>({
    items: [],
    currentPage: config.initialPage || 1,
    totalPages: 1,
    rowsPerPage: config.perPage || 10,
    totalItems: 0,
    error: null,
    isError: false,
    isFetching: false,
    searchQuery: "",
    totalQuantity: 0,
    totalPrice: 0,
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
  const fetchData = async (force = false, options: FetchOptions = {}) => {
    if (
      !force &&
      (state.value.isFetching ||
        state.value.currentPage === lastFetchedPage.value)
    ) {
      return;
    }

    try {
      state.value.isFetching = true;
      state.value.error = null;
      state.value.isError = false;
      const params = {
        page: state.value.currentPage,
        paginate: state.value.rowsPerPage,
        search: finalSearch.value,
        ...config?.params,
        ...options.additionalParams,
      };

      const { data }: AxiosResponse = await axios.get(`/${config.baseUrl}`, {
        params,
      });

      // Update items based on resourceKey or default structure
      state.value.items = data.data || data[config.resourceKey || ""] || [];
      lastFetchedPage.value = state.value.currentPage;

      state.value.totalQuantity =  data.total_quantity;
      state.value.totalPrice =  data.total_price;

      // Update pagination meta
      const meta = data.meta?.pagination as PaginationMeta;
      if (meta) {
        state.value.currentPage = meta.current_page;
        state.value.totalItems = meta.total;
        state.value.totalPages = meta.total_pages;
        state.value.rowsPerPage = meta.per_page;
      }

      options.onSuccess?.(data);
    } catch (error) {
      state.value.error =
        error instanceof Error ? error.message : "An error occurred";
      state.value.isError = true;
      state.value.items = [];
      options.onError?.(error as Error);
    } finally {
      state.value.isFetching = false;
    }
  };

  // Debounced version of fetchData
  const debouncedFetchData = debounce(fetchData, config.debounceMs || 300);

  // Search handler
  const handleSearch = (options: FetchOptions = {}) => {
    finalSearch.value = state.value.searchQuery;
    state.value.currentPage = 1;
    fetchData(true, options);
  };

  // Reset function
  const resetFetch = () => {
    state.value = {
      items: [],
      currentPage: config.initialPage || 1,
      totalPages: 1,
      rowsPerPage: config.perPage || 10,
      totalItems: 0,
      error: null,
      isError: false,
      isFetching: false,
      searchQuery: "",
      totalQuantity: 0,
      totalPrice: 0,
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
      if (!state.value.isFetching) {
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

  // Initial fetch if immediate is true
  if (config.immediate) {
    fetchData(true);
  }

  return {
    // State (wrapped in computed to make them readonly from outside)
    items: computed(() => state.value.items),
    currentPage: computed(() => state.value.currentPage),
    totalPages: computed(() => state.value.totalPages),
    rowsPerPage: computed(() => state.value.rowsPerPage),
    totalItems: computed(() => state.value.totalItems),
    isFetching: computed(() => state.value.isFetching),
    isError: computed(() => state.value.isError),
    error: computed(() => state.value.error),
    searchQuery: computed({
      get: () => state.value.searchQuery,
      set: (value) => (state.value.searchQuery = value),
    }),

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
