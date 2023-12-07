import { IsInt, IsNotEmpty } from 'class-validator';

export class ReserveTimeSlotRequest {
  @IsInt()
  @IsNotEmpty()
  numberOfPeople: number;
}
