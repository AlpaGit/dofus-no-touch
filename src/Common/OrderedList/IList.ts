export default interface IList {
    add(obj: any): any;
    removeByRef(obj: any): boolean;
    reposition(node: any): void;
    clear(): void;

    count: number;
}