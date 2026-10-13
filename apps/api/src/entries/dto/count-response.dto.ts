/* The answer to GET /entries/count: how many entries match the filters. */
export class CountResponseDto {
  count: number;

  constructor(count: number) {
    this.count = count;
  }
}
