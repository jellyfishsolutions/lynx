
export interface APIResponseWrapper {
    onSuccess(response: any) : any;
    onError(error: Error): any;
}

export class DefaultAPIResponseWrapper implements APIResponseWrapper {
    onError(error: Error): any {
        return {
            success: false,
            error: error.message
        };
    }

    onSuccess(response: any): any {
        if (typeof response === "boolean") {
            return { success: response };
        }
        if (response.serialize) {
            response = response.serialize();
        }
        return  { success: true, data: response };
    }

}