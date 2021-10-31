export interface HttpResponse {
    status: number;
    message: string;
    data?: any;
    error?: any;
}

export interface FieldErrorResponse {
    errors: {
        field: string;
        message: string;
    }[];
    code: number;
}