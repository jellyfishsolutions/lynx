export default interface Migration {
    up(): Promise<void>;
    down(): Promise<void>;
}
