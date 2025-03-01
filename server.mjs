import express from "express";
import Alexa, { SkillBuilders } from "ask-sdk-core";
import morgan from "morgan";
import { ExpressAdapter } from "ask-sdk-express-adapter";

const app = express();
app.use(morgan("dev"));
app.use(express.json()); // ✅ Ensure JSON parsing

const PORT = process.env.PORT || 8000;

// ✅ Store Door State in Memory
let doorState = "closed"; // Default state

//////////////////////
// Launch Request Handler
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest";
    },
    handle(handlerInput) {
        const speakOutput = "Welcome to Smart Door! You can say 'open the door' or 'close the door' to control it.";
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput) // ✅ Keeps the session active
            .withSimpleCard("Welcome", speakOutput)
            .getResponse();
    }
};

// ✅ Updated Door Open Intent Handler
const DoorOpenIntentHandler = {
    canHandle(handlerInput) {
        return (
            Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === "DoorOpenIntent"
        );
    },
    handle(handlerInput) {
        if (doorState === "open") {
            return handlerInput.responseBuilder
                .speak("The door is already open. Do you want to close it?")
                .reprompt("Do you want to close the door?")
                .getResponse();
        }

        doorState = "open"; // ✅ Store state
        console.log("🚪 Door Open Command Received"); 

        return handlerInput.responseBuilder
            .speak("The door is now open. Do you need anything else?")
            .reprompt("Do you need anything else?") // ✅ Keeps session active
            .getResponse();
    }
};

// ✅ Updated Door Close Intent Handler
const DoorCloseIntentHandler = {
    canHandle(handlerInput) {
        return (
            Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === "DoorCloseIntent"
        );
    },
    handle(handlerInput) {
        if (doorState === "closed") {
            return handlerInput.responseBuilder
                .speak("The door is already closed.")
                .getResponse();
        }

        doorState = "closed"; // ✅ Store state
        console.log("🚪 Door Close Command Received"); 

        return handlerInput.responseBuilder
            .speak("The door is now closed.")
            .getResponse();
    }
};

// Error Handler
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.error(`❌ Error handled: ${error.message}`);
        return handlerInput.responseBuilder
            .speak("Sorry, I had trouble doing what you asked. Please try again.")
            .reprompt("Please try again.")
            .getResponse();
    }
};

// Skill Builder
const skill = SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        DoorOpenIntentHandler,  // ✅ Fixed Open Intent
        DoorCloseIntentHandler  // ✅ Fixed Close Intent
    )
    .addErrorHandlers(ErrorHandler)
    .create();

const adapter = new ExpressAdapter(skill, false, false);

// ✅ FIX: Corrected Webhook Handling
app.post("/api/v1/webhook-alexa", async (req, res) => {
    console.log("🔹 Received Alexa Request:", JSON.stringify(req.body, null, 2));

    res.setHeader("Content-Type", "application/json");

    try {
        const response = await skill.invoke(req.body); // ✅ CORRECT Alexa skill invocation
        console.log("🔹 Alexa Response Sent:", JSON.stringify(response, null, 2));
        res.status(200).json(response);
    } catch (error) {
        console.error("❌ Error processing Alexa request:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Server Start
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
