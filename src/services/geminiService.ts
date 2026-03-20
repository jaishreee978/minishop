import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const getShoppingAssistantResponse = async (userMessage: string, products: any[]) => {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are "MiniShop Pro AI", a premium shopping assistant.
    You help users find products, answer questions about them, and provide shopping advice.
    
    Current Products in Store:
    ${JSON.stringify(products.map(p => ({ id: p.id, name: p.name, price: p.price, category: p.category })), null, 2)}
    
    Guidelines:
    - Be professional, helpful, and concise.
    - If a user asks for a recommendation, suggest products from the list above.
    - If they ask about something not in the list, politely mention we don't have it but suggest the closest alternative.
    - Use Markdown for formatting.
    - You can also help with "Visual Search" if the user provides an image (handled separately, but be aware of it).
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: userMessage,
      config: {
        systemInstruction,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm sorry, I'm having trouble connecting to my AI brain right now. Please try again later!";
  }
};

export const identifyProductFromImage = async (base64Image: string, products: any[]) => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Identify the product in this image. 
    Then, find the most similar products from our store catalog:
    ${JSON.stringify(products.map(p => ({ id: p.id, name: p.name, category: p.category })), null, 2)}
    
    Return the response as a JSON object with:
    {
      "identification": "string describing the image",
      "recommendedProductIds": [number, number, ...] (up to 3 IDs from our catalog)
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            identification: { type: Type.STRING },
            recommendedProductIds: { 
              type: Type.ARRAY, 
              items: { type: Type.INTEGER } 
            }
          },
          required: ["identification", "recommendedProductIds"]
        }
      }
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Image Error:", error);
    return null;
  }
};
