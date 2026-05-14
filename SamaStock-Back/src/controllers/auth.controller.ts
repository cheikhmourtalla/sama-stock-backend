import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

const loginController = {
  async login(req: Request, res: Response) {
    // Validate Data entry
    const { email, password } = req.body;
    const token = await AuthService.login(email, password);
    console.log(token);
    return res.status(200).json({ success: true, token, message: "ok" });
  },
};

export default loginController;
