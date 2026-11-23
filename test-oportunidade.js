
/* ========================================
   TESTE - CRIAR OPORTUNIDADE ONE360
======================================== */

require("dotenv").config();

const BASE_URL = process.env.ONE360_BASE_URL;
const API_KEY = process.env.ONE360_API_KEY;

const QUEUE_ID = Number(process.env.ONE360_QUEUE_ID);
const PIPELINE_ID = Number(process.env.ONE360_PIPELINE_ID);
const STAGE_ID = Number(process.env.ONE360_STAGE_ID);
const RESPONSIBLE_ID = Number(process.env.ONE360_RESPONSIBLE_ID);

async function criarOportunidadeTeste() {

    if (
        !BASE_URL ||
        !API_KEY ||
        [QUEUE_ID, PIPELINE_ID, STAGE_ID, RESPONSIBLE_ID]
            .some(id => !Number.isInteger(id) || id <= 0)
    ) {
        console.error("Confira as configurações do .env");
        return;
    }

    const dados = {
        queueId: QUEUE_ID,
        apiKey: API_KEY,

        fkPipeline: PIPELINE_ID,
        fkStage: STAGE_ID,
        responsableid: RESPONSIBLE_ID,

        title: "TESTE - Landing Page SMS Homologado",

        description:
            "Oportunidade de teste criada pela integração Node.js. " +
            "Sem contato associado."
    };

    try {

        const url = new URL(
            "/int/createOpportunity",
            BASE_URL
        );

        if (url.protocol !== "https:") {
            throw new Error("A API deve utilizar HTTPS.");
        }

        const resposta = await fetch(url, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },

            body: JSON.stringify(dados),

            signal: AbortSignal.timeout(15000)
        });

        const resultado = await resposta.json()
            .catch(() => null);

        if (!resposta.ok) {
            console.error(
                "Erro ao criar oportunidade. HTTP:",
                resposta.status
            );

            console.error(
                "Código:",
                resultado?.errorCode || "Não informado"
            );

            return;
        }

        console.log("Oportunidade criada com sucesso!");
        console.log("ID da oportunidade:", resultado?.id);
        console.log("Funil:", PIPELINE_ID);
        console.log("Etapa:", STAGE_ID);
        console.log("Responsável:", RESPONSIBLE_ID);

    } catch (erro) {
        console.error(
            "Falha na comunicação:",
            erro.message
        );
    }
}

criarOportunidadeTeste();
