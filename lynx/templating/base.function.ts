/**
 * Base class for any function class.
 * Each function class will be automatically instantiated once.
 */
export default abstract class BaseFunction {
    /**
     * Utility function to safe obtain an argument.
     * @param args the arguments array
     * @param index the index of the argument to obtain
     */
    public safeGet(args: any[], index: number) {
        if (!args || index >= args.length) {
            return undefined;
        }
        return args[index];
    }

    /**
     * This method will be executed when the corresponding function needs to be executed.
     * @param args are the arguments passed to the function when executed.
     */
    abstract execute(...args: any[]): any;
}
