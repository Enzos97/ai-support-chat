import { IsString } from "class-validator";

export class ContentDto {
    @IsString()
    content:string 
}