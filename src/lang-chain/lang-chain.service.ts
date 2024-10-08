import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Document, DocumentInterface } from '@langchain/core/documents';
import * as fs from 'fs';
import * as path from 'path';
import { VectorStoreRetriever } from '@langchain/core/vectorstores';
import { RunnableSequence } from '@langchain/core/runnables';

@Injectable()
export class LangChainService {
  private chatHistory: string[] = [];
  async loadAndProcessDocuments() {
    try {

      //const filePath = path.join(process.cwd(), 'data/data.json'); 
      const filePath = path.join(process.cwd(), 'data', 'data.json');
      const rawData = fs.readFileSync(filePath, 'utf-8');
      const docsData = JSON.parse(rawData);

      // Read and log the content of the file
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading file:', err);
          return;
        }
        console.log('File content:', data);
      });

      const processedDocs = docsData.map(item => {
        const vehicle = item.eprezto_vehiculos_dt;
        const policy = item.selected_policy;
        const paymentLogs = item.payments.eprezto_vehiculos_dt.payments_logs[0];
    
        // Crear el contenido para las embeddings
        const pageContent = `
          Email: ${item.user_email}
          Nombre: ${vehicle.nombre} ${vehicle.apellido}
          Placa: ${vehicle.Placa}
          Compañía: ${policy.Compañía}
          Precio: ${policy.Precio}
          policy_id: ${policy._id}
          Estado del pago: ${paymentLogs ? paymentLogs.customer_to_moveo_payment_status : 'No disponible'}
        `.trim(); 

        return new Document({
          pageContent,
          metadata: {
            _id: item._id,
            user_email: item.user_email,
            selected_policy: policy,
            eprezto_vehiculos_dt: vehicle,
            paymentStatus: paymentLogs ? paymentLogs.customer_to_moveo_payment_status : null,
          },
        });
      });


      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 5000,
        chunkOverlap: 100, 
      });

      const splits = await textSplitter.splitDocuments(processedDocs);
      
      // Crear una tienda de vectores en memoria con embeddings de OpenAI
      const vectorStore = await MemoryVectorStore.fromDocuments(
        splits,
        new OpenAIEmbeddings()
      );

      // Crear un recuperador (retriever) para obtener fragmentos relevantes
      const retriever = vectorStore.asRetriever();
      return retriever;
    } catch (error) {
      console.error('Error en loadAndProcessDocuments:', error);
      throw new BadRequestException('Error al cargar y procesar documentos'); // Lanza un error para que el llamador lo maneje
    }
  }
  // async loadAndProcessDocuments() {
  //   // Cargar documentos de un directorio con varios tipos de archivos
  //   const loader = new DirectoryLoader('data', {
  //     '.json': (path) => new JSONLoader(path, ''),
  //   });

  //   const docs = await loader.load(); // Cargar todos los documentos
  //   console.log("data",docs);

  //   // Fragmentar menos agresivamente
  //   const textSplitter = new RecursiveCharacterTextSplitter({
  //     chunkSize: 5000, // Aumentar el tamaño de fragmento
  //     chunkOverlap: 100, // Reducir el solapamiento
  //   });

  //   const splits = await textSplitter.splitDocuments(docs);
    
  //   // Crear una tienda de vectores en memoria con embeddings de OpenAI
  //   const vectorStore = await MemoryVectorStore.fromDocuments(
  //     splits,
  //     new OpenAIEmbeddings()
  //   );

    
  //   // Crear un recuperador (retriever) para obtener fragmentos relevantes
  //   const retriever = vectorStore.asRetriever();

  //   return retriever;
  // }
  // Generar respuestas usando el nuevo prompt personalizado
  async generateAnswer(query: string) {
    let retriever: VectorStoreRetriever<MemoryVectorStore>;
    try {
      retriever = await this.loadAndProcessDocuments();
      console.log("retriever", retriever);
    } catch (error) {
      console.error('Error al cargar el recuperador:', error);
      throw new BadRequestException('Error al cargar el recuperador'); 
    }
    console.log("retriever",retriever);

    this.chatHistory.push(`Agente de Soporte (Humano): ${query}`);

    if (this.chatHistory.length > 100) {
      this.chatHistory.shift(); 
    }
    
    let retrievedDocs: DocumentInterface<Record<string, any>>[];
    try {
      // Extraer información de los documentos para personalizar el prompt
      retrievedDocs = await retriever.invoke(query);
      console.log("retrievedDocs", retrievedDocs);
    } catch (error) {
      console.error('Error al recuperar documentos:', error);
      throw new BadRequestException('Error al recuperar documentos'); 
    }

    const customPromptTemplate = ChatPromptTemplate.fromTemplate(`
      You are an assistant helping a human support agent and responding in Spanish. 
      Your task is to provide information about vehicle insurance based on the vehicle plate, customer email, or customer name provided by the support agent.
      
      If the user does not provide relevant information, respond as follows:
      "Hi, how can I help you today? For vehicle insurance information, please provide the vehicle license plate, customer email, or customer name."

      Follow these steps:
      1. If the customer provides a license plate, look up the vehicle details and check the status of the purchase, which is located within the payments_logs.
      2. If the purchase is complete and payment is received, first ask the customer if they would like to proceed with issuing the policy. 
      3. If the customer agrees to issue the policy, provide a link to it in the following format: "https://eprezto.com/policy/policy_id" *ISSUE THE LINK ONLY ONCE.
      4. If the agent provides a license plate but is not asking about the policy, provide additional details like the brand, model, and owner information.
      5. If there is an error in the payment, specifically mention the error and alert the agent to notify the customer to try again.
      
      Conversation History:
      ${this.chatHistory}

      Here is the retrieved information:
      {context}
    
      Respond to the following question:
      {question}
    `);

    let llm = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 });
    let ragChain: RunnableSequence<Record<string, unknown>, string>;
    try {
      ragChain = await createStuffDocumentsChain({
        llm,
        prompt: customPromptTemplate,
        outputParser: new StringOutputParser(),
      });
    } catch (error) {
      throw new BadRequestException('Error al recuperar documentos'); 
    }

    let result: any;

    try {
      // Generar la respuesta final
      result = await ragChain.invoke({
        question: query,
        context: retrievedDocs,
      });
    } catch (error) {
      console.error('Error al generar la respuesta:', error);
      throw new BadGatewayException('Error al generar la respuesta'); 
    }

    // Agregar la respuesta de la IA al historial
    this.chatHistory.push(`Agente LLM: ${result}`);
    console.log(this.chatHistory);
    const cleanedResult = result.replace(/\n\n/g, ' ');

    return {cleanedResult, ragChain, retrievedDocs, retriever};
  }
  clearChatHistory() {
    this.chatHistory = []; 
  }
}
