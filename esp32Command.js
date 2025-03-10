import fetch from "node-fetch";
//__________________________________________________________________________________________________________________________
/**
 * @brief  
 * @param  
 * @param  
 * @return 
 * @note   
 */
class ESP32Command 
{
    async sendCommand(firstCmd, secondCmd, thirdCmd, fourthCmd) 
    {
        firstCmd = firstCmd.toLowerCase();
        secondCmd = secondCmd.toLowerCase();
        thirdCmd = thirdCmd.toLowerCase();
        fourthCmd = fourthCmd.toLowerCase();

        console.log(`🔹 Command Received: ${firstCmd}, ${secondCmd}, ${thirdCmd}, ${fourthCmd}`);

        let resp;
        if (firstCmd === "gate") 
        {
          resp=Process_Gate_Command(secondCmd,thirdCmd,fourthCmd);        
        }     
        return { success: true, message:  resp };       
    }
}
//__________________________________________________________________________________________________________________________
/**
 * @brief  Gate command Processor
 * @param  firstCmd =alexa first word
 * @param  secondCmd =alexa second word
 * @param  thirdCmd =alexa third word
 * @param  fourthCmd =alexa fourth word
 * @return message from device
 * @note
 */
 function Process_Gate_Command(secondCmd, thirdCmd, fourthCmd)
{
    const IP_Gate = "192.168.0.100";
    let url;
    let msg;

    if (secondCmd === "open") 
    {
        url = `http://${IP_Gate}/open`;
        msg="ok";
    } 
    else if (secondCmd === "close") 
    {
        url = `http://${IP_Gate}/close`;       
        msg="ok";
    } 
    else 
    {
        msg= "Invalid Command";
    }  
    Send_To_Device(url);      
    return msg;
}
//__________________________________________________________________________________________________________________________
/**
 * @brief  send request to the device
 * @param  url
 * @param  
 * @return true or false
 * @note
 */
async function Send_To_Device(url)
{
    try 
    {
        const response = await fetch(url);
        return {success: true, message: response};
    } catch (error) 
    {
        return { success: false, message: "Failed to send command to ESP32" };
    }
}
//__________________________________________________________________________________________________________________________
// Export module
export default ESP32Command;
