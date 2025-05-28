import Controller from '../interfaces/controller.interface';
import { Request, Response, Router, NextFunction } from 'express';
import { checkIdParam } from "../middlewares/deviceIdParam.middleware";
import DataService from "../modules/services/data.service";
import { config } from '../config';

class DataController implements Controller {
    public path = '/api/data';
    public router = Router();
    private readings: number[] = [4, 5, 6, 3, 5, 3, 7, 5, 13, 5, 6, 4, 3, 6, 3, 6];
    private dataService: DataService;

    constructor() {
        this.dataService = new DataService();
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}/latest`, this.getLatestReadingsFromAllDevices);
        this.router.get(`${this.path}/latest/all`, this.getLatestForAllDevices);
        this.router.post(`${this.path}/:id`, checkIdParam, this.addData);
        this.router.get(`${this.path}/:id`, checkIdParam, this.getAllDeviceData);
        this.router.get(`${this.path}/:id/latest`, checkIdParam, this.getLatestForDevice);
        this.router.get(`${this.path}/:id/:num`, checkIdParam, this.getPeriodData);
        this.router.delete(`${this.path}/all`, this.cleanAllDevices);
        this.router.delete(`${this.path}/:id`, checkIdParam, this.cleanDeviceData);
        this.router.delete(`${this.path}/:id/data`, checkIdParam, this.deleteDeviceData);
    }

    private getLatestReadingsFromAllDevices = async (req: Request, res: Response) => {
        res.status(200).json(this.readings);
    }

    private getAllDeviceData = async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;
        try {
            const allData = await this.dataService.query(id);
            res.status(200).json(allData);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Wystąpił błąd podczas pobierania danych.' });
        }
    };

    private addData = async (req: Request, res: Response, next: NextFunction) => {
        const { air } = req.body;
        const { id } = req.params;

        if (!Array.isArray(air) || air.length < 3) {
            return res.status(400).json({ error: 'Brak lub nieprawidłowy format danych w "air".' });
        }

        const temperature = air.find(a => a.id === 1)?.value;
        const pressure = air.find(a => a.id === 2)?.value;
        const humidity = air.find(a => a.id === 3)?.value;

        if ([temperature, pressure, humidity].some(v => typeof v !== 'number')) {
            return res.status(400).json({ error: 'Invalid input data.' });
        }

        const data = {
            temperature,
            pressure,
            humidity,
            deviceId: id,
            readingDate: new Date()
        };

        try {
            await this.dataService.createData(data);
            res.status(200).json(data);
        } catch (error) {
            console.error(`Validation Error: ${error.message}`);
            res.status(400).json({ error: 'Invalid input data.' });
        }
    };

    private getLatestForDevice = async (req: Request, res: Response) => {
        const deviceId = parseInt(req.params.id, 10);
        if (isNaN(deviceId)) return res.status(400).json({ error: 'Nieprawidłowy ID' });

        try {
            const data = await this.dataService.get(deviceId);
            res.status(200).json(data[0] || {});
        } catch (error) {
            res.status(500).json({ error: 'Błąd podczas pobierania danych' });
        }
    };

    private getLatestForAllDevices = async (req: Request, res: Response) => {
        try {
            const data = await this.dataService.getAllNewest(config.supportedDevicesNum);
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: 'Błąd podczas pobierania danych' });
        }
    };

    private deleteDeviceData = async (req: Request, res: Response) => {
        const deviceId = parseInt(req.params.id, 10);
        if (isNaN(deviceId)) return res.status(400).json({ error: 'Nieprawidłowy ID' });

        try {
            await this.dataService.deleteData(deviceId);
            res.status(200).json({ message: `Usunięto dane dla urządzenia ${deviceId}` });
        } catch (error) {
            res.status(500).json({ error: 'Błąd podczas usuwania danych' });
        }
    };

    private getPeriodData = async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const num = parseInt(req.params.num) || 1;

        if (isNaN(id) || isNaN(num) || id < 0 || id + num > this.readings.length) {
            return res.status(400).json({ message: 'Błędne parametry zakresu' });
        }

        res.status(200).json({ range: this.readings.slice(id, id + num) });
    };

    private cleanAllDevices = async (req: Request, res: Response) => {
        this.readings = [];
        res.status(200).json({ message: 'Wszystkie dane zostały usunięte (z pamięci)' });
    };

    private cleanDeviceData = async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);

        if (isNaN(id) || id < 0 || id >= this.readings.length) {
            return res.status(404).json({ message: 'Nie znaleziono danych do usunięcia' });
        }

        this.readings.splice(id, 1);
        res.status(200).json({ message: `Usunięto dane lokalne dla ID ${id}` });
    };
}

export default DataController;
