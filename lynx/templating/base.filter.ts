/**
 * Base class for any filtering class.
 * Each filter class will be automatically instantiated once.
 */
export default abstract class BaseFilter {
    /**
     * This method will be executed when the filter shell be applied.
     * It shell return the formatted string.
     * @param data the data that shall be filtered
     * @param args additional arguments that are passed to the filter function in the template
     */
    abstract filter(data: any, ...args: any[]): string;
}
