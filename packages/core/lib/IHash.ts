export interface IHash {
    digest(): Buffer;
    update(data: Buffer): void;
}
