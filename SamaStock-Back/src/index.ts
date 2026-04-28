import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import stockRoutes from "./routes/stock.routes";
import saleRoutes from "./routes/sale.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import clientRoutes from "./routes/client.routes";



const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Bienvenue sur le backend de SamaStock" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/stock", stockRoutes);
console.log("MOUTING /api/sales")
app.use("/api/sales", saleRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Route non trouvée: ${req.originalUrl}` });
});

app.listen(PORT, () => {
  console.log(`SamaStock backend running on http://localhost:${PORT}`);
});