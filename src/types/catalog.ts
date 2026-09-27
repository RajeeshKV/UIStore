/**
 * Catalog-specific frontend types.
 * These wrap the raw API params into a typed, URL-serializable shape.
 */

/** All query params the backend accepts for GET /api/v1/store/products */
export interface CatalogParams {
  Page?: number;
  PageSize?: number;
  Search?: string;
  CategorySlug?: string;
  BrandSlug?: string;
  MinPrice?: number;
  MaxPrice?: number;
  IsFeatured?: boolean;
  InStockOnly?: boolean;
  SortBy?: SortByValue;
  SortDirection?: "asc" | "desc";
  /** Serialised as AttributeFilters[0][attributeName]=Color&AttributeFilters[0][attributeValue]=Red */
  AttributeFilters?: AttributeFilter[];
}

export interface AttributeFilter {
  attributeName: string;
  attributeValue: string;
}

export type SortByValue =
  | "featured"
  | "newest"
  | "price"
  | "name";

export interface SortOption {
  label: string;
  value: string; // combined SortBy+SortDirection e.g. "price:asc"
  sortBy: SortByValue;
  sortDirection: "asc" | "desc";
}

export const SORT_OPTIONS: SortOption[] = [
  { label: "Featured",          value: "featured:desc", sortBy: "featured", sortDirection: "desc" },
  { label: "Newest",            value: "newest:desc",   sortBy: "newest",   sortDirection: "desc" },
  { label: "Price: Low to High",value: "price:asc",     sortBy: "price",    sortDirection: "asc"  },
  { label: "Price: High to Low",value: "price:desc",    sortBy: "price",    sortDirection: "desc" },
  { label: "Name: A to Z",      value: "name:asc",      sortBy: "name",     sortDirection: "asc"  },
  { label: "Name: Z to A",      value: "name:desc",     sortBy: "name",     sortDirection: "desc" },
];

export const DEFAULT_PAGE_SIZE = 24;
export const DEFAULT_SORT: SortOption = SORT_OPTIONS[0];

/** Parse URLSearchParams into CatalogParams */
export function parseCatalogParams(sp: URLSearchParams): CatalogParams {
  const p: CatalogParams = {};
  if (sp.get("search"))    p.Search        = sp.get("search")!.slice(0, 200);
  if (sp.get("category"))  p.CategorySlug  = sp.get("category")!;
  if (sp.get("brand"))     p.BrandSlug     = sp.get("brand")!;
  if (sp.get("page"))      p.Page          = Math.max(1, parseInt(sp.get("page")!, 10) || 1);
  if (sp.get("pageSize"))  p.PageSize      = Math.min(48, parseInt(sp.get("pageSize")!, 10) || DEFAULT_PAGE_SIZE);
  if (sp.get("inStock") === "true") p.InStockOnly = true;
  if (sp.get("featured") === "true") p.IsFeatured  = true;
  if (sp.get("minPrice"))  p.MinPrice      = parseFloat(sp.get("minPrice")!);
  if (sp.get("maxPrice"))  p.MaxPrice      = parseFloat(sp.get("maxPrice")!);

  const sortVal = sp.get("sort");
  if (sortVal) {
    const found = SORT_OPTIONS.find((o) => o.value === sortVal);
    if (found) {
      p.SortBy        = found.sortBy;
      p.SortDirection = found.sortDirection;
    }
  }
  return p;
}

/** Serialise CatalogParams back to a URLSearchParams for URL updates */
export function buildCatalogUrl(params: CatalogParams, baseSlug?: string): string {
  const sp = new URLSearchParams();
  if (params.Search)        sp.set("search",    params.Search);
  if (params.CategorySlug)  sp.set("category",  params.CategorySlug);
  if (params.BrandSlug)     sp.set("brand",     params.BrandSlug);
  if (params.Page && params.Page > 1)  sp.set("page", String(params.Page));
  if (params.PageSize && params.PageSize !== DEFAULT_PAGE_SIZE)
    sp.set("pageSize", String(params.PageSize));
  if (params.InStockOnly)   sp.set("inStock",   "true");
  if (params.IsFeatured)    sp.set("featured",  "true");
  if (params.MinPrice != null) sp.set("minPrice", String(params.MinPrice));
  if (params.MaxPrice != null) sp.set("maxPrice", String(params.MaxPrice));
  if (params.SortBy) {
    const opt = SORT_OPTIONS.find(
      (o) => o.sortBy === params.SortBy && o.sortDirection === params.SortDirection,
    );
    if (opt) sp.set("sort", opt.value);
  }
  const qs = sp.toString();
  const base = baseSlug ?? "/shop";
  return qs ? `${base}?${qs}` : base;
}

/** Convert CatalogParams to the raw Record<string, string|number|undefined> that storeApi.getProducts expects */
export function catalogParamsToApiParams(
  p: CatalogParams,
): Record<string, string | number | undefined> {
  const out: Record<string, string | number | undefined> = {};
  if (p.Page)          out.Page          = p.Page;
  if (p.PageSize)      out.PageSize      = p.PageSize ?? DEFAULT_PAGE_SIZE;
  else                 out.PageSize      = DEFAULT_PAGE_SIZE;
  if (p.Search)        out.Search        = p.Search;
  if (p.CategorySlug)  out.CategorySlug  = p.CategorySlug;
  if (p.BrandSlug)     out.BrandSlug     = p.BrandSlug;
  if (p.MinPrice != null) out.MinPrice   = p.MinPrice;
  if (p.MaxPrice != null) out.MaxPrice   = p.MaxPrice;
  if (p.IsFeatured)    out.IsFeatured    = "true";
  if (p.InStockOnly)   out.InStockOnly   = "true";
  if (p.SortBy)        out.SortBy        = p.SortBy;
  if (p.SortDirection) out.SortDirection = p.SortDirection;
  return out;
}
