import "dotenv/config";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger-config";
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
import supplierRoute from "./routes/supplier.route";
import cashRoute from "./routes/cash.route";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app
  .use(cors())
  .use(express.json())
  .use(helmet())
  .use(morgan("dev"))
  .use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Bienvenue sur le backend de SamaStock" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/suppliers", supplierRoute);
app.use("/api/cash", cashRoute);

app.use((req, res) => {
  res.status(404).json({ message: `Route non trouvée: ${req.originalUrl}` });
});

app.listen(PORT, () => {
  console.log(`SamaStock backend running on http://localhost:${PORT}`);
  console.log(`Swagger API documentation http://localhost:${PORT}/api-docs`);
});
