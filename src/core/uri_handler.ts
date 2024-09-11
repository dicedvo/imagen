export default interface URIHandler {
  id: string;
  test(uri: string): boolean;
  transform(uri: string): string;
  stringify(data: unknown): string;
  handle?(uri: string): Promise<unknown>;
}
