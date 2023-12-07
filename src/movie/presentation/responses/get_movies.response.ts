export interface GetMoviesResponse {
  movies: {
    id: string;
    title: string;
    timeSlotsIds: number[];
  }[];
  nextPage: number;
}
