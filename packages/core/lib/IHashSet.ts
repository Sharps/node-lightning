import { IHashable } from "./IHashable";

export interface IHashMap<V extends IHashable> {
    has(key: V): boolean;
    add(key: K, value: V): void;
    remove(key: K): V;
}
