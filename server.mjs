import express from "express";
import Alexa, { SkillBuilders } from "ask-sdk-core";
import morgan from "morgan";
import ESP32Command from "./esp32Command.js";
///////////////////
const esp32 = new ESP32Command();
const app = express();
app.use(morgan("dev"));
app.use(express.json());

const PORT = process.env.PORT || 8000;
//__________________________________________________________________________________________________________________________
/**
 * @brief  Launch request
 * @param   
 * @param   
 * @return Alexa speak "welcome"
 * @note 
 */
const LaunchRequestHandler = 
{
    canHandle(handlerInput) 
    {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest";
    },
    handle(handlerInput) 
    {
        const speakOutput = "Welcome to My House";
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput) // Keeps the session active
            .withSimpleCard("Welcome", speakOutput)
            .getResponse();
    }
};
//__________________________________________________________________________________________________________________________
/**
 * @brief  To trigger the load, request reach here
 * @param   
 * @param   
 * @return Alexa say "OK"
 * @note   This function is main gateway function to activate the connected load
 */
const DoorCommandIntentHandler = 
{
    canHandle(handlerInput) 
    {
        return (
            Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === "myHouseIntent"
        );
    },
    async handle(handlerInput) 
    {
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
//__________________________________________________________________________________________________________________________
/**
 * @brief  If error occured, this function triggers
 * @param  
 * @param    
 * @return  with error text
 * @note   
 */
const ErrorHandler = 
{
    canHandle() 
    {
        return true;
    },
    handle(handlerInput, error) 
    {
        console.error(`Error handled: ${error.message}`);
        return handlerInput.responseBuilder
            .speak("Sorry, I had trouble doing what you asked. Please try again.")
            .reprompt("Please try again.")
            .getResponse();
    }
};
//__________________________________________________________________________________________________________________________
/**
 * @brief  create skill object
 * @param   
 * @param   
 * @return 
 * @note   
 */
// Skill Builder
const skill = SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        DoorCommandIntentHandler
    )
    .addErrorHandlers(ErrorHandler)
    .create();

// const adapter = new ExpressAdapter(skill, false, false);
//__________________________________________________________________________________________________________________________
/**
 * @brief  this function is used to return the response
 * @param  request object
 * @param  response object
 * @return  
 * @note    
 */
app.post("/api/v1/webhook-alexa", async (req, res) => 
{
     console.log("🔹 Received Alexa Request:", JSON.stringify(req.body, null, 2));
    res.setHeader("Content-Type", "application/json");

    try 
    {
        const response = await skill.invoke(req.body);
        // console.log("🔹 Alexa Response Sent:", JSON.stringify(response, null, 2));
        res.status(200).json(response);
    } catch (error) 
    {
        console.error("Error processing Alexa request:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
//__________________________________________________________________________________________________________________________
/**
 * @brief  server starts listening on specific  port
 * @param   
 * @param   
 * @return  
 * @note can change the port number 
 */
// Server Start
app.listen(PORT, () => 
{
    console.log(`Server is running on port ${PORT}`);
});
//__________________________________________________________________________________________________________________________
