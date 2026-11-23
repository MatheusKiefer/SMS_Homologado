
/* ========================================
   SERVIDOR - SMS HOMOLOGADO
   INTEGRAÇÃO ONE360
======================================== */

require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();

const PORT = Number(process.env.PORT) || 3000;

const ONE360_BASE_URL = process.env.ONE360_BASE_URL;
const ONE360_API_KEY = process.env.ONE360_API_KEY;

const QUEUE_ID = Number(process.env.ONE360_QUEUE_ID);
const PIPELINE_ID = Number(process.env.ONE360_PIPELINE_ID);
const STAGE_ID = Number(process.env.ONE360_STAGE_ID);
const RESPONSIBLE_ID = Number(
    process.env.ONE360_RESPONSIBLE_ID
);

/* ========================================
   CONFIGURAÇÕES
======================================== */

app.disable("x-powered-by");

app.use(express.json({
    limit: "16kb"
}));

/* ========================================
   ARQUIVOS DA LANDING PAGE
======================================== */

app.use(
    "/css",
    express.static(path.join(__dirname, "css"))
);

app.use(
    "/js",
    express.static(path.join(__dirname, "js"))
);

app.use(
    "/img",
    express.static(path.join(__dirname, "img"))
);

/* ========================================
   PÁGINA PRINCIPAL
======================================== */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});

/* ========================================
   VERIFICAÇÃO DO SERVIDOR
======================================== */

app.get("/api/health", (req, res) => {

    res.json({
        status: "online",
        projeto: "SMS Homologado",
        mensagem: "Servidor funcionando!"
    });

});

/* ========================================
   FUNÇÕES DE VALIDAÇÃO
======================================== */

function normalizarTelefone(valor) {

    let telefone = String(valor ?? "")
        .replace(/\D/g, "");

    // Remove DDI, caso já tenha sido enviado
    if (
        telefone.startsWith("55") &&
        [12, 13].includes(telefone.length)
    ) {
        telefone = telefone.slice(2);
    }

    // DDD + número brasileiro
    if (
        !/^[1-9]{2}\d{8,9}$/.test(telefone)
    ) {
        return null;
    }

    return `+55${telefone}`;
}

function configuracaoValida() {

    return Boolean(
        ONE360_BASE_URL &&
        ONE360_API_KEY &&
        [QUEUE_ID, PIPELINE_ID, STAGE_ID, RESPONSIBLE_ID]
            .every(id => Number.isInteger(id) && id > 0)
    );

}

/* ========================================
   CRIAR OPORTUNIDADE NA ONE360
======================================== */

app.post("/api/leads", async (req, res) => {

    const body = req.body;

    if (!body || typeof body !== "object" ||
        Array.isArray(body)) {

        return res.status(400).json({
            success: false,
            message: "Dados inválidos."
        });

    }

    const {
        name,
        phone,
        email,
        credit
    } = body;

    const nome = typeof name === "string"
        ? name.trim()
        : "";

    const emailCliente = typeof email === "string"
        ? email.trim()
        : "";

    const credito = typeof credit === "string"
        ? credit.trim()
        : "";

    const telefone = normalizarTelefone(phone);

    // Validação dos campos
    if (
        nome.length < 2 ||
        nome.length > 100 ||
        !telefone ||
        emailCliente.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailCliente) ||
        credito.length > 50
    ) {

        return res.status(400).json({
            success: false,
            message: "Confira os dados do formulário."
        });

    }

    // Verificar configurações da API
    if (!configuracaoValida()) {

        console.error(
            "Configuração da One360 incompleta."
        );

        return res.status(503).json({
            success: false,
            message: "Integração indisponível."
        });

    }

    // Montar a oportunidade
    const oportunidade = {

        queueId: QUEUE_ID,
        apiKey: ONE360_API_KEY,

        fkPipeline: PIPELINE_ID,
        fkStage: STAGE_ID,
        responsableid: RESPONSIBLE_ID,

        title: `Lead - ${nome}`,

        mainphone: telefone,
        mainmail: emailCliente,

        description: [
            "Origem: Landing Page SMS Homologado",
            `Nome: ${nome}`,
            `Interesse em créditos: ${credito || "Não informado"}`
        ].join("\n")

    };

    try {

        const url = new URL(
            "/int/createOpportunity",
            ONE360_BASE_URL
        );

        if (url.protocol !== "https:") {
            throw new Error("URL da API sem HTTPS.");
        }

        const resposta = await fetch(url, {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },

            body: JSON.stringify(oportunidade),

            signal: AbortSignal.timeout(15000)

        });

        const resultado = await resposta.json()
            .catch(() => null);

        if (!resposta.ok) {

            console.error(
                "Erro da One360. HTTP:",
                resposta.status,
                "Código:",
                resultado?.errorCode || "Não informado"
            );

            return res.status(502).json({
                success: false,
                message: "Não foi possível registrar a oportunidade."
            });

        }

        if (!Number.isInteger(resultado?.id) ||
            resultado.id <= 0) {

            console.error(
                "Resposta inesperada da One360."
            );

            return res.status(502).json({
                success: false,
                message: "Não foi possível confirmar o cadastro."
            });

        }

        console.log(
            "Oportunidade criada. ID:",
            resultado.id
        );

        return res.status(201).json({
            success: true,
            message: "Oportunidade criada com sucesso!",
            opportunityId: resultado.id
        });

    } catch (erro) {

        console.error(
            "Falha na integração One360:",
            erro.name
        );

        return res.status(502).json({
            success: false,
            message: "Falha temporária na integração."
        });

    }

});

/* ========================================
   INICIAR SERVIDOR LOCAL
======================================== */

app.listen(PORT, "127.0.0.1", () => {

    console.log("==============================");
    console.log(" SMS HOMOLOGADO - API LOCAL");
    console.log("==============================");
    console.log(`Servidor: http://localhost:${PORT}`);
    console.log("Status: Online");

});
