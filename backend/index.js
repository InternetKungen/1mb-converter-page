import express from "express";
import dotenv from "dotenv";
import http from "http";
import path from "path";
import uploadRouter from "./routes/upload.js";
import { WebSocketServer } from "ws";

dotenv.config();

const app = express();

app.use(express.json());

app.use("/public", express.static(path.resolve("public")));

app.use("/api/upload", uploadRouter);

// Servera statiska filer från dist-mappen
const distPath = path.resolve("..", "frontend", "dist");
app.use(express.static(distPath));

// Serve index.html på icke-API-vägar för att stödja SPA-routning
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// Skapa HTTP-server
const server = http.createServer(app);

// Starta servern
server.listen(process.env.PORT, async () => {
  try {
    console.log("Server started at", process.env.PORT);
  } catch (error) {
    console.error("Server failed to start");
    process.exit(1);
  }
});

// Skapa WebSocket-server
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("Ny WebSocket-anslutning");

  ws.on("message", (message) => {
    console.log("Mottaget meddelande:", message.toString());
  });

  ws.on("close", () => {
    console.log("WebSocket-anslutning stängd");
  });
});

export { wss };
