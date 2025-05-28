import DataModel from '../schemas/data.schema';
import { IData } from "../models/data.model";

class DataService {

    public async createData(dataParams: IData) {
        try {
            const dataModel = new DataModel(dataParams);
            await dataModel.save();
        } catch (error) {
            console.error('Wystąpił błąd podczas tworzenia danych:', error);
            throw new Error('Wystąpił błąd podczas tworzenia danych');
        }
    }

    public async query(deviceId: string) {
        try {
            const data = await DataModel.find({ deviceId: Number(deviceId) }, { __v: 0, _id: 0 });
            return data;
        } catch (error) {
            throw new Error(`Query failed: ${error}`);
        }
    }

    public async get(deviceId: number) {
        try {
            return await DataModel
                .find({ deviceId }, { __v: 0, _id: 0 })
                .limit(1)
                .sort({ $natural: -1 });
        } catch (error) {
            throw new Error(`Błąd podczas próby pobrania ostatnich danych z urządzenia ${deviceId}: ${error}`);
        }
    }

    public async getAllNewest(devicesCount: number) {
        const latestData: any[] = [];

        await Promise.all(
            Array.from({ length: devicesCount }, async (_, i) => {
                try {
                    const latestEntry = await DataModel
                        .find({ deviceId: i }, { __v: 0, _id: 0 })
                        .limit(1)
                        .sort({ $natural: -1 });

                    if (latestEntry.length) {
                        latestData.push(latestEntry[0]);
                    } else {
                        latestData.push({ deviceId: i });
                    }
                } catch (error) {
                    console.error(`Błąd podczas pobierania danych dla urządzenia ${i}: ${error.message}`);
                    latestData.push({});
                }
            })
        );

        return latestData;
    }

    public async deleteData(deviceId: number) {
        try {
            return await DataModel.deleteMany({ deviceId });
        } catch (error) {
            throw new Error(`Failed to delete data for device ${deviceId}: ${error}`);
        }
    }
}

export default DataService;
