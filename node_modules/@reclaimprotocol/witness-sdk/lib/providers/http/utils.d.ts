import { ArraySlice, ProviderParams } from '../../types';
export type JSONIndex = {
    start: number;
    end: number;
};
type HTTPProviderParams = ProviderParams<'http'>;
export declare function extractHTMLElement(html: string, xpathExpression: string, contentsOnly: boolean): string;
export declare function extractHTMLElementIndex(html: string, xpathExpression: string, contentsOnly: boolean): {
    start: number;
    end: number;
};
export declare function extractJSONValueIndex(json: string, jsonPath: string): {
    start: number;
    end: number;
};
export declare function buildHeaders(input: HTTPProviderParams['headers']): string[];
/**
 * Converts position in HTTP response body to an absolute position in TLS transcript considering chunked encoding
 * @param pos
 * @param bodyStartIdx
 * @param chunks
 */
export declare function convertResponsePosToAbsolutePos(pos: number, bodyStartIdx: number, chunks?: ArraySlice[]): number;
export declare function parseHttpResponse(buff: Uint8Array): {
    statusCode: number;
    statusMessage: string;
    headers: import("http").IncomingHttpHeaders;
    body: Uint8Array;
    headersComplete: boolean;
    complete: boolean;
    statusLineEndIndex?: number;
    bodyStartIndex?: number;
    chunks?: ArraySlice[];
    headerIndices: Map<string, ArraySlice>;
};
export declare function makeRegex(str: string): any;
/**
 * Try to match strings that contain templates like {{param}}
 * against redacted string that has *** instead of that param
 */
export declare function matchRedactedStrings(templateString: Uint8Array, redactedString?: Uint8Array): boolean;
export {};
