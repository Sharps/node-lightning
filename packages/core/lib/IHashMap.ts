import { IHashable } from "./IHashable";

export interface IHashMap<K extends IHashable, V> {
    has(key: K): boolean;
    set(key: K, value: V): void;
    get(key: K): V;
}
