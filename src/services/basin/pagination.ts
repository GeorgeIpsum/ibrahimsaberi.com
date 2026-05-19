export const POSTS_PER_PAGE = 20;

export type PageInfo = {
	pageNumber: number;
	totalPages: number;
	hasPrev: boolean;
	hasNext: boolean;
};

export function makePageInfo(
	pageNumber: number,
	totalItems: number,
	pageSize: number = POSTS_PER_PAGE,
): PageInfo {
	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
	const clamped = Math.min(Math.max(1, pageNumber), totalPages);
	return {
		pageNumber: clamped,
		totalPages,
		hasPrev: clamped > 1,
		hasNext: clamped < totalPages,
	};
}

// Page 1 lives at the base path (canonical); pages 2+ at `${base}/page/N`.
export function prevHref(pageNumber: number, basePath: string = "/basin"): string {
	return pageNumber === 2 ? basePath : `${basePath}/page/${pageNumber - 1}`;
}

export function nextHref(pageNumber: number, basePath: string = "/basin"): string {
	return `${basePath}/page/${pageNumber + 1}`;
}
