import { Paddle, Environment } from "@paddle/paddle-node-sdk";

const paddle = new Paddle("test", { environment: Environment.sandbox });
console.log("Keys:", Object.keys(paddle));
