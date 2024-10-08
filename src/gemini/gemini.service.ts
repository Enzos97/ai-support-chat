import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private chat: any;

  constructor() {
    // Inicializar el SDK con la API Key de Google Generative AI
    this.genAI = new GoogleGenerativeAI(process.env.API_KEY);
  }

  private async startChat(): Promise<void> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    this.chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'Hola, ¿en qué puedo ayudarte hoy?' }],
        },
        {
          role: 'model',
          parts: [{ text: 'Hola, estoy aquí para asistirte. ¿Cómo puedo ayudarte?' }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 500,
      },
    });
  }

  // Enviar un mensaje al chat y obtener la respuesta
  async sendMessage(msg: string): Promise<string> {
    if (!this.chat) {
      await this.startChat(); // Inicializa el chat si aún no ha sido creado
    }

    const result = await this.chat.sendMessage(msg);
    const response = await result.response.text();
    console.log('Respuesta de Gemini:', response);
    return response; // Devuelve la respuesta del chat
  }

  // Enviar un mensaje usando streaming para respuestas parciales
  async sendMessageStream(msg: string): Promise<string> {
    if (!this.chat) {
      await this.startChat(); // Inicializa el chat si aún no ha sido creado
    }

    const result = await this.chat.sendMessageStream(msg);

    let fullResponse = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      console.log(chunkText);
      fullResponse += chunkText;
    }

    return fullResponse; // Devuelve la respuesta completa del streaming
  }

}
