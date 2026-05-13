import { Request, Response } from "express";

export const supplierController = {

    async createFournisseur ( req : Request , res :Response) {
        return res.status(201).json('i am here')
    }
};
