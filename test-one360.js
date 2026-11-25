require("dotenv").config();

const BASE_URL = process.env.ONE360_BASE_URL;
const API_KEY = process.env.ONE360_API_KEY;
const QUEUE_ID = Number(process.env.ONE360_QUEUE_ID);

// Validar configurações
if (!BASE_URL || !API_KEY || !Number.isInteger(QUEUE_ID) || QUEUE_ID <= 0) {
    console.error("ERRO: Verifique as configurações do .env");
    process.exit(1);
}

async function testarConexao() {

    console.log("================================");
    console.log(" TESTE DE CONEXÃO - ONE360");
    console.log("================================");

    try {

        const url = new URL("/int/getQueueStatus", BASE_URL);

        if (url.protocol !== "https:") {
            throw new Error("A URL da API deve utilizar HTTPS.");
        }

        const resposta = await fetch(url, {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },

            body: JSON.stringify({
                queueId: QUEUE_ID,
                apiKey: API_KEY
            }),

            signal: AbortSignal.timeout(15000)

        });

        const dados = await resposta.json().catch(() => null);

        if (!resposta.ok) {

            console.error("Falha na autenticação ou consulta.");
            console.error("HTTP:", resposta.status);

            if (dados?.errorCode) {
                console.error("Código:", dados.errorCode);
            }

            process.exitCode = 1;
            return;
        }

        console.log("Conexão realizada com sucesso!");
        console.log("Fila ID:", QUEUE_ID);
        console.log("Nome:", dados?.name);
        console.log("Habilitada:", dados?.enabled);
        console.log("Conectada:", dados?.connected);
        console.log("Autenticada:", dados?.authenticated);

    } catch (erro) {

        console.error("Erro na conexão.");

        if (erro.name === "TimeoutError") {
            console.error("Tempo limite da requisição excedido.");
        } else {
            console.error(erro.message);
        }

        process.exitCode = 1;

    }

}

testarConexao();
