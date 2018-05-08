import Response from "./response";
import { Request as ERequest, Response as EResponse } from "express";

/**
 * Generation of a skip response.
 */
export default class SkipResponse extends Response {
    performResponse(_: ERequest, __: EResponse) {}
}
