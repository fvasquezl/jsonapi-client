export interface AuthUser {
    id: string;
    name: string;
}

export interface Comment {
    id: string;
    body: string;
    createdAt?: string;
    author?: { id: string; name?: string } | null;
}

export interface Article {
    id: string;
    title: string;
    slug: string;
    content: string;
    categories?: { id: string; name?: string } | null;
    authors?: { id: string; name?: string } | null;
    comments?: Comment[];
}

export interface Category {
    id: string;
    name: string;
}

// Forma de `meta.page` que devuelve la paginación de Laravel JSON:API (PagePagination).
export interface PageMeta {
    currentPage: number;
    from: number;
    to: number;
    lastPage: number;
    perPage: number;
    total: number;
}
