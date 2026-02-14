import axios from 'axios';

const apiClient = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

let isRefreshing = false;
let failedRequestsQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
}> = [];

function processQueue(error: unknown = null) {
    failedRequestsQueue.forEach((promise) => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve(undefined);
        }
    });
    failedRequestsQueue = [];
}

// Endpoints that should NOT trigger the refresh/redirect cycle
const AUTH_CHECK_ENDPOINTS = ['/auth/me', '/auth/refresh', '/auth/logout'];

function isAuthCheckEndpoint(url: string | undefined): boolean {
    if (!url) return false;
    return AUTH_CHECK_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Skip retry logic for auth-checking endpoints to prevent loops
        if (isAuthCheckEndpoint(originalRequest.url)) {
            return Promise.reject(error);
        }

        // If it's a 401 and hasn't been retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Queue requests while a refresh is in progress
                return new Promise((resolve, reject) => {
                    failedRequestsQueue.push({ resolve, reject });
                }).then(() => apiClient(originalRequest));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await apiClient.post('/auth/refresh');
                processQueue();
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                // Redirect to login on refresh failure
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
