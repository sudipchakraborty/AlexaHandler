import express from "express";
import https from "https";
import fs from "fs";
import Alexa, { SkillBuilders } from "ask-sdk-core";
import morgan from "morgan";
import ESP32Command from "./esp32Command.js";

const esp32 = new ESP32Command();
const app = express();
app.use(morgan("dev"));
app.use(express.json());

const PORT = process.env.PORT || 8443; // Use 443 for public HTTPS

// Load SSL Certificates
const options = {
    // key: fs.readFileSync("server.key"),
    // cert: fs.readFileSync("server.cert")
    key: fs.readFileSync("alexa-key.pem"),
    cert: fs.readFileSync("alexa-cert.pem")
};

// Launch Request Handler
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest";
    },
    handle(handlerInput) {
        const speakOutput = "Welcome to My House";
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .withSimpleCard("Welcome", speakOutput)
            .getResponse();
    }
};

// Intent Handler
const DoorCommandIntentHandler = {
    canHandle(handlerInput) {
        return (
            Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === "myHouseIntent"
        );
    },
    async handle(handlerInput) {
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        const firstCmd = slots.FirstCmd?.value || "";
        const secondCmd = slots.SecondCmd?.value || "";
        const thirdCmd = slots.ThirdCmd?.value || "";
        const fourthCmd = slots.FourthCmd?.value || "";
        const result = await esp32.sendCommand(firstCmd, secondCmd, thirdCmd, fourthCmd);
        return handlerInput.responseBuilder
            .speak(result.message)
            .reprompt("Do you need anything else?")
            .getResponse();
    }
};

// Error Handler
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.error(`Error handled: ${error.message}`);
        return handlerInput.responseBuilder
            .speak("Sorry, I had trouble doing what you asked. Please try again.")
            .reprompt("Please try again.")
            .getResponse();
    }
};

// Skill Builder
const skill = SkillBuilders.custom()
    .addRequestHandlers(LaunchRequestHandler, DoorCommandIntentHandler)
    .addErrorHandlers(ErrorHandler)
    .create();

// Alexa Webhook Endpoint
app.post("/api/v1/webhook-alexa", async (req, res) => {
    console.log("🔹 Received Alexa Request:", JSON.stringify(req.body, null, 2));
    res.setHeader("Content-Type", "application/json");

    try {
        const response = await skill.invoke(req.body);
        res.status(200).json(response);
    } catch (error) {
        console.error("Error processing Alexa request:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Start HTTPS Server
https.createServer(options, app).listen(PORT, () => {
    console.log(`✅ HTTPS Server running on https://localhost:${PORT}`);
});
