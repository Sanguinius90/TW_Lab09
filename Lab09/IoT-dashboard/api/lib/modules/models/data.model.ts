export interface IData {
   temperature: number;
   pressure: number;
   humidity: number;
   deviceId: string;
   readingDate?: Date;
}

export type Query<T> = {
   [key: string]: T;
};